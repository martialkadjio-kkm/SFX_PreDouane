const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function addHSCode() {
    try {
        console.log('Vérification du HS Code 12345678...');
        
        // Vérifier si le HS Code existe déjà
        const existing = await prisma.tHSCodes.findFirst({
            where: { hsCode: '12345678' }
        });
        
        if (existing) {
            console.log('✅ Le HS Code 12345678 existe déjà:', existing);
            return;
        }
        
        // Créer le HS Code
        const newHSCode = await prisma.tHSCodes.create({
            data: {
                hsCode: '12345678',
                libelleHSCode: 'Code HS de test pour import',
                session: 1,
                dateCreation: new Date()
            }
        });
        
        console.log('✅ HS Code créé avec succès:', newHSCode);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addHSCode();
