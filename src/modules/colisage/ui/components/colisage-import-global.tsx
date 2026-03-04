"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getAllOrderTransitsForSelect } from "@/modules/transit-orders/server/actions";
import { CommandSelect } from "@/components/command-select";
import { ColisageImportPreview } from "./colisage-import-preview";

export const ColisageImportGlobal = () => {
    const [showOrderSelect, setShowOrderSelect] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string>("");
    const [orders, setOrders] = useState<Array<{ id: string; orderReference: string }>>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoadingOrders(true);
        try {
            const result = await getAllOrderTransitsForSelect();
            if (result.success && result.data) {
                setOrders(result.data);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            toast.error("Erreur lors du chargement des ordres de transit");
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const handleImportClick = () => {
        setShowOrderSelect(true);
    };

    const handleOrderSelect = (orderId: string) => {
        setSelectedOrderId(orderId);
        setShowOrderSelect(false);
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

        worksheet['!cols'] = [
            { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 15 },
            { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 20 }
        ];

        XLSX.writeFile(workbook, "template-colisages.xlsx");
    };

    return (
        <>
            {/* Dialog de sélection d'ordre */}
            <Dialog open={showOrderSelect} onOpenChange={setShowOrderSelect}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sélectionner un ordre de transit</DialogTitle>
                        <DialogDescription>
                            Choisissez l'ordre de transit dans lequel importer les colisages
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Ordre de transit</Label>
                            <CommandSelect
                                options={orders.map(o => ({
                                    id: o.id,
                                    value: o.id,
                                    children: <span>{o.orderReference}</span>
                                }))}
                                value={selectedOrderId}
                                onSelect={handleOrderSelect}
                                placeholder="Sélectionner un ordre..."
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Composant d'import avec prévisualisation */}
            {selectedOrderId ? (
                <ColisageImportPreview 
                    key={selectedOrderId}
                    orderTransitId={selectedOrderId}
                    onClose={() => setSelectedOrderId("")}
                />
            ) : (
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

                    <Button
                        onClick={handleImportClick}
                        variant="outline"
                        size="sm"
                        disabled={isLoadingOrders}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {isLoadingOrders ? "Chargement..." : "Importer Excel"}
                    </Button>
                </div>
            )}
        </>
    );
};
