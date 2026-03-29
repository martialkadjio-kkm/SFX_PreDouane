"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ColisageImportRowSchema } from "@/lib/validation";
import type { ColisageImportRow } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// ─── Types retournés par les fonctions SQL ────────────────────────────────────

type FxIDRow = { Input: string; ID: number | null };
type FxIDRegimeRow = { Input: number; ID: number | null };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function convertDecimalsToNumbers(data: any): any {
    const jsonString = JSON.stringify(data, (_, value) => {
        if (value && typeof value === "object" && value.constructor.name === "Decimal") {
            return parseFloat(value.toString());
        }
        return value;
    });
    return JSON.parse(jsonString);
}

/**
 * Résout les IDs de devises via fx_IDs_Devises.
 * Retourne une Map<codeDevise, idDevise> et la liste des codes manquants.
 */
async function resolveDevisesIDs(codes: string[]): Promise<{
    map: Map<string, number>;
    missing: string[];
}> {
    const unique = [...new Set(codes.filter(Boolean))];
    if (unique.length === 0) return { map: new Map(), missing: [] };

    const json = JSON.stringify(unique);
    const rows = await prisma.$queryRaw<FxIDRow[]>`
        SELECT * FROM dbo.fx_IDs_Devises(${json})
    `;

    const map = new Map<string, number>();
    const missing: string[] = [];

    for (const row of rows) {
        if (row.ID !== null) {
            map.set(row.Input, row.ID);
        } else {
            missing.push(row.Input);
        }
    }

    return { map, missing };
}

/**
 * Résout les IDs de pays via fx_IDs_Pays.
 */
async function resolvePaysIDs(codes: string[]): Promise<{
    map: Map<string, number>;
    missing: string[];
}> {
    const unique = [...new Set(codes.filter(Boolean))];
    if (unique.length === 0) return { map: new Map(), missing: [] };

    const json = JSON.stringify(unique);
    const rows = await prisma.$queryRaw<FxIDRow[]>`
        SELECT * FROM dbo.fx_IDs_Pays(${json})
    `;

    const map = new Map<string, number>();
    const missing: string[] = [];

    for (const row of rows) {
        if (row.ID !== null) {
            map.set(row.Input, row.ID);
        } else {
            missing.push(row.Input);
        }
    }

    return { map, missing };
}

/**
 * Résout les IDs de HS Codes via fx_IDs_HSCode.
 */
async function resolveHSCodeIDs(codes: string[]): Promise<{
    map: Map<string, number>;
    missing: string[];
}> {
    const unique = [...new Set(codes.filter(Boolean))];
    if (unique.length === 0) return { map: new Map(), missing: [] };

    const json = JSON.stringify(unique);
    const rows = await prisma.$queryRaw<FxIDRow[]>`
        SELECT * FROM dbo.fx_IDs_HSCode(${json})
    `;

    const map = new Map<string, number>();
    const missing: string[] = [];

    for (const row of rows) {
        if (row.ID !== null) {
            map.set(row.Input, row.ID);
        } else {
            missing.push(row.Input);
        }
    }

    return { map, missing };
}

/**
 * Résout les IDs de régimes de déclaration via fx_IDs_RegimesDeclarations.
 * @param clientId  ID du client (dossier.client)
 * @param regimeDouanierId  ID du régime douanier (ex: IM4)
 * @param taux  Liste des taux uniques (valeurs numériques)
 */
async function resolveRegimesIDs(
    clientId: number,
    regimeDouanierId: number,
    taux: number[]
): Promise<{
    map: Map<number, number>;
    missing: number[];
}> {
    const unique = [...new Set(taux.filter((t) => !isNaN(t)))];
    if (unique.length === 0) return { map: new Map(), missing: [] };

    const json = JSON.stringify(unique);
    const rows = await prisma.$queryRaw<FxIDRegimeRow[]>`
        SELECT * FROM dbo.fx_IDs_RegimesDeclarations(${clientId}, ${json}, ${regimeDouanierId})
    `;

    const map = new Map<number, number>();
    const missing: number[] = [];

    for (const row of rows) {
        if (row.ID !== null) {
            map.set(Number(row.Input), row.ID);
        } else {
            missing.push(Number(row.Input));
        }
    }

    return { map, missing };
}

