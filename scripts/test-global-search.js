// Test de la recherche globale
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGlobalSearch() {
    try {
        console.log('🔍 Test de la recherche globale...');

        // Test 1: Vérifier les vues
        console.log('\n📋 Test des vues:');
        
        const clients = await prisma.vClients.findMany({ take: 2 });
        console.log('✅ VClients:', clients.length, 'clients trouvés');
        
        const dossiers = await prisma.vDossiers.findMany({ take: 2 });
        console.log('✅ VDossiers:', dossiers.length, 'dossiers trouvés');
        
        const hscodes = await prisma.vHSCodes.findMany({ take: 2 });
        console.log('✅ VHSCodes:', hscodes.length, 'HS codes trouvés');

        // Test 2: Recherche avec un terme
        console.log('\n🔍 Test de recherche avec "test":');
        
        const searchTerm = 'test';
        
        const clientResults = await prisma.vClients.findMany({
            where: {
                nomClient: { contains: searchTerm }
            },
            take: 3
        });
        console.log('📊 Clients trouvés:', clientResults.length);

        const dossierResults = await prisma.vDossiers.findMany({
            where: {
                OR: [
                    { noDossier: { contains: searchTerm } },
                    { noOT: { contains: searchTerm } },
                    { nomClient: { contains: searchTerm } },
                ],
            },
            take: 3
        });
        console.log('📊 Dossiers trouvés:', dossierResults.length);

        console.log('\n✅ Test terminé avec succès!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testGlobalSearch();