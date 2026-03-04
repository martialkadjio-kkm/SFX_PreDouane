-- Vérifier la structure de la vue VTauxChange
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'VTauxChange'
ORDER BY ORDINAL_POSITION;

-- Tester une requête simple sur VTauxChange
SELECT TOP 5 * FROM VTauxChange;

-- Vérifier les noms de colonnes exacts
SELECT 
    c.name AS column_name,
    t.name AS data_type
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
INNER JOIN sys.views v ON c.object_id = v.object_id
WHERE v.name = 'VTauxChange'
ORDER BY c.column_id;