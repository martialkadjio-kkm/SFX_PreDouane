-- VÉRIFICATION DES RÉGIMES DES COLISAGES DU DOSSIER 6
-- ===================================================

DECLARE @Id_Dossier INT = 6

PRINT '🔍 VÉRIFICATION RÉGIMES COLISAGES DOSSIER 6'
PRINT '=========================================='

-- 1. Voir tous les colisages avec leurs régimes
SELECT 
    cd.[ID Colisage Dossier],
    cd.[Description Colis],
    cd.[Regime Declaration] as RegimeID_Colisage,
    rd.[ID Regime Declaration] as RegimeID_Table,
    rd.[Libelle Regime Declaration],
    rd.[Taux DC],
    CASE 
        WHEN cd.[Regime Declaration] IS NULL THEN 'REGIME NULL'
        WHEN rd.[ID Regime Declaration] IS NULL THEN 'REGIME INTROUVABLE'
        ELSE 'OK'
    END as Statut
FROM TColisageDossiers cd
LEFT JOIN TRegimesDeclarations rd ON cd.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE cd.[Dossier] = @Id_Dossier
ORDER BY cd.[ID Colisage Dossier]

-- 2. Compter les problèmes
PRINT ''
PRINT 'RÉSUMÉ:'

DECLARE @Total INT, @RegimeNull INT, @RegimeIntrouvable INT, @RegimeOK INT

SELECT @Total = COUNT(*) FROM TColisageDossiers WHERE [Dossier] = @Id_Dossier

SELECT @RegimeNull = COUNT(*) 
FROM TColisageDossiers 
WHERE [Dossier] = @Id_Dossier AND [Regime Declaration] IS NULL

SELECT @RegimeIntrouvable = COUNT(*) 
FROM TColisageDossiers cd
LEFT JOIN TRegimesDeclarations rd ON cd.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE cd.[Dossier] = @Id_Dossier 
  AND cd.[Regime Declaration] IS NOT NULL 
  AND rd.[ID Regime Declaration] IS NULL

SET @RegimeOK = @Total - @RegimeNull - @RegimeIntrouvable

PRINT 'Total colisages: ' + CAST(@Total AS VARCHAR(10))
PRINT 'Régimes NULL: ' + CAST(@RegimeNull AS VARCHAR(10))
PRINT 'Régimes introuvables: ' + CAST(@RegimeIntrouvable AS VARCHAR(10))
PRINT 'Régimes OK: ' + CAST(@RegimeOK AS VARCHAR(10))

-- 3. Voir tous les régimes disponibles
PRINT ''
PRINT 'RÉGIMES DISPONIBLES:'
SELECT 
    [ID Regime Declaration],
    [Libelle Regime Declaration],
    [Taux DC]
FROM TRegimesDeclarations
ORDER BY [ID Regime Declaration]