// Vérifier simplement les notes
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkNotes() {
    try {
        const dossierId = 1;
        
        const notesCount = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as total FROM TNotesDetail WHERE [Colisage Dossier] IN (
                SELECT [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier] = ${dossierId}
            )
        `);
        
        console.log('Notes créées:', notesCount[0].total);
        
        if (notesCount[0].total > 0) {
            const notes = await prisma.$queryRawUnsafe(`
                SELECT TOP 10 * FROM TNotesDetail WHERE [Colisage Dossier] IN (
                    SELECT [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier] = ${dossierId}
                )
            `);
            console.log('\nPremières notes:');
            notes.forEach(n => {
                console.log(`- Colisage ${n['Colisage Dossier']}, Régime: "${n.Regime}", Qté: ${n['Base Qte']}`);
            });
            console.log('\n✅ SUCCÈS! Les notes ont été créées!');
        } else {
            console.log('\n❌ Aucune note créée');
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotes();
