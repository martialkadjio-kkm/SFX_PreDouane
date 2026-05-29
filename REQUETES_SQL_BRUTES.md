REQUÊTES SQL - SFX PreDouane

1. SELECT

1.1 Dossiers - Tous avec filtres
Fichier: src/modules/dossiers/server/actions.ts
SELECT * FROM VDossiers
WHERE (No_Dossier LIKE '%search%' OR No_OT LIKE '%search%' OR Nom_Client LIKE '%search%')
  AND ID_Statut_Dossier = ${statutId}
  AND ID_Etape_Actuelle = ${etapeId}
ORDER BY ID_Dossier DESC

1.2 Dossiers - Par ID
Fichier: src/modules/dossiers/server/actions.ts
SELECT * FROM VDossiers
WHERE ID_Dossier = ${id}

1.3 Dossiers - Par client
Fichier: src/modules/dossiers/server/actions.ts
SELECT * FROM VDossiers
WHERE ID_Client = ${clientId}
ORDER BY Date_Creation DESC

1.4 Dossiers - Étapes distinctes
Fichier: src/modules/dossiers/server/actions.ts
SELECT DISTINCT ID_Etape_Actuelle, Libelle_Etape_Actuelle
FROM VDossiers
ORDER BY Libelle_Etape_Actuelle ASC

1.5 Notes - Devises du colisage avec poids
Fichier: src/modules/dossiers/server/note-detail-actions.ts
SELECT 
    d.[ID Devise] as id,
    d.[Code Devise] as code,
    d.[Libelle Devise] as libelle,
    COUNT(cd.[ID Colisage Dossier]) as nbColisages,
    SUM(cd.[Qte Colis] * cd.[Prix Unitaire Colis]) as valeurTotale
FROM TColisageDossiers cd
INNER JOIN TDevises d ON cd.[Devise] = d.[ID Devise]
WHERE cd.[Dossier] = ${dossierId}
GROUP BY d.[ID Devise], d.[Code Devise], d.[Libelle Devise]
ORDER BY valeurTotale DESC

1.6 Notes - Vérifier conversion
Fichier: src/modules/dossiers/server/note-detail-actions.ts
SELECT [ID Convertion]
FROM TConvertions
WHERE CAST([Date Convertion] AS DATE) = CAST(${dateStr} AS DATE)
    AND [Entite] = ${entiteId}

1.7 Notes - Notes de détail
Fichier: src/modules/dossiers/server/note-detail-actions.ts
SELECT * FROM VNotesDetail
WHERE ID_Dossier = ${dossierId}
ORDER BY Regroupement_Client, Regime

1.8 Notes - Notes de détail groupées
Fichier: src/modules/dossiers/server/note-detail-actions.ts
SELECT * FROM VNotesDetailGroup
WHERE ID_Dossier = ${dossierId}
ORDER BY Regroupement_Client, Regime, Pays_Origine, HS_Code

1.9 Notes - Date et devise conversion
Fichier: src/modules/dossiers/server/note-detail-actions.ts
SELECT c.[Date Convertion] as dateConvertion,
       d.[Devise Note Detail] as deviseNoteDetail
FROM TDossiers d
INNER JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
WHERE d.[ID Dossier] = ${dossierId}

1.10 Notes - Devise note de détail
Fichier: src/modules/dossiers/server/note-detail-actions.ts
SELECT d.[Devise Note Detail] as deviseNoteDetail, 
       dev.[Code Devise] as codeDevise
FROM TDossiers d
LEFT JOIN TDevises dev ON d.[Devise Note Detail] = dev.[ID Devise]
WHERE d.[ID Dossier] = ${dossierId}

1.11 Conversion - Toutes
Fichier: src/modules/conversion/server/actions.ts
SELECT * FROM VConvertions
ORDER BY Date_Convertion DESC

1.12 Conversion - Par ID
Fichier: src/modules/conversion/server/actions.ts
SELECT * FROM VConvertions
WHERE ID_Convertion = ${conversionId}

1.13 Taux - Par conversion
Fichier: src/modules/conversion/server/taux-change-actions.ts
SELECT 
    tc.[ID Taux Change] as ID_Taux_Change,
    tc.[Convertion] as ID_Convertion,
    tc.[Devise] as ID_Devise,
    d.[Code Devise] as Code_Devise,
    d.[Libelle Devise] as Libelle_Devise,
    tc.[Taux Change] as Taux_Change,
    c.[Date Convertion] as Date_Convertion
