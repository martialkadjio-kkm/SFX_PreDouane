-- Script pour donner TOUS les droits à prisma_user sur SFX_PreDouane
-- À exécuter dans SQL Server Management Studio avec un compte administrateur

USE SFX_PreDouane;
GO

PRINT '🔧 ATTRIBUTION DE TOUS LES DROITS À PRISMA_USER';
PRINT '===============================================';
PRINT '';

-- ÉTAPE 1: Nettoyer et recréer l'utilisateur
PRINT '1️⃣ Nettoyage et recréation de l''utilisateur...';

-- Supprimer l'utilisateur s'il existe
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT 'Suppression de l''utilisateur existant...';
    DROP USER prisma_user;
    PRINT '✅ Utilisateur supprimé';
END

-- Vérifier/créer le login au niveau serveur
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

-- Créer l'utilisateur dans la base de données
CREATE USER prisma_user FOR LOGIN prisma_user;
PRINT '✅ Utilisateur prisma_user recréé dans SFX_PreDouane';

-- ÉTAPE 2: Accorder TOUS les rôles de base de données
PRINT '';
PRINT '2️⃣ Attribution de tous les rôles de base de données...';

ALTER ROLE db_owner ADD MEMBER prisma_user;
PRINT '✅ db_owner accordé (contrôle total de la base)';

ALTER ROLE db_datareader ADD MEMBER prisma_user;
PRINT '✅ db_datareader accordé';

ALTER ROLE db_datawriter ADD MEMBER prisma_user;
PRINT '✅ db_datawriter accordé';

ALTER ROLE db_ddladmin ADD MEMBER prisma_user;
PRINT '✅ db_ddladmin accordé (création/modification de tables)';

-- Essayer d'accorder db_executor si disponible
BEGIN TRY
    ALTER ROLE db_executor ADD MEMBER prisma_user;
    PRINT '✅ db_executor accordé';
END TRY
BEGIN CATCH
    PRINT '⚠️ db_executor non disponible (normal sur certaines versions)';
END CATCH

-- ÉTAPE 3: Permissions explicites sur TOUTES les tables
PRINT '';
PRINT '3️⃣ Attribution des permissions explicites sur toutes les tables...';

-- Permissions sur le schéma dbo
GRANT ALL ON SCHEMA::dbo TO prisma_user;
PRINT '✅ Permissions ALL sur schéma dbo accordées';

-- Permissions explicites sur toutes les tables existantes
DECLARE @sql NVARCHAR(MAX) = '';

-- Générer les commandes GRANT pour toutes les tables
SELECT @sql = @sql + 'GRANT SELECT, INSERT, UPDATE, DELETE ON ' + TABLE_SCHEMA + '.' + TABLE_NAME + ' TO prisma_user;' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = 'SFX_PreDouane';

-- Exécuter les commandes
IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
    PRINT '✅ Permissions CRUD accordées sur toutes les tables';
END

-- ÉTAPE 4: Permissions sur toutes les vues
PRINT '';
PRINT '4️⃣ Attribution des permissions sur toutes les vues...';

SET @sql = '';

-- Générer les commandes GRANT pour toutes les vues
SELECT @sql = @sql + 'GRANT SELECT ON ' + TABLE_SCHEMA + '.' + TABLE_NAME + ' TO prisma_user;' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'VIEW' AND TABLE_CATALOG = 'SFX_PreDouane';

-- Exécuter les commandes
IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
    PRINT '✅ Permissions SELECT accordées sur toutes les vues';
END

-- ÉTAPE 5: Permissions sur toutes les procédures stockées
PRINT '';
PRINT '5️⃣ Attribution des permissions sur toutes les procédures stockées...';

SET @sql = '';

-- Générer les commandes GRANT pour toutes les procédures
SELECT @sql = @sql + 'GRANT EXECUTE ON ' + ROUTINE_SCHEMA + '.' + ROUTINE_NAME + ' TO prisma_user;' + CHAR(13)
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_CATALOG = 'SFX_PreDouane';

-- Exécuter les commandes
IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
    PRINT '✅ Permissions EXECUTE accordées sur toutes les procédures stockées';
END

-- ÉTAPE 6: Permissions sur toutes les fonctions
PRINT '';
PRINT '6️⃣ Attribution des permissions sur toutes les fonctions...';

