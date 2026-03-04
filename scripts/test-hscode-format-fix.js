const XLSX = require('xlsx');
const path = require('path');

// Créer un fichier Excel avec des HSCodes numériques (comme dans l'erreur)
function createTestFileWithNumericHSCodes() {
  console.log('🔧 Création d\'un fichier Excel avec HSCodes numériques...\n');

  const testData = [
    {
      "HS_Code": 8481808190,  // Nombre (comme dans l'erreur)
      "Description": "Robinets et vannes"
    },
    {
      "HS_Code": 8205200000,  // Nombre
      "Description": "Marteaux et masses"
    },
    {
      "HS_Code": 4009310090,  // Nombre
      "Description": "Tubes en caoutchouc"
    },
    {
      "HS_Code": 7312900000,  // Nombre
      "Description": "Torons et câbles"
    },
    {
      "HS_Code": 4002999000,  // Nombre
      "Description": "Caoutchouc synthétique"
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
  const fileName = 'test-hscode-numeric-fix.xlsx';
  const filePath = path.join(__dirname, fileName);
  
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Fichier créé: ${filePath}`);
  console.log('📋 Contenu (HSCodes numériques):');
  testData.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.HS_Code} - ${item.Description}`);
  });
  
  return filePath;
}

// Créer aussi un fichier avec des HSCodes en string (format correct)
function createTestFileWithStringHSCodes() {
  console.log('\n🔧 Création d\'un fichier Excel avec HSCodes en string...\n');

  const testData = [
    {
      "HS_Code": "8481808190",  // String
      "Description": "Robinets et vannes"
    },
    {
      "HS_Code": "8205200000",  // String
      "Description": "Marteaux et masses"
    },
    {
      "HS_Code": "4009310090",  // String
      "Description": "Tubes en caoutchouc"
    },
    {
      "HS_Code": "7312900000",  // String
      "Description": "Torons et câbles"
    },
    {
      "HS_Code": "4002999000",  // String
      "Description": "Caoutchouc synthétique"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(testData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "HSCodes");

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 40 }
  ];

  const fileName = 'test-hscode-string-format.xlsx';
  const filePath = path.join(__dirname, fileName);
  
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Fichier créé: ${filePath}`);
  console.log('📋 Contenu (HSCodes string):');
  testData.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.HS_Code} - ${item.Description}`);
  });
  
  return filePath;
}

// Créer un fichier avec des cas d'erreur pour tester la validation
function createTestFileWithErrors() {
  console.log('\n🔧 Création d\'un fichier Excel avec des erreurs pour tester la validation...\n');

  const testData = [
    {
      "HS_Code": "8481808190",  // OK
      "Description": "Robinets et vannes"
    },
    {
      "HS_Code": "ABC123",      // Erreur: contient des lettres
      "Description": "Test avec lettres"
    },
    {
      "HS_Code": "123",         // Erreur: trop court
      "Description": "Test trop court"
    },
    {
      "HS_Code": "12345678901", // Erreur: trop long
      "Description": "Test trop long"
    },
    {
      "HS_Code": "",            // Erreur: vide
      "Description": "Test vide"
    },
    {
      "HS_Code": "8205200000",  // OK
      "Description": ""         // Erreur: description vide
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(testData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "HSCodes");

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 40 }
  ];

  const fileName = 'test-hscode-validation-errors.xlsx';
  const filePath = path.join(__dirname, fileName);
  
  XLSX.writeFile(workbook, filePath);
  
  console.log(`✅ Fichier créé: ${filePath}`);
  console.log('📋 Contenu (avec erreurs pour test):');
  testData.forEach((item, index) => {
    const status = item.HS_Code === "8481808190" || item.HS_Code === "8205200000" ? "✅ OK" : "❌ Erreur";
    console.log(`   ${index + 1}. ${item.HS_Code || "(vide)"} - ${item.Description || "(vide)"} ${status}`);
  });
  
  return filePath;
}

// Exécuter les fonctions
try {
  console.log('🚀 CORRECTION DU PROBLÈME HSCODE NUMERIC/STRING\n');
  console.log('===============================================\n');
  
  const numericFile = createTestFileWithNumericHSCodes();
  const stringFile = createTestFileWithStringHSCodes();
  const errorFile = createTestFileWithErrors();
  
  console.log('\n✅ Tous les fichiers de test créés !');
  console.log('\n💡 Correction apportée:');
  console.log('   ✅ Conversion automatique des HSCodes numériques en string');
  console.log('   ✅ Validation du format HSCode (4-10 chiffres uniquement)');
  console.log('   ✅ Trim des espaces en début/fin');
  console.log('   ✅ Messages d\'erreur détaillés');
  
  console.log('\n🧪 Tests recommandés:');
  console.log('1. Testez avec test-hscode-numeric-fix.xlsx (devrait maintenant fonctionner)');
  console.log('2. Testez avec test-hscode-string-format.xlsx (devrait fonctionner)');
  console.log('3. Testez avec test-hscode-validation-errors.xlsx (devrait montrer les erreurs)');
  
  console.log('\n🔧 Modifications dans le code:');
  console.log('   - String() conversion pour HS_Code et Description');
  console.log('   - .trim() pour supprimer les espaces');
  console.log('   - Validation regex /^\\d+$/ pour chiffres uniquement');
  console.log('   - Validation longueur 4-10 caractères');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}