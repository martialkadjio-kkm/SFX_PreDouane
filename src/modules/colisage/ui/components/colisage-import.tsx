"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, Trash2 } from "lucide-react";
import { importColisagesFromExcel, deleteAllColisages } from "../../server/actions";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const ColisageImport = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const [RemoveAllConfirmation, confirmRemoveAll] = useConfirm(
        "Êtes-vous sûr?",
        "Voulez-vous vraiment supprimer TOUS les colisages ? Cette action est irréversible."
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vérifier que c'est un fichier Excel
        if (
            !file.name.endsWith(".xlsx") &&
            !file.name.endsWith(".xls") &&
            !file.type.includes("spreadsheet")
        ) {
            toast.error("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
            return;
        }

        setFileName(file.name);
        setShowModal(true);
        setIsLoading(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Simuler la progression jusqu'à 80% pendant le traitement
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 80) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.random() * 15;
                });
            }, 200);

            const result = await importColisagesFromExcel(formData);
            clearInterval(progressInterval);

            if (!result.success) {
                toast.error(result.error || "Erreur lors de l'import");
                setShowModal(false);
                return;
            }

            // Afficher le résumé
            if (result.data) {
                const { created, total } = result.data;

                // Progression finale basée sur le nombre importé
                const progressPercentage = Math.round((created / total) * 100);
                setProgress(Math.max(progressPercentage, 85));

                // Attendre un peu avant de fermer le modal
                setTimeout(() => {
                    setProgress(100);
                    setTimeout(() => {
                        setShowModal(false);
                        toast.success(`${created}/${total} colisages importés avec succès`);

                        if (result.data?.errors && result.data.errors.length > 0) {
                            toast.warning(`${result.data.errors.length} ligne(s) ont échoué`);
                        }

                        // Recharger la page
                        router.refresh();
                    }, 300);
                }, 500);
            }

            // Réinitialiser l'input
            e.target.value = "";
        } catch (err) {
            toast.error("Erreur lors du traitement du fichier");
            console.error(err);
            setShowModal(false);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = () => {
        const XLSX = require("xlsx");
        const templateData = [
            {
                "Référence Commande": "OT-2025-001",
                "Description": "Exemple de produit",
                "Fournisseur": "Nom du fournisseur",
                "Numéro Commande": "CMD-001",
                "Quantité": 100,
                "Prix Unitaire": 25.50,
                "Poids Brut": 150,
                "Poids Net": 140,
                "Volume": 2.5,
                "Code Devise": "XOF",
                "Code Pays": "CM",
                "Code HS": "123456",
                "Régime Déclaration": "IM4 99.99% TR et 0.01% DC"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Colisages");

        worksheet['!cols'] = [
            { wch: 20 },
            { wch: 30 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 30 }
        ];

        XLSX.writeFile(workbook, "template-colisages.xlsx");
    };

    const handleDeleteAll = async () => {
        const ok = await confirmRemoveAll();
        if (!ok) return;

        setIsDeleting(true);
        try {
            const res = await deleteAllColisages();

            if (res.success) {
                toast.success("Tous les colisages ont été supprimés");
            } else {
                toast.error("Erreur lors de la suppression");
            }

            router.refresh();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import en cours</DialogTitle>
                        <DialogDescription>
                            Traitement du fichier {fileName}
                        </DialogDescription>
                    </DialogHeader>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-sm font-medium">
                                    {progress < 100 ? "Importation en cours..." : "Finalisation..."}
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                                {Math.round(progress)}%
                            </p>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={downloadTemplate}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Template
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-primary">
                            <div className="space-y-2">
                                <p className="font-semibold">Important :</p>
                                <p>Les champs suivants doivent déjà exister dans votre base de données :</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li><strong>Référence Commande</strong> - Doit exister dans les ordres de transit</li>
                                    <li><strong>Code Devise</strong> - Doit exister dans les devises</li>
                                    <li><strong>Code Pays</strong> - Doit exister dans les pays</li>
                                    <li><strong>Code HS</strong> (optionnel) - Doit exister dans les codes HS</li>
                                    <li><strong>Régime Déclaration</strong> (optionnel) - Doit exister dans les régimes</li>
                                </ul>
                                <p className="text-xs italic">Sans ces données, l'import échouera.</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <label htmlFor="excel-import" className="cursor-pointer">
                    <Button
                        asChild
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                    >
                        <span className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            {isLoading ? "Import..." : "Importer"}
                        </span>
                    </Button>
                    <input
                        id="excel-import"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={isLoading}
                        className="hidden"
                    />
                </label>

                <Button
                    onClick={handleDeleteAll}
                    disabled={isDeleting || isLoading}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Supprimer tout
                </Button>
            </div>

            <RemoveAllConfirmation />
        </>
    );
};
