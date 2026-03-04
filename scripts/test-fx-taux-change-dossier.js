// Tester la fonction fx_TauxChangeDossier
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testFunction() {
    try {
        const dossierId = 1;
        const dateDeclaration = '2025-12-09 00:00:00.000';
        
        console.log('Test de fx_TauxChangeDossier...');
        console.log('Dossier:', dossierId);
        console.log('Date:', dateDeclaration);
        
        const result = await prisma.$queryRawUnsafe(`
            SELECT * FROM [dbo].[fx_TauxChangeDossier](${dossierId}, '${dateDeclaration}')
        `);
        
        console.log('\nRésultat:', result.length, 'lignes');
        result.forEach(r => {
            console.log(`- Devise ${r.ID_Devise} (${r.Code_Devise}): ${r.Taux_Change}, Conversion: ${r.ID_Convertion}`);
        });
        
        if (result.length === 0) {
            console.log('\n❌ La fonction ne retourne RIEN! C\'est le problème!');
            
            // Vérifier pourquoi
            console.log('\n=== DIAGNOSTIC ===');
            
            // 1. Vérifier le dossier
            const dossier = await prisma.$queryRawUnsafe(`
                SELECT d.[ID Dossier], d.[Branche], b.[Entite]
                FROM TDossiers d
                LEFT JOIN TBranches b ON d.[Branche] = b.[ID Branche]
                WHERE d.[ID Dossier] = ${dossierId}
            `);
            console.log('Dossier:', dossier[0]);
            
            // 2. Vérifier les conversions pour cette entité
            const entite = dossier[0].Entite;
            const conversions = await prisma.$queryRawUnsafe(`
                SELECT [ID Convertion], [Date Convertion], [Entite]
                FROM TConvertions
                WHERE [Entite] = ${entite}
                AND CAST([Date Convertion] AS DATE) = CAST('${dateDeclaration}' AS DATE)
            `);
            console.log('Conversions pour cette date:', conversions.length);
            conversions.forEach(c => console.log('  -', c));
            
            // 3. Vérifier les devises utilisées dans les colisages
            const devises = await prisma.$queryRawUnsafe(`
                SELECT DISTINCT c.[Devise], d.[Code Devise]
                FROM TColisageDossiers c
                LEFT JOIN TDevises d ON c.[Devise] = d.[ID Devise]
                WHERE c.[Dossier] = ${dossierId}
            `);
            console.log('Devises utilisées:', devises.length);
            devises.forEach(d => console.log(`  - ${d.Devise}: ${d['Code Devise']}`));
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testFunction();
