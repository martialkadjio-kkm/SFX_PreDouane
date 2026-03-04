'use server';

/**
 * Server Actions pour la gestion des Colisages dans un Dossier
 * Utilise VColisageDossiers pour les lectures et TColisageDossiers pour les écritures
 */

import { PrismaClient } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

/**
 * Obtenir tous les colisages d'un dossier
 * Utilise la vue VColisageDossiers qui contient toutes les jointures
 */
export async function getColisagesDossier(dossierId: number) {
    try {
        const colisages = await prisma.vColisageDossiers.findMany({
            where: { idDossier: dossierId },
            orderBy: { dateCreation: 'asc' },
            distinct: "idColisageDossier"
        });

        // Récupérer les uploadKeys depuis la table TColisageDossiers
        const uploadKeys = await prisma.tColisageDossiers.findMany({
            where: { dossier: dossierId },
            select: { id: true, uploadKey: true }
        });
        
        const uploadKeyMap = new Map(uploadKeys.map(uk => [uk.id, uk.uploadKey]));

        // Mapper vers les anciens noms de colonnes pour la compatibilité frontend
        const mappedColisages = colisages.map(c => ({
            ID_Colisage_Dossier: c.idColisageDossier,
            ID_Dossier: c.idDossier,
            HS_Code: c.hsCode,
            Description_Colis: c.descriptionColis,
            No_Commande: c.noCommande,
            Nom_Fournisseur: c.nomFournisseur,
            No_Facture: c.noFacture,
            Item_No: c.itemNo,
            Code_Devise: c.codeDevise,
            Qte_Colis: c.qteColisage,
            Prix_Unitaire_Colis: c.prixUnitaireColis,
            Valeur_Colis: Number(c.qteColisage) * Number(c.prixUnitaireColis), // Calculé
            Poids_Brut: c.poidsBrut,
            Poids_Net: c.poidsNet,
            Volume: c.volume,
            Pays_Origine: c.paysOrigine,
            ID_Regime_Declaration: c.idRegimeDeclaration,
            ID_Regime_Douanier: c.idRegimeDouanier,
            Libelle_Regime_Declaration: c.libelleRegimeDeclaration, // Afficher le libellé de déclaration
            Regroupement_Client: c.regroupementClient,
            UploadKey: uploadKeyMap.get(c.idColisageDossier) || null, // Récupéré depuis TColisageDossiers
            Date_Creation: c.dateCreation,
            Nom_Creation: c.nomCreation,
        }));

        // Sérialiser les Decimal pour éviter les erreurs de sérialisation
        const serializedColisages = JSON.parse(JSON.stringify(mappedColisages));

        return { success: true, data: serializedColisages };
    } catch (error: any) {
        console.error('Erreur getColisagesDossier:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir un colisage par son ID
 * Résout les IDs manquants (devise, pays) à partir des codes/libellés
 */
export async function getColisageById(id: number) {
    try {
        const colisage = await prisma.vColisageDossiers.findFirst({
            where: { idColisageDossier: id }
        });

        if (!colisage) {
            return { success: false, error: 'Colisage non trouvé' };
        }

        // Récupérer l'uploadKey depuis la table TColisageDossiers
        const uploadKeyData = await prisma.tColisageDossiers.findUnique({
            where: { id: colisage.idColisageDossier },
            select: { uploadKey: true }
        });

        // Mapper vers les anciens noms de colonnes pour la compatibilité frontend
        const mappedColisage = {
            ID_Colisage_Dossier: colisage.idColisageDossier,
            ID_Dossier: colisage.idDossier,
            HS_Code: colisage.hsCode,
            Description_Colis: colisage.descriptionColis,
            No_Commande: colisage.noCommande,
            Nom_Fournisseur: colisage.nomFournisseur,
            No_Facture: colisage.noFacture,
            Item_No: colisage.itemNo,
            Code_Devise: colisage.codeDevise,
            Qte_Colis: colisage.qteColisage,
            Prix_Unitaire_Colis: colisage.prixUnitaireColis,
            Poids_Brut: colisage.poidsBrut,
            Poids_Net: colisage.poidsNet,
            Volume: colisage.volume,
            Pays_Origine: colisage.paysOrigine,
            ID_Regime_Declaration: colisage.idRegimeDeclaration,
            ID_Regime_Douanier: colisage.idRegimeDouanier,
            Libelle_Regime_Declaration: colisage.libelleRegimeDeclaration, // Afficher le libellé de déclaration
            Regroupement_Client: colisage.regroupementClient,
            UploadKey: uploadKeyData?.uploadKey || null, // Récupéré depuis TColisageDossiers
            Date_Creation: colisage.dateCreation,
            Nom_Creation: colisage.nomCreation,
        };

        // Sérialiser les Decimal pour éviter les erreurs de sérialisation
        const serializedColisage = JSON.parse(JSON.stringify(mappedColisage));

        // Résoudre les IDs manquants
        // 1. ID_Devise à partir de Code_Devise
        if (serializedColisage.Code_Devise && !serializedColisage.ID_Devise) {
            const devise = await prisma.vDevises.findFirst({
                where: { codeDevise: serializedColisage.Code_Devise },
                select: { idDevise: true }
            });
            if (devise) {
                serializedColisage.ID_Devise = devise.idDevise;
            }
        }

        // 2. ID_Pays_Origine à partir de Pays_Origine
        if (serializedColisage.Pays_Origine && !serializedColisage.ID_Pays_Origine) {
            const pays = await prisma.vPays.findFirst({
                where: { libellePays: serializedColisage.Pays_Origine },
                select: { idPays: true }
            });
            if (pays) {
                serializedColisage.ID_Pays_Origine = pays.idPays;
            }
        }

        // 3. ID_HS_Code à partir de HS_Code (string)
        if (serializedColisage.HS_Code && !serializedColisage.ID_HS_Code) {
            const hsCode = await prisma.vHSCodes.findFirst({
                where: { hsCode: serializedColisage.HS_Code },
                select: { idHSCode: true }
            });
            if (hsCode) {
                serializedColisage.ID_HS_Code = hsCode.idHSCode;
            }
        }

        return { success: true, data: serializedColisage };
    } catch (error: any) {
        console.error('Erreur getColisageById:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Type pour la création d'un colisage
 */
export interface CreateColisageInput {
    dossier: number;
    hsCode?: number;
    descriptionColis: string;
    noCommande?: string;
    nomFournisseur?: string;
    noFacture?: string;
    itemNo?: string;
    devise: number;
    qteColisage?: number;
    prixUnitaireColis?: number;
    ajustementValeur?: number;
    poidsBrut?: number;
    poidsNet?: number;
    volume?: number;
    paysOrigine: number;
    regimeDeclaration?: number;
    regroupementClient?: string;
    uploadKey?: string;
    sessionId: number;
}

/**
 * Créer un nouveau colisage
 * Utilise la table TColisageDossiers
 */
export async function createColisage(input: CreateColisageInput) {
    try {
        const colisage = await prisma.tColisageDossiers.create({
            data: {
                dossier: input.dossier,
                hsCode: input.hsCode,
                descriptionColis: input.descriptionColis,
                noCommande: input.noCommande || '',
                nomFournisseur: input.nomFournisseur || '',
                noFacture: input.noFacture || '',
                itemNo: input.itemNo || "",
                devise: input.devise,
                qteColisage: input.qteColisage || 1,
                prixUnitaireColis: input.prixUnitaireColis || 0,
                ajustementValeur: input.ajustementValeur || 0,
                poidsBrut: input.poidsBrut || 0,
                poidsNet: input.poidsNet || 0,
                volume: input.volume || 0,
                paysOrigine: input.paysOrigine,
                regimeDeclaration: input.regimeDeclaration,
                regroupementClient: input.regroupementClient || '-',
                uploadKey: input.uploadKey || '',
                session: input.sessionId,
                dateCreation: new Date(),
            },
        });

        revalidatePath(`/dossiers/${input.dossier}/colisages`);
        return { success: true, data: colisage };
    } catch (error: any) {
        console.error('Erreur createColisage:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Type pour la mise à jour d'un colisage
 */
export interface UpdateColisageInput {
    id: number;
    hsCode?: number;
    descriptionColis?: string;
    noCommande?: string;
    nomFournisseur?: string;
    noFacture?: string;
    itemNo?: string;
    devise?: number;
    qteColisage?: number;
    prixUnitaireColis?: number;
    poidsBrut?: number;
    poidsNet?: number;
    volume?: number;
    paysOrigine?: number;
    regimeDeclaration?: number;
    regroupementClient?: string;
}

/**
 * Mettre à jour un colisage
 */
export async function updateColisage(input: UpdateColisageInput) {
    try {
        const { id, ...data } = input;

        const colisage = await prisma.tColisageDossiers.update({
            where: { id },
            data,
        });

        // Récupérer le dossier pour revalider
        const colisageData = await prisma.tColisageDossiers.findUnique({
            where: { id },
            select: { dossier: true },
        });

        if (colisageData) {
            revalidatePath(`/dossiers/${colisageData.dossier}/colisages`);
        }

        return { success: true, data: colisage };
    } catch (error: any) {
        console.error('Erreur updateColisage:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer un colisage
 */
export async function deleteColisage(id: string | number) {
    try {
        const colisageId = typeof id === 'string' ? parseInt(id) : id;
        
        // Récupérer le dossier avant suppression
        const colisage = await prisma.tColisageDossiers.findUnique({
            where: { id: colisageId },
            select: { dossier: true },
        });

        await prisma.tColisageDossiers.delete({
            where: { id: colisageId },
        });

        if (colisage) {
            revalidatePath(`/dossiers/${colisage.dossier}/colisages`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Erreur deleteColisage:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Type pour l'import Excel
 */
export interface ImportColisageRow {
    Row_Key: string;
    HS_Code?: string;
    Descr: string;
    Command_No?: string;
    Supplier_Name?: string;
    Invoice_No?: string;
    Currency: string;
    Qty?: number;
    Unit_Prize?: number;
    Gross_Weight?: number;
    Net_Weight?: number;
    Volume?: number;
    Country_Origin: string;
    Regime_Code?: string;
    Customer_Grouping?: string;
}

/**
 * Importer des colisages depuis Excel/CSV
 * Format attendu: voir ImportColisageRow
 */
export async function importColisagesExcel(
    dossierId: number,
    rows: ImportColisageRow[],
    sessionId: number
) {
    try {
        let imported = 0;
        let errors: string[] = [];

        for (const row of rows) {
            try {
                // Trouver la devise par code
                const devise = await prisma.tDevises.findFirst({
                    where: { codeDevise: row.Currency },
                });

                if (!devise) {
                    errors.push(`Devise ${row.Currency} non trouvée pour ${row.Row_Key}`);
                    continue;
                }

                // Trouver le pays par code
                const pays = await prisma.tPays.findFirst({
                    where: { codePays: row.Country_Origin },
                });

                if (!pays) {
                    errors.push(`Pays ${row.Country_Origin} non trouvé pour ${row.Row_Key}`);
                    continue;
                }

                // Trouver le HS Code si fourni
                let hsCodeId: number | undefined;
                if (row.HS_Code) {
                    const hsCode = await prisma.tHSCodes.findFirst({
                        where: { hsCode: row.HS_Code },
                    });
                    hsCodeId = hsCode?.id;
                }

                // Trouver le régime si fourni
                let regimeId: number | undefined;
                if (row.Regime_Code) {
                    const regime = await prisma.tRegimesDeclarations.findFirst({
                        where: { libelleRegimeDeclaration: { contains: row.Regime_Code } },
                    });
                    regimeId = regime?.id;
                }

                await prisma.tColisageDossiers.create({
                    data: {
                        dossier: dossierId,
                        hsCode: hsCodeId,
                        descriptionColis: row.Descr,
                        noCommande: row.Command_No || '',
                        nomFournisseur: row.Supplier_Name || '',
                        noFacture: row.Invoice_No || '',
                        itemNo: '',
                        devise: devise.id,
                        qteColisage: row.Qty || 1,
                        prixUnitaireColis: row.Unit_Prize || 0,
                        ajustementValeur: 0,
                        poidsBrut: row.Gross_Weight || 0,
                        poidsNet: row.Net_Weight || 0,
                        volume: row.Volume || 0,
                        paysOrigine: pays.id,
                        regimeDeclaration: regimeId,
                        regroupementClient: row.Customer_Grouping || '-',
                        uploadKey: row.Row_Key || '',
                        session: sessionId,
                        dateCreation: new Date(),
                    },
                });

                imported++;
            } catch (error: any) {
                errors.push(`Erreur ligne ${row.Row_Key}: ${error.message}`);
            }
        }

        revalidatePath(`/dossiers/${dossierId}/colisages`);

        return {
            success: true,
            data: {
                imported,
                total: rows.length,
                errors,
            },
        };
    } catch (error: any) {
        console.error('Erreur importColisagesExcel:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir les statistiques des colisages d'un dossier
 */
export async function getColisagesStats(dossierId: number) {
    try {
        const colisages = await prisma.vColisageDossiers.findMany({
            where: { idDossier: dossierId },
            select: {
                qteColisage: true,
                poidsBrut: true,
                poidsNet: true,
                volume: true,
                prixUnitaireColis: true
            }
        });

        // Sérialiser les Decimal pour les calculs
        const serializedColisages = JSON.parse(JSON.stringify(colisages));

        const stats = {
            total: serializedColisages.length,
            qteTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.qteColisage || 0), 0),
            poidsBrutTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.poidsBrut || 0), 0),
            poidsNetTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.poidsNet || 0), 0),
            volumeTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.volume || 0), 0),
            valeurTotal: serializedColisages.reduce(
                (sum: number, c: any) => sum + Number(c.qteColisage || 0) * Number(c.prixUnitaireColis || 0),
                0
            ),
        };

        return { success: true, data: stats };
    } catch (error: any) {
        console.error('Erreur getColisagesStats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Actions simples pour récupérer les données de référence
 */

// Actions compatibles avec le formulaire du module colisage (format: id, code, libelle)
export async function getAllHscodesForSelect() {
    try {
        const hscodes = await prisma.vHSCodes.findMany({
            select: {
                idHSCode: true,
                hsCode: true,
                libelleHSCode: true
            },
            orderBy: { hsCode: 'asc' }
        });
        
        // Mapper vers le format attendu
        const mappedData = hscodes.map(h => ({
            id: h.idHSCode,
            code: h.hsCode,
            libelle: h.libelleHSCode
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllHscodesForSelect:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllDevisesForSelect() {
    try {
        const devises = await prisma.vDevises.findMany({
            where: { idDevise: { gt: 0 } },
            select: {
                idDevise: true,
                codeDevise: true,
                libelleDevise: true
            },
            orderBy: { codeDevise: 'asc' }
        });
        
        // Mapper vers le format attendu
        const mappedData = devises.map(d => ({
            id: d.idDevise,
            code: d.codeDevise,
            libelle: d.libelleDevise
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllDevisesForSelect:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllPaysForSelect() {
    try {
        const pays = await prisma.vPays.findMany({
            where: {},
            select: {
                idPays: true,
                codePays: true,
                libellePays: true
            },
            orderBy: { libellePays: 'asc' }
        });
        
        // Mapper vers le format attendu
        const mappedData = pays.map(p => ({
            id: p.idPays,
            code: p.codePays,
            libelle: p.libellePays
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllPaysForSelect:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllRegimeDeclarationsForSelect() {
    try {
        const regimes = await prisma.vRegimesDeclarations.findMany({
            select: {
                idRegimeDeclaration: true,
                libelleRegimeDeclaration: true
            },
            distinct : "idRegimeDeclaration",
            orderBy: { libelleRegimeDeclaration: 'asc' }
        });
        
        // Mapper vers le format attendu
        const mappedData = regimes.map(r => ({
            id: r.idRegimeDeclaration,
            libelle: r.libelleRegimeDeclaration
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllRegimeDeclarationsForSelect:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupère un colisage au format du module colisage (pour le formulaire)
 */
export async function getColisageForEdit(id: number) {
    try {
        const colisage = await prisma.vColisageDossiers.findFirst({
            where: { idColisageDossier: id }
        });

        if (!colisage) {
            return { success: false, error: 'Colisage non trouvé' };
        }

        // Récupérer l'uploadKey depuis la table TColisageDossiers
        const uploadKeyData = await prisma.tColisageDossiers.findUnique({
            where: { id: colisage.idColisageDossier },
            select: { uploadKey: true }
        });

        // Mapper vers les anciens noms de colonnes pour la compatibilité frontend
        const mappedColisage = {
            ID_Colisage_Dossier: colisage.idColisageDossier,
            ID_Dossier: colisage.idDossier,
            HS_Code: colisage.hsCode,
            Description_Colis: colisage.descriptionColis,
            No_Commande: colisage.noCommande,
            Nom_Fournisseur: colisage.nomFournisseur,
            No_Facture: colisage.noFacture,
            Item_No: colisage.itemNo,
            Code_Devise: colisage.codeDevise,
            Qte_Colis: colisage.qteColisage,
            Prix_Unitaire_Colis: colisage.prixUnitaireColis,
            Poids_Brut: colisage.poidsBrut,
            Poids_Net: colisage.poidsNet,
            Volume: colisage.volume,
            Pays_Origine: colisage.paysOrigine,
            ID_Regime_Declaration: colisage.idRegimeDeclaration,
            ID_Regime_Douanier: colisage.idRegimeDouanier,
            Libelle_Regime_Declaration: colisage.libelleRegimeDeclaration, // Afficher le libellé de déclaration
            Regroupement_Client: colisage.regroupementClient,
            UploadKey: uploadKeyData?.uploadKey || null, // Récupéré depuis TColisageDossiers
            Date_Creation: colisage.dateCreation,
            Nom_Creation: colisage.nomCreation,
        };

        const serializedColisage = JSON.parse(JSON.stringify(mappedColisage));

        // Résoudre les IDs manquants
        if (serializedColisage.Code_Devise && !serializedColisage.ID_Devise) {
            const devise = await prisma.vDevises.findFirst({
                where: { codeDevise: serializedColisage.Code_Devise },
                select: { idDevise: true }
            });
            if (devise) {
                serializedColisage.ID_Devise = devise.idDevise;
            }
        }

        if (serializedColisage.Pays_Origine && !serializedColisage.ID_Pays_Origine) {
            const pays = await prisma.vPays.findFirst({
                where: { libellePays: serializedColisage.Pays_Origine },
                select: { idPays: true }
            });
            if (pays) {
                serializedColisage.ID_Pays_Origine = pays.idPays;
            }
        }

        if (serializedColisage.HS_Code && !serializedColisage.ID_HS_Code) {
            const hsCode = await prisma.vHSCodes.findFirst({
                where: { hsCode: serializedColisage.HS_Code },
                select: { idHSCode: true }
            });
            if (hsCode) {
                serializedColisage.ID_HS_Code = hsCode.idHSCode;
            }
        }

        // Convertir au format attendu par le formulaire du module colisage
        const formattedColisage = {
            id: serializedColisage.ID_Colisage_Dossier.toString(),
            description: serializedColisage.Description_Colis || "",
            numeroCommande: serializedColisage.No_Commande || null,
            nomFournisseur: serializedColisage.Nom_Fournisseur || null,
            numeroFacture: serializedColisage.No_Facture || null,
            quantite: Number(serializedColisage.Qte_Colis) || 1,
            prixUnitaireColis: Number(serializedColisage.Prix_Unitaire_Colis) || 0,
            poidsBrut: Number(serializedColisage.Poids_Brut) || 0,
            poidsNet: Number(serializedColisage.Poids_Net) || 0,
            volume: Number(serializedColisage.Volume) || 0,
            regroupementClient: serializedColisage.Regroupement_Client || null,
            hscodeId: serializedColisage.ID_HS_Code?.toString() || null,
            deviseId: serializedColisage.ID_Devise?.toString() || undefined,
            paysOrigineId: serializedColisage.ID_Pays_Origine?.toString() || undefined,
            regimeDeclarationId: serializedColisage.ID_Regime_Declaration?.toString() || null,
        };

        return { success: true, data: formattedColisage };
    } catch (error: any) {
        console.error('Erreur getColisageForEdit:', error);
        return { success: false, error: error.message };
    }
}