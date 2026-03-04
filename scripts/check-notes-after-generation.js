// Vérifier si les notes ont été créées
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkNotes() {
    try {
        const dossierId = 1;
        
        // Vérifier le statut
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: { statutDossier: true }
        });
        console.log('Statut dossier:', dossier?.statutDossier);
        
        // Compter les notes
        const notesCount = await prisma.$queryRaw`
            SELECT COUNT(*) as total
            FROM TNotesDetail
            WHERE [ID_Dossier] = ${dossierId}
        `;
        console.log('Nombre de notes:', notesCount[0].total);
        
        // Afficher quelques notes
        const notes = await prisma.$queryRaw`
            SELECT TOP 5 *
            FROM VNotesDetail
            WHERE ID_Dossier = ${dossierId}
        `;
        console.log('\nPremières notes:');
        notes.forEach(n => {
            console.log(`- Colisage ${n.ID_Colisage_Dossier}, Régime ${n.Regime}, Qté: ${n.Base_Qte}`);
        });
        
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotes();
