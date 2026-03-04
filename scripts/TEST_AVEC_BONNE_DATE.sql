-- Test avec la date exacte de la conversion
USE [SFX Transit]
GO

DECLARE @Id_Dossier INT = 1
DECLARE @DateDeclaration DATETIME = '2025-12-08 23:00:00' -- Avec l'heure!

PRINT 'Test avec la date exacte: 2025-12-08 23:00:00'
PRINT ''

-- Tester fx_TauxChangeDossier
PRINT 'Résultat de fx_TauxChangeDossier:'
SELECT * FROM dbo.fx_TauxChangeDossier(@Id_Dossier, @DateDeclaration)

PRINT ''
PRINT 'Exécution de la procédure...'
BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier,
        @DateDeclaration = @DateDeclaration
    
    PRINT 'SUCCESS!'
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE()
END CATCH

-- Vérifier les notes créées
PRINT ''
PRINT 'Notes créées:'
SELECT COUNT(*) as [Nombre de notes]
FROM TNotesDetail nd
INNER JOIN TColisageDossiers c ON nd.[Colisage Dossier] = c.[ID Colisage Dossier]
WHERE c.Dossier = @Id_Dossier
