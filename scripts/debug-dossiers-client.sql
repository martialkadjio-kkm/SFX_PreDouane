-- Vérifier la structure de VDossiers
SELECT TOP 5 
    ID_Dossier,
    No_Dossier,
    ID_Client,
    Nom_Client,
    Libelle_Type_Dossier,
    Libelle_Statut_Dossier,
    Statut_Dossier,
    Date_Creation
FROM VDossiers
ORDER BY Date_Creation DESC;

-- Vérifier s'il y a des dossiers pour un client spécifique (exemple ID 1)
SELECT COUNT(*) as Total_Dossiers
FROM VDossiers
WHERE ID_Client = 1;

-- Voir tous les clients qui ont des dossiers
SELECT DISTINCT ID_Client, Nom_Client, COUNT(*) as Nb_Dossiers
FROM VDossiers
GROUP BY ID_Client, Nom_Client
ORDER BY Nb_Dossiers DESC;