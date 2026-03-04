const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testDatesAlignment() {
    try {
        console.log("🧪 Test d'alignement des dates pour fx_TauxChangeDossier");
        
        // 1. Vérifier les dates dans TConvertions avec format SQL
        console.log("\n📅 Dates dans TConvertions:");
        const conversions = await prisma.$queryRaw`
            SELECT [ID Convertion], 
                   [Date Convertion], 
                   CONVERT(varchar, [Date Convertion], 120) as DateFormatted,
                   [Entite]
            FROM TConvertions
            ORDER BY [Date Convertion] DESC
        `;
        
        conversions.forEach(conv => {
            console.log(`  ID ${conv['ID Convertion']}: ${conv.DateFormatted} (Entité: ${conv.Entite})`);
        });
        
        // 2. Vérifier les dossiers existants
        console.log("\n📁 Dossiers existants:");
        const dossiers = await prisma.$queryRaw`
            SELECT TOP 5 [ID Dossier], [Description Dossier]
            FROM TDossiers
            ORDER BY [ID Dossier]
        `;
        
        dossiers.forEach(d => {
            console.log(`  Dossier ${d['ID Dossier']}: ${d['Description Dossier']}`);
        });
        
        if (dossiers.length === 0) {
            console.log("⚠️ Aucun dossier trouvé");
            return;
        }
        
        const dossierId = dossiers[0]['ID Dossier'];
        console.log(`\n🎯 Test avec dossier ID: ${dossierId}`);
        
        // Vérifier les colisages de ce dossier
        const colisages = await prisma.$queryRaw`
            SELECT COUNT(*) as NbColisages,
                   COUNT(DISTINCT [Devise]) as NbDevises
            FROM TColisageDossiers
            WHERE [Dossier] = ${dossierId}
        `;
        
        console.log(`   Colisages: ${colisages[0].NbColisages}, Devises: ${colisages[0].NbDevises}`);
        
        // Vérifier l'entité du dossier
        const dossierInfo = await prisma.$queryRaw`
            SELECT d.[ID Dossier], 
                   b.[Entite] as EntiteBranche,
                   e.[ID Entite], e.[Nom Entite],
                   p.[ID Pays], p.[Libelle Pays]
            FROM TDossiers d
            INNER JOIN TBranches b ON d.[Branche] = b.[ID Branche]
            INNER JOIN TEntites e ON b.[Entite] = e.[ID Entite]
            INNER JOIN TPays p ON e.[Pays] = p.[ID Pays]
            WHERE d.[ID Dossier] = ${dossierId}
        `;
        
        if (dossierInfo.length > 0) {
            const info = dossierInfo[0];
            console.log(`   Entité dossier: ${info['ID Entite']} (${info['Nom Entite']})`);
            console.log(`   Pays: ${info['ID Pays']} (${info['Libelle Pays']})`);
            
            // Vérifier si la conversion est pour la bonne entité
            const conversionEntite = conversions[0].Entite;
            console.log(`   Entité conversion: ${conversionEntite}`);
            
            if (info['ID Entite'] !== conversionEntite) {
                console.log(`   ⚠️ PROBLÈME: Entité dossier (${info['ID Entite']}) ≠ Entité conversion (${conversionEntite})`);
            }
            
            // Vérifier la devise locale du pays
            const paysInfo = await prisma.$queryRaw`
                SELECT [ID Pays], [Libelle Pays], [Devise Locale]
                FROM TPays
                WHERE [ID Pays] = ${info['ID Pays']}
            `;
            
            console.log(`   Pays info:`, paysInfo[0]);
            
            const paysDevise = await prisma.$queryRaw`
                SELECT p.[ID Pays], p.[Libelle Pays], 
                       p.[Devise Locale], d.[Code Devise], d.[Libelle Devise]
                FROM TPays p
                INNER JOIN TDevises d ON p.[Devise Locale] = d.[ID Devise]
                WHERE p.[ID Pays] = ${info['ID Pays']}
            `;
            
            console.log(`   Résultat jointure pays-devise:`, paysDevise);
            
            if (paysDevise.length > 0) {
                const devise = paysDevise[0];
                console.log(`   Devise locale: ${devise['ID Devise']} (${devise['Code Devise']} - ${devise['Libelle Devise']})`);
                
                // Vérifier si cette devise a un taux dans la conversion
                const tauxDeviseLocale = await prisma.$queryRaw`
                    SELECT tc.[Taux Change]
                    FROM TTauxChange tc
                    WHERE tc.[Convertion] = ${conversions[0]['ID Convertion']}
                      AND tc.[Devise] = ${devise['Devise Locale']}
                `;
                
                if (tauxDeviseLocale.length > 0) {
                    console.log(`   Taux devise locale: ${tauxDeviseLocale[0]['Taux Change']}`);
                } else {
                    console.log(`   ⚠️ PROBLÈME: Pas de taux pour la devise locale ${devise['Code Devise']}`);
                }
            } else {
                // Vérifier toutes les devises disponibles
                console.log(`\n💰 Devises disponibles:`);
                const toutesDevises = await prisma.$queryRaw`
                    SELECT [ID Devise], [Code Devise], [Libelle Devise]
                    FROM TDevises
                    ORDER BY [ID Devise]
                `;
                
                toutesDevises.forEach(d => {
                    console.log(`    ID ${d['ID Devise']}: ${d['Code Devise']} - ${d['Libelle Devise']}`);
                });
                
                // Le problème est que la devise locale ID 0 n'existe pas
                // Il faut soit créer une devise ID 0, soit changer la devise locale du pays
                console.log(`\n🔧 SOLUTION: Mettre à jour la devise locale du pays DEFAULT COUNTRY`);
                console.log(`   Exemple: UPDATE TPays SET [Devise Locale] = 1 WHERE [ID Pays] = 0`);
            }
        }
        
        if (conversions.length > 0) {
            const testDate = conversions[0]['Date Convertion'];
            console.log(`\n🔍 Test fx_TauxChangeDossier avec la date: ${testDate}`);
            
            // Formater correctement la date pour SQL Server
            const dateFormatted = testDate.toISOString().replace('T', ' ').replace('Z', '');
            console.log(`   Date formatée pour SQL: ${dateFormatted}`);
            
            // Test 1: Date exacte de la base de données
            const exactDate = conversions[0].DateFormatted;
            try {
                const result1 = await prisma.$queryRawUnsafe(`
                    SELECT * FROM dbo.fx_TauxChangeDossier(${dossierId}, '${exactDate}')
                `);
                console.log("✅ Test avec date exacte BD:", result1.length, "résultats");
                result1.forEach(r => {
                    console.log(`    ${r.Code_Devise}: ${r.Taux_Change} (Conversion: ${r.ID_Convertion})`);
                });
            } catch (error) {
                console.log("❌ Erreur avec date exacte BD:", error.message);
            }
            
            // Test 2: Date formatée YYYY-MM-DD 00:00:00.000
            const dateOnly = testDate.toISOString().split('T')[0];
            const dateWithTime = `${dateOnly} 00:00:00.000`;
            console.log(`   Date avec heure 00:00:00: ${dateWithTime}`);
            
            try {
                const result2 = await prisma.$queryRawUnsafe(`
                    SELECT * FROM dbo.fx_TauxChangeDossier(${dossierId}, '${dateWithTime}')
                `);
                console.log("✅ Test avec 00:00:00:", result2.length, "résultats");
                result2.forEach(r => {
                    console.log(`    ${r.Code_Devise}: ${r.Taux_Change} (Conversion: ${r.ID_Convertion})`);
                });
            } catch (error) {
                console.log("❌ Erreur avec 00:00:00:", error.message);
            }
            
            // Test 3: Vérifier les taux de change pour cette conversion
            const conversionId = conversions[0]['ID Convertion'];
            try {
                const tauxChange = await prisma.$queryRaw`
                    SELECT tc.[Devise], d.[Code Devise], tc.[Taux Change]
                    FROM TTauxChange tc
                    INNER JOIN TDevises d ON tc.[Devise] = d.[ID Devise]
                    WHERE tc.[Convertion] = ${conversionId}
                `;
                console.log(`\n💱 Taux de change pour la conversion ${conversionId}:`);
                tauxChange.forEach(t => {
                    console.log(`    ${t['Code Devise']}: ${t['Taux Change']}`);
                });
            } catch (error) {
                console.log("❌ Erreur récupération taux:", error.message);
            }
        } else {
            console.log("⚠️ Aucune conversion trouvée pour les tests");
        }
        
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testDatesAlignment();