"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OrderTransitCreate, OrderTransitCreateSchema, OrderTransitUpdateSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const db = prisma as any;

/**
 * CrÃ©e une nouvelle commande de transit
 */
export async function createOrderTransit(data: OrderTransitCreate) {
  try {
    const validatedData = OrderTransitCreateSchema.parse(data);

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    // âœ… VÃ©rifier si la rÃ©fÃ©rence existe dÃ©jÃ 
    const existingOrder = await db.orderTransit.findFirst({
      where: {
        orderReference: validatedData.orderReference,
      },
    });

    if (existingOrder) {
      return {
        success: false,
        error: "REFERENCE_EXISTS",
        message: "Un ordre de transit avec cette rÃ©fÃ©rence existe dÃ©jÃ ",
      };
    }

    const orderTransit = await db.orderTransit.create({
      data: {
        clientId: validatedData.clientId,
        typeDossierId: validatedData.typeDossierId,
        orderReference: validatedData.orderReference,
        description: validatedData.description,
        numeroOT: validatedData.numeroOT,
        nbrePaquetageOT: validatedData.nbrePaquetageOT,
        poidsBrutOT: validatedData.poidsBrutOT,
        poidsNetOT: validatedData.poidsNetOT,
        volumeOT: validatedData.volumeOT,
        observation: validatedData.observation,
        statut: validatedData.statut || "En attente",
        userId: session.user.id,
      },
      include: {
        client: true,
      },
    });

    // Convertir les Decimal en nombres pour le client
    const serializedData = {
      ...orderTransit,
      nbrePaquetageOT: Number(orderTransit.nbrePaquetageOT),
      poidsBrutOT: Number(orderTransit.poidsBrutOT),
      poidsNetOT: Number(orderTransit.poidsNetOT),
      volumeOT: Number(orderTransit.volumeOT),
      poidsBrutPesee: Number(orderTransit.poidsBrutPesee),
      poidsNetPesee: Number(orderTransit.poidsNetPesee),
      volumePesee: Number(orderTransit.volumePesee),
    };

    revalidatePath("/transit-orders");
    return { success: true, data: serializedData };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * RÃ©cupÃ¨re une commande par ID
 */
export async function getOrderTransitById(id: string) {
  try {
    const orderTransit = await db.orderTransit.findUnique({
      where: { id },
      include: {
        client: true,
        colisages: true,
        declarations: true,
        suiviEtapes: {
          include: {
            etape: true,
          },
        },
      },
    });

    if (!orderTransit) {
      return { success: false, error: "Commande non trouvÃ©e" };
    }

    // Convertir les Decimal en nombres pour le client
    const serializedData = {
      ...orderTransit,
      nbrePaquetageOT: Number(orderTransit.nbrePaquetageOT),
      poidsBrutOT: Number(orderTransit.poidsBrutOT),
      poidsNetOT: Number(orderTransit.poidsNetOT),
      volumeOT: Number(orderTransit.volumeOT),
      poidsBrutPesee: Number(orderTransit.poidsBrutPesee),
      poidsNetPesee: Number(orderTransit.poidsNetPesee),
      volumePesee: Number(orderTransit.volumePesee),
    };

    return { success: true, data: serializedData };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * RÃ©cupÃ¨re toutes les commandes avec filtres et pagination
 */
export async function getAllOrdersTransit(
  page = 1,
  take = 10,
  search = "",
  clientId = ""
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
      where.OR = [
        { orderReference: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { nom: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const orders = await db.orderTransit.findMany({
      where,
      skip,
      take,
      include: {
        client: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await db.orderTransit.count({ where });

    // Convertir les Decimal en nombres pour le client
    const serializedOrders = orders.map((order: any) => ({
      ...order,
      nbrePaquetageOT: Number(order.nbrePaquetageOT),
      poidsBrutOT: Number(order.poidsBrutOT),
      poidsNetOT: Number(order.poidsNetOT),
      volumeOT: Number(order.volumeOT),
      poidsBrutPesee: Number(order.poidsBrutPesee),
      poidsNetPesee: Number(order.poidsNetPesee),
      volumePesee: Number(order.volumePesee),
    }));

    return { success: true, data: serializedOrders, total };
  } catch (error) {
    console.error("getAllOrdersTransit error:", error);
    return { success: false, error };
  }
}

/**
 * Met Ã  jour une commande
 */
export async function updateOrderTransit(id: string, data: OrderTransitCreate) {
  try {
    const validatedData = OrderTransitUpdateSchema.parse(data);


    // âœ… VÃ©rifier si la rÃ©fÃ©rence existe dÃ©jÃ  (sauf pour l'ordre actuel)
    if (validatedData.orderReference) {
      const existingOrder = await db.orderTransit.findFirst({
        where: {
          orderReference: validatedData.orderReference,
          NOT: {
            id: id, // Exclure l'ordre actuel de la recherche
          },
        },
      });

      if (existingOrder) {
        return {
          success: false,
          error: "REFERENCE_EXISTS",
          message: "Cette rÃ©fÃ©rence existe dÃ©jÃ  pour un autre ordre de transit"
        };
      }
    }
    const orderTransit = await db.orderTransit.update({
      where: { id },
      data: {
        ...(validatedData.clientId && { clientId: validatedData.clientId }),
        ...(validatedData.typeDossierId && { typeDossierId: validatedData.typeDossierId }),
        ...(validatedData.orderReference && { orderReference: validatedData.orderReference }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.numeroOT && { numeroOT: validatedData.numeroOT }),
        ...(validatedData.nbrePaquetageOT !== undefined && { nbrePaquetageOT: validatedData.nbrePaquetageOT }),
        ...(validatedData.poidsBrutOT !== undefined && { poidsBrutOT: validatedData.poidsBrutOT }),
        ...(validatedData.poidsNetOT !== undefined && { poidsNetOT: validatedData.poidsNetOT }),
        ...(validatedData.volumeOT !== undefined && { volumeOT: validatedData.volumeOT }),
        ...(validatedData.observation && { observation: validatedData.observation }),
        ...(validatedData.statut && { statut: validatedData.statut }),
      },
      include: {
        client: true,
      },
    });

    // Convertir les Decimal en nombres pour le client
    const serializedData = {
      ...orderTransit,
      nbrePaquetageOT: Number(orderTransit.nbrePaquetageOT),
      poidsBrutOT: Number(orderTransit.poidsBrutOT),
      poidsNetOT: Number(orderTransit.poidsNetOT),
      volumeOT: Number(orderTransit.volumeOT),
      poidsBrutPesee: Number(orderTransit.poidsBrutPesee),
      poidsNetPesee: Number(orderTransit.poidsNetPesee),
      volumePesee: Number(orderTransit.volumePesee),
    };

    revalidatePath(`/transit-orders/${id}`);
    revalidatePath("/transit-orders");
    return { success: true, data: serializedData };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Supprime une commande
 */
export async function deleteOrderTransit(id: string) {
  try {
    const orderTransit = await db.orderTransit.delete({
      where: { id },
    });

    revalidatePath("/transit-orders");
    return { success: true, data: orderTransit };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * RÃ©cupÃ¨re tous les clients pour le sÃ©lecteur
 */
export async function getAllClientsForSelect() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    const clients = await db.client.findMany({
      select: {
        id: true,
        nom: true,
      },
      orderBy: { nom: "asc" },
    });

    return { success: true, data: clients };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * RÃ©cupÃ¨re tous les ordres de transit d'un client
 */
export async function getOrdersTransitByClientId(clientId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    // Utiliser VDossiers (vue) pour rÃ©cupÃ©rer les dossiers avec toutes les informations
    const dossiers = await prisma.vDossiers.findMany({
      where: { idClient: parseInt(clientId) },
      orderBy: { dateCreation: 'desc' }
    });

    return { success: true, data: dossiers };
  } catch (error) {
    console.error("getOrdersTransitByClientId error:", error);
    return { success: false, error };
  }
}


/**
 * RÃ©cupÃ¨re tous les ordres de transit pour le sÃ©lecteur (import colisage)
 */
export async function getAllOrderTransitsForSelect() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    const orders = await db.orderTransit.findMany({
      select: {
        id: true,
        orderReference: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: orders };
  } catch (error) {
    console.error("getAllOrderTransitsForSelect error:", error);
    return { success: false, error };
  }
}




