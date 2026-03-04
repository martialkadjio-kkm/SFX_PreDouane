// Debug des données du colisage - Analyse des correspondances d'IDs
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function debugColisage() {
    try {
        console.log('=== ANALYSE DES CORRESPONDANCES D\'IDS ===\n');
        
        // Prendre plusieurs colisages pour analyse
        const colisages = await prisma.$queryRawUnsafe(`
            SELECT TOP 3 * FROM VColisageDossiers ORDER BY ID_Colisage_Dossier
        `);
        
        if (colisages.length === 0) {
            console.log('Aucun colisage trouvé');
            return;
        }
        
        for (let i = 0; i < colisages.length; i++) {
            const c = colisages[i];
            console.log(`\n=== COLISAGE ${i + 1} (ID: ${c.ID_Colisage_Dossier}) ===`);
            console.log('Description:', c.Description_Colis);
            
            // Données actuelles du colisage
            console.log('\n--- DONNÉES ACTUELLES ---');
            console.log('ID_Devise:', c.ID_Devise);
            console.log('Code_Devise:', c.Code_Devise);
            console.log('ID_Pays_Origine:', c.ID_Pays_Origine);
            console.log('Pays_Origine:', c.Pays_Origine);
            console.log('ID_Regime_Declaration:', c.ID_Regime_Declaration);
            console.log('Libelle_Regime_Declaration:', c.Libelle_Regime_Declaration);
            
            // Vérifier les correspondances dans les tables de référence
            console.log('\n--- VÉRIFICATION CORRESPONDANCES ---');
            
            // Devise
            if (c.Code_Devise) {
                const deviseByCode = await prisma.$queryRawUnsafe(`
                    SELECT * FROM TDevises WHERE [Code Devise] = '${c.Code_Devise}'
                `);
                if (deviseByCode.length > 0) {
                    const devise = deviseByCode[0];
                    console.log(`Devise par code "${c.Code_Devise}": ID=${devise['ID Devise']}, Libellé="${devise['Libelle Devise']}"`);
                    console.log(`Correspondance ID devise: ${c.ID_Devise} === ${devise['ID Devise']} ? ${c.ID_Devise === devise['ID Devise']}`);
                } else {
                    console.log(`❌ Aucune devise trouvée avec le code "${c.Code_Devise}"`);
                }
            }
            
            // Pays
            if (c.Pays_Origine) {
                // Chercher par libellé d'abord
                const paysByLibelle = await prisma.$queryRawUnsafe(`
                    SELECT * FROM TPays WHERE [Libelle Pays] = '${c.Pays_Origine}'
                `);
                if (paysByLibelle.length > 0) {
                    const pays = paysByLibelle[0];
                    console.log(`Pays par libellé "${c.Pays_Origine}": ID=${pays['ID Pays']}, Code="${pays['Code Pays']}"`);
                    console.log(`Correspondance ID pays: ${c.ID_Pays_Origine} === ${pays['ID Pays']} ? ${c.ID_Pays_Origine === pays['ID Pays']}`);
                } else {
                    console.log(`❌ Aucun pays trouvé avec le libellé "${c.Pays_Origine}"`);
                }
            }
            
            // Régime - Chercher le bon nom de table
            if (c.Libelle_Regime_Declaration) {
                try {
                    const regimeByLibelle = await prisma.$queryRawUnsafe(`
                        SELECT * FROM TRegimesDeclaration WHERE [Libelle Regime Declaration] = '${c.Libelle_Regime_Declaration}'
                    `);
                    if (regimeByLibelle.length > 0) {
                        const regime = regimeByLibelle[0];
                        console.log(`Régime par libellé "${c.Libelle_Regime_Declaration}": ID=${regime['ID Regime Declaration']}`);
                        console.log(`Correspondance ID régime: ${c.ID_Regime_Declaration} === ${regime['ID Regime Declaration']} ? ${c.ID_Regime_Declaration === regime['ID Regime Declaration']}`);
                    } else {
                        console.log(`❌ Aucun régime trouvé avec le libellé "${c.Libelle_Regime_Declaration}"`);
                    }
                } catch (regimeError) {
                    console.log(`❌ Erreur table régimes: ${regimeError.message}`);
                }
            }
        }
        
        // Afficher quelques exemples de chaque table de référence
        console.log('\n\n=== EXEMPLES DE DONNÉES DE RÉFÉRENCE ===');
        
        console.log('\n--- DEVISES (5 premiers) ---');
        const devises = await prisma.$queryRawUnsafe(`SELECT TOP 5 * FROM TDevises ORDER BY [ID Devise]`);
        devises.forEach(d => console.log(`ID: ${d['ID Devise']}, Code: "${d['Code Devise']}", Libellé: "${d['Libelle Devise']}"`));
        
        console.log('\n--- PAYS (5 premiers) ---');
        const pays = await prisma.$queryRawUnsafe(`SELECT TOP 5 * FROM TPays ORDER BY [ID Pays]`);
        pays.forEach(p => console.log(`ID: ${p['ID Pays']}, Code: "${p['Code Pays']}", Libellé: "${p['Libelle Pays']}"`));
        
        console.log('\n--- RÉGIMES (5 premiers) ---');
        try {
            const regimes = await prisma.$queryRawUnsafe(`SELECT TOP 5 * FROM TRegimesDeclaration ORDER BY [ID Regime Declaration]`);
            regimes.forEach(r => console.log(`ID: ${r['ID Regime Declaration']}, Libellé: "${r['Libelle Regime Declaration']}"`));
        } catch (regimeError) {
            console.log(`❌ Erreur table régimes: ${regimeError.message}`);
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

debugColisage();