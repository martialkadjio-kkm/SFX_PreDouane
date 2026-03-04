const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkConversionEntite() {
    try {
        const dossierId = 1;
        
        console.log('Vérification de l\'entité et des conversions...\n');
        
        // Trouver l'entité du dossier
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: {
                id: true,
                noDossier: true,
                branche: true,
                tBranches: {
                    select: {
                        nomBranche: true,
                        entite: true,
                        tEntites: {
                            select: {
                                nomEntite: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!dossier) {
            console.error('❌ Dossier non trouvé!');
            return;
        }
        
        const entiteId = dossier.tBranches.entite;
        
        console.log(`Dossier: ${dossier.noDossier}`);
        console.log(`Branche: ${dossier.tBranches.nomBranche}`);
        console.log(`Entité ID: ${entiteId}`);
        console.log(`Entité: ${dossier.tBranches.tEntites.nomEntite}\n`);
        
        // Lister toutes les conversions
        console.log('Conversions disponibles:');
        const conversions = await prisma.tConvertions.findMany({
            select: {
                id: true,
                dateConvertion: true,
                entite: true,
                tEntites: {
                    select: {
                        nomEntite: true
                    }
                }
            },
            orderBy: {
                dateConvertion: 'desc'
            },
            take: 10
        });
        
        if (conversions.length === 0) {
            console.log('  ❌ Aucune conversion trouvée!');
            return;
        }
        
        conversions.forEach(c => {
            const isForThisEntity = c.entite === entiteId ? '✅' : '  ';
            console.log(`${isForThisEntity} ID ${c.id}: ${c.dateConvertion.toISOString().split('T')[0]} - Entité ${c.entite} (${c.tEntites.nomEntite})`);
        });
        
        // Vérifier les conversions pour cette entité
        console.log(`\nConversions pour l'entité ${entiteId}:`);
        const conversionsForEntity = await prisma.tConvertions.findMany({
            where: {
                entite: entiteId
            },
            select: {
                id: true,
                dateConvertion: true
            },
            orderBy: {
                dateConvertion: 'desc'
            }
        });
        
        if (conversionsForEntity.length === 0) {
            console.log('  ❌ Aucune conversion pour cette entité!');
            console.log('\n💡 Vous devez créer une conversion pour cette entité avant de générer les notes.');
        } else {
            conversionsForEntity.forEach(c => {
                console.log(`  - ID ${c.id}: ${c.dateConvertion.toISOString().split('T')[0]}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConversionEntite();
