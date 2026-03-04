-- Corriger la vue VDossiers pour utiliser les nouveaux champs
-- et éliminer les doublons

USE [SFX_PreDouane]
GO

-- Supprimer l'ancienne vue
IF OBJECT_ID('dbo.VDossiers', 'V') IS NOT NULL
    DROP VIEW dbo.VDossiers
GO

-- Recréer la vue avec les bons champs
CREATE VIEW [dbo].[VDossiers] AS
SELECT A.[ID Dossier] AS [ID_Dossier]
    ,I.[ID_Branche]
    ,I.[Nom_Branche]
    ,I.[ID_Entite]
    ,I.[Nom_Entite]
    ,I.[ID_Groupe_Entite]
    ,I.[ID_Pays]
    ,I.[Libelle_Pays]
    ,I.[Devise_Locale]
    ,C.[ID_Type_Dossier]
    ,C.[Libelle_Type_Dossier]
    ,C.[ID_Sens_Trafic]
    ,C.[Libelle_Sens_Trafic]
    ,C.[ID_Mode_Transport]
    ,C.[Libelle_Mode_Transport]
    ,B.[ID Client] AS [ID_Client]
    ,B.[Nom Client] AS [Nom_Client]
    ,A.[Description Dossier] AS [Description_Dossier]
    ,A.[No OT] AS [No_OT]
    ,A.[No Dossier] AS [No_Dossier]
    ,A.[Nbre Paquetage OT] AS [Nbre_Paquetage_OT]
    ,A.[Poids Brut Pesee] AS [Poids_Brut_Pesee]
    ,A.[Poids Net Pesee] AS [Poids_Net_Pesee]
    ,A.[Volume Pesee] AS [Volume_Pesee]
    ,G.[ID Utilisateur] AS [Responsable_ID]
    ,G.[Nom Utilisateur] AS [Nom_Responsable]
    ,P.[Date Convertion] AS [Date_Declaration]
    ,N.[ID_Etape_Dossier] AS [ID_Etape_Actuelle]
    ,N.[Libelle_Etape] AS [Libelle_Etape_Actuelle]
    ,N.[Circuit_Etape] AS [Circuit_Etape_Actuelle]
    ,N.[Index_Etape] AS [Index_Etape_Actuelle]
    ,N.[Date_Debut_Etape] AS [Date_Debut_Etape_Actuelle]
    ,N.[Date_Fin_Etape] AS [Date_Fin_Etape_Actuelle]
    ,N.[Reference_Etape] AS [Reference_Etape_Actuelle]
    ,N.[Qte_Etape] AS [Qte_Etape_Actuelle]
    ,N.[Obs_Etape] AS [Obs_Etape_Actuelle]
    ,N.Retard_Etape AS [Retard_Etape_Actuelle]
    ,X.[Date Debut] AS [Date_Ouverture_Dossier]
    ,Y.[Date Debut] AS [Date_Cloture_Dossier]
    ,H.[ID Statut Dossier] AS [ID_Statut_Dossier]
    ,H.[Libelle Statut Dossier] AS [Libelle_Statut_Dossier]
    ,A.[Date Creation] AS [Date_Creation]
    ,Z.Nom_Utilisateur AS [Nom_Creation]
FROM dbo.TDossiers A
INNER JOIN dbo.TClients B ON A.[Client]=B.[ID Client]
INNER JOIN dbo.VTypesDossiers C ON A.[Type Dossier]=C.[ID_Type_Dossier]
INNER JOIN dbo.TUtilisateurs G ON A.[Responsable Dossier]=G.[ID Utilisateur]
INNER JOIN dbo.TStatutsDossier H ON A.[Statut Dossier]=H.[ID Statut Dossier]
INNER JOIN dbo.VBranches I ON A.[Branche]=I.[ID_Branche]
LEFT JOIN dbo.VEtapesDossiers N ON A.[Derniere Etape Dossier]=N.[ID_Etape_Dossier]
LEFT JOIN dbo.TConvertions P ON A.Convertion=P.[ID Convertion]
LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
LEFT JOIN (SELECT [Dossier], [Date Debut] FROM dbo.TEtapesDossiers WHERE [Etape Dossier]=0) X ON A.[ID Dossier]=X.Dossier
LEFT JOIN (SELECT [Dossier], [Date Debut] FROM dbo.TEtapesDossiers WHERE [Etape Dossier]=1000000) Y ON A.[ID Dossier]=Y.Dossier
GO

PRINT 'Vue VDossiers corrigée avec succès!'
PRINT '- Supprimé: Qte_Colis_OT, Poids_Brut_OT, Poids_Net_OT, Volume_OT'
PRINT '- Ajouté: Nbre_Paquetage_OT'
PRINT '- Conservé: Poids_Brut_Pesee, Poids_Net_Pesee, Volume_Pesee'
PRINT '- Éliminé la jointure en double avec TStatutsDossier'
