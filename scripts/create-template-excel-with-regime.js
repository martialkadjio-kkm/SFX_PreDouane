const XLSX = require('xlsx');

// Template avec la colonne Code Régime
const templateData = [
    {
        'Row_Key': 'ROW_001',
        'HS_Code': '01011000',
        'Descr': 'Description du produit',
        'Command_No': 'CMD001',
        'Supplier_Name': 'Nom du fournisseur',
        'Invoice_No': 'INV001',
        'Currency': 'USD',
        'Qty': 100.00,
        'Unit_Prize': 25.50,
        'Gross_Weight': 150.00,
        'Net_Weight': 140.00,
        'Volume': 2.50,
        'Country_Origin': 'Cameroon',
        'Regime_Code': 'EXO'
    },
    {
        'Row_Key': 'ROW_002',
        'HS_Code': '02011000',
        'Descr': 'Autre produit exemple',
        'Command_No': 'CMD002',
        'Supplier_Name': 'Autre fournisseur',
        'Invoice_No': 'INV002',
        'Currency': 'EUR',
        'Qty': 50.00,
        'Unit_Prize': 45.75,
        'Gross_Weight': 75.00,
        'Net_Weight': 70.00,
        'Volume': 1.20,
        'Country_Origin': 'France',
        'Regime_Code': 'DC10'
    },
    {
        'Row_Key': 'ROW_003',
        'HS_Code': '03011100',
        'Descr': 'Produit sans régime spécifique',
        'Command_No': 'CMD003',
        'Supplier_Name': 'Troisième fournisseur',
        'Invoice_No': 'INV003',
        'Currency': 'GBP',
        'Qty': 25.00,
        'Unit_Prize': 120.00,
        'Gross_Weight': 30.00,
        'Net_Weight': 28.00,
        'Volume': 0.80,
        'Country_Origin': 'United Kingdom',
        'Regime_Code': ''
    }
];

// Créer le workbook
const worksheet = XLSX.utils.json_to_sheet(templateData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Colisages');

// Ajuster la largeur des colonnes
worksheet['!cols'] = [
    { wch: 12 }, // Row_Key
    { wch: 12 }, // HS_Code
    { wch: 40 }, // Descr
    { wch: 15 }, // Command_No
    { wch: 25 }, // Supplier_Name
    { wch: 15 }, // Invoice_No
    { wch: 10 }, // Currency
    { wch: 10 }, // Qty
    { wch: 12 }, // Unit_Prize
    { wch: 15 }, // Gross_Weight
    { wch: 12 }, // Net_Weight
    { wch: 10 }, // Volume
    { wch: 20 }, // Country_Origin
    { wch: 15 }, // Regime_Code
];

// Ajouter des commentaires/notes pour expliquer les colonnes
const comments = {
    'A1': 'Identifiant unique de la ligne',
    'B1': 'Code HS du produit (optionnel)',
    'C1': 'Description détaillée du produit',
    'D1': 'Numéro de commande',
    'E1': 'Nom du fournisseur',
    'F1': 'Numéro de facture',
    'G1': 'Code devise (USD, EUR, etc.)',
    'H1': 'Quantité',
    'I1': 'Prix unitaire',
    'J1': 'Poids brut en kg',
    'K1': 'Poids net en kg',
    'L1': 'Volume en m³',
    'M1': 'Pays d\'origine',
    'N1': 'Code régime (optionnel - EXO, DC10, TR15, etc.)'
};

// Ajouter une feuille d'instructions
const instructionsData = [
    { 'Colonne': 'Row_Key', 'Description': 'Identifiant unique de la ligne', 'Obligatoire': 'Oui', 'Exemple': 'ROW_001' },
    { 'Colonne': 'HS_Code', 'Description': 'Code HS du produit', 'Obligatoire': 'Non', 'Exemple': '01011000' },
    { 'Colonne': 'Descr', 'Description': 'Description du produit', 'Obligatoire': 'Oui', 'Exemple': 'Description produit' },
    { 'Colonne': 'Command_No', 'Description': 'Numéro de commande', 'Obligatoire': 'Oui', 'Exemple': 'CMD001' },
    { 'Colonne': 'Supplier_Name', 'Description': 'Nom du fournisseur', 'Obligatoire': 'Oui', 'Exemple': 'Fournisseur ABC' },
    { 'Colonne': 'Invoice_No', 'Description': 'Numéro de facture', 'Obligatoire': 'Oui', 'Exemple': 'INV001' },
    { 'Colonne': 'Currency', 'Description': 'Code devise', 'Obligatoire': 'Oui', 'Exemple': 'USD, EUR, XAF' },
    { 'Colonne': 'Qty', 'Description': 'Quantité', 'Obligatoire': 'Oui', 'Exemple': '100.00' },
    { 'Colonne': 'Unit_Prize', 'Description': 'Prix unitaire', 'Obligatoire': 'Oui', 'Exemple': '25.50' },
    { 'Colonne': 'Gross_Weight', 'Description': 'Poids brut en kg', 'Obligatoire': 'Oui', 'Exemple': '150.00' },
    { 'Colonne': 'Net_Weight', 'Description': 'Poids net en kg', 'Obligatoire': 'Oui', 'Exemple': '140.00' },
    { 'Colonne': 'Volume', 'Description': 'Volume en m³', 'Obligatoire': 'Oui', 'Exemple': '2.50' },
    { 'Colonne': 'Country_Origin', 'Description': 'Pays d\'origine', 'Obligatoire': 'Oui', 'Exemple': 'Cameroon, France' },
    { 'Colonne': 'Regime_Code', 'Description': 'Code régime (optionnel)', 'Obligatoire': 'Non', 'Exemple': 'EXO, DC10, TR15, vide' }
];

const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

// Ajuster les colonnes de la feuille instructions
instructionsSheet['!cols'] = [
    { wch: 15 }, // Colonne
    { wch: 40 }, // Description
    { wch: 12 }, // Obligatoire
    { wch: 25 }  // Exemple
];

// Sauvegarder le template
XLSX.writeFile(workbook, 'template-colisages-avec-regime.xlsx');

console.log('✅ Template Excel créé: template-colisages-avec-regime.xlsx');
console.log('');
console.log('📋 Colonnes incluses:');
console.log('   1. Row_Key (obligatoire)');
console.log('   2. HS_Code (optionnel)');
console.log('   3. Descr (obligatoire)');
console.log('   4. Command_No (obligatoire)');
console.log('   5. Supplier_Name (obligatoire)');
console.log('   6. Invoice_No (obligatoire)');
console.log('   7. Currency (obligatoire)');
console.log('   8. Qty (obligatoire)');
console.log('   9. Unit_Prize (obligatoire)');
console.log('   10. Gross_Weight (obligatoire)');
console.log('   11. Net_Weight (obligatoire)');
console.log('   12. Volume (obligatoire)');
console.log('   13. Country_Origin (obligatoire)');
console.log('   14. Regime_Code (NOUVEAU - optionnel)');
console.log('');
console.log('🆕 Nouveauté - Colonne Regime_Code:');
console.log('   • Optionnelle (peut être vide)');
console.log('   • Exemples: EXO, DC10, TR15, SP20, etc.');
console.log('   • Si vide: utilise le régime par défaut (0%)');
console.log('   • Feuille "Instructions" incluse pour guidance');