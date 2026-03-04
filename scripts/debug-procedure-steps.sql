-- DIAGNOSTIC BASÉ SUR LA VRAIE PROCÉDURE pSP_CreerNoteDetail
-- ===========================================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 00:00:00.000'

PRINT '🔍 DIAGNOSTIC PROCÉDURE pSP_CreerNoteDetail - DOSSIER 6'
PRINT '======================================================='

-- ÉTAPE 1: Vérifier que le dossier est en cours (Statut Dossier = 0)
PRINT ''
PRINT '1️⃣ VÉRIFICATION STATUT DOSSIER (doit être 0)'
PRINT '--------------------------------------------'

IF NOT EXISTS(SELECT TOP 1 [ID Dossier] FROM TDossiers WHERE ([ID Dossier]=@Id_Dossier) AND ([Statut Dossier]=0))
BEGIN
    PRINT '❌ ÉCHEC: FILE IS NOT IN PROGRESS'
    SELECT 
        [ID Dossier],
        [Statut Dossier],
        [Numero Dossier]
    FROM TDossiers 
    WHERE [ID Dossier] = @Id_Dossier
    
    PRINT 'Le dossier doit avoir [Statut Dossier] = 0 pour être traité'
    RETURN
END
ELSE
BEGIN
    PRINT '✅ SUCCESS: Dossier en cours'
    SELECT 
        [ID Dossier],
        [Statut Dossier],
        [Numero Dossier]
    FROM TDossiers 
    WHERE [ID Dossier] = @Id_Dossier
END

-- ÉTAPE 2: Vérifier les taux de change avec fx_TauxChangeDossier
PRINT ''
PRINT '2️⃣ VÉRIFICATION TAUX DE CHANGE'
PRINT '------------------------------'

DECLARE @TAUX_DEVISES TABLE (
    [ID_Devise] int PRIMARY KEY NOT NULL,  
    [Code_Devise] nvarchar(5) NOT NULL, 
    [Taux_Change] numeric(24,6), 
    [ID_Convertion] int NOT NULL
)

INSERT INTO @TAUX_DEVISES([ID_Devise],[Code_Devise],[Taux_Change], [ID_Convertion])
SELECT [ID_Devise],[Code_Devise],[Taux_Change], [ID_Convertion]
FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration)

PRINT 'Taux de change récupérés:'
SELECT * FROM @TAUX_DEVISES

IF EXISTS(SELECT TOP 1 [ID_Devise] FROM @TAUX_DEVISES WHERE ISNULL([Taux_Change],0)<=0)
BEGIN
    PRINT '❌ ÉCHEC: MISSING OR WRONG EXCHANGE RATE'
    
    DECLARE @Values nvarchar(max)
    SET @Values=STUFF((SELECT DISTINCT ' ¤ '+[Code_Devise] AS [text()]
                      FROM @TAUX_DEVISES
                      WHERE [Taux_Change] IS NULL OR [Taux_Change] <= 0
                      FOR XML PATH('') ),1,3,'')
    
    PRINT 'Devises avec taux manquants ou incorrects: ' + @Values
    RETURN
END
ELSE
BEGIN
    PRINT '✅ SUCCESS: Tous les taux de change sont valides'
END

-- ÉTAPE 3: Vérifier existence des colisages
PRINT ''
PRINT '3️⃣ VÉRIFICATION COLISAGES'
PRINT '-------------------------'

IF NOT EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier]=@Id_Dossier)
BEGIN
    PRINT '❌ ÉCHEC: MISSING PACKING LIST ON FILE'
    RETURN
END
ELSE
BEGIN
    PRINT '✅ SUCCESS: Colisages trouvés'
    SELECT COUNT(*) as NombreColisages FROM TColisageDossiers WHERE [Dossier]=@Id_Dossier
END

-- ÉTAPE 4: Vérifier HS Code et régime sur toutes les lignes
PRINT ''
PRINT '4️⃣ VÉRIFICATION HS CODE ET RÉGIMES'
PRINT '----------------------------------'

