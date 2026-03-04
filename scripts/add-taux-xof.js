const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function addTauxXOF() {
    try {
        const conversionId = 1;
        const deviseXOF = 153;
        const taux = 1; // Devise locale = taux 1
        
        console.log('Ajout du taux XOF...\n');
        
        // Trouver un utilisateur
        const user = await prisma.tUtilisateurs.findFirst({
            orderBy: { id: 'asc' }
        });
        
        if (!user) {
            console.error('❌ Aucun utilisateur trouvé!');
            return;
        }
        
        // Vérifier si le taux existe déjà
        const existing = await prisma.tTauxChange.findFirst({
            where: {
                convertion: conversionId,
                devise: deviseXOF
            }
        });
        
        if (existing) {
            console.log('⏭️  Le taux XOF existe déjà');
            return;
        }
        
        // Créer le taux
        const tauxChange = await prisma.tTauxChange.create({
            data: {
                convertion: conversionId,
                devise: deviseXOF,
                tauxChange: taux,
                session: user.id,
                dateCreation: new Date()
            }
        });
        
        console.log(`✅ Taux XOF créé (ID: ${tauxChange.id}, Taux: ${taux})`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addTauxXOF();
