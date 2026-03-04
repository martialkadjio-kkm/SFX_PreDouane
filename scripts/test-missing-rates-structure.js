const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testMissingRatesStructure() {
    try {
        console.log("🧪 Test de la structure des taux manquants");
        
        // Simuler la requête pour récupérer les devises utilisées dans un dossier
        const dossierId = 2; // Dossier de test
        
        const devisesUtilisees = await prisma.$queryRaw`
            SELECT DISTINCT 
                cd.[Devise] as ID_Devise,
                d.[Code Devise] as Code_Devise,
                d.[Libelle Devise] as Libelle_Devise
            FROM TColisageDossiers cd
            INNER JOIN TDevises d ON cd.[Devise] = d.[ID Devise]
            WHERE cd.[Dossier] = ${dossierId}
        `;
        
        console.log("\n📋 Devises utilisées dans le dossier:");
        devisesUtilisees.forEach(d => {
            console.log(`  ID: ${d.ID_Devise}`);
            console.log(`  Code_Devise: "${d.Code_Devise}"`);
            console.log(`  Libelle_Devise: "${d.Libelle_Devise}"`);
            console.log(`  Toutes les propriétés:`, Object.keys(d));
            console.log(`  ---`);
        });
        
        // Simuler la structure des taux manquants
        const tauxManquants = [];
        for (const devise of devisesUtilisees) {
            // Supposons que tous les taux sont manquants pour le test
            tauxManquants.push({
                deviseId: devise.ID_Devise,
                Code_Devise: devise.Code_Devise,
                Libelle_Devise: devise.Libelle_Devise,
            });
        }
        
        console.log("\n📊 Structure des taux manquants:");
        console.log(JSON.stringify(tauxManquants, null, 2));
        
        // Vérifier que les propriétés sont correctes
        console.log("\n✅ Vérification des propriétés:");
        tauxManquants.forEach((taux, index) => {
            console.log(`  Taux ${index + 1}:`);
            console.log(`    deviseId: ${taux.deviseId} (${typeof taux.deviseId})`);
            console.log(`    Code_Devise: "${taux.Code_Devise}" (${typeof taux.Code_Devise})`);
            console.log(`    Libelle_Devise: "${taux.Libelle_Devise}" (${typeof taux.Libelle_Devise})`);
        });
        
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testMissingRatesStructure();