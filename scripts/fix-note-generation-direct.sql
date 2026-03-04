-- CORRECTION DIRECTE GÉNÉRATION NOTE DE DÉTAIL - DOSSIER 6
-- =========================================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 00:00:00.000'

PRINT '🔧 CORRECTION DIRECTE GÉNÉRATION NOTE DE DÉTAIL'
PRINT '=============================================='

-- 1. Créer une version modifiée de la procédure qui contourne fx_TauxChangeDossier
PRINT ''
PRINT '1️⃣ PRÉPARATION DES TAUX DE CHANGE'
PRINT '--------------------------------'

-- Créer la table temporaire avec les bons taux
DECLARE @TAUX_DEVISES TABLE (
    [ID_Devise] int PRIMARY KEY NOT NULL,  
    [Code_Devise] nvarchar(5) NOT NULL, 
    [Taux_Change] numeric(24,6), 
    [ID_Convertion] int NOT NULL
)

-- Insérer manuellement les taux que nous savons être corrects
INSERT INTO @TAUX_DEVISES([ID_Devise],[Code_Devise],[Taux_Change], [ID_Convertion])
SELECT 
    d.[ID Devise] as ID_Devise,
    d.[Code Devise] as Code_Devise,
    tc.[Taux Change] as Taux_Change,
    13 as ID_Convertion
FROM TColisageDossiers cd
INNER JOIN TDevises d ON cd.Devise = d.[ID Devise]
INNER JOIN TTauxChange tc ON d.[ID Devise] = tc.Devise AND tc.Convertion = 13
WHERE cd.Dossier = @Id_Dossier
GROUP BY d.[ID Devise], d.[Code Devise], tc.[Taux Change]

PRINT 'Taux préparés:'
SELECT * FROM @TAUX_DEVISES

-- 2. Vérifications préalables (comme dans la procédure originale)
PRINT ''
PRINT '2️⃣ VÉRIFICATIONS PRÉALABLES'
PRINT '--------------------------'

-- Vérifier statut dossier
IF NOT EXISTS(SELECT TOP 1 [ID Dossier] FROM TDossiers WHERE ([ID Dossier]=@Id_Dossier) AND ([Statut Dossier]=0))
BEGIN
    PRINT '❌ ERREUR: Dossier pas en cours'
    RETURN
END

-- Vérifier taux de change
IF EXISTS(SELECT TOP 1 [ID_Devise] FROM @TAUX_DEVISES WHERE ISNULL([Taux_Change],0)<=0)
BEGIN
    PRINT '❌ ERREUR: Taux de change invalides'
    RETURN
END

-- Vérifier colisages
IF NOT EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier]=@Id_Dossier)
BEGIN
    PRINT '❌ ERREUR: Pas de colisages'
    RETURN
END

-- Vérifier HS Code et régimes
IF EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE ([Dossier]=@Id_Dossier) AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL)))
BEGIN
    PRINT '❌ ERREUR: HS Code ou régime manquant'
    
    SELECT 
        [Description Colis],
        [HS Code],
        [Regime Declaration]
    FROM TColisageDossiers 
    WHERE ([Dossier]=@Id_Dossier) 
      AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL))
    
    RETURN
END

PRINT '✅ Toutes les vérifications OK'

-- 3. Compter les notes avant
DECLARE @NotesAvant INT
SELECT @NotesAvant = COUNT(*) 
FROM TNotesDetail nd
INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
WHERE cd.Dossier = @Id_Dossier

PRINT 'Notes avant: ' + CAST(@NotesAvant AS VARCHAR(10))

-- 4. Exécution manuelle de la logique de création des notes
PRINT ''
PRINT '3️⃣ CRÉATION MANUELLE DES NOTES DE DÉTAIL'
PRINT '---------------------------------------'

