"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function createMissingDevises(devises: string[]) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const created = [];
        const skipped = [];

        for (const devise of devises) {
            const existing = await prisma.tDevises.findFirst({
                where: { OR: [{ codeDevise: devise }, { libelleDevise: devise }] }
            });

            if (existing) {
                skipped.push({ requested: devise, existing: existing.codeDevise, reason: `Existe déjà avec le code "${existing.codeDevise}"` });
                continue;
            }

            const result = await prisma.tDevises.create({
                data: {
                    codeDevise: devise,
                    libelleDevise: devise,
                    decimales: 2,
                    deviseInactive: false,
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });
            created.push(result);
        }

        return { success: true, data: created, skipped: skipped.length > 0 ? skipped : undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

export async function createMissingPays(pays: string[]) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const created = [];
        const skipped = [];

        for (const p of pays) {
            const existing = await prisma.tPays.findFirst({ where: { codePays: p } });
            if (existing) { skipped.push(p); continue; }

            const result = await prisma.tPays.create({
                data: {
                    codePays: p,
                    libellePays: p,
                    deviseLocale: 0,
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });
            created.push(result);
        }

        return { success: true, data: created, skipped: skipped.length > 0 ? skipped : undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

export async function createMissingHSCodes(hscodes: string[], dossierId?: number) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        let targetEntiteId = 0;
        if (dossierId) {
            const dossier = await prisma.tDossiers.findUnique({
                where: { id: dossierId },
                include: { tBranches: { select: { entite: true } } }
            });
            if (dossier?.tBranches?.entite) targetEntiteId = dossier.tBranches.entite;
        }

        const created = [];
        const skipped = [];

        for (const hscode of hscodes) {
            const existing = await prisma.tHSCodes.findFirst({
                where: { hsCode: hscode, entite: targetEntiteId }
            });

            if (existing) {
                skipped.push({ hscode, entite: targetEntiteId, reason: `Existe déjà pour l'entité ${targetEntiteId}` });
                continue;
            }

            const existingInOtherEntities = await prisma.tHSCodes.findMany({
                where: { hsCode: hscode },
                select: { libelleHSCode: true }
            });

            const libelle = existingInOtherEntities[0]?.libelleHSCode || `HS Code ${hscode}`;

            const result = await prisma.tHSCodes.create({
                data: {
                    hsCode: hscode,
                    libelleHSCode: libelle,
                    entite: targetEntiteId,
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });
            created.push(result);
        }

        return { success: true, data: created, skipped: skipped.length > 0 ? skipped : undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

export async function createMissingRegimes(regimes: Array<{ code: string; ratio: number }>, clientId?: number) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) throw new Error("Missing User Session");

        const created = [];
        const skipped = [];

        for (const regime of regimes) {
            // ratio ici est déjà en décimal (0=EXO, 1=100%DC, 0.45=45%DC)
            const tauxRegime = regime.ratio;

            let libelle: string;
            if (regime.ratio === 0) libelle = 'EXO';
            else if (regime.ratio === 1) libelle = '100% DC';
            else if (regime.ratio === -1) libelle = '100% TR';
            else if (regime.ratio === -2) libelle = 'TTC';
            else {
                const dcPercent = Math.round(regime.ratio * 100 * 100) / 100;
                const trPercent = Math.round((100 - dcPercent) * 100) / 100;
                libelle = `${trPercent.toFixed(2)}% TR et ${dcPercent.toFixed(2)}% DC`;
            }

            const existingRegime = await prisma.tRegimesDeclarations.findFirst({
                where: {
                    OR: [
                        { libelleRegimeDeclaration: libelle },
                        { tauxRegime: tauxRegime },
                    ]
                }
            });

            const targetClientId = clientId || parseInt(session.user.id);

            if (existingRegime) {
                const existingAssoc = await prisma.tRegimesClients.findFirst({
                    where: { client: targetClientId, regimeDeclaration: existingRegime.id }
                });

                if (!existingAssoc) {
                    await prisma.tRegimesClients.create({
                        data: {
                            client: targetClientId,
                            regimeDeclaration: existingRegime.id,
                            session: parseInt(session.user.id),
                            dateCreation: new Date(),
                        },
                    });
                    created.push(existingRegime);
                } else {
                    skipped.push(libelle);
                }
                continue;
            }

            const regimeDouanier = await prisma.tRegimesDouaniers.findFirst({
                where: { codeRegimeDouanier: regime.code }
            });

            if (!regimeDouanier) throw new Error(`Régime douanier ${regime.code} non trouvé`);

            const result = await prisma.tRegimesDeclarations.create({
                data: {
                    libelleRegimeDeclaration: libelle,
                    tauxRegime: tauxRegime,
                    regimeDouanier: regimeDouanier.id,
                    entite: 1,
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });

            await prisma.tRegimesClients.create({
                data: {
                    client: targetClientId,
                    regimeDeclaration: result.id,
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });

            created.push(result);
        }

        return { success: true, data: created, skipped: skipped.length > 0 ? skipped : undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}
