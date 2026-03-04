const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function debugHSCodeIssue() {
    try {
        console.log('=== DEBUG HS CODE ISSUE ===\n');
        
        // 1. Vérifier les données dans VColisageDossiers
        console.log('1. Données HS_Code dans VColisageDossiers:');
        const colisages = await prisma.$queryRaw`
            SELECT TOP 3 ID_Colisage_Dossier, HS_Code, Description_Colis FROM VColisageDossiers
        `;
        
        colisages.forEach(c => {
            console.log(`   ID: ${c.ID_Colisage_Dossier}, HS_Code: "${c.HS_Code}" (${typeof c.HS_Code}), Description: ${c.Description_Colis}`);
        });
        
        // 2. Vérifier les données dans TColisageDossiers (table source)
        console.log('\n2. Données dans TColisageDossiers (table source):');
        const colisagesTable = await prisma.$queryRaw`
            SELECT TOP 3 ID, [HS Code], [Description Colis] FROM TColisageDossiers
        `;
        
        colisagesTable.forEach(c => {
            console.log(`   ID: ${c.ID}, HS Code: "${c['HS Code']}" (${typeof c['HS Code']}), Description: ${c['Description Colis']}`);
        });
        
        // 3. Vérifier la table THSCodes
        console.log('\n3. Exemples de THSCodes:');
        const hscodes = await prisma.$queryRaw`
            SELECT TOP 5 ID, [HS Code], Description FROM THSCodes
        `;
        
        hscodes.forEach(h => {
            console.log(`   ID: ${h.ID}, HS Code: "${h['HS Code']}", Description: ${h.Description}`);
        });
        
        // 4. Tester la résolution d'un HS Code spécifique
        const testHSCode = "12345678";
        console.log(`\n4. Test résolution HS Code "${testHSCode}":`)
        const hsCodeResult = await prisma.$queryRaw`
            SELECT ID, [HS Code], Description FROM THSCodes WHERE [HS Code] = ${testHSCode}
        `;
        
        if (hsCodeResult.length > 0) {
            console.log(`   ✅ Trouvé: ID=${hsCodeResult[0].ID}, Description="${hsCodeResult[0].Description}"`);
        } else {
            console.log(`   ❌ HS Code "${testHSCode}" non trouvé`);
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugHSCodeIssue();