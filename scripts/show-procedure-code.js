// Afficher le code de la procédure
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function showProcedure() {
    try {
        const code = await prisma.$queryRawUnsafe(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.pSP_CreerNoteDetail')) AS code
        `);
        
        console.log(code[0].code);
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

showProcedure();
