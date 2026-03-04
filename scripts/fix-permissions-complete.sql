-- Solution complète pour corriger les permissions prisma_user
-- À exécuter dans SQL Server Management Studio avec un compte administrateur

USE SFX_PreDouane;
GO

PRINT '🔧 CORRECTION COMPLÈTE DES PERMISSIONS PRISMA_USER';
PRINT '==================================================';
PRINT '';

-- ÉTAPE 1: Supprimer l'utilisateur existant s'il y a des problèmes
PRINT '1️⃣ Nettoyage de l''utilisateur existant...';

IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT 'Suppression de l''utilisateur prisma_user existant...';
    DROP USER prisma_user;
    PRINT '✅ Utilisateur supprimé';
END
ELSE
BEGIN
    PRINT 'Aucun utilisateur prisma_user à supprimer';
END

-- ÉTAPE 2: Vérifier/créer le login au niveau serveur
PRINT '';
PRINT '2️⃣ Vérification du login au niveau serveur...';

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
PRINT '';
PRINT '3️⃣ Création de l''utilisateur dans la base...';

CREATE USER prisma_user FOR LOGIN prisma_user;
PRINT '✅ Utilisateur prisma_user créé dans SFX_PreDouane';

-- ÉTAPE 4: Accorder TOUS les droits nécessaires
PRINT '';
PRINT '4️⃣ Attribution des permissions complètes...';

-- Rôles de base de données
ALTER ROLE db_datareader ADD MEMBER prisma_user;
PRINT '✅ db_datareader accordé';

ALTER ROLE db_datawriter ADD MEMBER prisma_user;
PRINT '✅ db_datawriter accordé';

-- Permissions explicites sur le schéma
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO prisma_user;
PRINT '✅ Permissions CRUD sur schéma dbo accordées';

-- Permissions spécifiques sur les tables principales (au cas où)
GRANT SELECT, INSERT, UPDATE, DELETE ON TUtilisateurs TO prisma_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TSessions TO prisma_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TClients TO prisma_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TDossiers TO prisma_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TColisageDossiers TO prisma_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TDevises TO prisma_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TPays TO prisma_user;
PRINT '✅ Permissions explicites sur tables principales accordées';

-- Permissions sur les vues
GRANT SELECT ON VUtilisateurs TO prisma_user;
GRANT SELECT ON VSessions TO prisma_user;
GRANT SELECT ON VClients TO prisma_user;
GRANT SELECT ON VDossiers TO prisma_user;
GRANT SELECT ON VColisageDossiers TO prisma_user;
GRANT SELECT ON VDevises TO prisma_user;
GRANT SELECT ON VPays TO prisma_user;
PRINT '✅ Permissions sur vues accordées';

-- ÉTAPE 5: Test immédiat des permissions
PRINT '';
PRINT '5️⃣ Test des permissions...';

BEGIN TRY
    EXECUTE AS USER = 'prisma_user';
    
    DECLARE @count INT;
    SELECT @count = COUNT(*) FROM TUtilisateurs;
    PRINT '✅ Test SELECT sur TUtilisateurs réussi: ' + CAST(@count AS VARCHAR(10)) + ' utilisateurs trouvés';
    
    SELECT @count = COUNT(*) FROM TSessions;
    PRINT '✅ Test SELECT sur TSessions réussi: ' + CAST(@count AS VARCHAR(10)) + ' sessions trouvées';
    
    REVERT;
    
    PRINT '✅ Tous les tests de permissions réussis !';
    
END TRY
BEGIN CATCH
    REVERT;
    PRINT '❌ Erreur lors du test: ' + ERROR_MESSAGE();
END CATCH

-- ÉTAPE 6: Afficher un résumé
PRINT '';
PRINT '6️⃣ Résumé des permissions accordées:';

-- Afficher les rôles
PRINT 'Rôles de base de données:';
SELECT 
    r.name as role_name
FROM sys.database_role_members rm
JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
WHERE m.name = 'prisma_user';

-- Afficher les permissions explicites
PRINT '';
PRINT 'Permissions explicites:';
SELECT 
    p.permission_name,
    OBJECT_NAME(p.major_id) as object_name
FROM sys.database_permissions p
JOIN sys.database_principals s ON p.grantee_principal_id = s.principal_id
WHERE s.name = 'prisma_user'
AND p.major_id > 0;

PRINT '';
PRINT '🚀 CORRECTION TERMINÉE !';
PRINT '';
PRINT 'Vous pouvez maintenant exécuter:';
PRINT '  npm run seed';
PRINT '';
PRINT 'Si le problème persiste, redémarrez votre application Node.js';
PRINT 'ou attendez quelques secondes pour que les permissions soient effectives.';