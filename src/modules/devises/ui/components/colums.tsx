"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";

type VDevise = {
  idDevise: number;
  codeDevise: string;
  libelleDevise: string;
  decimales: number;
  dateCreation: Date | string;
  nomCreation: string | null;
};

export const columns: ColumnDef<VDevise, any>[] = [
  {
    accessorKey: "codeDevise",
    header: "Code",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold">{row.original.codeDevise}</span>
      </div>
    ),
  },
  {
    accessorKey: "libelleDevise",
    header: "Libelle",
    cell: ({ row }) => <span>{row.original.libelleDevise}</span>,
  },
  {
    accessorKey: "decimales",
    header: "Decimales",
    cell: ({ row }) => <span>{row.original.decimales}</span>,
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
