const XLSX = require('xlsx');
const path = require('path');

// Créer un fichier Excel de test simple sans Row_Key
function createTestHSCodeFile() {
  console.log('🔧 Création d\'un fichier Excel de test pour HSCode...\n');

  const testData = [
    {
      "HS_Code": "123456",
      "Description": "Produit de test 1"
    },
    {
      "HS_Code": "789012", 
      "Description": "Produit de test 2"
    },
    {
      "HS_Code": "345678",
      "Description": "Produit de test 3"
    },
    {
      "HS_Code": "901234",
      "Description": "Produit de test 4"
    },
    {
      "HS_Code": "567890",
      "Description": "Produit de test 5"
    }
  ];

  // Créer le workbook
  const worksheet = XLSX.utils.json_to_sheet(testData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "HSCodes");

  // Ajuster la largeur des colonnes
  worksheet['!cols'] = [
    { wch: 12 }, // HS_Code
    { wch: 40 }  // Description
  ];

  // Sauvegarder le fichier
  const fileName = 'test-hscode-import-simple.xlsx';
  const filePath = path.join(__dirname, fileName);
  
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Fichier créé: ${filePath}`);
  console.log('📋 Contenu:');
  testData.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.HS_Code} - ${item.Description}`);
  });
  
  console.log('\n🚀 Instructions:');
  console.log('1. Ouvrez votre application web');
  console.log('2. Allez dans la section HSCode');
  console.log('3. Cliquez sur "Importer Excel"');
  console.log(`4. Sélectionnez le fichier: ${fileName}`);
  console.log('5. Vérifiez que l\'import fonctionne sans erreur Row_Key');
  
  return filePath;
}

// Créer aussi un template mis à jour
function createUpdatedTemplate() {
  console.log('\n🔧 Création du template mis à jour...\n');

  const templateData = [
    {
      "HS_Code": "123456",
      "Description": "Exemple de produit"
    },
    {
      "HS_Code": "789012", 
      "Description": "Autre exemple"
    },
    {
      "HS_Code": "345678",
      "Description": "Troisième exemple"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "HSCodes");

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 40 }
  ];

  const templatePath = path.join(__dirname, 'template-hscodes-updated.xlsx');
  XLSX.writeFile(workbook, templatePath);
  
  console.log(`✅ Template mis à jour créé: ${templatePath}`);
  console.log('📋 Structure simplifiée:');
  console.log('   - HS_Code (obligatoire)');
  console.log('   - Description (obligatoire)');
  console.log('   - Plus de Row_Key requis !');
  
  return templatePath;
}

// Exécuter les fonctions
try {
  const testFile = createTestHSCodeFile();
  const templateFile = createUpdatedTemplate();
  
  console.log('\n✅ Fichiers créés avec succès !');
  console.log('\n💡 Changements apportés:');
  console.log('   ✅ Suppression de Row_Key du template');
  console.log('   ✅ Import simplifié avec seulement HS_Code et Description');
  console.log('   ✅ Identification par numéro de ligne automatique');
  console.log('   ✅ Validation et prévisualisation mises à jour');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}