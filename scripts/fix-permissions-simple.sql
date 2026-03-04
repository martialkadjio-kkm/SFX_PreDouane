-- Solution simple pour corriger les permissions prisma_user
-- À exécuter dans SQL Server Management Studio avec un compte administrateur

USE SFX_PreDouane;
GO

PRINT '🔧 CORRECTION SIMPLE DES PERMISSIONS PRISMA_USER';
PRINT '===============================================';
PRINT '';

-- ÉTAPE 1: Supprimer l'utilisateur existant s'il y a des problèmes
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT 'Suppression de l''utilisateur prisma_user existant...';
    DROP USER prisma_user;
    PRINT '✅ Utilisateur supprimé';
END

-- ÉTAPE 2: Vérifier/créer le login au niveau serveur
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'prisma_user')
BEGIN
    PRINT 'Création du login prisma_user...';
    CREATE LOGIN prisma_user WITH PASSWORD = 'Prisma@2024!Strong';
    PRINT '✅ Login créé';
END
ELSE
BEGIN
    PRINT '✅ Login prisma_user existe déjà';
END

-- ÉTAPE 3: Créer l'utilisateur dans la base de données
PRINT 'Création de l''utilisateur dans la base...';
CREATE USER prisma_user FOR LOGIN prisma_user;
PRINT '✅ Utilisateur prisma_user créé dans SFX_PreDouane';

-- ÉTAPE 4: Accorder les droits de base
PRINT 'Attribution des permissions...';

ALTER ROLE db_datareader ADD MEMBER prisma_user;
PRINT '✅ db_datareader accordé';

ALTER ROLE db_datawriter ADD MEMBER prisma_user;
PRINT '✅ db_datawriter accordé';

-- Permissions explicites sur le schéma
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO prisma_user;
PRINT '✅ Permissions CRUD sur schéma dbo accordées';

-- ÉTAPE 5: Test des permissions
PRINT 'Test des permissions...';

EXECUTE AS USER = 'prisma_user';

DECLARE @count INT;
SELECT @count = COUNT(*) FROM TUtilisateurs;
PRINT '✅ Test SELECT sur TUtilisateurs réussi: ' + CAST(@count AS VARCHAR(10)) + ' utilisateurs';

SELECT @count = COUNT(*) FROM TSessions;
PRINT '✅ Test SELECT sur TSessions réussi: ' + CAST(@count AS VARCHAR(10)) + ' sessions';

REVERT;

PRINT '';
PRINT '🚀 PERMISSIONS CORRIGÉES !';
PRINT 'Vous pouvez maintenant exécuter: npm run seed';