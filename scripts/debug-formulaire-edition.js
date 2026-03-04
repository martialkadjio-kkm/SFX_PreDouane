// Debug du formulaire d'édition
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function debugFormulaireEdition() {
    try {
        console.log('=== DEBUG FORMULAIRE ÉDITION ===\n');
        
        const colisageId = 5; // Colisage USD
        
        // 1. Simuler getColisageById
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
        console.log('Colisage brut:', {
            ID_Colisage_Dossier: colisage.ID_Colisage_Dossier,
            Description_Colis: colisage.Description_Colis,
            Code_Devise: colisage.Code_Devise,
            Pays_Origine: colisage.Pays_Origine,
            HS_Code: colisage.HS_Code,
            ID_Regime_Declaration: colisage.ID_Regime_Declaration
        });
        
        // 2. Résolution des IDs
        console.log('\n2. Résolution des IDs...');
        
        // Devise
        if (colisage.Code_Devise && !colisage.ID_Devise) {
            const devise = await prisma.$queryRaw`
                SELECT ID_Devise FROM VDevises WHERE Code_Devise = ${colisage.Code_Devise}
            `;
            if (devise.length > 0) {
                colisage.ID_Devise = devise[0].ID_Devise;
                console.log(`✅ Devise ${colisage.Code_Devise} → ID ${colisage.ID_Devise}`);
            } else {
                console.log(`❌ Devise ${colisage.Code_Devise} non trouvée`);
            }
        }

        // Pays
        if (colisage.Pays_Origine && !colisage.ID_Pays_Origine) {
            const pays = await prisma.$queryRaw`
                SELECT ID_Pays FROM VPays WHERE Libelle_Pays = ${colisage.Pays_Origine}
            `;
            if (pays.length > 0) {
                colisage.ID_Pays_Origine = pays[0].ID_Pays;
                console.log(`✅ Pays ${colisage.Pays_Origine} → ID ${colisage.ID_Pays_Origine}`);
            } else {
                console.log(`❌ Pays ${colisage.Pays_Origine} non trouvé`);
            }
        }

        // HS Code
        if (colisage.HS_Code && !colisage.ID_HS_Code) {
            const hsCode = await prisma.$queryRaw`
                SELECT ID_HS_Code FROM VHSCodes WHERE HS_Code = ${colisage.HS_Code}
            `;
            if (hsCode.length > 0) {
                colisage.ID_HS_Code = hsCode[0].ID_HS_Code;
                console.log(`✅ HS Code ${colisage.HS_Code} → ID ${colisage.ID_HS_Code}`);
            } else {
                console.log(`❌ HS Code ${colisage.HS_Code} non trouvé`);
            }
        }
        
        // 3. Mapping pour EditColisageDialog
        console.log('\n3. Mapping EditColisageDialog...');
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
            regimeDeclaration: colisage.ID_Regime_Declaration || null,
        };
        
        console.log('InitialValues pour le formulaire:');
        console.log(JSON.stringify(initialValues, null, 2));
        
        // 4. Vérifier que les données de référence existent
        console.log('\n4. Vérification des données de référence...');
        
        if (initialValues.devise) {
            const devise = await prisma.$queryRaw`
                SELECT Code_Devise, Libelle_Devise FROM VDevises WHERE ID_Devise = ${initialValues.devise}
            `;
            console.log(`Devise ID ${initialValues.devise}:`, devise[0] || 'Non trouvée');
        }
        
        if (initialValues.paysOrigine) {
            const pays = await prisma.$queryRaw`
                SELECT Code_Pays, Libelle_Pays FROM VPays WHERE ID_Pays = ${initialValues.paysOrigine}
            `;
            console.log(`Pays ID ${initialValues.paysOrigine}:`, pays[0] || 'Non trouvé');
        }
        
        if (initialValues.hsCode) {
            const hsCode = await prisma.$queryRaw`
                SELECT HS_Code, Libelle_HS_Code FROM VHSCodes WHERE ID_HS_Code = ${initialValues.hsCode}
            `;
            console.log(`HS Code ID ${initialValues.hsCode}:`, hsCode[0] || 'Non trouvé');
        }
        
        console.log('\n🔍 DIAGNOSTIC:');
        console.log('- Les IDs sont-ils résolus ?', {
            devise: !!initialValues.devise,
            pays: !!initialValues.paysOrigine,
            hsCode: !!initialValues.hsCode
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugFormulaireEdition();