"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

function convertDecimalsToNumbers(data: any): any {
    const jsonString = JSON.stringify(data, (_, value) => {
        if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
            return parseFloat(value.toString());
        }
        return value;
    });
    return JSON.parse(jsonString);
}

export async function parseColisageExcelFile(formData: FormData, dossierId?: number) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "Aucun fichier fourni" };

        let clientId = parseInt(session.user.id);
        if (dossierId) {
            const dossier = await prisma.tDossiers.findUnique({
                where: { id: dossierId },
                select: { client: true }
            });
            if (dossier) clientId = dossier.client;
        }

        const buffer = await file.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!worksheet) return { success: false, error: "Aucune feuille trouvée dans le fichier" };

        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
        if (rows.length === 0) return { success: false, error: "Le fichier est vide" };

        const parsedRows = rows.map((row, index) => {
            const hsCodeValue = row["HS_Code"] ?? row["HS Code"] ?? row["Code HS"];
            let hscode = null;
            if (hsCodeValue !== undefined && hsCodeValue !== null && hsCodeValue !== "") {
                hscode = hsCodeValue;
            }

            return {
                _rowIndex: index + 2,
                rowKey: (row["Row_Key"] ?? row["Row Key"] ?? row["rowKey"] ?? "").toString().trim(),
                hscode,
                description: String(row["Descr"] ?? row["Description"] ?? row["Description Colis"] ?? "").trim(),
                numeroCommande: String(row["Command_No"] ?? row["No Commande"] ?? row["Numéro Commande"] ?? "").trim(),
                nomFournisseur: String(row["Supplier_Name"] ?? row["Nom Fournisseur"] ?? row["Fournisseur"] ?? "").trim(),
                numeroFacture: String(row["Invoice_No"] ?? row["No Facture"] ?? row["Numéro Facture"] ?? "").trim(),
                itemNo: String(row["Item_No"] ?? row["Item No"] ?? row["Numéro Ligne"] ?? "").trim(),
                devise: (row["Currency"] ?? row["Devise"] ?? row["Code Devise"] ?? "").toString().trim(),
                quantite: parseFloat(row["Qty"] ?? row["Quantité"] ?? row["Qte Colis"]) || 1,
                prixUnitaireColis: parseFloat(row["Unit_Prize"] ?? row["Prix Unitaire"] ?? row["Prix Unitaire Facture"]) || 0,
                poidsBrut: parseFloat(row["Gross_Weight"] ?? row["Poids Brut"]) || 0,
                poidsNet: parseFloat(row["Net_Weight"] ?? row["Poids Net"]) || 0,
                volume: parseFloat(row["Volume"]) || 0,
                paysOrigine: (row["Country_Origin"] ?? row["Pays Origine"] ?? row["Code Pays"] ?? "").toString().trim(),
                regimeCode: row["Regime_Code"] ?? row["Régime Code"] ?? row["Code Régime"] ?? "",
                regimeRatio: (() => {
                    const value = row["Regime_Ratio"] ?? row["Régime Ratio"] ?? row["Ratio Régime"];
                    if (value === undefined || value === null || value === '') return null;
                    const parsed = parseFloat(value);
                    return isNaN(parsed) ? null : parsed;
                })(),
                regroupementClient: row["Customer_Grouping"] ?? row["Regroupement Client"] ?? "",
            };
        });

        const missingValues = await validateAndDetectMissing(parsedRows, clientId, dossierId);

        return {
            success: true,
            data: {
                rows: parsedRows,
                total: parsedRows.length,
                missingValues,
                clientId,
            },
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors du parsing" };
    }
}

