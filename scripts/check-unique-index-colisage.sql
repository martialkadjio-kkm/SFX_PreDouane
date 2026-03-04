-- Script pour vérifier la définition de l'index unique UN_TColisageDossiers
USE SFX_PreDouane;
GO

PRINT '🔍 Vérification de l''index unique UN_TColisageDossiers';
PRINT '====================================================';

-- 1. Vérifier l'existence et la définition de l'index
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.is_primary_key AS IsPrimaryKey,
    STRING_AGG(c.name, ', ') AS IndexColumns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('TColisageDossiers')
    AND i.name = 'UN_TColisageDossiers'
GROUP BY i.name, i.type_desc, i.is_unique, i.is_primary_key;

-- 2. Détail des colonnes de l'index avec leur ordre
SELECT 
    i.name AS IndexName,
    c.name AS ColumnName,
    ic.key_ordinal AS ColumnOrder,
    ic.is_descending_key AS IsDescending
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('TColisageDossiers')
    AND i.name = 'UN_TColisageDossiers'
ORDER BY ic.key_ordinal;

-- 3. Vérifier tous les index sur la table TColisageDossiers
PRINT '';
PRINT 'Tous les index sur TColisageDossiers:';
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    STRING_AGG(c.name, ', ') AS IndexColumns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('TColisageDossiers')
GROUP BY i.name, i.type_desc, i.is_unique
ORDER BY i.is_unique DESC, i.name;

-- 4. Analyser les données en conflit
PRINT '';
PRINT 'Analyse des doublons potentiels:';
SELECT 
    [Dossier],
    [UploadKey],
    [No Commande],
    [Nom Fournisseur], 
    [Item No],
    COUNT(*) as NombreDoublons
FROM TColisageDossiers
GROUP BY [Dossier], [UploadKey], [No Commande], [Nom Fournisseur], [Item No]
HAVING COUNT(*) > 1;

PRINT '';
PRINT '✅ Vérification terminée';