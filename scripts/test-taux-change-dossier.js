const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testGetTauxChangeDossier() {
    try {
        console.log('🧪 Test de getTauxChangeDossier\n');
        
        // Choisir un dossier existant
        const dossierId = 1;
        
        console.log(`📋 Test pour le dossier ${dossierId}\n`);
        
        // 1. Récupérer la date de conversion via raw SQL
        console.log('1️⃣ Récupération de la date de conversion...');
        const dossierData = await prisma.$queryRaw`
            SELECT d.[Convertion], c.[Date Convertion] as DateConvertion
            FROM TDossiers d
            LEFT JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
            WHERE d.[ID Dossier] = ${dossierId}
        `;
        
        if (!dossierData || dossierData.length === 0) {
            console.log('❌ Dossier non trouvé');
            return;
        }
        
        console.log('✅ Dossier trouvé:');
        console.log(`   Conversion ID: ${dossierData[0].Convertion}`);
        console.log(`   Date Conversion: ${dossierData[0].DateConvertion}\n`);
        
        const dateDeclaration = dossierData[0].DateConvertion;
        
        if (!dateDeclaration) {
            console.log('❌ Pas de date de conversion');
            return;
        }
        
        // 2. Appeler la fonction fx_TauxChangeDossier
        console.log('2️⃣ Appel de fx_TauxChangeDossier...');
        const tauxChange = await prisma.$queryRaw`
            SELECT 
                [ID_Devise],
                [Code_Devise],
                [Taux_Change],
                [ID_Convertion]
            FROM [dbo].[fx_TauxChangeDossier](${dossierId}, ${dateDeclaration})
        `;
        
        console.log(`✅ ${tauxChange.length} taux de change récupérés:\n`);
        
        tauxChange.forEach((taux) => {
            console.log(`   ${taux.Code_Devise}: ${taux.Taux_Change} (Conversion: ${taux.ID_Convertion})`);
        });
        
        // 3. Vérifier qu'il n'y a pas de taux NULL ou 0
        const tauxInvalides = tauxChange.filter(t => !t.Taux_Change || t.Taux_Change <= 0);
        if (tauxInvalides.length > 0) {
            console.log('\n⚠️  Taux invalides détectés:');
            tauxInvalides.forEach(t => {
                console.log(`   ${t.Code_Devise}: ${t.Taux_Change}`);
            });
        } else {
            console.log('\n✅ Tous les taux sont valides');
        }
        
        // 4. Tester le calcul de conversion
        console.log('\n3️⃣ Test de calcul de conversion...');
        const testValeur = 1000;
        console.log(`   Valeur test: ${testValeur}\n`);
        
        tauxChange.forEach((taux) => {
            const valeurConvertie = testValeur * (taux.Taux_Change || 0);
            console.log(`   ${testValeur} ${taux.Code_Devise} = ${valeurConvertie.toFixed(2)} (devise locale)`);
        });
        
        console.log('\n✅ Test terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testGetTauxChangeDossier();
