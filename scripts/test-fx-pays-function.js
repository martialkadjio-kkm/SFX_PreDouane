const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testFxPaysFunction() {
    try {
        console.log("🧪 Test de la fonction fx_IDs_Pays");
        
        // Test avec les pays du fichier Excel
        const paysToTest = ['CM', 'NEWCOUNTRY', 'TESTLAND', 'GB', 'JP'];
        const paysConcatenated = paysToTest.join('|');
        
        console.log("📋 Pays à tester:", paysToTest);
        console.log("🔗 Chaîne concaténée:", paysConcatenated);
        
        const result = await prisma.$queryRawUnsafe(
            `SELECT [ID], [Name] FROM [dbo].[fx_IDs_Pays]('${paysConcatenated}', '|')`
        );
        
        console.log("✅ Résultat de la fonction:", result);
        
        const foundPays = new Set(result.map(p => p.Name));
        const missingPays = paysToTest.filter(p => !foundPays.has(p));
        
        console.log("🔍 Pays trouvés:", Array.from(foundPays));
        console.log("❌ Pays manquants:", missingPays);
        
        // Test individuel pour chaque pays
        console.log("\n🔍 Test individuel:");
        for (const pays of paysToTest) {
            const individualResult = await prisma.$queryRawUnsafe(
                `SELECT [ID], [Name] FROM [dbo].[fx_IDs_Pays]('${pays}', '|')`
            );
            console.log(`  ${pays}:`, individualResult.length > 0 ? "✅ Trouvé" : "❌ Manquant", individualResult);
        }
        
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testFxPaysFunction();