const { PrismaClient } = require('../src/generated/prisma/client');

async function testWithFreshConnection() {
  console.log('🔄 Test avec nouvelle connexion Prisma...\n');

  // Créer une nouvelle instance Prisma avec logs détaillés
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Forcer une nouvelle connexion
    await prisma.$connect();
    console.log('✅ Nouvelle connexion établie');

    // Attendre un peu pour s'assurer que la connexion est fraîche
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test simple
    console.log('\n🔍 Test de lecture...');
    
    try {
      // Utiliser une requête très simple
      const result = await prisma.$queryRawUnsafe(`
        SELECT TOP 1 [ID Utilisateur], [Code Utilisateur] 
        FROM TUtilisateurs 
        WHERE [ID Utilisateur] = 0
      `);
      
      if (result && result.length > 0) {
        console.log('✅ Lecture réussie !');
        console.log('Utilisateur trouvé:', result[0]);
        return true;
      } else {
        console.log('⚠️ Aucun utilisateur avec ID=0 trouvé');
        return true; // Pas d'erreur de permission
      }
      
    } catch (error) {
      console.log('❌ Erreur de lecture:', error.message);
      
      if (error.message.includes('SELECT permission was denied')) {
        console.log('\n💡 Les permissions ne sont pas encore effectives.');
        console.log('Solutions possibles:');
        console.log('1. Redémarrer SQL Server');
        console.log('2. Attendre quelques minutes');
        console.log('3. Vérifier avec le script verify-user-roles.sql');
        return false;
      }
      
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testWithFreshConnection()
  .then((success) => {
    if (success) {
      console.log('\n🚀 Permissions OK ! Vous pouvez essayer: npm run seed');
    } else {
      console.log('\n❌ Permissions toujours en attente');
    }
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
  });