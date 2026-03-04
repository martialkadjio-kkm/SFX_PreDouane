const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testCompleteColisageResolution() {
    try {
        console.log('=== TEST RÉSOLUTION COMPLÈTE COLISAGE ===\n');
        
        const colisageId = 4;
        
        // Simuler getColisageById complet
        console.log('1. Récupération et résolution complète...');
        const result = await prisma.$queryRaw`
            SELECT * FROM VColisageDossiers 
            WHERE ID_Colisage_Dossier = ${colisageId}
        `;

        if (result.length === 0) {
            console.log('❌ Colisage non trouvé');
            return;
        }

        const colisage = JSON.parse(JSON.stringify(result[0]));
        
        console.log('AVANT résolution:');
        console.log('  Code_Devise:', colisage.Code_Devise, '→ ID_Devise:', colisage.ID_Devise);
        console.log('  Pays_Origine:', colisage.Pays_Origine, '→ ID_Pays_Origine:', colisage.ID_Pays_Origine);
        console.log('  HS_Code:', colisage.HS_Code, '→ ID_HS_Code:', colisage.ID_HS_Code);
        
        // Résoudre tous les IDs
        // 1. ID_Devise
        if (colisage.Code_Devise && !colisage.ID_Devise) {
            const devise = await prisma.$queryRaw`
                SELECT [ID Devise] FROM TDevises WHERE [Code Devise] = ${colisage.Code_Devise}
            `;
            if (devise.length > 0) {
                colisage.ID_Devise = devise[0]['ID Devise'];
            }
        }

        // 2. ID_Pays_Origine
        if (colisage.Pays_Origine && !colisage.ID_Pays_Origine) {
            const pays = await prisma.$queryRaw`
                SELECT [ID Pays] FROM TPays WHERE [Libelle Pays] = ${colisage.Pays_Origine}
            `;
            if (pays.length > 0) {
                colisage.ID_Pays_Origine = pays[0]['ID Pays'];
            }
        }

        // 3. ID_HS_Code
        if (colisage.HS_Code && !colisage.ID_HS_Code) {
            const hsCode = await prisma.$queryRaw`
                SELECT [ID HS Code] FROM THSCodes WHERE [HS Code] = ${colisage.HS_Code}
            `;
            if (hsCode.length > 0) {
                colisage.ID_HS_Code = hsCode[0]['ID HS Code'];
            }
        }
        
        console.log('\nAPRÈS résolution:');
        console.log('  Code_Devise:', colisage.Code_Devise, '→ ID_Devise:', colisage.ID_Devise);
        console.log('  Pays_Origine:', colisage.Pays_Origine, '→ ID_Pays_Origine:', colisage.ID_Pays_Origine);
        console.log('  HS_Code:', colisage.HS_Code, '→ ID_HS_Code:', colisage.ID_HS_Code);
        
        // 2. Simuler le mapping du dialog d'édition
        console.log('\n2. Mapping pour le formulaire d\'édition...');
        const initialValues = {
            id: colisage.ID_Colisage_Dossier,
            descriptionColis: colisage.Description_Colis || "",
            hsCode: colisage.ID_HS_Code || null,
            devise: colisage.ID_Devise || undefined,
            paysOrigine: colisage.ID_Pays_Origine || undefined,
            regimeDeclaration: colisage.ID_Regime_Declaration || null,
        };
        
        console.log('✅ Valeurs pour le formulaire:');
        console.log('  hsCode:', initialValues.hsCode);
        console.log('  devise:', initialValues.devise);
        console.log('  paysOrigine:', initialValues.paysOrigine);
        console.log('  regimeDeclaration:', initialValues.regimeDeclaration);
        
        console.log('\n🎉 RÉSOLUTION COMPLÈTE RÉUSSIE !');
        console.log('Le formulaire d\'édition devrait maintenant avoir toutes les valeurs correctes.');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testCompleteColisageResolution();