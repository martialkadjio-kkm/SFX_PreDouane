import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Correction de la table TSessions...');

    try {
        await prisma.$executeRawUnsafe(`
      ALTER TABLE [dbo].[TSessions]
      ALTER COLUMN [Fin Session] [datetime2](7) NULL;
    `);

        console.log('✅ Table TSessions corrigée: [Fin Session] est maintenant nullable');
    } catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
