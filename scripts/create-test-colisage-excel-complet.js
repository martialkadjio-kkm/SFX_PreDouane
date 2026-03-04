const XLSX = require("xlsx");

// Données de test complètes couvrant tous les cas
const testData = [
    // CAS 1: Tout fourni et valide (devises, pays, HS Code existants)
    {
        "Row_Key": "TEST-001",
        "HS_Code": "123456",
        "Descr": "Produit complet avec toutes les valeurs valides",
        "Command_No": "CMD-001",
        "Supplier_Name": "Fournisseur Standard",
        "Invoice_No": "FACT-001",
        "Currency": "XOF",
        "Qty": 100,
        "Unit_Prize": 25000,
        "Gross_Weight": 150,
        "Net_Weight": 140,
        "Volume": 2.5,
        "Country_Origin": "CM",
        "Regime_Code": "IM4",
        "Regime_Ratio": 0,
        "Customer_Grouping": "Site Perenco"
    },

    // CAS 2: Sans HS Code (doit utiliser valeur par défaut)
    {
        "Row_Key": "TEST-002",
        "Descr": "Produit SANS HS Code - doit utiliser valeur par défaut",
        "Command_No": "CMD-002",
        "Supplier_Name": "Fournisseur B",
        "Invoice_No": "FACT-002",
        "Currency": "XOF",
        "Qty": 50,
        "Unit_Prize": 15000,
        "Gross_Weight": 75,
        "Net_Weight": 70,
        "Volume": 1.2,
        "Country_Origin": "CM",
        "Regime_Ratio": 0,
        "Customer_Grouping": "Site Douala"
    },

    // CAS 3: Devise manquante (GBP n'existe pas)
    {
        "Row_Key": "TEST-003",
        "HS_Code": "789012",
        "Descr": "Produit avec DEVISE MANQUANTE (GBP) - doit proposer création",
        "Command_No": "CMD-003",
        "Supplier_Name": "Fournisseur UK",
        "Invoice_No": "FACT-003",
        "Currency": "GBP",
        "Qty": 25,
        "Unit_Prize": 500,
        "Gross_Weight": 30,
        "Net_Weight": 28,
        "Volume": 0.5,
        "Country_Origin": "GB",
        "Regime_Ratio": 0,
        "Customer_Grouping": "Site Kribi"
    },

    // CAS 4: Pays manquant (GB n'existe pas)
    {
        "Row_Key": "TEST-004",
        "Descr": "Produit avec PAYS MANQUANT (GB) - doit proposer création",
        "Command_No": "CMD-004",
        "Supplier_Name": "Fournisseur Anglais",
        "Invoice_No": "FACT-004",
        "Currency": "XOF",
        "Qty": 200,
        "Unit_Prize": 15000,
        "Gross_Weight": 300,
        "Net_Weight": 280,
        "Volume": 5.0,
        "Country_Origin": "GB",
        "Regime_Ratio": 100,
        "Customer_Grouping": "Site Limbé"
    },

    // CAS 5: HS Code manquant (999999 n'existe pas)
    {
        "Row_Key": "TEST-005",
        "HS_Code": "999999",
        "Descr": "Produit avec HS CODE MANQUANT (999999) - doit proposer création",
        "Command_No": "CMD-005",
        "Supplier_Name": "Fournisseur E",
        "Invoice_No": "FACT-005",
        "Currency": "XOF",
        "Qty": 75,
        "Unit_Prize": 35000,
        "Gross_Weight": 120,
        "Net_Weight": 110,
        "Volume": 2.0,
        "Country_Origin": "CM",
        "Regime_Code": "IM4",
        "Regime_Ratio": 70,
        "Customer_Grouping": "Site Yaoundé"
    },

    // CAS 6: Régime EXO (0% DC)
    {
        "Row_Key": "TEST-006",
        "HS_Code": "123456",
        "Descr": "Produit avec régime EXO (0% DC)",
        "Command_No": "CMD-006",
        "Supplier_Name": "Fournisseur F",
        "Invoice_No": "FACT-006",
        "Currency": "EUR",
        "Qty": 30,
        "Unit_Prize": 800,
        "Gross_Weight": 45,
        "Net_Weight": 42,
        "Volume": 0.8,
        "Country_Origin": "FR",
        "Regime_Ratio": 0,
        "Customer_Grouping": "Site Edéa"
    },

    // CAS 7: Régime 100% DC
    {
        "Row_Key": "TEST-007",
        "Descr": "Produit avec régime 100% DC",
        "Command_No": "CMD-007",
        "Supplier_Name": "Fournisseur G",
        "Invoice_No": "FACT-007",
        "Currency": "USD",
        "Qty": 150,
        "Unit_Prize": 2500,
        "Gross_Weight": 200,
        "Net_Weight": 190,
        "Volume": 3.5,
        "Country_Origin": "US",
        "Regime_Ratio": 100,
        "Customer_Grouping": "Site Garoua"
    },

    // CAS 8: Régime mixte 30% TR et 70% DC
    {
        "Row_Key": "TEST-008",
        "HS_Code": "456789",
        "Descr": "Produit avec régime mixte IM4 (30% TR et 70% DC)",
        "Command_No": "CMD-008",
        "Supplier_Name": "Fournisseur H",
        "Invoice_No": "FACT-008",
        "Currency": "XOF",
        "Qty": 80,
        "Unit_Prize": 42000,
        "Gross_Weight": 135,
        "Net_Weight": 125,
        "Volume": 2.2,
        "Country_Origin": "CM",
        "Regime_Code": "IM4",
        "Regime_Ratio": 70,
        "Customer_Grouping": "Site Bafoussam"
    },

    // CAS 9: Régime mixte 50% TR et 50% DC
    {
        "Row_Key": "TEST-009",
        "Descr": "Produit avec régime mixte IM4 (50% TR et 50% DC)",
        "Command_No": "CMD-009",
        "Supplier_Name": "Fournisseur I",
        "Invoice_No": "FACT-009",
        "Currency": "XOF",
        "Qty": 60,
        "Unit_Prize": 28000,
        "Gross_Weight": 90,
        "Net_Weight": 85,
        "Volume": 1.5,
        "Country_Origin": "CM",
        "Regime_Code": "IM4",
        "Regime_Ratio": 50,
        "Customer_Grouping": "Site Bamenda"
    },

    // CAS 10: Régime mixte 20% TR et 80% DC
    {
        "Row_Key": "TEST-010",
        "HS_Code": "654321",
        "Descr": "Produit avec régime mixte IM4 (20% TR et 80% DC)",
        "Command_No": "CMD-010",
        "Supplier_Name": "Fournisseur J",
        "Invoice_No": "FACT-010",
        "Currency": "EUR",
        "Qty": 40,
        "Unit_Prize": 1200,
        "Gross_Weight": 60,
        "Net_Weight": 55,
        "Volume": 1.0,
        "Country_Origin": "FR",
        "Regime_Code": "IM4",
        "Regime_Ratio": 80,
        "Customer_Grouping": "Site Maroua"
    },

    // CAS 11: Plusieurs valeurs manquantes (Devise + Pays + HS Code)
    {
        "Row_Key": "TEST-011",
        "HS_Code": "111111",
        "Descr": "Produit avec PLUSIEURS VALEURS MANQUANTES (JPY + JP + HS)",
        "Command_No": "CMD-011",
        "Supplier_Name": "Fournisseur Japonais",
        "Invoice_No": "FACT-011",
        "Currency": "JPY",
        "Qty": 20,
        "Unit_Prize": 50000,
        "Gross_Weight": 25,
        "Net_Weight": 23,
        "Volume": 0.4,
        "Country_Origin": "JP",
        "Regime_Ratio": 0,
        "Customer_Grouping": "Site Ngaoundéré"
    },

    // CAS 12: Régime manquant (25% DC n'existe pas)
    {
        "Row_Key": "TEST-012",
        "Descr": "Produit avec REGIME MANQUANT (25% DC) - doit proposer création",
        "Command_No": "CMD-012",
        "Supplier_Name": "Fournisseur K",
        "Invoice_No": "FACT-012",
        "Currency": "XOF",
        "Qty": 90,
        "Unit_Prize": 32000,
        "Gross_Weight": 110,
        "Net_Weight": 105,
        "Volume": 1.8,
        "Country_Origin": "CM",
        "Regime_Code": "IM4",
        "Regime_Ratio": 25,
        "Customer_Grouping": "Site Bertoua"
    },

    // CAS 13: Valeurs numériques avec décimales
    {
        "Row_Key": "TEST-013",
        "HS_Code": "123456",
        "Descr": "Produit avec valeurs décimales précises",
        "Command_No": "CMD-013",
        "Supplier_Name": "Fournisseur L",
        "Invoice_No": "FACT-013",
        "Currency": "USD",
        "Qty": 12.5,
        "Unit_Prize": 1234.56,
        "Gross_Weight": 18.75,
        "Net_Weight": 17.25,
        "Volume": 0.375,
        "Country_Origin": "US",
        "Regime_Ratio": 0,
        "Customer_Grouping": "Site Ebolowa"
    },

    // CAS 14: Valeurs minimales
    {
        "Row_Key": "TEST-014",
        "Descr": "Produit avec valeurs minimales",
        "Command_No": "CMD-014",
        "Supplier_Name": "Fournisseur M",
        "Invoice_No": "FACT-014",
        "Currency": "XOF",
        "Qty": 1,
        "Unit_Prize": 100,
        "Gross_Weight": 0.1,
        "Net_Weight": 0.09,
        "Volume": 0.01,
        "Country_Origin": "CM",
        "Regime_Ratio": 0,
        "Customer_Grouping": "Site Sangmélima"
    },

    // CAS 15: Valeurs maximales
    {
        "Row_Key": "TEST-015",
        "HS_Code": "789012",
        "Descr": "Produit avec valeurs maximales",
        "Command_No": "CMD-015",
        "Supplier_Name": "Fournisseur N",
        "Invoice_No": "FACT-015",
        "Currency": "EUR",
        "Qty": 10000,
        "Unit_Prize": 999999,
        "Gross_Weight": 50000,
        "Net_Weight": 48000,
        "Volume": 1000,
        "Country_Origin": "FR",
        "Regime_Ratio": 100,
        "Customer_Grouping": "Site Buéa"
    }
];

