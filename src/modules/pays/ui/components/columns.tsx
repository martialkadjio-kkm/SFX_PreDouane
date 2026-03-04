"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";

export type VPays = {
  idPays: number;
  codePays: string;
  libellePays: string;
  deviseLocale: string;
  dateCreation: Date | string;
  nomCreation: string | null;
};

export const columns: ColumnDef<VPays, any>[] = [
  {
    accessorKey: "codePays",
    header: "Code",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold">{row.original.codePays}</span>
      </div>
    ),
  },
  {
    accessorKey: "libellePays",
    header: "Libelle",
    cell: ({ row }) => <span>{row.original.libellePays}</span>,
  },
  {
    accessorKey: "deviseLocale",
    header: "Devise locale",
    cell: ({ row }) => <span>{row.original.deviseLocale}</span>,
  },
  {
    accessorKey: "dateCreation",
    header: "Date de creation",
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.dateCreation), "dd MMM yyyy");
      } catch {
        return <span className="text-muted-foreground">-</span>;
      }
    },
  },
  {
    accessorKey: "nomCreation",
    header: "Cree par",
    cell: ({ row }) => <span>{row.original.nomCreation || "Systeme"}</span>,
  },
];
