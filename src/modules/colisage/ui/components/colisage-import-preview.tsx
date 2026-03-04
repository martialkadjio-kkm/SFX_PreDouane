"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
    parseColisageExcelFile,
    checkExistingRowKeys,
    importSelectedColisages,
} from "../../server/import-actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import type { ColisageImportRow } from "@/lib/validation";

interface ColisageImportPreviewProps {
    orderTransitId: string;
    onClose?: () => void;
}

export const ColisageImportPreview = ({ orderTransitId, onClose }: ColisageImportPreviewProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showConflict, setShowConflict] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState("");
    const [parsedRows, setParsedRows] = useState<any[]>([]);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [existingRowKeys, setExistingRowKeys] = useState<any[]>([]);
    const [updateExisting, setUpdateExisting] = useState(false);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (
            !file.name.endsWith(".xlsx") &&
            !file.name.endsWith(".xls") &&
            !file.type.includes("spreadsheet")
        ) {
            toast.error("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
            return;
        }

        setFileName(file.name);
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await parseColisageExcelFile(formData);

            if (!result.success || !result.data) {
                toast.error(result.error || "Erreur lors du parsing");
                return;
            }

            setParsedRows(result.data.rows);
            setSelectedRows(new Set(result.data.rows.map((_: any, i: number) => i)));

            const rowKeys = result.data.rows
                .map((r: any) => r.rowKey)
                .filter(Boolean);

            if (rowKeys.length > 0) {
                const checkResult = await checkExistingRowKeys(orderTransitId, rowKeys);
                if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
                    setExistingRowKeys(checkResult.data);
                    setShowConflict(true);
                } else {
                    setShowPreview(true);
                }
            } else {
                setShowPreview(true);
            }

            e.target.value = "";
        } catch (err) {
            toast.error("Erreur lors du traitement du fichier");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConflictDecision = (update: boolean) => {
        setUpdateExisting(update);
        setShowConflict(false);
        setShowPreview(true);
    };

    const toggleRow = (index: number) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedRows(newSelected);
    };

    const toggleAll = () => {
        if (selectedRows.size === parsedRows.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(parsedRows.map((_, i) => i)));
        }
    };

    const handleImport = async () => {
        if (selectedRows.size === 0) {
            toast.error("Veuillez sélectionner au moins une ligne");
            return;
        }

        setShowPreview(false);
        setShowProgress(true);
        setProgress(10);

        try {
            const selectedData = Array.from(selectedRows)
                .map((i) => parsedRows[i])
                .map(({ _rowIndex, ...row }) => row);

            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 80) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.random() * 15;
                });
            }, 200);

            const result = await importSelectedColisages(
                orderTransitId,
                selectedData,
                updateExisting
            );

            clearInterval(progressInterval);

            if (!result.success) {
                toast.error(result.error || "Erreur lors de l'import");
                setShowProgress(false);
                return;
            }

            if (result.data) {
                const { created, updated, total, errors } = result.data;
                const progressPercentage = Math.round(((created + updated) / total) * 100);
                setProgress(Math.max(progressPercentage, 85));

                setTimeout(() => {
                    setProgress(100);
                    setTimeout(() => {
                        setShowProgress(false);
                        
                        if (created > 0 && updated > 0) {
                            toast.success(`${created} créés, ${updated} mis à jour sur ${total}`);
                        } else if (created > 0) {
                            toast.success(`${created}/${total} colisages importés avec succès`);
                        } else if (updated > 0) {
                            toast.success(`${updated}/${total} colisages mis à jour avec succès`);
                        }

                        if (errors && errors.length > 0) {
                            toast.error(`${errors.length} ligne(s) ont échoué`);
                        }

                        router.refresh();
                    }, 300);
                }, 500);
            }
        } catch (err) {
            toast.error("Erreur lors de l'importation");
            console.error(err);
            setShowProgress(false);
        }
    };

    const downloadTemplate = () => {
        const XLSX = require("xlsx");
        const templateData = [
            {
                "Row_Key": "LIGNE-001",
                "HS_Code": "123456",
                "Descr": "Exemple de produit",
                "Command_No": "CMD-001",
                "Supplier_Name": "Nom du fournisseur",
                "Invoice_No": "FACT-001",
                "Currency": "XOF",
                "Qty": 100,
                "Unit_Prize": 25.50,
                "Gross_Weight": 150,
                "Net_Weight": 140,
                "Volume": 2.5,
                "Country_Origin": "CM",
                "Regime_Code": "IM4",
                "Regime_Ratio": 0,
                "Customer_Grouping": "Site Perenco"
            },
            {
                "Row_Key": "LIGNE-002",
                "HS_Code": "654321",
                "Descr": "Autre produit 100% DC",
                "Command_No": "CMD-002",
                "Supplier_Name": "Autre fournisseur",
                "Invoice_No": "FACT-002",
                "Currency": "XOF",
                "Qty": 50,
                "Unit_Prize": 45.00,
                "Gross_Weight": 80,
                "Net_Weight": 75,
                "Volume": 1.5,
                "Country_Origin": "FR",
                "Regime_Code": "IM4",
                "Regime_Ratio": 100,
                "Customer_Grouping": "Site Perenco"
            },
            {
                "Row_Key": "LIGNE-003",
                "HS_Code": "789012",
                "Descr": "Produit avec 30% DC",
                "Command_No": "CMD-003",
                "Supplier_Name": "Troisième fournisseur",
                "Invoice_No": "FACT-003",
                "Currency": "EUR",
                "Qty": 75,
                "Unit_Prize": 120.00,
                "Gross_Weight": 200,
                "Net_Weight": 190,
                "Volume": 3.0,
                "Country_Origin": "US",
                "Regime_Code": "IM4",
                "Regime_Ratio": 30,
                "Customer_Grouping": "Site Perenco"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Colisages");

        // Définir la largeur des colonnes
        worksheet['!cols'] = [
            { wch: 15 }, // Row_Key
            { wch: 12 }, // HS_Code
            { wch: 30 }, // Descr
            { wch: 15 }, // Command_No
            { wch: 25 }, // Supplier_Name
            { wch: 15 }, // Invoice_No
            { wch: 10 }, // Currency
            { wch: 10 }, // Qty
            { wch: 15 }, // Unit_Prize
            { wch: 15 }, // Gross_Weight
            { wch: 15 }, // Net_Weight
            { wch: 10 }, // Volume
            { wch: 15 }, // Country_Origin
            { wch: 12 }, // Regime_Code
            { wch: 12 }, // Regime_Ratio
            { wch: 20 }  // Customer_Grouping
        ];

        XLSX.writeFile(workbook, "template-colisages.xlsx");
    };

    return (
        <>
            <Dialog open={showConflict} onOpenChange={setShowConflict}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Colisages existants détectés
                        </DialogTitle>
                        <DialogDescription>
                            {existingRowKeys.length} colisage(s) avec des Row Keys existants ont été trouvés.
                            Voulez-vous les mettre à jour ou annuler l'importation ?
                        </DialogDescription>
                    </DialogHeader>
                    <Card>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-32">
                                <ul className="space-y-2 text-sm">
                                    {existingRowKeys.map((col) => (
                                        <li key={col.id} className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium">{col.rowKey}</span>
                                            <span className="text-muted-foreground">- {col.description}</span>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowConflict(false);
                                setParsedRows([]);
                                setSelectedRows(new Set());
                            }}
                        >
                            Annuler
                        </Button>
                        <Button onClick={() => handleConflictDecision(true)}>
                            Mettre à jour
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-[65vw]! max-h-[85vh]!">
                    <DialogHeader>
                        <DialogTitle>Prévisualisation de l'import</DialogTitle>
                        <DialogDescription>
                            Sélectionnez les lignes à importer ({selectedRows.size}/{parsedRows.length} sélectionnées)
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] w-[60vw]">
                        <div className="min-w-max">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedRows.size === parsedRows.length}
                                                onCheckedChange={toggleAll}
                                            />
                                        </TableHead>
                                        <TableHead>Row Key</TableHead>
                                        <TableHead>HS Code</TableHead>
                                        <TableHead className="min-w-[200px]">Description</TableHead>
                                        <TableHead>Cmd No</TableHead>
                                        <TableHead>Fournisseur</TableHead>
                                        <TableHead>Facture</TableHead>
                                        <TableHead>Devise</TableHead>
                                        <TableHead>Qté</TableHead>
                                        <TableHead>Prix Unit.</TableHead>
                                        <TableHead>Poids Brut</TableHead>
                                        <TableHead>Poids Net</TableHead>
                                        <TableHead>Volume</TableHead>
                                        <TableHead>Pays</TableHead>
                                        <TableHead>Régime</TableHead>
                                        <TableHead>Ratio</TableHead>
                                        <TableHead>Groupement</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedRows.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedRows.has(index)}
                                                    onCheckedChange={() => toggleRow(index)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {row.rowKey || "-"}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {row.hscode || "-"}
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <div className="truncate max-w-[200px]" title={row.description}>
                                                    {row.description}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs">{row.numeroCommande || "-"}</TableCell>
                                            <TableCell className="max-w-[150px]">
                                                <div className="truncate" title={row.nomFournisseur}>
                                                    {row.nomFournisseur || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs">{row.numeroFacture || "-"}</TableCell>
                                            <TableCell className="font-semibold">{row.devise || "-"}</TableCell>
                                            <TableCell className="text-right">{row.quantite || "-"}</TableCell>
                                            <TableCell className="text-right">{row.prixUnitaireColis || "-"}</TableCell>
                                            <TableCell className="text-right text-xs">{row.poidsBrut || "-"}</TableCell>
                                            <TableCell className="text-right text-xs">{row.poidsNet || "-"}</TableCell>
                                            <TableCell className="text-right text-xs">{row.volume || "-"}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.paysOrigine || "-"}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.regimeCode || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                {row.regimeRatio !== undefined ? (
                                                    <span className={
                                                        row.regimeRatio === 0 ? "text-green-600 font-semibold" :
                                                        row.regimeRatio === 100 ? "text-red-600 font-semibold" :
                                                        "text-blue-600 font-semibold"
                                                    }>
                                                        {row.regimeRatio}%
                                                    </span>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="max-w-[120px]">
                                                <div className="truncate text-xs" title={row.regroupementClient}>
                                                    {row.regroupementClient || "-"}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPreview(false);
                                setParsedRows([]);
                                setSelectedRows(new Set());
                            }}
                        >
                            Annuler
                        </Button>
                        <Button onClick={handleImport} disabled={selectedRows.size === 0}>
                            Importer ({selectedRows.size})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showProgress} onOpenChange={setShowProgress}>
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
                <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Template
                </Button>

                <label htmlFor="excel-import-preview" className="cursor-pointer">
                    <Button
                        asChild
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                    >
                        <span className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            {isLoading ? "Chargement..." : "Importer Excel"}
                        </span>
                    </Button>
                    <input
                        id="excel-import-preview"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={isLoading}
                        className="hidden"
                    />
                </label>
            </div>
        </>
    );
};
