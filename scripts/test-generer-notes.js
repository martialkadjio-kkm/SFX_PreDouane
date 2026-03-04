const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testGenererNotes() {
    try {
        const dossierId = 1; // Changez selon votre dossier
        const dateDeclaration = new Date('2025-12-08'); // Date d'aujourd'hui
        
        console.log('Test de génération des notes de détail...\n');
        console.log(`Dossier ID: ${dossierId}`);
        console.log(`Date déclaration: ${dateDeclaration.toISOString()}\n`);
        
        // Vérifier le statut du dossier
        console.log('1. Vérification du statut du dossier:');
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            select: {
                id: true,
                noDossier: true,
                statutDossier: true,
                branche: true
            }
        });
        
        if (!dossier) {
            console.log('❌ Dossier non trouvé!');
            return;
        }
        
        console.log(`   Dossier: ${dossier.noDossier}`);
        console.log(`   Statut: ${dossier.statutDossier} (doit être 0 pour "en cours")`);
        
        if (dossier.statutDossier !== 0) {
            console.log('   ⚠️  Le dossier n\'est pas en cours!');
        }
        
        // Vérifier les colisages
        console.log('\n2. Vérification des colisages:');
        const colisages = await prisma.tColisageDossiers.findMany({
            where: { dossier: dossierId },
            select: {
                id: true,
                descriptionColis: true,
                hsCode: true,
                regimeDeclaration: true
            },
            take: 5
        });
        
        console.log(`   Total colisages: ${colisages.length}`);
        
        if (colisages.length === 0) {
            console.log('   ❌ Aucun colisage trouvé!');
            return;
        }
        
        const colisagesSansHS = colisages.filter(c => !c.hsCode);
        const colisagesSansRegime = colisages.filter(c => !c.regimeDeclaration);
        
        if (colisagesSansHS.length > 0) {
            console.log(`   ⚠️  ${colisagesSansHS.length} colisage(s) sans HS Code`);
        }
        
        if (colisagesSansRegime.length > 0) {
            console.log(`   ⚠️  ${colisagesSansRegime.length} colisage(s) sans régime`);
        }
        
        // Vérifier l'entité du dossier
        console.log('\n3. Vérification de l\'entité:');
        const branche = await prisma.tBranches.findUnique({
            where: { id: dossier.branche },
            select: {
                id: true,
                nomBranche: true,
                entite: true
            }
        });
        
        if (!branche) {
            console.log('   ❌ Branche non trouvée!');
            return;
        }
        
        console.log(`   Branche: ${branche.nomBranche}`);
        console.log(`   Entité ID: ${branche.entite}`);
        
        // Vérifier la conversion
        console.log('\n4. Vérification de la conversion:');
        const conversion = await prisma.tConvertions.findFirst({
            where: {
                dateConvertion: dateDeclaration,
                entite: branche.entite
            },
            select: {
                id: true,
                dateConvertion: true
            }
        });
        
        if (!conversion) {
            console.log('   ❌ Aucune conversion trouvée pour cette date et cette entité!');
            console.log('   Vous devez créer une conversion avant de générer les notes.');
            return;
        }
        
        console.log(`   ✅ Conversion trouvée (ID: ${conversion.id})`);
        
        // Vérifier les taux de change
        console.log('\n5. Vérification des taux de change:');
        const taux = await prisma.tTauxChange.findMany({
            where: {
                convertion: conversion.id
            },
            select: {
                id: true,
                devise: true,
                tauxChange: true
            }
        });
        
        console.log(`   Total taux: ${taux.length}`);
        
        if (taux.length === 0) {
            console.log('   ❌ Aucun taux de change trouvé pour cette conversion!');
            return;
        }
        
        taux.forEach(t => {
            console.log(`   - Devise ${t.devise}: ${t.tauxChange}`);
        });
        
        // Vérifier les notes existantes
        console.log('\n6. Vérification des notes existantes:');
        const notesExistantes = await prisma.tNotesDetail.count({
            where: {
                tColisageDossiers: {
                    dossier: dossierId
                }
            }
        });
        
        console.log(`   Notes existantes: ${notesExistantes}`);
        
        // Essayer d'exécuter la procédure
        console.log('\n7. Exécution de la procédure stockée:');
        try {
            await prisma.$executeRaw`
                EXEC [dbo].[pSP_CreerNoteDetail] 
                    @Id_Dossier = ${dossierId},
                    @DateDeclaration = ${dateDeclaration}
            `;
            console.log('   ✅ Procédure exécutée sans erreur');
        } catch (error) {
            console.log('   ❌ Erreur:', error.message);
            return;
        }
        
        // Vérifier les notes après génération
        console.log('\n8. Vérification des notes après génération:');
        const notesApres = await prisma.tNotesDetail.count({
            where: {
                tColisageDossiers: {
                    dossier: dossierId
                }
            }
        });
        
        console.log(`   Notes après: ${notesApres}`);
        console.log(`   Nouvelles notes créées: ${notesApres - notesExistantes}`);
        
        if (notesApres === notesExistantes) {
            console.log('\n⚠️  Aucune note n\'a été créée! Vérifiez les conditions ci-dessus.');
        } else {
            console.log('\n✅ Notes créées avec succès!');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testGenererNotes();
