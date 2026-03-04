"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Convertit les Decimal de Prisma en nombres via JSON
 */
function convertDecimalsToNumbers(data: any): any {
    const jsonString = JSON.stringify(data, (_, value) => {
        if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
            return parseFloat(value.toString());
        }
        return value;
    });
    return JSON.parse(jsonString);
}

/**
 * Récupérer tous les régimes de déclaration pour les selects
 */
export async function getAllRegimesDeclarationsForSelect() {
    try {
        const regimes = await prisma.tRegimesDeclarations.findMany({
            select: {
                id: true,
                libelleRegimeDeclaration: true,
                tauxRegime: true,
            },
            orderBy: {
                libelleRegimeDeclaration: 'asc'
            }
        });

        const options = regimes.map(regime => ({
            value: regime.id.toString(),
            label: regime.libelleRegimeDeclaration,
            tauxRegime: convertDecimalsToNumbers(regime.tauxRegime)
        }));

        return { success: true, data: options };
    } catch (error) {
        console.error("getAllRegimesDeclarationsForSelect error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération"
        };
    }
}

/**
 * Récupérer toutes les associations régimes-clients
 */
export async function getRegimesClients() {
    try {
        const regimesClients = await prisma.vRegimesClients.findMany({
            orderBy: [
                { nomClient: 'asc' },
                { libelleRegimeDeclaration: 'asc' }
            ],
            distinct: "idRegimeDeclaration"
        });

        // Adapter les noms de colonnes pour correspondre à l'interface attendue
        const adaptedData = regimesClients.map(rc => ({
            id: rc.idRegimeClient,
            clientId: rc.idClient,
            clientNom: rc.nomClient,
            regimeId: rc.idRegimeDeclaration,
            regimeLibelle: rc.libelleRegimeDeclaration,
            tauxRegime: rc.ratioDC,
            dateCreation: rc.dateCreation,
            nomCreation: rc.nomCreation
        }));

        const serializedData = convertDecimalsToNumbers(adaptedData);

        return { success: true, data: serializedData };
    } catch (error) {
        console.error("getRegimesClients error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération"
        };
    }
}

/**
 * Associer un régime à un client
 */
export async function associateRegimeToClient(clientId: number, regimeId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Non authentifié" };
        }

        const sessionId = parseInt(session.user.id);

        // Vérifier si l'association existe déjà
        const existingAssociation = await prisma.tRegimesClients.findFirst({
            where: {
                client: clientId,
                regimeDeclaration: regimeId
            }
        });

        if (existingAssociation) {
            return { success: false, error: "Cette association existe déjà" };
        }

        // Créer l'association
        const regimeClient = await prisma.tRegimesClients.create({
            data: {
                client: clientId,
                regimeDeclaration: regimeId,
                session: sessionId,
                dateCreation: new Date()
            }
        });

        revalidatePath("/client");
        return { success: true, data: convertDecimalsToNumbers(regimeClient) };
    } catch (error) {
        console.error("associateRegimeToClient error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de l'association"
        };
    }
}

/**
 * Créer une nouvelle association régime-client
 */
export async function createRegimeClient(data: { clientId: number; regimeId: number }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Non authentifié" };
        }

        const sessionId = parseInt(session.user.id);

        // Vérifier si l'association existe déjà
        const existingAssociation = await prisma.tRegimesClients.findFirst({
            where: {
                client: data.clientId,
                regimeDeclaration: data.regimeId
            }
        });

        if (existingAssociation) {
            return { success: false, error: "Cette association existe déjà" };
        }

        // Créer l'association
        const regimeClient = await prisma.tRegimesClients.create({
            data: {
                client: data.clientId,
                regimeDeclaration: data.regimeId,
                session: sessionId,
                dateCreation: new Date()
            }
        });

        revalidatePath("/client");
        return { success: true, data: convertDecimalsToNumbers(regimeClient) };
    } catch (error) {
        console.error("createRegimeClient error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création"
        };
    }
}

/**
 * Supprimer une association régime-client
 */
export async function deleteRegimeClient(id: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Non authentifié" };
        }

        await prisma.tRegimesClients.delete({
            where: { id }
        });

        revalidatePath("/client");
        return { success: true };
    } catch (error) {
        console.error("deleteRegimeClient error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la suppression"
        };
    }
}

/**
 * Récupérer les régimes associés à un client spécifique
 */
export async function getRegimesByClient(clientId: number) {
    try {
        const regimes = await prisma.vRegimesClients.findMany({
            where: {
                idClient: clientId
            },
            orderBy: {
                libelleRegimeDeclaration: 'asc'
            }
        });

        // Adapter les noms de colonnes pour correspondre à l'interface attendue
        const adaptedData = regimes.map(regime => ({
            id: regime.idRegimeClient,
            regimeId: regime.idRegimeDeclaration,
            regimeLibelle: regime.libelleRegimeDeclaration,
            tauxRegime: regime.ratioDC
        }));

        const serializedData = convertDecimalsToNumbers(adaptedData);

        return { success: true, data: serializedData };
    } catch (error) {
        console.error("getRegimesByClient error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération"
        };
    }
}