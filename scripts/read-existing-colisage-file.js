const XLSX = require('xlsx');

try {
    // Lire le fichier existant
    const workbook = XLSX.readFile('test-colisage-import-new.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON pour voir la structure
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📋 Structure du fichier test-colisage-import-new.xlsx:');
    console.log('');
    
    if (data.length > 0) {
        console.log('🔍 Colonnes trouvées:');
        const columns = Object.keys(data[0]);
        columns.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col}`);
        });
        
        console.log('');
        console.log('📊 Première ligne d\'exemple:');
        console.log(JSON.stringify(data[0], null, 2));
        
        console.log('');
        console.log(`📈 Total lignes: ${data.length}`);
    } else {
        console.log('❌ Fichier vide ou pas de données');
    }
    
} catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier:', error.message);
    console.log('');
    console.log('💡 Le fichier test-colisage-import-new.xlsx n\'existe peut-être pas.');
    console.log('   Créons un template basé sur les colonnes standard...');
}