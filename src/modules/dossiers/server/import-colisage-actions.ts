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

/**
 * Parse un fichier Excel de colisages avec validation et détection des valeurs manquantes
 */
export async function parseColisageExcelFile(formData: FormData, dossierId?: number) {
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

        // Récupérer le client du dossier si dossierId est fourni
        let clientId = parseInt(session.user.id);
        if (dossierId) {
            const dossier = await prisma.tDossiers.findUnique({
                where: { id: dossierId },
                select: { client: true }
            });
            if (dossier) {
                clientId = dossier.client;
            }
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
            // Gérer le HS Code : 
            // - Si vide/undefined/null dans Excel = null (pas de HS Code)
            // - Si 0 dans Excel = 0 (HS Code ID 0 qui correspond au code "0")
            // - Sinon = la valeur
            const hsCodeValue = row["HS_Code"] ?? row["HS Code"] ?? row["Code HS"];
            let hscode = null;
            if (hsCodeValue !== undefined && hsCodeValue !== null && hsCodeValue !== "") {
                hscode = hsCodeValue; // Peut être 0 ou une autre valeur
            }
            
            return {
                _rowIndex: index + 2,
                rowKey: (row["Row_Key"] ?? row["Row Key"] ?? row["rowKey"] ?? "").toString().trim(),
                hscode: hscode,
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
                // Régime code optionnel (peut être vide, mais jamais null)
                regimeCode: row["Regime_Code"] ?? row["Régime Code"] ?? row["Code Régime"] ?? "",
                regimeRatio: (() => {
                    const value = row["Regime_Ratio"] ?? row["Régime Ratio"] ?? row["Ratio Régime"];
                    if (value === undefined || value === null || value === '') return 0;
                    const parsed = parseFloat(value);
                    return isNaN(parsed) ? 0 : parsed;
                })(),
                regroupementClient: row["Customer_Grouping"] ?? row["Regroupement Client"] ?? "",
            };
        });

        // Valider et détecter les valeurs manquantes
        const missingValues = await validateAndDetectMissing(parsedRows, clientId, dossierId);

        return {
            success: true,
            data: {
                rows: parsedRows,
                total: parsedRows.length,
                missingValues, // Devises, Pays, HS Codes manquants
                clientId, // ID du client pour créer les associations
            },
        };
    } catch (error) {
        console.error("parseColisageExcelFile error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors du parsing" };
    }
}


