// Debug des actions du module colisage avec le bon chemin
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function debugActionsColisage() {
    try {
        console.log('=== DEBUG ACTIONS MODULE COLISAGE ===\n');
        
        // Simuler getAllDevisesForSelect du module colisage
        console.log('1. Test getAllDevisesForSelect (module colisage)...');
        const devises = await prisma.$queryRaw`
            SELECT ID_Devise as id, Code_Devise as code, Libelle_Devise as libelle
            FROM VDevises
            WHERE ID_Devise > 0
            ORDER BY Code_Devise ASC
        `;
        console.log('Devises (format module colisage):', JSON.parse(JSON.stringify(devises)).slice(0, 2));
        
        // Simuler getAllPaysForSelect du module colisage
        console.log('\n2. Test getAllPaysForSelect (module colisage)...');
        const pays = await prisma.$queryRaw`
            SELECT ID_Pays as id, Code_Pays as code, Libelle_Pays as libelle
            FROM VPays
            WHERE ID_Pays > 0
            ORDER BY Libelle_Pays ASC
        `;
        console.log('Pays (format module colisage):', JSON.parse(JSON.stringify(pays)).slice(0, 2));
        
        // Simuler getAllHscodesForSelect du module colisage
        console.log('\n3. Test getAllHscodesForSelect (module colisage)...');
        const hscodes = await prisma.$queryRaw`
            SELECT ID_HS_Code as id, HS_Code as code, Libelle_HS_Code as libelle
            FROM VHSCodes
            WHERE ID_HS_Code > 0
            ORDER BY HS_Code ASC
        `;
        console.log('HS Codes (format module colisage):', JSON.parse(JSON.stringify(hscodes)).slice(0, 2));
        
        console.log('\n=== PROBLÈME IDENTIFIÉ ===');
        console.log('Le formulaire attend des champs "code" et "libelle"');
        console.log('Mais nos actions du module dossiers retournent "codeDevise", "libelleDevise", etc.');
        console.log('Il faut soit:');
        console.log('1. Adapter le formulaire aux noms de champs de nos actions');
        console.log('2. Ou adapter nos actions pour retourner "code" et "libelle"');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugActionsColisage();