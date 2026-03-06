"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/server/actions";

/**
 * Vérifier si une conversion existe pour une date donnée et une entité
 * Compare uniquement la partie date (sans l'heure)
 */
export async function checkConversionExists(
  dateDeclaration: Date,
  entiteId: number,
) {
  try {
    // Formater la date pour la comparaison (YYYY-MM-DD)
    const dateStr = dateDeclaration.toISOString().split("T")[0];

    // Chercher une conversion pour cette date (en comparant uniquement la partie date)
    const conversions = await prisma.$queryRaw<any[]>`
            SELECT [ID Convertion], [Date Convertion], [Entite]
            FROM TConvertions
            WHERE CAST([Date Convertion] AS DATE) = CAST(${dateStr} AS DATE)
                AND [Entite] = ${entiteId}
        `;

    const conversion = conversions.length > 0 ? conversions[0] : null;

    return {
      success: true,
      exists: !!conversion,
      conversion: conversion
        ? {
            id: conversion["ID Convertion"],
            dateConvertion: conversion["Date Convertion"],
          }
        : undefined,
    };
  } catch (error) {
    console.error("checkConversionExists error:", error);
    return {
      success: false,
      exists: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la vérification",
    };
  }
}

/**
 * Générer les notes de détail pour un dossier
 * Appelle la procédure stockée pSP_CreerNoteDetail
 */
