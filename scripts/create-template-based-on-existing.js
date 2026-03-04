const XLSX = require('xlsx');

// Template basé sur la structure exacte du fichier test-colisage-import-new.xlsx
// Mais avec Regime_Code et Regime_Ratio vides (gérés par l'algorithme)
const templateData = [
    {
        'Row_Key': 'ROW-0001',
        'HS_Code': '01011000',
        'Descr': 'Description détaillée du produit 1',
        'Command_No': 'CMD-0001',
        'Supplier_Name': 'Nom du Fournisseur A',
        'Invoice_No': 'INV-0001',
        'Currency': 'USD',
        'Qty': 100.00,
        'Unit_Prize': 25.50,
        'Gross_Weight': 150.00,
        'Net_Weight': 140.00,
        'Volume': 2.50,
        'Country_Origin': 'Cameroon',
        'Regime_Code': '', // Vide - géré par l'algorithme
        'Regime_Ratio': '', // Vide - géré par l'algorithme
        'Customer_Grouping': 'Site Perenco'
    },
    {
        'Row_Key': 'ROW-0002',
        'HS_Code': '02011000',
        'Descr': 'Description détaillée du produit 2',
        'Command_No': 'CMD-0002',
        'Supplier_Name': 'Nom du Fournisseur B',
        'Invoice_No': 'INV-0002',
        'Currency': 'EUR',
        'Qty': 50.00,
        'Unit_Prize': 45.75,
        'Gross_Weight': 75.00,
        'Net_Weight': 70.00,
        'Volume': 1.20,
        'Country_Origin': 'France',
        'Regime_Code': '', // Vide - géré par l'algorithme
        'Regime_Ratio': '', // Vide - géré par l'algorithme
        'Customer_Grouping': 'Site Kribi'
    },
    {
        'Row_Key': 'ROW-0003',
        'HS_Code': '', // HS Code optionnel
        'Descr': 'Description détaillée du produit 3',
        'Command_No': 'CMD-0003',
        'Supplier_Name': 'Nom du Fournisseur C',
        'Invoice_No': 'INV-0003',
        'Currency': 'XAF',
        'Qty': 25.00,
        'Unit_Prize': 120.00,
        'Gross_Weight': 30.00,
        'Net_Weight': 28.00,
        'Volume': 0.80,
        'Country_Origin': 'Cameroon',
        'Regime_Code': '', // Vide - géré par l'algorithme
        'Regime_Ratio': '', // Vide - géré par l'algorithme
        'Customer_Grouping': 'Site Limbe'
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
    { wch: 15 }, // Regime_Ratio
    { wch: 20 }, // Customer_Grouping
];

// Ajouter une feuille d'instructions
const instructionsData = [
    { 'Colonne': 'Row_Key', 'Description': 'Identifiant unique de la ligne', 'Obligatoire': 'Oui', 'Exemple': 'ROW-0001', 'Note': 'Format libre' },
    { 'Colonne': 'HS_Code', 'Description': 'Code HS du produit', 'Obligatoire': 'Non', 'Exemple': '01011000', 'Note': 'Peut être vide' },
    { 'Colonne': 'Descr', 'Description': 'Description détaillée du produit', 'Obligatoire': 'Oui', 'Exemple': 'Description produit', 'Note': 'Texte libre' },
    { 'Colonne': 'Command_No', 'Description': 'Numéro de commande', 'Obligatoire': 'Oui', 'Exemple': 'CMD-0001', 'Note': 'Format libre' },
    { 'Colonne': 'Supplier_Name', 'Description': 'Nom du fournisseur', 'Obligatoire': 'Oui', 'Exemple': 'Fournisseur ABC', 'Note': 'Texte libre' },
    { 'Colonne': 'Invoice_No', 'Description': 'Numéro de facture', 'Obligatoire': 'Oui', 'Exemple': 'INV-0001', 'Note': 'Format libre' },
    { 'Colonne': 'Currency', 'Description': 'Code devise', 'Obligatoire': 'Oui', 'Exemple': 'USD, EUR, XAF', 'Note': 'Code ISO 3 lettres' },
    { 'Colonne': 'Qty', 'Description': 'Quantité', 'Obligatoire': 'Oui', 'Exemple': '100.00', 'Note': 'Nombre décimal' },
    { 'Colonne': 'Unit_Prize', 'Description': 'Prix unitaire', 'Obligatoire': 'Oui', 'Exemple': '25.50', 'Note': 'Nombre décimal' },
    { 'Colonne': 'Gross_Weight', 'Description': 'Poids brut en kg', 'Obligatoire': 'Oui', 'Exemple': '150.00', 'Note': 'Nombre décimal' },
    { 'Colonne': 'Net_Weight', 'Description': 'Poids net en kg', 'Obligatoire': 'Oui', 'Exemple': '140.00', 'Note': 'Nombre décimal' },
    { 'Colonne': 'Volume', 'Description': 'Volume en m³', 'Obligatoire': 'Oui', 'Exemple': '2.50', 'Note': 'Nombre décimal' },
    { 'Colonne': 'Country_Origin', 'Description': 'Pays d\'origine', 'Obligatoire': 'Oui', 'Exemple': 'Cameroon, France', 'Note': 'Nom ou code pays' },
    { 'Colonne': 'Regime_Code', 'Description': 'Code régime douanier', 'Obligatoire': 'Non', 'Exemple': 'LAISSER VIDE', 'Note': '⚠️ Géré automatiquement' },
    { 'Colonne': 'Regime_Ratio', 'Description': 'Ratio du régime (%)', 'Obligatoire': 'Non', 'Exemple': 'LAISSER VIDE', 'Note': '⚠️ Géré automatiquement' },
    { 'Colonne': 'Customer_Grouping', 'Description': 'Groupement client', 'Obligatoire': 'Oui', 'Exemple': 'Site Perenco', 'Note': 'Nom du site/groupe' }
];

const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

// Ajuster les colonnes de la feuille instructions
instructionsSheet['!cols'] = [
    { wch: 15 }, // Colonne
    { wch: 30 }, // Description
    { wch: 12 }, // Obligatoire
    { wch: 20 }, // Exemple
    { wch: 25 }  // Note
];

// Sauvegarder le template
XLSX.writeFile(workbook, 'template-colisages-complet.xlsx');

console.log('✅ Template Excel créé: template-colisages-complet.xlsx');
console.log('');
console.log('📋 Structure complète (16 colonnes):');
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
console.log('   14. Regime_Code (LAISSER VIDE)');
console.log('   15. Regime_Ratio (LAISSER VIDE)');
console.log('   16. Customer_Grouping (obligatoire)');
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('   • Regime_Code et Regime_Ratio doivent rester VIDES');
console.log('   • Ces colonnes sont gérées automatiquement par l\'algorithme d\'import');
console.log('   • L\'algorithme détermine le régime selon les règles métier');
console.log('   • Feuille "Instructions" incluse pour guidance complète');