const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function addRegimesIM4() {
    try {
        console.log('Recherche d\'un utilisateur valide...');
        
        // Trouver un utilisateur pour la session
        const user = await prisma.tUtilisateurs.findFirst({
            orderBy: { id: 'asc' }
        });
        
        if (!user) {
            console.error('❌ Aucun utilisateur trouvé!');
            return;
        }
        
        console.log('✅ Utilisateur trouvé:', user.nomUtilisateur, '(ID:', user.id + ')');
        
        console.log('\nRecherche du régime douanier IM4...');
        
        // Trouver le régime douanier IM4
        const regimeDouanier = await prisma.tRegimesDouaniers.findFirst({
            where: { codeRegimeDouanier: 'IM4' }
        });
        
        if (!regimeDouanier) {
            console.error('❌ Régime douanier IM4 non trouvé!');
            return;
        }
        
        console.log('✅ Régime douanier IM4 trouvé:', regimeDouanier);
        
        // Définir les régimes à créer
        const regimesToCreate = [
            { libelle: 'IM4 100% TR et 0% DC', tauxDC: 0 },
            { libelle: 'IM4 100% DC', tauxDC: 100 },
            { libelle: 'IM4 70% TR et 30% DC', tauxDC: 30 },
            { libelle: 'IM4 50% TR et 50% DC', tauxDC: 50 },
            { libelle: 'IM4 25% TR et 75% DC', tauxDC: 75 },
        ];
        
        console.log('\nCréation des régimes de déclaration...\n');
        
        for (const regime of regimesToCreate) {
            // Vérifier si le régime existe déjà
            const existing = await prisma.tRegimesDeclarations.findFirst({
                where: { libelleRegimeDeclaration: regime.libelle }
            });
            
            if (existing) {
                console.log(`⏭️  "${regime.libelle}" existe déjà (ID: ${existing.id})`);
                continue;
            }
            
            // Créer le régime
            const newRegime = await prisma.tRegimesDeclarations.create({
                data: {
                    regimeDouanier: regimeDouanier.id,
                    libelleRegimeDeclaration: regime.libelle,
                    tauxDC: regime.tauxDC,
                    session: user.id,
                    dateCreation: new Date()
                }
            });
            
            console.log(`✅ Créé: "${regime.libelle}" (ID: ${newRegime.id}, Taux DC: ${regime.tauxDC}%)`);
        }
        
        console.log('\n📋 Liste complète des régimes IM4:');
        const allRegimes = await prisma.tRegimesDeclarations.findMany({
            where: { regimeDouanier: regimeDouanier.id },
            orderBy: { tauxDC: 'asc' }
        });
        
        allRegimes.forEach(r => {
            console.log(`  - ${r.libelleRegimeDeclaration} (Taux DC: ${r.tauxDC}%)`);
        });
        
        console.log('\n✅ Terminé!');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addRegimesIM4();
