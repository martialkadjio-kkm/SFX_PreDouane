"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TRegimeDeclarationCreateSchema, TRegimeDeclarationUpdateSchema } from "@/lib/validation";
import type { TRegimeDeclarationCreate, TRegimeDeclarationUpdate } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée un nouveau régime de déclaration
 */
export async function createRegimeDeclaration(data: TRegimeDeclarationCreate) {
    try {
        const validatedData = TRegimeDeclarationCreateSchema.parse(data);

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const regimeDeclaration = await prisma.tRegimesDeclarations.create({
            data: {
                libelleRegimeDeclaration: validatedData.libelle,
                tauxRegime: validatedData.tauxRegime,
                regimeDouanier: parseInt(validatedData.regimeDouanierId),
                entite: 1,
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
            include: {
                tRegimesDouaniers: true,
            }
        });

        // Sérialiser les données pour éviter les erreurs Decimal
        const serializedData = JSON.parse(JSON.stringify(regimeDeclaration));
        
        revalidatePath("/regime-declaration");
        return { 
            success: true, 
            data: {
                ...serializedData,
                tauxRegime: Number(regimeDeclaration.tauxRegime),
                dateCreation: regimeDeclaration.dateCreation?.toISOString() || null,
            }
        };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère un régime de déclaration par ID
 */
export async function getRegimeDeclarationById(id: string) {
    try {
        const parsedId = parseInt(id);
        
        // Exclure les IDs 0 et 1
        if (parsedId === 0 || parsedId === 1) {
            return { success: false, error: "Régime de déclaration système non accessible" };
        }

        const regimeDeclaration = await prisma.vRegimesDeclarations.findFirst({
            where: { idRegimeDeclaration: parsedId },
        });

        if (!regimeDeclaration) {
            return { success: false, error: "Régime de déclaration non trouvé" };
        }
        
        return {
            success: true,
            data: {
                id: regimeDeclaration.idRegimeDeclaration,
                libelleRegimeDeclaration: regimeDeclaration.libelleRegimeDeclaration,
                tauxRegime: Number(regimeDeclaration.ratioDC), // Convertir Decimal en number
                regimeDouanier: regimeDeclaration.idRegimeDouanier,
                dateCreation: regimeDeclaration.dateCreation.toISOString(),
                tRegimesDouaniers: {
                    id: regimeDeclaration.idRegimeDouanier,
                    libelleRegimeDouanier: regimeDeclaration.libelleRegimeDouanier,
                },
            },
        };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les régimes de déclaration avec filtres et pagination
 */
export async function getAllRegimeDeclarations(
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

        const where: any = {};

        if (search) {
            where.OR = [
                { libelleRegimeDeclaration: { contains: search } },
                { tRegimesDouaniers: { libelleRegimeDouanier: { contains: search } } },
            ];
        }

        const whereCondition = {
            idRegimeDeclaration: { notIn: [0, 1] }, // Exclure les IDs 0 et 1
            ...(search ? {
                OR: [
                    { libelleRegimeDeclaration: { contains: search } },
                    { libelleRegimeDouanier: { contains: search } },
                ]
            } : {})
        };

        const regimeDeclarations = await prisma.vRegimesDeclarations.findMany({
            where: whereCondition,
            skip,
            take,
            orderBy: { dateCreation: "desc" },
        });

        const total = await prisma.vRegimesDeclarations.count({ 
            where: whereCondition
        });

        return {
            success: true,
            data: regimeDeclarations.map((rd) => ({
                id: rd.idRegimeDeclaration,
                libelleRegimeDeclaration: rd.libelleRegimeDeclaration,
                tauxRegime: Number(rd.ratioDC), // Convertir Decimal en number et utiliser ratioDC de la vue
                regimeDouanier: rd.idRegimeDouanier,
                dateCreation: rd.dateCreation,
                tRegimesDouaniers: {
                    id: rd.idRegimeDouanier,
                    libelleRegimeDouanier: rd.libelleRegimeDouanier,
                },
            })),
            total,
        };
    } catch (error) {
        console.error("getAllRegimeDeclarations error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour un régime de déclaration
 */
export async function updateRegimeDeclaration(id: string, data: TRegimeDeclarationUpdate) {
    try {
        const validatedData = TRegimeDeclarationUpdateSchema.parse(data);

        const regimeDeclaration = await prisma.tRegimesDeclarations.update({
            where: { id: parseInt(id) },
            data: {
                ...(validatedData.libelle && { libelleRegimeDeclaration: validatedData.libelle }),
                ...(validatedData.tauxRegime !== undefined && { tauxRegime: validatedData.tauxRegime }),
                ...(validatedData.regimeDouanierId && { regimeDouanier: parseInt(validatedData.regimeDouanierId) }),
            },
            include: {
                tRegimesDouaniers: true,
            },
        });

        // Sérialiser les données pour éviter les erreurs Decimal
        const serializedData = JSON.parse(JSON.stringify(regimeDeclaration));

        revalidatePath(`/regime-declaration/${id}`);
        revalidatePath("/regime-declaration");
        return { 
            success: true, 
            data: {
                ...serializedData,
                tauxRegime: Number(regimeDeclaration.tauxRegime),
                dateCreation: regimeDeclaration.dateCreation?.toISOString() || null,
            }
        };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Supprime un régime de déclaration
 */
export async function deleteRegimeDeclaration(id: string) {
    try {
        const regimeDeclaration = await prisma.tRegimesDeclarations.delete({
            where: { id: parseInt(id) },
        });

        // Sérialiser les données pour éviter les erreurs Decimal
        const serializedData = JSON.parse(JSON.stringify(regimeDeclaration));

        revalidatePath("/regime-declaration");
        return { 
            success: true, 
            data: {
                ...serializedData,
                tauxRegime: Number(regimeDeclaration.tauxRegime),
                dateCreation: regimeDeclaration.dateCreation?.toISOString() || null,
            }
        };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les régimes de déclaration pour le sélecteur
 */
export async function getAllRegimeDeclarationsForSelect() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const regimeDeclarations = await prisma.vRegimesDeclarations.findMany({
            where: {
                idRegimeDeclaration: { notIn: [0, 1] } // Exclure les IDs 0 et 1
            },
            orderBy: { libelleRegimeDeclaration: "asc" },
        });

        return { 
            success: true, 
            data: regimeDeclarations.map(rd => ({
                id: rd.idRegimeDeclaration,
                libelleRegimeDeclaration: rd.libelleRegimeDeclaration,
                tauxRegime: Number(rd.ratioDC),
                tRegimesDouaniers: {
                    libelleRegimeDouanier: rd.libelleRegimeDouanier,
                },
            }))
        };
    } catch (error) {
        return { success: false, error };
    }
}
