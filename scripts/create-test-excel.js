// Créer un fichier Excel de test pour les HS Codes
const XLSX = require('xlsx');

function createTestExcel() {
    console.log('=== CRÉATION FICHIER EXCEL DE TEST ===\n');
    
    const testData = [
        { Row_Key: 'ROW_001', HS_Code: '12345678', Description: 'Produits alimentaires - Céréales et dérivés' },
        { Row_Key: 'ROW_002', HS_Code: '87654321', Description: 'Véhicules automobiles et leurs parties' },
        { Row_Key: 'ROW_003', HS_Code: '11111111', Description: 'Textiles et articles textiles' },
        { Row_Key: 'ROW_004', HS_Code: '22222222', Description: 'Machines et appareils mécaniques' },
        { Row_Key: 'ROW_005', HS_Code: '33333333', Description: 'Produits chimiques organiques' },
        { Row_Key: 'ROW_006', HS_Code: '44444444', Description: 'Matières plastiques et ouvrages' },
        { Row_Key: 'ROW_007', HS_Code: '55555555', Description: 'Métaux communs et ouvrages' },
        { Row_Key: 'ROW_008', HS_Code: '66666666', Description: 'Instruments et appareils optiques' },
        { Row_Key: 'ROW_009', HS_Code: '77777777', Description: 'Matériel de transport' },
        { Row_Key: 'ROW_010', HS_Code: '88888888', Description: 'Produits minéraux' }
    ];
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(testData);
    
    // Ajouter la feuille
    XLSX.utils.book_append_sheet(wb, ws, 'HSCodes');
    
    // Sauvegarder
    XLSX.writeFile(wb, 'test-hscodes-import.xlsx');
    
    console.log('✅ Fichier Excel créé: test-hscodes-import.xlsx');
    console.log(`📊 ${testData.length} lignes de test`);
    console.log('\nColonnes:');
    console.log('- Row_Key: Identifiant unique de la ligne');
    console.log('- HS_Code: Code HS (8 chiffres)');
    console.log('- Description: Description du produit');
    
    console.log('\n🎯 Utilisez ce fichier pour tester l\'import dans l\'interface !');
}

try {
    createTestExcel();
} catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Installez xlsx si nécessaire: npm install xlsx');
}