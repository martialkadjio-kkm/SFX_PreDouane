// Tester avec la conversion 1 qui a des taux
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function test() {
    try {
        const dossierId = 1;
        
        // Réinitialiser
        await prisma.$queryRawUnsafe(`
            UPDATE TDossiers SET [Statut Dossier] = 0 WHERE [ID Dossier] = ${dossierId}
        `);
        
        // Utiliser la conversion 1 (9 décembre) qui a des taux
        const dateConversion = '2025-12-09 00:00:00.000';
        
        console.log('Test avec conversion 1 (9 décembre)...');
        console.log('Date:', dateConversion);
        
        await prisma.$executeRawUnsafe(
            `EXEC [dbo].[pSP_CreerNoteDetail] @Id_Dossier = ${dossierId}, @DateDeclaration = '${dateConversion}'`
        );
        
        // Vérifier
        const dossier = await prisma.$queryRawUnsafe(`
            SELECT [Statut Dossier] FROM TDossiers WHERE [ID Dossier] = ${dossierId}
        `);
        console.log('Statut après:', dossier[0]['Statut Dossier']);
        
        const notesCount = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as total FROM TNotesDetail WHERE [Colisage Dossier] IN (
                SELECT [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier] = ${dossierId}
            )
        `);
        console.log('Notes créées:', notesCount[0].total);
        
        if (notesCount[0].total > 0) {
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

test();
