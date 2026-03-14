"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteManyColisages } from "../../server/actions";
import { Card, CardContent } from "@/components/ui/card";

interface ColisageBulkActionsForOrderProps {
    selectedIds: string[];
    orderTransitId: string;
    onSelectionChange: (ids: string[]) => void;
    onActionComplete: () => void;
    totalCount: number;
}

export const ColisageBulkActionsForOrder = ({
    selectedIds,
    orderTransitId,
    onSelectionChange,
    onActionComplete,
    totalCount,
}: ColisageBulkActionsForOrderProps) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const [DeleteSelectedConfirmation, confirmDeleteSelected] = useConfirm(
        "Supprimer la sélection",
        `Voulez-vous vraiment supprimer ${selectedIds.length} colisage(s) sélectionné(s) ? Cette action est irréversible.`
    );

    const [DeleteAllConfirmation, confirmDeleteAll] = useConfirm(
        "Supprimer tous les colisages",
        `Voulez-vous vraiment supprimer TOUS les ${totalCount} colisages de cet ordre de transit ? Cette action est irréversible.`
    );

    const handleDeleteSelected = async () => {
        const ok = await confirmDeleteSelected();
        if (!ok) return;

        setIsDeleting(true);
        try {
            // Suppression en une seule transaction
            const result = await deleteManyColisages(selectedIds);

            if (result.success && result.data) {
                toast.success(`${result.data.deleted} colisage(s) supprimé(s) avec succès`);
            } else {
                toast.error("Erreur lors de la suppression");
                console.error(result.error);
            }

            onSelectionChange([]);
            onActionComplete();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        const ok = await confirmDeleteAll();
        if (!ok) return;

        setIsDeleting(true);
        try {
            const { deleteAllColisagesByOrderTransitId } = await import("../../server/actions");
            const result = await deleteAllColisagesByOrderTransitId(orderTransitId);

            if (result.success && result.data) {
                toast.success(`${result.data.deleted} colisage(s) supprimé(s) avec succès`);
            } else {
                toast.error("Erreur lors de la suppression");
            }

            onSelectionChange([]);
            onActionComplete();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <DeleteSelectedConfirmation />
            <DeleteAllConfirmation />
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                                {selectedIds.length} colisage(s) sélectionné(s)
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSelectionChange([])}
                                className="h-8"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Désélectionner
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSelected}
                                disabled={isDeleting || selectedIds.length === 0}
                                className="h-8"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Supprimer la sélection
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteAll}
                                disabled={isDeleting}
                                className="h-8"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Supprimer tout
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
