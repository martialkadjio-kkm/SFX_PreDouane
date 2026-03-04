-- VÉRIFICATION CRÉATION DES NOTES DE DÉTAIL
-- ==========================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 23:00:00.000'

PRINT '🔍 VÉRIFICATION CRÉATION NOTES DE DÉTAIL'
PRINT '======================================'

-- 1. Compter les notes AVANT
DECLARE @NotesAvant INT
SELECT @NotesAvant = COUNT(*) 
FROM TNotesDetail nd
INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
WHERE cd.Dossier = @Id_Dossier

PRINT 'Notes AVANT: ' + CAST(@NotesAvant AS VARCHAR(10))

-- 2. Exécuter la procédure
PRINT ''
PRINT 'Exécution de la procédure...'

BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier, 
        @DateDeclaration = @DateDeclaration
    
    PRINT '✅ Procédure exécutée'
    
END TRY
BEGIN CATCH
    PRINT '❌ ERREUR: ' + ERROR_MESSAGE()
    RETURN
END CATCH

-- 3. Compter les notes APRÈS
DECLARE @NotesApres INT
SELECT @NotesApres = COUNT(*) 
FROM TNotesDetail nd
INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
WHERE cd.Dossier = @Id_Dossier

PRINT ''
PRINT 'Notes APRÈS: ' + CAST(@NotesApres AS VARCHAR(10))
PRINT 'Nouvelles notes: ' + CAST(@NotesApres - @NotesAvant AS VARCHAR(10))

-- 4. Si des notes ont été créées, les afficher
IF @NotesApres > @NotesAvant
BEGIN
    PRINT ''
    PRINT 'NOTES CRÉÉES:'
    SELECT 
        nd.[ID Note Detail],
        nd.[Colisage Dossier],
        nd.[Regime],
        nd.[Base Qte],
        nd.[Base Prix Unitaire],
        nd.[Base Poids Brut],
        nd.[Base Poids Net],
        nd.[Base Volume],
        cd.[Description Colis]
    FROM TNotesDetail nd
    INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
    WHERE cd.Dossier = @Id_Dossier
    ORDER BY nd.[ID Note Detail] DESC
END
ELSE
BEGIN
    PRINT ''
    PRINT '❌ AUCUNE NOTE CRÉÉE - DIAGNOSTIC:'
    
    -- Vérifier pourquoi aucune note n'est créée
    PRINT ''
    PRINT 'Colisages avec Taux DC = 0:'
    SELECT COUNT(*) as NbColisages
    FROM [dbo].[TColisageDossiers] A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
    WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=0)
    
    PRINT 'Colisages avec Taux DC = 1:'
    SELECT COUNT(*) as NbColisages
    FROM [dbo].[TColisageDossiers] A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
    WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=1)
    
    PRINT 'Colisages avec Taux DC partiel:'
    SELECT COUNT(*) as NbColisages
    FROM [dbo].[TColisageDossiers] A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
    WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))
    
    -- Vérifier les jointures
    PRINT ''
    PRINT 'Vérification des jointures:'
    SELECT 
        COUNT(*) as TotalColisages,
        COUNT(B.[ID Regime Declaration]) as AvecRegime,
        COUNT(C.ID_Devise) as AvecTaux
    FROM [dbo].[TColisageDossiers] A
    LEFT JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    LEFT JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
    WHERE A.[Dossier]=@Id_Dossier
END

-- 5. Vérifier le statut du dossier
PRINT ''
PRINT 'STATUT DOSSIER:'
SELECT 
    [ID Dossier],
    [Statut Dossier],
    [Numero Dossier]
FROM TDossiers 
WHERE [ID Dossier] = @Id_Dossier

PRINT ''
PRINT '🏁 FIN VÉRIFICATION'