"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { RegimeDeclarationWithDouanier } from "../../types";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { UpdateRegimeDeclarationDialog } from "./update-regime-declaration-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteRegimeDeclaration } from "../../server/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Fonction helper pour formater le taux régime
function formatTauxRegime(taux: number): string {
    if (taux === -2) return "TTC";
    if (taux === -1) return "100% TR";
    if (taux === 0) return "EXO";
    if (taux === 1) return "100% DC";
    if (taux > 0 && taux < 1) {
        return `${(taux * 100).toFixed(2)}% DC`;
    }
    return taux.toString();
}

// Composant Actions pour chaque ligne
const ActionsCell = ({ row }: { row: any }) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [ConfirmDialog, confirm] = useConfirm(
        "Supprimer le régime",
        "Êtes-vous sûr de vouloir supprimer ce régime de déclaration ?"
    );
    const router = useRouter();

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const ok = await confirm();
        if (ok) {
            const result = await deleteRegimeDeclaration(row.original.id.toString());
            if (result.success) {
                toast.success("Régime de déclaration supprimé avec succès");
                router.refresh();
            } else {
                toast.error("Erreur lors de la suppression");
            }
        }
    };

    return (
        <>
            <ConfirmDialog />
            <UpdateRegimeDeclarationDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                initialValues={{
                    id: row.original.id.toString(),
                    libelle: row.original.libelleRegimeDeclaration,
                    tauxRegime: row.original.tauxRegime,
                    regimeDouanierId: row.original.regimeDouanier.toString(),
                }}
            />
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEdit}
                    className="h-8 w-8"
                >
                    <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <TrashIcon className="h-4 w-4" />
                </Button>
            </div>
        </>
    );
};

export const columns: ColumnDef<RegimeDeclarationWithDouanier>[] = [
    {
        accessorKey: "libelle",
        header: "Libellé",
        cell: ({ row }) => (
            <span className="font-semibold">{row.original.libelleRegimeDeclaration}</span>
        ),
    },
    {
        accessorKey: "tauxRegime",
        header: "Taux Régime",
        cell: ({ row }) => {
            const taux = row.original.tauxRegime;
            return <span className="text-sm">{formatTauxRegime(Number(taux))}</span>;
        },
    },
    {
        accessorKey: "createdAt",
        header: "Créé le",
        cell: ({ row }) => {
            const date = row.original.dateCreation;
            if (!date) return "-";
            try {
                return format(new Date(date), "dd MMM yyyy", { locale: fr });
            } catch {
                return "-";
            }
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];
