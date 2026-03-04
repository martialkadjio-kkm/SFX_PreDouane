"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée un nouveau sens de trafic
 */
export async function createSenseTrafic(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const sense = await prisma.tSensTrafic.create({
            data: {
                libelle: data.libelle,
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
        });

        revalidatePath("/sense-trafic");
        return { success: true, data: sense };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère un sens de trafic par ID via VSensTrafic
 */
export async function getSenseTraficById(id: string) {
    try {
        const senses = await prisma.$queryRaw<any[]>`
      SELECT * FROM VSensTrafic
      WHERE ID_Sens_Trafic = ${parseInt(id)}
    `;

        if (!senses || senses.length === 0) {
            return { success: false, error: 'Sens de trafic non trouvé' };
        }

        return { success: true, data: senses[0] };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les sens de trafic via VSensTrafic
 */
export async function getAllSenseTrafic(
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
      SELECT DISTINCT * FROM VSensTrafic
      WHERE 1=1
    `;

        if (search) {
            query += ` AND Libelle_Sens_Trafic LIKE '%${search}%'`;
        }

        query += ` ORDER BY Libelle_Sens_Trafic ASC`;

        const senses = await prisma.$queryRawUnsafe<any[]>(query);

        return { success: true, data: senses, total: senses.length };
    } catch (error) {
        console.error("getAllSenseTrafic error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour un sens de trafic
 */
export async function updateSenseTrafic(id: string, data: any) {
    try {
        const sense = await prisma.tSensTrafic.update({
            where: { id: parseInt(id) },
            data: {
                ...(data.libelle && { libelle: data.libelle }),
            },
        });

        revalidatePath(`/sense-trafic/${id}`);
        revalidatePath("/sense-trafic");
        return { success: true, data: sense };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Supprime un sens de trafic
 */
export async function deleteSenseTrafic(id: string) {
    try {
        const sense = await prisma.tSensTrafic.delete({
            where: { id: parseInt(id) },
        });

        revalidatePath("/sense-trafic");
        return { success: true, data: sense };
    } catch (error) {
        return { success: false, error };
    }
}

// Alias de compatibilite pour les imports existants dans l'application.
export const createSensTrafic = createSenseTrafic;
export const getSensTraficById = getSenseTraficById;
export const getAllSensTrafic = getAllSenseTrafic;
export const updateSensTrafic = updateSenseTrafic;
export const deleteSensTrafic = deleteSenseTrafic;
