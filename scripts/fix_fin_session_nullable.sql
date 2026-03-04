-- Script pour rendre la colonne [Fin Session] nullable dans TSessions
-- Cette colonne doit être NULL pour les sessions actives

USE SFX_PreDouane;
GO

-- Modifier la colonne pour accepter NULL
ALTER TABLE [dbo].[TSessions]
ALTER COLUMN [Fin Session] [datetime2](7) NULL;
GO

PRINT 'Colonne [Fin Session] modifiée avec succès - elle accepte maintenant NULL';
GO
