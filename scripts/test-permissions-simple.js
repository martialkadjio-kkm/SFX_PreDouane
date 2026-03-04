const { PrismaClient } = require('../src/generated/prisma/client');

async function testPermissions() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  console.log('🔍 Test simple des permissions...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connexion établie');

    // Test 1: Lecture TUtilisateurs
    console.log('\n1️⃣ Test lecture TUtilisateurs...');
    try {
      const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM TUtilisateurs`);
      console.log(`✅ Nombre d'utilisateurs: ${count[0].total}`);
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
      return false;
    }

    // Test 2: Lecture TSessions
    console.log('\n2️⃣ Test lecture TSessions...');
    try {
      const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM TSessions`);
      console.log(`✅ Nombre de sessions: ${count[0].total}`);
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
      return false;
    }

    // Test 3: Test avec Prisma ORM
    console.log('\n3️⃣ Test avec Prisma ORM...');
    try {
      const user = await prisma.tUtilisateurs.findFirst({
        where: { id: 0 }
      });
      
      if (user) {
        console.log(`✅ Utilisateur SYSTEM trouvé: ${user.codeUtilisateur}`);
      } else {
        console.log('⚠️ Utilisateur SYSTEM (ID=0) non trouvé');
      }
    } catch (error) {
      console.log(`❌ Erreur Prisma: ${error.message}`);
      return false;
    }

    // Test 4: Test session
    console.log('\n4️⃣ Test session...');
    try {
      const session = await prisma.tSessions.findFirst({
        where: { id: 0 }
      });
      
      if (session) {
        console.log(`✅ Session 0 trouvée`);
      } else {
        console.log('⚠️ Session 0 non trouvée');
      }
    } catch (error) {
      console.log(`❌ Erreur session: ${error.message}`);
      return false;
    }

    console.log('\n✅ Tous les tests de permissions réussis !');
    console.log('🚀 Vous pouvez maintenant exécuter: npm run seed');
    return true;

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testPermissions()
  .then((success) => {
    if (!success) {
      console.log('\n❌ Tests échoués. Exécutez le script SQL fix-prisma-user-permissions.sql');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });