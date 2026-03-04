const XLSX = require('xlsx');

// Données de test avec tous les cas possibles
const testData = [];

// Cas 1: Avec Code Régime rempli (50 lignes)
for (let i = 1; i <= 50; i++) {
    testData.push({
        'Row_Key': `ROW_${i.toString().padStart(3, '0')}`,
        'HS_Code': ['01011000', '02011000', '03011100', '04011000', '05011000'][i % 5],
        'Descr': `Description produit ${i}`,
        'Command_No': `CMD${i.toString().padStart(4, '0')}`,
        'Supplier_Name': ['Fournisseur A', 'Fournisseur B', 'Fournisseur C', 'Supplier Ltd', 'Export Co'][i % 5],
        'Invoice_No': `INV${i.toString().padStart(4, '0')}`,
        'Currency': ['USD', 'EUR', 'GBP', 'CAD', 'JPY'][i % 5],
        'Qty': Math.round((Math.random() * 100 + 1) * 100) / 100,
        'Unit_Prize': Math.round((Math.random() * 500 + 10) * 100) / 100,
        'Gross_Weight': Math.round((Math.random() * 50 + 1) * 100) / 100,
        'Net_Weight': Math.round((Math.random() * 45 + 1) * 100) / 100,
        'Volume': Math.round((Math.random() * 10 + 0.1) * 100) / 100,
        'Country_Origin': ['Cameroon', 'France', 'Germany', 'United Kingdom', 'Japan'][i % 5],
        'Regime_Code': ['EXO', 'DC10', 'TR15', 'SP20', 'EX25'][i % 5] // Avec code régime
    });
}

// Cas 2: Sans Code Régime (vide) (50 lignes)
for (let i = 51; i <= 100; i++) {
    testData.push({
        'Row_Key': `ROW_${i.toString().padStart(3, '0')}`,
        'HS_Code': ['06011000', '07011000', '08011000', '09011000', '10011000'][i % 5],
        'Descr': `Produit sans régime ${i}`,
        'Command_No': `CMD${i.toString().padStart(4, '0')}`,
        'Supplier_Name': ['Supplier D', 'Vendor E', 'Company F', 'Trading G', 'Export H'][i % 5],
        'Invoice_No': `INV${i.toString().padStart(4, '0')}`,
        'Currency': ['USD', 'EUR', 'CHF', 'AUD', 'CNY'][i % 5],
        'Qty': Math.round((Math.random() * 200 + 1) * 100) / 100,
        'Unit_Prize': Math.round((Math.random() * 300 + 5) * 100) / 100,
        'Gross_Weight': Math.round((Math.random() * 30 + 1) * 100) / 100,
        'Net_Weight': Math.round((Math.random() * 25 + 1) * 100) / 100,
        'Volume': Math.round((Math.random() * 5 + 0.1) * 100) / 100,
        'Country_Origin': ['Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland'][i % 5],
        'Regime_Code': '' // Vide
    });
}

// Cas 3: Avec des valeurs nulles/undefined (50 lignes)
for (let i = 101; i <= 150; i++) {
    testData.push({
        'Row_Key': `ROW_${i.toString().padStart(3, '0')}`,
        'HS_Code': ['11011000', '12011000', '13011000', '14011000', '15011000'][i % 5],
        'Descr': `Produit avec nulls ${i}`,
        'Command_No': `CMD${i.toString().padStart(4, '0')}`,
        'Supplier_Name': ['Null Supplier', 'Empty Vendor', 'Test Company', 'Sample Ltd', 'Demo Corp'][i % 5],
        'Invoice_No': `INV${i.toString().padStart(4, '0')}`,
        'Currency': ['USD', 'EUR', 'GBP', 'SEK', 'NOK'][i % 5],
        'Qty': Math.round((Math.random() * 150 + 1) * 100) / 100,
        'Unit_Prize': Math.round((Math.random() * 400 + 8) * 100) / 100,
        'Gross_Weight': Math.round((Math.random() * 40 + 1) * 100) / 100,
        'Net_Weight': Math.round((Math.random() * 35 + 1) * 100) / 100,
        'Volume': Math.round((Math.random() * 8 + 0.1) * 100) / 100,
        'Country_Origin': ['Austria', 'Portugal', 'Poland', 'Czech Republic', 'Hungary'][i % 5],
        'Regime_Code': i % 3 === 0 ? null : (i % 3 === 1 ? undefined : 'REG' + (i % 10)) // Mix de null, undefined, et valeurs
    });
}

