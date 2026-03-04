-- Vérifier la structure exacte de VDossiers
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'VDossiers'
ORDER BY ORDINAL_POSITION;

-- Voir un échantillon des données
SELECT TOP 3 * FROM VDossiers;