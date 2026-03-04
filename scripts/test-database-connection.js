const { PrismaClient } = require('../src/generated/prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
  });

  console.log('🔍 Test de connexion à la base de données...\n');

  try {
    // Test 1: Connexion basique
    console.log('1️⃣ Test de connexion basique...');
    await prisma.$connect();
    console.log('✅ Connexion établie avec succès\n');

    // Test 2: Vérifier les permissions sur les tables principales
    console.log('2️⃣ Test des permissions sur les tables...\n');

    const tables = [
      'tUtilisateurs',
      'tSessions', 
      'tClients',
      'tDossiers',
      'tColisage',
      'tDevises',
      'tPays'
    ];

    for (const table of tables) {
      try {
        console.log(`   Testant ${table}...`);
        
        // Test SELECT avec TOP 1
        const query = `SELECT TOP 1 * FROM ${table}`;
        const result = await prisma.$queryRawUnsafe(query);
        console.log(`   ✅ ${table}: SELECT OK (${Array.isArray(result) ? result.length : 0} lignes)`);
        
      } catch (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    }

    // Test 3: Vérifier les vues
    console.log('\n3️⃣ Test des vues...\n');
    
    const views = [
      'VDossiers',
      'VColisage', 
      'VNotesDetail',
      'VSessions'
    ];

    for (const view of views) {
      try {
        console.log(`   Testant ${view}...`);
        const query = `SELECT TOP 1 * FROM ${view}`;
        const result = await prisma.$queryRawUnsafe(query);
        console.log(`   ✅ ${view}: SELECT OK`);
      } catch (error) {
        console.log(`   ❌ ${view}: ${error.message}`);
      }
    }

    // Test 4: Vérifier les permissions d'écriture
    console.log('\n4️⃣ Test des permissions d\'écriture...\n');
    
    try {
      console.log('   Testant INSERT sur tUtilisateurs...');
      // Test avec un utilisateur temporaire
      await prisma.$queryRaw`
        INSERT INTO tUtilisateurs (nom, email, motDePasse, role, sessionId, createdAt, updatedAt)
        VALUES ('TEST_PERMISSION', 'test@permission.com', 'test', 'USER', 0, GETDATE(), GETDATE())
      `;
      
      // Supprimer immédiatement
      await prisma.$queryRaw`DELETE FROM tUtilisateurs WHERE nom = 'TEST_PERMISSION'`;
      console.log('   ✅ INSERT/DELETE: OK');
      
    } catch (error) {
      console.log(`   ❌ INSERT: ${error.message}`);
    }

    // Test 5: Informations sur l'utilisateur actuel
    console.log('\n5️⃣ Informations sur l\'utilisateur de connexion...\n');
    
    try {
      const userInfo = await prisma.$queryRawUnsafe(`
        SELECT 
          SYSTEM_USER as current_user,
          USER_NAME() as user_name,
          DB_NAME() as database_name,
          @@SERVERNAME as server_name
      `);
      console.log('   Utilisateur actuel:', userInfo[0]);
      
      // Vérifier les rôles
      const roles = await prisma.$queryRawUnsafe(`
        SELECT 
          r.name as role_name,
          r.type_desc as role_type
        FROM sys.database_role_members rm
        JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
        JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
        WHERE m.name = USER_NAME()
      `);
      
      console.log('   Rôles assignés:', roles);
      
    } catch (error) {
      console.log(`   ❌ Info utilisateur: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }

  return true;
}

// Exécuter le test
testDatabaseConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ Test de connexion terminé');
    } else {
      console.log('\n❌ Test de connexion échoué');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });