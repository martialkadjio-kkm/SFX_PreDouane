-- Vérifier la conversion 3
SELECT * FROM TConvertions WHERE [ID Convertion] = 3;

-- Vérifier les taux de change pour la conversion 3
SELECT 
    tc.[ID Taux Change],
    tc.[Convertion],
    tc.[Devise],
    d.[Code Devise],
    d.[Libelle Devise],
    tc.[Taux Change]
FROM TTauxChange tc
INNER JOIN TDevises d ON tc.[Devise] = d.[ID Devise]
WHERE tc.[Convertion] = 3;

-- Vérifier les devises utilisées dans le dossier 1
SELECT DISTINCT
    cd.[Devise],
    d.[Code Devise],
    d.[Libelle Devise]
FROM TColisageDossiers cd
INNER JOIN TDevises d ON cd.[Devise] = d.[ID Devise]
WHERE cd.[Dossier] = 1;

-- Tester la fonction fx_TauxChangeDossier
SELECT * FROM [dbo].[fx_TauxChangeDossier](1, '2025-12-07');
