const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testNoteDetailWithExchangeRates() {
    try {
        console.log('🧪 Test Complet: Note de Détail avec Taux de Change\n');
        
        const dossierId = 1;
        
        // 1. Récupérer les notes de détail
        console.log('1️⃣ Récupération des notes de détail...');
        const notes = await prisma.$queryRaw`
            SELECT * FROM VNotesDetail
            WHERE ID_Dossier = ${dossierId}
            ORDER BY Regroupement_Client, Regime
        `;
        
        console.log(`✅ ${notes.length} notes récupérées\n`);
        
        if (notes.length === 0) {
            console.log('⚠️  Aucune note trouvée. Générez d\'abord les notes de détail.');
            return;
        }
        
        // 2. Récupérer les taux de change
        console.log('2️⃣ Récupération des taux de change...');
        const dossierData = await prisma.$queryRaw`
            SELECT d.[Convertion], c.[Date Convertion] as DateConvertion
            FROM TDossiers d
            LEFT JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
            WHERE d.[ID Dossier] = ${dossierId}
        `;
        
        if (!dossierData || dossierData.length === 0 || !dossierData[0].DateConvertion) {
            console.log('❌ Impossible de récupérer la date de conversion');
            return;
        }
        
        const dateDeclaration = dossierData[0].DateConvertion;
        
        const tauxChange = await prisma.$queryRaw`
            SELECT 
                [ID_Devise],
                [Code_Devise],
                [Taux_Change],
                [ID_Convertion]
            FROM [dbo].[fx_TauxChangeDossier](${dossierId}, ${dateDeclaration})
        `;
        
        console.log(`✅ ${tauxChange.length} taux de change récupérés:`);
        const exchangeRates = {};
        tauxChange.forEach((taux) => {
            exchangeRates[taux.Code_Devise] = Number(taux.Taux_Change || 0);
            console.log(`   ${taux.Code_Devise}: ${taux.Taux_Change}`);
        });
        console.log('');
        
        // 3. Calculer les statistiques par régime et devise
        console.log('3️⃣ Calcul des statistiques par régime et devise...\n');
        
        const regimeStats = {};
        const deviseStats = {};
        
        notes.forEach((note) => {
            const regime = note.Regime || 'Non défini';
            const devise = note.Code_Devise || 'N/A';
            const valeur = Number(note.Valeur || 0);
            
            if (!regimeStats[regime]) {
                regimeStats[regime] = {};
            }
            if (!regimeStats[regime][devise]) {
                regimeStats[regime][devise] = 0;
            }
            regimeStats[regime][devise] += valeur;
            
            if (!deviseStats[devise]) {
                deviseStats[devise] = 0;
            }
            deviseStats[devise] += valeur;
        });
        
        // 4. Afficher le tableau croisé avec Total Converti
        console.log('4️⃣ Tableau Croisé Régime/Devise avec Total Converti:\n');
        
        const allDevises = Object.keys(deviseStats).sort();
        
        // En-tête
        console.log('┌─────────────┬' + allDevises.map(() => '──────────────┬').join('') + '──────────────────┐');
        console.log('│ Régime      │ ' + allDevises.map(d => d.padEnd(12)).join(' │ ') + ' │ Total Converti │');
        console.log('├─────────────┼' + allDevises.map(() => '──────────────┼').join('') + '──────────────────┤');
        
        let grandTotal = 0;
        let grandTotalConverti = 0;
        
        // Lignes de données
        Object.keys(regimeStats).sort().forEach((regime) => {
            let rowTotal = 0;
            let rowTotalConverti = 0;
            
            const values = allDevises.map((devise) => {
                const valeur = regimeStats[regime][devise] || 0;
                rowTotal += valeur;
                
                // Calculer le total converti
                const tauxChange = exchangeRates[devise] || 0;
                if (tauxChange > 0) {
                    rowTotalConverti += valeur * tauxChange;
                }
                
                return valeur > 0 ? valeur.toFixed(2).padStart(12) : '-'.padStart(12);
            });
            
            grandTotal += rowTotal;
            grandTotalConverti += rowTotalConverti;
            
            console.log('│ ' + regime.padEnd(11) + ' │ ' + values.join(' │ ') + ' │ ' + rowTotalConverti.toFixed(2).padStart(14) + ' │');
        });
        
        // Footer
        console.log('├─────────────┼' + allDevises.map(() => '──────────────┼').join('') + '──────────────────┤');
        
        const footerValues = allDevises.map((devise) => {
            return deviseStats[devise].toFixed(2).padStart(12);
        });
        
        console.log('│ TOTAL       │ ' + footerValues.join(' │ ') + ' │ ' + grandTotalConverti.toFixed(2).padStart(14) + ' │');
        console.log('└─────────────┴' + allDevises.map(() => '──────────────┴').join('') + '──────────────────┘');
        
        // 5. Vérification
        console.log('\n5️⃣ Vérification des calculs:\n');
        
        console.log(`   Total brut (somme des valeurs): ${grandTotal.toFixed(2)}`);
        console.log(`   Total converti (avec taux): ${grandTotalConverti.toFixed(2)}`);
        
        // Calculer manuellement pour vérifier
        let verificationTotal = 0;
        allDevises.forEach((devise) => {
            const valeur = deviseStats[devise];
            const taux = exchangeRates[devise] || 0;
            const converti = valeur * taux;
            verificationTotal += converti;
            console.log(`   ${devise}: ${valeur.toFixed(2)} × ${taux} = ${converti.toFixed(2)}`);
        });
        
        console.log(`\n   Vérification: ${verificationTotal.toFixed(2)}`);
        
        if (Math.abs(verificationTotal - grandTotalConverti) < 0.01) {
            console.log('   ✅ Les calculs sont corrects!');
        } else {
            console.log('   ❌ Différence détectée!');
        }
        
        console.log('\n✅ Test terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testNoteDetailWithExchangeRates();
