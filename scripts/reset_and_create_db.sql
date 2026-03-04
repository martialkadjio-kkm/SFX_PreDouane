-- ============================================================================
-- Database Reset and Creation Script for SFX_PreDouane
-- ============================================================================
-- Purpose: Drops existing database/schema and recreates from scratch
-- Author: Database Migration Team
-- Date: 2025-12-01
-- ============================================================================

-- Enable error handling
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================================
-- PHASE 1: DROP EXISTING OBJECTS
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 1: Dropping existing objects...'
PRINT '=========================================='

BEGIN TRY
    -- Drop all triggers first
    PRINT 'Dropping triggers...'
    DROP TRIGGER IF EXISTS [dbo].[INSERT_TClients$Entite_IF_ON_TEntites$ID Entite]
    DROP TRIGGER IF EXISTS [dbo].[UPDATE_TClients$Entite_IF_ON_TEntites$ID Entite]
    DROP TRIGGER IF EXISTS [dbo].[INSERT_TConvertions$Entite_IF_ON_TEntites$ID Entite]
    DROP TRIGGER IF EXISTS [dbo].[UPDATE_TConvertions$Entite_IF_ON_TEntites$ID Entite]
    DROP TRIGGER IF EXISTS [dbo].[INSERT_TDossiers]
    DROP TRIGGER IF EXISTS [dbo].[DELETE_TEntites$ID Entite_IF_NOT_IN_TClients$Entite]
    DROP TRIGGER IF EXISTS [dbo].[DELETE_TEntites$ID Entite_IF_NOT_IN_TConvertions$Entite]
    DROP TRIGGER IF EXISTS [dbo].[UPDATE_TEntites$ID Entite_ON_TClients$Entite]
    DROP TRIGGER IF EXISTS [dbo].[UPDATE_TEntites$ID Entite_ON_TConvertions$Entite]
    PRINT 'Triggers dropped successfully'
END TRY
BEGIN CATCH
    PRINT 'Warning: Error dropping triggers - ' + ERROR_MESSAGE()
END CATCH

BEGIN TRY
    -- Drop all stored procedures
    PRINT 'Dropping stored procedures...'
    DROP PROCEDURE IF EXISTS [dbo].[pSP_CreerNoteDetail]
    DROP PROCEDURE IF EXISTS [dbo].[pSP_SupprimerNoteDetail]
    DROP PROCEDURE IF EXISTS [dbo].[pSP_RecalculeDerniereEtapeDossier]
    PRINT 'Stored procedures dropped successfully'
END TRY
BEGIN CATCH
    PRINT 'Warning: Error dropping stored procedures - ' + ERROR_MESSAGE()
END CATCH

BEGIN TRY
    -- Drop all user-defined functions
    PRINT 'Dropping user-defined functions...'
    DROP FUNCTION IF EXISTS [dbo].[fx_TauxChangeDossier]
    DROP FUNCTION IF EXISTS [dbo].[fx_PermissionsUtilisateur]
    PRINT 'User-defined functions dropped successfully'
END TRY
BEGIN CATCH
    PRINT 'Warning: Error dropping functions - ' + ERROR_MESSAGE()
END CATCH

BEGIN TRY
    -- Drop all views
    PRINT 'Dropping views...'
    DROP VIEW IF EXISTS [dbo].[VSessions]
    DROP VIEW IF EXISTS [dbo].[VTypesDossiers]
    DROP VIEW IF EXISTS [dbo].[VEntites]
    DROP VIEW IF EXISTS [dbo].[VBranches]
    DROP VIEW IF EXISTS [dbo].[VEtapesDossiers]
    DROP VIEW IF EXISTS [dbo].[VDossiers]
    DROP VIEW IF EXISTS [dbo].[VPermissonsRoles]
    DROP VIEW IF EXISTS [dbo].[VModesTransport]
    DROP VIEW IF EXISTS [dbo].[VPays]
    DROP VIEW IF EXISTS [dbo].[VRegimesDouaniers]
    DROP VIEW IF EXISTS [dbo].[VSensTrafic]
    DROP VIEW IF EXISTS [dbo].[VRoles]
    DROP VIEW IF EXISTS [dbo].[VStatutsDossier]
    DROP VIEW IF EXISTS [dbo].[VRegimesDeclarations]
    DROP VIEW IF EXISTS [dbo].[VRegimesClients]
    DROP VIEW IF EXISTS [dbo].[VTauxChange]
    DROP VIEW IF EXISTS [dbo].[VPermissionsBase]
    DROP VIEW IF EXISTS [dbo].[VColisageDossiers]
    DROP VIEW IF EXISTS [dbo].[VNotesDetail]
    DROP VIEW IF EXISTS [dbo].[VUtilisateurs]
    DROP VIEW IF EXISTS [dbo].[VClients]
    DROP VIEW IF EXISTS [dbo].[VCodesEtapes]
    DROP VIEW IF EXISTS [dbo].[VConvertions]
    DROP VIEW IF EXISTS [dbo].[VGroupesEntites]
    DROP VIEW IF EXISTS [dbo].[VDevises]
    DROP VIEW IF EXISTS [dbo].[VHSCodes]
    DROP VIEW IF EXISTS [dbo].[VRolesUtilisateurs]
    PRINT 'Views dropped successfully'
END TRY
BEGIN CATCH
    PRINT 'Warning: Error dropping views - ' + ERROR_MESSAGE()
END CATCH

BEGIN TRY
    -- Drop all tables
    PRINT 'Dropping tables...'
    DROP TABLE IF EXISTS [dbo].[TNotesDetail]
    DROP TABLE IF EXISTS [dbo].[TColisageDossiers]
    DROP TABLE IF EXISTS [dbo].[TTauxChange]
    DROP TABLE IF EXISTS [dbo].[TEtapesDossiers]
    DROP TABLE IF EXISTS [dbo].[TDossiers]
    DROP TABLE IF EXISTS [dbo].[TRegimesClients]
    DROP TABLE IF EXISTS [dbo].[TRegimesDeclarations]
    DROP TABLE IF EXISTS [dbo].[TRegimesDouaniers]
    DROP TABLE IF EXISTS [dbo].[TPermissonsRoles]
    DROP TABLE IF EXISTS [dbo].[TRolesUtilisateurs]
    DROP TABLE IF EXISTS [dbo].[TPermissionsBase]
    DROP TABLE IF EXISTS [dbo].[TRoles]
    DROP TABLE IF EXISTS [dbo].[TSessions]
    DROP TABLE IF EXISTS [dbo].[TUtilisateurs]
    DROP TABLE IF EXISTS [dbo].[TCodesEtapes]
    DROP TABLE IF EXISTS [dbo].[TEtapesDossiers]
    DROP TABLE IF EXISTS [dbo].[TConvertions]
    DROP TABLE IF EXISTS [dbo].[TClients]
    DROP TABLE IF EXISTS [dbo].[TBranches]
    DROP TABLE IF EXISTS [dbo].[TEntites]
    DROP TABLE IF EXISTS [dbo].[TGroupesEntites]
    DROP TABLE IF EXISTS [dbo].[TTypesDossiers]
    DROP TABLE IF EXISTS [dbo].[TSensTrafic]
    DROP TABLE IF EXISTS [dbo].[TModesTransport]
    DROP TABLE IF EXISTS [dbo].[TPays]
    DROP TABLE IF EXISTS [dbo].[TDevises]
    DROP TABLE IF EXISTS [dbo].[THSCodes]
    PRINT 'Tables dropped successfully'
END TRY
BEGIN CATCH
    PRINT 'Warning: Error dropping tables - ' + ERROR_MESSAGE()
END CATCH

PRINT 'Phase 1 completed: All objects dropped'
PRINT ''
-- ============================================================================
-- PHASE 2: CREATE TABLES
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 2: Creating tables...'
PRINT '=========================================='

