const XLSX = require('xlsx');

// Générer des données de test avec la nouvelle structure
const testData = [];

// Différents types de régimes pour tester (seulement ceux qui existent dans la BD)
const regimeTypes = [
    { ratio: 0, description: "EXO (100% TR)" },
    { ratio: 100, description: "100% DC" }
];

// Sites Perenco pour Customer_Grouping
const sites = ["Site Perenco A", "Site Perenco B", "Site Perenco C"];

// Pays d'origine variés
const countries = ["CM", "FR", "US", "CN", "DE"];

// Devises
const currencies = ["XOF", "EUR", "USD"];



// Générer 100 lignes de test
for (let i = 1; i <= 100; i++) {
    const regimeType = regimeTypes[i % regimeTypes.length];
    const site = sites[i % sites.length];
    const country = countries[i % countries.length];
    const currency = currencies[i % currencies.length];
    const hsCode = "12345678";

    testData.push({
        "Row_Key": `ROW-${String(i).padStart(4, '0')}`,
        "HS_Code": hsCode,
        "Descr": `Produit ${i} - ${regimeType.description}`,
        "Command_No": `CMD-${String(i).padStart(4, '0')}`,
        "Supplier_Name": `Fournisseur ${i % 20 + 1}`,
        "Invoice_No": `INV-${String(i).padStart(4, '0')}`,
        "Currency": currency,
        "Qty": Math.floor(Math.random() * 500) + 10,
        "Unit_Prize": parseFloat((Math.random() * 200 + 10).toFixed(2)),
        "Gross_Weight": parseFloat((Math.random() * 500 + 20).toFixed(2)),
        "Net_Weight": parseFloat((Math.random() * 450 + 15).toFixed(2)),
        "Volume": parseFloat((Math.random() * 10 + 0.5).toFixed(2)),
        "Country_Origin": country,
        "Regime_Code": "IM4",
        "Regime_Ratio": regimeType.ratio,
        "Customer_Grouping": site
    });
}

// Créer le workbook
const worksheet = XLSX.utils.json_to_sheet(testData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Colisages");

// Définir la largeur des colonnes pour une meilleure lisibilité
worksheet['!cols'] = [
    { wch: 15 }, // Row_Key
    { wch: 12 }, // HS_Code
    { wch: 40 }, // Descr
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
    { wch: 12 }, // Regime_Code
    { wch: 12 }, // Regime_Ratio
    { wch: 20 }  // Customer_Grouping
];

// Écrire le fichier
XLSX.writeFile(workbook, "test-colisage-import-new.xlsx");
console.log("✅ Fichier test-colisage-import-new.xlsx créé avec succès!");
console.log(`📊 ${testData.length} lignes générées avec les nouveaux champs`);
console.log("\n📋 Structure des colonnes:");
console.log("  - Row_Key: Clé unique pour chaque ligne");
console.log("  - HS_Code: Code HS du produit");
console.log("  - Descr: Description du produit");
console.log("  - Command_No: Numéro de commande");
console.log("  - Supplier_Name: Nom du fournisseur");
console.log("  - Invoice_No: Numéro de facture");
console.log("  - Currency: Devise (XOF, EUR, USD)");
console.log("  - Qty: Quantité");
console.log("  - Unit_Prize: Prix unitaire");
console.log("  - Gross_Weight: Poids brut");
console.log("  - Net_Weight: Poids net");
console.log("  - Volume: Volume");
console.log("  - Country_Origin: Code ISO pays (CM, FR, US, CN, DE)");
console.log("  - Regime_Code: Code régime (IM4)");
console.log("  - Regime_Ratio: Ratio DC (0, 30, 50, 75, 100)");
console.log("  - Customer_Grouping: Site Perenco");
console.log("\n🎯 Types de régimes inclus:");
regimeTypes.forEach(rt => {
    console.log(`  - Ratio ${rt.ratio}%: ${rt.description}`);
});
