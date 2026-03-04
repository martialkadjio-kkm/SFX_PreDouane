// Vérifier les colonnes de TNotesDetail
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkColumns() {
    try {
        // Récupérer les colonnes de la table
        const columns = await prisma.$queryRawUnsafe(`
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TNotesDetail'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Colonnes de TNotesDetail:');
        columns.forEach(col => {
            console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        // Compter les notes
        const count = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as total FROM TNotesDetail
        `);
        console.log('\nTotal notes dans la table:', count[0].total);
        
        // Afficher quelques notes
        const notes = await prisma.$queryRawUnsafe(`
            SELECT TOP 5 * FROM TNotesDetail
        `);
        console.log('\nPremières notes:');
        console.log(notes);
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkColumns();
