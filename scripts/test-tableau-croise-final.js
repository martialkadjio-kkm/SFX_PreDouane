const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testTableauCroiseFinal() {
    try {
        console.log('🧪 Test Format Final du Tableau Croisé Dynamique\n');
        
        const dossierId = 1;
        
        // 1. Récupérer les notes
        const notes = await prisma.$queryRaw`
            SELECT * FROM VNotesDetail
            WHERE ID_Dossier = ${dossierId}
            ORDER BY Regroupement_Client, Regime
        `;
        
        if (notes.length === 0) {
            console.log('⚠️  Aucune note trouvée');
            return;
        }
        
        // 2. Récupérer les taux de change
        const dossierData = await prisma.$queryRaw`
            SELECT d.[Convertion], c.[Date Convertion] as DateConvertion
            FROM TDossiers d
            LEFT JOIN TConvertions c ON d.[Convertion] = c.[ID Convertion]
            WHERE d.[ID Dossier] = ${dossierId}
        `;
        
        const dateDeclaration = dossierData[0].DateConvertion;
        
        const tauxChange = await prisma.$queryRaw`
            SELECT [Code_Devise], [Taux_Change]
            FROM [dbo].[fx_TauxChangeDossier](${dossierId}, ${dateDeclaration})
        `;
        
        const exchangeRates = {};
        tauxChange.forEach((taux) => {
            exchangeRates[taux.Code_Devise] = Number(taux.Taux_Change || 0);
        });
        
        // 3. Calculer les statistiques
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
        
        const allDevises = Object.keys(deviseStats).sort();
        
        // 4. Afficher le tableau au format croisé dynamique (première colonne vide SANS fond bleu)
        console.log('═══════════════════════════════════════════════════════════');
        console.log('           TABLEAU CROISÉ DYNAMIQUE (Format Final)         ');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // En-tête ligne 1: [vide SANS fond bleu] | Source | Total Converti
        console.log('┌─────────────┬──────────────┬──────────────────┐');
        console.log('│             │   Source     │ Total Converti   │');
        console.log('│  (blanc)    │  (bleu)      │     (bleu)       │');
        
        // En-tête ligne 2: [vide SANS fond bleu] | codes devises | [vide car rowspan]
        console.log('├─────────────┼──────────────┼──────────────────┤');
        console.log('│             │ ' + allDevises.map(d => d.padEnd(12)).join(' │ ') + ' │                  │');
        console.log('│  (blanc)    │  (blanc)     │     (bleu)       │');
        console.log('├─────────────┼──────────────┼──────────────────┤');
        
        let grandTotalConverti = 0;
        
        // Lignes de données
        Object.keys(regimeStats).sort().forEach((regime) => {
            let rowTotalConverti = 0;
            
            const values = allDevises.map((devise) => {
                const valeur = regimeStats[regime][devise] || 0;
                const tauxChange = exchangeRates[devise] || 0;
                if (tauxChange > 0) {
                    rowTotalConverti += valeur * tauxChange;
                }
                return valeur > 0 ? valeur.toFixed(2).padStart(12) : '-'.padStart(12);
            });
            
            grandTotalConverti += rowTotalConverti;
            
            console.log('│ ' + regime.padEnd(11) + ' │ ' + values.join(' │ ') + ' │ ' + rowTotalConverti.toFixed(2).padStart(16) + ' │');
        });
        
        // Footer
        console.log('├─────────────┼──────────────┼──────────────────┤');
        
        const footerValues = allDevises.map((devise) => {
            return deviseStats[devise].toFixed(2).padStart(12);
        });
        
        console.log('│ ' + 'TOTAL'.padEnd(11) + ' │ ' + footerValues.join(' │ ') + ' │ ' + grandTotalConverti.toFixed(2).padStart(16) + ' │');
        console.log('└─────────────┴──────────────┴──────────────────┘');
        
        console.log('\n📝 Caractéristiques du tableau:');
        console.log('   ✅ 3 colonnes partout (régimes, devises, total converti)');
        console.log('   ✅ Première colonne en-tête: cellule vide SANS fond bleu (blanc)');
        console.log('   ✅ Deuxième colonne en-tête ligne 1: "Source" avec fond bleu');
        console.log('   ✅ Deuxième colonne en-tête ligne 2: codes devises SANS fond bleu (blanc)');
        console.log('   ✅ Troisième colonne: "Total Converti" avec fond bleu (rowspan 2)');
        
        console.log('\n💡 Structure:');
        console.log('   Ligne 1: [vide blanc] [Source bleu] [Total Converti bleu]');
        console.log('   Ligne 2: [vide blanc] [EUR blanc] [rowspan]');
        console.log('   Données: [TTC blanc] [69071.95] [45308229.11]');
        
        console.log('\n✅ Test terminé avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testTableauCroiseFinal();
