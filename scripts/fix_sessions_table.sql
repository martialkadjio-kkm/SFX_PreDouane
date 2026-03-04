-- Script pour corriger la table TSessions
-- Le champ [Fin Session] doit être nullable

USE [SFX_PreDouane];
GO

-- Modifier la colonne pour accepter NULL
ALTER TABLE [dbo].[TSessions]
ALTER COLUMN [Fin Session] [datetime2](7) NULL;
GO

PRINT 'Table TSessions corrigée: [Fin Session] est maintenant nullable';
GO
