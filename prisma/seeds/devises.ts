import { PrismaClient } from '../../src/generated/prisma/client';

export async function seedDevises(prisma: PrismaClient, sessionId: number) {
    console.log('🌍 Seed des devises...');

    const devises = [
        { code: 'EUR', libelle: 'Euro', decimales: 2, inactive: false },
        { code: 'USD', libelle: 'United States dollar', decimales: 2, inactive: false },
        { code: 'XOF', libelle: 'West African CFA franc', decimales: 0, inactive: false },
        { code: 'XAF', libelle: 'Central African CFA franc', decimales: 0, inactive: false },
        { code: 'GBP', libelle: 'British pound', decimales: 2, inactive: false },
        { code: 'JPY', libelle: 'Japanese yen', decimales: 0, inactive: false },
        { code: 'CHF', libelle: 'Swiss franc', decimales: 2, inactive: false },
        { code: 'CAD', libelle: 'Canadian dollar', decimales: 2, inactive: false },
        { code: 'AUD', libelle: 'Australian dollar', decimales: 2, inactive: false },
        { code: 'CNY', libelle: 'Chinese yuan', decimales: 2, inactive: false },
        { code: 'MAD', libelle: 'Moroccan dirham', decimales: 2, inactive: false },
        { code: 'TND', libelle: 'Tunisian dinar', decimales: 3, inactive: false },
        { code: 'DZD', libelle: 'Algerian dinar', decimales: 2, inactive: false },
    ];

    let count = 0;
    for (const devise of devises) {
        await prisma.tDevises.upsert({
            where: { codeDevise: devise.code },
            update: {
                libelleDevise: devise.libelle,
                decimales: devise.decimales,
                deviseInactive: devise.inactive,
            },
            create: {
                codeDevise: devise.code,
                libelleDevise: devise.libelle,
                decimales: devise.decimales,
                deviseInactive: devise.inactive,
                session: sessionId,
                dateCreation: new Date(),
            },
        });
        count++;
    }

    console.log(`✅ ${count} devises créées/mises à jour.`);
}
