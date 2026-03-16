"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

function ratioToTaux(ratio: number): number {
    if (ratio === -2) return -2;
    if (ratio === -1) return -1;
    if (ratio === 0) return 0;
    if (ratio === 1) return 1;
    return ratio;
}

function ratioToLibelle(ratio: number, code: string): string {
    if (ratio === -2) return 'TTC';
    if (ratio === -1) return '100% TR';
    if (ratio === 0) return 'EXO';
    if (ratio === 1) return '100% DC';
    const dcPercent = Math.round(ratio * 100 * 100) / 100;
    const trPercent = Math.round((100 - dcPercent) * 100) / 100;
    return `${trPercent.toFixed(2)}% TR et ${dcPercent.toFixed(2)}% DC`;
}

export async function associateRegimesToClient(
    regimes: Array<{ code: string; ratio: number }>,
    clientId: number
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const associated = [];
        const errors = [];

        for (const regime of regimes) {
            try {
                const tauxRegime = ratioToTaux(regime.ratio);
                const libelle = ratioToLibelle(regime.ratio, regime.code);

                const existingRegime = await prisma.tRegimesDeclarations.findFirst({
                    where: {
                        OR: [
                            { libelleRegimeDeclaration: libelle },
                            { tauxRegime: tauxRegime },
                            { libelleRegimeDeclaration: `${regime.code} ${libelle}` },
                        ]
                    }
                });

                if (!existingRegime) {
                    errors.push(`Régime "${libelle}" non trouvé`);
                    continue;
                }

                const existingAssoc = await prisma.tRegimesClients.findFirst({
                    where: { client: clientId, regimeDeclaration: existingRegime.id }
                });

                if (existingAssoc) {
                    associated.push({ libelle, ratio: regime.ratio, alreadyExists: true });
                    continue;
                }

                await prisma.tRegimesClients.create({
                    data: {
                        client: clientId,
                        regimeDeclaration: existingRegime.id,
                        session: parseInt(session.user.id),
                        dateCreation: new Date(),
                    },
                });

                associated.push({ libelle, ratio: regime.ratio, alreadyExists: false });
            } catch (error: any) {
                errors.push(`Erreur pour ${regime.code} ${regime.ratio}: ${error.message}`);
            }
        }

        const newAssociations = associated.filter(a => !a.alreadyExists).length;
        const existingAssociations = associated.filter(a => a.alreadyExists).length;

        return {
            success: true,
            data: {
                associated: newAssociations,
                alreadyAssociated: existingAssociations,
                total: associated.length,
                errors: errors.length > 0 ? errors : undefined
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur"
        };
    }
}

export async function getClientName(clientId: number) {
    try {
        const client = await prisma.tClients.findUnique({
            where: { id: clientId },
            select: { nomClient: true }
        });
        return { success: true, data: client?.nomClient || `Client ${clientId}` };
    } catch (error) {
        return { success: false, data: `Client ${clientId}` };
    }
}
