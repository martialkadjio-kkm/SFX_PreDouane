import { PrismaClient } from '../../src/generated/prisma/client';

export async function seedSystemData(prisma: PrismaClient) {
    console.log('🔧 Seed des données système...');

    // // 1. Groupe d'Entités par défaut
    // console.log('  → Groupe d\'entités par défaut...');
    // const groupeEntite = await prisma.tGroupesEntites.upsert({
    //     where: { id: 0 },
    //     update: { nomGroupeEntite: 'DEFAULT GROUP' },
    //     create: {
    //         id: 0,
    //         nomGroupeEntite: 'DEFAULT GROUP',
    //         session: 0,
    //         dateCreation: new Date(),
    //     },
    // });

    // // 2. Devise par défaut
    // console.log('  → Devise locale par défaut...');
    // const deviseLocale = await prisma.tDevises.upsert({
    //     where: { id: 0 },
    //     update: { codeDevise: '', libelleDevise: 'LOCAL CURRENCY' },
    //     create: {
    //         id: 0,
    //         codeDevise: '',
    //         libelleDevise: 'LOCAL CURRENCY',
    //         decimales: 2,
    //         deviseInactive: false,
    //         session: 0,
    //         dateCreation: new Date(),
    //     },
    // });

    // // 3. Pays par défaut
    // console.log('  → Pays par défaut...');
    // const pays = await prisma.tPays.upsert({
    //     where: { id: 0 },
    //     update: { codePays: '', libellePays: 'DEFAULT COUNTRY' },
    //     create: {
    //         id: 0,
    //         codePays: '',
    //         libellePays: 'DEFAULT COUNTRY',
    //         deviseLocale: deviseLocale.id,
    //         session: 0,
    //         dateCreation: new Date(),
    //     },
    // });

    // // 4. Entité par défaut
    // console.log('  → Entité par défaut...');
    // const entite = await prisma.tEntites.upsert({
    //     where: { id: 0 },
    //     update: { codeEntite: '', nomEntite: 'DEFAULT ENTITY' },
    //     create: {
    //         id: 0,
    //         codeEntite: '',
    //         nomEntite: 'DEFAULT ENTITY',
    //         groupeEntite: groupeEntite.id,
    //         pays: pays.id,
    //         session: 0,
    //         dateCreation: new Date(),
    //     },
    // });

    // // 5. Branche par défaut
    // console.log('  → Branche par défaut...');
    // await prisma.tBranches.upsert({
    //     where: { id: 0 },
    //     update: { codeBranche: '', nomBranche: 'DEFAULT BRANCH' },
    //     create: {
    //         id: 0,
    //         codeBranche: '',
    //         nomBranche: 'DEFAULT BRANCH',
    //         entite: entite.id,
    //         session: 0,
    //         dateCreation: new Date(),
    //     },
    // });

    // 6. Utilisateur SYSTEM
    console.log('  → Utilisateur SYSTEM...');
    const userSystem = await prisma.tUtilisateurs.upsert({
        where: { id: 0 },
        update: { codeUtilisateur: '', nomUtilisateur: 'SYSTEM' },
        create: {
            id: 0,
            codeUtilisateur: '',
            nomUtilisateur: 'SYSTEM',
            entite: 1,
            session: 0,
            dateCreation: new Date(),
        },
    });

    // 7. Session SYSTEM
    console.log('  → Session SYSTEM...');
    await prisma.tSessions.upsert({
        where: { id: 0 },
        update: { utilisateur: userSystem.id },
        create: {
            id: 0,
            utilisateur: userSystem.id,
            debutSession: new Date(),
            finSession: new Date(),
        },
    });

    // 8. Permissions Base (0-62)
    console.log('  → Permissions base...');
    for (let i = 0; i <= 62; i++) {
        await prisma.$executeRaw`
      IF NOT EXISTS (SELECT 1 FROM TPermissionsBase WHERE [ID Permission Base] = ${i})
      BEGIN
        INSERT INTO TPermissionsBase ([ID Permission Base], [Libelle Permission], [Permission Active], [Date Activation])
        VALUES (${i}, ${`Permission ${i}`}, 0, GETDATE())
      END
    `;
    }

    // 9. Rôle SYSTEM
    console.log('  → Rôle SYSTEM...');
    const roleSystem = await prisma.tRoles.upsert({
        where: { id: 0 },
        update: { libelleRole: 'SYSTEM' },
        create: {
            id: 0,
            libelleRole: 'SYSTEM',
            session: 0,
            dateCreation: new Date(),
        },
    });

    // 10. Rôle Admin
    console.log('  → Rôle Admin...');
    const roleAdmin = await prisma.tRoles.upsert({
        where: { libelleRole: 'Admin' },
        update: {},
        create: {
            libelleRole: 'Admin',
            session: 0,
            dateCreation: new Date(),
        },
    });

    // 11. Permissions pour le rôle SYSTEM (toutes les permissions)
    console.log('  → Permissions du rôle SYSTEM...');
    for (let i = 0; i <= 62; i++) {
        const existing = await prisma.tPermissonsRoles.findFirst({
            where: {
                role: roleSystem.id,
                permission: i,
            },
        });

        if (!existing) {
            await prisma.tPermissonsRoles.create({
                data: {
                    role: roleSystem.id,
                    permission: i,
                    session: 0,
                    dateCreation: new Date(),
                },
            });
        }
    }

    // 12. Assigner le rôle SYSTEM à l'utilisateur SYSTEM
    console.log('  → Rôle de l\'utilisateur SYSTEM...');
    await prisma.tRolesUtilisateurs.upsert({
        where: { id: 0 },
        update: { role: roleSystem.id, utilisateur: userSystem.id },
        create: {
            id: 0,
            role: roleSystem.id,
            utilisateur: userSystem.id,
            session: 0,
            dateCreation: new Date(),
        },
    });

    console.log('✅ Données système créées.');
    return { sessionId: 0, userId: userSystem.id };
}
