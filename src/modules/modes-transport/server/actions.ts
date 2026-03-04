"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TModesTransportCreateSchema, TModesTransportUpdateSchema } from "@/lib/validation";
import type { TModesTransportCreate, TModesTransportUpdate } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée un nouveau mode de transport
 */
export async function createModeTransport(data: TModesTransportCreate) {
    try {
        const validatedData = TModesTransportCreateSchema.parse(data);

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const modeTransport = await prisma.tModesTransport.create({
            data: {
                libelle: validatedData.libelle,
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
        });

        revalidatePath("/modes-transport");
        return { success: true, data: modeTransport };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère un mode de transport par ID
 */
export async function getModeTransportById(id: string) {
    try {
        const modeTransport = await prisma.tModesTransport.findUnique({
            where: { id: parseInt(id) },
        });

        if (!modeTransport) {
            return { success: false, error: 'Mode de transport non trouvé' };
        }

        return { success: true, data: modeTransport };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les modes de transport avec filtres et pagination
 */
export async function getAllModesTransport(
    page = 1,
    take = 10,
    search = ""
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const skip = (page - 1) * take;

        const where: any = {
            
        };

        if (search) {
            where.libelle = { contains: search, mode: "insensitive" };
        }

        const modesTransport = await prisma.tModesTransport.findMany({
            where,
            skip,
            take,
            orderBy: { dateCreation: "desc" },
        });

        const total = await prisma.tModesTransport.count({ where });

        return { success: true, data: modesTransport, total };
    } catch (error) {
        console.error("getAllModesTransport error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour un mode de transport
 */
export async function updateModeTransport(id: string, data: TModesTransportUpdate) {
    try {
        const validatedData = TModesTransportUpdateSchema.parse(data);

        const modeTransport = await prisma.tModesTransport.update({
            where: { id: parseInt(id) },
            data: {
                ...(validatedData.libelle && { libelle: validatedData.libelle }),
            },
        });

        revalidatePath(`/modes-transport/${id}`);
        revalidatePath("/modes-transport");
        return { success: true, data: modeTransport };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Supprime un mode de transport
 */
export async function deleteModeTransport(id: string) {
    try {
        const modeTransport = await prisma.tModesTransport.delete({
            where: { id: parseInt(id) },
        });

        revalidatePath("/modes-transport");
        return { success: true, data: modeTransport };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les modes de transport pour le sélecteur
 */
export async function getAllModesTransportForSelect() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const modesTransport = await prisma.tModesTransport.findMany({
            select: {
                id: true,
                libelle: true,
            },
            orderBy: { libelle: "asc" },
        });

        return { success: true, data: modesTransport };
    } catch (error) {
        return { success: false, error };
    }
}
