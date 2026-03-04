const XLSX = require('xlsx');

// Données réalistes pour démonstration vidéo (1 min max)
const demoData = [];

// Données de base réalistes
const fournisseurs = [
    'PERENCO CAMEROON', 'TOTAL ENERGIES', 'SCHLUMBERGER', 'HALLIBURTON', 'BAKER HUGHES',
    'WEATHERFORD', 'TECHNIP FMC', 'SAIPEM', 'SUBSEA 7', 'AKER SOLUTIONS',
    'CAMERON INTERNATIONAL', 'NATIONAL OILWELL VARCO', 'DRIL-QUIP', 'OCEANEERING',
    'FUGRO', 'CGG SERVICES', 'BOURBON OFFSHORE', 'ZODIAC MARITIME', 'MAERSK DRILLING'
];

const sites = [
    'Site Perenco Kribi', 'Site Perenco Douala', 'Site Perenco Limbé', 'Site Perenco Yaoundé',
    'Terminal Kribi', 'Base Douala', 'Plateforme Offshore A', 'Plateforme Offshore B',
    'Centre Logistique Douala', 'Dépôt Kribi', 'Site Maintenance Limbé'
];

const codesPays = ['CM', 'FR', 'DE', 'GB', 'US', 'NO', 'NL', 'IT', 'SG', 'AE'];
const devises = ['XAF', 'USD', 'EUR', 'GBP', 'NOK'];

const hsCodes = [
    '84141000', '84145100', '84148000', '84212100', '84213100', '84219900',
    '73181500', '73182100', '73182200', '73269098', '76169990',
    '85011000', '85015100', '85015200', '85043100', '85044000',
    '90261000', '90262000', '90268000', '90279000', '90318000'
];

const descriptions = [
    'Pompe centrifuge haute pression pour forage',
    'Équipement de sécurité offshore - Détecteur de gaz',
    'Tuyauterie en acier inoxydable DN150',
    'Valve de sécurité automatique 300 PSI',
    'Compresseur d\'air industriel 50 HP',
    'Générateur électrique diesel 500 KVA',
    'Système de navigation GPS maritime',
    'Équipement de levage hydraulique 10T',
    'Instrumentation de mesure de pression',
    'Câblage électrique sous-marin étanche',
    'Moteur électrique triphasé 75 KW',
    'Système de filtration d\'eau industrielle',
    'Équipement de soudage automatique',
    'Capteur de température haute précision',
    'Système de communication radio VHF',
    'Équipement de plongée professionnelle',
    'Pompe à boue pour forage pétrolier',
    'Système de contrôle automatisé PLC',
    'Équipement de manutention portuaire',
    'Matériel de laboratoire d\'analyse'
];

// Générer 200 lignes de données réalistes
for (let i = 1; i <= 200; i++) {
    const fournisseur = fournisseurs[i % fournisseurs.length];
    const site = sites[i % sites.length];
    const codePays = codesPays[i % codesPays.length];
    const devise = devises[i % devises.length];
    const hsCode = (i === 1 || i === 2) ? '' : hsCodes[i % hsCodes.length]; // Seulement 2 lignes sans HS Code
    const description = descriptions[i % descriptions.length];
    
    // Régimes réalistes selon le type d'équipement
    let regimeRatio;
    if (i <= 50) {
        regimeRatio = 0; // Équipements exonérés (matériel pétrolier)
    } else if (i <= 100) {
        regimeRatio = 100; // Équipements avec droits complets
    } else if (i <= 150) {
        regimeRatio = 50; // Régime partiel
    } else {
        regimeRatio = [25, 75][i % 2]; // Alternance 25% et 75%
    }
    
    // Prix réalistes selon le type d'équipement
    const prixBase = i <= 50 ? 50000 : i <= 100 ? 25000 : i <= 150 ? 15000 : 35000;
    const variation = (Math.random() - 0.5) * 0.4; // ±20% de variation
    const prix = Math.round(prixBase * (1 + variation));
    
    // Quantités réalistes
    const qte = i <= 50 ? Math.ceil(Math.random() * 5) : // Équipements lourds: 1-5
               i <= 100 ? Math.ceil(Math.random() * 20) : // Équipements moyens: 1-20
               i <= 150 ? Math.ceil(Math.random() * 50) : // Petits équipements: 1-50
               Math.ceil(Math.random() * 100); // Consommables: 1-100
    
    // Poids et volumes réalistes
    const poidsUnitaire = i <= 50 ? 500 + Math.random() * 1000 : // Équipements lourds
                         i <= 100 ? 50 + Math.random() * 200 : // Équipements moyens
                         i <= 150 ? 5 + Math.random() * 45 : // Petits équipements
                         1 + Math.random() * 9; // Consommables
    
    const poidsBrut = Math.round((poidsUnitaire * qte) * 100) / 100;
    const poidsNet = Math.round(poidsBrut * 0.9 * 100) / 100;
    const volume = Math.round((poidsBrut / 800) * 100) / 100; // Densité approximative
    
    demoData.push({
        'Row_Key': `DEMO-${i.toString().padStart(3, '0')}`,
        'HS_Code': hsCode,
        'Descr': `${description} - Lot ${i}`,
        'Command_No': `PO-2025-${i.toString().padStart(4, '0')}`,
        'Supplier_Name': fournisseur,
        'Invoice_No': `INV-${new Date().getFullYear()}-${i.toString().padStart(4, '0')}`,
        'Currency': devise,
        'Qty': qte,
        'Unit_Prize': prix,
        'Gross_Weight': poidsBrut,
        'Net_Weight': poidsNet,
        'Volume': volume,
        'Country_Origin': codePays,
        'Regime_Code': '', // Toujours vide comme demandé
        'Regime_Ratio': regimeRatio,
        'Customer_Grouping': site
    });
}

