const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkDuplicates() {
    try {
        const dossierId = 1; // Changez selon votre dossier
        
        console.log('Vérification des doublons...\n');
        
        // Compter dans la table
        const tableCount = await prisma.tColisageDossiers.count({
            where: { dossier: dossierId }
        });
        console.log(`Table TColisageDossiers: ${tableCount} ligne(s)`);
        
        // Compter dans la vue via raw query
        const viewResult = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM VColisageDossiers WHERE ID_Dossier = ${dossierId}
        `;
        console.log(`Vue VColisageDossiers: ${viewResult[0].count} ligne(s)`);
        
        // Vérifier les régimes
        console.log('\nRégimes de déclaration:');
        const regimes = await prisma.tRegimesDeclarations.findMany({
            select: {
                id: true,
                libelleRegimeDeclaration: true,
            }
        });
        console.log(`Total: ${regimes.length} régime(s)`);
        regimes.forEach(r => console.log(`  - ID ${r.id}: ${r.libelleRegimeDeclaration}`));
        
        // Vérifier les colisages avec leurs régimes
        console.log('\nColisages et leurs régimes:');
        const colisages = await prisma.tColisageDossiers.findMany({
            where: { dossier: dossierId },
            select: {
                id: true,
                descriptionColis: true,
                regimeDeclaration: true
            },
            take: 5
        });
        colisages.forEach(c => {
            console.log(`  - Colisage ${c.id}: Régime ${c.regimeDeclaration}`);
        });
        
        // Tester la vue directement
        console.log('\nTest de la vue (5 premières lignes):');
        const viewData = await prisma.$queryRaw`
            SELECT TOP 5 
                ID_Colisage_Dossier,
                Description_Colis,
                ID_Regime_Declaration,
                Libelle_Regime_Declaration
            FROM VColisageDossiers 
            WHERE ID_Dossier = ${dossierId}
        `;
        viewData.forEach(v => {
            console.log(`  - Colisage ${v.ID_Colisage_Dossier}: ${v.Description_Colis?.substring(0, 30)}... (Régime: ${v.Libelle_Regime_Declaration || 'NULL'})`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicates();
