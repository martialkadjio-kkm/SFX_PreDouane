"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type OrderTransitRecord = {
  id: string | number;
  orderReference: string;
  typeDossierId?: string | number | null;
  observation?: string | null;
  statut?: string | null;
  createdAt?: string | Date | null;
};

interface Props {
  orders: OrderTransitRecord[];
}

export const DeclarationOrdersTransit = ({ orders }: Props) => {
  const router = useRouter();

  const columns: ColumnDef<OrderTransitRecord>[] = [
    {
      accessorKey: "orderReference",
      header: "Reference",
      cell: ({ row }) => <span className="font-semibold">{row.original.orderReference}</span>,
    },
    {
      accessorKey: "operationType",
      header: "Type d'operation",
      cell: ({ row }) => <span className="capitalize">{row.original.typeDossierId ?? "-"}</span>,
    },
    {
      accessorKey: "observation",
      header: "Observation",
      cell: ({ row }) => <span className="capitalize">{row.original.observation || "-"}</span>,
    },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => {
        const status = row.original.statut || "-";
        const statusColor: Record<string, string> = {
          "En attente": "bg-yellow-100 text-yellow-800",
          "En cours": "bg-blue-100 text-blue-800",
          "Complete": "bg-green-100 text-green-800",
          "Annule": "bg-red-100 text-red-800",
        };

        return <Badge className={statusColor[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date de creation",
      cell: ({ row }) => (row.original.createdAt ? format(new Date(row.original.createdAt), "dd MMM yyyy") : "-"),
    },
  ];

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ordres de Transit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Aucun ordre de transit associe a cette declaration</p>
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
