const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkHSCodesTable() {
    try {
        console.log('=== STRUCTURE TABLE THSCodes ===\n');
        
        const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'THSCodes' 
            ORDER BY ORDINAL_POSITION
        `;
        
        console.log('Colonnes actuelles:');
        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.COLUMN_NAME}`);
        });
        
        // Regarder quelques données
        console.log('\n=== EXEMPLE DE DONNÉES ===');
        const sample = await prisma.$queryRaw`SELECT TOP 3 * FROM THSCodes`;
        sample.forEach((data, index) => {
            console.log(`\nEnregistrement ${index + 1}:`);
            Object.keys(data).forEach(key => {
                console.log(`  ${key}: ${data[key]}`);
            });
        });
        
        // Vérifier si UploadKey existe déjà
        const hasUploadKey = columns.some(col => col.COLUMN_NAME === 'UploadKey');
        console.log(`\n=== VÉRIFICATION ===`);
        console.log(`UploadKey existe déjà: ${hasUploadKey}`);
        
        if (!hasUploadKey) {
            console.log('\n❌ Il faut ajouter la colonne UploadKey à la table THSCodes');
            console.log('SQL à exécuter:');
            console.log('ALTER TABLE THSCodes ADD UploadKey NVARCHAR(255) NULL;');
        } else {
            console.log('\n✅ La colonne UploadKey existe déjà');
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkHSCodesTable();