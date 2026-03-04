-- Script pour tester et déboguer la fonction fx_IDs_RegimesDeclarations
-- Ce script va montrer concrètement pourquoi le cas DC 0% ne fonctionne pas

PRINT '=== TEST DE DEBUG DE LA FONCTION fx_IDs_RegimesDeclarations ===';
PRINT '';

-- 1. Trouver un client de test
DECLARE @ClientID INT;
SELECT TOP 1 @ClientID = [ID Client] FROM [dbo].[TClients];
PRINT 'Client de test utilisé: ' + CAST(@ClientID AS VARCHAR);
PRINT '';

-- 2. Vérifier quels régimes existent dans la BD avec taux DC = 0
PRINT '--- ÉTAPE 1: Régimes avec Taux DC = 0 dans la BD ---';
SELECT 
    [ID Regime Declaration] as RegimeID,
    [Libelle Regime Declaration] as Libelle,
    [Taux DC] as TauxDC,
    [Regime Douanier] as RegimeDouanierID
FROM [dbo].[TRegimesDeclarations] 
WHERE [Taux DC] = 0;

-- 3. Vérifier si ce client a des associations avec des régimes DC = 0
PRINT '';
PRINT '--- ÉTAPE 2: Associations du client avec régimes DC = 0 ---';
SELECT 
    rc.[ID Regime Client],
    rc.[Client],
    rd.[ID Regime Declaration],
    rd.[Libelle Regime Declaration],
    rd.[Taux DC],
    rd.[Regime Douanier]
FROM [dbo].[TRegimesClients] rc
INNER JOIN [dbo].[TRegimesDeclarations] rd ON rc.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE rc.[Client] = @ClientID 
AND rd.[Taux DC] = 0;

-- 4. Tester la fonction avec différents paramètres pour DC = 0
PRINT '';
PRINT '--- ÉTAPE 3: Test de la fonction avec DC = 0 ---';

-- Test 1: Avec @ID_RegimeDouanier = 0 (valeur par défaut)
PRINT 'Test 1: fx_IDs_RegimesDeclarations avec @ID_RegimeDouanier = 0';
SELECT 
    [ID] as ValeurDemandee, 
    [Taux_DC] as TauxTrouve,
    CASE 
        WHEN [Taux_DC] IS NULL THEN 'PAS TROUVÉ'
        ELSE 'TROUVÉ'
    END as Statut
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '0', '|', 0);

-- Test 2: Avec @ID_RegimeDouanier = -1 (pour ignorer le filtre)
PRINT '';
PRINT 'Test 2: Essai avec différents ID de régime douanier';
-- Trouver tous les ID de régimes douaniers qui existent
SELECT DISTINCT [Regime Douanier] as RegimeDouanierID
FROM [dbo].[TRegimesDeclarations] 
WHERE [Taux DC] = 0;

-- 5. Montrer le problème: décomposer la fonction étape par étape
PRINT '';
PRINT '--- ÉTAPE 4: Décomposition de la fonction pour comprendre le problème ---';

-- Étape A: Les valeurs demandées
PRINT 'A. Valeurs demandées (DISTINCT_LIST):';
SELECT DISTINCT CAST([value] as numeric (24,6)) as ValeurDemandee
FROM string_split('0', '|');

-- Étape B: Recherche dans TRegimesDeclarations
PRINT '';
PRINT 'B. Régimes trouvés dans TRegimesDeclarations:';
SELECT 
    rd.[ID Regime Declaration],
    rd.[Libelle Regime Declaration],
    rd.[Taux DC],
    rd.[Regime Douanier]
FROM [dbo].[TRegimesDeclarations] rd
WHERE rd.[Taux DC] = 0;

-- Étape C: Vérification des associations client
PRINT '';
PRINT 'C. Associations client pour ces régimes:';
SELECT 
    rc.[ID Regime Client],
    rc.[Client],
    rd.[ID Regime Declaration],
    rd.[Taux DC],
    rd.[Regime Douanier]
FROM [dbo].[TRegimesDeclarations] rd
LEFT JOIN [dbo].[TRegimesClients] rc ON rd.[ID Regime Declaration] = rc.[Regime Declaration] AND rc.[Client] = @ClientID
WHERE rd.[Taux DC] = 0;

-- Étape D: Application du filtre @ID_RegimeDouanier = 0
PRINT '';
PRINT 'D. Après application du filtre Regime Douanier = 0:';
SELECT 
    rd.[ID Regime Declaration],
    rd.[Taux DC],
    rd.[Regime Douanier],
    rc.[Client]
FROM [dbo].[TRegimesDeclarations] rd
INNER JOIN [dbo].[TRegimesClients] rc ON rd.[ID Regime Declaration] = rc.[Regime Declaration]
WHERE rc.[Client] = @ClientID 
AND rd.[Taux DC] = 0
AND rd.[Regime Douanier] = 0;  -- ← C'EST ICI QUE ÇA PEUT ÉCHOUER

-- 6. Solution proposée: tester sans le filtre Regime Douanier
PRINT '';
PRINT '--- ÉTAPE 5: Test sans filtre Regime Douanier ---';
SELECT 
    rd.[ID Regime Declaration],
    rd.[Taux DC],
    rd.[Regime Douanier],
    rc.[Client]
FROM [dbo].[TRegimesDeclarations] rd
INNER JOIN [dbo].[TRegimesClients] rc ON rd.[ID Regime Declaration] = rc.[Regime Declaration]
WHERE rc.[Client] = @ClientID 
AND rd.[Taux DC] = 0;
-- Sans le filtre AND rd.[Regime Douanier] = 0

PRINT '';
PRINT '=== FIN DU TEST DE DEBUG ===';