"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée un nouveau client
 * Seul le nom est requis, l'entité 0 (DEFAULT ENTITY) et la session courante sont utilisés
 */
export async function createClient(data: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    // Utiliser l'entité par défaut (ID 0 = DEFAULT ENTITY créée par sql.sql)
    const client = await prisma.tClients.create({
      data: {
        nomClient: data.nom,
        entite: 0, // Entité par défaut
        session: parseInt(session.user.id),
        dateCreation: new Date(),
      },
    });

    revalidatePath("/client");
    return { success: true, data: client };
  } catch (error) {
    console.error('Erreur création client:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

/**
 * Récupère un client par ID via VClients
 */
export async function getClientById(id: string) {
  try {
    const client = await prisma.vClients.findFirst({
      where: {
        idClient: parseInt(id)
      }
    });

    if (!client) {
      return { success: false, error: 'Client non trouvé' };
    }

    // Adapter les noms de colonnes pour correspondre à l'interface attendue par les composants
    const adaptedClient = {
      ID_Client: client.idClient,
      Nom_Client: client.nomClient,
      ID_Entite: client.idEntite,
      Date_Creation: client.dateCreation,
      Nom_Creation: client.nomCreation
    };

    return { success: true, data: adaptedClient };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Récupère tous les clients via VClients
 */
export async function getAllClients(
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

    const whereClause = search ? {
      nomClient: {
        contains: search
      }
    } : {};

    const clients = await prisma.vClients.findMany({
      where: whereClause,
      orderBy: {
        nomClient: 'asc'
      },
      take: take,
      skip: (page - 1) * take
    });

    // Adapter les noms de colonnes pour correspondre à l'interface attendue par les composants
    const adaptedClients = clients.map(client => ({
      ID_Client: client.idClient,
      Nom_Client: client.nomClient,
      ID_Entite: client.idEntite,
      Date_Creation: client.dateCreation,
      Nom_Creation: client.nomCreation
    }));

    return { success: true, data: adaptedClients, total: adaptedClients.length };
  } catch (error) {
    console.error("getAllClients error:", error);
    return { success: false, error };
  }
}

/**
 * Met à jour un client
 */
export async function updateClient(id: string, data: any) {
  try {
    const client = await prisma.tClients.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.nom && { nomClient: data.nom }),
        ...(data.entiteId && { entite: data.entiteId }),
      },
    });

    revalidatePath(`/client/${id}`);
    revalidatePath("/client");
    return { success: true, data: client };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Supprime un client
 */
export async function deleteClient(id: string) {
  try {
    const client = await prisma.tClients.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/client");
    return { success: true, data: client };
  } catch (error) {
    return { success: false, error };
  }
}
