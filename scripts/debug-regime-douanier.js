const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRegimeDouanier() {
    try {
        console.log('🔍 Debug des régimes douaniers disponibles');
        
        // Lister tous les régimes douaniers
        const regimes = await prisma.$queryRaw`
            SELECT [ID Regime Douanier], [Code Regime Douanier], [Libelle Regime Douanier]
            FROM TRegimesDouaniers
            ORDER BY [ID Regime Douanier]
        `;
        
        console.log('📊 Régimes douaniers disponibles:');
        regimes.forEach(regime => {
            console.log(`   ID: ${regime['ID Regime Douanier']}, Code: "${regime['Code Regime Douanier']}", Libellé: "${regime['Libelle Regime Douanier']}"`);
        });
        
        // Vérifier s'il y a un régime avec ID 0
        const regime0 = regimes.find(r => r['ID Regime Douanier'] === 0);
        console.log('\n🎯 Régime avec ID 0:', regime0 ? 'TROUVÉ' : 'NON TROUVÉ');
        if (regime0) {
            console.log(`   Code: "${regime0['Code Regime Douanier']}", Libellé: "${regime0['Libelle Regime Douanier']}"`);
        }
        
        // Vérifier les contraintes sur la table TRegimesDeclarations
        console.log('\n🔍 Vérification des contraintes CHECK sur TRegimesDeclarations...');
        const constraints = await prisma.$queryRaw`
            SELECT 
                cc.CONSTRAINT_NAME,
                cc.CHECK_CLAUSE
            FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
            INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_TABLE_USAGE ctu 
                ON cc.CONSTRAINT_NAME = ctu.CONSTRAINT_NAME
            WHERE ctu.TABLE_NAME = 'TRegimesDeclarations'
        `;
        
        console.log('📋 Contraintes CHECK trouvées:');
        constraints.forEach(constraint => {
            console.log(`   ${constraint.CONSTRAINT_NAME}: ${constraint.CHECK_CLAUSE}`);
        });
        
        // Tester quelques valeurs de taux DC
        console.log('\n🧪 Test des valeurs de taux DC...');
        const testValues = [0, 25, 50, 75, 100, 101, -1];
        
        for (const testValue of testValues) {
            try {
                // Simuler la validation sans insérer
                process.stdout.write(`   Taux DC ${testValue}: `);
                
                // Vérifier si la valeur respecte les contraintes logiques
                if (testValue >= 0 && testValue <= 100) {
                    console.log('✅ VALIDE (logiquement)');
                } else {
                    console.log('❌ INVALIDE (hors limites 0-100)');
                }
            } catch (error) {
                console.log(`❌ ERREUR: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugRegimeDouanier();