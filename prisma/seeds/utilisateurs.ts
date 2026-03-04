import { PrismaClient } from '../../src/generated/prisma/client';

/**
 * Seed minimal des utilisateurs de test pour l'authentification
 */
export async function seedUtilisateurs(prisma: PrismaClient, sessionId: number) {
    console.log('👥 Création des utilisateurs de test...');

    // 1. Créer le rôle Admin si nécessaire
    const roleAdmin = await prisma.tRoles.upsert({
        where: { libelleRole: 'Admin' },
        update: {},
        create: {
            libelleRole: 'Admin',
            session: sessionId,
            dateCreation: new Date(),
        },
    });
    console.log('  ✅ Rôle Admin prêt');

    // 2. Utilisateur ADMIN
    const userAdmin = await prisma.tUtilisateurs.upsert({
        where: { codeUtilisateur: 'ADMIN' },
        update: { nomUtilisateur: 'Administrateur' },
        create: {
            codeUtilisateur: 'ADMIN',
            nomUtilisateur: 'Administrateur',
            entite: 1,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    // Assigner le rôle
    await prisma.tRolesUtilisateurs.upsert({
        where: {
            id: userAdmin.id * 1000 + roleAdmin.id, // ID unique temporaire
        },
        update: {},
        create: {
            utilisateur: userAdmin.id,
            role: roleAdmin.id,
            session: sessionId,
            dateCreation: new Date(),
        },
    }).catch(() => {
        // Ignore si déjà existe
    });

    console.log('  ✅ ADMIN créé');

    // 3. Utilisateur TEST
    const userTest = await prisma.tUtilisateurs.upsert({
        where: { codeUtilisateur: 'TEST' },
        update: { nomUtilisateur: 'Utilisateur Test' },
        create: {
            codeUtilisateur: 'TEST',
            nomUtilisateur: 'Utilisateur Test',
            entite: 1,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    await prisma.tRolesUtilisateurs.upsert({
        where: {
            id: userTest.id * 1000 + roleAdmin.id,
        },
        update: {},
        create: {
            utilisateur: userTest.id,
            role: roleAdmin.id,
            session: sessionId,
            dateCreation: new Date(),
        },
    }).catch(() => { });

    console.log('  ✅ TEST créé');

    // 4. Utilisateur DEMO
    const userDemo = await prisma.tUtilisateurs.upsert({
        where: { codeUtilisateur: 'DEMO' },
        update: { nomUtilisateur: 'Utilisateur Demo' },
        create: {
            codeUtilisateur: 'DEMO',
            nomUtilisateur: 'Utilisateur Demo',
            entite: 1,
            session: sessionId,
            dateCreation: new Date(),
        },
    });

    await prisma.tRolesUtilisateurs.upsert({
        where: {
            id: userDemo.id * 1000 + roleAdmin.id,
        },
        update: {},
        create: {
            utilisateur: userDemo.id,
            role: roleAdmin.id,
            session: sessionId,
            dateCreation: new Date(),
        },
    }).catch(() => { });

    console.log('  ✅ DEMO créé');
}