IF EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE ([Dossier]=@Id_Dossier) AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL)))
BEGIN
    PRINT '❌ ÉCHEC: MISSING HS CODE OR REGIME FOR LINES'
    
    SET @Values=STUFF((SELECT DISTINCT ' ¤ '+[Description Colis] AS [text()]
                      FROM TColisageDossiers
                      WHERE ([Dossier]=@Id_Dossier) AND ([HS Code] IS NULL)
                      FOR XML PATH('') ),1,3,'')
    
    PRINT 'Lignes sans HS Code: ' + ISNULL(@Values, 'Aucune')
    
    -- Vérifier aussi les régimes manquants
    SET @Values=STUFF((SELECT DISTINCT ' ¤ '+[Description Colis] AS [text()]
                      FROM TColisageDossiers
                      WHERE ([Dossier]=@Id_Dossier) AND ([Regime Declaration] IS NULL)
                      FOR XML PATH('') ),1,3,'')
    
    PRINT 'Lignes sans Régime: ' + ISNULL(@Values, 'Aucune')
    
    -- Afficher le détail des colisages problématiques
    SELECT 
        [ID Colisage Dossier],
        [Description Colis],
        [HS Code],
        [Regime Declaration],
        CASE 
            WHEN [HS Code] IS NULL THEN 'HS Code manquant'
            WHEN [Regime Declaration] IS NULL THEN 'Régime manquant'
            ELSE 'OK'
        END as Probleme
    FROM TColisageDossiers 
    WHERE ([Dossier]=@Id_Dossier) 
      AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL))
    
    RETURN
END
ELSE
BEGIN
    PRINT '✅ SUCCESS: Tous les colisages ont HS Code et Régime'
    
    -- Afficher un résumé des régimes utilisés
    SELECT 
        rd.[Libelle Regime Declaration],
        rd.[Taux DC],
        COUNT(*) as NombreColisages
    FROM TColisageDossiers cd
    INNER JOIN TRegimesDeclarations rd ON cd.[Regime Declaration] = rd.[ID Regime Declaration]
    WHERE cd.[Dossier] = @Id_Dossier
    GROUP BY rd.[Libelle Regime Declaration], rd.[Taux DC]
    ORDER BY rd.[Taux DC]
END

-- ÉTAPE 5: Compter les notes existantes AVANT
PRINT ''
PRINT '5️⃣ NOTES EXISTANTES AVANT EXÉCUTION'
PRINT '-----------------------------------'

DECLARE @NotesAvant INT
SELECT @NotesAvant = COUNT(*) FROM TNotesDetail WHERE [Colisage Dossier] IN (
    SELECT [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier] = @Id_Dossier
)

PRINT 'Notes existantes: ' + CAST(@NotesAvant AS VARCHAR(10))

-- ÉTAPE 6: Exécuter la procédure
PRINT ''
PRINT '6️⃣ EXÉCUTION DE LA PROCÉDURE'
PRINT '----------------------------'

BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier, 
        @DateDeclaration = @DateDeclaration
    
    PRINT '✅ SUCCESS: Procédure exécutée sans erreur'
END TRY
BEGIN CATCH
    PRINT '❌ ERREUR lors de l''exécution:'
    PRINT 'Message: ' + ERROR_MESSAGE()
    PRINT 'Numéro: ' + CAST(ERROR_NUMBER() AS VARCHAR(10))
    PRINT 'Sévérité: ' + CAST(ERROR_SEVERITY() AS VARCHAR(10))
    PRINT 'État: ' + CAST(ERROR_STATE() AS VARCHAR(10))
    PRINT 'Ligne: ' + CAST(ERROR_LINE() AS VARCHAR(10))
    RETURN
END CATCH

-- ÉTAPE 7: Vérifier le résultat
PRINT ''
PRINT '7️⃣ VÉRIFICATION DU RÉSULTAT'
PRINT '---------------------------'

DECLARE @NotesApres INT
SELECT @NotesApres = COUNT(*) FROM TNotesDetail WHERE [Colisage Dossier] IN (
    SELECT [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier] = @Id_Dossier
)

PRINT 'Notes après: ' + CAST(@NotesApres AS VARCHAR(10))
PRINT 'Nouvelles notes créées: ' + CAST(@NotesApres - @NotesAvant AS VARCHAR(10))

-- Vérifier le statut du dossier
SELECT 
    [ID Dossier],
    [Statut Dossier],
    [Numero Dossier],
    [Convertion]
FROM TDossiers 
WHERE [ID Dossier] = @Id_Dossier

-- Afficher quelques notes créées
IF @NotesApres > @NotesAvant
BEGIN
    PRINT ''
    PRINT 'Exemples de notes créées:'
    SELECT TOP 5
        nd.[ID Note Detail],
        nd.[Colisage Dossier],
        nd.[Regime],
        nd.[Base Qte],
        nd.[Base Prix Unitaire]
    FROM TNotesDetail nd
    INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
    WHERE cd.[Dossier] = @Id_Dossier
    ORDER BY nd.[ID Note Detail] DESC
END

PRINT ''
PRINT '🏁 FIN DU DIAGNOSTIC'
PRINT '==================='