BEGIN TRY
    PRINT 'Creating reference tables...'
    
    -- TTypesDossiers
    CREATE TABLE [dbo].[TTypesDossiers](
        [ID Type Dossier] [int] IDENTITY(1,1) NOT NULL,
        [Libelle Type Dossier] [nvarchar](200) NOT NULL,
        [Sens Trafic] [nvarchar](1) NOT NULL,
        [Mode Transport] [nvarchar](1) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TTypesDossiers$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Type Dossier] ASC),
        CONSTRAINT [UQ_TTypes_Dossiers$Libelle Type Dossier] UNIQUE NONCLUSTERED ([Libelle Type Dossier] ASC)
    )
    
    -- TUtilisateurs
    CREATE TABLE [dbo].[TUtilisateurs](
        [ID Utilisateur] [int] IDENTITY(1,1) NOT NULL,
        [Code Utilisateur] [nvarchar](10) NOT NULL,
        [Nom Utilisateur] [nvarchar](200) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TUtilisateurs$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Utilisateur] ASC),
        CONSTRAINT [UQ_TUtilisateurs$Code Utilisateur] UNIQUE NONCLUSTERED ([Code Utilisateur] ASC),
        CONSTRAINT [UQ_TUtilisateurs$Nom Utilisateur] UNIQUE NONCLUSTERED ([Nom Utilisateur] ASC)
    )
    
    -- TSessions
    CREATE TABLE [dbo].[TSessions](
        [ID Session] [int] IDENTITY(1,1) NOT NULL,
        [Utilisateur] [int] NOT NULL,
        [Debut Session] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [Fin Session] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TSessions$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Session] ASC)
    )
    
    -- TSensTrafic
    CREATE TABLE [dbo].[TSensTrafic](
        [ID Sens Trafic] [nvarchar](1) NOT NULL,
        [Libelle Sens Trafic] [nvarchar](200) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TSensTrafic$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Sens Trafic] ASC),
        CONSTRAINT [UQ_TSensTrafic$Libelle Sens Trafic] UNIQUE NONCLUSTERED ([Libelle Sens Trafic] ASC)
    )
    
    -- TModesTransport
    CREATE TABLE [dbo].[TModesTransport](
        [ID Mode Transport] [nvarchar](1) NOT NULL,
        [Libelle Mode Transport] [nvarchar](200) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TMoyensTransport$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Mode Transport] ASC),
        CONSTRAINT [UQ_TModesTransport$Libelle Mode Transport] UNIQUE NONCLUSTERED ([Libelle Mode Transport] ASC)
    )
    
    -- TConvertions
    CREATE TABLE [dbo].[TConvertions](
        [ID Convertion] [int] IDENTITY(1,1) NOT NULL,
        [Date Convertion] [datetime2](7) NOT NULL,
        [Entite] [int] NOT NULL DEFAULT ((0)),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TConvertions$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Convertion] ASC),
        CONSTRAINT [UQ_TConvertions$Date Convertion] UNIQUE NONCLUSTERED ([Date Convertion] ASC)
    )
    
    -- TDevises
    CREATE TABLE [dbo].[TDevises](
        [ID Devise] [int] IDENTITY(1,1) NOT NULL,
        [Code Devise] [nvarchar](5) NOT NULL,
        [Libelle Devise] [nvarchar](200) NOT NULL,
        [Decimales] [int] NOT NULL DEFAULT ((2)),
        [Devise Inactive] [bit] NOT NULL DEFAULT ((1)),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TDevises$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Devise] ASC),
        CONSTRAINT [UQ_TDevises$Code Devise] UNIQUE NONCLUSTERED ([Code Devise] ASC),
        CONSTRAINT [UQ_TDevises$Libelle Devise] UNIQUE NONCLUSTERED ([Libelle Devise] ASC)
    )
    
    -- TPays
    CREATE TABLE [dbo].[TPays](
        [ID Pays] [int] IDENTITY(1,1) NOT NULL,
        [Code Pays] [nvarchar](5) NOT NULL,
        [Libelle Pays] [nvarchar](200) NOT NULL,
        [Devise Locale] [int] NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TPays$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Pays] ASC),
        CONSTRAINT [UQ_TPays$Code Pays] UNIQUE NONCLUSTERED ([Code Pays] ASC),
        CONSTRAINT [UQ_TPays$Libelle Pays] UNIQUE NONCLUSTERED ([Libelle Pays] ASC)
    )
    
    -- TGroupesEntites
    CREATE TABLE [dbo].[TGroupesEntites](
        [ID Groupe Entite] [int] IDENTITY(1,1) NOT NULL,
        [Nom Groupe Entite] [nvarchar](200) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TGroupesEntites$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Groupe Entite] ASC),
        CONSTRAINT [UQ_TGroupesEntites$Nom Groupe Entite] UNIQUE NONCLUSTERED ([Nom Groupe Entite] ASC)
    )
    
    -- TEntites
    CREATE TABLE [dbo].[TEntites](
        [ID Entite] [int] IDENTITY(1,1) NOT NULL,
        [Code Entite] [nvarchar](10) NOT NULL DEFAULT ('-'),
        [Nom Entite] [nvarchar](200) NOT NULL,
        [Groupe Entite] [int] NOT NULL,
        [Pays] [int] NOT NULL DEFAULT ((0)),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TEntites$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Entite] ASC),
        CONSTRAINT [UQ_TEntites$Nom Entite] UNIQUE NONCLUSTERED ([Nom Entite] ASC)
    )
    
    -- TBranches
    CREATE TABLE [dbo].[TBranches](
        [ID Branche] [int] IDENTITY(1,1) NOT NULL,
        [Code Branche] [nvarchar](20) NOT NULL,
        [Nom Branche] [nvarchar](200) NOT NULL,
        [Entite] [int] NOT NULL DEFAULT ((0)),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TBranches$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Branche] ASC),
        CONSTRAINT [UQ__TBranche__0EF7E91810AAA27A] UNIQUE NONCLUSTERED ([Code Branche] ASC),
        CONSTRAINT [UQ_TBranches$Nom Branche] UNIQUE NONCLUSTERED ([Nom Branche] ASC)
    )
    
    -- TClients
    CREATE TABLE [dbo].[TClients](
        [ID Client] [int] IDENTITY(1,1) NOT NULL,
        [Nom Client] [nvarchar](200) NOT NULL,
        [Entite] [int] NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TClients$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Client] ASC),
        CONSTRAINT [UQ_TClients$Nom Client] UNIQUE NONCLUSTERED ([Nom Client] ASC)
    )
    
    PRINT 'Reference tables created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating reference tables: ' + ERROR_MESSAGE()
    THROW
END CATCH

BEGIN TRY
    PRINT 'Creating core tables...'
    
    -- TStatutsDossier
    CREATE TABLE [dbo].[TStatutsDossier](
        [ID Statut Dossier] [int] NOT NULL,
        [Libelle Statut Dossier] [nvarchar](200) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TStatutsDossier$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Statut Dossier] ASC),
        CONSTRAINT [UQ_TStatutsDossier$Libelle Statut Dossier] UNIQUE NONCLUSTERED ([Libelle Statut Dossier] ASC)
    )
    
    -- TCodesEtapes
    CREATE TABLE [dbo].[TCodesEtapes](
        [ID Code Etape] [int] IDENTITY(1,1) NOT NULL,
        [Libelle Etape] [nvarchar](200) NOT NULL,
        [Suivi Duree] [bit] NOT NULL DEFAULT ((0)),
        [Delai Etape] [int] NOT NULL DEFAULT ((0)),
        [Circuit Etape] [nvarchar](200) NOT NULL DEFAULT ('-'),
        [Index Etape] [int] NOT NULL DEFAULT ((0)),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TCodesEtapes$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Code Etape] ASC),
        CONSTRAINT [UQ_TCodesEtapes$Index Etape] UNIQUE NONCLUSTERED ([Index Etape] ASC),
        CONSTRAINT [UQ_TCodesEtapes$Libelle Etape] UNIQUE NONCLUSTERED ([Libelle Etape] ASC)
    )
    
    -- TDossiers
    CREATE TABLE [dbo].[TDossiers](
        [ID Dossier] [int] IDENTITY(1,1) NOT NULL,
        [Branche] [int] NOT NULL DEFAULT ((0)),
        [Type Dossier] [int] NOT NULL,
        [Client] [int] NOT NULL,
        [Description Dossier] [nvarchar](1000) NOT NULL DEFAULT (N''),
        [No OT] [nvarchar](100) NOT NULL DEFAULT (''),
        [No Dossier] [nvarchar](50) NOT NULL DEFAULT (''),
        [Qte Colis OT] [numeric](24, 6) NOT NULL DEFAULT ((1)),
        [Poids Brut OT] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Poids Net OT] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Volume OT] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Poids Brut Pesee] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Poids Net Pesee] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Volume Pesee] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Responsable Dossier] [int] NOT NULL,
        [Convertion] [int] NULL,
        [Derniere Etape Dossier] [int] NULL,
        [Observation Dossier] [nvarchar](1000) NULL,
        [Statut Dossier] [int] NOT NULL DEFAULT ((0)),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TDossiers$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Dossier] ASC)
    )
    
    -- TEtapesDossiers
    CREATE TABLE [dbo].[TEtapesDossiers](
        [ID Etape Dossier] [int] IDENTITY(1,1) NOT NULL,
        [Dossier] [int] NOT NULL,
        [Etape Dossier] [int] NOT NULL,
        [Date Debut] [datetime2](7) NOT NULL,
        [Date Fin] [datetime2](7) NULL,
        [Reference] [nvarchar](200) NULL,
        [Qte] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Obs] [nvarchar](1000) NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TEtapesDossiers$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Etape Dossier] ASC)
    )
    
    PRINT 'Core tables created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating core tables: ' + ERROR_MESSAGE()
    THROW
