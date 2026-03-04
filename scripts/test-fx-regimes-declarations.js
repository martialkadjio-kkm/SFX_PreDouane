const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testFxRegimesDeclarations() {
    try {
        const clientId = 2; // Le client Edwin Fom
        
        console.log("🧪 Test de la fonction fx_IDs_RegimesDeclarations\n");
        
        // Test 1: Chercher le taux DC 0
        console.log("Test 1: Taux DC = 0");
        const result1 = await prisma.$queryRawUnsafe(
            `SELECT [ID], [Taux_DC] FROM [dbo].[fx_IDs_RegimesDeclarations](${clientId}, '0', '|', 0)`
        );
        console.log("Résultat:", result1);
        
        // Test 2: Chercher le taux DC 0.0
        console.log("\nTest 2: Taux DC = 0.0");
        const result2 = await prisma.$queryRawUnsafe(
            `SELECT [ID], [Taux_DC] FROM [dbo].[fx_IDs_RegimesDeclarations](${clientId}, '0.0', '|', 0)`
        );
        console.log("Résultat:", result2);
        
        // Test 3: Chercher le taux DC 0.000
        console.log("\nTest 3: Taux DC = 0.000");
        const result3 = await prisma.$queryRawUnsafe(
            `SELECT [ID], [Taux_DC] FROM [dbo].[fx_IDs_RegimesDeclarations](${clientId}, '0.000', '|', 0)`
        );
        console.log("Résultat:", result3);
        
        // Vérifier les associations existantes
        console.log("\n📋 Associations TRegimesClients pour le client", clientId);
        const associations = await prisma.tRegimesClients.findMany({
            where: { client: clientId },
            include: {
                tRegimesDeclarations: {
                    select: {
                        id: true,
                        libelleRegimeDeclaration: true,
                        tauxDC: true
                    }
                }
            }
        });
        
        console.log(`\nTrouvé ${associations.length} association(s):`);
        associations.forEach(assoc => {
            console.log(`  - Régime ID: ${assoc.regimeDeclaration}, Libellé: ${assoc.tRegimesDeclarations.libelleRegimeDeclaration}, Taux DC: ${assoc.tRegimesDeclarations.tauxDC}`);
        });
        
        // Vérifier le régime EXO spécifiquement
        console.log("\n🔍 Régime EXO:");
        const regimeEXO = await prisma.tRegimesDeclarations.findFirst({
            where: { libelleRegimeDeclaration: 'EXO' }
        });
        
        if (regimeEXO) {
            console.log(`  ID: ${regimeEXO.id}`);
            console.log(`  Taux DC: ${regimeEXO.tauxDC}`);
            console.log(`  Taux DC (string): "${regimeEXO.tauxDC.toString()}"`);
            console.log(`  Taux DC (number): ${parseFloat(regimeEXO.tauxDC.toString())}`);
            
            // Vérifier l'association
            const assocEXO = await prisma.tRegimesClients.findFirst({
                where: {
                    client: clientId,
                    regimeDeclaration: regimeEXO.id
                }
            });
            console.log(`  Associé au client ${clientId}: ${assocEXO ? 'OUI (ID: ' + assocEXO.id + ')' : 'NON'}`);
        } else {
            console.log("  ❌ Régime EXO non trouvé");
        }
        
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testFxRegimesDeclarations();
