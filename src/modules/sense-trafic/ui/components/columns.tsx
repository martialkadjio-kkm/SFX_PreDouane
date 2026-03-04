"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { CornerDownRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TSensTrafic, User } from "@/generated/prisma";

type SenseTraficWithUser = TSensTrafic & { user?: User | null };

export const columns: ColumnDef<SenseTraficWithUser>[] = [
  {
    accessorKey: "libelle",
    header: "Libelle",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold capitalize">{row.original.libelle}</span>
      </div>
    ),
  },
  {
        accessorKey: "createdAt",
        header: "Date de création",
        cell: ({ row }) => {
            return format(new Date(row.original.createdAt), "dd MMM yyyy");
        },
  },
  {
    accessorKey: "userId",
    header: "Responsable",
    cell: ({ row }) => {
      return (
        <Badge
          variant={"outline"}
          className="capitalize [&>svg]:size-4 flex items-center gap-x-2"
        >
          {row.original?.user?.name}
        </Badge>
      );
    },
  },
]