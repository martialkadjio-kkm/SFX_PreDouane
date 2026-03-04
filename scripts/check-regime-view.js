const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkRegimeView() {
    try {
        console.log('Vérification de VRegimesDeclarations...\n');
        
        // Compter dans la table
        const tableCount = await prisma.tRegimesDeclarations.count();
        console.log(`Table TRegimesDeclarations: ${tableCount} ligne(s)`);
        
        // Compter dans la vue
        const viewResult = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM VRegimesDeclarations
        `;
        console.log(`Vue VRegimesDeclarations: ${viewResult[0].count} ligne(s)\n`);
        
        // Afficher toutes les lignes de la vue
        console.log('Contenu de VRegimesDeclarations:');
        const viewData = await prisma.$queryRaw`
            SELECT 
                ID_Regime_Declaration,
                Libelle_Regime_Declaration,
                ID_Entite
            FROM VRegimesDeclarations
            ORDER BY ID_Regime_Declaration
        `;
        
        viewData.forEach(v => {
            console.log(`  - Régime ${v.ID_Regime_Declaration}: ${v.Libelle_Regime_Declaration} (Entité: ${v.ID_Entite})`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRegimeView();
