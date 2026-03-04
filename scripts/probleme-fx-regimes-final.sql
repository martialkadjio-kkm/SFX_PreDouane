-- PROBLÈME IDENTIFIÉ AVEC fx_IDs_RegimesDeclarations

DECLARE @ClientID INT = 2; -- Edwin Fom

PRINT '=== PROBLÈME: Filtre Regime Douanier incorrect ===';
PRINT '';

-- 1. Régimes associés au client dans la BD
PRINT '1. RÉGIMES ASSOCIÉS AU CLIENT (réalité BD):';
SELECT 
    rd.[ID Regime Declaration] as ID,
    rd.[Libelle Regime Declaration] as Libelle,
    rd.[Taux DC] as TauxDC,
    rd.[Regime Douanier] as RegimeDouanierID
FROM [dbo].[TRegimesClients] rc
INNER JOIN [dbo].[TRegimesDeclarations] rd ON rc.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE rc.[Client] = @ClientID
ORDER BY rd.[Taux DC];

-- 2. Ce que cherche le code TypeScript
PRINT '';
PRINT '2. CE QUE CHERCHE LE CODE TYPESCRIPT:';
PRINT 'Taux: 1.0000|0.7000|0.5000|0.8000|0.2500';
PRINT 'Avec @ID_RegimeDouanier = 0';

-- 3. Résultat avec @ID_RegimeDouanier = 0 (ÉCHEC)
PRINT '';
PRINT '3. RÉSULTAT AVEC @ID_RegimeDouanier = 0 (ACTUEL - ÉCHEC):';
SELECT 
    [ID] as TauxDemande,
    [Taux_DC] as TauxTrouve,
    CASE WHEN [Taux_DC] IS NULL THEN 'ÉCHEC' ELSE 'OK' END as Resultat
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '1.0000|0.7000|0.5000|0.8000|0.2500', '|', 0);

-- 4. Résultat avec @ID_RegimeDouanier = 1 (SUCCÈS)
PRINT '';
PRINT '4. RÉSULTAT AVEC @ID_RegimeDouanier = 1 (CORRIGÉ - SUCCÈS):';
SELECT 
    [ID] as TauxDemande,
    [Taux_DC] as TauxTrouve,
    CASE WHEN [Taux_DC] IS NULL THEN 'ÉCHEC' ELSE 'OK' END as Resultat
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '1.0000|0.7000|0.5000|0.8000|0.2500', '|', 1);

PRINT '';
PRINT '=== CONCLUSION ===';
PRINT 'PROBLÈME: Le code passe @ID_RegimeDouanier = 0';
PRINT 'MAIS: Tous les régimes ont Regime Douanier = 1';
PRINT 'SOLUTION: Changer 0 en 1 dans le code TypeScript';
PRINT '';
PRINT 'LIGNE À CORRIGER:';
PRINT 'fx_IDs_RegimesDeclarations(clientId, taux, "|", 0)';
PRINT 'DEVIENT:';
PRINT 'fx_IDs_RegimesDeclarations(clientId, taux, "|", 1)';