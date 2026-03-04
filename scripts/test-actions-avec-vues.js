// Test des actions avec les vues
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testActionsAvecVues() {
    try {
        console.log('=== TEST ACTIONS AVEC VUES ===\n');
        
        // Test VHSCodes
        console.log('1. Test VHSCodes...');
        const hscodes = await prisma.$queryRaw`SELECT * FROM VHSCodes ORDER BY [HS Code]`;
        const serializedHSCodes = JSON.parse(JSON.stringify(hscodes));
        console.log('✅ HS Codes (premiers 3):');
        serializedHSCodes.slice(0, 3).forEach(h => {
            console.log(`   ID: ${h['ID HS Code']}, Code: ${h['HS Code']}, Libellé: ${h['Libelle HS Code']}`);
        });
        
        // Test VDevises
        console.log('\n2. Test VDevises...');
        const devises = await prisma.$queryRaw`SELECT * FROM VDevises ORDER BY [Code Devise]`;
        const serializedDevises = JSON.parse(JSON.stringify(devises));
        console.log('✅ Devises (premiers 3):');
        serializedDevises.slice(0, 3).forEach(d => {
            console.log(`   ID: ${d['ID Devise']}, Code: ${d['Code Devise']}, Libellé: ${d['Libelle Devise']}`);
        });
        
        // Test VPays
        console.log('\n3. Test VPays...');
        const pays = await prisma.$queryRaw`SELECT * FROM VPays ORDER BY [Libelle Pays]`;
        const serializedPays = JSON.parse(JSON.stringify(pays));
        console.log('✅ Pays (premiers 3):');
        serializedPays.slice(0, 3).forEach(p => {
            console.log(`   ID: ${p['ID Pays']}, Code: ${p['Code Pays']}, Libellé: ${p['Libelle Pays']}`);
        });
        
        // Test VRegimesDeclarations
        console.log('\n4. Test VRegimesDeclarations...');
        const regimes = await prisma.$queryRaw`SELECT * FROM VRegimesDeclarations ORDER BY [Libelle Regime Declaration]`;
        const serializedRegimes = JSON.parse(JSON.stringify(regimes));
        console.log('✅ Régimes:');
        serializedRegimes.forEach(r => {
            console.log(`   ID: ${r['ID Regime Declaration']}, Libellé: ${r['Libelle Regime Declaration']}`);
        });
        
        console.log('\n🎉 TOUTES LES VUES FONCTIONNENT !');
        
        // Maintenant il faut adapter le formulaire pour utiliser les bons noms de colonnes
        console.log('\n=== MAPPING POUR LE FORMULAIRE ===');
        console.log('Les vues utilisent les noms de colonnes avec espaces, il faut adapter le formulaire:');
        console.log('- VHSCodes: ID HS Code, HS Code, Libelle HS Code');
        console.log('- VDevises: ID Devise, Code Devise, Libelle Devise');
        console.log('- VPays: ID Pays, Code Pays, Libelle Pays');
        console.log('- VRegimesDeclarations: ID Regime Declaration, Libelle Regime Declaration');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testActionsAvecVues();