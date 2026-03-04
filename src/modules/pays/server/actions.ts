"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Récupère tous les pays depuis l'API REST Countries
 */
export async function getAllCountriesFromAPI() {
    try {
        const response = await fetch(
            "https://restcountries.com/v3.1/all?fields=cca2,name,flags",
            {
                next: { revalidate: 86400 },
            }
        );

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const countries = await response.json();

        const formattedCountries = countries
            .map((country: any) => ({
                id: country.cca2,
                code: country.cca2,
                flag: country.flags?.png || country.flags?.svg || "🌍",
                libelle: country.name?.common || country.name?.official || country.cca2,
            }))
            .filter((c: any) => c.libelle && c.code)
            .sort((a: any, b: any) => a.libelle.localeCompare(b.libelle));

        return { success: true, data: formattedCountries };
    } catch (error) {
        console.error("getAllCountriesFromAPI error:", error);
        return { success: false, error: "Impossible de récupérer la liste des pays" };
    }
}

/**
 * Crée un nouveau pays
 */
export async function createPays(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const pays = await prisma.tPays.create({
            data: {
                codePays: data.code,
                libellePays: data.libelle,
                deviseLocale: data.deviseId || 1,
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
        });

        revalidatePath("/pays");
        return { success: true, data: pays };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère un pays par ID via VPays
 */
export async function getPaysById(id: string) {
    try {
        const pays = await prisma.vPays.findFirst({
            where: { idPays: parseInt(id) }
        });

        if (!pays) {
            return { success: false, error: 'Pays non trouvé' };
        }

        return { success: true, data: pays };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les pays via VPays
 */
export async function getAllPays(
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
                { codePays: { contains: search } },
                { libellePays: { contains: search } }
            ];
        }

        const pays = await prisma.vPays.findMany({
            where: whereCondition,
            orderBy: { libellePays: 'asc' },
            distinct: ['idPays']
        });

        return { success: true, data: pays, total: pays.length };
    } catch (error) {
        console.error("getAllPays error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour un pays
 */
export async function updatePays(id: string, data: any) {
    try {
        const pays = await prisma.tPays.update({
            where: { id: parseInt(id) },
            data: {
                ...(data.code && { codePays: data.code }),
                ...(data.libelle && { libellePays: data.libelle }),
                ...(data.deviseId && { deviseLocale: data.deviseId }),
            },
        });

        revalidatePath(`/pays/${id}`);
        revalidatePath("/pays");
        return { success: true, data: pays };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Supprime un pays
 */
export async function deletePays(id: string) {
    try {
        const pays = await prisma.tPays.delete({
            where: { id: parseInt(id) },
        });

        revalidatePath("/pays");
        return { success: true, data: pays };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les pays pour le sélecteur
 */
export async function getAllPaysForSelect() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const pays = await prisma.vPays.findMany({
            select: {
                idPays: true,
                codePays: true,
                libellePays: true
            },
            orderBy: { libellePays: 'asc' }
        });

        // Mapper vers le format attendu
        const mappedData = pays.map(p => ({
            id: p.idPays,
            code: p.codePays,
            libelle: p.libellePays
        }));

        return { success: true, data: mappedData };
    } catch (error) {
        return { success: false, error };
    }
}