// ─── Parse Excel ─────────────────────────────────────────────────────────────

export async function parseColisageExcelFile(formData: FormData) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const file = formData.get("file") as File;
        if (!file) return { success: false, error: "Aucun fichier fourni" };

        const buffer = await file.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!worksheet) return { success: false, error: "Aucune feuille trouvée dans le fichier" };

        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
        if (rows.length === 0) return { success: false, error: "Le fichier est vide" };

        const parsedRows = rows.map((row, index) => ({
            _rowIndex: index + 2,
            rowKey: row["Row_Key"] || row["Row Key"] || row["rowKey"],
            hscode: row["HS_Code"] || row["HS Code"] || row["Code HS"],
            description: row["Descr"] || row["Description"] || row["Description Colis"],
            numeroCommande: row["Command_No"] || row["No Commande"] || row["Numéro Commande"],
            nomFournisseur: row["Supplier_Name"] || row["Nom Fournisseur"] || row["Fournisseur"],
            numeroFacture: row["Invoice_No"] || row["No Facture"] || row["Numéro Facture"],
            devise: row["Currency"] || row["Devise"] || row["Code Devise"],
            quantite: parseFloat(row["Qty"] || row["Quantité"] || row["Qte Colis"]) || undefined,
            prixUnitaireColis: parseFloat(row["Unit_Prize"] || row["Prix Unitaire"] || row["Prix Unitaire Facture"]) || undefined,
            poidsBrut: parseFloat(row["Gross_Weight"] || row["Poids Brut"]) || undefined,
            poidsNet: parseFloat(row["Net_Weight"] || row["Poids Net"]) || undefined,
            volume: parseFloat(row["Volume"]) || undefined,
            paysOrigine: row["Country_Origin"] || row["Pays Origine"] || row["Code Pays"],
            regimeCode: row["Regime_Code"] || row["Regime Code"],
            regimeRatio: row["Regime_Ratio"] || row["Regime Ratio"],
            regroupementClient: row["Customer_Grouping"] || row["Regroupement Client"],
        }));

        return { success: true, data: { rows: parsedRows, total: parsedRows.length } };
    } catch (error) {
        console.error("parseColisageExcelFile error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors du parsing" };
    }
}

// ─── Check existing row keys ──────────────────────────────────────────────────

export async function checkExistingRowKeys(orderTransitId: string, rowKeys: string[]) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const existingColisages = await prisma.tColisageDossiers.findMany({
            where: {
                dossier: parseInt(orderTransitId),
                uploadKey: { in: rowKeys.filter(Boolean) },
            },
            select: { id: true, uploadKey: true, descriptionColis: true },
        });

        return { success: true, data: existingColisages };
    } catch (error) {
        console.error("checkExistingRowKeys error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la vérification" };
    }
}

// ─── Import principal ─────────────────────────────────────────────────────────

