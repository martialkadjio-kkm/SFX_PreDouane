"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Crée un nouveau HS Code
 */
export async function createHSCode(data: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    const hscode = await prisma.tHSCodes.create({
      data: {
        hsCode: data.code,
        libelleHSCode: data.libelle,
        entite: 0, // Entité par défaut
        session: parseInt(session.user.id),
        dateCreation: new Date(),
      },
    });

    revalidatePath("/hscode");
    return { success: true, data: hscode };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Récupère un HS Code par ID via VHSCodes
 */
export async function getHSCodeById(id: string) {
  try {
    const hscode = await prisma.vHSCodes.findFirst({
      where: { idHSCode: parseInt(id) }
    });

    if (!hscode) {
      return { success: false, error: 'HS Code non trouvé' };
    }

    // Mapper vers les anciens noms de colonnes pour la compatibilité frontend
    const mappedData = {
        ID_HS_Code: hscode.idHSCode,
        HS_Code: hscode.hsCode,
        Libelle_HS_Code: hscode.libelleHSCode,
        Date_Creation: hscode.dateCreation,
        Nom_Creation: hscode.nomCreation,
    };

    return { success: true, data: mappedData };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Récupère tous les HS Codes via VHSCodes
 */
export async function getAllHSCodes(
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

    const whereCondition: any = {
      idHSCode: { not: 0 }
    };

    if (search) {
      whereCondition.OR = [
        { hsCode: { contains: search } },
        { libelleHSCode: { contains: search } }
      ];
    }

    const hscodes = await prisma.vHSCodes.findMany({
      where: whereCondition,
      orderBy: { hsCode: 'asc' },
      distinct: ['idHSCode']
    });

    // Mapper vers les anciens noms de colonnes pour la compatibilité frontend
    const mappedData = hscodes.map(h => ({
        ID_HS_Code: h.idHSCode,
        HS_Code: h.hsCode,
        Libelle_HS_Code: h.libelleHSCode,
        Date_Creation: h.dateCreation,
        Nom_Creation: h.nomCreation,
    }));

    return { success: true, data: mappedData, total: mappedData.length };
  } catch (error) {
    console.error("getAllHSCodes error:", error);
    return { success: false, error };
  }
}

/**
 * Met à jour un HS Code
 */
export async function updateHSCode(id: string, data: any) {
  try {
    const hscode = await prisma.tHSCodes.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.code && { hsCode: data.code }),
        ...(data.libelle && { libelleHSCode: data.libelle }),
      },
    });

    revalidatePath(`/hscode/${id}`);
    revalidatePath("/hscode");
    return { success: true, data: hscode };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Supprime un HS Code
 */
export async function deleteHSCode(id: string) {
  try {
    const hscode = await prisma.tHSCodes.delete({
      where: { id: parseInt(id) },
    });

    revalidatePath("/hscode");
    return { success: true, data: hscode };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Type pour l'import Excel des HS Codes
 */
export interface ImportHSCodeRow {
  HS_Code: string;
  Description: string;
  rowIndex?: number; // Index de ligne pour identification
}

/**
 * Prévisualise l'import Excel des HS Codes
 */
export async function previewHSCodesImport(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Aucun fichier fourni" };
    }

    // Lire le fichier Excel
    const buffer = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      return { success: false, error: "Aucune feuille trouvée dans le fichier" };
    }

    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (rows.length === 0) {
      return { success: false, error: "Le fichier est vide" };
    }

    // Valider et préparer les données
    const previewData = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const rowData: ImportHSCodeRow = {
          HS_Code: String(row.HS_Code || row["HS Code"] || row.Code || "").trim(),
          Description: String(row.Description || row.Libelle || row.Label || "").trim(),
          rowIndex: i + 1, // Index pour identification
        };

        // Validation
        if (!rowData.HS_Code) {
          errors.push(`Ligne ${i + 2}: HS Code manquant`);
          continue;
        }

        if (!rowData.Description) {
          errors.push(`Ligne ${i + 2}: Description manquante`);
          continue;
        }

        // Valider le format du HS Code (doit être numérique et avoir une longueur appropriée)
        if (!/^\d+$/.test(rowData.HS_Code)) {
          errors.push(`Ligne ${i + 2}: HS Code doit contenir uniquement des chiffres`);
          continue;
        }

       

        // Vérifier si le HS Code existe déjà
        const existing = await prisma.tHSCodes.findFirst({
          where: { hsCode: rowData.HS_Code },
        });

        previewData.push({
          ...rowData,
          status: existing ? 'existing' : 'new',
          existingId: existing?.id,
          existingData: existing ? {
            hsCode: existing.hsCode,
            libelleHSCode: existing.libelleHSCode,
          } : null
        });

      } catch (error: any) {
        errors.push(`Ligne ${i + 2}: ${error.message}`);
      }
    }

    return {
      success: true,
      data: {
        preview: previewData,
        total: rows.length,
        valid: previewData.length,
        errors: errors.length > 0 ? errors : undefined,
        stats: {
          new: previewData.filter(p => p.status === 'new').length,
          existing: previewData.filter(p => p.status === 'existing').length,
        }
      },
    };
  } catch (error) {
    console.error("previewHSCodesImport error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la prévisualisation" };
  }
}

/**
 * Importe les HS Codes depuis Excel après validation
 */
export async function importHSCodesFromExcel(previewData: any[], mode: 'create' | 'update' | 'both') {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const item of previewData) {
      try {
        if (item.status === 'new' && (mode === 'create' || mode === 'both')) {
          // Créer nouveau HS Code
          await prisma.tHSCodes.create({
            data: {
              hsCode: item.HS_Code,
              libelleHSCode: item.Description,
              entite: 0, // Entité par défaut
              session: parseInt(session.user.id),
              dateCreation: new Date(),
            },
          });
          created++;
        } else if (item.status === 'existing' && (mode === 'update' || mode === 'both')) {
          // Mettre à jour HS Code existant
          await prisma.tHSCodes.update({
            where: { id: item.existingId },
            data: {
              hsCode: item.HS_Code,
              libelleHSCode: item.Description,
            },
          });
          updated++;
        }
      } catch (error: any) {
        errors.push(`Erreur ligne ${item.rowIndex}: ${error.message}`);
      }
    }

    revalidatePath("/hscode");

    return {
      success: true,
      data: {
        created,
        updated,
        total: previewData.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  } catch (error) {
    console.error("importHSCodesFromExcel error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur lors de l'import" };
  }
}
