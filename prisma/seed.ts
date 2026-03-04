import { PrismaClient } from '../src/generated/prisma/client';
import { seedUtilisateurs } from './seeds/utilisateurs';
import { seedReferenceData } from './seeds/reference-data';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
async function main() {
  console.log('🚀 Seed de la base de données...\n');

  try {
    // Vérifier que les données de base existent (créées par sql.sql)
    const systemUser = await prisma.tUtilisateurs.findUnique({
      where: { id: 0 }
    });

    if (!systemUser) {
      throw new Error('❌ Utilisateur SYSTEM non trouvé! Exécutez d\'abord sql.sql dans SSMS');
    }

    console.log('✅ Utilisateur SYSTEM trouvé');

    const session0 = await prisma.tSessions.findUnique({
      where: { id: 0 }
    });

    if (!session0) {
      throw new Error('❌ Session 0 non trouvée! Exécutez d\'abord sql.sql dans SSMS');
    }

    console.log('✅ Session 0 trouvée');
    console.log('');

    // 1. Créer les données de référence
    // await seedReferenceData(prisma, 0);
    console.log('');

    // 2. Créer les utilisateurs de test
    console.log('📦 Création des utilisateurs de test...');
    await seedUtilisateurs(prisma, 0);
    console.log('');

    console.log('✅ Seed terminé avec succès!');
    console.log('\n📝 Vous pouvez maintenant:');
    console.log('   - Vous connecter avec: ADMIN, TEST, ou DEMO');
    console.log('   - Créer des clients, dossiers, etc.');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
