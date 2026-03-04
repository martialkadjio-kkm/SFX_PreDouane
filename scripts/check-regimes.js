const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkRegimes() {
    try {
        console.log('Vérification des régimes de déclaration...\n');
        
        const regimes = await prisma.tRegimesDeclarations.findMany({
            orderBy: { tauxDC: 'asc' }
        });
        
        console.log(`Total: ${regimes.length} régime(s)\n`);
        
        regimes.forEach(r => {
            console.log(`ID: ${r.id}`);
            console.log(`  Libellé: "${r.libelleRegimeDeclaration}"`);
            console.log(`  Taux DC: ${r.tauxDC}`);
            console.log(`  Libellé en minuscules: "${r.libelleRegimeDeclaration.toLowerCase()}"`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRegimes();
