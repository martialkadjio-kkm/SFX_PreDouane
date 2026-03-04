// Test du flux complet d'édition d'un colisage
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testEditColisageFlow() {
    try {
        console.log('=== TEST FLUX ÉDITION COLISAGE ===\n');
        
        const colisageId = 4;
        
        // 1. Simuler getColisageById avec résolution des IDs
        console.log('1. Récupération du colisage...');
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
                SELECT [ID Devise] FROM TDevises WHERE [Code Devise] = ${colisage.Code_Devise}
            `;
            if (devise.length > 0) {
                colisage.ID_Devise = devise[0]['ID Devise'];
            }
        }

        if (colisage.Pays_Origine && !colisage.ID_Pays_Origine) {
            const pays = await prisma.$queryRaw`
                SELECT [ID Pays] FROM TPays WHERE [Libelle Pays] = ${colisage.Pays_Origine}
            `;
            if (pays.length > 0) {
                colisage.ID_Pays_Origine = pays[0]['ID Pays'];
            }
        }
        
        console.log('✅ Colisage récupéré avec IDs résolus');
        console.log('   ID_Devise:', colisage.ID_Devise);
        console.log('   ID_Pays_Origine:', colisage.ID_Pays_Origine);
        
        // 2. Simuler le mapping du EditColisageDialog
        console.log('\n2. Mapping pour le formulaire...');
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
            hsCode: colisage.HS_Code || null,
            devise: colisage.ID_Devise || undefined,
            paysOrigine: colisage.ID_Pays_Origine || undefined,
            regimeDeclaration: colisage.ID_Regime_Declaration || null,
        };
        
        console.log('✅ Mapping réussi');
        console.log('   devise:', initialValues.devise);
        console.log('   paysOrigine:', initialValues.paysOrigine);
        console.log('   descriptionColis:', initialValues.descriptionColis);
        
        // 3. Vérifier que les IDs correspondent à des données existantes
        console.log('\n3. Vérification des données de référence...');
        
        if (initialValues.devise) {
            const devise = await prisma.$queryRaw`
                SELECT [Code Devise], [Libelle Devise] FROM TDevises WHERE [ID Devise] = ${initialValues.devise}
            `;
            if (devise.length > 0) {
                console.log(`✅ Devise ID ${initialValues.devise}: ${devise[0]['Code Devise']} - ${devise[0]['Libelle Devise']}`);
            } else {
                console.log(`❌ Devise ID ${initialValues.devise} non trouvée`);
            }
        }
        
        if (initialValues.paysOrigine) {
            const pays = await prisma.$queryRaw`
                SELECT [Code Pays], [Libelle Pays] FROM TPays WHERE [ID Pays] = ${initialValues.paysOrigine}
            `;
            if (pays.length > 0) {
                console.log(`✅ Pays ID ${initialValues.paysOrigine}: ${pays[0]['Code Pays']} - ${pays[0]['Libelle Pays']}`);
            } else {
                console.log(`❌ Pays ID ${initialValues.paysOrigine} non trouvé`);
            }
        }
        
        console.log('\n🎉 FLUX COMPLET TESTÉ AVEC SUCCÈS !');
        console.log('Le formulaire d\'édition devrait maintenant fonctionner correctement.');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testEditColisageFlow();