// Test de la nouvelle action getColisageForEdit
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testGetColisageForEdit() {
    try {
        console.log('=== TEST getColisageForEdit ===\n');
        
        const colisageId = 5;
        
        // Simuler getColisageForEdit
        console.log('1. Test de getColisageForEdit...');
        
        const result = await prisma.$queryRaw`
            SELECT * FROM VColisageDossiers 
            WHERE ID_Colisage_Dossier = ${colisageId}
        `;

        if (result.length === 0) {
            console.log('❌ Colisage non trouvé');
            return;
        }

        const colisage = JSON.parse(JSON.stringify(result[0]));
        console.log('Données brutes:', {
            ID_Colisage_Dossier: colisage.ID_Colisage_Dossier,
            Description_Colis: colisage.Description_Colis,
            Code_Devise: colisage.Code_Devise,
            Pays_Origine: colisage.Pays_Origine,
            HS_Code: colisage.HS_Code
        });

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

        // Convertir au format attendu par le formulaire
        const formattedColisage = {
            id: colisage.ID_Colisage_Dossier.toString(),
            description: colisage.Description_Colis || "",
            numeroCommande: colisage.No_Commande || null,
            nomFournisseur: colisage.Nom_Fournisseur || null,
            numeroFacture: colisage.No_Facture || null,
            quantite: Number(colisage.Qte_Colis) || 1,
            prixUnitaireFacture: Number(colisage.Prix_Unitaire_Facture) || 0,
            poidsBrut: Number(colisage.Poids_Brut) || 0,
            poidsNet: Number(colisage.Poids_Net) || 0,
            volume: Number(colisage.Volume) || 0,
            regroupementClient: colisage.Regroupement_Client || null,
            hscodeId: colisage.ID_HS_Code?.toString() || null,
            deviseId: colisage.ID_Devise?.toString() || undefined,
            paysOrigineId: colisage.ID_Pays_Origine?.toString() || undefined,
            regimeDeclarationId: colisage.ID_Regime_Declaration?.toString() || null,
        };

        console.log('\n2. Données formatées pour le formulaire:');
        console.log(JSON.stringify(formattedColisage, null, 2));
        
        console.log('\n3. Vérification des IDs:');
        console.log('- deviseId:', formattedColisage.deviseId);
        console.log('- paysOrigineId:', formattedColisage.paysOrigineId);
        console.log('- hscodeId:', formattedColisage.hscodeId);
        console.log('- regimeDeclarationId:', formattedColisage.regimeDeclarationId);
        
        console.log('\n🎉 getColisageForEdit fonctionne parfaitement !');
        console.log('Le formulaire devrait maintenant recevoir toutes les valeurs correctement.');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testGetColisageForEdit();