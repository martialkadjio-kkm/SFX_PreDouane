/**
 * Wrappers TypeScript pour les procédures stockées SQL Server
 */

import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

/**
 * Créer les notes de détail pour un dossier
 * Appelle la procédure stockée pSP_CreerNoteDetail
 * 
 * Cette procédure:
 * - Valide que le dossier est en cours (statut = 0)
 * - Vérifie les taux de change pour toutes les devises utilisées
 * - Vérifie que tous les colisages ont un HS Code et un régime
 * - Crée les notes de détail avec split DC/TR selon les ratios
 * - Clôture le dossier (statut = -1)
 * - Crée l'étape de clôture (ID 1000000)
 * - Recalcule la dernière étape
 * 
 * @param dossierId - ID du dossier
 * @throws Error si validation échoue ou erreur SQL
 */
export async function creerNoteDetail(dossierId: number): Promise<void> {
    try {
        await prisma.$executeRaw`EXEC pSP_CreerNoteDetail @Id_Dossier = ${dossierId}`;
    } catch (error: any) {
        // Parser l'erreur SQL Server
        const message = error.message || 'Erreur inconnue';

        // Extraire le message d'erreur de la procédure stockée
        if (message.includes('FILE IS NOT IN PROGRESS')) {
            throw new Error('Le dossier n\'est pas en cours. Seuls les dossiers en cours peuvent avoir des notes créées.');
        } else if (message.includes('MISSING OR WRONG EXCHANGE RATE')) {
            const match = message.match(/\{([^}]+)\}/);
            const devises = match ? match[1] : 'inconnues';
            throw new Error(`Taux de change manquants ou incorrects pour les devises: ${devises}`);
        } else if (message.includes('MISSING PACKING LIST')) {
            throw new Error('Aucun colisage trouvé pour ce dossier. Ajoutez des colisages avant de créer les notes.');
        } else if (message.includes('MISSING HS CODE OR REGIME')) {
            const match = message.match(/\{([^}]+)\}/);
            const lignes = match ? match[1] : 'certaines lignes';
            throw new Error(`HS Code ou régime manquant pour: ${lignes}`);
        }

        throw new Error(`Erreur lors de la création des notes de détail: ${message}`);
    }
}

/**
 * Supprimer les notes de détail d'un dossier
 * Appelle la procédure stockée pSP_SupprimerNoteDetail
 * 
 * Cette procédure:
 * - Valide que le dossier est complété (statut = -1)
 * - Supprime toutes les notes de détail du dossier
 * - Supprime l'étape de clôture (ID 1000000)
 * - Réouvre le dossier (statut = 0)
 * - Recalcule la dernière étape
 * 
 * @param dossierId - ID du dossier
 * @throws Error si validation échoue ou erreur SQL
 */
export async function supprimerNoteDetail(dossierId: number): Promise<void> {
    try {
        await prisma.$executeRaw`EXEC pSP_SupprimerNoteDetail @Id_Dossier = ${dossierId}`;
    } catch (error: any) {
        const message = error.message || 'Erreur inconnue';

        if (message.includes('FILE WAS NOT COMPLETED')) {
            throw new Error('Le dossier n\'a pas été complété. Seuls les dossiers complétés peuvent avoir leurs notes supprimées.');
        }

        throw new Error(`Erreur lors de la suppression des notes de détail: ${message}`);
    }
}

/**
 * Recalculer la dernière étape d'un ou plusieurs dossiers
 * Appelle la procédure stockée pSP_RecalculeDerniereEtapeDossier
 * 
 * Cette procédure met à jour le champ [Derniere Etape Dossier] avec l'ID
 * de l'étape la plus récente (basé sur Date Fin ou Date Debut et Index Etape)
 * 
 * @param dossierId - ID du dossier (optionnel). Si omis, recalcule pour tous les dossiers
 */
export async function recalculeDerniereEtape(dossierId?: number): Promise<void> {
    try {
        const id = dossierId || 0;
        await prisma.$executeRaw`EXEC pSP_RecalculeDerniereEtapeDossier @Dossier = ${id}`;
    } catch (error: any) {
        const message = error.message || 'Erreur inconnue';
        throw new Error(`Erreur lors du recalcul de la dernière étape: ${message}`);
    }
}

export default {
    creerNoteDetail,
    supprimerNoteDetail,
    recalculeDerniereEtape,
};
