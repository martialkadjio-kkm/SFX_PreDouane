const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugEtapes() {
    try {
        console.log('=== DOSSIER 0002 ===');
        const dossier = await prisma.vDossiers.findFirst({
            where: { noDossier: '0002' },
            select: {
                idDossier: true,
                noDossier: true,
                idEtapeActuelle: true,
                libelleEtapeActuelle: true,
            }
        });
        console.log('Dossier 0002:', dossier);

        console.log('\n=== ÉTAPES DISPONIBLES (vEtapesDossiers) ===');
        const etapesVue = await prisma.vEtapesDossiers.findMany({
            select: {
                idEtape: true,
                libelleEtape: true,
            },
            distinct: ['idEtape'],
            orderBy: { libelleEtape: 'asc' }
        });
        console.log('Étapes dans vEtapesDossiers:', etapesVue);

        console.log('\n=== TOUTES LES ÉTAPES ACTUELLES DES DOSSIERS ===');
        const etapesActuelles = await prisma.vDossiers.findMany({
            select: {
                idEtapeActuelle: true,
                libelleEtapeActuelle: true,
            },
            distinct: ['idEtapeActuelle'],
            orderBy: { libelleEtapeActuelle: 'asc' }
        });
        console.log('Étapes actuelles des dossiers:', etapesActuelles);

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugEtapes();