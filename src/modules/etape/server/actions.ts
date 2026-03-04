"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée une nouvelle étape
 */
export async function createEtape(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const etape = await prisma.tCodesEtapes.create({
            data: {
                libelleEtape: data.libelle,
                indexEtape: data.index || 0,
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
        });

        revalidatePath("/etape");
        return { success: true, data: etape };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère une étape par ID via VCodesEtapes
 */
export async function getEtapeById(id: string) {
    try {
        const etapes = await prisma.$queryRaw<any[]>`
      SELECT * FROM VCodesEtapes
      WHERE ID_Code_Etape = ${parseInt(id)}
    `;

        if (!etapes || etapes.length === 0) {
            return { success: false, error: 'Étape non trouvée' };
        }

        return { success: true, data: etapes[0] };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les étapes via VCodesEtapes
 */
export async function getAllEtapes(
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

        let query = `
      SELECT DISTINCT * FROM VCodesEtapes
      WHERE 1=1
    `;

        if (search) {
            query += ` AND (
        Code_Etape LIKE '%${search}%' OR
        Libelle_Etape LIKE '%${search}%'
      )`;
        }

        query += ` ORDER BY Libelle_Etape ASC`;

        const etapes = await prisma.$queryRawUnsafe<any[]>(query);

        return { success: true, data: etapes, total: etapes.length };
    } catch (error) {
        console.error("getAllEtapes error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour une étape
 */
export async function updateEtape(id: string, data: any) {
    try {
        const etape = await prisma.tCodesEtapes.update({
            where: { id: parseInt(id) },
            data: {
                ...(data.libelle && { libelleEtape: data.libelle }),
                ...(data.index !== undefined && { indexEtape: data.index }),
            },
        });

        revalidatePath(`/etape/${id}`);
        revalidatePath("/etape");
        return { success: true, data: etape };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Supprime une étape
 */
export async function deleteEtape(id: string) {
    try {
        const etape = await prisma.tCodesEtapes.delete({
            where: { id: parseInt(id) },
        });

        revalidatePath("/etape");
        return { success: true, data: etape };
    } catch (error) {
        return { success: false, error };
    }
}
