/**
 * Middleware pour injecter automatiquement le sessionId dans les opérations
 */

import { getSessionId } from './session-manager';

/**
 * Type pour les données avec sessionId
 */
export interface WithSession {
    session: number;
    dateCreation: Date;
}

/**
 * Ajouter les champs session et dateCreation aux données
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param data - Données à enrichir
 * @returns Données avec session et dateCreation
 */
export async function withSessionData<T extends object>(
    utilisateurId: number,
    data: T
): Promise<T & WithSession> {
    const sessionId = await getSessionId(utilisateurId);

    return {
        ...data,
        session: sessionId,
        dateCreation: new Date(),
    };
}

/**
 * Wrapper pour les opérations de création
 * Ajoute automatiquement session et dateCreation
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param createFn - Fonction de création Prisma
 * @param data - Données à créer
 * @returns Résultat de la création
 */
export async function createWithSession<T, D extends object>(
    utilisateurId: number,
    createFn: (data: D & WithSession) => Promise<T>,
    data: D
): Promise<T> {
    const dataWithSession = await withSessionData(utilisateurId, data);
    return createFn(dataWithSession);
}

export default {
    withSessionData,
    createWithSession,
};