// Cas 4: Cas spéciaux et edge cases (50 lignes)
for (let i = 151; i <= 200; i++) {
    testData.push({
        'Row_Key': `ROW_${i.toString().padStart(3, '0')}`,
        'HS_Code': i % 4 === 0 ? '' : ['16011000', '17011000', '18011000', '19011000'][i % 4],
        'Descr': `Cas spécial ${i} - Très longue description avec beaucoup de détails pour tester le comportement`,
        'Command_No': `CMD${i.toString().padStart(4, '0')}`,
        'Supplier_Name': i % 3 === 0 ? 'Très Long Nom de Fournisseur International avec Caractères Spéciaux & Accents éàü' : ['Special Supplier', 'Edge Case Vendor'][i % 2],
        'Invoice_No': `INV${i.toString().padStart(4, '0')}`,
        'Currency': ['USD', 'EUR', 'XOF', 'XAF', 'MAD'][i % 5],
        'Qty': i % 5 === 0 ? 0 : Math.round((Math.random() * 1000 + 1) * 100) / 100,
        'Unit_Prize': i % 7 === 0 ? 0 : Math.round((Math.random() * 1000 + 1) * 100) / 100,
        'Gross_Weight': Math.round((Math.random() * 100 + 1) * 100) / 100,
        'Net_Weight': Math.round((Math.random() * 90 + 1) * 100) / 100,
        'Volume': Math.round((Math.random() * 20 + 0.1) * 100) / 100,
        'Country_Origin': ['Morocco', 'Tunisia', 'Algeria', 'Senegal', 'Ivory Coast'][i % 5],
        'Regime_Code': i % 6 === 0 ? '' : 
                      i % 6 === 1 ? 'LONG_REGIME_CODE_123' :
                      i % 6 === 2 ? 'SP' :
                      i % 6 === 3 ? 'EXONERATION_COMPLETE' :
                      i % 6 === 4 ? '0' :
                      'DEFAULT'
    });
}

// Créer le workbook
const worksheet = XLSX.utils.json_to_sheet(testData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Colisages Test');

// Ajuster la largeur des colonnes
worksheet['!cols'] = [
    { wch: 12 }, // Row_Key
    { wch: 12 }, // HS_Code
    { wch: 40 }, // Descr
    { wch: 15 }, // Command_No
    { wch: 30 }, // Supplier_Name
    { wch: 15 }, // Invoice_No
    { wch: 10 }, // Currency
    { wch: 10 }, // Qty
    { wch: 12 }, // Unit_Prize
    { wch: 12 }, // Gross_Weight
    { wch: 12 }, // Net_Weight
    { wch: 10 }, // Volume
    { wch: 20 }, // Country_Origin
    { wch: 20 }, // Regime_Code
];

// Sauvegarder le fichier
XLSX.writeFile(workbook, 'test-colisages-avec-regime-200-lignes.xlsx');

console.log('✅ Fichier Excel créé: test-colisages-avec-regime-200-lignes.xlsx');
console.log('📊 200 lignes de test avec tous les cas:');
console.log('   • Lignes 1-50: Avec Code Régime rempli');
console.log('   • Lignes 51-100: Sans Code Régime (vide)');
console.log('   • Lignes 101-150: Avec valeurs null/undefined');
console.log('   • Lignes 151-200: Cas spéciaux et edge cases');
console.log('');
console.log('🔍 Cas de test inclus:');
console.log('   • Codes régimes: EXO, DC10, TR15, SP20, EX25, etc.');
console.log('   • Valeurs vides, null, undefined');
console.log('   • Codes longs et courts');
console.log('   • Caractères spéciaux');
console.log('   • Quantités et prix à 0');
console.log('   • Descriptions très longues');
console.log('   • Noms de fournisseurs avec accents');
console.log('   • Différentes devises (USD, EUR, XOF, XAF, etc.)');
console.log('   • Pays d\'Afrique et d\'Europe');