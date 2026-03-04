"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Convertit les Decimal de Prisma en nombres via JSON
 */
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
 * Crée un nouveau colisage dans un dossier
 */
export async function createColisage(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const colisage = await prisma.tColisageDossiers.create({
            data: {
                dossier: data.dossierId,
                hsCode: data.hsCodeId,
                descriptionColis: data.description,
                noCommande: data.numeroCommande || '',
                nomFournisseur: data.nomFournisseur || '',
                noFacture: data.numeroFacture || '',
                itemNo: data.itemNo || '',
                devise: data.deviseId,
                qteColisage: data.quantite || 1,
                prixUnitaireColis: data.prixUnitaireColis || 0,
                poidsBrut: data.poidsBrut || 0,
                poidsNet: data.poidsNet || 0,
                volume: data.volume || 0,
                ajustementValeur: data.ajustementValeur || 0,
                paysOrigine: data.paysOrigineId,
                regimeDeclaration: data.regimeDeclarationId,
                regroupementClient: data.regroupementClient || '-',
                uploadKey: data.uploadKey || '',
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
        });

        revalidatePath(`/dossiers/${data.dossierId}`);
        revalidatePath("/colisage");
        return {
            success: true,
            data: convertDecimalsToNumbers(colisage),
        };
    } catch (error) {
        console.error("createColisage error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère un colisage par ID via VColisageDossiers
 */
export async function getColisageById(id: string) {
    try {
        const colisages = await prisma.$queryRaw<any[]>`
            SELECT * FROM VColisageDossiers
            WHERE ID_Colisage_Dossier = ${parseInt(id)}
        `;

        if (!colisages || colisages.length === 0) {
            return { success: false, error: "Colisage non trouvé" };
        }

        return {
            success: true,
            data: convertDecimalsToNumbers(colisages[0]),
        };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les colisages via VColisageDossiers
 */
export async function getAllColisages(
    page = 1,
    take = 10000,
    search = ""
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        let query = `
            SELECT DISTINCT * FROM VColisageDossiers
            WHERE 1=1
        `;

        if (search) {
            query += ` AND (
                Description_Colis LIKE '%${search}%' OR
                No_Commande LIKE '%${search}%' OR
                Nom_Fournisseur LIKE '%${search}%'
            )`;
        }

        query += ` ORDER BY Date_Creation DESC`;

        const colisages = await prisma.$queryRawUnsafe<any[]>(query);

        return {
            success: true,
            data: convertDecimalsToNumbers(colisages),
            total: colisages.length,
        };
    } catch (error) {
        console.error("getAllColisages error:", error);
        return { success: false, error, total: 0 };
    }
}

/**
 * Met à jour un colisage
 */
export async function updateColisage(id: string, data: any) {
    try {
        console.log("updateColisage - ID:", id, "Data:", data);
        
        const updateData: any = {};
        
        // Champs obligatoires
        if (data.description !== undefined) updateData.descriptionColis = data.description;
        if (data.deviseId !== undefined) updateData.devise = parseInt(data.deviseId);
        if (data.paysOrigineId !== undefined) updateData.paysOrigine = parseInt(data.paysOrigineId);
        
        // Champs optionnels (peuvent être null ou vides)
        // Gérer à la fois hsCodeId et hscodeId (problème de casse)
        const hsCodeValue = data.hsCodeId || data.hscodeId;
        if (hsCodeValue !== undefined) {
            updateData.hsCode = hsCodeValue ? parseInt(hsCodeValue) : null;
        }
        if (data.numeroCommande !== undefined) updateData.noCommande = data.numeroCommande || null;
        if (data.nomFournisseur !== undefined) updateData.nomFournisseur = data.nomFournisseur || null;
        if (data.numeroFacture !== undefined) updateData.noFacture = data.numeroFacture || null;
        if (data.regimeDeclarationId !== undefined) {
            updateData.regimeDeclaration = data.regimeDeclarationId ? parseInt(data.regimeDeclarationId) : null;
        }
        if (data.regroupementClient !== undefined) updateData.regroupementClient = data.regroupementClient || null;
        
        // Champs numériques
        if (data.quantite !== undefined) updateData.qteColisage = data.quantite;
        if (data.prixUnitaireColis !== undefined) updateData.prixUnitaireColis = data.prixUnitaireColis;
        if (data.poidsBrut !== undefined) updateData.poidsBrut = data.poidsBrut;
        if (data.poidsNet !== undefined) updateData.poidsNet = data.poidsNet;
        if (data.volume !== undefined) updateData.volume = data.volume;
        if (data.ajustementValeur !== undefined) updateData.ajustementValeur = data.ajustementValeur;
        if (data.itemNo !== undefined) updateData.itemNo = data.itemNo || '';
        
        console.log("updateColisage - updateData:", updateData);
        
        const colisage = await prisma.tColisageDossiers.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // Récupérer le dossier pour revalider
        const colisageData = await prisma.tColisageDossiers.findUnique({
            where: { id: parseInt(id) },
            select: { dossier: true },
        });

        if (colisageData) {
            revalidatePath(`/dossiers/${colisageData.dossier}`);
            revalidatePath(`/dossiers/${colisageData.dossier}/colisages/${id}`);
        }
        revalidatePath("/colisage");

        return {
            success: true,
            data: convertDecimalsToNumbers(colisage),
        };
    } catch (error) {
        console.error("updateColisage - Erreur:", error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Supprime un colisage
 */
export async function deleteColisage(id: string) {
    try {
        // Récupérer le dossier avant suppression
        const colisage = await prisma.tColisageDossiers.findUnique({
            where: { id: parseInt(id) },
            select: { dossier: true },
        });

        await prisma.tColisageDossiers.delete({
            where: { id: parseInt(id) },
        });

        if (colisage) {
            revalidatePath(`/dossiers/${colisage.dossier}`);
        }
        revalidatePath("/colisage");

        return { success: true, data: colisage };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les dossiers pour le sélecteur
 */
export async function getAllDossiersForSelect() {
    try {
        const dossiers = await prisma.$queryRaw<any[]>`
            SELECT ID_Dossier as id, No_Dossier as noDossier, No_OT as noOT
            FROM VDossiers
            WHERE ID_Dossier > 0
            ORDER BY Date_Creation DESC
        `;

        return { success: true, data: dossiers };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les HS codes pour le sélecteur
 */
export async function getAllHscodesForSelect() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const hscodes = await prisma.$queryRaw<any[]>`
            SELECT ID_HS_Code as id, HS_Code as code, Libelle_HS_Code as libelle
            FROM VHSCodes
            WHERE ID_HS_Code > 0
            ORDER BY HS_Code ASC
        `;

        return { success: true, data: hscodes };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les devises pour le sélecteur
 */
export async function getAllDevisesForSelect() {
    try {
        const devises = await prisma.$queryRaw<any[]>`
            SELECT ID_Devise as id, Code_Devise as code, Libelle_Devise as libelle
            FROM VDevises
            WHERE ID_Devise > 0
            ORDER BY Code_Devise ASC
        `;

        return { success: true, data: devises };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les pays pour le sélecteur
 */
export async function getAllPaysForSelect() {
    try {
        const pays = await prisma.$queryRaw<any[]>`
            SELECT ID_Pays as id, Code_Pays as code, Libelle_Pays as libelle
            FROM VPays
            WHERE ID_Pays > 0
            ORDER BY Libelle_Pays ASC
        `;

        return { success: true, data: pays };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les régimes de déclaration pour le sélecteur
 */
export async function getAllRegimeDeclarationsForSelect() {
    try {
        const regimes = await prisma.tRegimesDeclarations.findMany({
            where: {
                id: { gt: 0 } // Exclure les valeurs système
            },
            select: {
                id: true,
                libelleRegimeDeclaration: true,
            },
            orderBy: { libelleRegimeDeclaration: "asc" },
        });

        return { success: true, data: regimes.map(r => ({ id: r.id, libelle: r.libelleRegimeDeclaration })) };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Importe des colisages depuis un fichier Excel
 */
export async function importColisagesFromExcel(
    dossierIdOrFormData: number | FormData,
    maybeFormData?: FormData
) {
    try {
        const dossierId =
            typeof dossierIdOrFormData === "number" ? dossierIdOrFormData : undefined;
        const formData =
            dossierIdOrFormData instanceof FormData ? dossierIdOrFormData : maybeFormData;

        if (!formData) {
            return { success: false, error: "FormData manquant" };
        }

        if (!dossierId) {
            return { success: false, error: "dossierId manquant" };
        }

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

        // Lire le fichier en tant que buffer
        const buffer = await file.arrayBuffer();

        // Utiliser xlsx pour parser le fichier
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!worksheet) {
            return { success: false, error: "Aucune feuille trouvée dans le fichier" };
        }

        // Convertir en JSON
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rows.length === 0) {
            return { success: false, error: "Le fichier est vide" };
        }

        // Valider et créer les colisages
        const createdColisages = [];
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Mapper les colonnes Excel vers les champs
                const rowData = {
                    Row_Key: row.Row_Key || row["Row Key"] || `ROW_${i + 1}`,
                    HS_Code: row.HS_Code || row["HS Code"],
                    Descr: row.Descr || row["Description"] || row.description,
                    Command_No: row.Command_No || row["Command No"] || row.numeroCommande,
                    Supplier_Name: row.Supplier_Name || row["Supplier Name"] || row.nomFournisseur,
                    Invoice_No: row.Invoice_No || row["Invoice No"] || row.numeroFacture,
                    Item_No: row.Item_No || row["Item No"] || row.itemNo || '',
                    Currency: row.Currency || row["Currency"] || row.devise,
                    Qty: parseFloat(row.Qty || row["Qty"] || row.quantite) || 1,
                    Unit_Prize: parseFloat(row.Unit_Prize || row["Unit Prize"] || row.prixUnitaire) || 0,
                    Gross_Weight: parseFloat(row.Gross_Weight || row["Gross Weight"] || row.poidsBrut) || 0,
                    Net_Weight: parseFloat(row.Net_Weight || row["Net Weight"] || row.poidsNet) || 0,
                    Volume: parseFloat(row.Volume || row["Volume"] || row.volume) || 0,
                    Country_Origin: row.Country_Origin || row["Country Origin"] || row.paysOrigine,
                    Regime_Code: row.Regime_Code || row["Regime Code"] || row.regime,
                    Customer_Grouping: row.Customer_Grouping || row["Customer Grouping"] || row.regroupement || '-',
                };

                // Trouver la devise par code
                const devise = await prisma.tDevises.findFirst({
                    where: { codeDevise: rowData.Currency },
                });

                if (!devise) {
                    throw new Error(`Devise ${rowData.Currency} non trouvée`);
                }

                // Trouver le pays par code
                const pays = await prisma.tPays.findFirst({
                    where: { codePays: rowData.Country_Origin },
                });

                if (!pays) {
                    throw new Error(`Pays ${rowData.Country_Origin} non trouvé`);
                }

                // Trouver le HS Code si fourni
                let hsCodeId: number | undefined;
                if (rowData.HS_Code) {
                    const hsCode = await prisma.tHSCodes.findFirst({
                        where: { hsCode: rowData.HS_Code },
                    });
                    hsCodeId = hsCode?.id;
                }

                // Trouver le régime si fourni
                let regimeId: number | undefined;
                if (rowData.Regime_Code) {
                    const regime = await prisma.tRegimesDeclarations.findFirst({
                        where: { libelleRegimeDeclaration: { contains: rowData.Regime_Code } },
                    });
                    regimeId = regime?.id;
                }

                // Créer le colisage
                const colisage = await prisma.tColisageDossiers.create({
                    data: {
                        dossier: dossierId,
                        hsCode: hsCodeId,
                        descriptionColis: rowData.Descr,
                        noCommande: rowData.Command_No || '',
                        nomFournisseur: rowData.Supplier_Name || '',
                        noFacture: rowData.Invoice_No || '',
                        itemNo: rowData.Item_No || '',
                        devise: devise.id,
                        qteColisage: rowData.Qty,
                        prixUnitaireColis: rowData.Unit_Prize,
                        poidsBrut: rowData.Gross_Weight,
                        poidsNet: rowData.Net_Weight,
                        volume: rowData.Volume,
                        ajustementValeur: 0,
                        paysOrigine: pays.id,
                        regimeDeclaration: regimeId,
                        regroupementClient: rowData.Customer_Grouping || '-',
                        uploadKey: rowData.Row_Key || '',
                        session: parseInt(session.user.id),
                        dateCreation: new Date(),
                    },
                });

                createdColisages.push(convertDecimalsToNumbers(colisage));
            } catch (error: any) {
                console.log("Erreur ligne", i + 2, ":", error.message);
                errors.push({
                    row: i + 2,
                    error: error.message || "Erreur lors de la création",
                });
            }
        }

        revalidatePath(`/dossiers/${dossierId}`);
        revalidatePath("/colisage");

        return {
            success: true,
            data: {
                created: createdColisages.length,
                total: rows.length,
                errors: errors.length > 0 ? errors : undefined,
            },
        };
    } catch (error) {
        console.error("importColisagesFromExcel error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de l'import" };
    }
}

/**
 * Supprime tous les colisages d'un dossier
 */
export async function deleteAllColisagesByDossierId(dossierId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const result = await prisma.tColisageDossiers.deleteMany({
            where: {
                dossier: dossierId,
            },
        });

        revalidatePath(`/dossiers/${dossierId}`);
        revalidatePath("/colisage");

        return {
            success: true,
            data: { deleted: result.count }
        };
    } catch (error) {
        console.error("deleteAllColisagesByDossierId error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère tous les colisages d'un dossier via VColisageDossiers
 */
export async function getColisagesByDossierId(dossierId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const colisages = await prisma.$queryRaw<any[]>`
            SELECT * FROM VColisageDossiers
            WHERE ID_Dossier = ${dossierId}
            ORDER BY Date_Creation ASC
        `;

        return {
            success: true,
            data: convertDecimalsToNumbers(colisages),
        };
    } catch (error) {
        console.error("getColisagesByDossierId error:", error);
        return { success: false, error };
    }
}

export async function deleteAllColisages() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const result = await prisma.tColisageDossiers.deleteMany({});

        revalidatePath("/colisage");

        return {
            success: true,
            data: { deleted: result.count },
        };
    } catch (error) {
        console.error("deleteAllColisages error:", error);
        return { success: false, error };
    }
}

// Alias de compatibilite: certains composants utilisent encore orderTransitId.
export async function deleteAllColisagesByOrderTransitId(orderTransitId: string | number) {
    const dossierId =
        typeof orderTransitId === "number" ? orderTransitId : parseInt(orderTransitId, 10);

    if (Number.isNaN(dossierId)) {
        return { success: false, error: "orderTransitId invalide" };
    }

    return deleteAllColisagesByDossierId(dossierId);
}

// Alias de compatibilite: certains composants utilisent encore le nom orderTransitId.
export async function getColisagesByOrderTransitId(orderTransitId: string | number) {
    const dossierId =
        typeof orderTransitId === "number" ? orderTransitId : parseInt(orderTransitId, 10);

    if (Number.isNaN(dossierId)) {
        return { success: false, error: "orderTransitId invalide" };
    }

    return getColisagesByDossierId(dossierId);
}

/**
 * Obtenir les statistiques des colisages d'un dossier
 */
export async function getColisagesStats(dossierId: number) {
    try {
        const colisages = await prisma.$queryRaw<any[]>`
            SELECT * FROM VColisageDossiers 
            WHERE ID_Dossier = ${dossierId}
        `;

        const stats = {
            total: colisages.length,
            qteTotal: colisages.reduce((sum, c) => sum + Number(c.Qte_Colis || 0), 0),
            poidsBrutTotal: colisages.reduce((sum, c) => sum + Number(c.Poids_Brut || 0), 0),
            poidsNetTotal: colisages.reduce((sum, c) => sum + Number(c.Poids_Net || 0), 0),
            volumeTotal: colisages.reduce((sum, c) => sum + Number(c.Volume || 0), 0),
            valeurTotal: colisages.reduce(
                (sum, c) => sum + (Number(c.Qte_Colis || 0) * Number(c.Prix_Unitaire_Colis || 0)),
                0
            ),
        };

        return { success: true, data: stats };
    } catch (error: any) {
        console.error('Erreur getColisagesStats:', error);
        return { success: false, error: error.message };
    }
}
