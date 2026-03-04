-- Vérifier le dossier 0002
SELECT 
    ID_Dossier,
    No_Dossier,
    ID_Etape_Actuelle,
    Libelle_Etape_Actuelle
FROM VDossiers 
WHERE No_Dossier = '0002';

-- Vérifier toutes les étapes disponibles dans vEtapesDossiers
SELECT DISTINCT 
    ID_Etape,
    Libelle_Etape
FROM VEtapesDossiers
ORDER BY Libelle_Etape;

-- Vérifier toutes les étapes actuelles des dossiers
SELECT DISTINCT 
    ID_Etape_Actuelle,
    Libelle_Etape_Actuelle
FROM VDossiers
ORDER BY Libelle_Etape_Actuelle;