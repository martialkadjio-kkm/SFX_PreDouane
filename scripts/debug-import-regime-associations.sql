-- Script pour déboguer pourquoi les associations régime-client ne sont pas trouvées lors de l'import

PRINT '=== DEBUG ASSOCIATIONS RÉGIME-CLIENT LORS DE L''IMPORT ===';
PRINT '';

-- Client Edwin Fom
DECLARE @ClientID INT = 2;
PRINT 'Client testé: Edwin Fom (ID = ' + CAST(@ClientID AS VARCHAR) + ')';
PRINT '';

-- 1. Vérifier les régimes associés dans TRegimesClients
PRINT '--- ÉTAPE 1: Associations existantes dans TRegimesClients ---';
SELECT 
    rc.[ID Regime Client],
    rc.[Client],
    rc.[Regime Declaration],
    rd.[Libelle Regime Declaration],
    rd.[Taux DC],
    CAST(rd.[Taux DC] AS VARCHAR(20)) AS [Taux_DC_String],
    rd.[Regime Douanier]
FROM [dbo].[TRegimesClients] rc
INNER JOIN [dbo].[TRegimesDeclarations] rd ON rc.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE rc.[Client] = @ClientID
ORDER BY rd.[Taux DC];

-- 2. Tester la fonction fx_IDs_RegimesDeclarations avec les taux exacts
PRINT '';
PRINT '--- ÉTAPE 2: Test de fx_IDs_RegimesDeclarations ---';

-- Les taux DC que l'import essaie probablement de trouver
DECLARE @TauxRecherches VARCHAR(100) = '1.0000|0.7000|0.5000|0.8000|0.2500';
PRINT 'Taux recherchés: ' + @TauxRecherches;

SELECT 
    [ID] as ValeurDemandee,
    [Taux_DC] as TauxTrouve,
    CASE 
        WHEN [Taux_DC] IS NULL THEN 'PAS TROUVÉ'
        ELSE 'TROUVÉ'
    END as Statut
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, @TauxRecherches, '|', 0);

-- 3. Tester avec différents formats de taux
PRINT '';
PRINT '--- ÉTAPE 3: Test avec différents formats ---';

-- Format 1: Sans zéros de fin
DECLARE @Format1 VARCHAR(100) = '1|0.7|0.5|0.8|0.25';
PRINT 'Format 1: ' + @Format1;
SELECT 
    [ID] as ValeurDemandee,
    [Taux_DC] as TauxTrouve,
    CASE WHEN [Taux_DC] IS NULL THEN 'PAS TROUVÉ' ELSE 'TROUVÉ' END as Statut
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, @Format1, '|', 0);

-- Format 2: Avec plus de décimales
DECLARE @Format2 VARCHAR(100) = '1.000000|0.700000|0.500000|0.800000|0.250000';
PRINT '';
PRINT 'Format 2: ' + @Format2;
SELECT 
    [ID] as ValeurDemandee,
    [Taux_DC] as TauxTrouve,
    CASE WHEN [Taux_DC] IS NULL THEN 'PAS TROUVÉ' ELSE 'TROUVÉ' END as Statut
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, @Format2, '|', 0);

-- 4. Vérifier la précision exacte des taux DC dans la BD
PRINT '';
PRINT '--- ÉTAPE 4: Précision exacte des taux DC ---';
SELECT 
    [ID Regime Declaration],
    [Libelle Regime Declaration],
    [Taux DC],
    CAST([Taux DC] AS DECIMAL(18,6)) AS [Taux_DC_Decimal],
    CAST([Taux DC] AS VARCHAR(50)) AS [Taux_DC_String_Complet]
FROM [dbo].[TRegimesDeclarations]
WHERE [ID Regime Declaration] IN (10, 11, 12, 13, 14)
ORDER BY [Taux DC];

-- 5. Simuler exactement ce que fait le code TypeScript
PRINT '';
PRINT '--- ÉTAPE 5: Simulation du code TypeScript ---';

-- Le code fait probablement quelque chose comme (ratio / 100).toFixed(4)
-- Pour 100% DC: (100 / 100).toFixed(4) = "1.0000"
-- Pour 70% DC: (70 / 100).toFixed(4) = "0.7000"
-- etc.

DECLARE @SimulationTaux VARCHAR(200) = '1.0000|0.7000|0.5000|0.8000|0.2500';
PRINT 'Simulation TypeScript (ratio/100).toFixed(4): ' + @SimulationTaux;

SELECT 
    [ID] as ValeurDemandee,
    [Taux_DC] as TauxTrouve,
    CASE WHEN [Taux_DC] IS NULL THEN 'PAS TROUVÉ ❌' ELSE 'TROUVÉ ✅' END as Statut,
    CASE 
        WHEN [Taux_DC] IS NULL THEN 'Régime non associé au client'
        ELSE 'Association trouvée'
    END as Explication
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, @SimulationTaux, '|', 0);

-- 6. Vérifier si le problème vient du filtre Regime Douanier
PRINT '';
PRINT '--- ÉTAPE 6: Test sans filtre Regime Douanier ---';

-- Créer une version modifiée de la requête sans le filtre Regime Douanier
WITH DISTINCT_LIST ([Value]) AS (
    SELECT DISTINCT CAST([value] as numeric (24,6)) FROM string_split(@SimulationTaux,'|')
),
LIST_WITH_ID ([ID],[Taux_DC]) AS (
    SELECT B.[ID Regime Declaration], B.[Taux DC]
    FROM DISTINCT_LIST A
    INNER JOIN dbo.TRegimesDeclarations B ON A.[Value]=B.[Taux DC]
    INNER JOIN dbo.TRegimesClients C ON B.[ID Regime Declaration]=C.[Regime Declaration]
    WHERE C.[Client]=@ClientID
    -- Pas de filtre sur Regime Douanier
)
SELECT 
    A.[Value] AS [ValeurDemandee], 
    B.[Taux_DC] AS [TauxTrouve],
    CASE WHEN B.[Taux_DC] IS NULL THEN 'PAS TROUVÉ ❌' ELSE 'TROUVÉ ✅' END as Statut
FROM DISTINCT_LIST A 
LEFT JOIN LIST_WITH_ID B ON A.[Value]=B.[Taux_DC];

PRINT '';
PRINT '=== FIN DU DEBUG ===';