END CATCH

BEGIN TRY
    PRINT 'Creating packaging and declaration tables...'
    
    -- THSCodes
    CREATE TABLE [dbo].[THSCodes](
        [ID HS Code] [int] IDENTITY(1,1) NOT NULL,
        [HS Code] [nvarchar](50) NOT NULL,
        [Libelle HS Code] [nvarchar](200) NOT NULL DEFAULT ('-'),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [THSCodes$PrimaryKey] PRIMARY KEY CLUSTERED ([ID HS Code] ASC),
        CONSTRAINT [UQ_THSCodes$HS Code] UNIQUE NONCLUSTERED ([HS Code] ASC)
    )
    
    -- TRegimesDouaniers
    CREATE TABLE [dbo].[TRegimesDouaniers](
        [ID Regime Douanier] [int] IDENTITY(1,1) NOT NULL,
        [Code Regime Douanier] [nvarchar](10) NOT NULL,
        [Libelle Regime Douanier] [nvarchar](200) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TRegimesDouaniers$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Regime Douanier] ASC),
        CONSTRAINT [UQ_TRegimesDouaniers$Code Regime Douanier] UNIQUE NONCLUSTERED ([Code Regime Douanier] ASC),
        CONSTRAINT [UQ_TRegimesDouaniers$Libelle Regime Douanier] UNIQUE NONCLUSTERED ([Libelle Regime Douanier] ASC)
    )
    
    -- TRegimesDeclarations
    CREATE TABLE [dbo].[TRegimesDeclarations](
        [ID Regime Declaration] [int] IDENTITY(1,1) NOT NULL,
        [Regime Douanier] [int] NOT NULL,
        [Libelle Regime Declaration] [nvarchar](200) NOT NULL,
        [Taux DC] [numeric](24, 3) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TRegimesDeclarations$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Regime Declaration] ASC),
        CONSTRAINT [UQ_TRegimesDeclarations$Libelle Regime Declaration] UNIQUE NONCLUSTERED ([Libelle Regime Declaration] ASC)
    )
    
    -- TRegimesClients
    CREATE TABLE [dbo].[TRegimesClients](
        [ID Regime Client] [int] IDENTITY(1,1) NOT NULL,
        [Client] [int] NOT NULL,
        [Regime Declaration] [int] NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TRegimesClients$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Regime Client] ASC)
    )
    
    -- TColisageDossiers
    CREATE TABLE [dbo].[TColisageDossiers](
        [ID Colisage Dossier] [int] IDENTITY(1,1) NOT NULL,
        [Dossier] [int] NOT NULL,
        [HS Code] [int] NULL,
        [Description Colis] [nvarchar](1000) NOT NULL,
        [No Commande] [nvarchar](50) NULL,
        [Nom Fournisseur] [nvarchar](200) NULL,
        [No Facture] [nvarchar](50) NULL,
        [Devise] [int] NOT NULL,
        [Qte Colis] [numeric](24, 6) NOT NULL DEFAULT ((1)),
        [Prix Unitaire Facture] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Poids Brut] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Poids Net] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Volume] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Pays Origine] [int] NOT NULL,
        [Regime Declaration] [int] NULL,
        [Regroupement Client] [nvarchar](200) NOT NULL DEFAULT ('-'),
        [UploadKey] [nvarchar](50) NOT NULL DEFAULT (N''),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TColisageDossiers$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Colisage Dossier] ASC),
        CONSTRAINT [IX_TColisageDossiers] UNIQUE NONCLUSTERED ([ID Colisage Dossier] ASC)
    )
    
    -- TNotesDetail
    CREATE TABLE [dbo].[TNotesDetail](
        [ID Note Detail] [int] IDENTITY(1,1) NOT NULL,
        [Colisage Dossier] [int] NOT NULL,
        [Regime] [nvarchar](2) NOT NULL DEFAULT (N''),
        [Base Qte] [numeric](24, 6) NOT NULL DEFAULT ((1)),
        [Base Prix Unitaire] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Base Poids Brut] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Base Poids Net] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Base Volume] [numeric](24, 6) NOT NULL DEFAULT ((0)),
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TNotesDetail$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Note Detail] ASC)
    )
    
    -- TTauxChange
    CREATE TABLE [dbo].[TTauxChange](
        [ID Taux Change] [int] IDENTITY(1,1) NOT NULL,
        [Convertion] [int] NOT NULL,
        [Devise] [int] NOT NULL,
        [Taux Change] [numeric](24, 6) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TTauxChange$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Taux Change] ASC),
        CONSTRAINT [UQ_TTauxChange$Convertion$Devise] UNIQUE NONCLUSTERED ([Convertion] ASC, [Devise] ASC)
    )
    
    PRINT 'Packaging and declaration tables created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating packaging tables: ' + ERROR_MESSAGE()
    THROW
END CATCH

BEGIN TRY
    PRINT 'Creating permission and role tables...'
    
    -- TRoles
    CREATE TABLE [dbo].[TRoles](
        [ID Role] [int] IDENTITY(1,1) NOT NULL,
        [Libelle Role] [nvarchar](200) NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TRoles$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Role] ASC),
        CONSTRAINT [UQ_TRoles$Libelle Role] UNIQUE NONCLUSTERED ([Libelle Role] ASC)
    )
    
    -- TPermissionsBase
    CREATE TABLE [dbo].[TPermissionsBase](
        [ID Permission Base] [int] NOT NULL,
        [Libelle Permission] [nvarchar](200) NOT NULL,
        [Permission Active] [bit] NOT NULL DEFAULT ((0)),
        [Date Activation] [datetime2](7) NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TPermissionsBase$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Permission Base] ASC),
        CONSTRAINT [UQ_TPermissionsBase$Libelle Permission] UNIQUE NONCLUSTERED ([Libelle Permission] ASC)
    )
    
    -- TRolesUtilisateurs
    CREATE TABLE [dbo].[TRolesUtilisateurs](
        [ID Role Utilisateur] [int] IDENTITY(1,1) NOT NULL,
        [Role] [int] NOT NULL,
        [Utilisateur] [int] NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TRolesUtilisateurs$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Role Utilisateur] ASC)
    )
    
    -- TPermissonsRoles
    CREATE TABLE [dbo].[TPermissonsRoles](
        [ID Permission Role] [int] IDENTITY(1,1) NOT NULL,
        [Role] [int] NOT NULL,
        [Permission] [int] NOT NULL,
        [Session] [int] NOT NULL DEFAULT ((0)),
        [Date Creation] [datetime2](7) NOT NULL DEFAULT (getdate()),
        [RowVer] [timestamp] NOT NULL,
        CONSTRAINT [TPermissonsRoles$PrimaryKey] PRIMARY KEY CLUSTERED ([ID Permission Role] ASC)
    )
    
    PRINT 'Permission and role tables created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating permission tables: ' + ERROR_MESSAGE()
    THROW
END CATCH

