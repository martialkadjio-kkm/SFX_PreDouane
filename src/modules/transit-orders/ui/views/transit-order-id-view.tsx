"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Package, Truck, FileText, User } from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { useConfirm } from "@/hooks/use-confirm";
import { OrderTransit, Client } from "@/generated/prisma";
import { deleteOrderTransit } from "../../server/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TransitOrderIdHeader } from "../components/transit-order-id-header";
import { UpdateOrderTransitDialog } from "../components/update-order-transit-dialog";
import { ColisageImportPreview } from "@/modules/colisage/ui/components/colisage-import-preview";
import { ColisageListForOrder } from "@/modules/colisage/ui/components/colisage-list-for-order";


type OrderTransitWithClient = OrderTransit & { client?: Client | null };

interface Props {
    orderId: string;
    order: OrderTransitWithClient;
}

export const TransitOrderIdView = ({ orderId, order }: Props) => {
    const router = useRouter();
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Êtes-vous sûr?",
        `Voulez-vous vraiment supprimer l'ordre de transit "${order.orderReference}" ? Cette action est irréversible.`
    );

    const handleRemoveOrder = async () => {
        const ok = await confirmRemove();

        if (!ok) return;

        try {
            const res = await deleteOrderTransit(orderId);

            if (!res.success) {
                toast.error("Erreur lors de la suppression de l'ordre de transit.");
                return;
            }
            toast.success("Ordre de transit supprimé avec succès.");
            router.push("/transit-orders");
        } catch (error) {
            toast.error("Erreur lors de la suppression de l'ordre de transit.");
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "En attente": "bg-yellow-100 text-yellow-800",
            "En cours": "bg-blue-100 text-blue-800",
            "Complété": "bg-green-100 text-green-800",
            "Annulé": "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <>
            <RemoveConfirmation />
            <UpdateOrderTransitDialog
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
                initialValues={order}
            />
            <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
                <TransitOrderIdHeader
                    orderId={orderId}
                    orderReference={order.orderReference}
                    onEdit={() => setUpdateDialogOpen(true)}
                    onRemove={handleRemoveOrder}
                />

                {/* Carte principale avec statut */}
                <Card className="border-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-3xl font-bold">{order.orderReference}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Numéro OT: {order.numeroOT}</p>
                            </div>
                            <Badge className={`${getStatusColor(order.statut)} text-sm px-3 py-1`}>
                                {order.statut}
                            </Badge>
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Colonne gauche - Informations principales */}
                            <div className="space-y-6">
                                {/* Client */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">CLIENT</p>
                                    </div>
                                    <Link
                                        href={`/client/${order.client?.id}`}
                                        className="text-lg font-semibold text-blue-600 hover:underline"
                                    >
                                        {order.client?.nom || "N/A"}
                                    </Link>
                                </div>

                                {/* Numéro OT */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">NUMÉRO OT</p>
                                    </div>
                                    <p className="text-base font-medium">{order.numeroOT}</p>
                                </div>

                                {/* Quantité de colis */}
                                {order.nbrePaquetageOT && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-semibold text-muted-foreground">QUANTITÉ COLIS</p>
                                        </div>
                                        <p className="text-base font-medium">{Number(order.nbrePaquetageOT)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Colonne droite - Dates et infos */}
                            <div className="space-y-6">
                                {/* Date de création */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">CRÉÉ LE</p>
                                    </div>
                                    <p className="text-base font-medium">
                                        {format(new Date(order.createdAt), "d MMMM yyyy", { locale: fr })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(order.createdAt), "HH:mm", { locale: fr })}
                                    </p>
                                </div>

                                {/* Dernière modification */}
                                {order.updatedAt && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-semibold text-muted-foreground">MODIFIÉ LE</p>
                                        </div>
                                        <p className="text-base font-medium">
                                            {format(new Date(order.updatedAt), "d MMMM yyyy", { locale: fr })}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(order.updatedAt), "HH:mm", { locale: fr })}
                                        </p>
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
                                <p className="text-sm text-muted-foreground">Poids Brut OT</p>
                                <p className="text-base font-medium">{Number(order.poidsBrutOT)} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Poids Net OT</p>
                                <p className="text-base font-medium">{Number(order.poidsNetOT)} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Volume OT</p>
                                <p className="text-base font-medium">{Number(order.volumeOT)} m³</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Quantité Colis</p>
                                <p className="text-base font-medium">{Number(order.nbrePaquetageOT)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {order.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-base text-muted-foreground leading-relaxed">{order.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Observation */}
                    {order.observation && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Observation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-base text-muted-foreground leading-relaxed">{order.observation}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Section pour les colisages */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Colisages
                            </CardTitle>
                            <ColisageImportPreview orderTransitId={orderId} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ColisageListForOrder orderTransitId={orderId} />
                    </CardContent>
                </Card>

                
            </div>
        </>
    );
};

export const TransitOrderIdLoadingView = () => {
    return (
        <LoadingState
            title="Chargement de l'ordre de transit"
            description="Ceci peut prendre quelques secondes."
        />
    );
};

export const TransitOrderIdErrorView = () => {
    return (
        <ErrorState
            title="Erreur lors du chargement de l'ordre de transit"
            description="Une erreur est survenue."
        />
    );
};
