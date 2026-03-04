/**
 * Helper pour obtenir la session utilisateur
 * Remplace auth.api.getSession de Better Auth par notre système personnalisé
 */

import { getSession as getCustomSession } from '@/modules/auth/server/actions';

export async function getSessionHelper() {
    const session = await getCustomSession();

    if (!session.user) {
        return null;
    }

    // Retourner un format compatible avec Better Auth
    return {
        user: {
            id: session.user.id.toString(),
            email: session.user.codeUtilisateur,
            name: session.user.nomUtilisateur,
        },
        session: {
            userId: session.user.id.toString(),
        },
    };
}

/**
 * Vérifier si l'utilisateur est authentifié
 * Lance une erreur si non authentifié
 */
export async function requireAuth() {
    const session = await getSessionHelper();

    if (!session) {
        throw new Error('Non authentifié');
    }

    return session;
}
