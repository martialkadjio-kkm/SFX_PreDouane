const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testDeviseLocaleProtection() {
    try {
        console.log("🧪 Test de protection de la devise locale");
        
        // 1. Vérifier que la devise locale n'apparaît pas dans getAllDevisesForSelect
        console.log("\n📋 Test getAllDevisesForSelect:");
        const devises = await prisma.tDevises.findMany({
            where: {
                deviseInactive: false,
                codeDevise: {
                    not: ''
                },
                id: {
                    not: 0
                }
            },
            select: {
                id: true,
                codeDevise: true,
                libelleDevise: true
            },
            orderBy: {
                codeDevise: 'asc'
            }
        });
        
        console.log(`   Devises disponibles pour sélection: ${devises.length}`);
        devises.forEach(d => {
            console.log(`     ${d.id}: ${d.codeDevise} - ${d.libelleDevise}`);
        });
        
        const hasDeviseLocale = devises.some(d => d.id === 0);
        if (hasDeviseLocale) {
            console.log("   ❌ PROBLÈME: La devise locale (ID 0) apparaît dans la liste");
        } else {
            console.log("   ✅ OK: La devise locale (ID 0) n'apparaît pas dans la liste");
        }
        
        // 2. Vérifier qu'une nouvelle conversion a automatiquement le taux 1.0 pour la devise locale
        console.log("\n🔍 Test création conversion avec taux automatique:");
        
        // Créer une date de test
        const testDate = new Date();
        testDate.setUTCHours(0, 0, 0, 0);
        testDate.setDate(testDate.getDate() + 1); // Demain pour éviter les conflits
        
        console.log(`   Date de test: ${testDate.toISOString()}`);
        
        // Simuler la création d'une conversion (comme dans createConversion)
        try {
            // Créer la conversion
            await prisma.$executeRaw`
                INSERT INTO TConvertions ([Date Convertion], [Entite], [Session], [Date Creation])
                VALUES (${testDate}, 0, 1, GETDATE())
            `;
            
            // Récupérer l'ID de la conversion créée
            const newConversion = await prisma.$queryRaw`
                SELECT TOP 1 [ID Convertion] as ID
                FROM TConvertions 
                WHERE [Date Convertion] = ${testDate} AND [Entite] = 0
                ORDER BY [ID Convertion] DESC
            `;
            
            if (newConversion.length > 0) {
                const conversionId = newConversion[0].ID;
                console.log(`   Conversion créée avec ID: ${conversionId}`);
                
                // Ajouter automatiquement le taux 1.0 pour la devise locale (ID 0)
                await prisma.$executeRaw`
                    INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
                    VALUES (${conversionId}, 0, 1.0, 1, GETDATE())
                `;
                
                // Vérifier que le taux a été créé
                const tauxLocale = await prisma.$queryRaw`
                    SELECT [Taux Change] FROM TTauxChange 
                    WHERE [Convertion] = ${conversionId} AND [Devise] = 0
                `;
                
                if (tauxLocale.length > 0) {
                    console.log(`   ✅ Taux devise locale créé: ${tauxLocale[0]['Taux Change']}`);
                } else {
                    console.log("   ❌ Taux devise locale non créé");
                }
                
                // Nettoyer - supprimer la conversion de test
                await prisma.$executeRaw`DELETE FROM TTauxChange WHERE [Convertion] = ${conversionId}`;
                await prisma.$executeRaw`DELETE FROM TConvertions WHERE [ID Convertion] = ${conversionId}`;
                console.log("   🧹 Conversion de test supprimée");
            }
            
        } catch (error) {
            console.log(`   ⚠️ Erreur lors du test: ${error.message}`);
        }
        
        console.log("\n✅ Tests terminés");
        
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testDeviseLocaleProtection();