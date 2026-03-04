/**
 * Wrapper pour l'authentification
 * Utilise notre système personnalisé au lieu de Better Auth
 */

import { getSession } from '@/modules/auth/server/actions';

export const auth = {
    api: {
        async getSession(_options?: any) {
            const session = await getSession();

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
        },
    },
};