PRINT 'Phase 2 completed: All tables created'
PRINT ''
-- ============================================================================
-- PHASE 3: CREATE INDEXES
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 3: Creating indexes...'
PRINT '=========================================='

BEGIN TRY
    PRINT 'Creating unique indexes...'
    
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_TColisageDossiers$UploadKey] ON [dbo].[TColisageDossiers]
    ([Dossier] ASC, [UploadKey] ASC)
    WHERE ([UploadKey]<>N'')
    
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_TDossiers$No Dossier] ON [dbo].[TDossiers]
    ([No Dossier] ASC, [Branche] DESC)
    WHERE ([No Dossier]<>'')
    
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_TDossiers$No OT] ON [dbo].[TDossiers]
    ([No OT] ASC, [Client] DESC)
    WHERE ([No OT]<>'')
    
    PRINT 'Indexes created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating indexes: ' + ERROR_MESSAGE()
    THROW
END CATCH

PRINT 'Phase 3 completed: All indexes created'
PRINT ''

-- ============================================================================
-- PHASE 4: CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 4: Creating foreign key constraints...'
PRINT '=========================================='

BEGIN TRY
    PRINT 'Creating foreign keys...'
    
    ALTER TABLE [dbo].[TBranches] ADD CONSTRAINT [FK_TBranches_TEntites] 
        FOREIGN KEY([Entite]) REFERENCES [dbo].[TEntites] ([ID Entite])
    
    ALTER TABLE [dbo].[TClients] ADD CONSTRAINT [FK_TClients_TEntites] 
        FOREIGN KEY([Entite]) REFERENCES [dbo].[TEntites] ([ID Entite])
    
    ALTER TABLE [dbo].[TColisageDossiers] ADD CONSTRAINT [FK_TColisageDossiers_TDevises] 
        FOREIGN KEY([Devise]) REFERENCES [dbo].[TDevises] ([ID Devise]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TColisageDossiers] ADD CONSTRAINT [FK_TColisageDossiers_TDossiers] 
        FOREIGN KEY([Dossier]) REFERENCES [dbo].[TDossiers] ([ID Dossier]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TColisageDossiers] ADD CONSTRAINT [FK_TColisageDossiers_THSCodes] 
        FOREIGN KEY([HS Code]) REFERENCES [dbo].[THSCodes] ([ID HS Code]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TColisageDossiers] ADD CONSTRAINT [FK_TColisageDossiers_TPays] 
        FOREIGN KEY([Pays Origine]) REFERENCES [dbo].[TPays] ([ID Pays]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TColisageDossiers] ADD CONSTRAINT [FK_TColisageDossiers_TRegimesDeclarations] 
        FOREIGN KEY([Regime Declaration]) REFERENCES [dbo].[TRegimesDeclarations] ([ID Regime Declaration]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TDossiers] ADD CONSTRAINT [FK_TDossiers_TBranches] 
        FOREIGN KEY([Branche]) REFERENCES [dbo].[TBranches] ([ID Branche]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TDossiers] ADD CONSTRAINT [FK_TDossiers_TClients] 
        FOREIGN KEY([Client]) REFERENCES [dbo].[TClients] ([ID Client]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TDossiers] ADD CONSTRAINT [FK_TDossiers_TConvertions] 
        FOREIGN KEY([Convertion]) REFERENCES [dbo].[TConvertions] ([ID Convertion]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TDossiers] ADD CONSTRAINT [FK_TDossiers_TStatutsDossier] 
        FOREIGN KEY([Statut Dossier]) REFERENCES [dbo].[TStatutsDossier] ([ID Statut Dossier]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TDossiers] ADD CONSTRAINT [FK_TDossiers_TTypes_Dossiers] 
        FOREIGN KEY([Type Dossier]) REFERENCES [dbo].[TTypesDossiers] ([ID Type Dossier]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TDossiers] ADD CONSTRAINT [FK_TDossiers_TUtilisateurs] 
        FOREIGN KEY([Responsable Dossier]) REFERENCES [dbo].[TUtilisateurs] ([ID Utilisateur]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TEntites] ADD CONSTRAINT [FK_TEntites_TGroupesEntites] 
        FOREIGN KEY([Groupe Entite]) REFERENCES [dbo].[TGroupesEntites] ([ID Groupe Entite]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TEntites] ADD CONSTRAINT [FK_TEntites_TPays] 
        FOREIGN KEY([Pays]) REFERENCES [dbo].[TPays] ([ID Pays]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TEtapesDossiers] ADD CONSTRAINT [FK_TEtapesDossiers_TCodesEtapes] 
        FOREIGN KEY([Etape Dossier]) REFERENCES [dbo].[TCodesEtapes] ([ID Code Etape]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TEtapesDossiers] ADD CONSTRAINT [FK_TEtapesDossiers_TDossiers] 
        FOREIGN KEY([Dossier]) REFERENCES [dbo].[TDossiers] ([ID Dossier]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TNotesDetail] ADD CONSTRAINT [FK_TNotesDetail_TColisageDossiers] 
        FOREIGN KEY([Colisage Dossier]) REFERENCES [dbo].[TColisageDossiers] ([ID Colisage Dossier]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TPays] ADD CONSTRAINT [FK_TPays_TDevises] 
        FOREIGN KEY([Devise Locale]) REFERENCES [dbo].[TDevises] ([ID Devise])
    
    ALTER TABLE [dbo].[TPermissonsRoles] ADD CONSTRAINT [FK_TPermissonsRoles_TPermissionsBase] 
        FOREIGN KEY([Permission]) REFERENCES [dbo].[TPermissionsBase] ([ID Permission Base]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TPermissonsRoles] ADD CONSTRAINT [FK_TPermissonsRoles_TPermissonsRoles] 
        FOREIGN KEY([Role]) REFERENCES [dbo].[TRoles] ([ID Role]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TRegimesClients] ADD CONSTRAINT [FK_TRegimesClients_TClients] 
        FOREIGN KEY([Client]) REFERENCES [dbo].[TClients] ([ID Client]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TRegimesClients] ADD CONSTRAINT [FK_TRegimesClients_TRegimesDeclarations] 
        FOREIGN KEY([Regime Declaration]) REFERENCES [dbo].[TRegimesDeclarations] ([ID Regime Declaration]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TRegimesDeclarations] ADD CONSTRAINT [FK_TRegimesDeclarations_TRegimesDouaniers] 
        FOREIGN KEY([Regime Douanier]) REFERENCES [dbo].[TRegimesDouaniers] ([ID Regime Douanier]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TRolesUtilisateurs] ADD CONSTRAINT [FK_TRolesUtilisateurs_TRoles] 
        FOREIGN KEY([Role]) REFERENCES [dbo].[TRoles] ([ID Role]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TRolesUtilisateurs] ADD CONSTRAINT [FK_TRolesUtilisateurs_TUtilisateurs] 
        FOREIGN KEY([Utilisateur]) REFERENCES [dbo].[TUtilisateurs] ([ID Utilisateur]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TTauxChange] ADD CONSTRAINT [FK_TTauxChange_TConvertions] 
        FOREIGN KEY([Convertion]) REFERENCES [dbo].[TConvertions] ([ID Convertion]) ON UPDATE CASCADE
    
    ALTER TABLE [dbo].[TTauxChange] ADD CONSTRAINT [FK_TTauxChange_TDevises] 
        FOREIGN KEY([Devise]) REFERENCES [dbo].[TDevises] ([ID Devise]) ON UPDATE CASCADE
    
    PRINT 'Foreign keys created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating foreign keys: ' + ERROR_MESSAGE()
    THROW
END CATCH

PRINT 'Phase 4 completed: All foreign key constraints created'
PRINT ''
-- ============================================================================
-- PHASE 5: CREATE VIEWS
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 5: Creating views...'
PRINT '=========================================='

