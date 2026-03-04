"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteColisage, deleteAllColisagesByDossierId } from "../../server/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";

interface ColisageBulkActionsProps {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    totalCount: number;
}

export const ColisageBulkActions = ({
    selectedIds,
    onSelectionChange,
    totalCount,
}: ColisageBulkActionsProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Êtes-vous sûr?",
        `Voulez-vous vraiment supprimer ${selectedIds.length} colisage(s) ? Cette action est irréversible.`
    );

    const [RemoveAllConfirmation, confirmRemoveAll] = useConfirm(
        "Êtes-vous sûr?",
        `Voulez-vous vraiment supprimer TOUS les ${totalCount} colisage(s) ? Cette action est irréversible.`
    );

    const handleDeleteSelected = async () => {
        const ok = await confirmRemove();
        if (!ok) return;

        setIsDeleting(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            for (const id of selectedIds) {
                const res = await deleteColisage(id);
                if (res.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} colisage(s) supprimé(s) avec succès`);
            }
            if (errorCount > 0) {
                toast.error(`${errorCount} colisage(s) n'ont pas pu être supprimés`);
            }

            onSelectionChange([]);
            router.refresh();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        // Cette fonction supprime tous les colisages sélectionnés
        // C'est la même chose que handleDeleteSelected
        await handleDeleteSelected();
    };

    if (selectedIds.length === 0) {
        return null;
    }

    return (
        <>
            <RemoveConfirmation />
            <RemoveAllConfirmation />
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                    {selectedIds.length} sélectionné(s)
                </span>
                <div className="flex-1" />
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Supprimer la sélection
                </Button>
                {selectedIds.length === totalCount && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAll}
                        disabled={isDeleting}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Supprimer tout
                    </Button>
                )}
            </div>
        </>
    );
};
