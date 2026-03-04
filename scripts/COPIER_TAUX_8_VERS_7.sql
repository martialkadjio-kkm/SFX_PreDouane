-- Copier les taux du 8 décembre vers le 7 décembre
USE [SFX Transit]
GO

DECLARE @ConversionSource INT = 1  -- 8 décembre
DECLARE @ConversionCible INT = 3   -- 7 décembre
DECLARE @Session INT = 0

PRINT 'Copie des taux de la conversion ' + CAST(@ConversionSource AS VARCHAR) + ' vers ' + CAST(@ConversionCible AS VARCHAR)
PRINT ''

-- Supprimer les taux existants de la conversion cible
DELETE FROM TTauxChange WHERE [Convertion] = @ConversionCible
PRINT 'Taux existants supprimés'

-- Copier les taux
INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
SELECT @ConversionCible, [Devise], [Taux Change], @Session, GETDATE()
FROM TTauxChange
WHERE [Convertion] = @ConversionSource

PRINT 'Taux copiés'
PRINT ''

-- Vérifier
PRINT 'Taux de la conversion ' + CAST(@ConversionCible AS VARCHAR) + ':'
SELECT t.[Devise], d.[Code Devise], t.[Taux Change]
FROM TTauxChange t
LEFT JOIN TDevises d ON t.Devise = d.[ID Devise]
WHERE t.[Convertion] = @ConversionCible
