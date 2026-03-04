/**
 * Permission Checker - Vérification des permissions utilisateur
 */

import {
    getPermissionsUtilisateur,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
} from '../database/functions';

/**
 * IDs des permissions (à compléter selon vos besoins)
 */
export const PERMISSIONS = {
    // Dossiers
    DOSSIER_VIEW: 1,
    DOSSIER_CREATE: 2,
    DOSSIER_EDIT: 3,
    DOSSIER_DELETE: 4,

    // Colisages
    COLISAGE_VIEW: 5,
    COLISAGE_CREATE: 6,
    COLISAGE_EDIT: 7,
    COLISAGE_DELETE: 8,
    COLISAGE_IMPORT: 9,

    // Notes de détail
    NOTE_VIEW: 10,
    NOTE_CREATE: 11,
    NOTE_DELETE: 12,

    // Clients
    CLIENT_VIEW: 13,
    CLIENT_CREATE: 14,
    CLIENT_EDIT: 15,
    CLIENT_DELETE: 16,

    // Administration
    USER_MANAGE: 50,
    ROLE_MANAGE: 51,
    PERMISSION_MANAGE: 52,

    // Système
    SYSTEM_ADMIN: 62,
} as const;

/**
 * Vérifier si un utilisateur peut effectuer une action
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param permissionId - ID de la permission requise
 * @throws Error si l'utilisateur n'a pas la permission
 */
export async function requirePermission(
    utilisateurId: number,
    permissionId: number
): Promise<void> {
    const has = await hasPermission(utilisateurId, permissionId);

    if (!has) {
        throw new Error(`Permission refusée. Permission requise: ${permissionId}`);
    }
}

/**
 * Vérifier si un utilisateur peut effectuer au moins une action
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param permissionIds - IDs des permissions (au moins une requise)
 * @throws Error si l'utilisateur n'a aucune des permissions
 */
export async function requireAnyPermission(
    utilisateurId: number,
    permissionIds: number[]
): Promise<void> {
    const has = await hasAnyPermission(utilisateurId, permissionIds);

    if (!has) {
        throw new Error(`Permission refusée. Au moins une permission requise parmi: ${permissionIds.join(', ')}`);
    }
}

/**
 * Vérifier si un utilisateur peut effectuer toutes les actions
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param permissionIds - IDs des permissions (toutes requises)
 * @throws Error si l'utilisateur n'a pas toutes les permissions
 */
export async function requireAllPermissions(
    utilisateurId: number,
    permissionIds: number[]
): Promise<void> {
    const has = await hasAllPermissions(utilisateurId, permissionIds);

    if (!has) {
        throw new Error(`Permission refusée. Toutes les permissions requises: ${permissionIds.join(', ')}`);
    }
}

export default {
    PERMISSIONS,
    getPermissionsUtilisateur,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
};
