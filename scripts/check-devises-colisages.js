const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkDevisesColisages() {
    try {
        const dossierId = 1;
        const conversionId = 1; // Conversion du 2025-12-08
        
        console.log('Vérification des devises des colisages...\n');
        
        // Devises utilisées dans les colisages
        const devises = await prisma.$queryRaw`
            SELECT DISTINCT 
                c.Devise as ID_Devise,
                d.[Code Devise] as Code_Devise
            FROM TColisageDossiers c
            INNER JOIN TDevises d ON c.Devise = d.[ID Devise]
            WHERE c.Dossier = ${dossierId}
        `;
        
        console.log(`Devises utilisées dans les colisages: ${devises.length}\n`);
        devises.forEach(d => {
            console.log(`  - Devise ${d.ID_Devise}: ${d.Code_Devise}`);
        });
        
        // Taux de change disponibles pour cette conversion
        console.log(`\nTaux de change pour la conversion ${conversionId}:`);
        const taux = await prisma.tTauxChange.findMany({
            where: {
                convertion: conversionId
            },
            select: {
                devise: true,
                tauxChange: true,
                tDevises: {
                    select: {
                        codeDevise: true
                    }
                }
            }
        });
        
        if (taux.length === 0) {
            console.log('  ❌ Aucun taux de change défini pour cette conversion!');
            console.log('\n💡 Vous devez ajouter des taux de change pour cette conversion.');
            return;
        }
        
        taux.forEach(t => {
            console.log(`  - Devise ${t.devise} (${t.tDevises.codeDevise}): ${t.tauxChange}`);
        });
        
        // Vérifier les devises manquantes
        console.log('\nVérification des devises manquantes:');
        const tauxMap = new Map(taux.map(t => [t.devise, t.tauxChange]));
        
        let missing = false;
        devises.forEach(d => {
            if (!tauxMap.has(d.ID_Devise)) {
                console.log(`  ❌ Taux manquant pour ${d.Code_Devise} (ID: ${d.ID_Devise})`);
                missing = true;
            } else {
                console.log(`  ✅ ${d.Code_Devise}: ${tauxMap.get(d.ID_Devise)}`);
            }
        });
        
        if (missing) {
            console.log('\n💡 Ajoutez les taux manquants dans le module Conversion.');
        } else {
            console.log('\n✅ Tous les taux sont disponibles!');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDevisesColisages();
