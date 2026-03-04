"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: 'client' | 'dossier' | 'hscode';
    url: string;
}

/**
 * Recherche globale dans clients, dossiers et HS codes
 */
export async function globalSearch(query: string): Promise<{ success: boolean; data?: SearchResult[]; error?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        if (!query || query.trim().length < 2) {
            return { success: true, data: [] };
        }

        const searchTerm = query.trim().toLowerCase();
        const results: SearchResult[] = [];

        // Recherche dans les clients
        const clients = await prisma.vClients.findMany({
            where: {
                OR: [
                    { nomClient: { contains: searchTerm } },
                ],
            },
            take: 5,
            orderBy: { nomClient: 'asc' },
            select: {
                idClient: true,
                nomClient: true,
            },
        });

        clients.forEach(client => {
            results.push({
                id: `client-${client.idClient}`,
                title: client.nomClient,
                subtitle: "Client",
                type: 'client',
                url: `/client/${client.idClient}`,
            });
        });

        const dossiers = await prisma.vDossiers.findMany({
            where: {
                OR: [
                    { noDossier: { contains: searchTerm } },
                    { noOT: { contains: searchTerm } },
                    { nomClient: { contains: searchTerm } },
                ],
            },
            take: 5,
            orderBy: { dateCreation: 'desc' },
            select: {
                idDossier: true,
                noDossier: true,
                noOT: true,
                nomClient: true,
                libelleTypeDossier: true,
            },
        });


        dossiers.forEach(dossier => {
            results.push({
                id: `dossier-${dossier.idDossier}`,
                title: dossier.noDossier || `Dossier ${dossier.idDossier}`,
                subtitle: `${dossier.nomClient} • ${dossier.libelleTypeDossier}`,
                type: 'dossier',
                url: `/dossiers/${dossier.idDossier}`,
            });
        });

        // Recherche dans les HS codes
        console.log('📦 [globalSearch] Recherche HS codes...');
        const hscodes = await prisma.vHSCodes.findMany({
            where: {
                OR: [
                    { hsCode: { contains: searchTerm } },
                    { libelleHSCode: { contains: searchTerm } },
                ],
            },
            take: 5,
            orderBy: { hsCode: 'asc' },
            select: {
                idHSCode: true,
                hsCode: true,
                libelleHSCode: true,
            },
        });


        hscodes.forEach(hscode => {
            results.push({
                id: `hscode-${hscode.idHSCode}`,
                title: hscode.hsCode,
                subtitle: hscode.libelleHSCode,
                type: 'hscode',
                url: `/hscode/${hscode.idHSCode}`,
            });
        });

        // Limiter à 15 résultats maximum
        const limitedResults = results.slice(0, 15);

        return { success: true, data: limitedResults };
    } catch (error) {
        console.error("globalSearch error:", error);
        return { success: false, error: "Erreur lors de la recherche" };
    }
}