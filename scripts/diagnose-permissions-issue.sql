-- Diagnostic approfondi des permissions pour prisma_user
USE SFX_PreDouane;
GO

PRINT '🔍 DIAGNOSTIC COMPLET DES PERMISSIONS';
PRINT '=====================================';
PRINT '';

-- 1. Vérifier l'existence du login au niveau serveur
PRINT '1️⃣ Vérification du login au niveau serveur:';
IF EXISTS (SELECT * FROM sys.server_principals WHERE name = 'prisma_user')
BEGIN
    PRINT '✅ Login prisma_user existe au niveau serveur';
    
    SELECT 
        name,
        type_desc,
        is_disabled,
        create_date,
        modify_date
    FROM sys.server_principals 
    WHERE name = 'prisma_user';
END
ELSE
BEGIN
    PRINT '❌ Login prisma_user N''EXISTE PAS au niveau serveur';
    PRINT 'SOLUTION: Créer le login avec CREATE LOGIN';
END

PRINT '';

-- 2. Vérifier l'existence de l'utilisateur dans la base
PRINT '2️⃣ Vérification de l''utilisateur dans la base:';
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT '✅ Utilisateur prisma_user existe dans la base SFX_PreDouane';
    
    SELECT 
        name,
        type_desc,
        create_date,
        modify_date
    FROM sys.database_principals 
    WHERE name = 'prisma_user';
END
ELSE
BEGIN
    PRINT '❌ Utilisateur prisma_user N''EXISTE PAS dans la base';
    PRINT 'SOLUTION: Créer l''utilisateur avec CREATE USER';
END

PRINT '';

-- 3. Vérifier les rôles de base de données
PRINT '3️⃣ Rôles de base de données pour prisma_user:';
SELECT 
    r.name as role_name,
    r.type_desc as role_type
FROM sys.database_role_members rm
JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
WHERE m.name = 'prisma_user';

IF @@ROWCOUNT = 0
BEGIN
    PRINT '❌ Aucun rôle assigné à prisma_user';
END

PRINT '';

-- 4. Vérifier les permissions explicites
PRINT '4️⃣ Permissions explicites sur TUtilisateurs:';
SELECT 
    p.permission_name,
    p.state_desc,
    s.name as principal_name
FROM sys.database_permissions p
JOIN sys.objects o ON p.major_id = o.object_id
JOIN sys.database_principals s ON p.grantee_principal_id = s.principal_id
WHERE o.name = 'TUtilisateurs'
AND s.name = 'prisma_user';

IF @@ROWCOUNT = 0
BEGIN
    PRINT 'Aucune permission explicite sur TUtilisateurs pour prisma_user';
END

PRINT '';

-- 5. Test de connexion en tant que prisma_user
PRINT '5️⃣ Test de connexion en tant que prisma_user:';
BEGIN TRY
    EXECUTE AS USER = 'prisma_user';
    
    PRINT 'Contexte utilisateur: ' + USER_NAME();
    
    -- Test de lecture
    BEGIN TRY
        DECLARE @count INT;
        SELECT @count = COUNT(*) FROM TUtilisateurs;
        PRINT '✅ SELECT sur TUtilisateurs réussi: ' + CAST(@count AS VARCHAR(10)) + ' lignes';
    END TRY
    BEGIN CATCH
        PRINT '❌ SELECT sur TUtilisateurs échoué: ' + ERROR_MESSAGE();
    END CATCH
    
    REVERT;
END TRY
BEGIN CATCH
    PRINT '❌ Impossible de se connecter en tant que prisma_user: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- 6. Proposer une solution
PRINT '6️⃣ SOLUTION RECOMMANDÉE:';
PRINT '';

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    PRINT 'ÉTAPE 1: Créer l''utilisateur dans la base';
    PRINT 'CREATE USER prisma_user FOR LOGIN prisma_user;';
    PRINT '';
END

PRINT 'ÉTAPE 2: Accorder les permissions (à exécuter même si déjà fait)';
PRINT 'ALTER ROLE db_datareader ADD MEMBER prisma_user;';
PRINT 'ALTER ROLE db_datawriter ADD MEMBER prisma_user;';
PRINT 'GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO prisma_user;';
PRINT '';

PRINT '✅ Diagnostic terminé';