-- Script pour ajouter les régimes IM4 avec différents ratios DC/TR
-- À exécuter avant d'importer les colisages

-- Vérifier si le régime douanier IM4 existe
IF NOT EXISTS (SELECT 1 FROM TRegimesDouaniers WHERE [Code Regime Douanier] = 'IM4')
BEGIN
    INSERT INTO TRegimesDouaniers ([Code Regime Douanier], [Libelle Regime Douanier], [Session], [Date Creation])
    VALUES ('IM4', 'Importation définitive', 1, GETDATE())
END

DECLARE @RegimeDouanierId INT
SELECT @RegimeDouanierId = [ID Regime Douanier] FROM TRegimesDouaniers WHERE [Code Regime Douanier] = 'IM4'

-- Ajouter les régimes de déclaration avec différents ratios
-- 100% TR et 0% DC (EXO)
IF NOT EXISTS (SELECT 1 FROM TRegimesDeclarations WHERE [Libelle Regime Declaration] = 'IM4 100% TR et 0% DC')
BEGIN
    INSERT INTO TRegimesDeclarations ([Regime Douanier], [Libelle Regime Declaration], [Taux DC], [Session], [Date Creation])
    VALUES (@RegimeDouanierId, 'IM4 100% TR et 0% DC', 0, 1, GETDATE())
END

-- 100% DC
IF NOT EXISTS (SELECT 1 FROM TRegimesDeclarations WHERE [Libelle Regime Declaration] = 'IM4 100% DC')
BEGIN
    INSERT INTO TRegimesDeclarations ([Regime Douanier], [Libelle Regime Declaration], [Taux DC], [Session], [Date Creation])
    VALUES (@RegimeDouanierId, 'IM4 100% DC', 100, 1, GETDATE())
END

-- 70% TR et 30% DC
IF NOT EXISTS (SELECT 1 FROM TRegimesDeclarations WHERE [Libelle Regime Declaration] = 'IM4 70% TR et 30% DC')
BEGIN
    INSERT INTO TRegimesDeclarations ([Regime Douanier], [Libelle Regime Declaration], [Taux DC], [Session], [Date Creation])
    VALUES (@RegimeDouanierId, 'IM4 70% TR et 30% DC', 30, 1, GETDATE())
END

-- 50% TR et 50% DC
IF NOT EXISTS (SELECT 1 FROM TRegimesDeclarations WHERE [Libelle Regime Declaration] = 'IM4 50% TR et 50% DC')
BEGIN
    INSERT INTO TRegimesDeclarations ([Regime Douanier], [Libelle Regime Declaration], [Taux DC], [Session], [Date Creation])
    VALUES (@RegimeDouanierId, 'IM4 50% TR et 50% DC', 50, 1, GETDATE())
END

-- 25% TR et 75% DC
IF NOT EXISTS (SELECT 1 FROM TRegimesDeclarations WHERE [Libelle Regime Declaration] = 'IM4 25% TR et 75% DC')
BEGIN
    INSERT INTO TRegimesDeclarations ([Regime Douanier], [Libelle Regime Declaration], [Taux DC], [Session], [Date Creation])
    VALUES (@RegimeDouanierId, 'IM4 25% TR et 75% DC', 75, 1, GETDATE())
END

-- Afficher les régimes créés
SELECT 
    rd.[ID Regime Declaration],
    rdo.[Code Regime Douanier],
    rd.[Libelle Regime Declaration],
    rd.[Taux DC]
FROM TRegimesDeclarations rd
INNER JOIN TRegimesDouaniers rdo ON rd.[Regime Douanier] = rdo.[ID Regime Douanier]
WHERE rdo.[Code Regime Douanier] = 'IM4'
ORDER BY rd.[Taux DC]

PRINT 'Régimes IM4 créés avec succès!'