SET @sql = '';

-- Générer les commandes GRANT pour toutes les fonctions
SELECT @sql = @sql + 'GRANT EXECUTE ON ' + ROUTINE_SCHEMA + '.' + ROUTINE_NAME + ' TO prisma_user;' + CHAR(13)
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_TYPE = 'FUNCTION' AND ROUTINE_CATALOG = 'SFX_PreDouane';

-- Exécuter les commandes
IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
    PRINT '✅ Permissions EXECUTE accordées sur toutes les fonctions';
END

-- ÉTAPE 7: Permissions système supplémentaires
PRINT '';
PRINT '7️⃣ Attribution des permissions système...';

-- Permission de créer des tables, vues, etc.
GRANT CREATE TABLE TO prisma_user;
GRANT CREATE VIEW TO prisma_user;
GRANT CREATE PROCEDURE TO prisma_user;
GRANT CREATE FUNCTION TO prisma_user;
PRINT '✅ Permissions CREATE accordées';

-- Permission d'altérer la base
GRANT ALTER ANY SCHEMA TO prisma_user;
PRINT '✅ Permission ALTER SCHEMA accordée';

-- ÉTAPE 8: Test complet des permissions
PRINT '';
PRINT '8️⃣ Test complet des permissions...';

BEGIN TRY
    EXECUTE AS USER = 'prisma_user';
    
    -- Test lecture sur plusieurs tables
    DECLARE @count INT;
    
    SELECT @count = COUNT(*) FROM TUtilisateurs;
    PRINT '✅ Test TUtilisateurs: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    
    SELECT @count = COUNT(*) FROM TSessions;
    PRINT '✅ Test TSessions: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    
    SELECT @count = COUNT(*) FROM TClients;
    PRINT '✅ Test TClients: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    
    SELECT @count = COUNT(*) FROM TDossiers;
    PRINT '✅ Test TDossiers: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    
    SELECT @count = COUNT(*) FROM THSCodes;
    PRINT '✅ Test THSCodes: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    
    -- Test sur les vues
    SELECT @count = COUNT(*) FROM VUtilisateurs;
    PRINT '✅ Test VUtilisateurs: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    
    SELECT @count = COUNT(*) FROM VDossiers;
    PRINT '✅ Test VDossiers: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    
    REVERT;
    
    PRINT '✅ Tous les tests de permissions réussis !';
    
END TRY
BEGIN CATCH
    REVERT;
    PRINT '❌ Erreur lors du test: ' + ERROR_MESSAGE();
    PRINT 'Ligne d''erreur: ' + CAST(ERROR_LINE() AS VARCHAR(10));
END CATCH

-- ÉTAPE 9: Résumé final
PRINT '';
PRINT '9️⃣ Résumé des permissions accordées:';
PRINT '';
PRINT 'RÔLES DE BASE DE DONNÉES:';
PRINT '  ✅ db_owner (propriétaire de base - contrôle total)';
PRINT '  ✅ db_datareader (lecture de toutes les tables)';
PRINT '  ✅ db_datawriter (écriture dans toutes les tables)';
PRINT '  ✅ db_ddladmin (création/modification de structures)';
PRINT '';
PRINT 'PERMISSIONS EXPLICITES:';
PRINT '  ✅ ALL sur schéma dbo';
PRINT '  ✅ SELECT, INSERT, UPDATE, DELETE sur toutes les tables';
PRINT '  ✅ SELECT sur toutes les vues';
PRINT '  ✅ EXECUTE sur toutes les procédures stockées';
PRINT '  ✅ EXECUTE sur toutes les fonctions';
PRINT '  ✅ CREATE TABLE, VIEW, PROCEDURE, FUNCTION';
PRINT '  ✅ ALTER ANY SCHEMA';
PRINT '';

PRINT '🚀 CONFIGURATION TERMINÉE !';
PRINT '';
PRINT 'L''utilisateur prisma_user a maintenant un contrôle COMPLET sur SFX_PreDouane';
PRINT 'Vous pouvez exécuter: npm run seed';
PRINT '';
PRINT '⚠️  SÉCURITÉ: Cet utilisateur a des droits d''administrateur sur cette base.';
PRINT '   Utilisez-le uniquement pour le développement/test.';