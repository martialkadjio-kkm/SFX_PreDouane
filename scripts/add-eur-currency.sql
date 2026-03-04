-- Ajouter la devise EUR si elle n'existe pas

USE [SFX_PreDouane]
GO

-- Vérifier si EUR existe déjà
IF NOT EXISTS (SELECT 1 FROM TDevises WHERE [Code Devise] = 'EUR')
BEGIN
    INSERT INTO TDevises ([Code Devise], [Libelle Devise], [Decimales], [Devise Inactive], [Session], [Date Creation])
    VALUES ('EUR', 'Euro', 2, 0, 0, GETDATE())
    
    PRINT '✅ Devise EUR ajoutée avec succès'
END
ELSE
BEGIN
    PRINT 'ℹ️  La devise EUR existe déjà'
END
GO
