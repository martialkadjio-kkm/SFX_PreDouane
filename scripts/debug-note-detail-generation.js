const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugNoteDetailGeneration() {
    console.log('🔍 DIAGNOSTIC GÉNÉRATION NOTE DE DÉTAIL - DOSSIER 6');
    console.log('=' .repeat(60));
    
    const dossierId = 6;
    const dateDeclaration = new Date('2025-12-14');
    
    try {
        // 1. Vérifier le dossier
        console.log('\n📁 1. VÉRIFICATION DU DOSSIER');
        console.log('-'.repeat(40));
        
        const dossier = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            include: {
                tStatutsDossiers: true,
                tEtapes: true,
                tClients: true
            }
        });
        
        if (!dossier) {
            console.log('❌ Dossier non trouvé');
            return;
        }
        
        console.log(`✅ Dossier trouvé: ${dossier.numeroDossier}`);
        console.log(`   Client: ${dossier.tClients?.nomClient || 'N/A'}`);
        console.log(`   Statut: ${dossier.tStatutsDossiers?.libelle || 'N/A'} (ID: ${dossier.statut})`);
        console.log(`   Étape: ${dossier.tEtapes?.libelleEtape || 'N/A'} (ID: ${dossier.etape})`);
        
        // 2. Vérifier les colisages
        console.log('\n📦 2. VÉRIFICATION DES COLISAGES');
        console.log('-'.repeat(40));
        
        const colisages = await prisma.tColisageDossiers.findMany({
            where: { dossier: dossierId },
            include: {
                tDevises: true,
                tPays: true,
                tHsCodes: true,
                tRegimesDeclarations: true
            }
        });
        
        console.log(`✅ ${colisages.length} colisage(s) trouvé(s)`);
        
        if (colisages.length === 0) {
            console.log('❌ Aucun colisage - impossible de générer la note');
            return;
        }
        
        // Analyser les colisages
        let totalValeur = 0;
        let devisesUtilisees = new Set();
        let problemesColisages = [];
        
        colisages.forEach((col, index) => {
            const valeur = col.qteColisage * col.prixUnitaireFacture;
            totalValeur += valeur;
            
            if (col.tDevises) {
                devisesUtilisees.add(col.tDevises.codeDevise);
            }
            
            // Vérifier les données manquantes
            if (!col.devise) problemesColisages.push(`Colisage ${index + 1}: Devise manquante`);
            if (!col.paysOrigine) problemesColisages.push(`Colisage ${index + 1}: Pays origine manquant`);
            if (!col.descriptionColis) problemesColisages.push(`Colisage ${index + 1}: Description manquante`);
        });
        
        console.log(`   Valeur totale: ${totalValeur.toFixed(2)}`);
        console.log(`   Devises utilisées: ${Array.from(devisesUtilisees).join(', ')}`);
        
        if (problemesColisages.length > 0) {
            console.log('⚠️  Problèmes détectés:');
            problemesColisages.forEach(pb => console.log(`   - ${pb}`));
        }
        
        // 3. Vérifier les taux de change
        console.log('\n💱 3. VÉRIFICATION DES TAUX DE CHANGE');
        console.log('-'.repeat(40));
        
        const tauxChange = await prisma.tTauxChange.findMany({
            where: {
                dateApplication: {
                    lte: dateDeclaration
                }
            },
            orderBy: {
                dateApplication: 'desc'
            },
            include: {
                tDevises: true
            }
        });
        
        console.log(`✅ ${tauxChange.length} taux de change trouvé(s)`);
        
        // Vérifier si tous les taux nécessaires sont disponibles
        const tauxDisponibles = new Set(tauxChange.map(t => t.tDevises?.codeDevise).filter(Boolean));
        const devisesManquantes = Array.from(devisesUtilisees).filter(d => !tauxDisponibles.has(d));
        
        if (devisesManquantes.length > 0) {
            console.log('❌ Taux de change manquants pour:', devisesManquantes.join(', '));
        } else {
            console.log('✅ Tous les taux de change sont disponibles');
        }
        
        // Afficher les taux disponibles
        tauxChange.slice(0, 5).forEach(taux => {
            console.log(`   ${taux.tDevises?.codeDevise || 'N/A'}: ${taux.tauxChange} (${taux.dateApplication.toISOString().split('T')[0]})`);
        });
        
        // 4. Vérifier les notes de détail existantes
        console.log('\n📋 4. VÉRIFICATION DES NOTES DE DÉTAIL EXISTANTES');
        console.log('-'.repeat(40));
        
        const notesExistantes = await prisma.tNotesDetail.findMany({
            where: { dossier: dossierId }
        });
        
        console.log(`✅ ${notesExistantes.length} note(s) de détail existante(s)`);
        
        if (notesExistantes.length > 0) {
            notesExistantes.forEach((note, index) => {
                console.log(`   Note ${index + 1}: ID ${note.id}, Créée le ${note.dateCreation?.toISOString().split('T')[0] || 'N/A'}`);
            });
        }
        
        // 5. Tester l'exécution de la procédure stockée
        console.log('\n⚙️  5. TEST DE LA PROCÉDURE STOCKÉE');
        console.log('-'.repeat(40));
        
        try {
            console.log('🔄 Exécution de pSP_CreerNoteDetail...');
            
            // Exécuter la procédure stockée
            const result = await prisma.$executeRawUnsafe(`
                EXEC [dbo].[pSP_CreerNoteDetail] 
                @Id_Dossier = ${dossierId}, 
                @DateDeclaration = '${dateDeclaration.toISOString()}'
            `);
            
            console.log(`✅ Procédure exécutée, résultat: ${result}`);
            
            // Vérifier si des notes ont été créées
            const nouvellesNotes = await prisma.tNotesDetail.findMany({
                where: { dossier: dossierId }
            });
            
            console.log(`📊 Notes après exécution: ${nouvellesNotes.length}`);
            
            if (nouvellesNotes.length > notesExistantes.length) {
                console.log('✅ Nouvelles notes créées avec succès !');
                nouvellesNotes.slice(notesExistantes.length).forEach((note, index) => {
                    console.log(`   Nouvelle note ${index + 1}: ID ${note.id}`);
                });
            } else {
                console.log('❌ Aucune nouvelle note créée');
            }
            
        } catch (error) {
            console.log('❌ Erreur lors de l\'exécution de la procédure:');
            console.log(`   ${error.message}`);
        }
        
        // 6. Vérifier le statut du dossier après
        console.log('\n📊 6. VÉRIFICATION DU STATUT FINAL');
        console.log('-'.repeat(40));
        
        const dossierFinal = await prisma.tDossiers.findUnique({
            where: { id: dossierId },
            include: {
                tStatutsDossiers: true,
                tEtapes: true
            }
        });
        
        if (dossierFinal) {
            console.log(`   Statut final: ${dossierFinal.tStatutsDossiers?.libelle || 'N/A'} (ID: ${dossierFinal.statut})`);
            console.log(`   Étape finale: ${dossierFinal.tEtapes?.libelleEtape || 'N/A'} (ID: ${dossierFinal.etape})`);
            
            if (dossierFinal.statut !== dossier.statut || dossierFinal.etape !== dossier.etape) {
                console.log('✅ Statut/Étape mis à jour');
            } else {
                console.log('⚠️  Statut/Étape inchangé');
            }
        }
        
        // 7. Diagnostic des contraintes de la procédure
        console.log('\n🔍 7. DIAGNOSTIC DES CONTRAINTES');
        console.log('-'.repeat(40));
        
        // Vérifier les contraintes communes qui peuvent bloquer
        const diagnostics = [];
        
        // Contrainte 1: Dossier doit avoir des colisages
        if (colisages.length === 0) {
            diagnostics.push('❌ Aucun colisage dans le dossier');
        }
        
        // Contrainte 2: Tous les colisages doivent avoir une devise
        const colisagesSansDevise = colisages.filter(c => !c.devise);
        if (colisagesSansDevise.length > 0) {
            diagnostics.push(`❌ ${colisagesSansDevise.length} colisage(s) sans devise`);
        }
        
        // Contrainte 3: Taux de change disponibles
        if (devisesManquantes.length > 0) {
            diagnostics.push(`❌ Taux de change manquants: ${devisesManquantes.join(', ')}`);
        }
        
        // Contrainte 4: Valeur totale > 0
        if (totalValeur <= 0) {
            diagnostics.push('❌ Valeur totale des colisages = 0');
        }
        
        if (diagnostics.length === 0) {
            console.log('✅ Toutes les contraintes semblent respectées');
        } else {
            console.log('❌ Contraintes non respectées:');
            diagnostics.forEach(d => console.log(`   ${d}`));
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🏁 FIN DU DIAGNOSTIC');
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le diagnostic
debugNoteDetailGeneration().catch(console.error);