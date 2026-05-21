USE [SFX_PreDouane]
GO

/****** Object:  View [dbo].[VNotesDetailGroup]    Script Date: 4/17/2026 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Créer la nouvelle vue avec regroupement par Site, Régime, Pays, HS Code, Devise
-- La vue VNotesDetail reste intacte
CREATE OR ALTER VIEW [dbo].[VNotesDetailGroup]
AS
SELECT 
    B.[ID_Dossier],
    B.[Regroupement_Client], -- Site
    A.[Regime] AS [Regime],
    B.[Pays_Origine],
    B.[HS_Code],
    B.[Code_Devise_Note_Detail],
    
    -- Agrégations
    SUM(A.[Nbre Paquetage]) AS [Nbre_Paquetage],
    SUM(A.[Qte Colis]) AS [Qte_Colis],
    SUM(A.[Valeur]) AS [Valeur],
    SUM(A.[Base Poids Brut]) AS [Base_Poids_Brut],
    SUM(A.[Base Poids Net]) AS [Base_Poids_Net],
    SUM(A.[Base Volume]) AS [Base_Volume]
    
FROM [dbo].[TNotesDetail] A 
INNER JOIN [dbo].[VColisageDossiers] B ON A.[Colisage Dossier] = B.ID_Colisage_Dossier

GROUP BY 
    B.[ID_Dossier],
    B.[Regroupement_Client],  -- Site (regroupement principal)
    A.[Regime],               -- Régime (DC ou TR)
    B.[Pays_Origine],         -- Pays d'origine
    B.[HS_Code],              -- Code HS
    B.[Code_Devise_Note_Detail] -- Devise

GO

-- Vérification
SELECT 
    'VNotesDetail (ancienne vue)' AS [Vue],
    COUNT(*) AS [Nombre_Lignes]
FROM [dbo].[VNotesDetail]

UNION ALL

SELECT 
    'VNotesDetailGroup (nouvelle vue)' AS [Vue],
    COUNT(*) AS [Nombre_Lignes]
FROM [dbo].[VNotesDetailGroup]

GO

-- Exemple de comparaison pour un dossier
PRINT 'Exemple de comparaison des deux vues:'
PRINT '======================================'

SELECT TOP 5
    'VNotesDetail' AS [Source],
    [Regroupement_Client] AS [Site],
    [Regime],
    [Pays_Origine],
    [HS_Code],
    [Nbre_Paquetage],
    [Qte_Colis],
    [Valeur]
FROM [dbo].[VNotesDetail]
ORDER BY [Regroupement_Client], [Regime], [Pays_Origine], [HS_Code]

UNION ALL

SELECT TOP 5
    'VNotesDetailGroup' AS [Source],
    [Regroupement_Client] AS [Site],
    [Regime],
    [Pays_Origine],
    [HS_Code],
    [Nbre_Paquetage],
    [Qte_Colis],
    [Valeur]
FROM [dbo].[VNotesDetailGroup]
ORDER BY [Regroupement_Client], [Regime], [Pays_Origine], [HS_Code]

GO
