"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

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
 * Récupère tous les dossiers avec leurs informations complètes via VDossiers
 */
export async function getAllDossiers(
    page = 1,
    take = 10000,
    search = "",
    statutId: number | null = null,
    etapeId: number | null = null
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        // Construire les conditions de filtre
        const where: any = {};

        if (search) {
            where.OR = [
                { noDossier: { contains: search } },
                { noOT: { contains: search } },
                { nomClient: { contains: search } },
                { libelleTypeDossier: { contains: search } },
            ];
        }

        if (statutId !== null) {
            where.idStatutDossier = statutId;
        }

        if (etapeId !== null) {
            where.idEtapeActuelle = etapeId;
        }

        const dossiers = await prisma.vDossiers.findMany({
            where,
            orderBy: { idDossier: "desc" },
            take,
            skip: (page - 1) * take,
        });

        // Dédupliquer par ID_Dossier (à cause de la jointure double dans la vue SQL)
        const uniqueDossiers = Array.from(
            new Map(dossiers.map(d => [d.idDossier, d])).values()
        );

        // Convertir les Decimal en nombres et gérer les valeurs nulles pour éviter NaN
        const serializedDossiers = uniqueDossiers.map(d => {
            const serialized = convertDecimalsToNumbers(d);
            return {
                ...serialized,
                nbrePaquetageOT: serialized.nbrePaquetageOT ?? 0,
                poidsBrutPesee: serialized.poidsBrutPesee ?? 0,
                poidsNetPesee: serialized.poidsNetPesee ?? 0,
                volumePesee: serialized.volumePesee ?? 0,
            };
        });

        return { success: true, data: serializedDossiers, total: serializedDossiers.length };
    } catch (error) {
        console.error("getAllDossiers error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère un dossier par ID via VDossiers
 */
export async function getDossierById(id: string) {
    try {
        const dossier = await prisma.vDossiers.findFirst({
            where: { idDossier: parseInt(id) },
        });

        if (!dossier) {
            return { success: false, error: "Dossier non trouvé" };
        }

        // Convertir tous les Decimal en nombres
        const serializedDossier = convertDecimalsToNumbers(dossier);
        
        // S'assurer que les valeurs numériques ne sont pas nulles
        serializedDossier.nbrePaquetage = serializedDossier.nbrePaquetage ?? 0;
        serializedDossier.poidsBrutPesee = serializedDossier.poidsBrutPesee ?? 0;
        serializedDossier.poidsNetPesee = serializedDossier.poidsNetPesee ?? 0;
        serializedDossier.volumePesee = serializedDossier.volumePesee ?? 0;

        return { success: true, data: serializedDossier };
    } catch (error) {
        console.error("getDossierById error:", error);
        return { success: false, error };
    }
}

/**
 * Crée un nouveau dossier
 * Utilise automatiquement la branche 0 (DEFAULT BRANCH) et la conversion 1
 */
export async function createDossier(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const dossier = await prisma.tDossiers.create({
            data: {
                branche: 0, // Branche par défaut (DEFAULT BRANCH)
                typeDossier: data.typeDossierId,
                client: data.clientId,
                descriptionDossier: data.description,
                noOT: data.noOT,
                noDossier: data.noDossier,
                nbrePaquetageOT: data.nbrePaquetageOT || 0,
                poidsBrutPesee: data.poidsBrutPesee || 0,
                poidsNetPesee: data.poidsNetPesee || 0,
                volumePesee: data.volumePesee || 0,
                responsableDossier: parseInt(session.user.id),
                statutDossier: data.statutDossierId || 0, // 0 = Operations in progress
                session: parseInt(session.user.id),
                dateCreation: new Date(),
            },
        });

        // Convertir les Decimal en nombres pour les composants client
        const serializedDossier = convertDecimalsToNumbers(dossier);

        revalidatePath("/dossiers");
        return { success: true, data: serializedDossier };
    } catch (error) {
        console.error("createDossier error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour un dossier
 */
export async function updateDossier(id: string, data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const dossier = await prisma.tDossiers.update({
            where: { id: parseInt(id) },
            data: {
                ...(data.brancheId && { branche: data.brancheId }),
                ...(data.typeDossierId && { typeDossier: data.typeDossierId }),
                ...(data.clientId && { client: data.clientId }),
                ...(data.description && { descriptionDossier: data.description }),
                ...(data.noOT && { noOT: data.noOT }),
                ...(data.noDossier && { noDossier: data.noDossier }),
                ...(data.statutDossierId && { statutDossier: data.statutDossierId }),
            },
        });

        // Convertir les Decimal en nombres pour les composants client
        const serializedDossier = convertDecimalsToNumbers(dossier);

        revalidatePath(`/dossiers/${id}`);
        revalidatePath("/dossiers");
        return { success: true, data: serializedDossier };
    } catch (error) {
        console.error("updateDossier error:", error);
        return { success: false, error };
    }
}

/**
 * Met à jour uniquement les champs de pesée d'un dossier
 */
export async function updateDossierPesee(id: string, data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const dossier = await prisma.tDossiers.update({
            where: { id: parseInt(id) },
            data: {
                nbrePaquetageOT: data.nbrePaquetagePesee || 0,
                poidsBrutPesee: data.poidsBrutPesee || 0,
                poidsNetPesee: data.poidsNetPesee || 0,
                volumePesee: data.volumePesee || 0,
            },
        });

        // Convertir les Decimal en nombres pour les composants client
        const serializedDossier = convertDecimalsToNumbers(dossier);

        revalidatePath(`/dossiers/${id}`);
        revalidatePath("/dossiers");
        return { success: true, data: serializedDossier };
    } catch (error) {
        console.error("updateDossierPesee error:", error);
        return { success: false, error };
    }
}

/**
 * Supprime un dossier
 */
export async function deleteDossier(id: string) {
    try {
        const dossier = await prisma.tDossiers.delete({
            where: { id: parseInt(id) },
        });

        revalidatePath("/dossiers");
        return { success: true, data: dossier };
    } catch (error) {
        console.error("deleteDossier error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère tous les clients pour le sélecteur
 */
export async function getAllClientsForSelect() {
    try {
        const clients = await prisma.tClients.findMany({
            where: {
                id: { gt: 0 } // Exclure les valeurs système (ID = 0)
            },
            select: {
                id: true,
                nomClient: true,
            },
            orderBy: { nomClient: "asc" },
        });

        return { success: true, data: clients };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les types de dossiers
 */
export async function getAllTypesDossiers() {
    try {
        const types = await prisma.tTypesDossiers.findMany({
            where: {
                id: { gt: 0 } // Exclure les valeurs système
            },
            select: {
                id: true,
                libelle: true,
            },
            orderBy: { libelle: "asc" },
        });

        return { success: true, data: types };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les sens de trafic
 */
export async function getAllSensTrafic() {
    try {
        const sens = await prisma.tSensTrafic.findMany({
            where: {
                id: { gt: 0 } // Exclure les valeurs système
            },
            select: {
                id: true,
                libelle: true,
            },
            orderBy: { libelle: "asc" },
        });

        return { success: true, data: sens };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les modes de transport
 */
export async function getAllModesTransport() {
    try {
        const modes = await prisma.tModesTransport.findMany({
            where: {
                id: { gt: 0 } // Exclure les valeurs système
            },
            select: {
                id: true,
                libelle: true,
            },
            orderBy: { libelle: "asc" },
        });

        return { success: true, data: modes };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les branches
 */
export async function getAllBranches() {
    try {
        const branches = await prisma.tBranches.findMany({
            select: {
                id: true,
                nomBranche: true,
            },
            orderBy: { nomBranche: "asc" },
        });

        return { success: true, data: branches };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les entités
 */
export async function getAllEntites() {
    try {
        const entites = await prisma.tEntites.findMany({
            select: {
                id: true,
                nomEntite: true,
            },
            orderBy: { nomEntite: "asc" },
        });

        return { success: true, data: entites };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les statuts de dossiers
 */
export async function getAllStatutsDossiers() {
    try {
        const statuts = await prisma.tStatutsDossier.findMany({
            select: {
                id: true,
                libelleStatutDossier: true,
            },
            orderBy: { libelleStatutDossier: "asc" },
        });

        // Mapper pour avoir un format cohérent
        const mappedStatuts = statuts.map(s => ({
            id: s.id,
            libelle: s.libelleStatutDossier,
        }));

        return { success: true, data: mappedStatuts };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les étapes disponibles
 */
export async function getAllEtapes() {
    try {
        // Utiliser les étapes actuelles des dossiers pour garantir la correspondance
        const etapes = await prisma.vDossiers.findMany({
            select: {
                idEtapeActuelle: true,
                libelleEtapeActuelle: true,
            },
            distinct: ['idEtapeActuelle'],
            orderBy: { libelleEtapeActuelle: "asc" },
        });

        // Mapper pour avoir le même format
        const mappedEtapes = etapes.map(e => ({
            idEtape: e.idEtapeActuelle,
            libelleEtape: e.libelleEtapeActuelle,
        }));

        return { success: true, data: mappedEtapes };
    } catch (error) {
        console.error("getAllEtapes error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère tous les dossiers d'un client spécifique
 */
export async function getDossiersByClientId(clientId: string) {
    try {
        console.log('🔍 [getDossiersByClientId] Recherche dossiers pour client ID:', clientId);
        
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const clientIdInt = parseInt(clientId);
        console.log('📝 [getDossiersByClientId] Client ID converti:', clientIdInt);

        const dossiers = await prisma.vDossiers.findMany({
            where: { idClient: clientIdInt },
            orderBy: { dateCreation: "desc" },
            select: {
                idDossier: true,
                noDossier: true,
                noOT: true,
                idClient: true,
                nomClient: true,
                libelleTypeDossier: true,
                libelleStatutDossier: true,
                idStatutDossier: true,
                libelleEtapeActuelle: true,
                dateCreation: true,
                dateOuvertureDossier: true,
            },
        });

        console.log('📊 [getDossiersByClientId] Dossiers trouvés:', dossiers.length);
        console.log('📋 [getDossiersByClientId] Premier dossier:', dossiers[0]);

        // Sérialiser les données pour éviter les erreurs Decimal et mapper les noms
        const serializedDossiers = dossiers.map(d => ({
            ID_Dossier: d.idDossier,
            No_Dossier: d.noDossier,
            No_OT: d.noOT,
            ID_Client: d.idClient,
            Nom_Client: d.nomClient,
            Libelle_Type_Dossier: d.libelleTypeDossier,
            Libelle_Statut_Dossier: d.libelleStatutDossier,
            "Statut Dossier": d.idStatutDossier, // Pour compatibilité avec ClientDossiers
            Libelle_Etape_Actuelle: d.libelleEtapeActuelle,
            Date_Creation: d.dateCreation,
            Date_Ouverture_Dossier: d.dateOuvertureDossier,
        }));

        return { success: true, data: serializedDossiers };
    } catch (error) {
        console.error("❌ [getDossiersByClientId] error:", error);
        return { success: false, error: "Erreur lors de la récupération des dossiers" };
    }
}

/**
 * Annule un dossier en cours
 * Appelle la procédure stockée pSP_AnnulerDossier
 * 
 * Cette procédure:
 * - Valide que le dossier est en cours (statut = 0)
 * - Met le statut du dossier à -2 (annulé)
 * 
 * @param dossierId - ID du dossier à annuler
 * @throws Error si le dossier n'est pas en cours ou erreur SQL
 */
export async function annulerDossier(dossierId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const id = parseInt(dossierId);
        await prisma.$executeRaw`EXEC pSP_AnnulerDossier @Id_Dossier = ${id}`;

        revalidatePath(`/dossiers/${dossierId}`);
        revalidatePath("/dossiers");
        return { success: true };
    } catch (error: any) {
        console.error("annulerDossier error:", error);
        const message = error.message || 'Erreur inconnue';

        if (message.includes('FILE IS NOT IN PROGRESS')) {
            return { 
                success: false, 
                error: 'Le dossier n\'est pas en cours. Seuls les dossiers en cours peuvent être annulés.' 
            };
        }

        return { 
            success: false, 
            error: `Erreur lors de l'annulation du dossier: ${message}` 
        };
    }
}