async function validateAndDetectMissing(rows: any[], clientId: number, dossierId?: number) {
    const missingDevises: string[] = [];
    const missingPays: string[] = [];
    const missingHscodes: string[] = [];
    const missingRegimes: Array<{ code: string; ratio: number }> = [];
    const unassociatedRegimes: Array<{ code: string; ratio: number; libelle: string }> = [];

    // Extraire les valeurs distinctes
    const distinctDevises = [...new Set(rows.map(r => r.devise).filter(Boolean))];
    const distinctPays = [...new Set(rows.map(r => r.paysOrigine).filter(Boolean))];
    // Convertir les HS codes en strings pour la comparaison
    const distinctHscodes = [...new Set(rows.map(r => r.hscode).filter(h => h !== null && h !== undefined).map(h => String(h)))];


    if (distinctDevises.length > 0) {

        const foundDevises = await prisma.tDevises.findMany({
            where: { 
                codeDevise: { in: distinctDevises },
                deviseInactive: false // Seulement les devises actives
            },
            select: { codeDevise: true }
        });

        
        const foundDevisesCodes = new Set(foundDevises.map(d => d.codeDevise));
        const missingDevisesFound = distinctDevises.filter(d => !foundDevisesCodes.has(d));
        
        missingDevises.push(...missingDevisesFound);
    }

    // Vérifier les pays (chercher dans TPays directement)
    if (distinctPays.length > 0) {
      
        const foundPays = await prisma.tPays.findMany({
            where: { codePays: { in: distinctPays } },
            select: { codePays: true }
        });
    
        const foundPaysCodes = new Set(foundPays.map(p => p.codePays));
        const missingPaysFound = distinctPays.filter(p => !foundPaysCodes.has(p));
        
       

        missingPays.push(...missingPaysFound);
    }

    // Vérifier les HS Codes
    if (distinctHscodes.length > 0) {
        console.log('🔍 [validateAndDetectMissing] Vérification HS Codes:', distinctHscodes);
        
        // Récupérer l'entité du dossier si dossierId est fourni
        let targetEntiteId = 0; // Par défaut entité 0
        
        if (dossierId) {
            const dossier = await prisma.tDossiers.findUnique({
                where: { id: dossierId },
                include: {
                    tBranches: {
                        select: { entite: true }
                    }
                }
            });
            
            if (dossier?.tBranches?.entite) {
                targetEntiteId = dossier.tBranches.entite;
               
            } else {
                console.log(`[validateAndDetectMissing] Dossier ${dossierId} non trouvé ou sans entité, utilisation entité 0`);
            }
        }
        
        // Chercher par code HS dans l'entité appropriée ET aussi vérifier l'ID 0 explicitement
        const foundHscodes = await prisma.tHSCodes.findMany({
            where: { 
                OR: [
                    { 
                        hsCode: { in: distinctHscodes },
                        entite: targetEntiteId 
                    },
                    { id: 0 } // Inclure explicitement l'ID 0
                ]
            },
            select: { id: true, hsCode: true, entite: true }
        });
        
        console.log('📊 [validateAndDetectMissing] HS Codes trouvés:', foundHscodes);
        
        // Créer un Set avec les codes trouvés dans la bonne entité
        const foundHscodesCodes = new Set(
            foundHscodes
                .filter(h => h.entite === targetEntiteId || h.id === 0)
                .map(h => h.hsCode)
        );
        const missingHscodesFound = distinctHscodes.filter(h => !foundHscodesCodes.has(h));
      
        missingHscodes.push(...missingHscodesFound);
    }


    const rowsWithRegime = rows.filter(r => r.regimeRatio !== null && r.regimeRatio !== undefined);
    if (rowsWithRegime.length > 0) {
        // Les valeurs sont maintenant en format décimal (0.4578 pour 45.78% DC)
        // Pas besoin de diviser par 100
        const distinctRegimes = [...new Set(rowsWithRegime.map(r => {
            const ratio = typeof r.regimeRatio === 'string' ? parseFloat(r.regimeRatio) : r.regimeRatio;
            return ratio.toFixed(4); // Normaliser à 4 décimales
        }))];

        // Récupérer les associations client-régime pour ce client
        const clientRegimeAssociations = await prisma.tRegimesClients.findMany({
            where: { client: clientId },
            include: {
                tRegimesDeclarations: {
                    select: {
                        id: true,
                        libelleRegimeDeclaration: true,
                        tauxRegime: true,
                        regimeDouanier: true
                    }
                }
            }
        });
        
        // Filtrer seulement les régimes douaniers 0
        const filteredAssociations = clientRegimeAssociations.filter(assoc => 
            assoc.tRegimesDeclarations && assoc.tRegimesDeclarations.regimeDouanier === 0
        );
        
        console.log('🔍 [validateAndDetectMissing] Associations manuelles trouvées:', filteredAssociations);
        
        // Créer un Set des taux Regime disponibles pour ce client
        const availableRegimeTaux = new Set(
            filteredAssociations
                .filter(assoc => assoc.tRegimesDeclarations)
                .map(assoc => parseFloat(assoc.tRegimesDeclarations!.tauxRegime.toString()).toFixed(4))
        );
        
        console.log('✅ [validateAndDetectMissing] Régimes trouvés et associés:', Array.from(availableRegimeTaux));
        
        // Pour chaque régime demandé, vérifier s'il existe et s'il est associé
        for (const row of rowsWithRegime) {
            const ratio = typeof row.regimeRatio === 'string' ? parseFloat(row.regimeRatio) : row.regimeRatio;
            const decimal = ratio.toFixed(4); // Normaliser à 4 décimales (déjà en format décimal)
            
            console.log(`🔍 [validateAndDetectMissing] Vérification régime ${ratio} (${decimal})`);
            
            if (!availableRegimeTaux.has(decimal)) {
                
                let libelle: string;
                // Gérer les valeurs spéciales
                if (ratio === -2) {
                    libelle = 'TTC';
                } else if (ratio === -1) {
                    libelle = '100% TR';
                } else if (ratio === 0) {
                    libelle = 'EXO';
                } else if (ratio === 1) {
                    libelle = '100% DC';
                } else if (ratio > 0 && ratio < 1) {
                    // Ratio DC entre 0 et 1
                    const dcPercent = Math.round(ratio * 100 * 100) / 100; // Convertir en pourcentage
                    const trPercent = Math.round((100 - dcPercent) * 100) / 100;
                    libelle = `${trPercent.toFixed(2)}% TR et ${dcPercent.toFixed(2)}% DC`;
                } else {
                    // Valeur invalide
                    libelle = `Régime ${ratio}`;
                }

                const regimeExists = await prisma.tRegimesDeclarations.findFirst({
                    where: {
                        OR: [
                            { libelleRegimeDeclaration: libelle },
                            // Essayer aussi avec le format avec préfixe
                            { libelleRegimeDeclaration: `${row.regimeCode} ${libelle}` },
                            // Essayer avec le taux Regime directement
                            { tauxRegime: ratio },
                        ]
                    }
                });


                if (regimeExists) {
                    // Le régime existe mais n'est pas associé au client
                    const alreadyAdded = unassociatedRegimes.find(r => r.ratio === ratio);
                    if (!alreadyAdded) {
                        unassociatedRegimes.push({ 
                            code: row.regimeCode, 
                            ratio,
                            libelle: regimeExists.libelleRegimeDeclaration
                        });
                    }
                } else {
                    // Le régime n'existe pas du tout
                    const alreadyAdded = missingRegimes.find(m => m.ratio === ratio);
                    if (!alreadyAdded) {
                        missingRegimes.push({ 
                            code: row.regimeCode, 
                            ratio,
                        });
                    }
                }
            } else {
                console.log(`[validateAndDetectMissing] Régime ${ratio} OK (trouvé dans les associations client)`);
            }
        }
    }

    const result = {
        devises: missingDevises,
        pays: missingPays,
        hscodes: missingHscodes,
        regimes: missingRegimes,
        unassociatedRegimes, // Régimes existants mais non associés au client
    };

    return result;
}

