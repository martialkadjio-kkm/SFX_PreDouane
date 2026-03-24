"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/server/actions";

export async function checkConversionExists(dateDeclaration: Date, entiteId: number, deviseId?: number) {
    try {
        const dateStr = dateDeclaration.toISOString().split("T")[0];
        const conversions = await prisma.$queryRaw<any[]>`
            SELECT [ID Convertion], [Date Convertion], [Entite]
            FROM TConvertions
            WHERE CAST([Date Convertion] AS DATE) = CAST(${dateStr} AS DATE)
                AND [Entite] = ${entiteId}
        `;
        const conversion = conversions.length > 0 ? conversions[0] : null;

        let deviseCibleHasTaux: boolean | undefined = undefined;
        if (conversion && deviseId != null) {
            const tauxRows = await prisma.$queryRaw<any[]>`
                SELECT 1 FROM TTauxChange
                WHERE [Convertion] = ${conversion["ID Convertion"]} AND [Devise] = ${deviseId}
            `;
            deviseCibleHasTaux = tauxRows.length > 0;
        }

        return {
            success: true,
            exists: !!conversion,
            conversion: conversion ? { id: conversion["ID Convertion"], dateConvertion: conversion["Date Convertion"] } : undefined,
            deviseCibleHasTaux,
        };
    } catch (error) {
        return { success: false, exists: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

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

export async function setDeviseNoteDetail(
    dossierId: number,
    deviseId: number,
    dateDeclaration: Date,
    taux: Array<{ deviseId: number; tauxChange: number }>,
    tauxDeviceCible?: number  // taux en devise locale de la devise cible, si absent de TTauxChange
) {
    try {
        const session = await getSession();
        if (!session.user) return { success: false, error: "Non authentifié" };

        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: { branche: true }
        });
        if (!dossier) return { success: false, error: "Dossier non trouvé" };

        const branche = await prisma.tBranches.findUnique({
            where: { id: dossier.branche },
            select: { entite: true }
        });
        if (!branche) return { success: false, error: "Branche non trouvée" };

        const dateStr = dateDeclaration.toISOString().split("T")[0];
        const conversions = await prisma.$queryRaw<any[]>`
            SELECT [ID Convertion]
            FROM TConvertions
            WHERE CAST([Date Convertion] AS DATE) = CAST(${dateStr} AS DATE)
                AND [Entite] = ${branche.entite}
        `;
        if (conversions.length === 0) return { success: false, error: "Aucune conversion trouvée pour cette date" };

        const conversionId = conversions[0]["ID Convertion"];

        // Vérifier que la devise cible a un taux dans TTauxChange pour cette conversion
        // (nécessaire pour fx_EvalTauxChangeDossier qui calcule taux_devise / taux_devise_cible)
        const tauxDeviceCibleRows = await prisma.$queryRaw<any[]>`
            SELECT [ID Taux Change], [Taux Change] FROM TTauxChange
            WHERE [Convertion] = ${conversionId} AND [Devise] = ${deviseId}
        `;

        let tauxCibleEnDeviseLocale: number;

        if (tauxDeviceCibleRows.length === 0) {
            // L'utilisateur doit avoir fourni le taux
            if (tauxDeviceCible == null || tauxDeviceCible <= 0) {
                return { success: false, error: `La devise cible n'a pas de taux de change pour cette date. Veuillez le saisir.` };
            }
            await prisma.tTauxChange.create({
                data: {
                    convertion: conversionId,
                    devise: deviseId,
                    tauxChange: tauxDeviceCible,
                    session: session.user.id,
                    dateCreation: new Date(),
                },
            });
            tauxCibleEnDeviseLocale = tauxDeviceCible;
        } else {
            tauxCibleEnDeviseLocale = Number(tauxDeviceCibleRows[0]["Taux Change"]);
        }

        for (const t of taux) {
            // L'utilisateur saisit : 1 autreDevise = X devises_cible (taux relatif)
            // TTauxChange stocke les taux par rapport à la devise locale
            // Donc : taux_autreDevise_en_locale = tauxRelatif * taux_cible_en_locale
            const tauxEnDeviseLocale = t.tauxChange * tauxCibleEnDeviseLocale;

            const existing = await prisma.$queryRaw<any[]>`
                SELECT [ID Taux Change] FROM TTauxChange
                WHERE [Convertion] = ${conversionId} AND [Devise] = ${t.deviseId}
            `;
            if (existing.length === 0) {
                await prisma.tTauxChange.create({
                    data: {
                        convertion: conversionId,
                        devise: t.deviseId,
                        tauxChange: tauxEnDeviseLocale,
                        session: session.user.id,
                        dateCreation: new Date(),
                    },
                });
            } else {
                // Mettre à jour si le taux a changé
                await prisma.$executeRaw`
                    UPDATE TTauxChange SET [Taux Change] = ${tauxEnDeviseLocale}
                    WHERE [Convertion] = ${conversionId} AND [Devise] = ${t.deviseId}
                `;
            }
        }

        await prisma.$executeRaw`UPDATE TDossiers SET [Devise Note Detail] = ${deviseId} WHERE [ID Dossier] = ${dossierId}`;

        revalidatePath(`/dossiers/${dossierId}`);
        return { success: true, data: { conversionId } };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

export async function genererNotesDetail(dossierId: number, dateDeclaration: Date) {
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

        // Passer la date via une variable T-SQL déclarée pour forcer le type datetime2
        const dateISO = dateConversionDate.toISOString().replace("T", " ").slice(0, 23); // "YYYY-MM-DD HH:mm:ss.mmm"

        try {
            await prisma.$executeRawUnsafe(
                `DECLARE @d datetime2 = '${dateISO}'; EXEC [dbo].[pSP_CreerNoteDetail] @Id_Dossier = ${dossierId}, @DateDeclaration = @d`
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

        await prisma.$executeRaw`UPDATE TDossiers SET [Devise Note Detail] = NULL WHERE [ID Dossier] = ${dossierId}`;

        revalidatePath(`/dossiers/${dossierId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la suppression" };
    }
}

export async function createMissingExchangeRates(conversionId: number, rates: Array<{ deviseId: number; tauxChange: number }>) {
    try {
        const session = await getSession();
        if (!session.user) return { success: false, error: "Non authentifié" };

        for (const rate of rates) {
            await prisma.tTauxChange.create({
                data: {
                    convertion: conversionId,
                    devise: rate.deviseId,
                    tauxChange: rate.tauxChange,
                    session: session.user.id,
                    dateCreation: new Date(),
                },
            });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la création" };
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
            // Compatibilité : la vue peut retourner Base_Poids_Brut ou Poids_Brut selon la version déployée
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
        // Récupérer la date de déclaration depuis la conversion liée au dossier
        const dossierConv = await prisma.$queryRaw<any[]>`
            SELECT c.[Date Convertion] as dateConvertion
            FROM TDossiers d
            INNER JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
            WHERE d.[ID Dossier] = ${dossierId}
        `;

        if (!dossierConv || dossierConv.length === 0) {
            return { success: true, data: [], dateDeclaration: null };
        }

        const dateConvertion = dossierConv[0].dateConvertion;
        const dateConvertionDate = dateConvertion instanceof Date
            ? dateConvertion
            : new Date(dateConvertion);
        const dateISO = dateConvertionDate.toISOString().replace("T", " ").slice(0, 23);

        const tauxChange = await prisma.$queryRawUnsafe<any[]>(
            `DECLARE @d datetime2 = '${dateISO}'; SELECT [ID_Devise], [Code_Devise], [Taux_Change] FROM [dbo].[fx_EvalTauxChangeDossier](${dossierId}, @d)`
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
