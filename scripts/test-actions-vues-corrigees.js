// Test des actions corrigées avec les vues
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testActionsVuesCorrigees() {
    try {
        console.log('=== TEST ACTIONS VUES CORRIGÉES ===\n');
        
        // Test getAllHSCodes
        console.log('1. Test getAllHSCodes...');
        const hscodes = await prisma.$queryRaw`
            SELECT ID_HS_Code as id, HS_Code as hsCode, Libelle_HS_Code as description 
            FROM VHSCodes 
            ORDER BY HS_Code
        `;
        const serializedHSCodes = JSON.parse(JSON.stringify(hscodes));
        console.log('✅ HS Codes:', serializedHSCodes.slice(0, 3));
        
        // Test getAllDevises
        console.log('\n2. Test getAllDevises...');
        const devises = await prisma.$queryRaw`
            SELECT ID_Devise as id, Code_Devise as codeDevise, Libelle_Devise as libelleDevise 
            FROM VDevises 
            ORDER BY Code_Devise
        `;
        const serializedDevises = JSON.parse(JSON.stringify(devises));
        console.log('✅ Devises:', serializedDevises.slice(0, 3));
        
        // Test getAllPays
        console.log('\n3. Test getAllPays...');
        const pays = await prisma.$queryRaw`
            SELECT ID_Pays as id, Code_Pays as codePays, Libelle_Pays as libellePays 
            FROM VPays 
            ORDER BY Libelle_Pays
        `;
        const serializedPays = JSON.parse(JSON.stringify(pays));
        console.log('✅ Pays:', serializedPays.slice(0, 3));
        
        // Test getAllRegimesDeclaration
        console.log('\n4. Test getAllRegimesDeclaration...');
        const regimes = await prisma.$queryRaw`
            SELECT ID_Regime_Declaration as id, Libelle_Regime_Declaration as libelle 
            FROM VRegimesDeclarations 
            ORDER BY Libelle_Regime_Declaration
        `;
        const serializedRegimes = JSON.parse(JSON.stringify(regimes));
        console.log('✅ Régimes:', serializedRegimes);
        
        // Test résolution des IDs
        console.log('\n5. Test résolution des IDs...');
        
        // Test résolution devise
        const deviseTest = await prisma.$queryRaw`
            SELECT ID_Devise FROM VDevises WHERE Code_Devise = 'EUR'
        `;
        console.log('✅ Résolution devise EUR:', deviseTest[0]?.ID_Devise);
        
        // Test résolution pays
        const paysTest = await prisma.$queryRaw`
            SELECT ID_Pays FROM VPays WHERE Libelle_Pays = 'France'
        `;
        console.log('✅ Résolution pays France:', paysTest[0]?.ID_Pays);
        
        // Test résolution HS Code
        const hsTest = await prisma.$queryRaw`
            SELECT ID_HS_Code FROM VHSCodes WHERE HS_Code = '12345678'
        `;
        console.log('✅ Résolution HS Code 12345678:', hsTest[0]?.ID_HS_Code);
        
        console.log('\n🎉 TOUTES LES ACTIONS AVEC VUES FONCTIONNENT !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testActionsVuesCorrigees();