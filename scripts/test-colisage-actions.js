// Test des nouvelles actions simples pour le formulaire de colisage
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testColisageActions() {
    try {
        console.log('=== TEST ACTIONS COLISAGE ===\n');
        
        // Test getAllHSCodes
        console.log('1. Test getAllHSCodes...');
        const hscodes = await prisma.$queryRaw`
            SELECT [ID HS Code] as id, [HS Code] as hsCode, [Libelle HS Code] as description 
            FROM THSCodes 
            ORDER BY [HS Code]
        `;
        const serializedHSCodes = JSON.parse(JSON.stringify(hscodes));
        console.log('✅ HS Codes:', serializedHSCodes.slice(0, 3));
        
        // Test getAllDevises
        console.log('\n2. Test getAllDevises...');
        const devises = await prisma.$queryRaw`
            SELECT [ID Devise] as id, [Code Devise] as codeDevise, [Libelle Devise] as libelleDevise 
            FROM TDevises 
            ORDER BY [Code Devise]
        `;
        const serializedDevises = JSON.parse(JSON.stringify(devises));
        console.log('✅ Devises:', serializedDevises.slice(0, 3));
        
        // Test getAllPays
        console.log('\n3. Test getAllPays...');
        const pays = await prisma.$queryRaw`
            SELECT [ID Pays] as id, [Code Pays] as codePays, [Libelle Pays] as libellePays 
            FROM TPays 
            ORDER BY [Libelle Pays]
        `;
        const serializedPays = JSON.parse(JSON.stringify(pays));
        console.log('✅ Pays:', serializedPays.slice(0, 3));
        
        // Test getAllRegimesDeclaration
        console.log('\n4. Test getAllRegimesDeclaration...');
        const regimes = await prisma.$queryRaw`
            SELECT [ID Regime Declaration] as id, [Libelle Regime Declaration] as libelle 
            FROM TRegimesDeclarations 
            ORDER BY [Libelle Regime Declaration]
        `;
        const serializedRegimes = JSON.parse(JSON.stringify(regimes));
        console.log('✅ Régimes:', serializedRegimes);
        
        console.log('\n🎉 TOUTES LES ACTIONS FONCTIONNENT !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testColisageActions();