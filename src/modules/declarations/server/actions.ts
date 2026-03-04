"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DeclarationCreateSchema, DeclarationUpdateSchema } from "@/lib/validation";
import type { DeclarationCreate, DeclarationUpdate } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const db = prisma as any;

/**
 * CrÃ©e une nouvelle dÃ©claration
 */
export async function createDeclaration(data: DeclarationCreate) {
    try {
        const validatedData = DeclarationCreateSchema.parse(data);

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const declaration = await db.declaration.create({
            data: {
                orderTransitId: validatedData.orderTransitId,
                numeroDeclaration: validatedData.numeroDeclaration,
                statut: validatedData.statut || "En attente",
                userId: session.user.id,
            },
            include: {
                orderTransit: true,
                user: true,
            },
        });

        revalidatePath("/declaration");
        return { success: true, data: declaration };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * RÃ©cupÃ¨re une dÃ©claration par ID
 */
export async function getDeclarationById(id: string) {
    try {
        const declaration = await db.declaration.findUnique({
            where: { id },
            include: {
                orderTransit: true,
                user: true,
            },
        });

        if (!declaration) {
            return { success: false, error: 'DÃ©claration non trouvÃ©e' };
        }

        return { success: true, data: declaration };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * RÃ©cupÃ¨re toutes les dÃ©clarations avec filtres et pagination
 */
export async function getAllDeclarations(
    page = 1,
    take = 10,
    search = "",
    orderTransitId = ""
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
            userId: session.user.id,
        };

        if (search) {
            where.OR = [
                { numeroDeclaration: { contains: search, mode: "insensitive" } },
                { statut: { contains: search, mode: "insensitive" } },
            ];
        }

        if (orderTransitId) {
            where.orderTransitId = orderTransitId;
        }

        const declarations = await db.declaration.findMany({
            where,
            skip,
            take,
            include: {
                orderTransit: true,
                user: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const total = await db.declaration.count({ where });

        return { success: true, data: declarations, total };
    } catch (error) {
        console.error("getAllDeclarations error:", error);
        return { success: false, error };
    }
}

/**
 * Met Ã  jour une dÃ©claration
 */
export async function updateDeclaration(id: string, data: DeclarationUpdate) {
    try {
        const validatedData = DeclarationUpdateSchema.parse(data);

        const declaration = await db.declaration.update({
            where: { id },
            data: {
                ...(validatedData.orderTransitId && { orderTransitId: validatedData.orderTransitId }),
                ...(validatedData.numeroDeclaration && { numeroDeclaration: validatedData.numeroDeclaration }),
                ...(validatedData.statut && { statut: validatedData.statut }),
            },
            include: {
                orderTransit: true,
                user: true,
            },
        });

        revalidatePath(`/declaration/${id}`);
        revalidatePath("/declaration");
        return { success: true, data: declaration };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Supprime une dÃ©claration
 */
export async function deleteDeclaration(id: string) {
    try {
        const declaration = await db.declaration.delete({
            where: { id },
        });

        revalidatePath("/declaration");
        return { success: true, data: declaration };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * RÃ©cupÃ¨re tous les ordres de transit pour le sÃ©lecteur
 */
export async function getAllOrdersTransitForSelect() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    const orders = await db.orderTransit.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        orderReference: true,
      },
      orderBy: { orderReference: "asc" },
    });

    return { success: true, data: orders };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * RÃ©cupÃ¨re toutes les dÃ©clarations d'un ordre de transit
 */
export async function getDeclarationsByOrderTransitId(orderTransitId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const declarations = await db.declaration.findMany({
            where: {
                orderTransitId,
                userId: session.user.id,
            },
            include: {
                user: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return { success: true, data: declarations };
    } catch (error) {
        console.error("getDeclarationsByOrderTransitId error:", error);
        return { success: false, error };
    }
}

