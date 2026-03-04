"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée une nouvelle devise
 */
export async function createDevise(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const devise = await prisma.tDevises.create({
            data: {
                codeDevise: data.code,
                libelleDevise: data.libelle,
                decimales: data.decimal || 2,
                deviseInactive: false,
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
        });

        revalidatePath("/devises");
        return { success: true, data: devise };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère une devise par ID via VDevises
 */
export async function getDeviseById(id: string) {
    try {
        const devises = await prisma.$queryRaw<any[]>`
            SELECT * FROM VDevises
            WHERE ID_Devise = ${parseInt(id)}
        `;

        if (!devises || devises.length === 0) {
            return { success: false, error: 'Devise non trouvée' };
        }

        return { success: true, data: devises[0] };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les devises via VDevises
 */
export async function getAllDevises(
    page = 1,
    take = 10000,
    search = ""
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const whereCondition: any = {};

        if (search) {
            whereCondition.OR = [
                { codeDevise: { contains: search } },
                { libelleDevise: { contains: search } }
            ];
        }

        const devises = await prisma.vDevises.findMany({
            where: whereCondition,
            orderBy: { libelleDevise: 'asc' },
            distinct: ['idDevise']
        });

        return { success: true, data: devises, total: devises.length };
    } catch (error) {
        console.error("getAllDevises error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour une devise
 */
export async function updateDevise(id: string, data: any) {
    try {
        const devise = await prisma.tDevises.update({
            where: { id: parseInt(id) },
            data: {
                ...(data.code && { codeDevise: data.code }),
                ...(data.libelle && { libelleDevise: data.libelle }),
                ...(data.decimal !== undefined && { decimales: data.decimal }),
            },
        });

        revalidatePath(`/devises/${id}`);
        revalidatePath("/devises");
        return { success: true, data: devise };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Supprime une devise
 */
export async function deleteDevise(id: string) {
    try {
        const devise = await prisma.tDevises.delete({
            where: { id: parseInt(id) },
        });

        revalidatePath("/devises");
        return { success: true, data: devise };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les devises pour le sélecteur
 */
export async function getAllDevisesForSelect() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const devises = await prisma.$queryRaw<any[]>`
            SELECT ID_Devise as id, Code_Devise as code, Libelle_Devise as libelle
            FROM VDevises
            ORDER BY Libelle_Devise ASC
        `;

        return { success: true, data: devises };
    } catch (error) {
        return { success: false, error };
    }
}
