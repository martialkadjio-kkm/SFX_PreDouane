-- Script pour activer toutes les devises dans TDevises
-- Active toutes les devises en mettant [Devise Inactive] = 0

UPDATE [dbo].[TDevises]
SET [Devise Inactive] = 0
WHERE [Devise Inactive] = 1;

-- Afficher le résultat
SELECT 
    [ID Devise],
    [Code Devise],
    [Libelle Devise],
    [Devise Inactive]
FROM [dbo].[TDevises]
ORDER BY [Code Devise];