/**
 * Vérifie les rowKeys existants dans un dossier
 */
export async function checkExistingRowKeys(dossierId: number, rowKeys: string[]) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const existingColisages = await prisma.tColisageDossiers.findMany({
            where: {
                dossier: dossierId,
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

/**
 * Importe des colisages sélectionnés dans un dossier en utilisant la procédure stockée pSP_AjouterColisageDossier
 */
export async function importSelectedColisages(
    dossierId: number,
    rows: any[],
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

        // Transaction pour traiter tous les colisages
        try {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    try {
                        console.log(`📝 [importSelectedColisages] Traitement ligne ${i + 1}:`, {
                            rowKey: row.rowKey,
                            description: row.description?.substring(0, 50),
                            devise: row.devise,
                            paysOrigine: row.paysOrigine,
                            regimeRatio: row.regimeRatio
                        });

                        // Préparer les paramètres pour la procédure stockée
                        const hsCode = row.hscode !== null && row.hscode !== undefined ? String(row.hscode) : '0';
                        const regimeRatio = row.regimeRatio !== undefined && row.regimeRatio !== null && !isNaN(row.regimeRatio)
                            ? (typeof row.regimeRatio === 'string' ? parseFloat(row.regimeRatio) : row.regimeRatio)
                            : 0;
                        const regimeCode = row.regimeCode || ''; // Utiliser chaîne vide au lieu de null

                        // Appeler la procédure stockée pSP_AjouterColisageDossier
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

                        console.log(`🔧 [importSelectedColisages] Exécution procédure pour ligne ${i + 1}`);
                        
                        await tx.$executeRawUnsafe(query);

                        console.log(`✅ [importSelectedColisages] Ligne ${i + 1} traitée avec succès`);

                        // Compter comme créé (la procédure gère INSERT/UPDATE automatiquement)
                        createdColisages.push({ 
                            rowKey: row.rowKey, 
                            description: row.description,
                            processed: true 
                        });

                    } catch (error: any) {
                        console.error(`❌ [importSelectedColisages] Erreur ligne ${i + 1}:`, error);
                        
                        // Extraire le message d'erreur de SQL Server
                        let errorMessage = error.message || "Erreur lors du traitement";
                        
                        // Nettoyer les messages d'erreur SQL Server
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
                            // Erreur de clé dupliquée sur l'index unique principal
                            errorMessage = `Colisage déjà existant avec la même combinaison : N° Facture "${row.numeroFacture}", Fournisseur "${row.nomFournisseur}", Item N° "${row.itemNo}", N° Commande "${row.numeroCommande}"`;
                        } else if (errorMessage.includes("UQ_TColisageDossiers$UploadKey")) {
                            // Erreur de clé dupliquée sur l'index UploadKey
                            errorMessage = `Row Key "${row.rowKey}" déjà utilisé dans ce dossier`;
                        }

                        errors.push({
                            row: i + 1,
                            rowKey: row.rowKey,
                            error: errorMessage,
                        });
                    }
                }
            }, {
                maxWait: 60000,
                timeout: 120000,
            });

            console.log(`[importSelectedColisages] Import terminé - Succès: ${createdColisages.length}, Erreurs: ${errors.length}`);

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
            console.error("[importSelectedColisages] Erreur transaction:", transactionError);
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
        console.error("[importSelectedColisages] Erreur générale:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de l'import",
        };
    }
}

