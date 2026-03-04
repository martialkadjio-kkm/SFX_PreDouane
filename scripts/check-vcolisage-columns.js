const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkColumns() {
    try {
        const columns = await prisma.$queryRawUnsafe(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'VColisageDossiers' 
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Colonnes de VColisageDossiers:');
        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.COLUMN_NAME}`);
        });
        
        // Regarder aussi un exemple de données pour voir quelles colonnes ont des valeurs
        console.log('\n=== EXEMPLE DE DONNÉES ===');
        const sample = await prisma.$queryRawUnsafe(`SELECT TOP 1 * FROM VColisageDossiers`);
        if (sample.length > 0) {
            const data = sample[0];
            Object.keys(data).forEach(key => {
                console.log(`${key}: ${data[key]} (${typeof data[key]})`);
            });
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkColumns();