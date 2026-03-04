-- ============================================================================
-- Script de test complet pour pSP_CreerNoteDetail
-- ============================================================================

USE [SFX Transit]
GO

DECLARE @Id_Dossier INT = 1
DECLARE @DateDeclaration DATETIME = '2025-12-08'

PRINT '========================================='
PRINT 'TEST DE LA PROCÉDURE pSP_CreerNoteDetail'
PRINT '========================================='
PRINT ''

-- 1. Vérifier le statut du dossier
PRINT '1. Statut du dossier:'
SELECT [ID Dossier], [No Dossier], [Statut Dossier]
FROM TDossiers
WHERE [ID Dossier] = @Id_Dossier

-- 2. Vérifier les colisages
PRINT ''
PRINT '2. Colisages:'
SELECT COUNT(*) as [Nombre de colisages]
FROM TColisageDossiers
WHERE [Dossier] = @Id_Dossier

-- 3. Vérifier les devises
PRINT ''
PRINT '3. Devises utilisées:'
SELECT DISTINCT c.Devise, d.[Code Devise]
FROM TColisageDossiers c
INNER JOIN TDevises d ON c.Devise = d.[ID Devise]
WHERE c.Dossier = @Id_Dossier

-- 4. Vérifier l'entité
PRINT ''
PRINT '4. Entité du dossier:'
SELECT C.[ID Entite], C.[Nom Entite], D.[ID Pays], D.[Libelle Pays], D.[Devise Locale]
FROM dbo.TDossiers A
INNER JOIN dbo.TBranches B On A.[Branche]=B.[ID Branche]
INNER JOIN dbo.TEntites C ON B.[Entite]=C.[ID Entite]
INNER JOIN dbo.TPays D ON C.[Pays]=D.[ID Pays]
WHERE A.[ID Dossier]=@Id_Dossier

-- 5. Vérifier la conversion
PRINT ''
PRINT '5. Conversion pour cette date et entité:'
SELECT c.[ID Convertion], c.[Date Convertion], c.[Entite]
FROM TConvertions c
INNER JOIN (
    SELECT C.[ID Entite]
    FROM dbo.TDossiers A
    INNER JOIN dbo.TBranches B On A.[Branche]=B.[ID Branche]
    INNER JOIN dbo.TEntites C ON B.[Entite]=C.[ID Entite]
    WHERE A.[ID Dossier]=@Id_Dossier
) e ON c.Entite = e.[ID Entite]
WHERE c.[Date Convertion] = @DateDeclaration

-- 6. Vérifier les taux de change
PRINT ''
PRINT '6. Taux de change:'
SELECT t.Devise, d.[Code Devise], t.[Taux Change]
FROM TTauxChange t
INNER JOIN TDevises d ON t.Devise = d.[ID Devise]
WHERE t.Convertion IN (
    SELECT c.[ID Convertion]
    FROM TConvertions c
    INNER JOIN (
        SELECT C.[ID Entite]
        FROM dbo.TDossiers A
        INNER JOIN dbo.TBranches B On A.[Branche]=B.[ID Branche]
        INNER JOIN dbo.TEntites C ON B.[Entite]=C.[ID Entite]
        WHERE A.[ID Dossier]=@Id_Dossier
    ) e ON c.Entite = e.[ID Entite]
    WHERE c.[Date Convertion] = @DateDeclaration
)

-- 7. Tester la fonction fx_TauxChangeDossier
PRINT ''
PRINT '7. Résultat de fx_TauxChangeDossier:'
SELECT * FROM dbo.fx_TauxChangeDossier(@Id_Dossier, @DateDeclaration)

-- 8. Exécuter la procédure
PRINT ''
PRINT '8. Exécution de la procédure...'
BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier,
        @DateDeclaration = @DateDeclaration
    
    PRINT 'SUCCESS: Procédure exécutée sans erreur'
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE()
END CATCH

-- 9. Vérifier les notes créées
PRINT ''
PRINT '9. Notes créées:'
SELECT COUNT(*) as [Nombre de notes]
FROM TNotesDetail nd
INNER JOIN TColisageDossiers c ON nd.[Colisage Dossier] = c.[ID Colisage Dossier]
WHERE c.Dossier = @Id_Dossier

PRINT ''
PRINT '========================================='
PRINT 'FIN DU TEST'
PRINT '========================================='
