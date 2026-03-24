"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { RegimeDeclarationWithDouanier } from "../../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, TrashIcon, CalendarIcon } from "lucide-react";
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
            <span className="font-semibold text-base">{row.original.libelleRegimeDeclaration}</span>
        ),
    },
    {
        accessorKey: "tauxRegime",
        header: "Taux Régime",
        cell: ({ row }) => {
            const taux = row.original.tauxRegime;
            const formattedTaux = formatTauxRegime(Number(taux));
            
            // Couleurs selon le type de taux
            let badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
            if (formattedTaux === "EXO") badgeClass = "bg-green-100 text-green-800 border-green-200";
            if (formattedTaux === "TTC") badgeClass = "bg-purple-100 text-purple-800 border-purple-200";
            if (formattedTaux.includes("TR")) badgeClass = "bg-orange-100 text-orange-800 border-orange-200";
            
            return (
                <Badge className={badgeClass} variant="outline">
                    {formattedTaux}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Créé le",
        cell: ({ row }) => {
            const date = row.original.dateCreation;
            if (!date) return <span className="text-muted-foreground">-</span>;
            try {
                return (
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {format(new Date(date), "dd MMMM yyyy", { locale: fr })}
                        </span>
                    </div>
                );
            } catch {
                return <span className="text-muted-foreground">-</span>;
            }
        },
    },
    {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];
