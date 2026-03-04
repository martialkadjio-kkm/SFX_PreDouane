-- Trouver le client Edwin Fom
DECLARE @ClientID INT;
SELECT @ClientID = [ID Client] FROM [dbo].[TClients] WHERE [Nom Client] LIKE '%Edwin%';
PRINT 'Client ID: ' + CAST(@ClientID AS VARCHAR);

-- Vérifier les régimes dans la BD avec leurs taux DC exacts
SELECT 
    [ID Regime Declaration],
    [Libelle Regime Declaration],
    [Taux DC],
    CAST([Taux DC] AS VARCHAR(20)) AS [Taux_DC_String]
FROM [dbo].[TRegimesDeclarations]
WHERE [Libelle Regime Declaration] IN (
    'IM4 30% TR et 70% DC',
    'IM4 50% TR et 50% DC',
    'IM4 20% TR et 80% DC',
    'IM4 75% TR et 25% DC'
)
ORDER BY [Taux DC];

-- Vérifier les associations existantes
SELECT 
    crd.[ID],
    crd.[Client],
    crd.[Regime Declaration],
    rd.[Libelle Regime Declaration],
    rd.[Taux DC],
    CAST(rd.[Taux DC] AS VARCHAR(20)) AS [Taux_DC_String]
FROM [dbo].[TRegimesClients] crd
INNER JOIN [dbo].[TRegimesDeclarations] rd ON crd.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE crd.[Client] = @ClientID
    AND rd.[Libelle Regime Declaration] IN (
        'IM4 30% TR et 70% DC',
        'IM4 50% TR et 50% DC',
        'IM4 20% TR et 80% DC',
        'IM4 75% TR et 25% DC'
    )
ORDER BY rd.[Taux DC];

-- Tester la fonction SQL avec les taux DC exacts
PRINT '';
PRINT 'Test de la fonction fx_IDs_RegimesDeclarations:';
SELECT [ID], [Taux_DC], CAST([Taux_DC] AS VARCHAR(20)) AS [Taux_DC_String]
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '0.7000|0.5000|0.8000|0.2500', '|', 0);

-- Tester avec d'autres formats
PRINT '';
PRINT 'Test avec format 0.7|0.5|0.8|0.25:';
SELECT [ID], [Taux_DC], CAST([Taux_DC] AS VARCHAR(20)) AS [Taux_DC_String]
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '0.7|0.5|0.8|0.25', '|', 0);

-- Tester avec format 0.70|0.50|0.80|0.25
PRINT '';
PRINT 'Test avec format 0.70|0.50|0.80|0.25:';
SELECT [ID], [Taux_DC], CAST([Taux_DC] AS VARCHAR(20)) AS [Taux_DC_String]
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '0.70|0.50|0.80|0.25', '|', 0);
