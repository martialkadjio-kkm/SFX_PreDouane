'use server';

import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

/**
 * Récupérer toutes les données nécessaires pour le rapport PDF des colisages
 */
export async function getColisageReportData(dossierId: number) {
    try {
        // Récupérer les informations du dossier
        const dossier = await prisma.vDossiers.findFirst({
            where: { idDossier: dossierId },
            select: {
                idDossier: true,
                noDossier: true,
                noOT: true,
                nomClient: true,
                descriptionDossier: true,
                nomBranche: true,
                nomEntite: true,
            }
        });

        if (!dossier) {
            return { success: false, error: 'Dossier non trouvé' };
        }

        // Récupérer tous les colisages du dossier avec les détails
        const colisages = await prisma.vColisageDossiers.findMany({
            where: { idDossier: dossierId },
            orderBy: [
                { nomFournisseur: 'asc' },
                { regroupementClient: 'asc' },
                { dateCreation: 'asc' }
            ]
        });

        // Récupérer les uploadKeys depuis la table TColisageDossiers
        const uploadKeys = await prisma.tColisageDossiers.findMany({
            where: { dossier: dossierId },
            select: { id: true, uploadKey: true }
        });
        
        const uploadKeyMap = new Map(uploadKeys.map(uk => [uk.id, uk.uploadKey]));

        // Mapper vers les anciens noms de colonnes pour la compatibilité
        const mappedColisages = colisages.map(c => ({
            ID_Colisage_Dossier: c.idColisageDossier,
            HS_Code: c.hsCode,
            Description_Colis: c.descriptionColis,
            No_Commande: c.noCommande,
            Nom_Fournisseur: c.nomFournisseur,
            No_Facture: c.noFacture,
            Item_No: c.itemNo,
            Code_Devise: c.codeDevise,
            Qte_Colis: c.qteColisage,
            Prix_Unitaire_Colis: c.prixUnitaireColis,
            Poids_Brut: c.poidsBrut,
            Poids_Net: c.poidsNet,
            Volume: c.volume,
            Pays_Origine: c.paysOrigine,
            Libelle_Regime_Douanier: c.libelleRegimeDouanier,
            Regroupement_Client: c.regroupementClient,
            UploadKey: uploadKeyMap.get(c.idColisageDossier) || null,
            Date_Creation: c.dateCreation,
        }));

        // Sérialiser les Decimal pour éviter les erreurs de sérialisation
        const serializedColisages = JSON.parse(JSON.stringify(mappedColisages));

        // Informations du dossier pour le rapport
        const dossierInfo = {
            id: dossier.idDossier,
            noDossier: dossier.noDossier,
            noOT: dossier.noOT,
            nomClient: dossier.nomClient,
            descriptionDossier: dossier.descriptionDossier,
            nomBranche: dossier.nomBranche,
            nomEntite: dossier.nomEntite,
        };

        return { 
            success: true, 
            data: {
                dossierInfo: JSON.parse(JSON.stringify(dossierInfo)),
                colisages: serializedColisages
            }
        };
    } catch (error: any) {
        console.error('Erreur getColisageReportData:', error);
        return { success: false, error: error.message };
    }
}