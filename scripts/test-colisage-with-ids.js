const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testColisageWithIds() {
    try {
        console.log('=== TEST RÉSOLUTION DES IDS ===\n');
        
        const colisageId = 4; // Premier colisage de test
        
        // Simuler la logique de getColisageById
        const result = await prisma.$queryRaw`
            SELECT * FROM VColisageDossiers 
            WHERE ID_Colisage_Dossier = ${colisageId}
        `;

        if (result.length === 0) {
            console.log('Colisage non trouvé');
            return;
        }

        const colisage = JSON.parse(JSON.stringify(result[0]));
        
        console.log('AVANT résolution:');
        console.log('Code_Devise:', colisage.Code_Devise);
        console.log('ID_Devise:', colisage.ID_Devise);
        console.log('Pays_Origine:', colisage.Pays_Origine);
        console.log('ID_Pays_Origine:', colisage.ID_Pays_Origine);
        
        // Résoudre ID_Devise
        if (colisage.Code_Devise && !colisage.ID_Devise) {
            const devise = await prisma.$queryRaw`
                SELECT [ID Devise] FROM TDevises WHERE [Code Devise] = ${colisage.Code_Devise}
            `;
            if (devise.length > 0) {
                colisage.ID_Devise = devise[0]['ID Devise'];
            }
        }

        // Résoudre ID_Pays_Origine
        if (colisage.Pays_Origine && !colisage.ID_Pays_Origine) {
            const pays = await prisma.$queryRaw`
                SELECT [ID Pays] FROM TPays WHERE [Libelle Pays] = ${colisage.Pays_Origine}
            `;
            if (pays.length > 0) {
                colisage.ID_Pays_Origine = pays[0]['ID Pays'];
            }
        }
        
        console.log('\nAPRÈS résolution:');
        console.log('Code_Devise:', colisage.Code_Devise);
        console.log('ID_Devise:', colisage.ID_Devise);
        console.log('Pays_Origine:', colisage.Pays_Origine);
        console.log('ID_Pays_Origine:', colisage.ID_Pays_Origine);
        
        console.log('\n✅ Résolution réussie !');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testColisageWithIds();