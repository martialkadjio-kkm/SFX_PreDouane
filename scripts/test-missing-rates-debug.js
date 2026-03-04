const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMissingRatesStructure() {
    try {
        console.log('🔍 Test de la structure des devises manquantes');
        
        // Test avec un dossier existant
        const dossierId = 1;
        
        // Récupérer les devises utilisées dans le dossier
        const devisesUtilisees = await prisma.$queryRaw`
            SELECT DISTINCT 
                cd.[Devise] as ID_Devise,
                d.[Code Devise] as Code_Devise,
                d.[Libelle Devise] as Libelle_Devise
            FROM TColisageDossiers cd
            INNER JOIN TDevises d ON cd.[Devise] = d.[ID Devise]
            WHERE cd.[Dossier] = ${dossierId}
        `;
        
        console.log('📊 Devises utilisées dans le dossier:', devisesUtilisees);
        
        // Simuler la structure des taux manquants
        const tauxManquants = devisesUtilisees.map(devise => ({
            deviseId: devise.ID_Devise,
            Code_Devise: devise.Code_Devise,
            Libelle_Devise: devise.Libelle_Devise,
        }));
        
        console.log('📋 Structure des taux manquants:', tauxManquants);
        
        // Vérifier les propriétés
        tauxManquants.forEach((rate, index) => {
            console.log(`   Rate ${index}:`, {
                deviseId: rate.deviseId,
                Code_Devise: rate.Code_Devise,
                Libelle_Devise: rate.Libelle_Devise,
                hasCode: !!rate.Code_Devise,
                hasLibelle: !!rate.Libelle_Devise
            });
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testMissingRatesStructure();