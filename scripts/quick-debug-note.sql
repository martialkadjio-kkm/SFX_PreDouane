-- DIAGNOSTIC RAPIDE GÉNÉRATION NOTE DE DÉTAIL - DOSSIER 6
-- =========================================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 00:00:00.000'

PRINT '🔍 DIAGNOSTIC RAPIDE - DOSSIER 6'
PRINT '================================='

-- 1. Vérifier le dossier et son statut
PRINT '1. STATUT DOSSIER:'
SELECT 
    d.ID,
    d.[Numero Dossier],
    d.Statut,
    s.Libelle as StatutLibelle,
    d.Etape,
    e.[Libelle Etape] as EtapeLibelle
FROM TDossiers d
LEFT JOIN TStatutsDossiers s ON d.Statut = s.ID
LEFT JOIN TEtapes e ON d.Etape = e.[ID Etape]
WHERE d.ID = @Id_Dossier

-- 2. Vérifier les colisages
PRINT '2. COLISAGES:'
SELECT 
    COUNT(*) as Total,
    COUNT(CASE WHEN [HS Code] IS NULL THEN 1 END) as SansHSCode,
    COUNT(CASE WHEN [Regime Declaration] IS NULL THEN 1 END) as SansRegime,
    COUNT(CASE WHEN Devise IS NULL THEN 1 END) as SansDevise
FROM TColisageDossiers 
WHERE Dossier = @Id_Dossier

-- 3. Vérifier la branche et l'entité
PRINT '3. BRANCHE ET ENTITÉ:'
SELECT 
    d.Branche,
    b.Entite,
    e.[Nom Entite]
FROM TDossiers d
INNER JOIN TBranches b ON d.Branche = b.ID
INNER JOIN TEntites e ON b.Entite = e.ID
WHERE d.ID = @Id_Dossier

-- 4. Vérifier la conversion pour la date
PRINT '4. CONVERSION POUR LA DATE:'
SELECT 
    c.[ID Convertion],
    c.[Date Convertion],
    c.Entite
FROM TConvertions c
INNER JOIN TDossiers d ON d.Branche IN (SELECT ID FROM TBranches WHERE Entite = c.Entite)
WHERE d.ID = @Id_Dossier
  AND CAST(c.[Date Convertion] AS DATE) = CAST(@DateDeclaration AS DATE)

-- 5. Vérifier les taux de change
PRINT '5. TAUX DE CHANGE:'
SELECT 
    dev.[Code Devise],
    tc.[Taux Change],
    tc.Convertion
FROM TColisageDossiers cd
INNER JOIN TDevises dev ON cd.Devise = dev.ID
LEFT JOIN TTauxChange tc ON dev.ID = tc.Devise 
    AND tc.Convertion IN (
        SELECT c.[ID Convertion]
        FROM TConvertions c
        INNER JOIN TDossiers d ON d.Branche IN (SELECT ID FROM TBranches WHERE Entite = c.Entite)
        WHERE d.ID = @Id_Dossier
          AND CAST(c.[Date Convertion] AS DATE) = CAST(@DateDeclaration AS DATE)
    )
WHERE cd.Dossier = @Id_Dossier
GROUP BY dev.[Code Devise], tc.[Taux Change], tc.Convertion

-- 6. Notes existantes
PRINT '6. NOTES EXISTANTES:'
SELECT COUNT(*) as NotesExistantes
FROM TNotesDetail 
WHERE Dossier = @Id_Dossier

-- 7. TEST PROCÉDURE
PRINT '7. TEST PROCÉDURE:'
BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier, 
        @DateDeclaration = @DateDeclaration
    PRINT 'SUCCESS: Procédure exécutée'
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE()
    PRINT 'ERROR NUMBER: ' + CAST(ERROR_NUMBER() AS VARCHAR(10))
    PRINT 'ERROR SEVERITY: ' + CAST(ERROR_SEVERITY() AS VARCHAR(10))
    PRINT 'ERROR STATE: ' + CAST(ERROR_STATE() AS VARCHAR(10))
END CATCH

-- 8. Vérifier le résultat
PRINT '8. RÉSULTAT:'
SELECT COUNT(*) as NotesApres
FROM TNotesDetail 
WHERE Dossier = @Id_Dossier

-- Statut final
SELECT 
    d.Statut as StatutFinal,
    s.Libelle as StatutLibelleFinal
FROM TDossiers d
LEFT JOIN TStatutsDossiers s ON d.Statut = s.ID
WHERE d.ID = @Id_Dossier