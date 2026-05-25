"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/server/actions";
import {GetSqlDateString} from "@/lib/sql-date-helper";

export async function getAllConversions() {
    try {
        const conversions = await prisma.$queryRaw<any[]>`
            SELECT * FROM VConvertions
            ORDER BY Date_Convertion DESC
        `;
        return { success: true, data: conversions };
    } catch (error) {
        console.error("Erreur lors de la récupération des conversions:", error);
        return { success: false, error: "Impossible de récupérer les conversions" };
    }
}

export async function getConversionById(id: string) {
    try {
        const conversionId = parseInt(id);
        if (isNaN(conversionId)) {
            return { success: false, error: "ID invalide" };
        }
        const conversions = await prisma.$queryRaw<any[]>`
            SELECT * FROM VConvertions
            WHERE ID_Convertion = ${conversionId}
        `;
        if (!conversions || conversions.length === 0) {
            return { success: false, error: "Conversion non trouvée" };
        }
        return { success: true, data: conversions[0] };
    } catch (error) {
        console.error("Erreur lors de la récupération de la conversion:", error);
        return { success: false, error: "Impossible de récupérer la conversion" };
    }
}

export async function createConversion(data: any) {
    try {
        const session = await getSession();
        if (!session.user) {
            return { success: false, error: "Non authentifié" };
        }

        const dateConvertion = new Date(data.dateConvertion);
        const dateStr = GetSqlDateString(dateConvertion);
        // const dateStr = dateConvertion.toLocaleString()
        console.log("cette date", dateStr);

        await prisma.$executeRawUnsafe(
            `EXEC [dbo].[pSP_AjouterConvertion] @DateConvertion = '${dateStr}', @ID_Session = ${session.user.id}, @ID_Entite = 0`
        );

        revalidatePath("/conversion");
        return { success: true };
    } catch (error) {
        console.error("Erreur création conversion:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création"
        };
    }
}

export async function deleteConversion(id: string) {
    try {
        const conversionId = parseInt(id);
        if (isNaN(conversionId)) {
            return { success: false, error: "ID invalide" };
        }
        await prisma.$executeRaw`
            DELETE FROM TConvertions
            WHERE [ID Convertion] = ${conversionId}
        `;
        revalidatePath("/conversion");
        return { success: true };
    } catch (error) {
        console.error("Erreur suppression conversion:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la suppression"
        };
    }
}
