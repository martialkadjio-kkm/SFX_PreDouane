/**
 * Service d'authentification simplifié utilisant TUtilisateurs et TSessions
 * Les utilisateurs sont créés directement dans SQL Server, pas via l'interface
 */

import prisma from '../prisma';
import { createSession, closeSession } from '../session/session-manager';
import { getPermissionsUtilisateur } from '../database/functions';

export interface AuthUser {
    id: number;
    codeUtilisateur: string;
    nomUtilisateur: string;
    sessionId: number;
    permissions: number[];
}

/**
 * Authentifier un utilisateur par son code
 * Les utilisateurs doivent déjà exister dans TUtilisateurs
 */
export async function signIn(codeUtilisateur: string): Promise<AuthUser> {
    // Trouver l'utilisateur dans la base
    const user = await prisma.tUtilisateurs.findFirst({
        where: { codeUtilisateur },
    });

    if (!user) {
        throw new Error('Code utilisateur invalide');
    }

    // Créer une nouvelle session SQL Server
    const sessionId = await createSession(user.id);

    // Obtenir les permissions de l'utilisateur
    const permissions = await getPermissionsUtilisateur(user.id);

    return {
        id: user.id,
        codeUtilisateur: user.codeUtilisateur,
        nomUtilisateur: user.nomUtilisateur,
        sessionId,
        permissions,
    };
}

/**
 * Déconnecter un utilisateur
 */
export async function signOut(sessionId: number): Promise<void> {
    await closeSession(sessionId);
}

/**
 * Obtenir un utilisateur par ID
 */
export async function getUserById(userId: number): Promise<AuthUser | null> {
    const user = await prisma.tUtilisateurs.findFirst({
        where: { id: userId },
    });

    if (!user) {
        return null;
    }

    // Obtenir la session active (où finSession == debutSession)
    const sessions = await prisma.tSessions.findMany({
        where: {
            utilisateur: userId,
        },
        orderBy: {
            debutSession: 'desc',
        },
    });

    // Trouver la première session active
    const session = sessions.find(s => 
        s.finSession.getTime() === s.debutSession.getTime()
    );

    if (!session) {
        return null;
    }

    // Obtenir les permissions
    const permissions = await getPermissionsUtilisateur(userId);

    return {
        id: user.id,
        codeUtilisateur: user.codeUtilisateur,
        nomUtilisateur: user.nomUtilisateur,
        sessionId: session.id,
        permissions,
    };
}

/**
 * Obtenir un utilisateur par code
 */
export async function getUserByCode(codeUtilisateur: string): Promise<AuthUser | null> {
    const user = await prisma.tUtilisateurs.findFirst({
        where: { codeUtilisateur },
    });

    if (!user) {
        return null;
    }

    return getUserById(user.id);
}

/**
 * Vérifier si un utilisateur existe
 */
export async function userExists(codeUtilisateur: string): Promise<boolean> {
    const user = await prisma.tUtilisateurs.findFirst({
        where: { codeUtilisateur },
    });

    return !!user;
}

export default {
    signIn,
    signOut,
    getUserById,
    getUserByCode,
    userExists,
};
