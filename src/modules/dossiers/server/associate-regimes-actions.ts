"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Associe des régimes existants à un client
 */
export async function associateRegimesToClient(
    regimes: Array<{ code: string; ratio: number }>,
    clientId: number
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const associated = [];
        const errors = [];

        for (const regime of regimes) {
            try {
                // Convertir le ratio en taux régime (décimal entre 0 et 1)
                // Gérer les cas spéciaux: -2 (TTC), -1 (100% TR), 0 (EXO), 1 (100% DC)
                let tauxRegime: number;
                if (regime.ratio === -2) {
                    tauxRegime = -2; // TTC
                } else if (regime.ratio === -1) {
                    tauxRegime = -1; // 100% TR
                } else if (regime.ratio === 0) {
                    tauxRegime = 0; // EXO
                } else if (regime.ratio === 100) {
                    tauxRegime = 1; // 100% DC
                } else {
                    tauxRegime = regime.ratio / 100; // DC RATIO (0-1)
                }

                // Générer le libellé du régime (sans préfixe pour correspondre à la BD)
                let libelle: string;
                if (regime.ratio === -2) {
                    libelle = 'TTC';
                } else if (regime.ratio === -1) {
                    libelle = '100% TR';
                } else if (regime.ratio === 0) {
                    libelle = 'EXO';
                } else if (regime.ratio === 100) {
                    libelle = '100% DC';
                } else {
                    const dcPercent = Math.round(regime.ratio * 100) / 100;
                    const trPercent = Math.round((100 - regime.ratio) * 100) / 100;
                    libelle = `${trPercent.toFixed(2)}% TR et ${dcPercent.toFixed(2)}% DC`;
                }

                // Trouver le régime existant (essayer plusieurs formats)
                const existingRegime = await prisma.tRegimesDeclarations.findFirst({
                    where: {
                        OR: [
                            { libelleRegimeDeclaration: libelle },
                            { tauxRegime: tauxRegime }, // Recherche directe par taux régime
                            // Essayer avec le préfixe au cas où
                            { libelleRegimeDeclaration: `${regime.code} ${libelle}` },
                        ]
                    }
                });

                if (!existingRegime) {
                    errors.push(`Régime "${libelle}" non trouvé`);
                    continue;
                }

                // Vérifier si l'association existe déjà
                const existingAssoc = await prisma.tRegimesClients.findFirst({
                    where: {
                        client: clientId,
                        regimeDeclaration: existingRegime.id
                    }
                });

                console.log(`[Association] Régime: ${libelle}, Client: ${clientId}, Régime ID: ${existingRegime.id}, Existe: ${!!existingAssoc}`);

                if (existingAssoc) {
                    // Déjà associé
                    console.log(`[Association] Déjà associé - ID: ${existingAssoc.id}`);
                    associated.push({
                        libelle,
                        ratio: regime.ratio,
                        alreadyExists: true
                    });
                    continue;
                }

                // Créer l'association
                console.log(`[Association] Création de l'association...`);
                const newAssoc = await prisma.tRegimesClients.create({
                    data: {
                        client: clientId,
                        regimeDeclaration: existingRegime.id,
                        session: parseInt(session.user.id),
                        dateCreation: new Date(),
                    },
                });
                console.log(`[Association] Créée avec succès - ID: ${newAssoc.id}`);

                associated.push({
                    libelle,
                    ratio: regime.ratio,
                    alreadyExists: false
                });
            } catch (error: any) {
                errors.push(`Erreur pour ${regime.code} ${regime.ratio}%: ${error.message}`);
            }
        }

        const newAssociations = associated.filter(a => !a.alreadyExists).length;
        const existingAssociations = associated.filter(a => a.alreadyExists).length;

        console.log(`[Association] Résumé: ${newAssociations} nouvelles, ${existingAssociations} existantes, ${errors.length} erreurs`);
        if (errors.length > 0) {
            console.log(`[Association] Erreurs:`, errors);
        }

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
        console.error("associateRegimesToClient error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur"
        };
    }
}

/**
 * Récupère le nom du client
 */
export async function getClientName(clientId: number) {
    try {
        const client = await prisma.tClients.findUnique({
            where: { id: clientId },
            select: { nomClient: true }
        });

        return {
            success: true,
            data: client?.nomClient || `Client ${clientId}`
        };
    } catch (error) {
        return {
            success: false,
            data: `Client ${clientId}`
        };
    }
}
