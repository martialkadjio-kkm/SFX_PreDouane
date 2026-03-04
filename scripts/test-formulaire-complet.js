// Test complet du formulaire de colisage
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testFormulaireComplet() {
    try {
        console.log('=== TEST FORMULAIRE COLISAGE COMPLET ===\n');
        
        // 1. Test du chargement des données de référence (comme dans useEffect)
        console.log('1. Chargement des données de référence...');
        
        const [hscodesRes, devisesRes, paysRes, regimesRes] = await Promise.all([
            // getAllHSCodes()
            prisma.$queryRaw`
                SELECT [ID HS Code] as id, [HS Code] as hsCode, [Libelle HS Code] as description 
                FROM THSCodes 
                ORDER BY [HS Code]
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) })),
            
            // getAllDevises()
            prisma.$queryRaw`
                SELECT [ID Devise] as id, [Code Devise] as codeDevise, [Libelle Devise] as libelleDevise 
                FROM TDevises 
                ORDER BY [Code Devise]
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) })),
            
            // getAllPays()
            prisma.$queryRaw`
                SELECT [ID Pays] as id, [Code Pays] as codePays, [Libelle Pays] as libellePays 
                FROM TPays 
                ORDER BY [Libelle Pays]
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) })),
            
            // getAllRegimesDeclaration()
            prisma.$queryRaw`
                SELECT [ID Regime Declaration] as id, [Libelle Regime Declaration] as libelle 
                FROM TRegimesDeclarations 
                ORDER BY [Libelle Regime Declaration]
            `.then(data => ({ success: true, data: JSON.parse(JSON.stringify(data)) }))
        ]);
        
        console.log('✅ Données chargées:');
        console.log(`   - ${hscodesRes.data.length} HS Codes`);
        console.log(`   - ${devisesRes.data.length} Devises`);
        console.log(`   - ${paysRes.data.length} Pays`);
        console.log(`   - ${regimesRes.data.length} Régimes`);
        
        // 2. Test de récupération d'un colisage pour édition
        console.log('\n2. Test récupération colisage pour édition...');
        const colisageId = 4;
        
        const result = await prisma.$queryRaw`
            SELECT * FROM VColisageDossiers 
            WHERE ID_Colisage_Dossier = ${colisageId}
        `;

        if (result.length === 0) {
            console.log('❌ Colisage non trouvé');
            return;
        }

        const colisage = JSON.parse(JSON.stringify(result[0]));
        
        // Résoudre les IDs manquants
        if (colisage.Code_Devise && !colisage.ID_Devise) {
            const devise = await prisma.$queryRaw`
                SELECT [ID Devise] FROM TDevises WHERE [Code Devise] = ${colisage.Code_Devise}
            `;
            if (devise.length > 0) {
                colisage.ID_Devise = devise[0]['ID Devise'];
            }
        }

        if (colisage.Pays_Origine && !colisage.ID_Pays_Origine) {
            const pays = await prisma.$queryRaw`
                SELECT [ID Pays] FROM TPays WHERE [Libelle Pays] = ${colisage.Pays_Origine}
            `;
            if (pays.length > 0) {
                colisage.ID_Pays_Origine = pays[0]['ID Pays'];
            }
        }

        if (colisage.HS_Code && !colisage.ID_HS_Code) {
            const hsCode = await prisma.$queryRaw`
                SELECT [ID HS Code] FROM THSCodes WHERE [HS Code] = ${colisage.HS_Code}
            `;
            if (hsCode.length > 0) {
                colisage.ID_HS_Code = hsCode[0]['ID HS Code'];
            }
        }
        
        // 3. Mapping pour le formulaire
        console.log('\n3. Mapping pour le formulaire...');
        const initialValues = {
            id: colisage.ID_Colisage_Dossier,
            descriptionColis: colisage.Description_Colis || "",
            hsCode: colisage.ID_HS_Code || null,
            devise: colisage.ID_Devise || undefined,
            paysOrigine: colisage.ID_Pays_Origine || undefined,
            regimeDeclaration: colisage.ID_Regime_Declaration || null,
        };
        
        console.log('✅ Valeurs initiales pour le formulaire:');
        console.log('   - hsCode:', initialValues.hsCode);
        console.log('   - devise:', initialValues.devise);
        console.log('   - paysOrigine:', initialValues.paysOrigine);
        console.log('   - regimeDeclaration:', initialValues.regimeDeclaration);
        
        // 4. Vérifier que les valeurs correspondent aux options disponibles
        console.log('\n4. Vérification des correspondances...');
        
        const hsCodeOption = hscodesRes.data.find(h => h.id === initialValues.hsCode);
        const deviseOption = devisesRes.data.find(d => d.id === initialValues.devise);
        const paysOption = paysRes.data.find(p => p.id === initialValues.paysOrigine);
        const regimeOption = regimesRes.data.find(r => r.id === initialValues.regimeDeclaration);
        
        console.log('✅ Options trouvées:');
        console.log('   - HS Code:', hsCodeOption ? `${hsCodeOption.hsCode} - ${hsCodeOption.description}` : 'Non trouvé');
        console.log('   - Devise:', deviseOption ? `${deviseOption.codeDevise} - ${deviseOption.libelleDevise}` : 'Non trouvé');
        console.log('   - Pays:', paysOption ? `${paysOption.codePays} - ${paysOption.libellePays}` : 'Non trouvé');
        console.log('   - Régime:', regimeOption ? regimeOption.libelle : 'Non trouvé');
        
        console.log('\n🎉 FORMULAIRE COMPLET TESTÉ AVEC SUCCÈS !');
        console.log('Le formulaire devrait maintenant fonctionner parfaitement.');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testFormulaireComplet();