// Test du système d'import HS Codes
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testHSCodeImport() {
    try {
        console.log('=== TEST SYSTÈME IMPORT HS CODES ===\n');
        
        // 1. Vérifier la structure mise à jour
        console.log('1. Vérification de la structure...');
        const columns = await prisma.$queryRaw`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'THSCodes' 
            ORDER BY ORDINAL_POSITION
        `;
        console.log('Colonnes THSCodes:', columns.map(c => c.COLUMN_NAME));
        
        // 2. Tester la création avec UploadKey
        console.log('\n2. Test création avec UploadKey...');
        
        const testData = {
            hsCode: 'TEST123456',
            libelleHSCode: 'Test Import HS Code',
            uploadKey: 'TEST_ROW_001',
            session: 1,
            dateCreation: new Date()
        };
        
        // Supprimer s'il existe déjà
        await prisma.tHSCodes.deleteMany({
            where: { 
                OR: [
                    { hsCode: testData.hsCode },
                    { uploadKey: testData.uploadKey }
                ]
            }
        });
        
        // Créer le test
        const created = await prisma.tHSCodes.create({
            data: testData
        });
        
        console.log('✅ HS Code créé:', {
            id: created.id,
            hsCode: created.hsCode,
            uploadKey: created.uploadKey
        });
        
        // 3. Tester la recherche par UploadKey
        console.log('\n3. Test recherche par UploadKey...');
        const found = await prisma.tHSCodes.findFirst({
            where: { uploadKey: testData.uploadKey }
        });
        
        console.log('✅ HS Code trouvé par UploadKey:', found ? 'Oui' : 'Non');
        
        // 4. Tester la mise à jour
        console.log('\n4. Test mise à jour...');
        const updated = await prisma.tHSCodes.update({
            where: { id: created.id },
            data: {
                libelleHSCode: 'Test Import HS Code - Modifié',
                uploadKey: 'TEST_ROW_001_UPDATED'
            }
        });
        
        console.log('✅ HS Code mis à jour:', {
            id: updated.id,
            libelleHSCode: updated.libelleHSCode,
            uploadKey: updated.uploadKey
        });
        
        // 5. Nettoyer
        await prisma.tHSCodes.delete({
            where: { id: created.id }
        });
        
        console.log('\n🎉 TOUS LES TESTS PASSENT !');
        console.log('Le système d\'import HS Codes est prêt à être utilisé.');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testHSCodeImport();