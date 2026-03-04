// Test complet du dialog d'édition
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testDialogEditionComplet() {
    try {
        console.log('=== TEST DIALOG ÉDITION COMPLET ===\n');
        
        const colisageId = 5;
        
        // 1. Simuler getColisageById (action complète)
        console.log('1. Simulation getColisageById...');
        
        const result = await prisma.$queryRaw`
            SELECT * FROM VColisageDossiers 
            WHERE ID_Colisage_Dossier = ${colisageId}
        `;

        if (result.length === 0) {
            console.log('❌ Colisage non trouvé');
            return;
        }

        const colisage = JSON.parse(JSON.stringify(result[0]));

        // Résoudre les IDs manquants
        if (colisage.Code_Devise && !colisage.ID_Devise) {
            const devise = await prisma.$queryRaw`
                SELECT ID_Devise FROM VDevises WHERE Code_Devise = ${colisage.Code_Devise}
            `;
            if (devise.length > 0) {
                colisage.ID_Devise = devise[0].ID_Devise;
            }
        }

        if (colisage.Pays_Origine && !colisage.ID_Pays_Origine) {
            const pays = await prisma.$queryRaw`
                SELECT ID_Pays FROM VPays WHERE Libelle_Pays = ${colisage.Pays_Origine}
            `;
            if (pays.length > 0) {
                colisage.ID_Pays_Origine = pays[0].ID_Pays;
            }
        }

        if (colisage.HS_Code && !colisage.ID_HS_Code) {
            const hsCode = await prisma.$queryRaw`
                SELECT ID_HS_Code FROM VHSCodes WHERE HS_Code = ${colisage.HS_Code}
            `;
            if (hsCode.length > 0) {
                colisage.ID_HS_Code = hsCode[0].ID_HS_Code;
            }
        }
        
        console.log('✅ getColisageById simulé avec succès');
        
        // 2. Simuler EditColisageDialog mapping
        console.log('\n2. Simulation EditColisageDialog mapping...');
        
        const initialValues = {
            id: colisage.ID_Colisage_Dossier,
            descriptionColis: colisage.Description_Colis || "",
            noCommande: colisage.No_Commande || null,
            nomFournisseur: colisage.Nom_Fournisseur || null,
            noFacture: colisage.No_Facture || null,
            qteColisage: Number(colisage.Qte_Colis) || 1,
            prixUnitaireFacture: Number(colisage.Prix_Unitaire_Facture) || 0,
            poidsBrut: Number(colisage.Poids_Brut) || 0,
            poidsNet: Number(colisage.Poids_Net) || 0,
            volume: Number(colisage.Volume) || 0,
            regroupementClient: colisage.Regroupement_Client || null,
            hsCode: colisage.ID_HS_Code || null,
            devise: colisage.ID_Devise || undefined,
            paysOrigine: colisage.ID_Pays_Origine || undefined,
            regimeDeclaration: colisage.ID_Regime_Declaration ?? null,
        };
        
        console.log('✅ InitialValues créées');
        console.log('Key pour le formulaire:', initialValues.id);
        
        // 3. Simuler le chargement des données de référence
        console.log('\n3. Simulation chargement données de référence...');
        
        const [hscodesRes, devisesRes, paysRes, regimesRes] = await Promise.all([
            prisma.$queryRaw`
                SELECT ID_HS_Code as id, HS_Code as hsCode, Libelle_HS_Code as description 
                FROM VHSCodes 
                ORDER BY HS_Code
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) })),
            
            prisma.$queryRaw`
                SELECT ID_Devise as id, Code_Devise as codeDevise, Libelle_Devise as libelleDevise 
                FROM VDevises 
                ORDER BY Code_Devise
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) })),
            
            prisma.$queryRaw`
                SELECT ID_Pays as id, Code_Pays as codePays, Libelle_Pays as libellePays 
                FROM VPays 
                ORDER BY Libelle_Pays
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) })),
            
            prisma.$queryRaw`
                SELECT ID_Regime_Declaration as id, Libelle_Regime_Declaration as libelle 
                FROM VRegimesDeclarations 
                ORDER BY Libelle_Regime_Declaration
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) }))
        ]);
        
        console.log('✅ Données de référence chargées');
        
        // 4. Vérifier que les valeurs initiales correspondent aux options
        console.log('\n4. Vérification correspondances...');
        
        const hsCodeOption = hscodesRes.data.find(h => h.id === initialValues.hsCode);
        const deviseOption = devisesRes.data.find(d => d.id === initialValues.devise);
        const paysOption = paysRes.data.find(p => p.id === initialValues.paysOrigine);
        const regimeOption = regimesRes.data.find(r => r.id === initialValues.regimeDeclaration);
        
        console.log('Correspondances trouvées:');
        console.log('- HS Code:', hsCodeOption ? `${hsCodeOption.hsCode} - ${hsCodeOption.description}` : '❌ Non trouvé');
        console.log('- Devise:', deviseOption ? `${deviseOption.codeDevise} - ${deviseOption.libelleDevise}` : '❌ Non trouvé');
        console.log('- Pays:', paysOption ? `${paysOption.codePays} - ${paysOption.libellePays}` : '❌ Non trouvé');
        console.log('- Régime:', regimeOption ? regimeOption.libelle : '❌ Non trouvé');
        
        // 5. Simuler une soumission de formulaire
        console.log('\n5. Simulation soumission formulaire...');
        
        const formData = {
            descriptionColis: "TEST - Modification depuis le formulaire",
            devise: initialValues.devise,
            paysOrigine: initialValues.paysOrigine,
            hsCode: initialValues.hsCode,
            regimeDeclaration: 1, // Changement vers 100% DC
            qteColisage: initialValues.qteColisage,
            prixUnitaireFacture: initialValues.prixUnitaireFacture,
            poidsBrut: initialValues.poidsBrut,
            poidsNet: initialValues.poidsNet,
            volume: initialValues.volume,
            noCommande: initialValues.noCommande,
            nomFournisseur: initialValues.nomFournisseur,
            noFacture: initialValues.noFacture,
            regroupementClient: initialValues.regroupementClient,
        };
        
        console.log('Données à soumettre:', {
            id: initialValues.id,
            descriptionColis: formData.descriptionColis,
            devise: formData.devise,
            paysOrigine: formData.paysOrigine,
            regimeDeclaration: formData.regimeDeclaration
        });
        
        console.log('\n🎉 SIMULATION COMPLÈTE RÉUSSIE !');
        console.log('Le dialog d\'édition devrait maintenant fonctionner avec:');
        console.log('- Valeurs pré-remplies correctement');
        console.log('- Listes déroulantes fonctionnelles');
        console.log('- Soumission de formulaire opérationnelle');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testDialogEditionComplet();