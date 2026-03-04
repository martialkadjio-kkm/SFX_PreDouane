const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testHSCodeResolution() {
    try {
        console.log('=== TEST RÉSOLUTION HS CODE ===\n');
        
        const colisageId = 4;
        
        // Simuler getColisageById avec résolution du HS Code
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
        
        console.log('AVANT résolution:');
        console.log('HS_Code (string):', colisage.HS_Code);
        console.log('ID_HS_Code:', colisage.ID_HS_Code);
        
        // Résoudre ID_HS_Code
        if (colisage.HS_Code && !colisage.ID_HS_Code) {
            const hsCode = await prisma.$queryRaw`
                SELECT [ID HS Code] FROM THSCodes WHERE [HS Code] = ${colisage.HS_Code}
            `;
            if (hsCode.length > 0) {
                colisage.ID_HS_Code = hsCode[0]['ID HS Code'];
            }
        }
        
        console.log('\nAPRÈS résolution:');
        console.log('HS_Code (string):', colisage.HS_Code);
        console.log('ID_HS_Code:', colisage.ID_HS_Code);
        
        // Vérifier que l'ID correspond bien
        if (colisage.ID_HS_Code) {
            const verification = await prisma.$queryRaw`
                SELECT [HS Code], [Libelle HS Code] FROM THSCodes WHERE [ID HS Code] = ${colisage.ID_HS_Code}
            `;
            if (verification.length > 0) {
                console.log(`✅ Vérification: ID ${colisage.ID_HS_Code} → "${verification[0]['HS Code']}" - ${verification[0]['Libelle HS Code']}`);
            }
        }
        
        // Simuler le mapping du dialog d'édition
        console.log('\n2. Mapping pour le formulaire...');
        const initialValues = {
            hsCode: colisage.ID_HS_Code || null,
            descriptionColis: colisage.Description_Colis || "",
        };
        
        console.log('✅ hsCode pour le formulaire:', initialValues.hsCode);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testHSCodeResolution();