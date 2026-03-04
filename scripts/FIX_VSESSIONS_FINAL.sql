-- ============================================================================
-- Script pour corriger la vue VSessions
-- Problème: La jointure utilise [ID Session]=[Session] au lieu de [Utilisateur]=[ID Utilisateur]
-- Cela crée des doublons (4x) car plusieurs utilisateurs ont Session=0
-- ============================================================================

USE [SFX Transit]
GO

-- Supprimer l'ancienne vue
IF OBJECT_ID('dbo.VSessions', 'V') IS NOT NULL
    DROP VIEW dbo.VSessions
GO

-- Recréer la vue avec la BONNE jointure
CREATE VIEW [dbo].[VSessions]
AS
SELECT A.[ID Session] AS [ID_Session]
      ,B.[ID Utilisateur] AS [ID_Utilisateur]
      ,B.[Nom Utilisateur] AS [Nom_Utilisateur]
      ,A.[Debut Session] AS [Debut_Session]
      ,A.[Fin Session] AS [Fin_Session]
FROM dbo.TSessions A 
INNER JOIN dbo.TUtilisateurs B ON A.[Utilisateur] = B.[ID Utilisateur]
-- CORRECTION: Avant c'était "ON A.[ID Session] = B.[Session]" (INCORRECT)
GO

-- Vérifier le résultat
PRINT 'Vue VSessions corrigée avec succès!'
PRINT ''
PRINT 'Vérification:'
SELECT COUNT(*) as [Nombre de sessions] FROM VSessions
GO

SELECT TOP 5 
    ID_Session,
    ID_Utilisateur,
    Nom_Utilisateur,
    Debut_Session
FROM VSessions
ORDER BY ID_Session
GO