BEGIN TRY
    PRINT 'Creating base views...'
    
    -- VSessions
    CREATE VIEW [dbo].[VSessions] AS
    SELECT A.[ID Session] AS [ID_Session]
        ,B.[ID Utilisateur] AS [ID_Utilisateur]
        ,B.[Nom Utilisateur] AS [Nom_Utilisateur]
        ,A.[Debut Session] AS [Debut_Session]
        ,A.[Fin Session] AS [Fin_Session]
    FROM dbo.TSessions A 
    INNER JOIN dbo.TUtilisateurs B ON A.[Utilisateur]=B.[ID Utilisateur]
    
    -- VUtilisateurs
    CREATE VIEW [dbo].[VUtilisateurs] AS
    SELECT A.[ID Utilisateur] AS [ID_Utilisateur]
        ,A.[Nom Utilisateur] AS [Nom_Utilisateur]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TUtilisateurs A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    WHERE [ID Utilisateur]>0
    
    -- VSensTrafic
    CREATE VIEW [dbo].[VSensTrafic] AS
    SELECT A.[ID Sens Trafic] AS [ID_Sens_Trafic]
        ,A.[Libelle Sens Trafic] AS [Libelle_Sens_Trafic]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TSensTrafic A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VModesTransport
    CREATE VIEW [dbo].[VModesTransport] AS
    SELECT A.[ID Mode Transport] AS [ID_Mode_Transport]
        ,A.[Libelle Mode Transport] AS [Libelle_Mode_Transport]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TModesTransport A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VDevises
    CREATE VIEW [dbo].[VDevises] AS
    SELECT A.[ID Devise] AS [ID_Devise]
        ,A.[Code Devise] AS [Code_Devise]
        ,A.[Libelle Devise] AS [Libelle_Devise]
        ,A.[Decimales] AS [Decimales]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TDevises A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    WHERE [Devise Inactive]=0
    
    -- VPays
    CREATE VIEW [dbo].[VPays] AS
    SELECT A.[ID Pays] AS [ID_Pays]
        ,A.[Code Pays] AS [Code_Pays]
        ,A.[Libelle Pays] AS [Libelle_Pays]
        ,B.[Code Devise] AS [Devise_Locale]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TPays A
    INNER JOIN dbo.TDevises B ON A.[Devise Locale]=B.[ID Devise]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VGroupesEntites
    CREATE VIEW [dbo].[VGroupesEntites] AS
    SELECT A.[ID Groupe Entite] AS [ID_Groupe_Entite]
        ,A.[Nom Groupe Entite] AS [Nom_Groupe_Entite]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TGroupesEntites A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VEntites
    CREATE VIEW [dbo].[VEntites] AS
    SELECT A.[ID Entite] AS [ID_Entite]
        ,A.[Nom Entite] AS [Nom_Entite]
        ,B.[ID Groupe Entite] AS [ID_Groupe_Entite]
        ,B.[Nom Groupe Entite] AS [Nom_Groupe_Entite]
        ,C.[ID Pays] AS [ID_Pays]
        ,C.[Libelle Pays] AS [Libelle_Pays]
        ,D.[Code Devise] AS [Devise_Locale]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TEntites A
    INNER JOIN dbo.TGroupesEntites B ON A.[Groupe Entite]=B.[ID Groupe Entite]
    INNER JOIN dbo.TPays C ON A.[Pays]=C.[ID Pays]
    INNER JOIN dbo.TDevises D ON C.[Devise Locale]=D.[ID Devise]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VBranches
    CREATE VIEW [dbo].[VBranches] AS
    SELECT A.[ID Branche] AS [ID_Branche]
        ,A.[Code Branche] AS [Code_Branche]
        ,A.[Nom Branche] AS [Nom_Branche]
        ,B.[ID_Entite]
        ,B.[Nom_Entite]
        ,B.[ID_Groupe_Entite]
        ,B.[ID_Pays]
        ,B.[Libelle_Pays]
        ,B.[Devise_Locale]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TBranches A
    INNER JOIN dbo.VEntites B ON A.[Entite]=B.[ID_Entite]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VClients
    CREATE VIEW [dbo].[VClients] AS
    SELECT A.[ID Client] AS [ID_Client]
        ,A.[Nom Client] AS [Nom_Client]
        ,A.[Entite] AS [ID_Entite]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TClients A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    PRINT 'Base views created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating base views: ' + ERROR_MESSAGE()
    THROW
END CATCH

BEGIN TRY
    PRINT 'Creating reference views...'
    
    -- VTypesDossiers
    CREATE VIEW [dbo].[VTypesDossiers] AS
    SELECT A.[ID Type Dossier] AS [ID_Type_Dossier]
        ,A.[Libelle Type Dossier] AS [Libelle_Type_Dossier]
        ,B.[ID Sens Trafic] AS [ID_Sens_Trafic]
        ,B.[Libelle Sens Trafic] AS [Libelle_Sens_Trafic]
        ,C.[ID Mode Transport] AS [ID_Mode_Transport]
        ,C.[Libelle Mode Transport] AS [Libelle_Mode_Transport]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TTypesDossiers A
    INNER JOIN dbo.TSensTrafic B ON A.[Sens Trafic]=B.[ID Sens Trafic]
    INNER JOIN dbo.TModesTransport C ON A.[Mode Transport]=C.[ID Mode Transport]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VCodesEtapes
    CREATE VIEW [dbo].[VCodesEtapes] AS
    SELECT A.[ID Code Etape] AS [ID_Code_Etape]
        ,A.[Libelle Etape] AS [Libelle_Etape]
        ,A.[Suivi Duree] AS [Suivi_Duree]
        ,A.[Circuit Etape] AS [Circuit_Etape]
        ,A.[Index Etape] AS [Index_Etape]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TCodesEtapes A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    WHERE A.[ID Code Etape] NOT IN (0,1000000)
    
    -- VStatutsDossier
    CREATE VIEW [dbo].[VStatutsDossier] AS
    SELECT [ID Statut Dossier] AS [ID_Statut_Dossier]
        ,[Libelle Statut Dossier] AS [Libelle_Statut_Dossier]
    FROM dbo.TStatutsDossier
    
    -- VConvertions
    CREATE VIEW [dbo].[VConvertions] AS
    SELECT A.[ID Convertion] AS [ID_Convertion]
        ,A.[Date Convertion] AS [Date_Convertion]
        ,A.[Date Creation] AS [Date_Creation]
        ,A.[Entite] AS [ID_Entite]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TConvertions A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VHSCodes
    CREATE VIEW [dbo].[VHSCodes] AS
    SELECT A.[ID HS Code] AS [ID_HS_Code]
        ,A.[HS Code] AS [HS_Code]
        ,A.[Libelle HS Code] AS [Libelle_HS_Code]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.THSCodes A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VRegimesDouaniers
    CREATE VIEW [dbo].[VRegimesDouaniers] AS
    SELECT A.[ID Regime Douanier] AS [ID_Regime_Douanier]
        ,A.[Libelle Regime Douanier] AS [Libelle_Regime_Douanier]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TRegimesDouaniers A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VRegimesDeclarations
    CREATE VIEW [dbo].[VRegimesDeclarations] AS
    SELECT A.[ID Regime Declaration] AS [ID_Regime_Declaration]
        ,B.[ID Regime Douanier] AS [ID_Regime_Douanier]
        ,B.[Libelle Regime Douanier] AS [Libelle_Regime_Douanier]
        ,A.[Libelle Regime Declaration] AS [Libelle_Regime_Declaration]
        ,A.[Taux DC] AS [Ratio_DC]
        ,IIF(A.[Taux DC]=0, 0, 1-A.[Taux DC]) AS [Ratio_TR]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TRegimesDeclarations A
    INNER JOIN dbo.TRegimesDouaniers B ON A.[Regime Douanier]=B.[ID Regime Douanier]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VRegimesClients
    CREATE VIEW [dbo].[VRegimesClients] AS
    SELECT A.[ID Regime Client] AS [ID_Regime_Client]
        ,B.[ID Client] AS [ID_Client]
        ,B.[Nom Client] AS [Nom_Client]
        ,C.ID_Regime_Declaration
        ,C.[ID_Regime_Douanier]
        ,C.[Libelle_Regime_Douanier]
        ,C.[Libelle_Regime_Declaration]
        ,C.[Ratio_DC]
        ,C.[Ratio_TR]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TRegimesClients A
    INNER JOIN dbo.TClients B ON A.[Client]=B.[ID Client]
    INNER JOIN dbo.VRegimesDeclarations C ON A.[Regime Declaration]=C.ID_Regime_Declaration
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VTauxChange
    CREATE VIEW [dbo].[VTauxChange] AS
    SELECT A.[ID Taux Change] AS [ID_Taux_Change]
        ,A.[Convertion] AS [ID_Convertion]
        ,B.[Code Devise] AS [Devise]
        ,A.[Taux Change] AS [Taux_Change]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TTauxChange A
    INNER JOIN dbo.TDevises B ON A.Devise=B.[ID Devise]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VPermissionsBase
    CREATE VIEW [dbo].[VPermissionsBase] AS
    SELECT [ID Permission Base] AS [ID_Permission_Base]
        ,[Libelle Permission] AS [Libelle_Permission]
        ,[Permission Active] AS [Permission_Active]
        ,[Date Activation] AS [Date_Activation]
    FROM dbo.TPermissionsBase
    
    -- VRoles
    CREATE VIEW [dbo].[VRoles] AS
    SELECT A.[ID Role] AS [ID_Role]
        ,A.[Libelle Role] AS [Libelle_Role]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TRoles A 
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VRolesUtilisateurs
    CREATE VIEW [dbo].[VRolesUtilisateurs] AS
    SELECT A.[ID Role Utilisateur] AS [ID_Role_Utilisateur]
        ,B.[ID Role] AS [ID_Role]
        ,B.[Libelle Role] AS [Libelle_Role]
        ,C.[ID Utilisateur] AS [ID_Utilisateur]
        ,C.[Nom Utilisateur] AS [Nom_Utilisateur]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TRolesUtilisateurs A
    INNER JOIN dbo.TRoles B ON A.[Role]=B.[ID Role]
    INNER JOIN dbo.TUtilisateurs C ON A.[Utilisateur]=C.[ID Utilisateur]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VPermissonsRoles
    CREATE VIEW [dbo].[VPermissonsRoles] AS
    SELECT A.[ID Permission Role] AS [ID_Permission_Role]
        ,B.[ID Role] AS [ID_Role]
        ,B.[Libelle Role] AS [Libelle_Role]
        ,C.[ID Permission Base] AS [ID_Permission]
        ,C.[Libelle Permission] AS [Libelle_Permission]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TPermissonsRoles A
    INNER JOIN dbo.TRoles B ON A.[Role]=B.[ID Role]
    INNER JOIN dbo.TPermissionsBase C ON A.[Permission]=C.[ID Permission Base]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    WHERE C.[Permission Active]=1
    
    PRINT 'Reference views created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating reference views: ' + ERROR_MESSAGE()
    THROW
