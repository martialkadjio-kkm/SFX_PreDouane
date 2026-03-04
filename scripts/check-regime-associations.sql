-- Trouver le client Edwin Fom
DECLARE @ClientID INT;
SELECT @ClientID = [ID Client] FROM [dbo].[TClients] WHERE [Nom Client] LIKE '%Edwin%';
PRINT 'Client ID: ' + CAST(@ClientID AS VARCHAR);

-- Vérifier les régimes dans la BD
SELECT 
    [ID Regime Declaration],
    [Libelle Regime Declaration],
    [Taux DC]
FROM [dbo].[TRegimesDeclarations]
WHERE [Libelle Regime Declaration] IN (
    'IM4 30% TR et 70% DC',
    'IM4 50% TR et 50% DC',
    'IM4 20% TR et 80% DC',
    'IM4 75% TR et 25% DC'
);

-- Vérifier les associations existantes
SELECT 
    crd.[ID],
    crd.[Client],
    crd.[Regime Declaration],
    rd.[Libelle Regime Declaration],
    rd.[Taux DC]
FROM [dbo].[TClientsRegimesDeclarations] crd
INNER JOIN [dbo].[TRegimesDeclarations] rd ON crd.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE crd.[Client] = @ClientID
    AND rd.[Libelle Regime Declaration] IN (
        'IM4 30% TR et 70% DC',
        'IM4 50% TR et 50% DC',
        'IM4 20% TR et 80% DC',
        'IM4 75% TR et 25% DC'
    );

-- Tester la fonction SQL
SELECT [ID], [Taux_DC] 
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '0.7000|0.5000|0.8000|0.2500', '|', 0);
