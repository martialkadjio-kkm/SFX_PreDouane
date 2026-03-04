-- DIAGNOSTIC DÉTAILLÉ DE LA PROCÉDURE pSP_CreerNoteDetail
-- ========================================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 23:00:00.000'

PRINT '🔍 DIAGNOSTIC DÉTAILLÉ PROCÉDURE pSP_CreerNoteDetail'
PRINT '=================================================='
PRINT 'Dossier: ' + CAST(@Id_Dossier AS VARCHAR(10))
PRINT 'Date: ' + CAST(@DateDeclaration AS VARCHAR(30))
PRINT ''

-- 1. Vérifier les conditions préalables de la procédure
PRINT '1️⃣ VÉRIFICATIONS PRÉALABLES'
PRINT '-------------------------'

-- Condition 1: Dossier en cours (statut = 0)
IF NOT EXISTS(SELECT TOP 1 [ID Dossier] FROM TDossiers WHERE ([ID Dossier]=@Id_Dossier) AND ([Statut Dossier]=0))
BEGIN
    PRINT '❌ CONDITION 1 ÉCHOUÉE: Dossier pas en cours'
    SELECT [ID Dossier], [Statut Dossier], [Numero Dossier] FROM TDossiers WHERE [ID Dossier]=@Id_Dossier
    RETURN
END
ELSE
    PRINT '✅ CONDITION 1 OK: Dossier en cours'

-- Condition 2: Taux de change valides
DECLARE @TauxInvalides INT = 0
SELECT @TauxInvalides = COUNT(*)
FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration)
WHERE ISNULL([Taux_Change],0) <= 0

IF @TauxInvalides > 0
BEGIN
    PRINT '❌ CONDITION 2 ÉCHOUÉE: Taux de change invalides'
    SELECT * FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration)
    WHERE ISNULL([Taux_Change],0) <= 0
    RETURN
END
ELSE
    PRINT '✅ CONDITION 2 OK: Tous les taux valides'

-- Condition 3: Colisages existent
IF NOT EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier]=@Id_Dossier)
BEGIN
    PRINT '❌ CONDITION 3 ÉCHOUÉE: Pas de colisages'
    RETURN
END
ELSE
BEGIN
    DECLARE @NbColisages INT
    SELECT @NbColisages = COUNT(*) FROM TColisageDossiers WHERE [Dossier]=@Id_Dossier
    PRINT '✅ CONDITION 3 OK: ' + CAST(@NbColisages AS VARCHAR(10)) + ' colisage(s)'
END

-- Condition 4: HS Code et régimes présents
DECLARE @ColisagesSansHSouRegime INT
SELECT @ColisagesSansHSouRegime = COUNT(*)
FROM TColisageDossiers 
WHERE ([Dossier]=@Id_Dossier) 
  AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL))

IF @ColisagesSansHSouRegime > 0
BEGIN
    PRINT '❌ CONDITION 4 ÉCHOUÉE: HS Code ou régime manquant'
    SELECT 
        [ID Colisage Dossier],
        [Description Colis],
        [HS Code],
        [Regime Declaration]
    FROM TColisageDossiers 
    WHERE ([Dossier]=@Id_Dossier) 
      AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL))
    RETURN
END
ELSE
    PRINT '✅ CONDITION 4 OK: Tous les colisages ont HS Code et régime'

PRINT ''
PRINT '2️⃣ ANALYSE DES DONNÉES POUR INSERTION'
PRINT '-----------------------------------'

-- Analyser les données qui vont être utilisées pour les insertions
PRINT 'Données pour DC=0% (EXO):'
SELECT 
    A.[ID Colisage Dossier],
    A.[Description Colis],
    B.[Taux DC],
    A.[Qte Colis],
    A.[Poids Brut],
    A.[Poids Net],
    A.Volume,
    'EXO' as TypeRegime
FROM [dbo].[TColisageDossiers] A
INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=0)

PRINT ''
PRINT 'Données pour DC=100%:'
SELECT 
    A.[ID Colisage Dossier],
    A.[Description Colis],
    B.[Taux DC],
    A.[Qte Colis],
    A.[Prix Unitaire Facture],
    A.[Poids Brut],
    A.[Poids Net],
    A.Volume,
    'DC_100' as TypeRegime
FROM [dbo].[TColisageDossiers] A
INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=1)

PRINT ''
PRINT 'Données pour DC=x% (cas DC):'
SELECT 
    A.[ID Colisage Dossier],
    A.[Description Colis],
    B.[Taux DC],
    A.[Qte Colis],
    A.[Prix Unitaire Facture],
    A.[Poids Brut],
    A.[Poids Net],
    A.Volume,
    'DC_Partiel' as TypeRegime
FROM [dbo].[TColisageDossiers] A
INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))

PRINT ''
PRINT 'Données pour DC=x% (cas TR):'
SELECT 
    A.[ID Colisage Dossier],
    A.[Description Colis],
    B.[Taux DC],
    A.[Qte Colis],
    A.[Prix Unitaire Facture],
    A.[Poids Brut],
    A.[Poids Net],
    A.Volume,
    'TR_Partiel' as TypeRegime
FROM [dbo].[TColisageDossiers] A
INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))

PRINT ''
PRINT '3️⃣ VÉRIFICATION DES RÉGIMES DÉCLARATIONS'
PRINT '--------------------------------------'

SELECT 
    cd.[ID Colisage Dossier],
    cd.[Description Colis],
    cd.[Regime Declaration],
    rd.[ID Regime Declaration],
    rd.[Libelle Regime Declaration],
    rd.[Taux DC]
FROM TColisageDossiers cd
LEFT JOIN TRegimesDeclarations rd ON cd.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE cd.[Dossier] = @Id_Dossier
ORDER BY cd.[ID Colisage Dossier]

PRINT ''
PRINT '4️⃣ TEST MANUEL DES INSERTIONS'
PRINT '----------------------------'

-- Compter combien de lignes seraient insérées pour chaque cas
DECLARE @CountEXO INT, @CountDC100 INT, @CountDCPartiel INT, @CountTRPartiel INT

SELECT @CountEXO = COUNT(*)
FROM [dbo].[TColisageDossiers] A
INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=0)

SELECT @CountDC100 = COUNT(*)
FROM [dbo].[TColisageDossiers] A
INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=1)

SELECT @CountDCPartiel = COUNT(*)
FROM [dbo].[TColisageDossiers] A
INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
INNER JOIN [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration) C ON A.Devise=C.ID_Devise
WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))

SET @CountTRPartiel = @CountDCPartiel -- Même nombre que DC partiel

PRINT 'Lignes à insérer:'
PRINT '  - EXO (DC=0%): ' + CAST(ISNULL(@CountEXO,0) AS VARCHAR(10))
PRINT '  - DC 100%: ' + CAST(ISNULL(@CountDC100,0) AS VARCHAR(10))
PRINT '  - DC Partiel: ' + CAST(ISNULL(@CountDCPartiel,0) AS VARCHAR(10))
PRINT '  - TR Partiel: ' + CAST(ISNULL(@CountTRPartiel,0) AS VARCHAR(10))
PRINT '  - TOTAL: ' + CAST(ISNULL(@CountEXO,0) + ISNULL(@CountDC100,0) + ISNULL(@CountDCPartiel,0) + ISNULL(@CountTRPartiel,0) AS VARCHAR(10))

PRINT ''
PRINT '🏁 FIN DU DIAGNOSTIC DÉTAILLÉ'
PRINT '============================'