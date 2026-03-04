const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkStructureVues() {
    try {
        console.log('=== STRUCTURE DES VUES ===\n');
        
        const vues = ['VHSCodes', 'VDevises', 'VPays', 'VRegimesDeclarations'];
        
        for (const vue of vues) {
            console.log(`--- ${vue} ---`);
            try {
                const columns = await prisma.$queryRaw`
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = ${vue}
                    ORDER BY ORDINAL_POSITION
                `;
                
                console.log('Colonnes:');
                columns.forEach((col, index) => {
                    console.log(`  ${index + 1}. ${col.COLUMN_NAME}`);
                });
                
                // Exemple de données
                const sample = await prisma.$queryRaw`SELECT TOP 1 * FROM ${vue}`;
                if (sample.length > 0) {
                    console.log('Exemple de données:');
                    Object.keys(sample[0]).forEach(key => {
                        console.log(`  ${key}: ${sample[0][key]}`);
                    });
                }
                
            } catch (error) {
                console.log(`❌ Erreur pour ${vue}: ${error.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkStructureVues();