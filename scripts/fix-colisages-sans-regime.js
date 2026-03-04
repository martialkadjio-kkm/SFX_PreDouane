const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function fixColisagesSansRegime() {
    try {
        const dossierId = 1;
        
        console.log(`Vérification des colisages du dossier ${dossierId}...\n`);
        
        // Trouver les colisages sans régime
        const colisagesSansRegime = await prisma.tColisageDossiers.findMany({
            where: {
                dossier: dossierId,
                regimeDeclaration: null
            },
            select: {
                id: true,
                descriptionColis: true,
                hsCode: true
            }
        });
        
        console.log(`Colisages sans régime: ${colisagesSansRegime.length}\n`);
        
        if (colisagesSansRegime.length === 0) {
            console.log('✅ Tous les colisages ont un régime!');
            return;
        }
        
        // Trouver le régime EXO (ID = 0)
        const regimeEXO = await prisma.tRegimesDeclarations.findFirst({
            where: { id: 0 }
        });
        
        if (!regimeEXO) {
            console.error('❌ Régime EXO non trouvé!');
            return;
        }
        
        console.log(`Régime par défaut: ${regimeEXO.libelleRegimeDeclaration} (ID: ${regimeEXO.id})\n`);
        
        // Mettre à jour les colisages
        for (const colisage of colisagesSansRegime) {
            await prisma.tColisageDossiers.update({
                where: { id: colisage.id },
                data: {
                    regimeDeclaration: regimeEXO.id
                }
            });
            
            console.log(`✅ Colisage ${colisage.id}: ${colisage.descriptionColis.substring(0, 40)}...`);
        }
        
        console.log(`\n✅ ${colisagesSansRegime.length} colisage(s) mis à jour avec le régime EXO`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixColisagesSansRegime();
