const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkNotesCreated() {
    try {
        const dossierId = 1;
        
        console.log(`Vérification des notes de détail pour le dossier ${dossierId}...\n`);
        
        // Compter les notes dans la table TNotesDetail
        const notesCount = await prisma.tNotesDetail.count({
            where: {
                tColisageDossiers: {
                    dossier: dossierId
                }
            }
        });
        
        console.log(`Notes dans TNotesDetail: ${notesCount}`);
        
        if (notesCount === 0) {
            console.log('\n❌ Aucune note trouvée dans la table TNotesDetail');
            
            // Vérifier le statut du dossier
            const dossier = await prisma.tDossiers.findUnique({
                where: { id: dossierId },
                select: {
                    statutDossier: true,
                    convertion: true
                }
            });
            
            console.log(`\nStatut dossier: ${dossier?.statutDossier}`);
            console.log(`Conversion liée: ${dossier?.convertion || 'NULL'}`);
            
            return;
        }
        
        // Afficher quelques notes
        console.log('\nPremières notes:');
        const notes = await prisma.tNotesDetail.findMany({
            where: {
                tColisageDossiers: {
                    dossier: dossierId
                }
            },
            select: {
                id: true,
                colisageDossier: true,
                regime: true,
                baseQte: true,
                basePrixUnitaire: true,
                basePoidsBrut: true
            },
            take: 5
        });
        
        notes.forEach(n => {
            console.log(`  - Note ${n.id}: Colisage ${n.colisageDossier}, Régime: "${n.regime}", Qté: ${n.baseQte}`);
        });
        
        // Vérifier la vue VNotesDetail
        console.log('\n\nVérification de la vue VNotesDetail:');
        const viewResult = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM VNotesDetail WHERE ID_Dossier = ${dossierId}
        `;
        
        console.log(`Notes dans VNotesDetail: ${viewResult[0].count}`);
        
        if (viewResult[0].count === 0 && notesCount > 0) {
            console.log('\n⚠️  Les notes existent dans la table mais pas dans la vue!');
            console.log('Cela peut être un problème de vue SQL.');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotesCreated();
