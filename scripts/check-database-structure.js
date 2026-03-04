const { PrismaClient } = require('../src/generated/prisma/client');

async function checkDatabaseStructure() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  console.log('🔍 Vérification de la structure de la base de données...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connexion établie\n');

    // 1. Lister toutes les tables
    console.log('1️⃣ Tables disponibles:\n');
    try {
      const tables = await prisma.$queryRawUnsafe(`
        SELECT TABLE_NAME, TABLE_TYPE 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_CATALOG = 'SFX_PreDouane'
        ORDER BY TABLE_TYPE, TABLE_NAME
      `);
      
      tables.forEach(table => {
        console.log(`   ${table.TABLE_TYPE}: ${table.TABLE_NAME}`);
      });
      
    } catch (error) {
      console.log(`❌ Erreur listage tables: ${error.message}`);
    }

    // 2. Vérifier la structure de TUtilisateurs
    console.log('\n2️⃣ Structure de TUtilisateurs:\n');
    try {
      const columns = await prisma.$queryRawUnsafe(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'TUtilisateurs'
        ORDER BY ORDINAL_POSITION
      `);
      
      if (columns.length > 0) {
        console.log('   Colonnes:');
        columns.forEach(col => {
          console.log(`     - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      } else {
        console.log('   ❌ Table TUtilisateurs non trouvée ou pas de permissions');
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur structure TUtilisateurs: ${error.message}`);
    }

    // 3. Test simple de lecture
    console.log('\n3️⃣ Test de lecture simple:\n');
    try {
      const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM TUtilisateurs`);
      console.log(`   ✅ Nombre d'utilisateurs: ${count[0].total}`);
    } catch (error) {
      console.log(`   ❌ Erreur lecture: ${error.message}`);
    }

    // 4. Vérifier les permissions de l'utilisateur
    console.log('\n4️⃣ Permissions de l\'utilisateur:\n');
    try {
      const permissions = await prisma.$queryRawUnsafe(`
        SELECT 
          p.permission_name,
          p.state_desc,
          s.name as principal_name
        FROM sys.database_permissions p
        JOIN sys.objects o ON p.major_id = o.object_id
        JOIN sys.database_principals s ON p.grantee_principal_id = s.principal_id
        WHERE o.name = 'TUtilisateurs'
        AND s.name = USER_NAME()
      `);
      
      if (permissions.length > 0) {
        permissions.forEach(perm => {
          console.log(`   ${perm.permission_name}: ${perm.state_desc} pour ${perm.principal_name}`);
        });
      } else {
        console.log('   ❌ Aucune permission directe trouvée');
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur permissions: ${error.message}`);
    }

    // 5. Vérifier les rôles de l'utilisateur
    console.log('\n5️⃣ Rôles de l\'utilisateur:\n');
    try {
      const userInfo = await prisma.$queryRawUnsafe(`
        SELECT 
          USER_NAME() as current_user,
          IS_MEMBER('db_owner') as is_db_owner,
          IS_MEMBER('db_datareader') as is_datareader,
          IS_MEMBER('db_datawriter') as is_datawriter
      `);
      
      const user = userInfo[0];
      console.log(`   Utilisateur: ${user.current_user}`);
      console.log(`   db_owner: ${user.is_db_owner ? 'OUI' : 'NON'}`);
      console.log(`   db_datareader: ${user.is_datareader ? 'OUI' : 'NON'}`);
      console.log(`   db_datawriter: ${user.is_datawriter ? 'OUI' : 'NON'}`);
      
    } catch (error) {
      console.log(`   ❌ Erreur rôles: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure()
  .then(() => {
    console.log('\n✅ Vérification terminée');
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });