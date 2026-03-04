-- TEST GÉNÉRATION NOTE AVEC DATE SANS HEURE
-- ==========================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 23:00:00.000'  -- DATE EXACTE de la conversion ID 13

PRINT '🧪 TEST GÉNÉRATION NOTE AVEC DATE EXACTE DE LA CONVERSION'
PRINT '============================================'
PRINT 'Dossier: ' + CAST(@Id_Dossier AS VARCHAR(10))
PRINT 'Date: ' + CAST(@DateDeclaration AS VARCHAR(20))
PRINT ''

-- 1. Vérifier le statut avant
PRINT '1️⃣ STATUT AVANT'
PRINT '-------------'
SELECT 
    [ID Dossier],
    [Statut Dossier],
    [Numero Dossier]
FROM TDossiers 
WHERE [ID Dossier] = @Id_Dossier

-- 2. Compter les notes avant
DECLARE @NotesAvant INT
SELECT @NotesAvant = COUNT(*) 
FROM TNotesDetail nd
INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
WHERE cd.Dossier = @Id_Dossier

PRINT ''
PRINT '2️⃣ NOTES AVANT'
PRINT '------------'
PRINT 'Notes existantes: ' + CAST(@NotesAvant AS VARCHAR(10))

-- 3. Tester la fonction fx_TauxChangeDossier avec DATE au lieu de DATETIME
PRINT ''
PRINT '3️⃣ TEST FONCTION fx_TauxChangeDossier'
PRINT '-----------------------------------'

SELECT 
    [ID_Devise],
    [Code_Devise],
    [Taux_Change],
    [ID_Convertion]
FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration)

-- 4. Exécuter la procédure avec DATETIME
PRINT ''
PRINT '4️⃣ EXÉCUTION PROCÉDURE AVEC DATETIME'
PRINT '-------------------------------'

BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier, 
        @DateDeclaration = @DateDeclaration
    
    PRINT '✅ Procédure exécutée avec succès'
    
END TRY
BEGIN CATCH
    PRINT '❌ ERREUR: ' + ERROR_MESSAGE()
END CATCH

-- 5. Vérifier le résultat
PRINT ''
PRINT '5️⃣ RÉSULTAT'
PRINT '---------'

-- Compter les notes après
DECLARE @NotesApres INT
SELECT @NotesApres = COUNT(*) 
FROM TNotesDetail nd
INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
WHERE cd.Dossier = @Id_Dossier

PRINT 'Notes après: ' + CAST(@NotesApres AS VARCHAR(10))
PRINT 'Nouvelles notes: ' + CAST(@NotesApres - @NotesAvant AS VARCHAR(10))

-- Vérifier le statut après
SELECT 
    [ID Dossier],
    [Statut Dossier],
    [Numero Dossier]
FROM TDossiers 
WHERE [ID Dossier] = @Id_Dossier

-- Afficher quelques notes créées
IF @NotesApres > @NotesAvant
BEGIN
    PRINT ''
    PRINT 'Exemples de notes créées:'
    SELECT TOP 3
        nd.[ID Note Detail],
        nd.[Colisage Dossier],
        nd.[Regime],
        nd.[Base Qte],
        nd.[Base Prix Unitaire],
        cd.[Description Colis]
    FROM TNotesDetail nd
    INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
    WHERE cd.Dossier = @Id_Dossier
    ORDER BY nd.[ID Note Detail] DESC
END

PRINT ''
PRINT '🏁 TEST TERMINÉ'
PRINT '=============='