END CATCH

PRINT 'Phase 5 completed: All views created'
PRINT ''
-- ============================================================================
-- PHASE 6: CREATE COMPLEX VIEWS
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 6: Creating complex views...'
PRINT '=========================================='

BEGIN TRY
    PRINT 'Creating complex views...'
    
    -- VEtapesDossiers
    CREATE VIEW [dbo].[VEtapesDossiers] AS
    SELECT A.[ID Etape Dossier] AS [ID_Etape_Dossier]
        ,A.Dossier AS [ID_Dossier]
        ,B.[ID Code Etape] AS [ID_Etape]
        ,B.[Libelle Etape] AS [Libelle_Etape]
        ,B.[Circuit Etape] AS [Circuit_Etape]
        ,B.[Index Etape] AS [Index_Etape]
        ,A.[Date Debut] AS [Date_Debut_Etape]
        ,A.[Date Fin] AS [Date_Fin_Etape]
        ,A.[Reference] AS [Reference_Etape]
        ,A.[Qte] AS [Qte_Etape]
        ,A.[Obs] AS [Obs_Etape]
        ,IIF(B.[Suivi Duree]=1, DATEDIFF (DAY, A.[Date Debut],A.[Date Fin])-B.[Delai Etape],0) AS [Retard_Etape]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TEtapesDossiers A
    INNER JOIN dbo.TCodesEtapes B ON A.[Etape Dossier]=B.[ID Code Etape]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VColisageDossiers
    CREATE VIEW [dbo].[VColisageDossiers] AS
    SELECT A.[ID Colisage Dossier] AS [ID_Colisage_Dossier]
        ,A.[Dossier] AS [ID_Dossier]
        ,M.[HS Code] AS [HS_Code]
        ,A.[Description Colis] AS [Description_Colis]
        ,A.[No Commande] AS [No_Commande]
        ,A.[Nom Fournisseur] AS [Nom_Fournisseur]
        ,A.[No Facture] AS [No_Facture]
        ,B.[Code Devise] AS [Code_Devise]
        ,A.[Qte Colis] AS [Qte_Colis]
        ,A.[Prix Unitaire Facture] AS [Prix_Unitaire_Facture]
        ,A.[Poids Brut] AS [Poids_Brut]
        ,A.[Poids Net] AS [Poids_Net]
        ,A.[Volume] AS [Volume]
        ,C.[Libelle Pays] AS [Pays_Origine]
        ,N.ID_Regime_Declaration
        ,N.[ID_Regime_Douanier]
        ,N.[Libelle_Regime_Douanier]
        ,N.[Libelle_Regime_Declaration]
        ,N.[Ratio_DC]
        ,N.[Ratio_TR]
        ,A.[Regroupement Client] AS [Regroupement_Client]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TColisageDossiers A
    INNER JOIN dbo.TDevises B ON A.[Devise]=B.[ID Devise]
    INNER JOIN dbo.TPays C ON A.[Pays Origine]=C.[ID Pays]
    LEFT JOIN dbo.THSCodes M ON A.[HS Code]=M.[ID HS Code]
    LEFT JOIN dbo.VRegimesDeclarations N ON A.[Regime Declaration]=N.[ID_Regime_Declaration]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VNotesDetail
    CREATE VIEW [dbo].[VNotesDetail] AS
    SELECT A.[ID Note Detail] AS [ID_Note_Detail]
        ,B.[ID_Colisage_Dossier]
        ,B.[ID_Dossier]
        ,B.[HS_Code]
        ,B.[Description_Colis]
        ,B.[No_Commande]
        ,B.[Nom_Fournisseur]
        ,B.[No_Facture]
        ,B.[Code_Devise]
        ,B.[Pays_Origine]
        ,B.ID_Regime_Declaration
        ,B.[ID_Regime_Douanier]
        ,B.[Libelle_Regime_Douanier]
        ,B.[Libelle_Regime_Declaration]
        ,B.[Regroupement_Client]
        ,A.[Regime] AS [Regime]
        ,A.[Base Qte] AS [Base_Qte]
        ,A.[Base Prix Unitaire] AS [Base_PU]
        ,A.[Base Poids Brut] AS [Base_Poids_Brut]
        ,A.[Base Poids Net] AS [Base_Poids_Net]
        ,A.[Base Volume] AS [Base_Volume]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TNotesDetail A
    INNER JOIN dbo.VColisageDossiers B ON A.[Colisage Dossier]=B.ID_Colisage_Dossier
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    
    -- VDossiers
    CREATE VIEW [dbo].[VDossiers] AS
    SELECT A.[ID Dossier] AS [ID_Dossier]
        ,I.[ID_Branche]
        ,I.[Nom_Branche]
        ,I.[ID_Entite]
        ,I.[Nom_Entite]
        ,I.[ID_Groupe_Entite]
        ,I.[ID_Pays]
        ,I.[Libelle_Pays]
        ,I.[Devise_Locale]
        ,C.[ID_Type_Dossier]
        ,C.[Libelle_Type_Dossier]
        ,C.[ID_Sens_Trafic]
        ,C.[Libelle_Sens_Trafic]
        ,C.[ID_Mode_Transport]
        ,C.[Libelle_Mode_Transport]
        ,B.[ID Client] AS [ID_Client]
        ,B.[Nom Client] AS [Nom_Client]
        ,A.[Description Dossier] AS [Description_Dossier]
        ,A.[No OT] AS [No_OT]
        ,A.[No Dossier] AS [No_Dossier]
        ,A.[Qte Colis OT] AS [Qte_Colis_OT]
        ,A.[Poids Brut OT] AS [Poids_Brut_OT]
        ,A.[Poids Net OT] AS [Poids_Net_OT]
        ,A.[Volume OT] AS [Volume_OT]
        ,A.[Poids Brut Pesee] AS [Poids_Brut_Pesee]
        ,A.[Poids Net Pesee] AS [Poids_Net_Pesee]
        ,A.[Volume Pesee] AS [Volume_Pesee]
        ,G.[ID Utilisateur] AS [Responsable_ID]
        ,G.[Nom Utilisateur] AS [Nom_Responsable]
        ,P.[Date Convertion] AS [Date_Declaration]
        ,N.[ID_Etape_Dossier] AS [ID_Etape_Actuelle]
        ,N.[Libelle_Etape] AS [Libelle_Etape_Actuelle]
        ,N.[Circuit_Etape] AS [Circuit_Etape_Actuelle]
        ,N.[Index_Etape] AS [Index_Etape_Actuelle]
        ,N.[Date_Debut_Etape] AS [Date_Debut_Etape_Actuelle]
        ,N.[Date_Fin_Etape] AS [Date_Fin_Etape_Actuelle]
        ,N.[Reference_Etape] AS [Reference_Etape_Actuelle]
        ,N.[Qte_Etape] AS [Qte_Etape_Actuelle]
        ,N.[Obs_Etape] AS [Obs_Etape_Actuelle]
        ,N.Retard_Etape AS [Retard_Etape_Actuelle]
        ,X.[Date Debut] AS [Date_Ouverture_Dossier]
        ,Y.[Date Debut] AS [Date_Cloture_Dossier]
        ,H.[ID Statut Dossier] AS [ID_Statut_Dossier]
        ,H.[Libelle Statut Dossier] AS [Libelle_Statut_Dossier]
        ,A.[Date Creation] AS [Date_Creation]
        ,Z.Nom_Utilisateur AS [Nom_Creation]
    FROM dbo.TDossiers A
    INNER JOIN dbo.TClients B ON A.[Client]=B.[ID Client]
    INNER JOIN dbo.VTypesDossiers C ON A.[Type Dossier]=C.[ID_Type_Dossier]
    INNER JOIN dbo.TStatutsDossier F ON A.[Statut Dossier]=F.[ID Statut Dossier]
    INNER JOIN dbo.TUtilisateurs G ON A.[Responsable Dossier]=G.[ID Utilisateur]
    INNER JOIN dbo.TStatutsDossier H ON A.[Statut Dossier]=H.[ID Statut Dossier]
    INNER JOIN dbo.VBranches I ON A.[Branche]=I.[ID_Branche]
    LEFT JOIN dbo.VEtapesDossiers N ON A.[Derniere Etape Dossier]=N.[ID_Etape_Dossier]
    LEFT JOIN dbo.TConvertions P ON A.Convertion=P.[ID Convertion]
    LEFT JOIN dbo.[VSessions] Z ON A.[Session]=Z.[ID_Session]
    LEFT JOIN (SELECT [Dossier], [Date Debut] FROM dbo.TEtapesDossiers WHERE [Etape Dossier]=0) X ON A.[ID Dossier]=X.Dossier
    LEFT JOIN (SELECT [Dossier], [Date Debut] FROM dbo.TEtapesDossiers WHERE [Etape Dossier]=1000000) Y ON A.[ID Dossier]=Y.Dossier
    
    PRINT 'Complex views created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating complex views: ' + ERROR_MESSAGE()
    THROW
