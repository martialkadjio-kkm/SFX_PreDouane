"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type OrderTransit = {
    id: number | string;
    orderReference: string;
    statut: string;
    createdAt: string | Date;
};

interface Props {
    orders: OrderTransit[];
}

export const ClientOrdersTransit = ({ orders }: Props) => {
    const router = useRouter();

    const columns: ColumnDef<OrderTransit>[] = [
        {
            accessorKey: "orderReference",
            header: "Référence",
            cell: ({ row }) => (
                <span className="font-semibold">{row.original.orderReference}</span>
            ),
        },

        {
            accessorKey: "statusOT",
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
            header: "Date de création",
            cell: ({ row }) => {
                return format(new Date(row.original.createdAt), "dd MMM yyyy");
            },
        },
    ];

    if (orders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ordres de Transit</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Aucun ordre de transit associé à ce client
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ordres de Transit ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    data={orders}
                    columns={columns}
                    onRowClick={(row) => router.push(`/transit-orders/${row.id}`)}
                />
            </CardContent>
        </Card>
    );
};
