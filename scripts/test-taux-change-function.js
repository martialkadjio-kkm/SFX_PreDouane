const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testTauxChangeFunction() {
    try {
        const dossierId = 1;
        const dateDeclaration = new Date('2025-12-08');
        
        console.log('Test de la fonction fx_TauxChangeDossier...\n');
        console.log(`Dossier ID: ${dossierId}`);
        console.log(`Date: ${dateDeclaration.toISOString()}\n`);
        
        // Appeler la fonction
        const result = await prisma.$queryRaw`
            SELECT * FROM dbo.fx_TauxChangeDossier(${dossierId}, ${dateDeclaration})
        `;
        
        console.log(`Résultat: ${result.length} devise(s)\n`);
        
        if (result.length === 0) {
            console.log('❌ Aucun taux de change retourné!');
            console.log('\nCela signifie probablement:');
            console.log('  1. Aucune conversion n\'existe pour cette date et cette entité');
            console.log('  2. Ou aucun taux de change n\'est défini pour les devises utilisées');
            return;
        }
        
        result.forEach(r => {
            console.log(`Devise ${r.ID_Devise} (${r.Code_Devise}):`);
            console.log(`  Taux: ${r.Taux_Change}`);
            console.log(`  Conversion ID: ${r.ID_Convertion}`);
            
            if (!r.Taux_Change || r.Taux_Change <= 0) {
                console.log('  ⚠️  TAUX INVALIDE!');
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testTauxChangeFunction();