async function validateAndDetectMissing(rows: any[], clientId: number, dossierId?: number) {
    const missingDevises: string[] = [];
    const missingPays: string[] = [];
    const missingHscodes: string[] = [];
    const missingRegimes: Array<{ code: string; ratio: number }> = [];
    const unassociatedRegimes: Array<{ code: string; ratio: number; libelle: string }> = [];

    const distinctDevises = [...new Set(rows.map(r => r.devise).filter(Boolean))];
    const distinctPays = [...new Set(rows.map(r => r.paysOrigine).filter(Boolean))];
    const distinctHscodes = [...new Set(
        rows.map(r => r.hscode).filter(h => h !== null && h !== undefined).map(h => String(h))
    )];

    if (distinctDevises.length > 0) {
        const foundDevises = await prisma.tDevises.findMany({
            where: { codeDevise: { in: distinctDevises }, deviseInactive: false },
            select: { codeDevise: true }
        });
        const foundSet = new Set(foundDevises.map(d => d.codeDevise));
        missingDevises.push(...distinctDevises.filter(d => !foundSet.has(d)));
    }

    if (distinctPays.length > 0) {
        const foundPays = await prisma.tPays.findMany({
            where: { codePays: { in: distinctPays } },
            select: { codePays: true }
        });
        const foundSet = new Set(foundPays.map(p => p.codePays));
        missingPays.push(...distinctPays.filter(p => !foundSet.has(p)));
    }

    if (distinctHscodes.length > 0) {
        let targetEntiteId = 0;
        if (dossierId) {
            const dossier = await prisma.tDossiers.findUnique({
                where: { id: dossierId },
                include: { tBranches: { select: { entite: true } } }
            });
            if (dossier?.tBranches?.entite) targetEntiteId = dossier.tBranches.entite;
        }

        const foundHscodes = await prisma.tHSCodes.findMany({
            where: {
                OR: [
                    { hsCode: { in: distinctHscodes }, entite: targetEntiteId },
                    { id: 0 }
                ]
            },
            select: { id: true, hsCode: true, entite: true }
        });

        const foundSet = new Set(
            foundHscodes
                .filter(h => h.entite === targetEntiteId || h.id === 0)
                .map(h => h.hsCode)
        );
        missingHscodes.push(...distinctHscodes.filter(h => !foundSet.has(h)));
    }

    // Régimes : travailler sur les ratios distincts non-null
    const rowsWithRegime = rows.filter(r => r.regimeRatio !== null && r.regimeRatio !== undefined);
    if (rowsWithRegime.length > 0) {
        // Dédupliquer par ratio normalisé à 4 décimales
        const seenRatios = new Map<string, { code: string; ratio: number }>();
        for (const row of rowsWithRegime) {
            const ratio = typeof row.regimeRatio === 'string' ? parseFloat(row.regimeRatio) : row.regimeRatio as number;
            const key = ratio.toFixed(4);
            if (!seenRatios.has(key)) {
                seenRatios.set(key, { code: row.regimeCode || '', ratio });
            }
        }

        const clientRegimeAssociations = await prisma.tRegimesClients.findMany({
            where: { client: clientId },
            include: {
                tRegimesDeclarations: {
                    select: { id: true, libelleRegimeDeclaration: true, tauxRegime: true }
                }
            }
        });

        const availableRegimeTaux = new Set(
            clientRegimeAssociations
                .filter(assoc => assoc.tRegimesDeclarations)
                .map(assoc => parseFloat(assoc.tRegimesDeclarations!.tauxRegime.toString()).toFixed(4))
        );

        for (const [key, { code, ratio }] of seenRatios) {
            if (availableRegimeTaux.has(key)) continue;

            const libelle = ratioToLibelle(ratio, code);

            const regimeExists = await prisma.tRegimesDeclarations.findFirst({
                where: {
                    OR: [
                        { libelleRegimeDeclaration: libelle },
                        { libelleRegimeDeclaration: `${code} ${libelle}` },
                        { tauxRegime: ratio },
                    ]
                }
            });

            if (regimeExists) {
                unassociatedRegimes.push({ code, ratio, libelle: regimeExists.libelleRegimeDeclaration });
            } else {
                missingRegimes.push({ code, ratio });
            }
        }
    }

    return {
        devises: missingDevises,
        pays: missingPays,
        hscodes: missingHscodes,
        regimes: missingRegimes,
        unassociatedRegimes,
    };
}

function ratioToLibelle(ratio: number, code: string): string {
    if (ratio === -2) return 'TTC';
    if (ratio === -1) return '100% TR';
    if (ratio === 0) return 'EXO';
    if (ratio === 1) return '100% DC';
    if (ratio > 0 && ratio < 1) {
        const dcPercent = Math.round(ratio * 100 * 100) / 100;
        const trPercent = Math.round((100 - dcPercent) * 100) / 100;
        return `${trPercent.toFixed(2)}% TR et ${dcPercent.toFixed(2)}% DC`;
    }
    return `Régime ${ratio}`;
}

export async function checkExistingRowKeys(dossierId: number, rowKeys: string[]) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const existingColisages = await prisma.tColisageDossiers.findMany({
            where: {
                dossier: dossierId,
                uploadKey: { in: rowKeys.filter(Boolean) },
            },
            select: { id: true, uploadKey: true, descriptionColis: true },
        });

        return { success: true, data: existingColisages };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la vérification" };
    }
}

