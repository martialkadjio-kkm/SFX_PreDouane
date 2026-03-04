-- Activer la devise EUR

USE [SFX_PreDouane]
GO

UPDATE TDevises 
SET [Devise Inactive] = 0
WHERE [Code Devise] = 'EUR'

PRINT '✅ Devise EUR activée avec succès'

-- Vérifier
SELECT [ID Devise], [Code Devise], [Libelle Devise], [Devise Inactive] 
FROM TDevises 
WHERE [Code Devise] = 'EUR'
