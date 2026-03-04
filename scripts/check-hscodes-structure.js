const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkHSCodesStructure() {
    try {
        console.log('=== STRUCTURE THSCodes ===\n');
        
        const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'THSCodes' 
            ORDER BY ORDINAL_POSITION
        `;
        
        console.log('Colonnes de THSCodes:');
        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.COLUMN_NAME}`);
        });
        
        // Regarder quelques données
        console.log('\n=== EXEMPLE DE DONNÉES ===');
        const sample = await prisma.$queryRaw`SELECT TOP 3 * FROM THSCodes`;
        sample.forEach((data, index) => {
            console.log(`\nEnregistrement ${index + 1}:`);
            Object.keys(data).forEach(key => {
                console.log(`  ${key}: ${data[key]} (${typeof data[key]})`);
            });
        });
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkHSCodesStructure();