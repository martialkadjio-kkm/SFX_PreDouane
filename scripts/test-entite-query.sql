-- Test de la requête ENTITE_DOSSIER
DECLARE @Id_Dossier INT = 1

SELECT C.[ID Entite], D.[Devise Locale]
FROM dbo.TDossiers A
INNER JOIN dbo.TBranches B On A.[Branche]=B.[ID Branche]
INNER JOIN dbo.TEntites C ON B.[Entite]=C.[ID Entite]
INNER JOIN dbo.TPays D ON C.[Pays]=D.[ID Pays]
WHERE A.[ID Dossier]=@Id_Dossier

-- Vérifier les données
SELECT 'Dossier' as Table_Name, [ID Dossier], [Branche] FROM TDossiers WHERE [ID Dossier]=@Id_Dossier
SELECT 'Branche' as Table_Name, [ID Branche], [Entite] FROM TBranches WHERE [ID Branche] IN (SELECT [Branche] FROM TDossiers WHERE [ID Dossier]=@Id_Dossier)
SELECT 'Entite' as Table_Name, [ID Entite], [Pays] FROM TEntites WHERE [ID Entite] IN (SELECT [Entite] FROM TBranches WHERE [ID Branche] IN (SELECT [Branche] FROM TDossiers WHERE [ID Dossier]=@Id_Dossier))
