// Copier les taux de la conversion 1 vers la conversion 2
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function copyTaux() {
    try {
        console.log('Copie des taux de la conversion 1 vers la conversion 2...');
        
        // Vérifier les taux existants
        const tauxConv1 = await prisma.$queryRawUnsafe(`
            SELECT * FROM TTauxChange WHERE [Convertion] = 1
        `);
        console.log(`Taux dans conversion 1: ${tauxConv1.length}`);
        
        const tauxConv2 = await prisma.$queryRawUnsafe(`
            SELECT * FROM TTauxChange WHERE [Convertion] = 2
        `);
        console.log(`Taux dans conversion 2: ${tauxConv2.length}`);
        
        if (tauxConv2.length > 0) {
            console.log('La conversion 2 a déjà des taux. Suppression...');
            await prisma.$queryRawUnsafe(`
                DELETE FROM TTauxChange WHERE [Convertion] = 2
            `);
        }
        
        // Copier les taux
        await prisma.$queryRawUnsafe(`
            INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
            SELECT 2, [Devise], [Taux Change], [Session], GETDATE()
            FROM TTauxChange
            WHERE [Convertion] = 1
        `);
        
        // Vérifier
        const tauxConv2After = await prisma.$queryRawUnsafe(`
            SELECT * FROM TTauxChange WHERE [Convertion] = 2
        `);
        console.log(`\n✅ Taux copiés: ${tauxConv2After.length}`);
        tauxConv2After.forEach(t => {
            console.log(`  - Devise ${t.Devise}: ${t['Taux Change']}`);
        });
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

copyTaux();
