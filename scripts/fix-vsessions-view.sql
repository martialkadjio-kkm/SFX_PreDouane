-- Corriger la vue VSessions
-- Le problème: la jointure utilise [ID Session]=[Session] au lieu de [Utilisateur]=[ID Utilisateur]

USE [SFX Transit]
GO

-- Supprimer l'ancienne vue
IF OBJECT_ID('dbo.VSessions', 'V') IS NOT NULL
    DROP VIEW dbo.VSessions
GO

-- Recréer la vue avec la bonne jointure
CREATE VIEW [dbo].[VSessions]
AS
SELECT A.[ID Session] AS [ID_Session]
      ,B.[ID Utilisateur] AS [ID_Utilisateur]
      ,B.[Nom Utilisateur] AS [Nom_Utilisateur]
      ,A.[Debut Session] AS [Debut_Session]
      ,A.[Fin Session] AS [Fin_Session]
FROM dbo.TSessions A 
INNER JOIN dbo.TUtilisateurs B ON A.[Utilisateur]=B.[ID Utilisateur]
GO

PRINT 'Vue VSessions corrigée avec succès!'

-- Vérifier le résultat
SELECT COUNT(*) as [Nombre de sessions] FROM VSessions
SELECT TOP 5 * FROM VSessions
