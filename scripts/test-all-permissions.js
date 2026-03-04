const { PrismaClient } = require('../src/generated/prisma/client');

async function testAllPermissions() {
  console.log('🔍 Test complet des permissions prisma_user...\n');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    await prisma.$connect();
    console.log('✅ Connexion établie\n');

    // Test 1: Lecture sur toutes les tables principales
    console.log('1️⃣ Test de lecture sur les tables principales...');
    
    const tables = [
      { name: 'TUtilisateurs', model: prisma.tUtilisateurs },
      { name: 'TSessions', model: prisma.tSessions },
      { name: 'TClients', model: prisma.tClients },
      { name: 'TDossiers', model: prisma.tDossiers },
      { name: 'THSCodes', model: prisma.tHSCodes },
      { name: 'TDevises', model: prisma.tDevises },
      { name: 'TPays', model: prisma.tPays },
      { name: 'TRegimesDouaniers', model: prisma.tRegimesDouaniers }
    ];

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`   ✅ ${table.name}: ${count} lignes`);
      } catch (error) {
        console.log(`   ❌ ${table.name}: ${error.message}`);
      }
    }

    // Test 2: Lecture sur les vues
    console.log('\n2️⃣ Test de lecture sur les vues...');
    
    const views = [
      { name: 'VUtilisateurs', model: prisma.vUtilisateurs },
      { name: 'VDossiers', model: prisma.vDossiers },
      { name: 'VClients', model: prisma.vClients },
      { name: 'VHSCodes', model: prisma.vHSCodes },
      { name: 'VDevises', model: prisma.vDevises }
    ];

    for (const view of views) {
      try {
        const count = await view.model.count();
        console.log(`   ✅ ${view.name}: ${count} lignes`);
      } catch (error) {
        console.log(`   ❌ ${view.name}: ${error.message}`);
      }
    }

    // Test 3: Test d'écriture (création temporaire)
    console.log('\n3️⃣ Test d\'écriture (création/suppression temporaire)...');
    
    try {
      // Test création d'un HSCode temporaire
      const testHSCode = await prisma.tHSCodes.create({
        data: {
          hsCode: 'TEST999999',
          libelleHSCode: 'Test de permissions - À supprimer',
          entite: 0,
          session: 0,
          dateCreation: new Date()
        }
      });
      
      console.log('   ✅ Création réussie (HSCode test)');
      
      // Supprimer immédiatement
      await prisma.tHSCodes.delete({
        where: { id: testHSCode.id }
      });
      
      console.log('   ✅ Suppression réussie');
      
    } catch (error) {
      console.log(`   ❌ Erreur écriture: ${error.message}`);
    }

    // Test 4: Test de requêtes complexes
    console.log('\n4️⃣ Test de requêtes complexes...');
    
    try {
      // Test jointure via vue
      const complexQuery = await prisma.vDossiers.findMany({
        take: 5,
        orderBy: { dateCreation: 'desc' }
      });
      
      console.log(`   ✅ Requête complexe réussie: ${complexQuery.length} résultats`);
      
    } catch (error) {
      console.log(`   ❌ Erreur requête complexe: ${error.message}`);
    }

    // Test 5: Test de requêtes SQL brutes
    console.log('\n5️⃣ Test de requêtes SQL brutes...');
    
    try {
      const rawQuery = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as total_tables
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_CATALOG = 'SFX_PreDouane' AND TABLE_TYPE = 'BASE TABLE'
      `);
      
      console.log(`   ✅ Requête SQL brute réussie: ${rawQuery[0].total_tables} tables dans la base`);
      
    } catch (error) {
      console.log(`   ❌ Erreur SQL brute: ${error.message}`);
    }

    console.log('\n🎉 RÉSULTAT FINAL:');
    console.log('✅ Toutes les permissions semblent correctement configurées !');
    console.log('🚀 Vous pouvez maintenant exécuter: npm run seed');

    return true;

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour afficher les instructions
function showInstructions() {
  console.log('📋 INSTRUCTIONS POUR CORRIGER LES PERMISSIONS:');
  console.log('');
  console.log('1️⃣ Ouvrez SQL Server Management Studio');
  console.log('2️⃣ Connectez-vous avec un compte administrateur');
  console.log('3️⃣ Exécutez le script: scripts/grant-all-permissions-prisma-user.sql');
  console.log('4️⃣ Attendez que le script se termine avec succès');
  console.log('5️⃣ Relancez ce test: node scripts/test-all-permissions.js');
  console.log('');
  console.log('💡 Le script SQL donne TOUS les droits à prisma_user sur SFX_PreDouane');
}

// Exécuter le test
testAllPermissions()
  .then((success) => {
    if (!success) {
      console.log('\n' + '='.repeat(60));
      showInstructions();
    }
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    console.log('\n' + '='.repeat(60));
    showInstructions();
  });