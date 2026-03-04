// Test de l'action updateColisage
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function testUpdateColisage() {
    try {
        console.log('=== TEST UPDATE COLISAGE ===\n');
        
        const colisageId = 5;
        
        // 1. Voir l'état actuel
        console.log('1. État actuel du colisage...');
        const avant = await prisma.$queryRaw`
            SELECT * FROM VColisageDossiers WHERE ID_Colisage_Dossier = ${colisageId}
        `;
        console.log('Avant:', {
            Description_Colis: avant[0].Description_Colis,
            Code_Devise: avant[0].Code_Devise,
            Pays_Origine: avant[0].Pays_Origine
        });
        
        // 2. Simuler updateColisage
        console.log('\n2. Test de mise à jour...');
        
        const updateInput = {
            id: colisageId,
            descriptionColis: "TEST - Produit modifié",
            devise: 44, // EUR
            paysOrigine: 2, // France
            hsCode: 1,
            regimeDeclaration: 1
        };
        
        console.log('Input de mise à jour:', updateInput);
        
        // Simuler l'action updateColisage
        const result = await prisma.tColisageDossiers.update({
            where: { id: colisageId },
            data: {
                descriptionColis: updateInput.descriptionColis,
                devise: updateInput.devise,
                paysOrigine: updateInput.paysOrigine,
                hsCode: updateInput.hsCode,
                regimeDeclaration: updateInput.regimeDeclaration
            }
        });
        
        console.log('✅ Mise à jour réussie');
        
        // 3. Vérifier le résultat
        console.log('\n3. Vérification du résultat...');
        const apres = await prisma.$queryRaw`
            SELECT * FROM VColisageDossiers WHERE ID_Colisage_Dossier = ${colisageId}
        `;
        console.log('Après:', {
            Description_Colis: apres[0].Description_Colis,
            Code_Devise: apres[0].Code_Devise,
            Pays_Origine: apres[0].Pays_Origine
        });
        
        // 4. Remettre les valeurs d'origine
        console.log('\n4. Remise des valeurs d\'origine...');
        await prisma.tColisageDossiers.update({
            where: { id: colisageId },
            data: {
                descriptionColis: "Produit 2 - EXO (100% TR)",
                devise: 144, // USD
                paysOrigine: 3, // U.S.A.
                regimeDeclaration: 0
            }
        });
        console.log('✅ Valeurs d\'origine restaurées');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testUpdateColisage();