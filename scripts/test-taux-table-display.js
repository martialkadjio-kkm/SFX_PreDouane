const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testTauxTableDisplay() {
    try {
        console.log('🧪 Test Affichage Tableau des Taux de Change\n');
        
        const dossierId = 1;
        
        // Récupérer les taux de change
        console.log('📊 Récupération des taux de change...\n');
        
        const dossierData = await prisma.$queryRaw`
            SELECT d.[Convertion], c.[Date Convertion] as DateConvertion
            FROM TDossiers d
            LEFT JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
            WHERE d.[ID Dossier] = ${dossierId}
        `;
        
        if (!dossierData || dossierData.length === 0 || !dossierData[0].DateConvertion) {
            console.log('❌ Impossible de récupérer la date de conversion');
            return;
        }
        
        const dateDeclaration = dossierData[0].DateConvertion;
        
        const tauxChange = await prisma.$queryRaw`
            SELECT 
                [ID_Devise],
                [Code_Devise],
                [Taux_Change],
                [ID_Convertion]
            FROM [dbo].[fx_TauxChangeDossier](${dossierId}, ${dateDeclaration})
        `;
        
        console.log('═══════════════════════════════════════');
        console.log('     TAUX DE CHANGE APPLIQUÉS         ');
        console.log('═══════════════════════════════════════');
        console.log('┌──────────────┬─────────────────────┐');
        console.log('│    Devise    │   Taux Appliqués     │');
        console.log('├──────────────┼─────────────────────┤');
        
        tauxChange.forEach((taux) => {
            const devise = taux.Code_Devise.padEnd(12);
            const tauxValue = Number(taux.Taux_Change || 0).toFixed(6).padStart(19);
            console.log(`│ ${devise} │ ${tauxValue} │`);
        });
        
        console.log('└──────────────┴─────────────────────┘');
        
        console.log('\n📝 Informations:');
        console.log(`   - Nombre de devises: ${tauxChange.length}`);
        console.log(`   - Date de conversion: ${dateDeclaration.toISOString().split('T')[0]}`);
        console.log(`   - ID Conversion: ${tauxChange[0]?.ID_Convertion || 'N/A'}`);
        
        console.log('\n💡 Ce tableau sera affiché dans le PDF entre:');
        console.log('   1. Le tableau croisé Régime/Devise');
        console.log('   2. Le tableau des données détaillées');
        
        console.log('\n📐 Dimensions du tableau:');
        console.log('   - Largeur: 35% de la page');
        console.log('   - Position: Aligné à gauche');
        console.log('   - Colonnes: 2 (Devise 40%, Taux Appliqués 60%)');
        
        console.log('\n✅ Test terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testTauxTableDisplay();
