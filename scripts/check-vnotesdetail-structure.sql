-- Vérifier la structure complète de VNotesDetail
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'VNotesDetail'
ORDER BY ORDINAL_POSITION;

-- Obtenir un échantillon de données pour voir les champs disponibles
SELECT TOP 1 * FROM VNotesDetail;