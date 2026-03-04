-- Debug script to check VDossiers structure
-- Check column names for statut and etape

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'VDossiers'
    AND (COLUMN_NAME LIKE '%Statut%' OR COLUMN_NAME LIKE '%Etape%')
ORDER BY ORDINAL_POSITION;

-- Get sample data to see actual column names
SELECT TOP 3 
    ID_Dossier,
    No_Dossier,
    ID_Client,
    Nom_Client,
    *
FROM VDossiers;