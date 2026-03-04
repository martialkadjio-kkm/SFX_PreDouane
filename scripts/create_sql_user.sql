-- Script pour créer un utilisateur SQL Server pour Prisma
-- Exécutez ce script dans SQL Server Management Studio

USE [master];
GO

-- Créer le login SQL Server
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'prisma_user')
BEGIN
    CREATE LOGIN [prisma_user] WITH PASSWORD = 'Prisma@2024!Strong';
END
GO

-- Utiliser la base de données SFX_PreDouane
USE [SFX_PreDouane];
GO

-- Créer l'utilisateur dans la base de données
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'prisma_user')
BEGIN
    CREATE USER [prisma_user] FOR LOGIN [prisma_user];
END
GO

-- Donner les droits db_owner (ou ajustez selon vos besoins)
ALTER ROLE [db_owner] ADD MEMBER [prisma_user];
GO

PRINT 'Utilisateur prisma_user créé avec succès!';
PRINT 'Mot de passe: Prisma@2024!Strong';
GO
