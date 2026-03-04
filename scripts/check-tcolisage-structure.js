const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkTColisageStructure() {
    try {
        console.log('=== STRUCTURE TColisageDossiers ===\n');
        
        const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TColisageDossiers' 
            ORDER BY ORDINAL_POSITION
        `;
        
        console.log('Colonnes de TColisageDossiers:');
        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.COLUMN_NAME}`);
        });
        
        // Regarder quelques données
        console.log('\n=== EXEMPLE DE DONNÉES ===');
        const sample = await prisma.$queryRaw`SELECT TOP 1 * FROM TColisageDossiers`;
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

checkTColisageStructure();