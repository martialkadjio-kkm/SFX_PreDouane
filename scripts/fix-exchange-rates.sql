-- DIAGNOSTIC ET CORRECTION DES TAUX DE CHANGE - DOSSIER 6
-- =========================================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 00:00:00.000'

PRINT '🔍 DIAGNOSTIC TAUX DE CHANGE - DOSSIER 6'
PRINT '========================================'

-- 1. Vérifier les devises utilisées dans le dossier
PRINT ''
PRINT '1️⃣ DEVISES UTILISÉES DANS LE DOSSIER'
PRINT '-----------------------------------'

SELECT DISTINCT 
    d.[ID Devise],
    d.[Code Devise],
    d.[Libelle Devise],
    COUNT(cd.[ID Colisage Dossier]) as NombreColisages
FROM TColisageDossiers cd
INNER JOIN TDevises d ON cd.Devise = d.[ID Devise]
WHERE cd.Dossier = @Id_Dossier
GROUP BY d.[ID Devise], d.[Code Devise], d.[Libelle Devise]
ORDER BY d.[Code Devise]

-- 2. Vérifier la branche et l'entité du dossier
PRINT ''
PRINT '2️⃣ BRANCHE ET ENTITÉ DU DOSSIER'
PRINT '------------------------------'

SELECT 
    dos.[ID Dossier],
    dos.Branche,
    b.[Nom Branche],
    b.Entite,
    e.[Nom Entite]
FROM TDossiers dos
INNER JOIN TBranches b ON dos.Branche = b.ID
INNER JOIN TEntites e ON b.Entite = e.ID
WHERE dos.[ID Dossier] = @Id_Dossier

-- 3. Vérifier les conversions disponibles pour cette entité et date
PRINT ''
PRINT '3️⃣ CONVERSIONS DISPONIBLES'
PRINT '-------------------------'

DECLARE @EntiteId INT
SELECT @EntiteId = b.Entite
FROM TDossiers dos
INNER JOIN TBranches b ON dos.Branche = b.ID
WHERE dos.[ID Dossier] = @Id_Dossier

PRINT 'Entité ID: ' + CAST(@EntiteId AS VARCHAR(10))
PRINT 'Date recherchée: ' + CAST(@DateDeclaration AS VARCHAR(20))

-- Conversions pour cette entité
SELECT 
    [ID Convertion],
    [Date Convertion],
    Entite,
    CASE 
        WHEN CAST([Date Convertion] AS DATE) = CAST(@DateDeclaration AS DATE) THEN 'EXACTE'
        WHEN [Date Convertion] < @DateDeclaration THEN 'ANTÉRIEURE'
        ELSE 'POSTÉRIEURE'
    END as Correspondance
FROM TConvertions
WHERE Entite = @EntiteId
ORDER BY [Date Convertion] DESC

-- 4. Vérifier les taux de change pour les conversions disponibles
PRINT ''
PRINT '4️⃣ TAUX DE CHANGE DISPONIBLES'
PRINT '----------------------------'

SELECT 
    c.[ID Convertion],
    c.[Date Convertion],
    d.[Code Devise],
    tc.[Taux Change]
FROM TConvertions c
CROSS JOIN (
    SELECT DISTINCT d2.[ID Devise], d2.[Code Devise]
    FROM TColisageDossiers cd2
    INNER JOIN TDevises d2 ON cd2.Devise = d2.[ID Devise]
    WHERE cd2.Dossier = @Id_Dossier
) d
LEFT JOIN TTauxChange tc ON c.[ID Convertion] = tc.Convertion AND d.[ID Devise] = tc.Devise
WHERE c.Entite = @EntiteId
  AND CAST(c.[Date Convertion] AS DATE) = CAST(@DateDeclaration AS DATE)
ORDER BY d.[Code Devise]

-- 5. Tester la fonction fx_TauxChangeDossier
PRINT ''
PRINT '5️⃣ TEST FONCTION fx_TauxChangeDossier'
PRINT '-----------------------------------'

SELECT 
    [ID_Devise],
    [Code_Devise],
    [Taux_Change],
    [ID_Convertion]
FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration)

-- 6. Créer une conversion et des taux si nécessaire
PRINT ''
PRINT '6️⃣ CRÉATION CONVERSION ET TAUX SI NÉCESSAIRE'
PRINT '------------------------------------------'

DECLARE @ConversionId INT

-- Vérifier si une conversion existe pour cette date et entité
SELECT @ConversionId = [ID Convertion]
FROM TConvertions
WHERE Entite = @EntiteId
  AND CAST([Date Convertion] AS DATE) = CAST(@DateDeclaration AS DATE)

IF @ConversionId IS NULL
BEGIN
    PRINT 'Création d''une nouvelle conversion...'
    
    INSERT INTO TConvertions ([Date Convertion], Entite)
    VALUES (@DateDeclaration, @EntiteId)
    
    SET @ConversionId = SCOPE_IDENTITY()
    PRINT 'Conversion créée avec ID: ' + CAST(@ConversionId AS VARCHAR(10))
END
ELSE
BEGIN
    PRINT 'Conversion existante trouvée avec ID: ' + CAST(@ConversionId AS VARCHAR(10))
END

-- Créer les taux de change pour toutes les devises utilisées
DECLARE @DeviseId INT, @CodeDevise VARCHAR(5)

DECLARE devise_cursor CURSOR FOR
SELECT DISTINCT d.[ID Devise], d.[Code Devise]
FROM TColisageDossiers cd
INNER JOIN TDevises d ON cd.Devise = d.[ID Devise]
WHERE cd.Dossier = @Id_Dossier

OPEN devise_cursor
FETCH NEXT FROM devise_cursor INTO @DeviseId, @CodeDevise

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Vérifier si le taux existe déjà
    IF NOT EXISTS (SELECT 1 FROM TTauxChange WHERE Convertion = @ConversionId AND Devise = @DeviseId)
    BEGIN
        DECLARE @TauxChange DECIMAL(18,6)
        
        -- Définir des taux par défaut selon la devise
        SET @TauxChange = CASE 
            WHEN @CodeDevise = 'XAF' THEN 1.000000  -- Franc CFA (devise de base)
            WHEN @CodeDevise = 'EUR' THEN 655.957000  -- Euro
            WHEN @CodeDevise = 'USD' THEN 600.000000  -- Dollar US
            WHEN @CodeDevise = 'GBP' THEN 750.000000  -- Livre Sterling
            WHEN @CodeDevise = 'NOK' THEN 55.000000   -- Couronne Norvégienne
            ELSE 1.000000  -- Taux par défaut
        END
        
        INSERT INTO TTauxChange (Convertion, Devise, [Taux Change])
        VALUES (@ConversionId, @DeviseId, @TauxChange)
        
        PRINT 'Taux créé pour ' + @CodeDevise + ': ' + CAST(@TauxChange AS VARCHAR(20))
    END
    ELSE
    BEGIN
        PRINT 'Taux existant pour ' + @CodeDevise
    END
    
    FETCH NEXT FROM devise_cursor INTO @DeviseId, @CodeDevise
END

CLOSE devise_cursor
DEALLOCATE devise_cursor

-- 7. Vérifier le résultat final
PRINT ''
PRINT '7️⃣ VÉRIFICATION FINALE'
PRINT '--------------------'

SELECT 
    [ID_Devise],
    [Code_Devise],
    [Taux_Change],
    [ID_Convertion]
FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration)

-- 8. Test de la procédure après correction
PRINT ''
PRINT '8️⃣ TEST PROCÉDURE APRÈS CORRECTION'
PRINT '---------------------------------'

BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier, 
        @DateDeclaration = @DateDeclaration
    
    PRINT '✅ SUCCESS: Procédure exécutée avec succès !'
    
    -- Vérifier les notes créées
    SELECT COUNT(*) as NotesCreees
    FROM TNotesDetail nd
    INNER JOIN TColisageDossiers cd ON nd.[Colisage Dossier] = cd.[ID Colisage Dossier]
    WHERE cd.Dossier = @Id_Dossier
    
END TRY
BEGIN CATCH
    PRINT '❌ ERREUR: ' + ERROR_MESSAGE()
END CATCH

PRINT ''
PRINT '🏁 FIN DE LA CORRECTION'
PRINT '======================'