BEGIN TRY
    BEGIN TRANSACTION;

    -- Traitement DC=0% (EXO)
    INSERT INTO [dbo].[TNotesDetail]([Colisage Dossier],[Regime],[Base Qte],[Base Prix Unitaire],[Base Poids Brut],[Base Poids Net],[Base Volume])
    SELECT 
        A.[ID Colisage Dossier],
        N'',
        A.[Qte Colis],
        0,
        A.[Poids Brut],
        A.[Poids Net],
        A.Volume
    FROM [dbo].[TColisageDossiers] A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
    WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=0)

    PRINT 'Notes DC=0% créées: ' + CAST(@@ROWCOUNT AS VARCHAR(10))

    -- Traitement DC=100%
    INSERT INTO [dbo].[TNotesDetail]([Colisage Dossier],[Regime],[Base Qte],[Base Prix Unitaire],[Base Poids Brut],[Base Poids Net],[Base Volume])
    SELECT 
        A.[ID Colisage Dossier],
        N'DC',
        A.[Qte Colis],
        A.[Prix Unitaire Facture]*B.[Taux DC],
        A.[Poids Brut],
        A.[Poids Net],
        A.Volume
    FROM [dbo].[TColisageDossiers] A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
    WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=1)

    PRINT 'Notes DC=100% créées: ' + CAST(@@ROWCOUNT AS VARCHAR(10))

    -- Traitement DC=x% (cas DC)
    INSERT INTO [dbo].[TNotesDetail]([Colisage Dossier],[Regime],[Base Qte],[Base Prix Unitaire],[Base Poids Brut],[Base Poids Net],[Base Volume])
    SELECT 
        A.[ID Colisage Dossier],
        N'DC',
        A.[Qte Colis]*B.[Taux DC],
        A.[Prix Unitaire Facture],
        A.[Poids Brut]*B.[Taux DC],
        A.[Poids Net]*B.[Taux DC],
        A.[Volume]*B.[Taux DC]
    FROM [dbo].[TColisageDossiers] A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
    WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))

    PRINT 'Notes DC=x% (DC) créées: ' + CAST(@@ROWCOUNT AS VARCHAR(10))

    -- Traitement DC=x% (cas TR)
    INSERT INTO [dbo].[TNotesDetail]([Colisage Dossier],[Regime],[Base Qte],[Base Prix Unitaire],[Base Poids Brut],[Base Poids Net],[Base Volume])
    SELECT 
        A.[ID Colisage Dossier],
        N'TR',
        A.[Qte Colis]*(1-B.[Taux DC]),
        A.[Prix Unitaire Facture],
        A.[Poids Brut]*(1-B.[Taux DC]),
        A.[Poids Net]*(1-B.[Taux DC]),
        A.[Volume]*(1-B.[Taux DC])
    FROM [dbo].[TColisageDossiers] A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
    INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
    WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))

    PRINT 'Notes DC=x% (TR) créées: ' + CAST(@@ROWCOUNT AS VARCHAR(10))

    -- Mise à jour du statut du dossier
    UPDATE dbo.TDossiers SET [Statut Dossier]=-1 WHERE [ID Dossier]=@Id_Dossier
    PRINT 'Statut dossier mis à jour à -1'

    -- Création de l'étape de clôture
    INSERT INTO dbo.TEtapesDossiers ([Dossier], [Etape Dossier],[Date Debut], [Date Fin])
    VALUES (@Id_Dossier, 1, GETDATE(), GETDATE())
    PRINT 'Étape de clôture créée'

    -- Mise à jour du lien de conversion
    DECLARE @ID_Convertion INT = 13
    UPDATE dbo.TDossiers SET [Convertion]=@ID_Convertion WHERE [ID Dossier] =@Id_Dossier
    PRINT 'Lien conversion mis à jour'

    -- Recalcul de la dernière étape
    EXEC [dbo].[pSP_RecalculeDerniereEtapeDossier] @Id_Dossier
    PRINT 'Dernière étape recalculée'

    COMMIT TRANSACTION;
    PRINT '✅ TRANSACTION VALIDÉE'

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT '❌ ERREUR: ' + ERROR_MESSAGE()
    RETURN
END CATCH

-- 5. Vérifier le résultat
PRINT ''
PRINT '4️⃣ VÉRIFICATION DU RÉSULTAT'
PRINT '--------------------------'

DECLARE @NotesApres INT
SELECT @NotesApres = COUNT(*) 
FROM TNotesDetail nd
INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
WHERE cd.Dossier = @Id_Dossier

PRINT 'Notes après: ' + CAST(@NotesApres AS VARCHAR(10))
PRINT 'Nouvelles notes: ' + CAST(@NotesApres - @NotesAvant AS VARCHAR(10))

-- Vérifier le statut final
SELECT 
    [ID Dossier],
    [Statut Dossier],
    [Convertion],
    [Numero Dossier]
FROM TDossiers 
WHERE [ID Dossier] = @Id_Dossier

-- Afficher quelques notes créées
SELECT TOP 5
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

PRINT ''
PRINT '🏁 CORRECTION TERMINÉE AVEC SUCCÈS !'
PRINT '=================================='