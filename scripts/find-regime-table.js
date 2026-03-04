const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function findRegimeTable() {
    try {
        const tables = await prisma.$queryRawUnsafe(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%regime%' OR TABLE_NAME LIKE '%Regime%'
        `);
        
        console.log('Tables contenant "regime":', tables);
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

findRegimeTable();