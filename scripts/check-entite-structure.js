const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkEntiteStructure() {
    try {
        console.log('Vérification de la structure Entité...\n');
        
        // Vérifier l'entité 0
        const entite = await prisma.tEntites.findUnique({
            where: { id: 0 },
            select: {
                id: true,
                nomEntite: true,
                pays: true,
                tPays: {
                    select: {
                        id: true,
                        libellePays: true,
                        deviseLocale: true
                    }
                }
            }
        });
        
        if (!entite) {
            console.log('❌ Entité 0 non trouvée!');
            return;
        }
        
        console.log(`Entité: ${entite.nomEntite} (ID: ${entite.id})`);
        console.log(`Pays: ${entite.tPays.libellePays} (ID: ${entite.tPays.id})`);
        console.log(`Devise locale: ${entite.tPays.deviseLocale}`);
        
        // Vérifier si la devise locale existe
        const devise = await prisma.tDevises.findUnique({
            where: { id: entite.tPays.deviseLocale },
            select: {
                id: true,
                codeDevise: true,
                libelleDevise: true
            }
        });
        
        if (!devise) {
            console.log(`\n❌ La devise ${entite.tPays.deviseLocale} n'existe pas!`);
            return;
        }
        
        console.log(`\nDevise locale: ${devise.codeDevise} - ${devise.libelleDevise} (ID: ${devise.id})`);
        
        // Vérifier si un taux existe pour cette devise dans la conversion
        const conversionId = 1;
        const taux = await prisma.tTauxChange.findFirst({
            where: {
                convertion: conversionId,
                devise: devise.id
            }
        });
        
        if (!taux) {
            console.log(`\n❌ Aucun taux trouvé pour ${devise.codeDevise} dans la conversion ${conversionId}!`);
            console.log(`💡 Ajoutez un taux pour ${devise.codeDevise} (ID: ${devise.id}) dans la conversion.`);
        } else {
            console.log(`\n✅ Taux trouvé: ${taux.tauxChange}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkEntiteStructure();
