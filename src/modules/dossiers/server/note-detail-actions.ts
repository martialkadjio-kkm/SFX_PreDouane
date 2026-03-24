"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/server/actions";

// Récupère les devises utilisées dans le colisage avec leur poids (valeur totale)
export async function getDevisesColisageDossier(dossierId: number) {
    try {
        const devises = await prisma.$queryRaw<any[]>`
            SELECT 
                d.[ID Devise] as id,
                d.[Code Devise] as code,
                d.[Libelle Devise] as libelle,
                COUNT(cd.[ID Colisage Dossier]) as nbColisages,
                SUM(cd.[Qte Colis] * cd.[Prix Unitaire Colis]) as valeurTotale
            FROM TColisageDossiers cd
            INNER JOIN TDevises d ON cd.[Devise] = d.[ID Devise]
            WHERE cd.[Dossier] = ${dossierId}
            GROUP BY d.[ID Devise], d.[Code Devise], d.[Libelle Devise]
            ORDER BY valeurTotale DESC
        `;
        return { success: true, data: JSON.parse(JSON.stringify(devises)) };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

// Vérifie si une conversion existe à cette date pour l'entité du dossier,
// et si tous les taux sont disponibles pour la devise cible via fx_EvalTauxChangeDossier
export async function checkConversionEtTaux(
    dossierId: number,
    dateDeclaration: Date,
    deviseId: number
) {
    try {
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: { branche: true }
        });
        if (!dossier) return { success: false, exists: false, error: "Dossier non trouvé" };

        const branche = await prisma.tBranches.findUnique({
            where: { id: dossier.branche },
            select: { entite: true }
        });
        if (!branche) return { success: false, exists: false, error: "Branche non trouvée" };

        const dateStr = dateDeclaration.toISOString().split("T")[0];
        const conversions = await prisma.$queryRaw<any[]>`
            SELECT [ID Convertion]
            FROM TConvertions
            WHERE CAST([Date Convertion] AS DATE) = CAST(${dateStr} AS DATE)
                AND [Entite] = ${branche.entite}
        `;

        if (conversions.length === 0) {
            return { success: true, exists: false, tauxOk: false };
        }

        const conversionId = conversions[0]["ID Convertion"];

        // Vérifier les taux disponibles via fx_EvalTauxChangeDossier (même logique que la page conversions)
        const dateISO = dateDeclaration.toISOString().replace("T", " ").slice(0, 23);
        const tauxRows = await prisma.$queryRawUnsafe<any[]>(
            `DECLARE @d datetime2 = '${dateISO}'; SELECT [ID_Devise],[Code_Devise],[Taux_Change] FROM [dbo].[fx_EvalTauxChangeDossier](${dossierId},${deviseId},@d)`
        );

        const manquants = tauxRows.filter((r: any) => r.Taux_Change === null).map((r: any) => r.Code_Devise);

        return {
            success: true,
            exists: true,
            conversionId,
            tauxOk: manquants.length === 0,
            devisesManquantes: manquants,
            taux: JSON.parse(JSON.stringify(tauxRows)),
        };
    } catch (error) {
        return { success: false, exists: false, tauxOk: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

// Génère la note de détail — appelle pSP_CreerNoteDetail avec les 4 paramètres
export async function genererNotesDetail(dossierId: number, dateDeclaration: Date, deviseId: number) {
    try {
        const session = await getSession();
        if (!session.user) return { success: false, error: "Non authentifié" };

        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: { statutDossier: true, branche: true }
        });
        if (!dossier) return { success: false, error: "Dossier non trouvé" };
        if (dossier.statutDossier !== 0) return { success: false, error: "Le dossier doit être en cours (statut = 0)" };

        const branche = await prisma.tBranches.findUnique({
            where: { id: dossier.branche },
            select: { entite: true }
        });
        if (!branche) return { success: false, error: "Branche non trouvée" };

        const dateStr = dateDeclaration.toISOString().split("T")[0];
        const conversions = await prisma.$queryRaw<any[]>`
            SELECT [ID Convertion], [Date Convertion]
            FROM TConvertions
            WHERE CAST([Date Convertion] AS DATE) = CAST(${dateStr} AS DATE)
                AND [Entite] = ${branche.entite}
        `;
        if (conversions.length === 0) return { success: false, error: "Aucune conversion trouvée pour cette date" };

        const dateConversionExacte = conversions[0]["Date Convertion"];
        const dateConversionDate = dateConversionExacte instanceof Date
            ? dateConversionExacte
            : new Date(dateConversionExacte);
        const dateISO = dateConversionDate.toISOString().replace("T", " ").slice(0, 23);

        try {
            await prisma.$executeRawUnsafe(
                `DECLARE @d datetime2 = '${dateISO}'; EXEC [dbo].[pSP_CreerNoteDetail] @Id_Dossier = ${dossierId}, @DateDeclaration = @d, @Id_DeviseNoteDetail = ${deviseId}`
            );
        } catch (procError: any) {
            let errorMsg = procError.message || "Erreur inconnue";
            if (errorMsg.includes("FILE IS NOT IN PROGRESS")) errorMsg = "Le dossier doit être en cours (statut = 0)";
            else if (errorMsg.includes("NO EXCHANGE RATE")) errorMsg = "Aucun taux de change à cette date pour cette entité";
            else if (errorMsg.includes("MISSING EXCHANGE RATE FOR CURRENCIES")) errorMsg = "Taux de change manquant pour certaines devises";
            else if (errorMsg.includes("MISSING PACKING LIST")) errorMsg = "Aucun colisage trouvé";
            else if (errorMsg.includes("MISSING HS CODE OR REGIME")) errorMsg = "HS Code ou régime manquant sur certains colisages";
            else if (errorMsg.includes("MISSING Gross Weight")) errorMsg = "Poids brut ou nombre de paquetages manquant sur l'en-tête";
            return { success: false, error: errorMsg };
        }

        revalidatePath(`/dossiers/${dossierId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la génération" };
    }
}

export async function supprimerNotesDetail(dossierId: number) {
    try {
        const session = await getSession();
        if (!session.user) return { success: false, error: "Non authentifié" };

        await prisma.$executeRaw`EXEC [dbo].[pSP_SupprimerNoteDetail] @Id_Dossier = ${dossierId}`;

        revalidatePath(`/dossiers/${dossierId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la suppression" };
    }
}

export async function getNotesDetail(dossierId: number) {
    try {
        const notes = await prisma.$queryRaw<any[]>`
            SELECT * FROM VNotesDetail
            WHERE ID_Dossier = ${dossierId}
            ORDER BY Regroupement_Client, Regime
        `;
        const serializedNotes = JSON.parse(JSON.stringify(notes));
        const mappedNotes = serializedNotes.map((n: any) => ({
            ...n,
            Nbre_Paquetage: n.Nbre_Paquetage,
            Qte_Colis: n.Qte_Colis,
            Valeur: n.Valeur,
            Code_Devise: n.Code_Devise_Note_Detail,
            Poids_Brut: n.Base_Poids_Brut ?? n.Poids_Brut,
            Poids_Net: n.Base_Poids_Net ?? n.Poids_Net,
            Volume: n.Base_Volume ?? n.Volume,
        }));
        return { success: true, data: mappedNotes };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la récupération" };
    }
}

export async function getTauxChangeDossier(dossierId: number) {
    try {
        const dossierConv = await prisma.$queryRaw<any[]>`
            SELECT c.[Date Convertion] as dateConvertion,
                   d.[Devise Note Detail] as deviseNoteDetail
            FROM TDossiers d
            INNER JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
            WHERE d.[ID Dossier] = ${dossierId}
        `;

        if (!dossierConv || dossierConv.length === 0) {
            return { success: true, data: [], dateDeclaration: null };
        }

        const dateConvertion = dossierConv[0].dateConvertion;
        const deviseNoteDetail = dossierConv[0].deviseNoteDetail;
        const dateConvertionDate = dateConvertion instanceof Date ? dateConvertion : new Date(dateConvertion);
        const dateISO = dateConvertionDate.toISOString().replace("T", " ").slice(0, 23);

        const tauxChange = await prisma.$queryRawUnsafe<any[]>(
            `DECLARE @d datetime2 = '${dateISO}'; SELECT [ID_Devise], [Code_Devise], [Taux_Change] FROM [dbo].[fx_EvalTauxChangeDossier](${dossierId},${deviseNoteDetail},@d)`
        );
        return {
            success: true,
            data: JSON.parse(JSON.stringify(tauxChange)),
            dateDeclaration: dateConvertion,
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la récupération des taux" };
    }
}

export async function getDossierDeviseNoteDetail(dossierId: number) {
    try {
        const result = await prisma.$queryRaw<any[]>`
            SELECT d.[Devise Note Detail] as deviseNoteDetail, dev.[Code Devise] as codeDevise
            FROM TDossiers d
            LEFT JOIN TDevises dev ON d.[Devise Note Detail] = dev.[ID Devise]
            WHERE d.[ID Dossier] = ${dossierId}
        `;
        if (!result || result.length === 0) return { success: false, error: "Dossier non trouvé" };
        return {
            success: true,
            data: {
                deviseNoteDetail: result[0].deviseNoteDetail,
                codeDevise: result[0].codeDevise,
            }
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}