/**
 * Crée les HS Codes manquants pour l'entité 0 (configuration par défaut)
 */
export async function createMissingHSCodes(hscodes: string[]) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        // Utiliser l'entité 0 par défaut (configuration système)
        const targetEntiteId = 0;

        const created = [];
        const skipped = [];
        
        for (const hscode of hscodes) {
            // Vérifier si le HS Code existe déjà pour l'entité 0
            const existing = await prisma.tHSCodes.findFirst({
                where: { 
                    hsCode: hscode,
                    entite: targetEntiteId
                }
            });

            if (existing) {
                console.log(`ℹ️  HS Code "${hscode}" existe déjà pour l'entité ${targetEntiteId}`);
                skipped.push({ 
                    hscode, 
                    entite: targetEntiteId,
                    reason: `Existe déjà pour l'entité ${targetEntiteId}`
                });
                continue;
            }

            // Vérifier si le HS Code existe pour d'autres entités
            const existingInOtherEntities = await prisma.tHSCodes.findMany({
                where: { hsCode: hscode },
                select: { id: true, hsCode: true, entite: true, libelleHSCode: true }
            });

            let libelle = `HS Code ${hscode}`;
            if (existingInOtherEntities.length > 0) {
                // Utiliser le libellé d'un HS Code existant
                libelle = existingInOtherEntities[0].libelleHSCode || libelle;
                console.log(`HS Code "${hscode}" existe dans d'autres entités, création pour entité ${targetEntiteId}`);
            }

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
            console.log(`HS Code "${hscode}" créé pour l'entité ${targetEntiteId}`);
        }

        return { 
            success: true, 
            data: created,
            skipped: skipped.length > 0 ? skipped : undefined
        };
    } catch (error) {
        console.error("createMissingHSCodes error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}