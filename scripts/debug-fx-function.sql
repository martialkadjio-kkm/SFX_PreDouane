-- DIAGNOSTIC FONCTION fx_TauxChangeDossier - DOSSIER 6
-- =====================================================

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 00:00:00.000'

PRINT '🔍 DIAGNOSTIC FONCTION fx_TauxChangeDossier'
PRINT '=========================================='

-- 1. Vérifier les devises utilisées dans le dossier 6
PRINT ''
PRINT '1️⃣ DEVISES DANS LE DOSSIER 6'
PRINT '---------------------------'

SELECT 
    cd.Devise as ID_Devise_Colisage,
    d.[ID Devise] as ID_Devise_Table,
    d.[Code Devise],
    COUNT(*) as NombreColisages
FROM TColisageDossiers cd
LEFT JOIN TDevises d ON cd.Devise = d.[ID Devise]
WHERE cd.Dossier = @Id_Dossier
GROUP BY cd.Devise, d.[ID Devise], d.[Code Devise]
ORDER BY cd.Devise

-- 2. Vérifier la branche et entité du dossier
PRINT ''
PRINT '2️⃣ BRANCHE ET ENTITÉ DU DOSSIER'
PRINT '------------------------------'

SELECT 
    dos.[ID Dossier],
    dos.Branche,
    b.Entite,
    b.[Nom Branche],
    e.[Nom Entite]
FROM TDossiers dos
LEFT JOIN TBranches b ON dos.Branche = b.ID
LEFT JOIN TEntites e ON b.Entite = e.ID
WHERE dos.[ID Dossier] = @Id_Dossier

-- 3. Vérifier la conversion pour cette entité et date
PRINT ''
PRINT '3️⃣ CONVERSION POUR ENTITÉ ET DATE'
PRINT '--------------------------------'

DECLARE @EntiteId INT
SELECT @EntiteId = b.Entite
FROM TDossiers dos
INNER JOIN TBranches b ON dos.Branche = b.ID
WHERE dos.[ID Dossier] = @Id_Dossier

SELECT 
    c.[ID Convertion],
    c.[Date Convertion],
    c.Entite,
    CAST(c.[Date Convertion] AS DATE) as DateSeulement,
    CAST(@DateDeclaration AS DATE) as DateRecherchee,
    CASE 
        WHEN CAST(c.[Date Convertion] AS DATE) = CAST(@DateDeclaration AS DATE) THEN 'MATCH'
        ELSE 'NO MATCH'
    END as Correspondance
FROM TConvertions c
WHERE c.Entite = @EntiteId
ORDER BY c.[Date Convertion] DESC

-- 4. Vérifier les taux pour la conversion du 2025-12-14
PRINT ''
PRINT '4️⃣ TAUX POUR CONVERSION ID 13'
PRINT '----------------------------'

SELECT 
    tc.Convertion,
    tc.Devise,
    d.[Code Devise],
    tc.[Taux Change]
FROM TTauxChange tc
INNER JOIN TDevises d ON tc.Devise = d.[ID Devise]
WHERE tc.Convertion = 13
ORDER BY d.[Code Devise]

-- 5. Croiser devises du dossier avec taux disponibles
PRINT ''
PRINT '5️⃣ CROISEMENT DEVISES DOSSIER / TAUX DISPONIBLES'
PRINT '-----------------------------------------------'

SELECT 
    cd_devises.Devise as DeviseColisage,
    cd_devises.[Code Devise] as CodeDevise,
    tc.Convertion,
    tc.[Taux Change],
    CASE 
        WHEN tc.[Taux Change] IS NOT NULL THEN 'TAUX TROUVÉ'
        ELSE 'TAUX MANQUANT'
    END as Statut
FROM (
    SELECT DISTINCT 
        cd.Devise,
        d.[Code Devise]
    FROM TColisageDossiers cd
    INNER JOIN TDevises d ON cd.Devise = d.[ID Devise]
    WHERE cd.Dossier = @Id_Dossier
) cd_devises
LEFT JOIN TTauxChange tc ON cd_devises.Devise = tc.Devise AND tc.Convertion = 13
ORDER BY cd_devises.[Code Devise]

-- 6. Test manuel de la logique de fx_TauxChangeDossier
PRINT ''
PRINT '6️⃣ SIMULATION LOGIQUE fx_TauxChangeDossier'
PRINT '----------------------------------------'

-- Simuler ce que fait probablement la fonction
SELECT 
    d.[ID Devise] as ID_Devise,
    d.[Code Devise] as Code_Devise,
    tc.[Taux Change] as Taux_Change,
    c.[ID Convertion] as ID_Convertion
FROM TColisageDossiers cd
INNER JOIN TDevises d ON cd.Devise = d.[ID Devise]
INNER JOIN TDossiers dos ON cd.Dossier = dos.[ID Dossier]
INNER JOIN TBranches b ON dos.Branche = b.ID
INNER JOIN TConvertions c ON b.Entite = c.Entite 
    AND CAST(c.[Date Convertion] AS DATE) = CAST(@DateDeclaration AS DATE)
LEFT JOIN TTauxChange tc ON c.[ID Convertion] = tc.Convertion AND d.[ID Devise] = tc.Devise
WHERE cd.Dossier = @Id_Dossier
GROUP BY d.[ID Devise], d.[Code Devise], tc.[Taux Change], c.[ID Convertion]
ORDER BY d.[Code Devise]

-- 7. Appel direct de la fonction
PRINT ''
PRINT '7️⃣ APPEL DIRECT fx_TauxChangeDossier'
PRINT '----------------------------------'

SELECT 
    [ID_Devise],
    [Code_Devise],
    [Taux_Change],
    [ID_Convertion]
FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier, @DateDeclaration)

-- 8. Vérifier s'il y a des problèmes de NULL ou de types
PRINT ''
PRINT '8️⃣ VÉRIFICATION DES VALEURS NULL'
PRINT '-------------------------------'

SELECT 
    'Dossier' as Element,
    CASE WHEN @Id_Dossier IS NULL THEN 'NULL' ELSE CAST(@Id_Dossier AS VARCHAR(10)) END as Valeur
UNION ALL
SELECT 
    'Date',
    CASE WHEN @DateDeclaration IS NULL THEN 'NULL' ELSE CAST(@DateDeclaration AS VARCHAR(30)) END
UNION ALL
SELECT 
    'Entité',
    CASE WHEN @EntiteId IS NULL THEN 'NULL' ELSE CAST(@EntiteId AS VARCHAR(10)) END

-- 9. Vérifier les colonnes exactes des tables
PRINT ''
PRINT '9️⃣ STRUCTURE DES TABLES'
PRINT '----------------------'

-- Colonnes TColisageDossiers
SELECT 'TColisageDossiers' as TableName, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'TColisageDossiers' 
  AND COLUMN_NAME IN ('Dossier', 'Devise', 'ID Colisage Dossier')
ORDER BY ORDINAL_POSITION

PRINT ''
PRINT '🏁 FIN DU DIAGNOSTIC'
PRINT '==================='