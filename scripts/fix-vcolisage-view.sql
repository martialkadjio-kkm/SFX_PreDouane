-- Corriger la vue VColisageDossiers pour éviter les doublons
-- Le problème vient de VRegimesDeclarations qui crée des doublons

USE [SFX Transit]
GO

-- Supprimer l'ancienne vue
IF OBJECT_ID('dbo.VColisageDossiers', 'V') IS NOT NULL
    DROP VIEW dbo.VColisageDossiers
GO

-- Recréer la vue sans utiliser VRegimesDeclarations
CREATE VIEW [dbo].[VColisageDossiers]
AS
SELECT A.[ID Colisage Dossier] AS [ID_Colisage_Dossier]
      ,A.[Dossier] AS [ID_Dossier]
      ,M.[HS Code] AS [HS_Code]
      ,A.[Description Colis] AS [Description_Colis]
      ,A.[No Commande] AS [No_Commande]
      ,A.[Nom Fournisseur] AS [Nom_Fournisseur]
      ,A.[No Facture] AS [No_Facture]
      ,B.[Code Devise] AS [Code_Devise]
      ,A.[Qte Colis] AS [Qte_Colis] 
      ,A.[Prix Unitaire Facture] AS [Prix_Unitaire_Facture]
      ,A.[Poids Brut] AS [Poids_Brut]
      ,A.[Poids Net] AS [Poids_Net]
      ,A.[Volume] AS [Volume]
      ,C.[Libelle Pays] AS [Pays_Origine]
      ,RD.[ID Regime Declaration] AS [ID_Regime_Declaration]
      ,RDO.[ID Regime Douanier] AS [ID_Regime_Douanier]
      ,RDO.[Libelle Regime Douanier] AS [Libelle_Regime_Douanier]
      ,RD.[Libelle Regime Declaration] AS [Libelle_Regime_Declaration]
      ,RD.[Taux DC] AS [Ratio_DC]
      ,IIF(RD.[Taux DC]=0, 0, 1-RD.[Taux DC]) AS [Ratio_TR]
      ,A.[Regroupement Client] AS [Regroupement_Client]
      ,A.[Date Creation] AS [Date_Creation]
      ,U.[Nom Utilisateur] AS [Nom_Creation]
FROM [dbo].[TColisageDossiers] A
    INNER JOIN [dbo].TDevises B ON A.[Devise]=B.[ID Devise]
    INNER JOIN [dbo].TPays C ON A.[Pays Origine]=C.[ID Pays]
    LEFT JOIN [dbo].THSCodes M ON A.[HS Code]=M.[ID HS Code]
    LEFT JOIN [dbo].TRegimesDeclarations RD ON A.[Regime Declaration]=RD.[ID Regime Declaration]
    LEFT JOIN [dbo].TRegimesDouaniers RDO ON RD.[Regime Douanier]=RDO.[ID Regime Douanier]
    LEFT JOIN [dbo].TSessions S ON A.[Session]=S.[ID Session]
    LEFT JOIN [dbo].TUtilisateurs U ON S.[Utilisateur]=U.[ID Utilisateur]
GO

PRINT 'Vue VColisageDossiers corrigée avec succès!'
