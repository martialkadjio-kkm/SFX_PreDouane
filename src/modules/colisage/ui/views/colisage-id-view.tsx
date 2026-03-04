"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Package, Truck, DollarSign } from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteColisage } from "../../server/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ColisageIdHeader } from "../components/colisage-id-header";
import { UpdateColisageDialog } from "../components/update-colisage-dialog";

interface ColisageData {
    id: string;
    description: string;
    numeroCommande?: string | null;
    nomFournisseur?: string | null;
    numeroFacture?: string | null;
    quantite: number;
    prixUnitaireColis: number;
    poidsBrut: number;
    poidsNet: number;
    volume: number;
    regroupementClient?: string | null;
    orderTransitId?: string;
    hscodeId?: string | null;
    deviseId?: string;
    paysOrigineId?: string;
    regimeDeclarationId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface Props {
    colisageId: string;
    colisage: ColisageData;
}

export const ColisageIdView = ({
    colisageId,
    colisage,
}: Props) => {
    const router = useRouter();
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Êtes-vous sûr?",
        `Voulez-vous vraiment supprimer ce colisage "${colisage.description}" ? Cette action est irréversible.`
    );

    const handleRemove = async () => {
        const ok = await confirmRemove();

        if (!ok) return;

        try {
            const res = await deleteColisage(colisageId);

            if (!res.success) {
                toast.error("Erreur lors de la suppression du colisage.");
                return;
            }
            toast.success("Colisage supprimé avec succès.");
            router.push("/colisage");
        } catch (error) {
            toast.error("Erreur lors de la suppression du colisage.");
        }
    };

    return (
        <>
            <RemoveConfirmation />
            <UpdateColisageDialog
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
                initialValues={colisage}
            />
            <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
                <ColisageIdHeader
                    colisageId={colisageId}
                    description={colisage.description}
                    onEdit={() => setUpdateDialogOpen(true)}
                    onRemove={handleRemove}
                />

                {/* Carte principale avec informations */}
                <Card className="border-2">
                    <CardHeader className="pb-3">
                        <CardTitle>Informations</CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Colonne gauche */}
                            <div className="space-y-6">
                                {/* Description */}
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">DESCRIPTION</p>
                                    <p className="text-base font-medium mt-1">{colisage.description}</p>
                                </div>

                                {/* Numéro Commande */}
                                {colisage.numeroCommande && (
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">N° COMMANDE</p>
                                        <p className="text-base font-medium mt-1">{colisage.numeroCommande}</p>
                                    </div>
                                )}

                                {/* Fournisseur */}
                                {colisage.nomFournisseur && (
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">FOURNISSEUR</p>
                                        <p className="text-base font-medium mt-1">{colisage.nomFournisseur}</p>
                                    </div>
                                )}
                            </div>

                            {/* Colonne droite */}
                            <div className="space-y-6">
                                {/* Numéro Facture */}
                                {colisage.numeroFacture && (
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">N° FACTURE</p>
                                        <p className="text-base font-medium mt-1">{colisage.numeroFacture}</p>
                                    </div>
                                )}

                                {/* Quantité */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">QUANTITÉ</p>
                                    </div>
                                    <p className="text-base font-medium">{Number(colisage.quantite)}</p>
                                </div>

                                {/* Prix Unitaire */}
                                {colisage.prixUnitaireColis > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-semibold text-muted-foreground">PRIX UNITAIRE</p>
                                        </div>
                                        <p className="text-base font-medium">{Number(colisage.prixUnitaireColis).toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Poids et Volume */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Poids et Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Poids Brut</p>
                                <p className="text-base font-medium">{Number(colisage.poidsBrut)} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Poids Net</p>
                                <p className="text-base font-medium">{Number(colisage.poidsNet)} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Volume</p>
                                <p className="text-base font-medium">{Number(colisage.volume)} m³</p>
                            </div>
                            {colisage.regroupementClient && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Regroupement</p>
                                    <p className="text-base font-medium">{colisage.regroupementClient}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Créé le</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base font-medium">
                                {format(new Date(colisage.createdAt), "d MMMM yyyy", { locale: fr })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(colisage.createdAt), "HH:mm", { locale: fr })}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Modifié le</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base font-medium">
                                {format(new Date(colisage.updatedAt), "d MMMM yyyy", { locale: fr })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(colisage.updatedAt), "HH:mm", { locale: fr })}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export const ColisageIdLoadingView = () => {
    return (
        <LoadingState
            title="Chargement du colisage"
            description="Ceci peut prendre quelques secondes."
        />
    );
};

export const ColisageIdErrorView = () => {
    return (
        <ErrorState
            title="Erreur lors du chargement du colisage"
            description="Une erreur est survenue."
        />
    );
};
