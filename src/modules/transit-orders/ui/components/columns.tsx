"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { OrderTransit, Client } from "@/generated/prisma";

type OrderTransitWithClient = OrderTransit & { client?: Client | null };

export const columns: ColumnDef<OrderTransitWithClient>[] = [
    {
        accessorKey: "orderReference",
        header: "Référence",
        cell: ({ row }) => (
            <span className="font-semibold">{row.original.orderReference}</span>
        ),
    },
    {
        accessorKey: "numeroOT",
        header: "N° OT",
        cell: ({ row }) => (
            <span className="text-sm">{row.original.numeroOT}</span>
        ),
    },
    {
        accessorKey: "client.nom",
        header: "Client",
        cell: ({ row }) => (
            <span className="capitalize">{row.original.client?.nom || "N/A"}</span>
        ),
    },
    {
        accessorKey: "nbrePaquetageOT",
        header: "Colis",
        cell: ({ row }) => (
            <span className="text-sm">{Number(row.original.nbrePaquetageOT) || "-"}</span>
        ),
    },
    {
        accessorKey: "poidsBrutOT",
        header: "Poids (kg)",
        cell: ({ row }) => (
            <span className="text-sm">{Number(row.original.poidsBrutOT) || "-"}</span>
        ),
    },
    {
        accessorKey: "statut",
        header: "Statut",
        cell: ({ row }) => {
            const status = row.original.statut;
            const statusColor: Record<string, string> = {
                "En attente": "bg-yellow-100 text-yellow-800",
                "En cours": "bg-blue-100 text-blue-800",
                "Complété": "bg-green-100 text-green-800",
                "Annulé": "bg-red-100 text-red-800",
            };

            return (
                <Badge className={statusColor[status] || "bg-gray-100 text-gray-800"}>
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Créé le",
        cell: ({ row }) => {
            return format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: fr });
        },
    },
];