// Créer le workbook avec données de démonstration
const worksheet = XLSX.utils.json_to_sheet(demoData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Demo Colisages');

// Ajuster les largeurs des colonnes
worksheet['!cols'] = [
    { wch: 12 }, // Row_Key
    { wch: 12 }, // HS_Code
    { wch: 45 }, // Descr
    { wch: 18 }, // Command_No
    { wch: 25 }, // Supplier_Name
    { wch: 18 }, // Invoice_No
    { wch: 8 },  // Currency
    { wch: 8 },  // Qty
    { wch: 12 }, // Unit_Prize
    { wch: 12 }, // Gross_Weight
    { wch: 12 }, // Net_Weight
    { wch: 10 }, // Volume
    { wch: 15 }, // Country_Origin
    { wch: 12 }, // Regime_Code
    { wch: 12 }, // Regime_Ratio
    { wch: 25 }  // Customer_Grouping
];

// Ajouter une feuille de résumé pour la démonstration
const resumeData = [
    { 'Métrique': 'Total lignes', 'Valeur': '200', 'Description': 'Données complètes pour démonstration' },
    { 'Métrique': 'Régime 0%', 'Valeur': '50 lignes', 'Description': 'Équipements pétroliers exonérés' },
    { 'Métrique': 'Régime 100%', 'Valeur': '50 lignes', 'Description': 'Équipements avec droits complets' },
    { 'Métrique': 'Régime 50%', 'Valeur': '50 lignes', 'Description': 'Régime partiel' },
    { 'Métrique': 'Régime 25%/75%', 'Valeur': '50 lignes', 'Description': 'Régimes variables' },
    { 'Métrique': 'Fournisseurs', 'Valeur': '19', 'Description': 'Entreprises pétrolières réelles' },
    { 'Métrique': 'Sites', 'Valeur': '11', 'Description': 'Localisations Perenco Cameroun' },
    { 'Métrique': 'Devises', 'Valeur': '5', 'Description': 'XAF, USD, EUR, GBP, NOK' },
    { 'Métrique': 'HS Codes', 'Valeur': '20 codes', 'Description': 'Codes réels équipements pétroliers' },
    { 'Métrique': 'Sans HS Code', 'Valeur': '2 lignes', 'Description': 'Présentation rapide avec validation' }
];

const resumeSheet = XLSX.utils.json_to_sheet(resumeData);
XLSX.utils.book_append_sheet(workbook, resumeSheet, 'Résumé Démo');

resumeSheet['!cols'] = [
    { wch: 20 }, // Métrique
    { wch: 15 }, // Valeur
    { wch: 40 }  // Description
];

// Sauvegarder le fichier de démonstration
XLSX.writeFile(workbook, 'demo-colisages-200-lignes-codes-pays.xlsx');

console.log('🎬 Fichier de démonstration créé: demo-colisages-200-lignes-codes-pays.xlsx');
console.log('');
console.log('📊 Contenu optimisé pour vidéo 1 minute:');
console.log('   ✅ 200 lignes de données réalistes');
console.log('   ✅ Fournisseurs pétroliers authentiques');
console.log('   ✅ Sites Perenco Cameroun réels');
console.log('   ✅ Équipements industriels variés');
console.log('   ✅ Prix et quantités cohérents');
console.log('   ✅ Régimes diversifiés (0%, 25%, 50%, 75%, 100%)');
console.log('   ✅ Devises multiples (XAF, USD, EUR, GBP, NOK)');
console.log('   ✅ HS Codes réels (2 lignes vides pour démo)');
console.log('   ✅ Regime_Code vide (comme demandé)');
console.log('   ✅ Aucune donnée manquante');
console.log('');
console.log('🎯 Cas de test couverts:');
console.log('   • 198 lignes avec HS codes (manquants en BD)');
console.log('   • 2 lignes sans HS code (validation rapide)');
console.log('   • Régimes variés pour démonstration');
console.log('   • Fournisseurs et sites réalistes');
console.log('   • Équipements pétroliers authentiques');
console.log('   • Workflow optimal pour présentation');
console.log('');
console.log('⏱️  Parfait pour démonstration vidéo courte et impactante!');