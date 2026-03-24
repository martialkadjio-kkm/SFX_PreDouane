"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { useState } from "react";
import { NewTauxChangeDialog } from "./new-taux-change-dialog";
import { Badge } from "@/components/ui/badge";

// Composant Actions pour chaque ligne
const ActionsCell = ({ row }: { row: any }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAddTaux = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDialogOpen(true);
    };

    return (
        <>
            <NewTauxChangeDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                conversionId={row.original.ID_Convertion?.toString() || ""}
            />
            <div className="flex items-center justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddTaux}
                    className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    title="Ajouter un taux de change"
                >
                    <PlusCircleIcon className="h-4 w-4" />
                    <span className="text-xs">Ajouter taux</span>
                </Button>
            </div>
        </>
    );
};

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "Date_Convertion",
        header: "Date de conversion",
        cell: ({ row }) => {
            const dateValue = row.getValue("Date_Convertion");
            if (!dateValue) return <span className="text-muted-foreground">N/A</span>;
            try {
                const date = new Date(dateValue as string);
                return (
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                            {format(date, "dd MMMM yyyy", { locale: fr })}
                        </span>
                    </div>
                );
            } catch {
                return <span className="text-muted-foreground">N/A</span>;
            }
        },
    },
    {
        accessorKey: "Date_Creation",
        header: "Date de création",
        cell: ({ row }) => {
            const dateValue = row.getValue("Date_Creation");
            if (!dateValue) return <span className="text-muted-foreground">N/A</span>;
            try {
                const date = new Date(dateValue as string);
                return (
                    <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {format(date, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                    </div>
                );
            } catch {
                return <span className="text-muted-foreground">N/A</span>;
            }
        },
    },
    {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];
