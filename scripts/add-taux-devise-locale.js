const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function addTauxDeviseLocale() {
    try {
        const conversionId = 1;
        const deviseLocale = 0; // LOCAL CURRENCY
        const taux = 1; // Devise locale = taux 1
        
        console.log('Ajout du taux pour la devise locale (ID: 0)...\n');
        
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
                devise: deviseLocale
            }
        });
        
        if (existing) {
            console.log('⏭️  Le taux pour la devise locale existe déjà');
            return;
        }
        
        // Créer le taux
        const tauxChange = await prisma.tTauxChange.create({
            data: {
                convertion: conversionId,
                devise: deviseLocale,
                tauxChange: taux,
                session: user.id,
                dateCreation: new Date()
            }
        });
        
        console.log(`✅ Taux devise locale créé (ID: ${tauxChange.id}, Taux: ${taux})`);
        
        // Tester la fonction maintenant
        console.log('\nTest de fx_TauxChangeDossier:');
        const result = await prisma.$queryRaw`
            SELECT * FROM dbo.fx_TauxChangeDossier(1, '2025-12-08')
        `;
        console.log(`✅ ${result.length} devise(s) retournée(s)`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addTauxDeviseLocale();
