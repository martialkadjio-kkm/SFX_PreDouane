-- Vérifier toutes les conversions
USE [SFX Transit]
GO

PRINT 'Toutes les conversions:'
SELECT [ID Convertion], [Date Convertion], [Entite]
FROM TConvertions
ORDER BY [Date Convertion] DESC

PRINT ''
PRINT 'Conversions pour l''entité 0:'
SELECT [ID Convertion], [Date Convertion], [Entite]
FROM TConvertions
WHERE [Entite] = 0
ORDER BY [Date Convertion] DESC

PRINT ''
PRINT 'Conversion pour 2025-12-08 et entité 0:'
SELECT [ID Convertion], [Date Convertion], [Entite]
FROM TConvertions
WHERE [Date Convertion] = '2025-12-08' AND [Entite] = 0

PRINT ''
PRINT 'Taux de change pour la conversion ID 1:'
SELECT t.[ID Taux Change], t.[Convertion], t.[Devise], d.[Code Devise], t.[Taux Change]
FROM TTauxChange t
LEFT JOIN TDevises d ON t.Devise = d.[ID Devise]
WHERE t.[Convertion] = 1
