// Copier les taux de la conversion 1 vers la conversion 3
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function copyTaux() {
    try {
        console.log('Copie des taux de la conversion 1 vers la conversion 3...');
        
        // Supprimer les taux existants de la conversion 3
        await prisma.$queryRawUnsafe(`
            DELETE FROM TTauxChange WHERE [Convertion] = 3
        `);
        
        // Copier tous les taux de la conversion 1
        await prisma.$queryRawUnsafe(`
            INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
            SELECT 3, [Devise], [Taux Change], [Session], GETDATE()
            FROM TTauxChange
            WHERE [Convertion] = 1
        `);
        
        // Vérifier
        const taux = await prisma.$queryRawUnsafe(`
            SELECT * FROM TTauxChange WHERE [Convertion] = 3
        `);
        console.log(`\n✅ Taux copiés: ${taux.length}`);
        taux.forEach(t => {
            console.log(`  - Devise ${t.Devise}: ${t['Taux Change']}`);
        });
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

copyTaux();
