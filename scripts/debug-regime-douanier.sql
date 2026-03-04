-- Vérifier les régimes douaniers disponibles
SELECT [ID Regime Douanier], [Code Regime Douanier], [Libelle Regime Douanier]
FROM TRegimesDouaniers
ORDER BY [ID Regime Douanier];

-- Vérifier s'il y a un régime avec ID 0
SELECT COUNT(*) as 'Regime_ID_0_Count'
FROM TRegimesDouaniers
WHERE [ID Regime Douanier] = 0;

-- Vérifier les contraintes CHECK sur TRegimesDeclarations
SELECT 
    cc.CONSTRAINT_NAME,
    cc.CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_TABLE_USAGE ctu 
    ON cc.CONSTRAINT_NAME = ctu.CONSTRAINT_NAME
WHERE ctu.TABLE_NAME = 'TRegimesDeclarations';

-- Vérifier la structure de la table TRegimesDeclarations
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TRegimesDeclarations'
ORDER BY ORDINAL_POSITION;