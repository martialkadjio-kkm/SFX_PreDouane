"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CornerDownRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Type basé sur VDossiers
export type DossierView = {
    idDossier: number;
    noDossier: string | null;
    noOT: string | null;
    nomClient: string;
    libelleTypeDossier: string;
    libelleSensTrafic: string;
    libelleModeTransport: string;
    Nbre_Paquetage_Pesee: number;
    poidsBrutPesee: number;
    libelleStatutDossier: string;
    nomResponsable: string;
    libelleEtapeActuelle: string | null;
    dateCreation: Date;
    dateOuvertureDossier: Date | null;
};

export const columns: ColumnDef<DossierView>[] = [    
    {
        accessorKey: "noDossier",
        header: "N° Dossier / N° OT",
        cell: ({ row }) => (
            <div className="flex flex-col gap-y-1">
                <span className="font-semibold">{row.original.noDossier || "N/A"}</span>
                <div className="flex items-center gap-x-1">
                    <CornerDownRightIcon className="size-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {row.original.noOT || "N/A"}
                    </span>
                </div>
            </div>
        ),
    },
    {
        id: "globalSearch",
        accessorFn: (row) => `${row.noDossier || ''} ${row.noOT || ''} ${row.nomClient} ${row.libelleTypeDossier}`.toLowerCase(),
        header: "",
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
        size: 0,
    },
    {
        accessorKey: "nomClient",
        header: "Client",
        cell: ({ row }) => (
            <span className="capitalize">{row.original.nomClient}</span>
        ),
    },
    {
        accessorKey: "libelleTypeDossier",
        header: "Type / Sens",
        cell: ({ row }) => (
            <div className="flex flex-col gap-y-1">
                <span className="font-semibold text-sm">{row.original.libelleTypeDossier}</span>
                <div className="flex items-center gap-x-1">
                    <CornerDownRightIcon className="size-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {row.original.libelleSensTrafic}
                    </span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "libelleModeTransport",
        header: "Mode Transport",
        cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
                {row.original.libelleModeTransport}
            </Badge>
        ),
    },
    {
        accessorKey: "nbrePaquetagePesee",
        header: "Colis / Poids",
        cell: ({ row }) => (
            <div className="flex flex-col gap-y-1">
                <span className="font-semibold text-sm">{Number(row.original.Nbre_Paquetage_Pesee)} paquets</span>
                <div className="flex items-center gap-x-1">
                    <CornerDownRightIcon className="size-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {Number(row.original.poidsBrutPesee).toFixed(2)} kg
                    </span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "libelleEtapeActuelle",
        header: "Étape Actuelle",
        cell: ({ row }) => {
            const etape = row.original.libelleEtapeActuelle;
            const etapeCOlor: Record<string, string> = {
                "Ouvert": "bg-blue-100 text-blue-800 border-blue-200",
                "File Opening": "bg-amber-100 text-amber-800 border-amber-200",
                "Operations Completed": "bg-emerald-100 text-emerald-800 border-emerald-200",
                "Operations Cancelled": "bg-red-100 text-red-800 border-red-200",
            };
            return etape ? (
                <Badge variant="secondary" className={cn("capitalize",
                    etapeCOlor[etape] || "bg-slate-100 text-slate-800 border-slate-200"
                )}>
                    {etape}
                </Badge>
            ) : (
                <span className="text-muted-foreground text-sm">-</span>
            );
        },
    },
    {
        accessorKey: "libelleStatutDossier",
        header: "Statut",
        cell: ({ row }) => {
            const status = row.original.libelleStatutDossier;
            const statusColor: Record<string, string> = {
                "Ouvert": "bg-blue-100 text-blue-800 border-blue-200",
                "Operations in progress": "bg-amber-100 text-amber-800 border-amber-200",
                "Operations completed": "bg-emerald-100 text-emerald-800 border-emerald-200",
                "Operations Cancelled": "bg-red-100 text-red-800 border-red-200",
            };

            console.log("Status:", status);

            return (
                <Badge className={statusColor[status] || "bg-slate-100 text-slate-800 border-slate-200"}>
                    {status}
                    
                </Badge>
            );
        },
    },
    {
        accessorKey: "nomResponsable",
        header: "Responsable",
        cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">
                {row.original.nomResponsable}
            </Badge>
        ),
    },
];
