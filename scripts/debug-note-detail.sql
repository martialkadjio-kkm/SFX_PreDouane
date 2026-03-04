-- DIAGNOSTIC COMPLET GÉNÉRATION NOTE DE DÉTAIL - DOSSIER 6
-- ============================================================

PRINT '🔍 DIAGNOSTIC GÉNÉRATION NOTE DE DÉTAIL - DOSSIER 6'
PRINT '============================================================'

DECLARE @Id_Dossier INT = 6
DECLARE @DateDeclaration DATETIME = '2025-12-14 00:00:00.000'

-- 1. VÉRIFICATION DU DOSSIER
PRINT ''
PRINT '📁 1. VÉRIFICATION DU DOSSIER'
PRINT '----------------------------------------'

SELECT 
    d.ID as DossierId,
    d.[Numero Dossier] as NumeroDossier,
    c.[Nom Client] as NomClient,
    s.Libelle as StatutDossier,
    e.[Libelle Etape] as EtapeDossier,
    d.Statut as StatutId,
    d.Etape as EtapeId
FROM TDossiers d
LEFT JOIN TClients c ON d.Client = c.ID
LEFT JOIN TStatutsDossiers s ON d.Statut = s.ID
LEFT JOIN TEtapes e ON d.Etape = e.[ID Etape]
WHERE d.ID = @Id_Dossier

-- 2. VÉRIFICATION DES COLISAGES
PRINT ''
PRINT '📦 2. VÉRIFICATION DES COLISAGES'
PRINT '----------------------------------------'

SELECT 
    COUNT(*) as NombreColisages,
    SUM(cd.[Qte Colisage] * cd.[Prix Unitaire Facture]) as ValeurTotale,
    COUNT(DISTINCT cd.Devise) as NombreDevises
FROM TColisageDossiers cd
WHERE cd.Dossier = @Id_Dossier

-- Détail des colisages
SELECT TOP 5
    cd.ID,
    cd.[Description Colis],
    cd.[Qte Colisage],
    cd.[Prix Unitaire Facture],
    cd.[Qte Colisage] * cd.[Prix Unitaire Facture] as Valeur,
    dev.[Code Devise],
    p.[Code Pays],
    rd.[Libelle Regime Declaration]
FROM TColisageDossiers cd
LEFT JOIN TDevises dev ON cd.Devise = dev.ID
LEFT JOIN TPays p ON cd.[Pays Origine] = p.ID
LEFT JOIN TRegimesDeclarations rd ON cd.[Regime Declaration] = rd.[ID Regime Declaration]
WHERE cd.Dossier = @Id_Dossier
ORDER BY cd.ID

-- 3. VÉRIFICATION DES TAUX DE CHANGE
PRINT ''
PRINT '💱 3. VÉRIFICATION DES TAUX DE CHANGE'
PRINT '----------------------------------------'

-- Devises utilisées dans les colisages
SELECT DISTINCT 
    dev.[Code Devise] as DeviseUtilisee
FROM TColisageDossiers cd
INNER JOIN TDevises dev ON cd.Devise = dev.ID
WHERE cd.Dossier = @Id_Dossier

-- Taux de change disponibles pour ces devises
SELECT 
    dev.[Code Devise],
    tc.[Taux Change],
    tc.[Date Application],
    CASE 
        WHEN tc.[Date Application] <= @DateDeclaration THEN 'Valide'
        ELSE 'Trop récent'
    END as Statut
FROM TColisageDossiers cd
INNER JOIN TDevises dev ON cd.Devise = dev.ID
LEFT JOIN TTauxChange tc ON dev.ID = tc.Devise
WHERE cd.Dossier = @Id_Dossier
  AND tc.[Date Application] <= @DateDeclaration
ORDER BY dev.[Code Devise], tc.[Date Application] DESC

-- Devises sans taux de change
SELECT DISTINCT 
    dev.[Code Devise] as DeviseSansTaux
FROM TColisageDossiers cd
INNER JOIN TDevises dev ON cd.Devise = dev.ID
LEFT JOIN TTauxChange tc ON dev.ID = tc.Devise AND tc.[Date Application] <= @DateDeclaration
WHERE cd.Dossier = @Id_Dossier
  AND tc.ID IS NULL

-- 4. VÉRIFICATION DES NOTES DE DÉTAIL EXISTANTES
PRINT ''
PRINT '📋 4. NOTES DE DÉTAIL EXISTANTES'
PRINT '----------------------------------------'

SELECT 
    nd.ID,
    nd.[Date Creation],
    nd.Session,
    COUNT(ndd.ID) as NombreLignes
FROM TNotesDetail nd
LEFT JOIN TNotesDetailDossiers ndd ON nd.ID = ndd.[Note Detail]
WHERE nd.Dossier = @Id_Dossier
GROUP BY nd.ID, nd.[Date Creation], nd.Session
ORDER BY nd.[Date Creation] DESC

-- 5. TEST DE LA PROCÉDURE STOCKÉE
PRINT ''
PRINT '⚙️ 5. EXÉCUTION DE LA PROCÉDURE STOCKÉE'
PRINT '----------------------------------------'

-- Compter les notes avant
DECLARE @NotesAvant INT
SELECT @NotesAvant = COUNT(*) FROM TNotesDetail WHERE Dossier = @Id_Dossier

PRINT 'Notes avant exécution: ' + CAST(@NotesAvant AS VARCHAR(10))

-- Exécuter la procédure
BEGIN TRY
    EXEC [dbo].[pSP_CreerNoteDetail] 
        @Id_Dossier = @Id_Dossier, 
        @DateDeclaration = @DateDeclaration
    
    PRINT 'Procédure exécutée avec succès'
END TRY
BEGIN CATCH
    PRINT 'Erreur lors de l''exécution:'
    PRINT ERROR_MESSAGE()
END CATCH

-- Compter les notes après
DECLARE @NotesApres INT
SELECT @NotesApres = COUNT(*) FROM TNotesDetail WHERE Dossier = @Id_Dossier

PRINT 'Notes après exécution: ' + CAST(@NotesApres AS VARCHAR(10))
PRINT 'Nouvelles notes créées: ' + CAST(@NotesApres - @NotesAvant AS VARCHAR(10))

-- 6. VÉRIFICATION DU STATUT FINAL
PRINT ''
PRINT '📊 6. STATUT FINAL DU DOSSIER'
PRINT '----------------------------------------'

SELECT 
    d.ID as DossierId,
    s.Libelle as StatutDossier,
    e.[Libelle Etape] as EtapeDossier,
    d.Statut as StatutId,
    d.Etape as EtapeId
FROM TDossiers d
LEFT JOIN TStatutsDossiers s ON d.Statut = s.ID
LEFT JOIN TEtapes e ON d.Etape = e.[ID Etape]
WHERE d.ID = @Id_Dossier

-- 7. DIAGNOSTIC DES CONTRAINTES
PRINT ''
PRINT '🔍 7. DIAGNOSTIC DES CONTRAINTES'
PRINT '----------------------------------------'

-- Contrainte 1: Colisages présents
IF NOT EXISTS (SELECT 1 FROM TColisageDossiers WHERE Dossier = @Id_Dossier)
    PRINT '❌ Aucun colisage dans le dossier'
ELSE
    PRINT '✅ Colisages présents'

-- Contrainte 2: Colisages avec devise
DECLARE @ColisagesSansDevise INT
SELECT @ColisagesSansDevise = COUNT(*) 
FROM TColisageDossiers 
WHERE Dossier = @Id_Dossier AND (Devise IS NULL OR Devise = 0)

IF @ColisagesSansDevise > 0
    PRINT '❌ ' + CAST(@ColisagesSansDevise AS VARCHAR(10)) + ' colisage(s) sans devise'
ELSE
    PRINT '✅ Tous les colisages ont une devise'

-- Contrainte 3: Taux de change disponibles
DECLARE @DevisesSansTaux INT
SELECT @DevisesSansTaux = COUNT(DISTINCT cd.Devise)
FROM TColisageDossiers cd
INNER JOIN TDevises dev ON cd.Devise = dev.ID
LEFT JOIN TTauxChange tc ON dev.ID = tc.Devise AND tc.[Date Application] <= @DateDeclaration
WHERE cd.Dossier = @Id_Dossier AND tc.ID IS NULL

IF @DevisesSansTaux > 0
    PRINT '❌ ' + CAST(@DevisesSansTaux AS VARCHAR(10)) + ' devise(s) sans taux de change'
ELSE
    PRINT '✅ Tous les taux de change sont disponibles'

-- Contrainte 4: Valeur totale > 0
DECLARE @ValeurTotale DECIMAL(18,2)
SELECT @ValeurTotale = SUM([Qte Colisage] * [Prix Unitaire Facture])
FROM TColisageDossiers 
WHERE Dossier = @Id_Dossier

IF @ValeurTotale <= 0
    PRINT '❌ Valeur totale = 0'
ELSE
    PRINT '✅ Valeur totale: ' + CAST(@ValeurTotale AS VARCHAR(20))

-- 8. AFFICHAGE DES TABLES FINALES
PRINT ''
PRINT '📋 8. ÉTAT FINAL DES TABLES'
PRINT '----------------------------------------'

PRINT 'TNotesDetail:'
SELECT * FROM TNotesDetail WHERE Dossier = @Id_Dossier

PRINT ''
PRINT 'TTauxChange (derniers taux):'
SELECT TOP 10 
    dev.[Code Devise],
    tc.[Taux Change],
    tc.[Date Application]
FROM TTauxChange tc
INNER JOIN TDevises dev ON tc.Devise = dev.ID
WHERE tc.[Date Application] <= @DateDeclaration
ORDER BY tc.[Date Application] DESC, dev.[Code Devise]

PRINT ''
PRINT '🏁 FIN DU DIAGNOSTIC'
PRINT '============================================================'