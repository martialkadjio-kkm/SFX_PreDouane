"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Package, Truck, User, Building2, MapPin, FileText } from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteDossier, annulerDossier } from "../../server/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DossierIdHeader } from "../components/dossier-id-header";
import { UpdateDossierDialog } from "../components/update-dossier-dialog";
import { UpdatePeseeDialog } from "../components/update-pesee-dialog";
import { ColisageImportForDossier } from "../components/colisage-import-for-dossier";
import { ColisageListForDossier } from "../components/colisage-list-for-dossier";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteDetailView } from "../components/note-detail-view";

interface Props {
    dossierId: string;
    dossier: any;
}

export const DossierIdView = ({ dossierId, dossier }: Props) => {
    const router = useRouter();
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [updatePeseeDialogOpen, setUpdatePeseeDialogOpen] = useState(false);
    const [regimeRatioPopupOpen, setRegimeRatioPopupOpen] = useState(false);

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Êtes-vous sûr?",
        `Voulez-vous vraiment supprimer le dossier "${dossier.noDossier || dossier.noOT}" ? Cette action est irréversible.`
    );

    const [CancelConfirmation, confirmCancel] = useConfirm(
        "Annuler le dossier?",
        `Voulez-vous vraiment annuler le dossier "${dossier.noDossier || dossier.noOT}" ? Le dossier sera marqué comme annulé.`
    );

    const handleRemoveDossier = async () => {
        const ok = await confirmRemove();

        if (!ok) return;

        try {
            const res = await deleteDossier(dossierId);

        
            if (!res.success) {
                toast.error("Ce dossier ne peut pas être supprimé car il est lié à d'autres enregistrements.");
                return;
            }
            toast.success("Dossier supprimé avec succès.");
            router.push("/dossiers");
        } catch (error) {
            toast.error("Erreur lors de la suppression du dossier.");
        }
    };

    const handleCancelDossier = async () => {
        const ok = await confirmCancel();

        if (!ok) return;

        try {
            const res = await annulerDossier(dossierId);

            if (!res.success) {
                toast.error(res.error || "Erreur lors de l'annulation du dossier.");
                return;
            }
            toast.success("Dossier annulé avec succès.");
            router.refresh();
        } catch (error) {
            toast.error("Erreur lors de l'annulation du dossier.");
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "Ouvert": "bg-blue-100 text-blue-800",
            "En cours": "bg-yellow-100 text-yellow-800",
            "Clôturé": "bg-green-100 text-green-800",
            "Annulé": "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getCardColorByStatus = (status: string) => {
        const statusLower = status.toLowerCase();
        
        // Operations in progress - Orange
        if (statusLower.includes("en cours") || statusLower.includes("in progress") || statusLower.includes("ouvert")) {
            return {
                border: "border-orange-500",
                header: "bg-orange-50 dark:bg-orange-950/30",
                badge: "bg-orange-500 text-white dark:bg-orange-600"
            };
        }
        
        // Operations completed - Green
        if (statusLower.includes("clôturé") || statusLower.includes("completed") || statusLower.includes("terminé")) {
            return {
                border: "border-green-500",
                header: "bg-green-50 dark:bg-green-950/30",
                badge: "bg-green-600 text-white dark:bg-green-700"
            };
        }
        
        // File Cancelled - Red
        if (statusLower.includes("annulé") || statusLower.includes("cancelled") || statusLower.includes("canceled")) {
            return {
                border: "border-red-500",
                header: "bg-red-50 dark:bg-red-950/30",
                badge: "bg-red-600 text-white dark:bg-red-700"
            };
        }
        
        // Default - Gray
        return {
            border: "border-gray-300",
            header: "bg-gray-50 dark:bg-gray-950/30",
            badge: "bg-gray-600 text-white dark:bg-gray-700"
        };
    };

    const cardColors = getCardColorByStatus(dossier.libelleStatutDossier);

    // Le dossier peut être annulé seulement s'il est en cours (statut = 0)
    const canCancel = dossier.idStatutDossier === 0;

    return (
        <>
            <RemoveConfirmation />
            <CancelConfirmation />
            <UpdateDossierDialog
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
                initialValues={dossier}
            />
            <UpdatePeseeDialog
                open={updatePeseeDialogOpen}
                onOpenChange={setUpdatePeseeDialogOpen}
                dossierId={dossierId}
                initialValues={{
                    nbrePaquetagePesee: dossier.Nbre_Paquetage_Pesee,
                    poidsBrutPesee: dossier.poidsBrutPesee,
                    poidsNetPesee: dossier.poidsNetPesee,
                    volumePesee: dossier.volumePesee,
                }}
            />
            <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
                <DossierIdHeader
                    dossierId={dossierId}
                    dossierReference={dossier.noDossier || dossier.noOT || `Dossier #${dossierId}`}
                    onEdit={() => setUpdateDialogOpen(true)}
                    onRemove={handleRemoveDossier}
                    onUpdatePesee={() => setUpdatePeseeDialogOpen(true)}
                    onCancel={handleCancelDossier}
                    canCancel={canCancel}
                />

                {/* Carte principale avec statut */}
                <Card className="border-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-3xl font-bold">
                                    {dossier.noDossier || "N/A"}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    N° OT: {dossier.noOT || "N/A"}
                                </p>
                            </div>
                            <Badge className={`${cardColors.badge} text-sm px-3 py-1 font-semibold border-0`}>
                                {dossier.libelleStatutDossier}
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
                                    <p className="text-lg font-semibold">{dossier.nomClient || "N/A"}</p>
                                </div>

                                {/* Type et Sens */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">TYPE / SENS</p>
                                    </div>
                                    <p className="text-base font-medium">{dossier.libelleTypeDossier}</p>
                                    <p className="text-sm text-muted-foreground">{dossier.libelleSensTrafic}</p>
                                </div>

                                {/* Mode de transport */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">MODE DE TRANSPORT</p>
                                    </div>
                                    <Badge variant="outline" className="text-base">
                                        {dossier.libelleModeTransport}
                                    </Badge>
                                </div>
                            </div>

                            {/* Colonne droite - Dates et infos */}
                            <div className="space-y-6">
                                {/* Responsable */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">RESPONSABLE</p>
                                    </div>
                                    <Badge variant="outline" className="text-base">
                                        {dossier.nomResponsable}
                                    </Badge>
                                </div>

                                {/* Étape actuelle */}
                                {dossier.libelleEtapeActuelle && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-semibold text-muted-foreground">ÉTAPE ACTUELLE</p>
                                        </div>
                                        <Badge variant="secondary" className="text-base">
                                            {dossier.libelleEtapeActuelle}
                                        </Badge>
                                    </div>
                                )}

                                {/* Date de création */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">CRÉÉ LE</p>
                                    </div>
                                    <p className="text-base font-medium">
                                        {dossier.dateCreation ? format(new Date(dossier.dateCreation), "d MMMM yyyy", { locale: fr }) : "Date non disponible"}
                                    </p>
                                </div>

                                {/* Date d'ouverture */}
                                {dossier.dateOuvertureDossier && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-semibold text-muted-foreground">OUVERT LE</p>
                                        </div>
                                        <p className="text-base font-medium">
                                            {format(new Date(dossier.dateOuvertureDossier!), "d MMMM yyyy", { locale: fr })}
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
                        <CardTitle className="text-lg">Informations sur la Pesée</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nbre de paquetages Pesée</p>
                                <p className="text-base font-medium">{dossier.Nbre_Paquetage_Pesee || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Poids Brut Pesée (kg)</p>
                                <p className="text-base font-medium">{Number(dossier.poidsBrutPesee || 0)} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Poids Net Pesée (kg)</p>
                                <p className="text-base font-medium">{Number(dossier.poidsNetPesee || 0)} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Volume Pesée (m³)</p>
                                <p className="text-base font-medium">{Number(dossier.volumePesee || 0)} m³</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                {dossier.descriptionDossier && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                {dossier.descriptionDossier}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Onglets Colisages et Note de Détails */}
                <Card>
                    <Tabs defaultValue="colisages" className="w-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between w-full">
                                <TabsList className="grid w-full max-w-md grid-cols-2">
                                    <TabsTrigger value="colisages" className="flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Colisages
                                    </TabsTrigger>
                                    <TabsTrigger value="note-details" className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Note de Détails
                                    </TabsTrigger>
                                </TabsList>
                                
                                {/* Carte Regime_Ratio - largeur réduite à l'extrême droite */}
                                <div className="w-[32%]">
                                    <Card className="bg-green-50 border-green-200">
                                        <CardContent className="px-3 pt-1 pb-2">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-black text-sm">Format remplissage Regime_Ratio</h3>
                                                    <Dialog open={regimeRatioPopupOpen} onOpenChange={setRegimeRatioPopupOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" className="text-xs">
                                                                Voir Exemples
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl! w-[90vw]!">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-black text-center">Comment remplir la colonne Regime_Ratio ?</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                {/* Scénario 1 */}
                                                                <Card className="bg-green-50 border-green-200 w-full">
                                                                    <CardContent className="p-6">
                                                                        <h4 className="font-semibold mb-3 text-black">Scénario 1:</h4>
                                                                        <p className="mb-2 text-black">Si ligne 3 et 10 en <strong>DC 100%</strong>, ligne 4 en <strong>EXO</strong>, ligne 5 en <strong>TTC</strong>, le reste <strong>TR5% 100%</strong> signifie que:</p>
                                                                        <ul className="space-y-1 text-black">
                                                                            <li className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                                                Ligne 3 et 10 : <strong>1 (100% DC)</strong>
                                                                            </li>
                                                                            <li className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                                                Ligne 4 : <strong>0 (EXO)</strong>
                                                                            </li>
                                                                            <li className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                                                Ligne 5 : <strong>-2 (TTC)</strong>
                                                                            </li>
                                                                            <li className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                                                Le reste de ligne : <strong>-1 (100%TR)</strong>
                                                                            </li>
                                                                        </ul>
                                                                    </CardContent>
                                                                </Card>

                                                                {/* Scénario 2 */}
                                                                <Card className="bg-green-50 border-green-200 w-full">
                                                                    <CardContent className="p-6">
                                                                        <h4 className="font-semibold mb-3 text-black">Scénario 2:</h4>
                                                                        <p className="mb-2 text-black text-justify">Si ligne 5 en <strong>DC 100%</strong> le reste en <strong>ratio 48.51 TR 5%</strong> et <strong>51.49% DC</strong> signifie que:</p>
                                                                        <ul className="space-y-1 text-black">
                                                                            <li className="flex items-start gap-2">
                                                                                <div className="w-2 h-2 bg-green-600 rounded-full shrink-0 mt-1.5"></div>
                                                                                <span className="text-justify">Ligne 5 : <strong>1 (100% DC)</strong></span>
                                                                            </li>
                                                                            <li className="flex items-start gap-2">
                                                                                <div className="w-2 h-2 bg-green-600 rounded-full shrink-0 mt-1.5"></div>
                                                                                <span className="text-justify">Dans le reste des lignes renseigner uniquement le <strong>ratio DC</strong> en <strong>décimale</strong>, le <strong>ratio TR</strong> sera <strong>calculer automatiquement</strong> en fonction de ce dernier. On aura donc : <strong>0.5149</strong> dans le reste des lignes</span>
                                                                            </li>
                                                                        </ul>
                                                                    </CardContent>
                                                                </Card>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-black">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                        <strong>0</strong> pour <strong>EXO</strong>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                        <strong>1</strong> pour <strong>100% DC</strong>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                        <strong>-1</strong> pour <strong>100% TR</strong>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-600 rounded-full shrink-0"></div>
                                                        <strong>-2</strong> pour <strong>TTC</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <TabsContent value="colisages" className="mt-0">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Gérez les colisages de ce dossier
                                        </p>
                                        <ColisageImportForDossier dossierId={dossier.idDossier} />
                                    </div>
                                    <ColisageListForDossier dossierId={dossier.idDossier} />
                                </div>
                            </TabsContent>

                            <TabsContent value="note-details" className="mt-0">
                                <NoteDetailView 
                                    dossierId={dossier.idDossier} 
                                    entiteId={dossier.idEntite}
                                    dossierName={dossier.noDossier}
                                />
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
        </>
    );
};

export const DossierIdLoadingView = () => {
    return (
        <LoadingState
            title="Chargement du dossier"
            description="Ceci peut prendre quelques secondes."
        />
    );
};

export const DossierIdErrorView = () => {
    return (
        <ErrorState
            title="Erreur lors du chargement du dossier"
            description="Une erreur est survenue."
        />
    );
};
