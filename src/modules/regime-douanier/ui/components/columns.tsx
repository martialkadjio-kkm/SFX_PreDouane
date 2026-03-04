"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";

// Type pour VRegimesDouaniers (vue SQL Server)
type VRegimeDouanier = {
  ID_Regime_Douanier: number;
  Libelle_Regime_Douanier: string;
  Date_Creation: Date | string;
  Nom_Creation: string | null;
};

export const columns: ColumnDef<VRegimeDouanier, any>[] = [
  {
    accessorKey: "Libelle_Regime_Douanier",
    header: "Libellé",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold">{row.original.Libelle_Regime_Douanier}</span>
      </div>
    ),
  },
  {
    accessorKey: "Date_Creation",
    header: "Date de création",
    cell: ({ row }) => {
      try {
        return (
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">
              {format(new Date(row.original.Date_Creation), "dd MMM yyyy")}
            </span>
          </div>
        );
      } catch {
        return <span className="text-muted-foreground">-</span>;
      }
    },
  },
  {
    accessorKey: "Nom_Creation",
    header: "Créé par",
    cell: ({ row }) => (
      <span>{row.original.Nom_Creation || "Système"}</span>
    ),
  },
];