export async function importSelectedColisages(
    dossierId: number,
    rows: any[],
    updateExisting: boolean = false
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const createdColisages: any[] = [];
        const errors: Array<{ row: number; rowKey?: string; error: string }> = [];

        try {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    try {
                        const hsCode = row.hscode !== null && row.hscode !== undefined ? String(row.hscode) : '0';
                        const regimeRatio = row.regimeRatio !== undefined && row.regimeRatio !== null && !isNaN(row.regimeRatio)
                            ? (typeof row.regimeRatio === 'string' ? parseFloat(row.regimeRatio) : row.regimeRatio)
                            : 0;
                        const regimeCode = row.regimeCode || '';

                        const query = `
                            EXEC [dbo].[pSP_AjouterColisageDossier] 
                                @Id_Dossier = ${dossierId},
                                @Upload_Key = N'${(row.rowKey || '').replace(/'/g, "''")}',
                                @HS_Code = N'${hsCode}',
                                @Descr = N'${(row.description || '').replace(/'/g, "''")}',
                                @Command_No = N'${(row.numeroCommande || '').replace(/'/g, "''")}',
                                @Supplier_Name = N'${(row.nomFournisseur || '').replace(/'/g, "''")}',
                                @Invoice_No = N'${(row.numeroFacture || '').replace(/'/g, "''")}',
                                @Item_No = N'${(row.itemNo || '').replace(/'/g, "''")}',
                                @Currency = N'${row.devise}',
                                @Qty = ${row.quantite || 1},
                                @Unit_Prize = ${row.prixUnitaireColis || 0},
                                @Gross_Weight = ${row.poidsBrut || 0},
                                @Net_Weight = ${row.poidsNet || 0},
                                @Volume = ${row.volume || 0},
                                @Country_Origin = N'${String(row.paysOrigine || '').replace(/'/g, "''")}',
                                @Regime_Code = N'${regimeCode}',
                                @Regime_Ratio = ${regimeRatio},
                                @Customer_Grouping = N'${String(row.regroupementClient || '').replace(/'/g, "''")}',
                                @Session = ${parseInt(session.user.id)}
                        `;

                        await tx.$executeRawUnsafe(query);
                        createdColisages.push({ rowKey: row.rowKey, description: row.description, processed: true });
                    } catch (error: any) {
                        let errorMessage = error.message || "Erreur lors du traitement";

                        if (errorMessage.includes("CURRENCY") && errorMessage.includes("NOT EXIST")) {
                            errorMessage = `Devise "${row.devise}" non trouvée`;
                        } else if (errorMessage.includes("COUNTRY CODE") && errorMessage.includes("NOT EXIST")) {
                            errorMessage = `Pays "${row.paysOrigine}" non trouvé`;
                        } else if (errorMessage.includes("HS CODE") && errorMessage.includes("NOT EXIST")) {
                            errorMessage = `Code HS "${row.hscode}" non trouvé`;
                        } else if (errorMessage.includes("REGIME") && errorMessage.includes("NOT EXIST")) {
                            errorMessage = `Régime "${row.regimeCode}" avec taux ${row.regimeRatio}% non trouvé pour ce client`;
                        } else if (errorMessage.includes("FILE ID") && errorMessage.includes("NOT EXIST")) {
                            errorMessage = `Dossier ${dossierId} non trouvé`;
                        } else if (errorMessage.includes("duplicate key") || errorMessage.includes("UN_TColisageDossiers")) {
                            errorMessage = `Colisage déjà existant avec la même combinaison : N° Facture "${row.numeroFacture}", Fournisseur "${row.nomFournisseur}", Item N° "${row.itemNo}", N° Commande "${row.numeroCommande}"`;
                        } else if (errorMessage.includes("UQ_TColisageDossiers$UploadKey")) {
                            errorMessage = `Row Key "${row.rowKey}" déjà utilisé dans ce dossier`;
                        }

                        errors.push({ row: i + 1, rowKey: row.rowKey, error: errorMessage });
                    }
                }
            }, { maxWait: 60000, timeout: 120000 });

            revalidatePath(`/dossiers/${dossierId}`);
            revalidatePath("/colisage");

            return {
                success: true,
                data: {
                    created: createdColisages.length,
                    updated: 0,
                    total: rows.length,
                    errors: errors.length > 0 ? errors : undefined,
                },
            };
        } catch (transactionError: any) {
            return {
                success: false,
                error: `Importation annulée : ${transactionError.message}`,
                data: {
                    created: 0,
                    updated: 0,
                    total: rows.length,
                    errors: errors.length > 0 ? errors : [{ row: 0, error: transactionError.message }],
                },
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de l'import",
        };
    }
}

export async function createMissingHSCodes(hscodes: string[]) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const targetEntiteId = 0;
        const created = [];
        const skipped = [];

        for (const hscode of hscodes) {
            const existing = await prisma.tHSCodes.findFirst({
                where: { hsCode: hscode, entite: targetEntiteId }
            });

            if (existing) {
                skipped.push({ hscode, entite: targetEntiteId, reason: `Existe déjà pour l'entité ${targetEntiteId}` });
                continue;
            }

            const existingInOtherEntities = await prisma.tHSCodes.findMany({
                where: { hsCode: hscode },
                select: { libelleHSCode: true }
            });

            const libelle = existingInOtherEntities[0]?.libelleHSCode || `HS Code ${hscode}`;

            const result = await prisma.tHSCodes.create({
                data: {
                    hsCode: hscode,
                    libelleHSCode: libelle,
                    entite: targetEntiteId,
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });
            created.push(result);
        }

        return { success: true, data: created, skipped: skipped.length > 0 ? skipped : undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}
