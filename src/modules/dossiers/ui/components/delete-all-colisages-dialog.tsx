"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteManyColisages } from "../../server/colisage-actions";
import { triggerColisageRefresh } from "../../hooks/use-colisage-refresh";

interface DeleteAllColisagesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    colisages: any[];
    selectedRows?: any[];
    onSuccess: () => void;
    dossierId: number; // Ajout du dossierId
}

export const DeleteAllColisagesDialog = ({
    open,
    onOpenChange,
    colisages,
    selectedRows = [],
    onSuccess,
    dossierId,
}: DeleteAllColisagesDialogProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const isDeleteAll = selectedRows.length === 0;
    const itemsToDelete = isDeleteAll ? colisages : selectedRows;
    const count = itemsToDelete.length;

    const handleDelete = async () => {
        if (count === 0) return;

        setIsDeleting(true);
        setProgress({ current: 0, total: count });

        try {
            // Extraire les IDs des colisages à supprimer
            const idsToDelete = itemsToDelete.map(item => item.ID_Colisage_Dossier.toString());

            // Suppression en une seule transaction
            const result = await deleteManyColisages(idsToDelete);

            if (result.success && result.data) {
                toast.success(`${result.data.deleted} colisage(s) supprimé(s) avec succès`);
            } else {
                toast.error("Erreur lors de la suppression des colisages");
                console.error("Erreur suppression:", result.error);
            }

            // Fermer la modal et actualiser
            onOpenChange(false);
            onSuccess();
            
            // Déclencher le rafraîchissement automatique du tableau
            triggerColisageRefresh(dossierId);

        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            toast.error("Erreur lors de la suppression des colisages");
        } finally {
            setIsDeleting(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const handleCancel = () => {
        if (!isDeleting) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Confirmer la suppression
                    </DialogTitle>
                    <DialogDescription>
                        {isDeleteAll ? (
                            <>
                                Voulez-vous vraiment supprimer <strong>TOUS les {count} colisages</strong> ?
                                <br />
                                Cette action est <strong>irréversible</strong>.
                            </>
                        ) : (
                            <>
                                Voulez-vous vraiment supprimer les <strong>{count} colisage(s) sélectionné(s)</strong> ?
                                <br />
                                Cette action est <strong>irréversible</strong>.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {isDeleting && (
                    <div className="py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">
                                Suppression en cours...
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Suppression de {count} colisages en une seule transaction
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isDeleting}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || count === 0}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Suppression...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer {count} colisage(s)
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};