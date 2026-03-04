-- Script pour corriger les permissions de l'utilisateur prisma_user
-- À exécuter dans SQL Server Management Studio avec un compte administrateur

USE SFX_PreDouane;
GO

-- Vérifier si l'utilisateur existe
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT '❌ Utilisateur prisma_user non trouvé. Création nécessaire.';
    
    -- Créer le login au niveau serveur (si pas déjà fait)
    IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'prisma_user')
    BEGIN
        CREATE LOGIN prisma_user WITH PASSWORD = 'Prisma@2024!Strong';
        PRINT '✅ Login prisma_user créé';
    END
    
    -- Créer l'utilisateur dans la base de données
    CREATE USER prisma_user FOR LOGIN prisma_user;
    PRINT '✅ Utilisateur prisma_user créé dans la base SFX_PreDouane';
END
ELSE
BEGIN
    PRINT '✅ Utilisateur prisma_user existe déjà';
END

-- Accorder les permissions nécessaires
PRINT 'Attribution des permissions...';

-- Permissions de lecture sur toutes les tables
ALTER ROLE db_datareader ADD MEMBER prisma_user;
PRINT '✅ Rôle db_datareader accordé';

-- Permissions d'écriture sur toutes les tables  
ALTER ROLE db_datawriter ADD MEMBER prisma_user;
PRINT '✅ Rôle db_datawriter accordé';

-- Permissions pour exécuter les procédures stockées
ALTER ROLE db_executor ADD MEMBER prisma_user;
PRINT '✅ Rôle db_executor accordé (si disponible)';

-- Permissions spécifiques pour les vues (au cas où)
GRANT SELECT ON SCHEMA::dbo TO prisma_user;
PRINT '✅ Permission SELECT sur le schéma dbo accordée';

-- Vérifier les permissions accordées
PRINT '';
PRINT '📋 Vérification des rôles accordés:';
SELECT 
    r.name as role_name,
    r.type_desc as role_type
FROM sys.database_role_members rm
JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
WHERE m.name = 'prisma_user';

PRINT '';
PRINT '✅ Permissions corrigées pour prisma_user';
PRINT 'Vous pouvez maintenant exécuter: npm run seed';