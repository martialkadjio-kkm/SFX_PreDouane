-- Test direct de la procédure avec les valeurs exactes
USE [SFX Transit]
GO

-- Remettre le statut à 0
UPDATE TDossiers SET [Statut Dossier] = 0 WHERE [ID Dossier] = 1

-- Supprimer les notes existantes pour ce dossier
DELETE nd
FROM TNotesDetail nd
INNER JOIN TColisageDossiers c ON nd.[Colisage Dossier] = c.[ID Colisage Dossier]
WHERE c.Dossier = 1

PRINT 'Dossier préparé (statut=0, notes supprimées)'
PRINT ''

-- Tester la fonction fx_TauxChangeDossier avec la date EXACTE de la conversion
DECLARE @DateExacte DATETIME = '2025-12-08 23:00:00.0000000'

PRINT 'Test de fx_TauxChangeDossier avec date exacte:'
SELECT * FROM dbo.fx_TauxChangeDossier(1, @DateExacte)

PRINT ''
PRINT 'Exécution de la procédure...'

BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = 1,
        @DateDeclaration = @DateExacte
    
    PRINT 'SUCCESS: Procédure exécutée'
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE()
END CATCH

PRINT ''
PRINT 'Vérification des notes créées:'
SELECT COUNT(*) as [Nombre de notes]
FROM TNotesDetail nd
INNER JOIN TColisageDossiers c ON nd.[Colisage Dossier] = c.[ID Colisage Dossier]
WHERE c.Dossier = 1

PRINT ''
PRINT 'Statut final du dossier:'
SELECT [Statut Dossier] FROM TDossiers WHERE [ID Dossier] = 1
