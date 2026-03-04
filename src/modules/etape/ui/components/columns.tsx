"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Etape, User } from "@/generated/prisma";

type EtapeWithUser = Etape & {
  user: User;
};

export const columns: ColumnDef<EtapeWithUser>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold uppercase">{row.original.code}</span>
      </div>
    ),
  },
  {
    accessorKey: "libelle",
    header: "Libellé",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.libelle}</span>
    ),
  },
  {
    accessorKey: "ordre",
    header: "Ordre",
    cell: ({ row }) => (
      <span>{row.original.ordre}</span>
    ),
  },
  {
    accessorKey: "suiviDuree",
    header: "Suivi durée",
    cell: ({ row }) =>
      row.original.suiviDuree ? (
        <Badge variant="default">Oui</Badge>
      ) : (
        <Badge variant="secondary">Non</Badge>
      ),
  },
  {
    accessorKey: "delai",
    header: "Délai (Jours)",
    cell: ({ row }) => <span>{row.original.delai}</span>,
  },
  {
    accessorKey: "circuit",
    header: "Circuit",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.circuit || "-"}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date de création",
    cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy"),
  },
  {
    accessorKey: "user",
    header: "Responsable",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.user.name}</span>
    ),
  },
];
