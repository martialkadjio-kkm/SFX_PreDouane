"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée un nouveau régime douanier
 */
export async function createRegimeDouanier(data: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    const regime = await prisma.tRegimesDouaniers.create({
      data: {
        codeRegimeDouanier: data.code || "RD",
        libelleRegimeDouanier: data.libelle,
        session: parseInt(session.user.id),
        dateCreation: new Date(),
      },
    });

    revalidatePath("/regime-douanier");
    return { success: true, data: regime };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Récupère un régime douanier par ID via VRegimesDouaniers
 */
export async function getRegimeDouanierById(id: string) {
  try {
    const regimes = await prisma.$queryRaw<any[]>`
      SELECT * FROM VRegimesDouaniers
      WHERE ID_Regime_Douanier = ${parseInt(id)}
    `;

    if (!regimes || regimes.length === 0) {
      return { success: false, error: 'Régime douanier non trouvé' };
    }

    return { success: true, data: regimes[0] };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Récupère tous les régimes douaniers via VRegimesDouaniers
 */
export async function getAllRegimesDouaniers(
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
      SELECT DISTINCT * FROM VRegimesDouaniers
      WHERE 1=1
    `;

    if (search) {
      query += ` AND Libelle_Regime_Douanier LIKE '%${search}%'`;
    }

    query += ` ORDER BY Libelle_Regime_Douanier ASC`;

    const regimes = await prisma.$queryRawUnsafe<any[]>(query);

    return { success: true, data: regimes, total: regimes.length };
  } catch (error) {
    console.error("getAllRegimesDouaniers error:", error);
    return { success: false, error };
  }
}

/**
 * Met à jour un régime douanier
 */
export async function updateRegimeDouanier(id: string, data: any) {
  try {
    const regime = await prisma.tRegimesDouaniers.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.code && { codeRegimeDouanier: data.code }),
        ...(data.libelle && { libelleRegimeDouanier: data.libelle }),
      },
    });

    revalidatePath(`/regime-douanier/${id}`);
    revalidatePath("/regime-douanier");
    return { success: true, data: regime };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Supprime un régime douanier
 */
export async function deleteRegimeDouanier(id: string) {
  try {
    const regime = await prisma.tRegimesDouaniers.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/regime-douanier");
    return { success: true, data: regime };
  } catch (error) {
    return { success: false, error };
  }
}
