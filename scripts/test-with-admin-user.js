// Test temporaire avec un utilisateur administrateur
// Modifiez temporairement le .env pour utiliser un compte admin

const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration temporaire avec utilisateur administrateur...\n');

// Lire le fichier .env actuel
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Configuration actuelle:');
const currentDbUrl = envContent.match(/DATABASE_URL="([^"]+)"/);
if (currentDbUrl) {
    console.log('URL actuelle:', currentDbUrl[1]);
}

console.log('\n💡 Pour tester avec un utilisateur administrateur:');
console.log('');
console.log('1️⃣ Sauvegardez votre .env actuel');
console.log('2️⃣ Modifiez temporairement DATABASE_URL dans .env:');
console.log('');

// Proposer différentes options d'URL admin
console.log('Option A - Authentification Windows (si disponible):');
console.log('DATABASE_URL="sqlserver://localhost:1433;database=SFX_PreDouane;integratedSecurity=true;trustServerCertificate=true;encrypt=false"');
console.log('');

console.log('Option B - Utilisateur sa (si mot de passe connu):');
console.log('DATABASE_URL="sqlserver://localhost:1433;database=SFX_PreDouane;user=sa;password=VOTRE_MOT_DE_PASSE_SA;trustServerCertificate=true;encrypt=false"');
console.log('');

console.log('Option C - Autre utilisateur admin:');
console.log('DATABASE_URL="sqlserver://localhost:1433;database=SFX_PreDouane;user=ADMIN_USER;password=ADMIN_PASSWORD;trustServerCertificate=true;encrypt=false"');
console.log('');

console.log('3️⃣ Exécutez: npm run seed');
console.log('4️⃣ Restaurez votre .env original');
console.log('');

console.log('⚠️  IMPORTANT: N\'oubliez pas de restaurer votre configuration originale après le seed !');

// Créer une sauvegarde automatique
const backupPath = path.join(__dirname, '.env.backup');
fs.writeFileSync(backupPath, envContent);
console.log(`✅ Sauvegarde créée: ${backupPath}`);

console.log('\n🔄 Alternative: Exécutez le script SQL fix-permissions-complete.sql');
console.log('   puis attendez 30 secondes avant de retenter npm run seed');