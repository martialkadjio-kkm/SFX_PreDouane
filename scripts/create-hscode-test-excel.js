// Créer un fichier Excel de test avec des HS Codes réalistes
const XLSX = require('xlsx');

function createHSCodeTestExcel() {
    console.log('=== CRÉATION FICHIER EXCEL TEST HS CODES ===\n');
    
    const testData = [
        // Nouveaux HS Codes (n'existent pas encore)
        { Row_Key: 'NEW_001', HS_Code: '99001100', Description: 'Produits de test - Nouveaux articles électroniques' },
        { Row_Key: 'NEW_002', HS_Code: '99001200', Description: 'Produits de test - Équipements de laboratoire' },
        { Row_Key: 'NEW_003', HS_Code: '99001300', Description: 'Produits de test - Instruments de mesure' },
        { Row_Key: 'NEW_004', HS_Code: '99001400', Description: 'Produits de test - Composants électroniques' },
        { Row_Key: 'NEW_005', HS_Code: '99001500', Description: 'Produits de test - Matériel informatique' },
        
        // HS Codes existants (pour tester les mises à jour)
        { Row_Key: 'UPD_001', HS_Code: '01011000', Description: 'Chevaux reproducteurs de race pure - MISE À JOUR' },
        { Row_Key: 'UPD_002', HS_Code: '02011000', Description: 'Carcasses et demi-carcasses de bovins - MISE À JOUR' },
        { Row_Key: 'UPD_003', HS_Code: '03011100', Description: 'Poissons ornementaux d\'eau douce - MISE À JOUR' },
        
        // Mix de nouveaux et existants
        { Row_Key: 'MIX_001', HS_Code: '99002100', Description: 'Nouveau produit - Accessoires de mode' },
        { Row_Key: 'MIX_002', HS_Code: '04011000', Description: 'Lait et crème - Description mise à jour' },
        { Row_Key: 'MIX_003', HS_Code: '99002200', Description: 'Nouveau produit - Articles de sport' },
        { Row_Key: 'MIX_004', HS_Code: '05011000', Description: 'Cheveux bruts - Description améliorée' },
        
        // Test avec des caractères spéciaux
        { Row_Key: 'SPEC_001', HS_Code: '99003100', Description: 'Produits spéciaux - Équipements médicaux (stérilisés)' },
        { Row_Key: 'SPEC_002', HS_Code: '99003200', Description: 'Articles d\'art & décoration - Œuvres originales' },
        
        // Test avec des descriptions longues
        { Row_Key: 'LONG_001', HS_Code: '99004100', Description: 'Équipements industriels complexes pour la transformation des matières premières en produits finis destinés à l\'exportation' },
        
        // Test d'erreurs potentielles (HS Code manquant sera géré par la validation)
        { Row_Key: 'TEST_001', HS_Code: '99005100', Description: 'Test de validation - Produit standard' },
        { Row_Key: 'TEST_002', HS_Code: '99005200', Description: 'Test de validation - Produit avec numéro de série' },
        { Row_Key: 'TEST_003', HS_Code: '99005300', Description: 'Test de validation - Produit certifié ISO' },
        { Row_Key: 'TEST_004', HS_Code: '99005400', Description: 'Test de validation - Produit écologique' },
        { Row_Key: 'TEST_005', HS_Code: '99005500', Description: 'Test de validation - Produit premium' }
    ];
    
    try {
        // Créer le workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(testData);
        
        // Ajuster la largeur des colonnes
        ws['!cols'] = [
            { wch: 12 }, // Row_Key
            { wch: 12 }, // HS_Code  
            { wch: 60 }  // Description
        ];
        
        // Ajouter la feuille
        XLSX.utils.book_append_sheet(wb, ws, 'HSCodes_Test');
        
        // Sauvegarder
        const filename = 'test-hscodes-import.xlsx';
        XLSX.writeFile(wb, filename);
        
        console.log(`✅ Fichier Excel créé: ${filename}`);
        console.log(`📊 ${testData.length} lignes de test`);
        
        console.log('\n📋 Contenu du fichier:');
        console.log(`- ${testData.filter(d => d.Row_Key.startsWith('NEW_')).length} nouveaux HS Codes`);
        console.log(`- ${testData.filter(d => d.Row_Key.startsWith('UPD_')).length} HS Codes existants (pour mise à jour)`);
        console.log(`- ${testData.filter(d => d.Row_Key.startsWith('MIX_')).length} mix nouveaux/existants`);
        console.log(`- ${testData.filter(d => d.Row_Key.startsWith('SPEC_')).length} avec caractères spéciaux`);
        console.log(`- ${testData.filter(d => d.Row_Key.startsWith('TEST_')).length} pour tests de validation`);
        
        console.log('\n🎯 Utilisez ce fichier pour tester:');
        console.log('1. L\'analyse et la prévisualisation');
        console.log('2. La détection des doublons');
        console.log('3. Les différents modes d\'import');
        console.log('4. La gestion des caractères spéciaux');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.log('\n💡 Installez xlsx si nécessaire: npm install xlsx');
    }
}

createHSCodeTestExcel();