// Créer le fichier Excel
const worksheet = XLSX.utils.json_to_sheet(testData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Colisages Test");

// Définir les largeurs de colonnes
worksheet['!cols'] = [
    { wch: 15 },  // Row_Key
    { wch: 12 },  // HS_Code
    { wch: 60 },  // Descr
    { wch: 15 },  // Command_No
    { wch: 25 },  // Supplier_Name
    { wch: 15 },  // Invoice_No
    { wch: 10 },  // Currency
    { wch: 10 },  // Qty
    { wch: 15 },  // Unit_Prize
    { wch: 15 },  // Gross_Weight
    { wch: 15 },  // Net_Weight
    { wch: 10 },  // Volume
    { wch: 15 },  // Country_Origin
    { wch: 12 },  // Regime_Code
    { wch: 12 },  // Regime_Ratio
    { wch: 20 }   // Customer_Grouping
];

// Sauvegarder le fichier
XLSX.writeFile(workbook, "test-colisages-complet.xlsx");

console.log("✅ Fichier Excel de test créé : test-colisages-complet.xlsx");
console.log("\n📋 Cas de test inclus :");
console.log("  1. Produit complet avec toutes valeurs valides");
console.log("  2. Produit SANS HS Code (valeur par défaut)");
console.log("  3. Devise manquante (GBP)");
console.log("  4. Pays manquant (GB)");
console.log("  5. HS Code manquant (999999)");
console.log("  6. Régime EXO (0% DC)");
console.log("  7. Régime 100% DC");
console.log("  8. Régime mixte 70% DC");
console.log("  9. Régime mixte 50% DC");
console.log(" 10. Régime mixte 80% DC");
console.log(" 11. Plusieurs valeurs manquantes (JPY + JP + HS)");
console.log(" 12. Régime manquant (25% DC)");
console.log(" 13. Valeurs décimales précises");
console.log(" 14. Valeurs minimales");
console.log(" 15. Valeurs maximales");
console.log("\n🎯 Total : 15 lignes de test couvrant tous les cas possibles");