export async function importSelectedColisages(
    orderTransitId: string,
    rows: ColisageImportRow[],
    updateExisting: boolean = false
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const userId = parseInt(session.user.id);

        // ── 1. Récupérer le dossier pour avoir le clientId ────────────────────
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: parseInt(orderTransitId) },
            select: { id: true, client: true },
        });

        if (!dossier) {
            return { success: false, error: `Dossier ${orderTransitId} introuvable` };
        }

        // ── 2. Valider toutes les lignes avec Zod ─────────────────────────────
        const validatedRows: (ColisageImportRow & { _regimeTaux?: number })[] = [];
        const validationErrors: Array<{ row: number; rowKey?: string; error: string }> = [];

        for (let i = 0; i < rows.length; i++) {
            try {
                const validated = ColisageImportRowSchema.parse(rows[i]);
                // Normaliser le ratio régime en nombre
                let regimeTaux: number | undefined;
                if (validated.regimeCode && validated.regimeRatio !== undefined && validated.regimeRatio !== null) {
                    regimeTaux = typeof validated.regimeRatio === "string"
                        ? parseFloat(validated.regimeRatio)
                        : validated.regimeRatio;
                    if (isNaN(regimeTaux)) {
                        throw new Error(`Regime_Ratio invalide : "${validated.regimeRatio}"`);
                    }
                }
                validatedRows.push({ ...validated, _regimeTaux: regimeTaux });
            } catch (err: any) {
                validationErrors.push({ row: i + 1, rowKey: rows[i]?.rowKey, error: err.message });
            }
        }

        if (validationErrors.length > 0) {
            return {
                success: false,
                error: `${validationErrors.length} ligne(s) invalide(s)`,
                data: { created: 0, updated: 0, total: rows.length, errors: validationErrors },
            };
        }

        // ── 3. Extraire les valeurs uniques ───────────────────────────────────
        const uniqueDevises = [...new Set(validatedRows.map((r) => r.devise).filter(Boolean))];
        const uniquePays = [...new Set(validatedRows.map((r) => r.paysOrigine).filter(Boolean))];
        const uniqueHscodes = [...new Set(validatedRows.map((r) => r.hscode).filter(Boolean) as string[])];
        const uniqueTaux = [...new Set(
            validatedRows
                .filter((r) => r._regimeTaux !== undefined)
                .map((r) => r._regimeTaux as number)
        )];

        // ── 4. Résoudre le régime douanier IM4 ───────────────────────────────
        let regimeDouanier = await prisma.tRegimesDouaniers.findFirst({
            where: { codeRegimeDouanier: "IM4" },
        });

        if (!regimeDouanier) {
            regimeDouanier = await prisma.tRegimesDouaniers.create({
                data: {
                    codeRegimeDouanier: "IM4",
                    libelleRegimeDouanier: "Importation définitive",
                    session: userId,
                    dateCreation: new Date(),
                },
            });
        }

        // ── 5. Appel batch des 4 fonctions SQL en parallèle ───────────────────
        const [devisesResult, paysResult, hscodesResult] = await Promise.all([
            resolveDevisesIDs(uniqueDevises),
            resolvePaysIDs(uniquePays),
            resolveHSCodeIDs(uniqueHscodes),
        ]);

        // Les régimes nécessitent clientId + regimeDouanierId → séparé
        const regimesResult = await resolveRegimesIDs(
            dossier.client,
            regimeDouanier.id,
            uniqueTaux
        );

        // ── 6. Créer les régimes manquants puis re-résoudre ───────────────────
        if (regimesResult.missing.length > 0) {
            for (const taux of regimesResult.missing) {
                let libelle: string;
                if (taux === 0) {
                    libelle = `IM4 100% TR et 0% DC`;
                } else if (taux === 100) {
                    libelle = `IM4 100% DC`;
                } else {
                    const dc = Math.round(taux * 100) / 100;
                    const tr = Math.round((100 - taux) * 100) / 100;
                    libelle = `IM4 ${tr}% TR et ${dc}% DC`;
                }

                // Créer le régime de déclaration
                const newRegime = await prisma.tRegimesDeclarations.create({
                    data: {
                        regimeDouanier: regimeDouanier.id,
                        libelleRegimeDeclaration: libelle,
                        tauxRegime: taux,
                        entite: 1,
                        session: userId,
                        dateCreation: new Date(),
                    },
                });

                // Associer au client
                await prisma.tRegimesClients.create({
                    data: {
                        client: dossier.client,
                        regimeDeclaration: newRegime.id,
                        session: userId,
                        dateCreation: new Date(),
                    },
                });

                regimesResult.map.set(taux, newRegime.id);
            }
            regimesResult.missing.length = 0;
        }

        // ── 7. Vérification finale : bloquer si des codes sont introuvables ───
        const allErrors: string[] = [];

        if (devisesResult.missing.length > 0) {
            allErrors.push(`Devises inconnues : ${devisesResult.missing.join(", ")}`);
        }
        if (paysResult.missing.length > 0) {
            allErrors.push(`Pays inconnus : ${paysResult.missing.join(", ")}`);
        }
        if (hscodesResult.missing.length > 0) {
            allErrors.push(`HS Codes inconnus : ${hscodesResult.missing.join(", ")}`);
        }

        if (allErrors.length > 0) {
            return {
                success: false,
                error: allErrors.join(" | "),
                data: {
                    created: 0,
                    updated: 0,
                    total: rows.length,
                    errors: allErrors.map((e) => ({ row: 0, error: e })),
                },
            };
        }

        // ── 8. Pré-charger les uploadKeys existants ───────────────────────────
        const existingColisages = await prisma.tColisageDossiers.findMany({
            where: { dossier: parseInt(orderTransitId), uploadKey: { not: "" } },
            select: { id: true, uploadKey: true },
        });
        const existingRowKeysMap = new Map(existingColisages.map((c) => [c.uploadKey!, c.id]));

        // ── 9. Transaction d'insertion ────────────────────────────────────────
        const createdColisages: any[] = [];
        const updatedColisages: any[] = [];
        const rowErrors: Array<{ row: number; rowKey?: string; error: string }> = [];

        try {
            await prisma.$transaction(
                async (tx) => {
                    for (let i = 0; i < validatedRows.length; i++) {
                        const row = validatedRows[i];

                        const deviseId = devisesResult.map.get(row.devise)!;
                        const paysId = paysResult.map.get(row.paysOrigine)!;
                        const hscodeId = row.hscode ? hscodesResult.map.get(row.hscode) ?? null : null;
                        const regimeId = row._regimeTaux !== undefined
                            ? regimesResult.map.get(row._regimeTaux) ?? null
                            : null;

                        const existingId = row.rowKey ? existingRowKeysMap.get(row.rowKey) : undefined;

                        const colisageData = {
                            dossier: parseInt(orderTransitId),
                            hsCode: hscodeId,
                            descriptionColis: row.description,
                            noCommande: row.numeroCommande || "",
                            nomFournisseur: row.nomFournisseur || "",
                            noFacture: row.numeroFacture || "",
                            itemNo: "",
                            devise: deviseId,
                            qteColisage: row.quantite,
                            prixUnitaireColis: row.prixUnitaireColis,
                            poidsBrut: row.poidsBrut,
                            poidsNet: row.poidsNet,
                            volume: row.volume,
                            ajustementValeur: 0,
                            paysOrigine: paysId,
                            regimeDeclaration: regimeId,
                            regroupementClient: row.regroupementClient || "-",
                            uploadKey: row.rowKey || "",
                            session: userId,
                        };

                        if (existingId && updateExisting) {
                            const updated = await tx.tColisageDossiers.update({
                                where: { id: existingId },
                                data: colisageData,
                                select: { id: true, uploadKey: true, descriptionColis: true, qteColisage: true },
                            });
                            updatedColisages.push(convertDecimalsToNumbers(updated));
                        } else if (!existingId) {
                            const created = await tx.tColisageDossiers.create({
                                data: { ...colisageData, dateCreation: new Date() },
                                select: { id: true, uploadKey: true, descriptionColis: true, qteColisage: true },
                            });
                            createdColisages.push(convertDecimalsToNumbers(created));
                        } else {
                            throw new Error(`Le rowKey "${row.rowKey}" existe déjà et la mise à jour n'est pas autorisée`);
                        }
                    }
                },
                { maxWait: 60000, timeout: 120000 }
            );
        } catch (txError: any) {
            return {
                success: false,
                error: `Importation annulée : ${txError.message}`,
                data: { created: 0, updated: 0, total: rows.length, errors: rowErrors },
            };
        }

        revalidatePath(`/transit-orders/${orderTransitId}`);
        revalidatePath("/transit-orders");
        revalidatePath("/colisage");

        return {
            success: true,
            data: {
                created: createdColisages.length,
                updated: updatedColisages.length,
                total: rows.length,
                errors: rowErrors.length > 0 ? rowErrors : undefined,
            },
        };
    } catch (error) {
        console.error("importSelectedColisages error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de l'import",
        };
    }
}
