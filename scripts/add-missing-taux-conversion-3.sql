-- Ajouter les taux de change manquants pour la conversion 3
-- GBP (British Pound) et JPY (Japanese Yen)

-- Vérifier d'abord s'ils existent déjà
SELECT * FROM TTauxChange WHERE [Convertion] = 3 AND [Devise] IN (47, 65);

-- Ajouter GBP si manquant (taux exemple : 1 GBP = 800 XOF)
IF NOT EXISTS (SELECT 1 FROM TTauxChange WHERE [Convertion] = 3 AND [Devise] = 47)
BEGIN
    INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
    VALUES (3, 47, 800.000000, 1, GETDATE());
    PRINT 'Taux GBP ajouté pour conversion 3';
END
ELSE
BEGIN
    PRINT 'Taux GBP existe déjà pour conversion 3';
END

-- Ajouter JPY si manquant (taux exemple : 1 JPY = 4.5 XOF)
IF NOT EXISTS (SELECT 1 FROM TTauxChange WHERE [Convertion] = 3 AND [Devise] = 65)
BEGIN
    INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
    VALUES (3, 65, 4.500000, 1, GETDATE());
    PRINT 'Taux JPY ajouté pour conversion 3';
END
ELSE
BEGIN
    PRINT 'Taux JPY existe déjà pour conversion 3';
END

-- Vérifier le résultat
SELECT 
    tc.[ID Taux Change],
    tc.[Convertion],
    tc.[Devise],
    d.[Code Devise],
    d.[Libelle Devise],
    tc.[Taux Change]
FROM TTauxChange tc
INNER JOIN TDevises d ON tc.[Devise] = d.[ID Devise]
WHERE tc.[Convertion] = 3
ORDER BY d.[Code Devise];

-- Tester à nouveau la fonction
SELECT * FROM [dbo].[fx_TauxChangeDossier](1, '2025-12-07');
