-- Vérifier quelle devise Euro existe dans la base de données

USE [SFX_PreDouane]
GO

PRINT '=== Recherche de devises contenant EUR ==='
SELECT [ID Devise], [Code Devise], [Libelle Devise], [Devise Inactive] 
FROM TDevises 
WHERE [Libelle Devise] LIKE '%EUR%' OR [Code Devise] LIKE '%EUR%'

PRINT ''
PRINT '=== Toutes les devises actives ==='
SELECT [ID Devise], [Code Devise], [Libelle Devise] 
FROM TDevises 
WHERE [Devise Inactive] = 0
ORDER BY [Code Devise]
