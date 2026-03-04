const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function fixMissingLocalCurrencyRate() {
    try {
        console.log("🔧 Correction du taux de change manquant pour la devise locale");
        
        // 1. Vérifier les conversions sans taux pour la devise locale (ID 0)
        const conversions = await prisma.$queryRaw`
            SELECT c.[ID Convertion], c.[Date Convertion], c.[Entite]
            FROM TConvertions c
            WHERE NOT EXISTS (
                SELECT 1 FROM TTauxChange tc 
                WHERE tc.[Convertion] = c.[ID Convertion] 
                AND tc.[Devise] = 0
            )
            ORDER BY c.[Date Convertion] DESC
        `;
        
        console.log(`📊 Conversions sans taux pour devise locale: ${conversions.length}`);
        
        if (conversions.length === 0) {
            console.log("✅ Toutes les conversions ont déjà un taux pour la devise locale");
            return;
        }
        
        // 2. Ajouter le taux 1.0 pour la devise locale dans chaque conversion
        for (const conversion of conversions) {
            console.log(`   Ajout taux devise locale pour conversion ${conversion['ID Convertion']}`);
            
            try {
                await prisma.$executeRaw`
                    INSERT INTO TTauxChange ([Convertion], [Devise], [Taux Change], [Session], [Date Creation])
                    VALUES (${conversion['ID Convertion']}, 0, 1.0, 1, GETDATE())
                `;
                console.log(`   ✅ Taux ajouté pour conversion ${conversion['ID Convertion']}`);
            } catch (error) {
                console.log(`   ❌ Erreur pour conversion ${conversion['ID Convertion']}: ${error.message}`);
            }
        }
        
        // 3. Tester à nouveau fx_TauxChangeDossier
        console.log("\n🧪 Test après correction:");
        
        const testConversion = conversions[0];
        const dossierId = 2; // Dossier de test
        
        const dateFormatted = testConversion['Date Convertion'].toISOString().replace('T', ' ').replace('Z', '');
        
        const result = await prisma.$queryRawUnsafe(`
            SELECT * FROM dbo.fx_TauxChangeDossier(${dossierId}, '${dateFormatted}')
        `);
        
        console.log(`✅ Résultats fx_TauxChangeDossier: ${result.length}`);
        result.forEach(r => {
            console.log(`    ${r.Code_Devise}: ${r.Taux_Change} (Conversion: ${r.ID_Convertion})`);
        });
        
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixMissingLocalCurrencyRate();