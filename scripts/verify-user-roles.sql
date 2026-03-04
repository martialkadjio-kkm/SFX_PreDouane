-- Vérifier les rôles de l'utilisateur prisma_user
USE SFX_PreDouane;
GO

PRINT '🔍 Vérification des rôles pour prisma_user...';
PRINT '';

-- Vérifier que l'utilisateur existe
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT '✅ Utilisateur prisma_user trouvé dans la base de données';
    
    -- Afficher les rôles de l'utilisateur
    PRINT '';
    PRINT '📋 Rôles accordés à prisma_user:';
    SELECT 
        r.name as role_name,
        r.type_desc as role_type,
        'ACCORDÉ' as status
    FROM sys.database_role_members rm
    JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
    JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
    WHERE m.name = 'prisma_user';
    
    -- Test de permissions directes
    PRINT '';
    PRINT '🔍 Test de permissions sur TUtilisateurs...';
    
    -- Essayer de faire un SELECT en tant que prisma_user
    EXECUTE AS USER = 'prisma_user';
    
    BEGIN TRY
        SELECT COUNT(*) as total_utilisateurs FROM TUtilisateurs;
        PRINT '✅ Permission SELECT sur TUtilisateurs: OK';
    END TRY
    BEGIN CATCH
        PRINT '❌ Permission SELECT sur TUtilisateurs: ÉCHEC';
        PRINT 'Erreur: ' + ERROR_MESSAGE();
    END CATCH
    
    -- Revenir au contexte original
    REVERT;
    
END
ELSE
BEGIN
    PRINT '❌ Utilisateur prisma_user NON TROUVÉ dans la base de données';
    PRINT 'Recréation nécessaire...';
    
    -- Créer l'utilisateur s'il n'existe pas
    IF EXISTS (SELECT * FROM sys.server_principals WHERE name = 'prisma_user')
    BEGIN
        CREATE USER prisma_user FOR LOGIN prisma_user;
        PRINT '✅ Utilisateur prisma_user créé dans la base de données';
        
        -- Accorder les rôles
        ALTER ROLE db_datareader ADD MEMBER prisma_user;
        ALTER ROLE db_datawriter ADD MEMBER prisma_user;
        GRANT SELECT ON SCHEMA::dbo TO prisma_user;
        
        PRINT '✅ Permissions accordées';
    END
    ELSE
    BEGIN
        PRINT '❌ Login prisma_user n''existe pas au niveau serveur';
    END
END

PRINT '';
PRINT '✅ Vérification terminée';