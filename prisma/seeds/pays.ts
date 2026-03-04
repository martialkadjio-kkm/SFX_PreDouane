import { PrismaClient } from '../../src/generated/prisma/client';

export async function seedPays(prisma: PrismaClient, sessionId: number) {
    console.log('🌍 Seed des pays...');

    // Récupérer la devise locale par défaut (EUR)
    const deviseEUR = await prisma.tDevises.findFirst({
        where: { codeDevise: 'EUR' },
    });

    if (!deviseEUR) {
        throw new Error('Devise EUR non trouvée. Exécutez seedDevises d\'abord.');
    }

    try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name');
        const countries = await res.json();

        const data = countries
            .map((c: any) => ({
                code: c.cca2,
                libelle: c.name?.common || c.name?.official || c.cca2,
            }))
            .filter((c: any) => c.code && c.libelle)
            .sort((a: any, b: any) => a.libelle.localeCompare(b.libelle));

        let count = 0;
        for (const country of data) {
            await prisma.tPays.upsert({
                where: { codePays: country.code },
                update: { libellePays: country.libelle },
                create: {
                    codePays: country.code,
                    libellePays: country.libelle,
                    deviseLocale: deviseEUR.id,
                    session: sessionId,
                    dateCreation: new Date(),
                },
            });
            count++;
        }

        console.log(`✅ ${count} pays créés/mis à jour.`);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des pays:', error);
        throw error;
    }
}
