const XLSX = require("xlsx");

// Données de test complètes pour tester tous les scénarios d'optimisation
const testData = [
    // Cas 1: Données complètes existantes (devrait passer sans problème)
    {
        "Row_Key": "LIGNE-001",
        "HS_Code": "123456", // HS Code existant
        "Descr": "Produit standard - Tout existe",
        "Command_No": "CMD-001",
        "Supplier_Name": "Fournisseur A",
        "Invoice_No": "FACT-001",
        "Currency": "XOF", // Devise existante
        "Qty": 100,
        "Unit_Prize": 25000,
        "Gross_Weight": 150,
        "Net_Weight": 140,
        "Volume": 2.5,
        "Country_Origin": "CM", // Pays existant
        "Customer_Grouping": "Site Perenco"
    },
    
    // Cas 2: Devise manquante (USD n'existe peut-être pas)
    {
        "Row_Key": "LIGNE-002",
        "HS_Code": "789012",
        "Descr": "Produit avec devise manquante",
        "Command_No": "CMD-002",
        "Supplier_Name": "Fournisseur B",
        "Invoice_No": "FACT-002",
        "Currency": "USD", // Devise potentiellement manquante
        "Qty": 50,
        "Unit_Prize": 1500,
        "Gross_Weight": 75,
        "Net_Weight": 70,
        "Volume": 1.2,
        "Country_Origin": "CM",
        "Customer_Grouping": "Site Douala"
    },
    
    // Cas 3: Pays manquant
    {
        "Row_Key": "LIGNE-003",
        "Descr": "Produit avec pays manquant",
        "Command_No": "CMD-003",
        "Supplier_Name": "Fournisseur C",
        "Invoice_No": "FACT-003",
        "Currency": "XOF",
        "Qty": 25,
        "Unit_Prize": 500,
        "Gross_Weight": 30,
        "Net_Weight": 28,
        "Volume": 0.5,
        "Country_Origin": "NEWCOUNTRY", // Pays manquant
        "Customer_Grouping": "Site Kribi"
    },
    
    // Cas 4: HS Code manquant
    {
        "Row_Key": "LIGNE-004",
        "HS_Code": "999999", // HS Code manquant
        "Descr": "Produit avec HS Code manquant",
        "Command_No": "CMD-004",
        "Supplier_Name": "Fournisseur D",
        "Invoice_No": "FACT-004",
        "Currency": "XOF",
        "Qty": 200,
        "Unit_Prize": 15000,
        "Gross_Weight": 300,
        "Net_Weight": 280,
        "Volume": 5.0,
        "Country_Origin": "CM",
        "Customer_Grouping": "Site Limbé"
    },
    
    // Cas 5: Plusieurs valeurs manquantes
    {
        "Row_Key": "LIGNE-005",
        "HS_Code": "888888", // HS Code manquant
        "Descr": "Produit avec plusieurs valeurs manquantes",
        "Command_No": "CMD-005",
        "Supplier_Name": "Fournisseur E",
        "Invoice_No": "FACT-005",
        "Currency": "EUR", // Devise potentiellement manquante
        "Qty": 75,
        "Unit_Prize": 35000,
        "Gross_Weight": 120,
        "Net_Weight": 110,
        "Volume": 2.0,
        "Country_Origin": "TESTLAND", // Pays manquant
        "Customer_Grouping": "Site Yaoundé"
    },
    
    // Cas 6: Devise différente
    {
        "Row_Key": "LIGNE-006",
        "Descr": "Produit avec devise GBP",
        "Command_No": "CMD-006",
        "Supplier_Name": "Fournisseur F",
        "Invoice_No": "FACT-006",
        "Currency": "GBP", // Devise potentiellement manquante
        "Qty": 10,
        "Unit_Prize": 800,
        "Gross_Weight": 20,
        "Net_Weight": 18,
        "Volume": 0.3,
        "Country_Origin": "GB", // Pays potentiellement manquant
        "Customer_Grouping": "Site Limbé"
    },
    
    // Cas 7: Sans HS Code (optionnel)
    {
        "Row_Key": "LIGNE-007",
        "Descr": "Produit sans HS Code spécifique",
        "Command_No": "CMD-007",
        "Supplier_Name": "Fournisseur G",
        "Invoice_No": "FACT-007",
        "Currency": "XOF",
        "Qty": 150,
        "Unit_Prize": 12000,
        "Gross_Weight": 200,
        "Net_Weight": 190,
        "Volume": 3.0,
        "Country_Origin": "CM",
        "Customer_Grouping": "Site Perenco"
    },
    
    // Cas 8: Combinaison complexe
    {
        "Row_Key": "LIGNE-008",
        "HS_Code": "777777", // HS Code manquant
        "Descr": "Produit complexe multi-manquant",
        "Command_No": "CMD-008",
        "Supplier_Name": "Fournisseur H",
        "Invoice_No": "FACT-008",
        "Currency": "JPY", // Devise manquante
        "Qty": 5,
        "Unit_Prize": 50000,
        "Gross_Weight": 100,
        "Net_Weight": 95,
        "Volume": 1.5,
        "Country_Origin": "JP", // Pays manquant
        "Customer_Grouping": "Site Kribi"
    }
];

// Créer le workbook
const worksheet = XLSX.utils.json_to_sheet(testData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Colisages");

// Largeurs des colonnes optimisées
worksheet['!cols'] = [
    { wch: 15 }, // Row_Key
    { wch: 12 }, // HS_Code (optionnel)
    { wch: 45 }, // Descr
    { wch: 15 }, // Command_No
    { wch: 25 }, // Supplier_Name
    { wch: 15 }, // Invoice_No
    { wch: 10 }, // Currency
    { wch: 10 }, // Qty
    { wch: 15 }, // Unit_Prize
    { wch: 15 }, // Gross_Weight
    { wch: 15 }, // Net_Weight
    { wch: 10 }, // Volume
    { wch: 15 }, // Country_Origin
    { wch: 20 }  // Customer_Grouping
];

// Sauvegarder le fichier
XLSX.writeFile(workbook, "test-colisages-complet-optimise.xlsx");

console.log("✅ Fichier Excel de test créé: test-colisages-complet-optimise.xlsx");
console.log("📋 Contient 8 lignes de test avec différents scénarios:");
console.log("   - Données complètes existantes");
console.log("   - Devises manquantes (USD, EUR, GBP, JPY)");
console.log("   - Pays manquants (NEWCOUNTRY, TESTLAND, GB, JP)");
console.log("   - HS Codes manquants (999999, 888888, 777777)");
console.log("   - Combinaisons multiples");
console.log("🎯 Régime automatiquement défini à EXO (0% DC)");