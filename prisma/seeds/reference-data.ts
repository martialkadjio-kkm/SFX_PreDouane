import { PrismaClient } from '../../src/generated/prisma/client';

/**
 * Seed des données de référence minimales pour faire fonctionner l'application
 */
export async function seedReferenceData(prisma: PrismaClient, sessionId: number) {
    console.log('📦 Création des données de référence...');

    // 1. Groupe d'entités par défaut
    console.log('  → Groupe d\'entités...');
    const groupeEntite = await prisma.tGroupesEntites.upsert({
        where: { nomGroupeEntite: 'Groupe Principal' },
        update: {},
        create: {
            nomGroupeEntite: 'Groupe Principal',
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    // 2. Devise par défaut (USD si pas déjà créée par sql.sql)
    console.log('  → Devises...');
    const deviseUSD = await prisma.tDevises.upsert({
        where: { codeDevise: 'USD' },
        update: {},
        create: {
            codeDevise: 'USD',
            libelleDevise: 'US Dollar',
            decimales: 2,
            deviseInactive: false,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    // 3. Pays par défaut (USA)
    console.log('  → Pays...');
    const paysUSA = await prisma.tPays.upsert({
        where: { codePays: 'US' },
        update: {},
        create: {
            codePays: 'US',
            libellePays: 'United States',
            deviseLocale: deviseUSD.id,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    // 4. Entité par défaut
    console.log('  → Entité...');
    const entite = await prisma.tEntites.upsert({
        where: { nomEntite: 'Entité Principale' },
        update: {},
        create: {
            codeEntite: 'ENT001',
            nomEntite: 'Entité Principale',
            groupeEntite: groupeEntite.id,
            pays: paysUSA.id,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    // 5. Branche par défaut
    console.log('  → Branche...');
    const branche = await prisma.tBranches.upsert({
        where: { codeBranche: 'BR001' },
        update: {},
        create: {
            codeBranche: 'BR001',
            nomBranche: 'Branche Principale',
            entite: entite.id,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    // 6. Sens de trafic
    console.log('  → Sens de trafic...');
    let sensImport = await prisma.tSensTrafic.findFirst({
        where: { libelle: 'Import' },
    });
    if (!sensImport) {
        sensImport = await prisma.tSensTrafic.create({
            data: {
                libelle: 'Import',
                session: sessionId,
                dateCreation: new Date(),
            },
        });
    }

    let sensExport = await prisma.tSensTrafic.findFirst({
        where: { libelle: 'Export' },
    });
    if (!sensExport) {
        sensExport = await prisma.tSensTrafic.create({
            data: {
                libelle: 'Export',
                session: sessionId,
                dateCreation: new Date(),
            },
        });
    }

    // 7. Modes de transport
    console.log('  → Modes de transport...');
    let modeAerien = await prisma.tModesTransport.findFirst({
        where: { libelle: 'Aérien' },
    });
    if (!modeAerien) {
        modeAerien = await prisma.tModesTransport.create({
            data: {
                libelle: 'Aérien',
                session: sessionId,
                dateCreation: new Date(),
            },
        });
    }

    let modeMaritime = await prisma.tModesTransport.findFirst({
        where: { libelle: 'Maritime' },
    });
    if (!modeMaritime) {
        modeMaritime = await prisma.tModesTransport.create({
            data: {
                libelle: 'Maritime',
                session: sessionId,
                dateCreation: new Date(),
            },
        });
    }

    // 8. Types de dossiers
    console.log('  → Types de dossiers...');
    const typeImportAerien = await prisma.tTypesDossiers.findFirst({
        where: { libelle: 'Import Aérien' },
    });
    if (!typeImportAerien) {
        await prisma.tTypesDossiers.create({
            data: {
                libelle: 'Import Aérien',
                sensTrafic: sensImport.id,
                modeTransport: modeAerien.id,
                session: sessionId,
                dateCreation: new Date(),
            },
        });
    }

    const typeExportMaritime = await prisma.tTypesDossiers.findFirst({
        where: { libelle: 'Export Maritime' },
    });
    if (!typeExportMaritime) {
        await prisma.tTypesDossiers.create({
            data: {
                libelle: 'Export Maritime',
                sensTrafic: sensExport.id,
                modeTransport: modeMaritime.id,
                session: sessionId,
                dateCreation: new Date(),
            },
        });
    }

    // 9. Statuts de dossier
    console.log('  → Statuts de dossier...');
    await prisma.tStatutsDossier.upsert({
        where: { libelleStatutDossier: 'Ouvert' },
        update: {},
        create: {
            libelleStatutDossier: 'Ouvert',
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    await prisma.tStatutsDossier.upsert({
        where: { libelleStatutDossier: 'Fermé' },
        update: {},
        create: {
            libelleStatutDossier: 'Fermé',
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    // 10. Conversion par défaut
    console.log('  → Conversion...');
    await prisma.tConvertions.upsert({
        where: { dateConvertion: new Date('2025-01-01') },
        update: {},
        create: {
            dateConvertion: new Date('2025-01-01'),
            entite: entite.id,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    console.log('  ✅ Données de référence créées');
}
