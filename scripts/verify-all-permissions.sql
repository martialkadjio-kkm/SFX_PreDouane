-- Script de vérification rapide des permissions prisma_user
USE SFX_PreDouane;
GO

PRINT '🔍 VÉRIFICATION COMPLÈTE DES PERMISSIONS PRISMA_USER';
PRINT '===================================================';
PRINT '';

-- Vérifier l'existence de l'utilisateur
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT '✅ Utilisateur prisma_user trouvé';
    
    -- Afficher tous les rôles
    PRINT '';
    PRINT '📋 RÔLES ACCORDÉS:';
    SELECT 
        r.name as RoleName,
        r.type_desc as RoleType
    FROM sys.database_role_members rm
    JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
    JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
    WHERE m.name = 'prisma_user';
    
    -- Test rapide sur les principales tables
    PRINT '';
    PRINT '🧪 TESTS RAPIDES:';
    
    EXECUTE AS USER = 'prisma_user';
    
    BEGIN TRY
        -- Test sur 5 tables principales
        DECLARE @result VARCHAR(MAX) = '';
        DECLARE @count INT;
        
        SELECT @count = COUNT(*) FROM TUtilisateurs;
        SET @result = @result + 'TUtilisateurs: ' + CAST(@count AS VARCHAR(10)) + ' | ';
        
        SELECT @count = COUNT(*) FROM TSessions;
        SET @result = @result + 'TSessions: ' + CAST(@count AS VARCHAR(10)) + ' | ';
        
        SELECT @count = COUNT(*) FROM TClients;
        SET @result = @result + 'TClients: ' + CAST(@count AS VARCHAR(10)) + ' | ';
        
        SELECT @count = COUNT(*) FROM TDossiers;
        SET @result = @result + 'TDossiers: ' + CAST(@count AS VARCHAR(10)) + ' | ';
        
        SELECT @count = COUNT(*) FROM THSCodes;
        SET @result = @result + 'THSCodes: ' + CAST(@count AS VARCHAR(10));
        
        PRINT '✅ Lecture tables: ' + @result;
        
        -- Test sur les vues
        SET @result = '';
        
        SELECT @count = COUNT(*) FROM VUtilisateurs;
        SET @result = @result + 'VUtilisateurs: ' + CAST(@count AS VARCHAR(10)) + ' | ';
        
        SELECT @count = COUNT(*) FROM VDossiers;
        SET @result = @result + 'VDossiers: ' + CAST(@count AS VARCHAR(10));
        
        PRINT '✅ Lecture vues: ' + @result;
        
        PRINT '✅ Tous les tests réussis - Permissions OK !';
        
    END TRY
    BEGIN CATCH
        PRINT '❌ Erreur: ' + ERROR_MESSAGE();
    END CATCH
    
    REVERT;
    
END
ELSE
BEGIN
    PRINT '❌ Utilisateur prisma_user NON TROUVÉ !';
    PRINT 'Exécutez d''abord: grant-all-permissions-prisma-user.sql';
END

PRINT '';
PRINT '✅ Vérification terminée';