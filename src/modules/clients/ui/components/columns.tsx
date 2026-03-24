"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { UserIcon, CalendarIcon, ClockIcon } from "lucide-react";

// Type pour VClients (vue SQL Server)
type VClient = {
  ID_Client: number;
  Nom_Client: string;
  Date_Creation: Date;
  Nom_Creation: string | null;
};

export const columns: ColumnDef<VClient, any>[] = [
  {
    accessorKey: "Nom_Client",
    header: "Nom du client",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <UserIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col gap-y-1">
          <span className="font-semibold">{row.original.Nom_Client}</span>
          <span className="text-xs text-muted-foreground">
            ID: {row.original.ID_Client}
          </span>
        </div>
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
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(row.original.Date_Creation), "dd MMMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <ClockIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {format(new Date(row.original.Date_Creation), "HH:mm")}
              </span>
            </div>
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
      <Badge variant="outline" className="capitalize">
        {row.original.Nom_Creation || "Système"}
      </Badge>
    ),
  },
];
