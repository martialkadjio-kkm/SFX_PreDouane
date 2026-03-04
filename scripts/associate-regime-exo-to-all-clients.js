const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function associateEXOToAllClients() {
    try {
        console.log("🔍 Association du régime EXO à tous les clients...\n");

        // Trouver le régime EXO
        const regimeEXO = await prisma.tRegimesDeclarations.findFirst({
            where: { libelleRegimeDeclaration: 'EXO' }
        });

        if (!regimeEXO) {
            console.log("❌ Régime EXO non trouvé");
            return;
        }

        console.log(`✅ Régime EXO trouvé (ID: ${regimeEXO.id}, Taux DC: ${regimeEXO.tauxDC})`);

        // Trouver tous les clients
        const clients = await prisma.tClients.findMany({
            select: {
                id: true,
                nomClient: true
            }
        });

        console.log(`\n📋 ${clients.length} client(s) trouvé(s)\n`);

        let created = 0;
        let skipped = 0;

        for (const client of clients) {
            // Vérifier si l'association existe déjà
            const existing = await prisma.tRegimesClients.findFirst({
                where: {
                    client: client.id,
                    regimeDeclaration: regimeEXO.id
                }
            });

            if (existing) {
                console.log(`⏭️  Client ${client.id} (${client.nomClient}): déjà associé`);
                skipped++;
            } else {
                await prisma.tRegimesClients.create({
                    data: {
                        client: client.id,
                        regimeDeclaration: regimeEXO.id,
                        session: client.id,
                        dateCreation: new Date()
                    }
                });
                console.log(`✅ Client ${client.id} (${client.nomClient}): association créée`);
                created++;
            }
        }

        console.log(`\n📊 Résumé:`);
        console.log(`   ✅ ${created} association(s) créée(s)`);
        console.log(`   ⏭️  ${skipped} association(s) déjà existante(s)`);

        // Tester avec le premier client
        if (clients.length > 0) {
            const testClientId = clients[0].id;
            console.log(`\n🧪 Test avec le client ${testClientId}:`);
            const result = await prisma.$queryRawUnsafe(
                `SELECT [ID], [Taux_DC] FROM [dbo].[fx_IDs_RegimesDeclarations](${testClientId}, '0', '|', 0)`
            );
            console.log(`   Résultat:`, result);
            if (result.length > 0) {
                console.log(`   ✅ La fonction SQL fonctionne maintenant !`);
            } else {
                console.log(`   ❌ La fonction SQL ne retourne toujours rien`);
            }
        }

    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

associateEXOToAllClients();
