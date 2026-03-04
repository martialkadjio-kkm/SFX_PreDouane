// Test direct de la procédure pSP_CreerNoteDetail
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testProcedure() {
    try {
        const dossierId = 1;
        
        // 1. Vérifier le statut
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: { statutDossier: true, branche: true }
        });
        console.log('Statut dossier:', dossier?.statutDossier);
        
        // 2. Récupérer la date de conversion
        const branche = await prisma.tBranches.findUnique({
            where: { id: dossier.branche },
            select: { entite: true }
        });
        
        const conversions = await prisma.$queryRaw`
            SELECT TOP 1 [ID Convertion], [Date Convertion]
            FROM TConvertions
            WHERE [Entite] = ${branche.entite}
            ORDER BY [Date Convertion] DESC
        `;
        
        const dateConversion = conversions[0]['Date Convertion'];
        console.log('Date conversion:', dateConversion);
        console.log('Type:', typeof dateConversion);
        
        // 3. Tester avec $executeRawUnsafe
        console.log('\n=== Test avec $executeRawUnsafe ===');
        const dateFormatted = dateConversion instanceof Date 
            ? dateConversion.toISOString().replace('T', ' ').replace('Z', '')
            : dateConversion;
        
        console.log('Date formatée:', dateFormatted);
        
        const query = `EXEC [dbo].[pSP_CreerNoteDetail] @Id_Dossier = ${dossierId}, @DateDeclaration = '${dateFormatted}'`;
        console.log('Query:', query);
        
        await prisma.$executeRawUnsafe(query);
        console.log('✓ Succès!');
        
        // Vérifier le statut après
        const dossierApres = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: { statutDossier: true }
        });
        console.log('Statut après:', dossierApres?.statutDossier);
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testProcedure();
