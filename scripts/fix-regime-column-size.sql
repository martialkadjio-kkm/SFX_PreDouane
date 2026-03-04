-- Script pour augmenter la taille de la colonne Regime dans TNotesDetail
-- La colonne doit pouvoir contenir "TTC", "EXO", "100% TR", "100% DC", etc.

USE SFX_PreDouane;
GO

-- Vérifier la taille actuelle de la colonne
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.precision AS Precision,
    c.scale AS Scale
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('TNotesDetail')
    AND c.name = 'Regime';
GO

-- Augmenter la taille de la colonne Regime à VARCHAR(20) pour supporter tous les formats
-- TTC (3), EXO (3), 100% TR (7), 100% DC (7), ratios mixtes (jusqu'à 20)
ALTER TABLE TNotesDetail
ALTER COLUMN [Regime] VARCHAR(20) NULL;
GO

-- Vérifier la nouvelle taille
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.precision AS Precision,
    c.scale AS Scale
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('TNotesDetail')
    AND c.name = 'Regime';
GO

PRINT '✅ Colonne Regime mise à jour avec succès à VARCHAR(20)';
GO
