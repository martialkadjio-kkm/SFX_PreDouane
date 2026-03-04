const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function fixDossierStatus() {
    try {
        const dossierId = 12;
        
        console.log(`Changement du statut du dossier ${dossierId}...\n`);
        
        // Vérifier le statut actuel
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: {
                id: true,
                noDossier: true,
                statutDossier: true
            }
        });
        
        if (!dossier) {
            console.error('❌ Dossier non trouvé!');
            return;
        }
        
        console.log(`Dossier: ${dossier.noDossier}`);
        console.log(`Statut actuel: ${dossier.statutDossier}`);
        
        // Changer le statut à 0 (en cours)
        await prisma.tDossiers.update({
            where: { id: dossierId },
            data: {
                statutDossier: 0
            }
        });
        
        console.log(`\n✅ Statut changé à 0 (en cours)`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixDossierStatus();
