const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function createTestConversion() {
    try {
        const dateConvertion = new Date('2025-12-08');
        const entiteId = 0; // DEFAULT ENTITY
        
        console.log('Création d\'une conversion de test...\n');
        console.log(`Date: ${dateConvertion.toISOString()}`);
        console.log(`Entité ID: ${entiteId}\n`);
        
        // Trouver un utilisateur
        const user = await prisma.tUtilisateurs.findFirst({
            orderBy: { id: 'asc' }
        });
        
        if (!user) {
            console.error('❌ Aucun utilisateur trouvé!');
            return;
        }
        
        console.log(`Utilisateur: ${user.nomUtilisateur} (ID: ${user.id})`);
        
        // Vérifier si la conversion existe déjà
        const existing = await prisma.tConvertions.findFirst({
            where: {
                dateConvertion: dateConvertion,
                entite: entiteId
            }
        });
        
        if (existing) {
            console.log(`\n⏭️  Conversion existe déjà (ID: ${existing.id})`);
            return;
        }
        
        // Créer la conversion
        const conversion = await prisma.tConvertions.create({
            data: {
                dateConvertion: dateConvertion,
                entite: entiteId,
                session: user.id,
                dateCreation: new Date()
            }
        });
        
        console.log(`\n✅ Conversion créée (ID: ${conversion.id})`);
        
        // Créer des taux de change pour les devises utilisées
        console.log('\nCréation des taux de change...');
        
        const devises = [
            { code: 'XOF', taux: 1 },      // Devise locale (taux = 1)
            { code: 'EUR', taux: 655.957 },
            { code: 'USD', taux: 600.0 },
        ];
        
        for (const dev of devises) {
            const devise = await prisma.tDevises.findFirst({
                where: { codeDevise: dev.code }
            });
            
            if (!devise) {
                console.log(`  ⚠️  Devise ${dev.code} non trouvée`);
                continue;
            }
            
            const taux = await prisma.tTauxChange.create({
                data: {
                    convertion: conversion.id,
                    devise: devise.id,
                    tauxChange: dev.taux,
                    session: user.id,
                    dateCreation: new Date()
                }
            });
            
            console.log(`  ✅ ${dev.code}: ${dev.taux}`);
        }
        
        console.log('\n✅ Conversion et taux créés avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestConversion();