END CATCH

PRINT 'Phase 6 completed: All complex views created'
PRINT ''

-- ============================================================================
-- PHASE 7: CREATE USER-DEFINED FUNCTIONS
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 7: Creating user-defined functions...'
PRINT '=========================================='

BEGIN TRY
    PRINT 'Creating functions...'
    
    -- fx_TauxChangeDossier
    CREATE FUNCTION [dbo].[fx_TauxChangeDossier](@Id_Dossier INT)
    RETURNS TABLE
    AS
    RETURN
    (
        WITH DEVISES_DOSSIER ([ID Devise]) AS
        (
            SELECT DISTINCT [Devise]
            FROM [dbo].[TColisageDossiers]
            WHERE [Dossier]=@Id_Dossier
        ),
        TAUXCHANGE_DOSSIER ([ID Devise], [Taux Change]) AS
        (
            SELECT A.[Devise], A.[Taux Change]
            FROM dbo.TTauxChange A 
            INNER JOIN dbo.TDossiers B ON A.[Convertion]=B.[Convertion]
            WHERE B.[ID Dossier]=@Id_Dossier
        ),
        ID_DEVISE_LOCALE([ID Devise0]) AS
        (
            SELECT D.[Devise Locale]
            FROM dbo.TDossiers A
            INNER JOIN dbo.TBranches B ON A.[Branche]=B.[ID Branche]
            INNER JOIN dbo.TEntites C ON B.[Entite]=C.[ID Entite]
            INNER JOIN dbo.TPays D ON C.[Pays]=D.[ID Pays]
            WHERE A.[ID Dossier]=@Id_Dossier
        ),
        TAUX_DEVISE_LOCALE([Taux Change0]) AS
        (
            SELECT A.[Taux Change]
            FROM TAUXCHANGE_DOSSIER A 
            INNER JOIN ID_DEVISE_LOCALE B ON A.[ID Devise]=B.[ID Devise0]
        )
        SELECT B.[ID Devise] AS [ID_Devise]
            ,B.[Code Devise] AS [Code_Devise]
            ,CAST(CASE
                WHEN A.[ID Devise]= X.[ID Devise0] THEN 1
                WHEN ISNULL(C.[Taux Change],0)=0 THEN NULL
                ELSE IIF(ISNULL(Y.[Taux Change0],0)=0, C.[Taux Change], C.[Taux Change]/Y.[Taux Change0])
            END AS numeric(24,6)) AS [Taux_Change]
        FROM DEVISES_DOSSIER A
        INNER JOIN dbo.TDevises B ON A.[ID Devise]=B.[ID Devise]
        LEFT JOIN TAUXCHANGE_DOSSIER C ON A.[ID Devise]=C.[ID Devise], ID_DEVISE_LOCALE X, TAUX_DEVISE_LOCALE Y
    )
    
    -- fx_PermissionsUtilisateur
    CREATE FUNCTION [dbo].[fx_PermissionsUtilisateur](@Id_Utilisateur INT)
    RETURNS TABLE
    AS
    RETURN
    (
        WITH ROLES_UTILISATEUR ([ID Role]) AS
        (
            SELECT DISTINCT [Role]
            FROM [dbo].[TRolesUtilisateurs]
            WHERE [Utilisateur]=@Id_Utilisateur
        )
        SELECT DISTINCT B.[Permission] AS [ID_Permission]
        FROM ROLES_UTILISATEUR A 
        INNER JOIN dbo.TPermissonsRoles B ON A.[ID Role]=B.[Role]
    )
    
    PRINT 'User-defined functions created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating functions: ' + ERROR_MESSAGE()
    THROW
END CATCH

PRINT 'Phase 7 completed: All user-defined functions created'
PRINT ''
-- ============================================================================
-- PHASE 8: CREATE STORED PROCEDURES
-- ============================================================================

PRINT '=========================================='
PRINT 'PHASE 8: Creating stored procedures...'
PRINT '=========================================='

