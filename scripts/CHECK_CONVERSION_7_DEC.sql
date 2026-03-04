-- Vérifier la conversion du 7 décembre
USE [SFX Transit]
GO

PRINT 'Conversion du 7 décembre:'
SELECT [ID Convertion], [Date Convertion], [Entite]
FROM TConvertions
WHERE CAST([Date Convertion] AS DATE) = '2025-12-07'
    AND [Entite] = 0

PRINT ''
PRINT 'Taux de change pour cette conversion:'
SELECT t.[ID Taux Change], t.[Convertion], t.[Devise], d.[Code Devise], t.[Taux Change]
FROM TTauxChange t
LEFT JOIN TDevises d ON t.Devise = d.[ID Devise]
WHERE t.[Convertion] = 3  -- ID de la conversion du 7 décembre

PRINT ''
PRINT 'Devises utilisées dans le dossier 1:'
SELECT DISTINCT c.Devise, d.[Code Devise]
FROM TColisageDossiers c
INNER JOIN TDevises d ON c.Devise = d.[ID Devise]
WHERE c.Dossier = 1

PRINT ''
PRINT 'Test de fx_TauxChangeDossier pour le 7 décembre:'
SELECT * FROM dbo.fx_TauxChangeDossier(1, '2025-12-07 23:00:00')
