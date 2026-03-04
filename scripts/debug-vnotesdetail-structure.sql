-- Debug script to check VNotesDetail structure and data
-- Check column names and sample data

-- 1. Check view structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'VNotesDetail'
ORDER BY ORDINAL_POSITION;

-- 2. Check if view exists and get sample data
IF OBJECT_ID('VNotesDetail', 'V') IS NOT NULL
BEGIN
    PRINT 'VNotesDetail view exists'
    
    -- Get first row to see actual data
    SELECT TOP 1 * FROM VNotesDetail;
    
    -- Check for Regroupement_Client field specifically
    SELECT TOP 5 
        ID_Dossier,
        Regroupement_Client,
        Libelle_Regime_Declaration,
        Regime,
        Pays_Origine,
        HS_Code
    FROM VNotesDetail
    WHERE Regroupement_Client IS NOT NULL;
END
ELSE
BEGIN
    PRINT 'VNotesDetail view does not exist'
END

-- 3. Check VDossiers structure for comparison
SELECT 
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'VDossiers'
    AND COLUMN_NAME LIKE '%Statut%'
ORDER BY ORDINAL_POSITION;