const prisma = require('../src/lib/prisma').default;

async function checkRegimeAssociations() {
    try {
        // Trouver le client Edwin Fom
        const client = await prisma.tClients.findFirst({
            where: { nomClient: { contains: 'Edwin' } },
            select: { id: true, nomClient: true }
        });
        
        console.log('Client:', client);
        
        if (!client) {
            console.log('Client Edwin Fom non trouvé');
            return;
        }
        
        // Tester la fonction SQL avec les taux DC
        const regimes = await prisma.$queryRawUnsafe(
            `SELECT [ID], [Taux_DC] FROM [dbo].[fx_IDs_RegimesDeclarations](${client.id}, '0.7000|0.5000|0.8000|0.2500', '|', 0)`
        );
        console.log('\nRégimes trouvés par fx_IDs_RegimesDeclarations:', regimes);
        
        // Vérifier si les régimes existent dans la BD
        const allRegimes = await prisma.tRegimesDeclarations.findMany({
            where: {
                libelleRegimeDeclaration: {
                    in: [
                        'IM4 30% TR et 70% DC',
                        'IM4 50% TR et 50% DC',
                        'IM4 20% TR et 80% DC',
                        'IM4 75% TR et 25% DC'
                    ]
                }
            },
            select: { id: true, libelleRegimeDeclaration: true, tauxDc: true }
        });
        console.log('\nRégimes dans la BD:', allRegimes);
        
        // Vérifier les associations existantes
        if (allRegimes.length > 0) {
            const associations = await prisma.tClientsRegimesDeclarations.findMany({
                where: {
                    client: client.id,
                    regimeDeclaration: { in: allRegimes.map(r => r.id) }
                },
                select: { id: true, client: true, regimeDeclaration: true }
            });
            console.log('\nAssociations existantes:', associations);
        }
        
    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRegimeAssociations();