export async function genererNotesDetail(
  dossierId: number,
  dateDeclaration: Date,
) {
  console.log(
    "🚀 [genererNotesDetail] DEBUT - Dossier:",
    dossierId,
    "Date:",
    dateDeclaration,
  );

  try {
    console.log("📝 [genererNotesDetail] Étape 1: Vérification session");
    const session = await getSession();
    if (!session.user) {
      console.log("❌ [genererNotesDetail] Non authentifié");
      return { success: false, error: "Non authentifié" };
    }
    console.log("✅ [genererNotesDetail] Session OK");

    // Vérifications préalables
    console.log("📝 [genererNotesDetail] Étape 2: Récupération dossier");
    const dossier = await prisma.tDossiers.findUnique({
      where: { id: dossierId },
      select: {
        statutDossier: true,
        branche: true,
      },
    });

    if (!dossier) {
      console.log("❌ [genererNotesDetail] Dossier non trouvé");
      return { success: false, error: "Dossier non trouvé" };
    }
    console.log(
      "✅ [genererNotesDetail] Dossier trouvé - Statut:",
      dossier.statutDossier,
      "Branche:",
      dossier.branche,
    );

    if (dossier.statutDossier !== 0) {
      console.log(
        "❌ [genererNotesDetail] Statut invalide:",
        dossier.statutDossier,
      );
      return {
        success: false,
        error:
          "Le dossier doit être en cours (statut = 0) pour générer les notes de détail",
      };
    }

    // Vérifier qu'il y a des colisages
    console.log("📝 [genererNotesDetail] Étape 3: Vérification colisages");
    const colisagesCount = await prisma.tColisageDossiers.count({
      where: { dossier: dossierId },
    });
    console.log("✅ [genererNotesDetail] Colisages trouvés:", colisagesCount);

    if (colisagesCount === 0) {
      console.log("❌ [genererNotesDetail] Aucun colisage");
      return { success: false, error: "Aucun colisage trouvé pour ce dossier" };
    }

    // Vérifier que tous les colisages ont un HS Code et un régime
    console.log(
      "📝 [genererNotesDetail] Étape 4: Vérification HS Code et régimes",
    );
    const colisagesSansRegime = await prisma.tColisageDossiers.count({
      where: {
        dossier: dossierId,
        OR: [{ hsCode: null }, { regimeDeclaration: null }],
      },
    });

    if (colisagesSansRegime > 0) {
      console.log(
        "❌ [genererNotesDetail] Colisages sans régime:",
        colisagesSansRegime,
      );
      return {
        success: false,
        error: `${colisagesSansRegime} colisage(s) n'ont pas de HS Code ou de régime de déclaration`,
      };
    }
    console.log(
      "✅ [genererNotesDetail] Tous les colisages ont HS Code et régime",
    );

    // Récupérer la date exacte de la conversion (avec l'heure) depuis la BD
    console.log(
      "📝 [genererNotesDetail] Étape 5: Récupération branche et entité",
    );
    const branche = await prisma.tBranches.findUnique({
      where: { id: dossier.branche },
      select: { entite: true },
    });

    if (!branche) {
      console.log("❌ [genererNotesDetail] Branche non trouvée");
      return { success: false, error: "Branche non trouvée" };
    }
    console.log(
      "✅ [genererNotesDetail] Branche trouvée - Entité:",
      branche.entite,
    );

    console.log(
      "📝 [genererNotesDetail] Étape 6: Recherche conversion pour date:",
      dateDeclaration,
    );
    const dateStr = dateDeclaration.toISOString().split("T")[0];
    console.log("   Date formatée:", dateStr);

    const conversions = await prisma.$queryRaw<any[]>`
            SELECT [ID Convertion], [Date Convertion]
            FROM TConvertions
            WHERE CAST([Date Convertion] AS DATE) = CAST(${dateStr} AS DATE)
                AND [Entite] = ${branche.entite}
        `;
    console.log(
      "✅ [genererNotesDetail] Conversions trouvées:",
      conversions.length,
    );

    if (conversions.length === 0) {
      console.log("❌ [genererNotesDetail] Aucune conversion pour cette date");
      return {
        success: false,
        error: "Aucune conversion trouvée pour cette date et cette entité",
      };
    }
    console.log(
      "   Conversion ID:",
      conversions[0]["ID Convertion"],
      "Date:",
      conversions[0]["Date Convertion"],
    );

    const conversionId = conversions[0]["ID Convertion"];
    const dateConversionExacte = conversions[0]["Date Convertion"];

    // Vérifier que tous les taux de change existent pour les devises du dossier
    console.log(
      "📝 [genererNotesDetail] Étape 6b: Vérification des taux de change",
    );

    // Récupérer les devises utilisées dans le dossier
    const devisesUtilisees = await prisma.$queryRaw<any[]>`
            SELECT DISTINCT 
                cd.[Devise] as ID_Devise,
                d.[Code Devise] as Code_Devise,
                d.[Libelle Devise] as Libelle_Devise
            FROM TColisageDossiers cd
            INNER JOIN TDevises d ON cd.[Devise] = d.[ID Devise]
            WHERE cd.[Dossier] = ${dossierId}
        `;
    console.log(
      "   Devises utilisées:",
      devisesUtilisees.map((d) => d.Code_Devise).join(", "),
    );

    // Vérifier les taux de change pour chaque devise
    const tauxManquants: any[] = [];
    for (const devise of devisesUtilisees) {
      const taux = await prisma.$queryRaw<any[]>`
                SELECT [ID Taux Change], [Taux Change]
                FROM TTauxChange
                WHERE [Convertion] = ${conversionId}
                    AND [Devise] = ${devise.ID_Devise}
            `;

      if (taux.length === 0) {
        console.log(`   Taux manquant pour devise:`, {
          ID_Devise: devise.ID_Devise,
          Code_Devise: devise.Code_Devise,
          Libelle_Devise: devise.Libelle_Devise,
        });

        tauxManquants.push({
          deviseId: devise.ID_Devise,
          Code_Devise: devise.Code_Devise,
          Libelle_Devise: devise.Libelle_Devise,
        });
      }
    }

    if (tauxManquants.length > 0) {
      console.log(
        "❌ [genererNotesDetail] Taux manquants:",
        tauxManquants.map((t) => t.codeDevise).join(", "),
      );
      return {
        success: false,
        error: "MISSING_EXCHANGE_RATES",
        missingRates: tauxManquants,
        conversionId,
        dateConvertion: dateConversionExacte,
      };
    }
    console.log("✅ [genererNotesDetail] Tous les taux de change existent");

    // Appeler la procédure stockée avec la date exacte
    console.log("📝 [genererNotesDetail] Étape 7: Appel procédure stockée");
    console.log("   Dossier:", dossierId);
    console.log("   Date conversion:", dateConversionExacte);
    console.log("   Type:", typeof dateConversionExacte);

    try {
      // Utiliser la date EXACTE de la conversion (avec l'heure exacte de la BD)
      let dateFormatted: string;
      if (dateConversionExacte instanceof Date) {
        // Utiliser la date complète avec l'heure exacte
        dateFormatted = dateConversionExacte
          .toISOString()
          .replace("T", " ")
          .replace("Z", "");
      } else {
        // Si c'est une string, l'utiliser telle quelle
        dateFormatted = dateConversionExacte.toString();
      }

      console.log("   Date formatée SQL (EXACTE de la BD):", dateFormatted);
      const query = `EXEC [dbo].[pSP_CreerNoteDetail] @Id_Dossier = ${dossierId}, @DateDeclaration = '${dateFormatted}'`;
      console.log("   Query:", query);

      await prisma.$executeRawUnsafe(query);

      console.log("✅ [genererNotesDetail] Procédure exécutée avec succès");
    } catch (procError: any) {
      console.error("ERREUR PROCEDURE:", procError);
      console.error("Message:", procError.message);
      console.error("Code:", procError.code);

      // Extraire le message d'erreur SQL Server
      let errorMsg = procError.message || "Erreur inconnue";
      if (errorMsg.includes("FILE IS NOT IN PROGRESS")) {
        errorMsg = "Le dossier doit être en cours (statut = 0)";
      } else if (errorMsg.includes("MISSING OR WRONG EXCHANGE RATE")) {
        errorMsg = "Taux de change manquant ou incorrect";
      } else if (errorMsg.includes("MISSING PACKING LIST")) {
        errorMsg = "Aucun colisage trouvé";
      } else if (errorMsg.includes("MISSING HS CODE OR REGIME")) {
        errorMsg = "HS Code ou régime manquant sur certains colisages";
      }

      return { success: false, error: errorMsg };
    }

    // Vérifier le statut après
    console.log("📝 [genererNotesDetail] Étape 8: Vérification résultat");
    const dossierApres = await prisma.tDossiers.findUnique({
      where: { id: dossierId },
      select: { statutDossier: true },
    });
    console.log("   Statut après:", dossierApres?.statutDossier);

    // Compter les notes créées
    const notesCount = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as total FROM TNotesDetail WHERE [Colisage Dossier] IN (
                SELECT [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier] = ${dossierId}
            )
        `);
    // console.log('   Notes créées:', notesCount[0].total);
    console.log("✅ [genererNotesDetail] FIN - SUCCESS");

    revalidatePath(`/dossiers/${dossierId}`);
    return { success: true };
  } catch (error: any) {
    console.error("genererNotesDetail error:", error);

    // Extraire le message d'erreur de SQL Server
    let errorMessage = "Erreur lors de la génération des notes de détail";
    if (error.message) {
      // Les erreurs SQL Server contiennent souvent le message après "Message:"
      if (error.message.includes("FILE IS NOT IN PROGRESS")) {
        errorMessage = "Le dossier doit être en cours pour générer les notes";
      } else if (error.message.includes("MISSING OR WRONG EXCHANGE RATE")) {
        errorMessage =
          "Taux de change manquant ou incorrect pour certaines devises";
      } else if (error.message.includes("MISSING PACKING LIST")) {
        errorMessage = "Aucun colisage trouvé pour ce dossier";
      } else if (error.message.includes("MISSING HS CODE OR REGIME")) {
        errorMessage = "Certains colisages n'ont pas de HS Code ou de régime";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Supprimer les notes de détail d'un dossier
 * Appelle la procédure stockée pSP_SupprimerNoteDetail
 */
export async function supprimerNotesDetail(dossierId: number) {
  try {
    const session = await getSession();
    if (!session.user) {
      return { success: false, error: "Non authentifié" };
    }

    await prisma.$executeRaw`
            EXEC [dbo].[pSP_SupprimerNoteDetail] 
                @Id_Dossier = ${dossierId}
        `;

    revalidatePath(`/dossiers/${dossierId}`);
    return { success: true };
  } catch (error: any) {
    console.error("supprimerNotesDetail error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression",
    };
  }
}

/**
 * Créer les taux de change manquants pour une conversion
 */
export async function createMissingExchangeRates(
  conversionId: number,
  rates: Array<{ deviseId: number; tauxChange: number }>,
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return { success: false, error: "Non authentifié" };
    }

    const sessionId = session.user.id;

    // Insérer les taux manquants
    for (const rate of rates) {
      await prisma.tTauxChange.create({
        data: {
          convertion: conversionId,
          devise: rate.deviseId,
          tauxChange: rate.tauxChange,
          session: sessionId,
          dateCreation: new Date(),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("createMissingExchangeRates error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur lors de la création",
    };
  }
}

/**
 * Récupérer les notes de détail d'un dossier
 */
export async function getNotesDetail(dossierId: number) {
    try {
        // Utiliser VNotesDetail (valeurs en devise locale)
        const notes = await prisma.$queryRaw<any[]>`
            SELECT * FROM VNotesDetail
            WHERE ID_Dossier = ${dossierId}
            ORDER BY Regroupement_Client, Regime
        `;

        const serializedNotes = JSON.parse(JSON.stringify(notes));
        
        // Vérification des totaux
        const totalPaquetage = notes.reduce((sum: number, n: any) => sum + Number(n.Nbre_Paquetage || 0), 0);
        const totalValeur = notes.reduce((sum: number, n: any) => sum + Number(n.Valeur || 0), 0);
        
        console.log(`[TOTAUX DIRECTS] Paquetages: ${totalPaquetage.toFixed(2)}, Valeur: ${totalValeur.toFixed(2)}`);

        // Mapper les noms de colonnes pour correspondre à ce que le composant attend
        const mappedNotes = serializedNotes.map((n: any) => ({
            ...n,
            Nbre_Paquetage: n.Nbre_Paquetage,
            Prix_Unitaire: n.Valeur / (n.Nbre_Paquetage || 1),
            Valeur: n.Valeur,
            Poids_Brut: n.Base_Poids_Brut,
            Poids_Net: n.Base_Poids_Net,
            Volume: n.Base_Volume,
        }));

        return { success: true, data: mappedNotes };
    } catch (error) {
        console.error("getNotesDetail error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération",
        };
    }
}

/**
 * Récupérer les taux de change pour un dossier
 * Utilise la fonction fx_TauxChangeDossier
 */
export async function getTauxChangeDossier(dossierId: number) {
    try {
        // Récupérer la date de conversion via raw SQL pour éviter les problèmes de relation Prisma
        const dossierData = await prisma.$queryRaw<any[]>`
            SELECT d.[Convertion], c.[Date Convertion] as DateConvertion
            FROM TDossiers d
            LEFT JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
            WHERE d.[ID Dossier] = ${dossierId}
        `;

        if (!dossierData || dossierData.length === 0 || !dossierData[0].DateConvertion) {
            return { success: false, error: "Dossier ou conversion non trouvé" };
        }

        const dateDeclaration = dossierData[0].DateConvertion;

        console.log(`[getTauxChangeDossier] Dossier ${dossierId}, Date: ${dateDeclaration}`);

        // Appeler la fonction fx_TauxChangeDossier
        const tauxChange = await prisma.$queryRaw<any[]>`
            SELECT 
                [ID_Devise],
                [Code_Devise],
                [Taux_Change],
                [ID_Convertion]
            FROM [dbo].[fx_TauxChangeDossier](${dossierId}, ${dateDeclaration})
        `;

        const serializedTaux = JSON.parse(JSON.stringify(tauxChange));

        console.log(`[getTauxChangeDossier] ${serializedTaux.length} taux récupérés:`, serializedTaux);

        return { 
            success: true, 
            data: serializedTaux,
            dateDeclaration: dateDeclaration // Ajouter la date de déclaration dans le retour
        };
    } catch (error) {
        console.error("getTauxChangeDossier error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des taux",
        };
    }
}
