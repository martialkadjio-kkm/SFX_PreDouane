// Vérifier tous les taux de change
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkTaux() {
    try {
        // Toutes les conversions
        const conversions = await prisma.$queryRawUnsafe(`
            SELECT [ID Convertion], [Date Convertion], [Entite]
            FROM TConvertions
            ORDER BY [Date Convertion] DESC
        `);
        
        console.log('=== CONVERSIONS ===');
        for (const conv of conversions) {
            console.log(`\nConversion ${conv['ID Convertion']} - ${conv['Date Convertion']}`);
            
            const taux = await prisma.$queryRawUnsafe(`
                SELECT COUNT(*) as total FROM TTauxChange WHERE [Convertion] = ${conv['ID Convertion']}
            `);
            console.log(`  Taux: ${taux[0].total}`);
            
            if (taux[0].total > 0) {
                const details = await prisma.$queryRawUnsafe(`
                    SELECT TOP 3 * FROM TTauxChange WHERE [Convertion] = ${conv['ID Convertion']}
                `);
                console.log('  Colonnes:', Object.keys(details[0]));
                details.forEach(t => console.log('  -', t));
            }
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTaux();
