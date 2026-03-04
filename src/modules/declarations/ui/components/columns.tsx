"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { CornerDownRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DeclarationRecord = {
  id: string;
  orderTransitId: string;
  numeroDeclaration: string;
  statut?: string | null;
  dateDeclaration?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  user?: { name?: string | null } | null;
};

export const columns: ColumnDef<DeclarationRecord>[] = [
  {
    accessorKey: "orderTransitId",
    header: "ordre de transit et numero declaration",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold capitalize">{row.original.orderTransitId}</span>
        <div className="flex items-center gap-x-2">
          <div className="flex items-center gap-x-1">
            <CornerDownRightIcon className="size-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground max-w-[200px] truncate">
              {row.original.numeroDeclaration}
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "dateDeclaration",
    header: "Date declaration",
    cell: ({ row }) => {
      const value = row.original.dateDeclaration || row.original.createdAt;
      return <span className="capitalize">{value ? format(new Date(value), "dd MMM yyyy") : "-"}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Modifie le / Ajoute le",
    cell: ({ row }) => {
      const updatedAt = row.original.updatedAt || row.original.createdAt;
      const createdAt = row.original.createdAt;
      return (
        <div className="flex flex-col gap-y-1">
          <span className="font-semibold capitalize">
            {updatedAt ? format(new Date(updatedAt), "dd MMM yyyy") : "-"}
          </span>
          <div className="flex items-center gap-x-2">
            <div className="flex items-center gap-x-1">
              <CornerDownRightIcon className="size-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground max-w-[200px] truncate">
                {createdAt ? format(new Date(createdAt), "dd MMM yyyy") : "-"}
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Responsable",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize [&>svg]:size-4 flex items-center gap-x-2">
        {row.original?.user?.name || "-"}
      </Badge>
    ),
  },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: ({ row }) => <span className="capitalize">{row.original.statut || "-"}</span>,
  },
];
