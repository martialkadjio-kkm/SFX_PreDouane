// Script pour remettre le statut d'un dossier à 0 (en cours)
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function resetDossierStatus(dossierId) {
    try {
        console.log(`Remise à zéro du statut du dossier ${dossierId}...`);
        
        await prisma.$executeRaw`
            UPDATE TDossiers 
            SET [Statut Dossier] = 0 
            WHERE [ID Dossier] = ${dossierId}
        `;
        
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: { statutDossier: true }
        });
        
        console.log(`✓ Statut du dossier ${dossierId} mis à jour: ${dossier?.statutDossier}`);
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Utilisation: node scripts/reset-dossier-status.js [ID_DOSSIER]
const dossierId = parseInt(process.argv[2] || '1');
resetDossierStatus(dossierId);
