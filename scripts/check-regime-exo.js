const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkRegimeEXO() {
    try {
        console.log("🔍 Vérification du régime EXO...\n");

        // Chercher le régime EXO
        const regimeEXO = await prisma.tRegimesDeclarations.findFirst({
            where: {
                libelleRegimeDeclaration: 'EXO'
            }
        });

        if (!regimeEXO) {
            console.log("❌ Le régime EXO n'existe pas dans TRegimesDeclarations");
            return;
        }

        console.log("✅ Régime EXO trouvé:");
        console.log(`   ID: ${regimeEXO.id}`);
        console.log(`   Libellé: ${regimeEXO.libelleRegimeDeclaration}`);
        console.log(`   Taux DC: ${regimeEXO.tauxDC}`);
        console.log(`   Régime Douanier: ${regimeEXO.regimeDouanier}`);

        // Vérifier les associations client
        const associations = await prisma.tRegimesClients.findMany({
            where: {
                regimeDeclaration: regimeEXO.id
            },
            include: {
                tClients: {
                    select: {
                        id: true,
                        nomClient: true
                    }
                }
            }
        });

        console.log(`\n📋 Associations client-régime (${associations.length}):`);
        if (associations.length === 0) {
            console.log("   ⚠️  Aucune association trouvée - le régime n'est associé à aucun client");
        } else {
            associations.forEach(assoc => {
                console.log(`   - Client ${assoc.client}: ${assoc.tClients.nomClient}`);
            });
        }

        // Tester la fonction SQL
        console.log("\n🧪 Test de la fonction SQL fx_IDs_RegimesDeclarations:");
        const clientId = 1; // ID du client de test
        const result = await prisma.$queryRawUnsafe(
            `SELECT [ID], [Taux_DC] FROM [dbo].[fx_IDs_RegimesDeclarations](${clientId}, '0', '|', 0)`
        );
        
        console.log(`   Client ID: ${clientId}`);
        console.log(`   Taux DC recherché: 0`);
        console.log(`   Résultat:`, result);

        if (result.length === 0) {
            console.log("\n❌ La fonction SQL ne retourne rien pour le taux DC 0%");
            console.log("   Solution: Créer l'association dans TRegimesClients");
            
            // Proposer de créer l'association
            const existingAssoc = await prisma.tRegimesClients.findFirst({
                where: {
                    client: clientId,
                    regimeDeclaration: regimeEXO.id
                }
            });

            if (!existingAssoc) {
                console.log("\n💡 Voulez-vous créer l'association ? (Exécutez ce script avec --create)");
            } else {
                console.log("\n✅ L'association existe déjà pour ce client");
            }
        } else {
            console.log("\n✅ La fonction SQL fonctionne correctement");
        }

    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

async function createAssociation() {
    try {
        const clientId = 1;
        
        const regimeEXO = await prisma.tRegimesDeclarations.findFirst({
            where: { libelleRegimeDeclaration: 'EXO' }
        });

        if (!regimeEXO) {
            console.log("❌ Régime EXO non trouvé");
            return;
        }

        const existing = await prisma.tRegimesClients.findFirst({
            where: {
                client: clientId,
                regimeDeclaration: regimeEXO.id
            }
        });

        if (existing) {
            console.log("✅ L'association existe déjà");
            return;
        }

        await prisma.tRegimesClients.create({
            data: {
                client: clientId,
                regimeDeclaration: regimeEXO.id,
                session: clientId,
                dateCreation: new Date()
            }
        });

        console.log("✅ Association créée avec succès");
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter
const args = process.argv.slice(2);
if (args.includes('--create')) {
    createAssociation();
} else {
    checkRegimeEXO();
}