FROM TTauxChange tc
INNER JOIN TDevises d ON tc.[Devise] = d.[ID Devise]
INNER JOIN TConvertions c ON tc.[Convertion] = c.[ID Convertion]
WHERE tc.[Convertion] = ${conversionId}
ORDER BY d.[Code Devise] ASC

1.14 Taux - Vérifier devise
Fichier: src/modules/conversion/server/taux-change-actions.ts
SELECT [Devise] 
FROM TTauxChange 
WHERE [ID Taux Change] = ${tauxId}

1.15 Clients - Par ID
Fichier: src/modules/clients/server/actions.ts
SELECT * FROM VClients
WHERE ID_Client = ${id}

1.16 Clients - Tous avec recherche
Fichier: src/modules/clients/server/actions.ts
SELECT * FROM VClients
WHERE Nom_Client LIKE '%${search}%'
ORDER BY Nom_Client ASC

1.17 Colisage - Par ID
Fichier: src/modules/colisage/server/actions.ts
SELECT * FROM VColisageDossiers
WHERE ID_Colisage_Dossier = ${id}

1.18 Colisage - Tous avec recherche
Fichier: src/modules/colisage/server/actions.ts
SELECT DISTINCT * FROM VColisageDossiers
WHERE Description_Colis LIKE '%${search}%' 
   OR No_Commande LIKE '%${search}%' 
   OR Nom_Fournisseur LIKE '%${search}%'
ORDER BY Date_Creation DESC

1.19 Colisage - Par dossier
Fichier: src/modules/colisage/server/actions.ts
SELECT * FROM VColisageDossiers
WHERE ID_Dossier = ${dossierId}
ORDER BY Date_Creation ASC

1.20 Colisage - Statistiques
Fichier: src/modules/colisage/server/actions.ts
SELECT * FROM VColisageDossiers 
WHERE ID_Dossier = ${dossierId}

1.21 Sélecteurs - Dossiers
Fichier: src/modules/colisage/server/actions.ts
SELECT ID_Dossier as id, No_Dossier as noDossier, No_OT as noOT
FROM VDossiers
WHERE ID_Dossier > 0
ORDER BY Date_Creation DESC

1.22 Sélecteurs - HS Codes
Fichier: src/modules/colisage/server/actions.ts
SELECT ID_HS_Code as id, HS_Code as code, Libelle_HS_Code as libelle
FROM VHSCodes
WHERE ID_HS_Code > 0
ORDER BY HS_Code ASC

1.23 Sélecteurs - Devises
Fichier: src/modules/colisage/server/actions.ts
SELECT ID_Devise as id, Code_Devise as code, Libelle_Devise as libelle
FROM VDevises
WHERE ID_Devise > 0
ORDER BY Code_Devise ASC

1.24 Sélecteurs - Pays
Fichier: src/modules/colisage/server/actions.ts
SELECT ID_Pays as id, Code_Pays as code, Libelle_Pays as libelle
FROM VPays
WHERE ID_Pays > 0
ORDER BY Libelle_Pays ASC

1.25 Devises - Par ID
Fichier: src/modules/devises/server/actions.ts
SELECT * FROM VDevises
WHERE ID_Devise = ${id}

1.26 Pays - Par ID
Fichier: src/modules/pays/server/actions.ts
SELECT * FROM VPays
WHERE ID_Pays = ${id}

1.27 HS Codes - Par ID
Fichier: src/modules/hscode/server/actions.ts
SELECT * FROM VHSCodes
WHERE ID_HS_Code = ${id}

1.28 Régimes - Déclaration par ID
Fichier: src/modules/regime-declaration/server/actions.ts
SELECT * FROM VRegimesDeclarations
WHERE ID_Regime_Declaration = ${id}

1.29 Régimes - Douanier par ID
Fichier: src/modules/regime-douanier/server/actions.ts
SELECT * FROM VRegimesDouaniers
WHERE ID_Regime_Douanier = ${id}

1.30 Étapes - Par ID
Fichier: src/modules/etape/server/actions.ts
SELECT * FROM VCodesEtapes
WHERE ID_Code_Etape = ${id}

1.31 Sens Trafic - Par ID
Fichier: src/modules/sense-trafic/server/actions.ts
SELECT * FROM VSensTrafic
WHERE ID_Sens_Trafic = ${id}

---

2. INSERT

2.1 Taux - Créer
Fichier: src/modules/conversion/server/taux-change-actions.ts
INSERT INTO TTauxChange (
    [Convertion], [Devise], [Taux Change], [Session], [Date Creation]
)
VALUES (
    ${conversionId}, ${deviseId}, ${tauxChange}, ${sessionId}, ${dateCreation}
)

