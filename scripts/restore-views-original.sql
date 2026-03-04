-- Restore VColisageDossiers and VNotesDetail views to original state (without Ajustement_Valeur)

USE SFX_PreDouane;
GO

-- Drop and recreate VColisageDossiers (original version)
IF OBJECT_ID('dbo.VColisageDossiers', 'V') IS NOT NULL
    DROP VIEW dbo.VColisageDossiers;
GO

CREATE VIEW [dbo].[VColisageDossiers]
AS
SELECT A.[ID Colisage Dossier] AS [ID_Colisage_Dossier]
      ,A.[Dossier] AS [ID_Dossier]
      ,M.[HS Code] AS [HS_Code]
      ,A.[Description Colis] AS [Description_Colis]
      ,A.[No Commande] AS [No_Commande]
      ,A.[Nom Fournisseur] AS [Nom_Fournisseur]
      ,A.[No Facture] AS [No_Facture]
      ,A.[Item No] AS [Item_No]
      ,B.[Code Devise] AS [Code_Devise]
      ,A.[Qte Colis] AS [Qte_Colis]
      ,A.[Prix Unitaire Colis] AS [Prix_Unitaire_Colis]
      ,A.[Qte Colis]*A.[Prix Unitaire Colis] AS [Valeur_Colis]
      ,A.[Poids Brut] AS [Poids_Brut]
      ,A.[Poids Net] AS [Poids_Net]
      ,A.[Volume] AS [Volume]
      ,C.[Libelle Pays] AS [Pays_Origine]
      ,N.ID_Regime_Declaration
      ,N.[ID_Regime_Douanier]
      ,N.[Libelle_Regime_Douanier]
      ,N.[Libelle_Regime_Declaration]
      ,N.[Ratio_DC]
      ,N.[Ratio_TR]
      ,A.[Regroupement Client] AS [Regroupement_Client]
      ,A.[Date Creation] AS [Date_Creation]
      ,Z.Nom_Utilisateur AS [Nom_Creation]
  FROM [dbo].[TColisageDossiers] A
      INNER JOIN [dbo].TDevises B ON A.[Devise]=B.[ID Devise]
      INNER JOIN [dbo].TPays C ON A.[Pays Origine]=C.[ID Pays]
      LEFT JOIN [dbo].THSCodes M ON A.[HS Code]=M.[ID HS Code]
      LEFT JOIN [dbo].VRegimesDeclarations N ON A.[Regime Declaration]=N.[ID_Regime_Declaration]
      LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
GO

PRINT 'VColisageDossiers restored to original (without Ajustement_Valeur)';

-- Drop and recreate VNotesDetail (original version)
IF OBJECT_ID('dbo.VNotesDetail', 'V') IS NOT NULL
    DROP VIEW dbo.VNotesDetail;
GO

CREATE VIEW [dbo].[VNotesDetail]
AS
SELECT B.[ID_Dossier]
      ,B.[HS_Code]
      ,B.[Pays_Origine]
      ,B.ID_Regime_Declaration
      ,B.[ID_Regime_Douanier]
      ,B.[Libelle_Regime_Douanier]
      ,B.[Libelle_Regime_Declaration]
      ,A.[Regime] AS [Regime]
      ,B.[Regroupement_Client]
      ,SUM(A.[Nbre Paquetage]) AS [Nbre_Paquetage]
      ,SUM(A.[Valeur]) AS [Valeur]
      ,SUM(A.[Base Poids Brut]) AS [Base_Poids_Brut]
      ,SUM(A.[Base Poids Net]) AS [Base_Poids_Net]
      ,SUM(A.[Base Volume]) AS [Base_Volume]
  FROM [dbo].[TNotesDetail] A
      INNER JOIN [dbo].[VColisageDossiers] B On A.[Colisage Dossier]=B.ID_Colisage_Dossier
  GROUP BY B.[ID_Dossier]
      ,B.[HS_Code]
      ,B.[Pays_Origine]
      ,B.ID_Regime_Declaration
      ,B.[ID_Regime_Douanier]
      ,B.[Libelle_Regime_Douanier]
      ,B.[Libelle_Regime_Declaration]
      ,A.[Regime]
      ,B.[Regroupement_Client]
GO

PRINT 'VNotesDetail restored to original (without Ajustement_Valeur)';
