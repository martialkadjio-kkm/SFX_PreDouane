"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/server/actions";

/**
 * Récupérer les taux de change d'une conversion via VTauxChange
 */
export async function getTauxChangeByConversion(conversionId: string) {
    try {
        const id = parseInt(conversionId);
        if (isNaN(id)) {
            return { success: false, error: "ID invalide" };
        }

        const taux = await prisma.$queryRaw<any[]>`
            SELECT 
                tc.[ID Taux Change] as ID_Taux_Change,
                tc.[Convertion] as ID_Convertion,
                tc.[Devise] as ID_Devise,
                d.[Code Devise] as Devise,
                tc.[Taux Change] as Taux_Change,
                tc.[Date Creation] as Date_Creation
            FROM TTauxChange tc
            INNER JOIN TDevises d ON tc.[Devise] = d.[ID Devise]
            WHERE tc.[Convertion] = ${id}
                AND tc.[Devise] != 0
            ORDER BY d.[Code Devise] ASC
        `;

        // Convertir les Decimal en nombres pour les composants client
        const serializedTaux = taux.map(t => ({
            ...t,
            Taux_Change: t.Taux_Change ? Number(t.Taux_Change) : 0,
        }));

        return { success: true, data: serializedTaux };
    } catch (error) {
        console.error("Erreur lors de la récupération des taux:", error);
        return { success: false, error: "Impossible de récupérer les taux de change" };
    }
}

/**
 * Récupérer toutes les devises actives pour le select via la table TDevises
 */
export async function getAllDevisesForSelect() {
    try {
        const devises = await prisma.tDevises.findMany({
            where: {
                deviseInactive: false,
                codeDevise: {
                    not: ''
                },
                // Exclure la devise locale (ID 0) car son taux est toujours 1.0 automatiquement
                id: {
                    not: 0
                }
            },
            select: {
                id: true,
                codeDevise: true,
                libelleDevise: true
            },
            orderBy: {
                codeDevise: 'asc'
            }
        });
        
        // Renommer id en idDevise pour la cohérence
        const formattedDevises = devises.map(d => ({
            idDevise: d.id,
            codeDevise: d.codeDevise,
            libelleDevise: d.libelleDevise
        }));
        
        return { success: true, data: formattedDevises };
    } catch (error) {
        console.error("Erreur récupération devises:", error);
        return { success: false, error: "Erreur lors de la récupération des devises" };
    }
}

/**
 * Créer un taux de change
 */
export async function createTauxChange(data: any) {
    try {
        const session = await getSession();
        if (!session.user) {
            return { success: false, error: "Non authentifié" };
        }

        const conversionId = parseInt(data.conversionId);
        const deviseId = parseInt(data.deviseId);
        const tauxChange = parseFloat(data.tauxChange);

        if (isNaN(conversionId) || isNaN(deviseId) || isNaN(tauxChange)) {
            return { success: false, error: "Données invalides" };
        }

        const dateCreation = new Date();

        await prisma.$executeRaw`
            INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
            VALUES (${conversionId}, ${deviseId}, ${tauxChange}, ${session.user.id}, ${dateCreation})
        `;

        revalidatePath(`/conversion/${data.conversionId}`);
        return { success: true };
    } catch (error) {
        console.error("Erreur création taux:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création"
        };
    }
}

/**
 * Supprimer un taux de change
 */
export async function deleteTauxChange(id: string, conversionId: string) {
    try {
        const tauxId = parseInt(id);
        if (isNaN(tauxId)) {
            return { success: false, error: "ID invalide" };
        }

        // Vérifier si c'est la devise locale (ID 0) - ne pas permettre la suppression
        const tauxInfo = await prisma.$queryRaw<Array<{Devise: number}>>`
            SELECT [Devise] FROM TTauxChange WHERE [ID Taux Change] = ${tauxId}
        `;

        if (tauxInfo.length > 0 && tauxInfo[0].Devise === 0) {
            return { 
                success: false, 
                error: "Impossible de supprimer le taux de la devise locale (toujours 1.0)" 
            };
        }

        await prisma.$executeRaw`
            DELETE FROM TTauxChange
            WHERE [ID Taux Change] = ${tauxId}
        `;

        revalidatePath(`/conversion/${conversionId}`);
        return { success: true };
    } catch (error) {
        console.error("Erreur suppression taux:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la suppression"
        };
    }
}
