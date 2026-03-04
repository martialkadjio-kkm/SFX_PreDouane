// Debug de la procédure pSP_CreerNoteDetail
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function debugProcedure() {
    try {
        const dossierId = 1;
        
        console.log('=== AVANT PROCEDURE ===');
        
        // 1. Vérifier le dossier
        const dossier = await prisma.$queryRawUnsafe(`
            SELECT [ID Dossier], [Statut Dossier], [Branche]
            FROM TDossiers
            WHERE [ID Dossier] = ${dossierId}
        `);
        console.log('Dossier:', dossier[0]);
        
        // 2. Vérifier les colisages
        const colisages = await prisma.$queryRawUnsafe(`
            SELECT [ID Colisage Dossier], [HS Code], [Regime Declaration], [Devise]
            FROM TColisageDossiers
            WHERE [Dossier] = ${dossierId}
        `);
        console.log('\nColisages:', colisages.length);
        colisages.forEach(c => {
            console.log(`- ID: ${c['ID Colisage Dossier']}, HS: ${c['HS Code']}, Régime: ${c['Regime Declaration']}, Devise: ${c['Devise']}`);
        });
        
        // 3. Vérifier la branche et l'entité
        const branche = await prisma.$queryRawUnsafe(`
            SELECT [ID Branche], [Entite]
            FROM TBranches
            WHERE [ID Branche] = ${dossier[0]['Branche']}
        `);
        console.log('\nBranche:', branche[0] || 'BRANCHE INVALIDE!');
        
        // 4. Vérifier les conversions disponibles
        const conversions = await prisma.$queryRawUnsafe(`
            SELECT TOP 5 [ID Convertion], [Date Convertion], [Entite]
            FROM TConvertions
            WHERE [Entite] = ${branche[0]['Entite']}
            ORDER BY [Date Convertion] DESC
        `);
        console.log('\nConversions disponibles:');
        conversions.forEach(c => {
            console.log(`- ID: ${c['ID Convertion']}, Date: ${c['Date Convertion']}, Entité: ${c['Entite']}`);
        });
        
        // 5. Vérifier les taux de change pour la dernière conversion
        if (conversions.length > 0) {
            const conversionId = conversions[0]['ID Convertion'];
            const taux = await prisma.$queryRawUnsafe(`
                SELECT TOP 5 * FROM TTauxChange WHERE [Convertion] = ${conversionId}
            `);
            console.log(`\nTaux de change pour conversion ${conversionId}:`, taux.length);
            if (taux.length > 0) {
                console.log('Colonnes:', Object.keys(taux[0]));
            }
        }
        
        console.log('\n=== EXECUTION PROCEDURE ===');
        
        // Réinitialiser le statut
        await prisma.$queryRawUnsafe(`
            UPDATE TDossiers SET [Statut Dossier] = 0 WHERE [ID Dossier] = ${dossierId}
        `);
        
        // Exécuter la procédure avec la dernière conversion
        const dateConversion = conversions[0]['Date Convertion'];
        const dateFormatted = dateConversion instanceof Date 
            ? dateConversion.toISOString().replace('T', ' ').replace('Z', '')
            : dateConversion;
        
        console.log('Date utilisée:', dateFormatted);
        
        await prisma.$executeRawUnsafe(
            `EXEC [dbo].[pSP_CreerNoteDetail] @Id_Dossier = ${dossierId}, @DateDeclaration = '${dateFormatted}'`
        );
        
        console.log('\n=== APRES PROCEDURE ===');
        
        // Vérifier le statut
        const dossierApres = await prisma.$queryRawUnsafe(`
            SELECT [Statut Dossier] FROM TDossiers WHERE [ID Dossier] = ${dossierId}
        `);
        console.log('Statut:', dossierApres[0]['Statut Dossier']);
        
        // Compter les notes
        const notesCount = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as total FROM TNotesDetail WHERE [Colisage Dossier] IN (
                SELECT [ID Colisage Dossier] FROM TColisageDossiers WHERE [Dossier] = ${dossierId}
            )
        `);
        console.log('Notes créées:', notesCount[0].total);
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugProcedure();
