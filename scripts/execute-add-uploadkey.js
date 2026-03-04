const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function addUploadKeyColumn() {
    try {
        console.log('=== AJOUT COLONNE UploadKey ===\n');
        
        // Vérifier si la colonne existe déjà
        const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'THSCodes' AND COLUMN_NAME = 'UploadKey'
        `;
        
        if (columns.length > 0) {
            console.log('✅ La colonne UploadKey existe déjà');
            return;
        }
        
        console.log('🔄 Ajout de la colonne UploadKey...');
        
        // Ajouter la colonne
        await prisma.$executeRaw`ALTER TABLE THSCodes ADD UploadKey NVARCHAR(255) NULL`;
        
        console.log('✅ Colonne UploadKey ajoutée avec succès');
        
        // Vérifier que la colonne a été ajoutée
        const newColumns = await prisma.$queryRaw`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'THSCodes' 
            ORDER BY ORDINAL_POSITION
        `;
        
        console.log('\n=== STRUCTURE MISE À JOUR ===');
        newColumns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE})`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addUploadKeyColumn();