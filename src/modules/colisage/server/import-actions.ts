"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ColisageImportRowSchema, ColisageCreateSchema } from "@/lib/validation";
import type { ColisageImportRow, ColisageCreate } from "@/lib/validation";
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

export async function parseColisageExcelFile(formData: FormData) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "Aucun fichier fourni" };
        }

        const buffer = await file.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!worksheet) {
            return { success: false, error: "Aucune feuille trouvée dans le fichier" };
        }

        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rows.length === 0) {
            return { success: false, error: "Le fichier est vide" };
        }

        const parsedRows = rows.map((row, index) => {
            const mappedRow: any = {
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
            };

            return mappedRow;
        });

        return {
            success: true,
            data: {
                rows: parsedRows,
                total: parsedRows.length,
            },
        };
    } catch (error) {
        console.error("parseColisageExcelFile error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors du parsing" };
    }
}

export async function checkExistingRowKeys(orderTransitId: string, rowKeys: string[]) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const existingColisages = await prisma.tColisageDossiers.findMany({
            where: {
                dossier: parseInt(orderTransitId),
                uploadKey: {
                    in: rowKeys.filter(Boolean),
                },
            },
            select: {
                id: true,
                uploadKey: true,
                descriptionColis: true,
            },
        });

        return {
            success: true,
            data: existingColisages,
        };
    } catch (error) {
        console.error("checkExistingRowKeys error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la vérification" };
    }
}

