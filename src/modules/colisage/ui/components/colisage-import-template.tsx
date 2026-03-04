"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const ColisageImportTemplate = () => {
    const downloadTemplate = () => {
        // Créer les données du template
        const templateData = [
            {
                "Numéro Commande": "CMD-001",
                "Description": "Produit exemple",
                "Fournisseur": "Fournisseur A",
                "Quantité": 100,
                "Prix Unitaire": 10.5,
                "Poids Brut": 50,
                "Poids Net": 45,
                "Volume": 0.5,
                "Commande ID": "[UUID de la commande]",
                "HS Code ID": "[UUID du code HS]",
                "Devise ID": "[UUID de la devise]",
                "Pays Origine ID": "[UUID du pays]",
                "Régime Déclaration ID": "[UUID du régime]",
            },
        ];

        // Utiliser xlsx pour créer le fichier
        const XLSX = require("xlsx");
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Colisages");

        // Télécharger le fichier
        XLSX.writeFile(workbook, "template-colisages.xlsx");
    };

    return (
        <Button
            onClick={downloadTemplate}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
        >
            <Download className="w-4 h-4" />
            Télécharger le template
        </Button>
    );
};
