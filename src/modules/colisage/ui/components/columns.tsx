"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

interface ColisageData {
    id: string;
    description: string;
    numeroCommande?: string | null;
    nomFournisseur?: string | null;
    quantite: number;
    poidsBrut: number;
    createdAt: Date;
}

export const createColumns = (
    selectedIds: string[],
    onSelectionChange: (ids: string[]) => void
): ColumnDef<ColisageData>[] => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => {
                        if (value) {
                            const allIds = table.getRowModel().rows.map(row => row.original.id);
                            onSelectionChange([...new Set([...selectedIds, ...allIds])]);
                        } else {
                            const pageIds = table.getRowModel().rows.map(row => row.original.id);
                            onSelectionChange(selectedIds.filter(id => !pageIds.includes(id)));
                        }
                    }}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedIds.includes(row.original.id)}
                    onCheckedChange={(value) => {
                        if (value) {
                            onSelectionChange([...selectedIds, row.original.id]);
                        } else {
                            onSelectionChange(selectedIds.filter(id => id !== row.original.id));
                        }
                    }}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <span className="font-semibold truncate max-w-[300px]">
                    {row.original.description}
                </span>
            ),
        },
        {
            accessorKey: "numeroCommande",
            header: "N° Commande",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.numeroCommande || "-"}</span>
            ),
        },
        {
            accessorKey: "nomFournisseur",
            header: "Fournisseur",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.nomFournisseur || "-"}</span>
            ),
        },
        {
            accessorKey: "quantite",
            header: "Quantité",
            cell: ({ row }) => (
                <span className="text-sm">{Number(row.original.quantite)}</span>
            ),
        },
        {
            accessorKey: "poidsBrut",
            header: "Poids (kg)",
            cell: ({ row }) => (
                <span className="text-sm">{Number(row.original.poidsBrut)}</span>
            ),
        },
        {
            accessorKey: "createdAt",
            header: "Créé le",
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: fr });
            },
        },
    ];

// Colonnes par défaut sans sélection (pour compatibilité)
export const columns: ColumnDef<ColisageData>[] = [
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
            <span className="font-semibold truncate max-w-[300px]">
                {row.original.description}
            </span>
        ),
    },
    {
        accessorKey: "numeroCommande",
        header: "N° Commande",
        cell: ({ row }) => (
            <span className="text-sm">{row.original.numeroCommande || "-"}</span>
        ),
    },
    {
        accessorKey: "nomFournisseur",
        header: "Fournisseur",
        cell: ({ row }) => (
            <span className="text-sm">{row.original.nomFournisseur || "-"}</span>
        ),
    },
    {
        accessorKey: "quantite",
        header: "Quantité",
        cell: ({ row }) => (
            <span className="text-sm">{Number(row.original.quantite)}</span>
        ),
    },
    {
        accessorKey: "poidsBrut",
        header: "Poids (kg)",
        cell: ({ row }) => (
            <span className="text-sm">{Number(row.original.poidsBrut)}</span>
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Créé le",
        cell: ({ row }) => {
            return format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: fr });
        },
    },
];
