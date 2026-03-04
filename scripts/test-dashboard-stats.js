const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testStats() {
    try {
        console.log('🔍 Test des statistiques du dashboard...');

        // Test des dossiers
        console.log('\n📁 Test des dossiers:');
        const totalDossiers = await prisma.vDossiers.count();
        console.log('Total dossiers:', totalDossiers);

        // Test des colisages
        console.log('\n📦 Test des colisages:');
        const totalColisages = await prisma.tColisageDossiers.count();
        console.log('Total colisages:', totalColisages);

        // Test des clients
        console.log('\n👥 Test des clients:');
        const totalClients = await prisma.vClients.count();
        console.log('Total clients:', totalClients);

        // Test des conversions
        console.log('\n💱 Test des conversions:');
        const totalConversions = await prisma.vConvertions.count();
        console.log('Total conversions:', totalConversions);

        // Test d'un échantillon de données
        console.log('\n🔍 Échantillon de données:');
        const sampleDossier = await prisma.vDossiers.findFirst();
        console.log('Premier dossier:', sampleDossier ? {
            id: sampleDossier.idDossier,
            numero: sampleDossier.noDossier,
            client: sampleDossier.nomClient
        } : 'Aucun dossier trouvé');

        const sampleClient = await prisma.vClients.findFirst();
        console.log('Premier client:', sampleClient ? {
            id: sampleClient.idClient,
            nom: sampleClient.nomClient
        } : 'Aucun client trouvé');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testStats();