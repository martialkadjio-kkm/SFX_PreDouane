"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Crée les devises manquantes
 */
export async function createMissingDevises(devises: string[]) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const created = [];
        const skipped = [];
        
        for (const devise of devises) {
            // Vérifier si la devise existe déjà par code OU par libellé
            const existing = await prisma.tDevises.findFirst({
                where: { 
                    OR: [
                        { codeDevise: devise },
                        { libelleDevise: devise }
                    ]
                }
            });

            if (existing) {
                console.log(`ℹ️  Devise "${devise}" existe déjà (Code: ${existing.codeDevise}, Libellé: ${existing.libelleDevise})`);
                skipped.push({ 
                    requested: devise, 
                    existing: existing.codeDevise,
                    reason: `Existe déjà avec le code "${existing.codeDevise}"`
                });
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

        return { 
            success: true, 
            data: created,
            skipped: skipped.length > 0 ? skipped : undefined
        };
    } catch (error) {
        console.error("createMissingDevises error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

/**
 * Crée les pays manquants
 */
export async function createMissingPays(pays: string[]) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const created = [];
        const skipped = [];
        
        for (const p of pays) {
            // Vérifier si le pays existe déjà
            const existing = await prisma.tPays.findFirst({
                where: { codePays: p }
            });

            if (existing) {
                skipped.push(p);
                continue;
            }

            const result = await prisma.tPays.create({
                data: {
                    codePays: p,
                    libellePays: p,
                    deviseLocale: 0, // Devise par défaut 
                    session: parseInt(session.user.id),
                    dateCreation: new Date(),
                },
            });
            created.push(result);
        }

        return { 
            success: true, 
            data: created,
            skipped: skipped.length > 0 ? skipped : undefined
        };
    } catch (error) {
        console.error("createMissingPays error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

/**
 * Crée les HS Codes manquants pour l'entité du dossier
 */
export async function createMissingHSCodes(hscodes: string[], dossierId?: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        // Récupérer l'entité du dossier si dossierId est fourni
        let targetEntiteId = 0; // Par défaut entité 0
        
        if (dossierId) {
            const dossier = await prisma.tDossiers.findUnique({
                where: { id: dossierId },
                include: {
                    tBranches: {
                        select: { entite: true }
                    }
                }
            });
            
            if (dossier?.tBranches?.entite) {
                targetEntiteId = dossier.tBranches.entite;
                console.log(`🎯 [createMissingHSCodes] Utilisation entité du dossier: ${targetEntiteId}`);
            } else {
                console.log(`⚠️  [createMissingHSCodes] Dossier ${dossierId} non trouvé ou sans entité, utilisation entité 0`);
            }
        }

        const created = [];
        const skipped = [];
        
        for (const hscode of hscodes) {
            // Vérifier si le HS Code existe déjà pour l'entité 0
            const existing = await prisma.tHSCodes.findFirst({
                where: { 
                    hsCode: hscode,
                    entite: targetEntiteId
                }
            });

            if (existing) {
                console.log(`ℹ️  HS Code "${hscode}" existe déjà pour l'entité ${targetEntiteId}`);
                skipped.push({ 
                    hscode, 
                    entite: targetEntiteId,
                    reason: `Existe déjà pour l'entité ${targetEntiteId}`
                });
                continue;
            }

            // Vérifier si le HS Code existe pour d'autres entités
            const existingInOtherEntities = await prisma.tHSCodes.findMany({
                where: { hsCode: hscode },
                select: { id: true, hsCode: true, entite: true, libelleHSCode: true }
            });

            let libelle = `HS Code ${hscode}`;
            if (existingInOtherEntities.length > 0) {
                // Utiliser le libellé d'un HS Code existant
                libelle = existingInOtherEntities[0].libelleHSCode || libelle;
                console.log(`📋 HS Code "${hscode}" existe dans d'autres entités, création pour entité ${targetEntiteId}`);
            }

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
            console.log(`✅ HS Code "${hscode}" créé pour l'entité ${targetEntiteId}`);
        }

        return { 
            success: true, 
            data: created,
            skipped: skipped.length > 0 ? skipped : undefined
        };
    } catch (error) {
        console.error("createMissingHSCodes error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}

/**
 * Crée les régimes déclarations manquants et les associe au client
 */
export async function createMissingRegimes(regimes: Array<{ code: string; ratio: number }>, clientId?: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const created = [];
        const skipped = [];
        
        for (const regime of regimes) {
            const tauxRegime = regime.ratio / 100; // Convertir en décimal

            let libelle: string;
            if (regime.ratio === 0) {
                libelle = 'EXO';
            } else if (regime.ratio === 100) {
                libelle = '100% DC';
            } else {
                const dcPercent = Math.round(regime.ratio * 100) / 100;
                const trPercent = Math.round((100 - regime.ratio) * 100) / 100;
                libelle = `${regime.code} ${trPercent}% TR et ${dcPercent}% DC`;
            }

            // Vérifier si le régime existe déjà
            const existingRegime = await prisma.tRegimesDeclarations.findFirst({
                where: { libelleRegimeDeclaration: libelle }
            });

            const targetClientId = clientId || parseInt(session.user.id);

            if (existingRegime) {
                // Le régime existe, vérifier s'il est associé au client
                const existingAssoc = await prisma.tRegimesClients.findFirst({
                    where: {
                        client: targetClientId,
                        regimeDeclaration: existingRegime.id
                    }
                });

                if (!existingAssoc) {
                    // Créer l'association client-régime
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

            // Trouver le régime douanier par défaut
            const regimeDouanier = await prisma.tRegimesDouaniers.findFirst({
                where: { codeRegimeDouanier: regime.code }
            });

            if (!regimeDouanier) {
                throw new Error(`Régime douanier ${regime.code} non trouvé`);
            }

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
            
            // Créer l'association client-régime
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

        return { 
            success: true, 
            data: created,
            skipped: skipped.length > 0 ? skipped : undefined
        };
    } catch (error) {
        console.error("createMissingRegimes error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur" };
    }
}