BEGIN TRY
    PRINT 'Creating stored procedures...'
    
    -- pSP_RecalculeDerniereEtapeDossier
    CREATE PROCEDURE [dbo].[pSP_RecalculeDerniereEtapeDossier]
        @Dossier int=0
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF @Dossier>0
        BEGIN
            UPDATE A
            SET [Derniere Etape Dossier]=B.[ID Etape Dossier]
            FROM TDossiers A
            OUTER APPLY
            (
                SELECT TOP 1 M.[ID Etape Dossier]
                FROM TEtapesDossiers M 
                INNER JOIN TCodesEtapes N ON M.[Etape Dossier] = N.[ID Code Etape]
                WHERE (M.[Dossier] = A.[ID Dossier])
                ORDER BY ISNULL(M.[Date Fin], M.[Date Debut]) DESC, N.[Index Etape] DESC
            ) B
            WHERE (A.[ID Dossier]=@Dossier) AND (ISNULL(A.[Derniere Etape Dossier],0) <>ISNULL(B.[ID Etape Dossier],0))
        END 
        ELSE
        BEGIN
            UPDATE A
            SET [Derniere Etape Dossier]=B.[ID Etape Dossier]
            FROM TDossiers A
            OUTER APPLY
            (
                SELECT TOP 1 M.[ID Etape Dossier]
                FROM TEtapesDossiers M 
                INNER JOIN TCodesEtapes N ON M.[Etape Dossier] = N.[ID Code Etape]
                WHERE (M.[Dossier] = A.[ID Dossier])
                ORDER BY ISNULL(M.[Date Fin], M.[Date Debut]) DESC, N.[Index Etape] DESC
            ) B
            WHERE ISNULL(A.[Derniere Etape Dossier],0) <>ISNULL(B.[ID Etape Dossier],0)
        END
    END
    
    -- pSP_CreerNoteDetail
    CREATE PROCEDURE [dbo].[pSP_CreerNoteDetail]
        @Id_Dossier int=0
    AS
    BEGIN
        SET NOCOUNT ON;
        DECLARE @Values nvarchar(max), @Message nvarchar(max)
        DECLARE @TAUX_DEVISES TABLE ([ID_Devise] int PRIMARY KEY NOT NULL, [Code_Devise] nvarchar(5) NOT NULL, [Taux_Change] numeric(24,6))
        
        -- Verify folder exists
        IF NOT EXISTS(SELECT TOP 1 [ID Dossier] FROM TDossiers WHERE [ID Dossier]=@Id_Dossier)
        BEGIN
            SET @Message='FILE NOT FOUND'
            RAISERROR (@Message, 16, 1) WITH LOG;
            RETURN
        END
        
        -- Get exchange rates
        INSERT INTO @TAUX_DEVISES
        SELECT [ID_Devise],[Code_Devise],[Taux_Change]
        FROM [dbo].[fx_TauxChangeDossier](@Id_Dossier)
        
        -- Verify exchange rates
        IF EXISTS(SELECT TOP 1 [ID_Devise] FROM @TAUX_DEVISES WHERE ISNULL([Taux_Change],0)<=0)
        BEGIN
            SET @Values=STUFF((SELECT DISTINCT ' ¤ '+[Code_Devise] AS [text()]
            FROM @TAUX_DEVISES
            WHERE [Taux_Change] IS NULL
            FOR XML PATH('') ),1,3,'')
            SET @Message='MISSING OR WRONG EXCHANGE RATE FOR CURRENCIES {' + @Values +'}'
            RAISERROR (@Message, 16, 1) WITH LOG;
            RETURN
        END
        
        -- Verify packings exist
        IF NOT EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier]=@Id_Dossier)
        BEGIN
            SET @Message='MISSING PACKING LIST ON FILE'
            RAISERROR (@Message, 16, 1) WITH LOG;
            RETURN
        END
        
        -- Verify HS Code and regime required on all lines
        IF EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE ([Dossier]=@Id_Dossier) AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL)))
        BEGIN
            SET @Values=STUFF((SELECT DISTINCT ' ¤ '+[Description Colis] AS [text()]
            FROM TColisageDossiers
            WHERE ([Dossier]=@Id_Dossier) AND ([HS Code] IS NULL)
            FOR XML PATH('') ),1,3,'')
            SET @Message='MISSING HS CODE OR REGIME FOR LINES {' + @Values +'}'
            RAISERROR (@Message, 16, 1) WITH LOG;
            RETURN
        END
        
        BEGIN TRY
        BEGIN TRANSACTION;
            
            -- Insert declaration notes
            INSERT INTO [dbo].[TNotesDetail]
            ([Colisage Dossier], [Regime], [Base Qte], [Base Prix Unitaire], [Base Poids Brut], [Base Poids Net], [Base Volume])
            -- DC=0%
            SELECT A.[ID Colisage Dossier], N'', A.[Qte Colis], 0, A.[Poids Brut], A.[Poids Net], A.Volume
            FROM [dbo].[TColisageDossiers] A
            INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
            INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
            WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=0)
            -- DC=100%
            UNION ALL
            SELECT A.[ID Colisage Dossier], N'', A.[Qte Colis], A.[Prix Unitaire Facture], A.[Poids Brut], A.[Poids Net], A.Volume
            FROM [dbo].[TColisageDossiers] A
            INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
            INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
            WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC]=1)
            -- DC=x% (DC case)
            UNION ALL
            SELECT A.[ID Colisage Dossier], N'DC', A.[Qte Colis]*B.[Taux DC], A.[Prix Unitaire Facture]*B.[Taux DC], A.[Poids Brut]*B.[Taux DC], A.[Poids Net]*B.[Taux DC], A.[Volume]*B.[Taux DC]
            FROM [dbo].[TColisageDossiers] A
            INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
            INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
            WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))
            -- DC=x% (TR case)
            UNION ALL
            SELECT A.[ID Colisage Dossier], N'TR', A.[Qte Colis]*(1-B.[Taux DC]), A.[Prix Unitaire Facture]*(1-B.[Taux DC]), A.[Poids Brut]*(1-B.[Taux DC]), A.[Poids Net]*(1-B.[Taux DC]), A.[Volume]*(1-B.[Taux DC])
            FROM [dbo].[TColisageDossiers] A
            INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
            INNER JOIN @TAUX_DEVISES C ON A.Devise=C.ID_Devise
            WHERE ([Dossier]=@Id_Dossier) AND (B.[Taux DC] NOT IN (0,1))
            
            -- Update folder status
            UPDATE dbo.TDossiers SET [Statut Dossier]=-1 WHERE [ID Dossier]=@Id_Dossier
            
            -- Create closing stage
            INSERT INTO dbo.TEtapesDossiers ([Dossier], [Etape Dossier], [Date Debut], [Date Fin])
            VALUES (@Id_Dossier, 1, GETDATE(), GETDATE())
            
            -- Recalculate latest stage
            EXEC [dbo].[pSP_RecalculeDerniereEtapeDossier] @Id_Dossier
            
        COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            SET @Message=ERROR_MESSAGE()
            RAISERROR (@Message, 16, 1) WITH LOG;
            RETURN
        END CATCH;
    END
    
    -- pSP_SupprimerNoteDetail
    CREATE PROCEDURE [dbo].[pSP_SupprimerNoteDetail]
        @Id_Dossier int=0
    AS
    BEGIN
        SET NOCOUNT ON;
        DECLARE @Values nvarchar(max), @Message nvarchar(max)
        
        -- Verify folder is in completed state
        IF NOT EXISTS(SELECT TOP 1 [ID Dossier] FROM TDossiers WHERE ([ID Dossier]=@Id_Dossier) AND ([Statut Dossier]=-1))
        BEGIN
            SET @Message='FILE WAS NOT COMPLETED'
            RAISERROR (@Message, 16, 1) WITH LOG;
            RETURN
        END
        
        BEGIN TRY
        BEGIN TRANSACTION;
            
            -- Delete declaration notes
            DELETE A
            FROM [dbo].[TNotesDetail] A 
            INNER JOIN [dbo].[TColisageDossiers] B ON A.[Colisage Dossier]=B.[ID Colisage Dossier]
            WHERE B.Dossier=@Id_Dossier
            
            -- Delete closing stage
            DELETE dbo.TEtapesDossiers WHERE ([Dossier]=@Id_Dossier) AND ([Etape Dossier]=1)
            
            -- Recalculate latest stage
            EXEC [dbo].[pSP_RecalculeDerniereEtapeDossier] @Id_Dossier
            
        COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            SET @Message=ERROR_MESSAGE()
            RAISERROR (@Message, 16, 1) WITH LOG;
            RETURN
        END CATCH;
    END
    
    PRINT 'Stored procedures created successfully'
END TRY
BEGIN CATCH
    PRINT 'ERROR creating stored procedures: ' + ERROR_MESSAGE()
    THROW
END CATCH

PRINT 'Phase 8 completed: All stored procedures created'
PRINT ''

-- ============================================================================
-- COMPLETION
-- ============================================================================

PRINT '=========================================='
PRINT 'DATABASE RESET AND CREATION COMPLETED'
PRINT '=========================================='
PRINT 'All tables, views, indexes, constraints, functions, and procedures have been created successfully.'
PRINT 'Database is ready for seed data population.'
PRINT ''