export async function importSelectedColisages(
    orderTransitId: string,
    rows: ColisageImportRow[],
    updateExisting: boolean = false
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const createdColisages: any[] = [];
        const updatedColisages: any[] = [];
        const errors: Array<{ row: number; rowKey?: string; error: string }> = [];

        // Pré-charger toutes les données de référence AVANT la transaction
        const allDevises = await prisma.tDevises.findMany({ select: { id: true, codeDevise: true } });
        const devisesMap = new Map(allDevises.map(d => [d.codeDevise, d.id]));

        const allPays = await prisma.tPays.findMany({ select: { id: true, codePays: true } });
        const paysMap = new Map(allPays.map(p => [p.codePays, p.id]));

        const allHscodes = await prisma.tHSCodes.findMany({ select: { id: true, hsCode: true } });
        const hscodesMap = new Map(allHscodes.map(h => [h.hsCode, h.id]));

        const allRegimes = await prisma.tRegimesDeclarations.findMany({ select: { id: true, libelleRegimeDeclaration: true } });
        const regimesMap = new Map(allRegimes.map(r => [r.libelleRegimeDeclaration.toLowerCase(), r.id]));

        // Trouver ou créer le régime douanier IM4
        let regimeDouanier = await prisma.tRegimesDouaniers.findFirst({
            where: { codeRegimeDouanier: "IM4" },
        });

        if (!regimeDouanier) {
            regimeDouanier = await prisma.tRegimesDouaniers.create({
                data: {
                    codeRegimeDouanier: "IM4",
                    libelleRegimeDouanier: "Importation définitive",
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });
            console.log("✅ Régime douanier IM4 créé automatiquement");
        }

        // Pré-créer tous les régimes nécessaires AVANT la transaction
        const regimesToCreate = new Set<string>();
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const validatedRow = ColisageImportRowSchema.parse(row);
                
                if (validatedRow.regimeCode && validatedRow.regimeRatio !== undefined && validatedRow.regimeRatio !== null) {
                    let regimeRatio = validatedRow.regimeRatio;
                    if (typeof regimeRatio === 'string') {
                        regimeRatio = parseFloat(regimeRatio);
                    }
                    
                    if (!isNaN(regimeRatio)) {
                        let regimeLibelle: string;
                        
                        if (regimeRatio === 0) {
                            // EXO : 100% TR et 0% DC
                            regimeLibelle = `${validatedRow.regimeCode} 100% TR et 0% DC`;
                        } else if (regimeRatio === 100) {
                            // 100% DC 
                            regimeLibelle = `${validatedRow.regimeCode} 100% DC`;
                        } else {
                            // Pourcentage mixte : TR et DC
                            const dcPercent = regimeRatio;
                            const trPercent = 100 - dcPercent;
                            const dcRounded = Math.round(dcPercent * 100) / 100;
                            const trRounded = Math.round(trPercent * 100) / 100;
                            regimeLibelle = `${validatedRow.regimeCode} ${trRounded}% TR et ${dcRounded}% DC`;
                        }
                        
                        // Vérifier si le régime existe déjà dans la map ou dans le set à créer
                        if (!regimesMap.has(regimeLibelle.toLowerCase()) && !regimesToCreate.has(regimeLibelle)) {
                            regimesToCreate.add(regimeLibelle);
                        }
                    }
                }
            } catch (error) {
                // Ignorer les erreurs de validation pour l'instant
            }
        }
        
        // Créer tous les régimes manquants
        for (const regimeLibelle of regimesToCreate) {
            const regimeRatio = parseFloat(regimeLibelle.match(/(\d+(?:\.\d+)?)% DC/)?.[1] || "0");
            
            const newRegime = await prisma.tRegimesDeclarations.create({
                data: {
                    regimeDouanier: regimeDouanier.id,
                    libelleRegimeDeclaration: regimeLibelle,
                    tauxRegime: regimeRatio,
                    entite: 1,
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });
            
            regimesMap.set(regimeLibelle.toLowerCase(), newRegime.id);
            allRegimes.push({ id: newRegime.id, libelleRegimeDeclaration: regimeLibelle });
            
            console.log(`✅ Régime "${regimeLibelle}" créé automatiquement`);
        }

        // Pré-charger les colisages existants avec uploadKey pour cet ordre
        const existingColisagesWithRowKey = await prisma.tColisageDossiers.findMany({
            where: {
                dossier: parseInt(orderTransitId),
                uploadKey: { not: '' },
            },
            select: {
                id: true,
                uploadKey: true,
            },
        });
        
        const existingRowKeysMap = new Map(
            existingColisagesWithRowKey.map(c => [c.uploadKey!, c.id])
        );

        try {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    try {
                        const validatedRow = ColisageImportRowSchema.parse(row);

                        // Utiliser les maps pré-chargées au lieu de requêtes
                        const deviseId = devisesMap.get(validatedRow.devise);
                        if (!deviseId) {
                            throw new Error(`Devise "${validatedRow.devise}" non trouvée`);
                        }

                        const paysId = paysMap.get(validatedRow.paysOrigine);
                        if (!paysId) {
                            throw new Error(`Pays "${validatedRow.paysOrigine}" non trouvé`);
                        }

                        let hscodeId: number | undefined;
                        if (validatedRow.hscode) {
                            hscodeId = hscodesMap.get(validatedRow.hscode);
                            if (!hscodeId) {
                                throw new Error(`Code HS "${validatedRow.hscode}" non trouvé`);
                            }
                        }

                        // Calculer le régime de déclaration basé sur le code et le ratio
                        let regimeDeclarationId: number | undefined;
                        if (validatedRow.regimeCode && validatedRow.regimeRatio !== undefined && validatedRow.regimeRatio !== null) {
                            const regimeCode = validatedRow.regimeCode;
                            let regimeRatio = validatedRow.regimeRatio;
                            
                            // Convertir le ratio en nombre si c'est une chaîne
                            if (typeof regimeRatio === 'string') {
                                regimeRatio = parseFloat(regimeRatio);
                            }

                            // Vérifier que le ratio est un nombre valide
                            if (isNaN(regimeRatio)) {
                                throw new Error(`Regime_Ratio invalide pour la ligne ${i + 1}: "${validatedRow.regimeRatio}". Doit être un nombre décimal (ex: 0 pour EXO, 0.4578 pour 45.78% DC, 1 pour 100% DC) ou valeur spéciale (-2 pour TTC, -1 pour 100% TR)`);
                            }

                            let regimeLibelle: string;
                            
                            if (regimeRatio === 0) {
                                // EXO : 100% TR et 0% DC
                                regimeLibelle = `${regimeCode} 100% TR et 0% DC`;
                            } else if (regimeRatio === 100) {
                                // 100% DC (sans mentionner TR)
                                regimeLibelle = `${regimeCode} 100% DC`;
                            } else {
                                // Pourcentage mixte : TR et DC
                                const dcPercent = regimeRatio;
                                const trPercent = 100 - dcPercent;
                                
                                // Arrondir pour éviter les problèmes de précision
                                const dcRounded = Math.round(dcPercent * 100) / 100;
                                const trRounded = Math.round(trPercent * 100) / 100;
                                
                                regimeLibelle = `${regimeCode} ${trRounded}% TR et ${dcRounded}% DC`;
                            }

                            // Chercher dans la map pré-chargée (insensible à la casse)
                            regimeDeclarationId = regimesMap.get(regimeLibelle.toLowerCase());
                            
                            if (!regimeDeclarationId) {
                                throw new Error(`Régime "${regimeLibelle}" devrait exister mais n'a pas été trouvé`);
                            }
                        } else {
                            // Pas de régime fourni - c'est OK, sera NULL
                            console.log(`ℹ️  Ligne ${i + 1}: Pas de régime fourni (Regime_Code ou Regime_Ratio vide)`);
                        }

                        // Vérifier si un colisage avec ce uploadKey existe déjà (depuis la map pré-chargée)
                        let existingColisageId: number | undefined;
                        if (validatedRow.rowKey) {
                            existingColisageId = existingRowKeysMap.get(validatedRow.rowKey);
                        }

                        if (existingColisageId && updateExisting) {
                            const updated = await tx.tColisageDossiers.update({
                                where: { id: existingColisageId },
                                data: {
                                    dossier: parseInt(orderTransitId),
                                    hsCode: hscodeId || null,
                                    descriptionColis: validatedRow.description,
                                    noCommande: validatedRow.numeroCommande || '',
                                    nomFournisseur: validatedRow.nomFournisseur || '',
                                    noFacture: validatedRow.numeroFacture || '',
                                    itemNo: '',
                                    devise: deviseId,
                                    qteColisage: validatedRow.quantite,
                                    prixUnitaireColis: validatedRow.prixUnitaireColis,
                                    poidsBrut: validatedRow.poidsBrut,
                                    poidsNet: validatedRow.poidsNet,
                                    volume: validatedRow.volume,
                                    ajustementValeur: 0,
                                    paysOrigine: paysId,
                                    regimeDeclaration: regimeDeclarationId || null,
                                    regroupementClient: validatedRow.regroupementClient || '-',
                                    uploadKey: validatedRow.rowKey || '',
                                    session: parseInt(session.user.id),
                                },
                                select: {
                                    id: true,
                                    uploadKey: true,
                                    descriptionColis: true,
                                    qteColisage: true,
                                    prixUnitaireColis: true,
                                    poidsBrut: true,
                                    poidsNet: true,
                                    volume: true,
                                },
                            });
                            updatedColisages.push(convertDecimalsToNumbers(updated));
                        } else if (!existingColisageId) {
                            const created = await tx.tColisageDossiers.create({
                                data: {
                                    dossier: parseInt(orderTransitId),
                                    hsCode: hscodeId || null,
                                    descriptionColis: validatedRow.description,
                                    noCommande: validatedRow.numeroCommande || '',
                                    nomFournisseur: validatedRow.nomFournisseur || '',
                                    noFacture: validatedRow.numeroFacture || '',
                                    itemNo: '',
                                    devise: deviseId,
                                    qteColisage: validatedRow.quantite,
                                    prixUnitaireColis: validatedRow.prixUnitaireColis,
                                    poidsBrut: validatedRow.poidsBrut,
                                    poidsNet: validatedRow.poidsNet,
                                    volume: validatedRow.volume,
                                    ajustementValeur: 0,
                                    paysOrigine: paysId,
                                    regimeDeclaration: regimeDeclarationId || null,
                                    regroupementClient: validatedRow.regroupementClient || '-',
                                    uploadKey: validatedRow.rowKey || '',
                                    session: parseInt(session.user.id),
                                    dateCreation: new Date(),
                                },
                                select: {
                                    id: true,
                                    uploadKey: true,
                                    descriptionColis: true,
                                    qteColisage: true,
                                    prixUnitaireColis: true,
                                    poidsBrut: true,
                                    poidsNet: true,
                                    volume: true,
                                },
                            });
                            createdColisages.push(convertDecimalsToNumbers(created));
                        } else {
                            throw new Error(`Le rowKey "${validatedRow.rowKey}" existe déjà et la mise à jour n'est pas autorisée`);
                        }
                    } catch (error: any) {
                        console.error(`Erreur ligne ${i + 1}:`, error.message);
                        errors.push({
                            row: i + 1,
                            rowKey: row.rowKey,
                            error: error.message || "Erreur lors du traitement",
                        });
                        throw error;
                    }
                }
            }, {
                maxWait: 60000, // 60 secondes max d'attente
                timeout: 120000, // 120 secondes timeout (2 minutes)
            });

            // Revalider les chemins
            revalidatePath(`/transit-orders/${orderTransitId}`);
            revalidatePath("/transit-orders");
            revalidatePath("/colisage");

            return {
                success: true,
                data: {
                    created: createdColisages.length,
                    updated: updatedColisages.length,
                    total: rows.length,
                    errors: errors.length > 0 ? errors : undefined,
                },
            };
        } catch (transactionError: any) {
            console.error("Transaction error:", transactionError);
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
        console.error("importSelectedColisages error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de l'import",
        };
    }
}
