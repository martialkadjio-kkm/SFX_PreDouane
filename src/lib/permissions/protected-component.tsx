/**
 * Composants pour protéger par permission
 */

'use client';

import { useUser } from '../auth/hooks';
import { ReactNode } from 'react';

interface ProtectedProps {
    children: ReactNode;
    permissionId?: number;
    permissionIds?: number[];
    requireAll?: boolean;
    fallback?: ReactNode;
}

/**
 * Composant qui affiche son contenu seulement si l'utilisateur a la permission
 */
export function Protected({
    children,
    permissionId,
    permissionIds,
    requireAll = false,
    fallback = null,
}: ProtectedProps) {
    const { data: user } = useUser();

    if (!user) {
        return <>{fallback}</>;
    }

    // TODO: Récupérer les permissions de l'utilisateur depuis le contexte ou une query
    // Pour l'instant, on suppose que l'utilisateur a toutes les permissions
    const userPermissions: number[] = []; // À implémenter

    let hasPermission = false;

    if (permissionId !== undefined) {
        hasPermission = userPermissions.includes(permissionId);
    } else if (permissionIds && permissionIds.length > 0) {
        if (requireAll) {
            hasPermission = permissionIds.every((id) => userPermissions.includes(id));
        } else {
            hasPermission = permissionIds.some((id) => userPermissions.includes(id));
        }
    } else {
        hasPermission = true; // Pas de permission spécifiée
    }

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Composant bouton protégé par permission
 */
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    permissionId: number;
    children: ReactNode;
}

export function ProtectedButton({ permissionId, children, ...props }: ProtectedButtonProps) {
    return (
        <Protected permissionId={permissionId} fallback={null}>
            <button {...props}>{children}</button>
        </Protected>
    );
}

export default {
    Protected,
    ProtectedButton,
};