2.2 Colisage - Import
Fichier: src/modules/dossiers/server/import-colisage-actions.ts
INSERT INTO TColisageDossiers (
    [Dossier], [HS Code], [Description Colis], [No Commande],
    [Nom Fournisseur], [No Facture], [Item No], [Devise],
    [Qte Colis], [Prix Unitaire Colis], [Poids Brut], [Poids Net],
    [Volume], [Pays Origine], [Regime Declaration], [Regroupement Client],
    [Upload Key], [Session], [Date Creation]
)
VALUES (
    ${dossierId}, ${hsCodeId}, ${description}, ${numeroCommande},
    ${nomFournisseur}, ${numeroFacture}, ${itemNo}, ${deviseId},
    ${quantite}, ${prixUnitaire}, ${poidsBrut}, ${poidsNet},
    ${volume}, ${paysId}, ${regimeId}, ${regroupement},
    ${rowKey}, ${sessionId}, ${dateCreation}
)

---

3. UPDATE

3.1 Dossiers - Pesée
Fichier: src/modules/dossiers/server/actions.ts
UPDATE TDossiers
SET [Nbre Paquetage Pesee] = ${nbrePaquetage},
    [Poids Brut Pesee] = ${poidsBrut},
    [Poids Net Pesee] = ${poidsNet},
    [Volume Pesee] = ${volume}
WHERE [ID Dossier] = ${id}

---

4. DELETE

4.1 Conversion - Supprimer
Fichier: src/modules/conversion/server/actions.ts
DELETE FROM TConvertions
WHERE [ID Convertion] = ${conversionId}

4.2 Taux - Supprimer
Fichier: src/modules/conversion/server/taux-change-actions.ts
DELETE FROM TTauxChange
WHERE [ID Taux Change] = ${tauxId}

4.3 Colisage - Supprimer plusieurs
Fichier: src/modules/colisage/server/actions.ts
DELETE FROM TColisageDossiers
WHERE [ID Colisage Dossier] IN (${ids})

4.4 Colisage - Supprimer par dossier
Fichier: src/modules/colisage/server/actions.ts
DELETE FROM TColisageDossiers
WHERE [Dossier] = ${dossierId}

---

5. EXEC

5.1 pSP_CreerNoteDetail
Fichier: src/modules/dossiers/server/note-detail-actions.ts
EXEC [dbo].[pSP_CreerNoteDetail] 
    @Id_Dossier = ${dossierId}, 
    @DateDeclaration = '${dateStr}', 
    @Id_DeviseNoteDetail = ${deviseId}

5.2 pSP_SupprimerNoteDetail
Fichier: src/modules/dossiers/server/note-detail-actions.ts
EXEC [dbo].[pSP_SupprimerNoteDetail] 
    @Id_Dossier = ${dossierId}

5.3 pSP_AnnulerDossier
Fichier: src/modules/dossiers/server/actions.ts
EXEC pSP_AnnulerDossier 
    @Id_Dossier = ${id}

5.4 pSP_AjouterConvertion
Fichier: src/modules/conversion/server/actions.ts
EXEC [dbo].[pSP_AjouterConvertion] 
    @DateConvertion = '${dateStr}', 
    @ID_Session = ${sessionId}, 
    @ID_Entite = 0

---

6. FONCTIONS

6.1 fx_EvalTauxChangeDossier
Fichier: src/modules/dossiers/server/note-detail-actions.ts
SELECT [ID_Devise], [Code_Devise], [Taux_Change] 
FROM [dbo].[fx_EvalTauxChangeDossier](${dossierId}, ${deviseId}, '${dateStr}')

6.2 fx_IDs_Devises
Fichier: src/modules/colisage/server/import-actions.ts
SELECT * FROM dbo.fx_IDs_Devises('["EUR","USD","XOF"]')

6.3 fx_IDs_Pays
Fichier: src/modules/colisage/server/import-actions.ts
SELECT * FROM dbo.fx_IDs_Pays('["FR","US","SN"]')

6.4 fx_IDs_HSCode
Fichier: src/modules/colisage/server/import-actions.ts
SELECT * FROM dbo.fx_IDs_HSCode('["8471.30","8471.60"]')

6.5 fx_IDs_RegimesDeclarations
Fichier: src/modules/colisage/server/import-actions.ts
SELECT * FROM dbo.fx_IDs_RegimesDeclarations(${clientId}, '["EXO","100% DC"]', ${regimeDouanierId})
