"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { EtapeIdViewHeader } from "../components/etape-id-view-header";
import { useConfirm } from "@/hooks/use-confirm";
import { Etape } from "@/generated/prisma";
import { deleteEtape } from "../../server/actions";
import { UpdateEtapeDialog } from "../components/update-etape-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  etapeId: string;
  etape: Etape;
}

export const EtapeIdView = ({ etapeId, etape }: Props) => {
  const router = useRouter();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "ÃŠtes-vous sÃ»r ?",
    `Voulez-vous vraiment supprimer l'Ã©tape "${etape.nom}" ? Cette action est irrÃ©versible.`
  );

  const handleRemoveEtape = async () => {
    const ok = await confirmRemove();
    if (!ok) return;

    try {
      const res = await deleteEtape(etapeId);

      if (!res.success) {
        toast.error("Erreur lors de la suppression de l'Ã©tape.");
        return;
      }
      toast.success("Ã‰tape supprimÃ©e avec succÃ¨s.");
      router.push("/etape");
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'Ã©tape.");
    }
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdateEtapeDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        initialValues={etape}
      />

      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        <EtapeIdViewHeader
          etapeId={etapeId}
          code={etape.nom}
          onEdit={() => setIsUpdateDialogOpen(true)}
          onRemove={handleRemoveEtape}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{etape.nom}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informations sur l'Ã©tape</h3>

                <div className="space-y-3">
                  {etape.nom && (
                    <div className="flex items-center gap-3">
                      <Edit className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Nom de l'Ã©tape</p>
                        <p className="font-medium">{etape.nom}</p>
                      </div>
                    </div>
                  )}

                  {etape.description && (
                    <div className="flex items-center gap-3">
                      <Edit className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="font-medium">{etape.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations secondaires */}
          <Card>
            <CardHeader>
              <CardTitle>DÃ©tails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de crÃ©ation
                </p>
                <p className="text-sm mt-1">
                  {format(new Date(etape.createdAt), "d MMMM yyyy Ã  HH:mm", { locale: fr })}
                </p>
              </div>

              {etape.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      DerniÃ¨re modification
                    </p>
                    <p className="text-sm mt-1">
                      {format(new Date(etape.updatedAt), "d MMMM yyyy Ã  HH:mm", { locale: fr })}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

// === Ã‰tats de chargement et erreur === //

export const EtapeIdLoadingView = () => {
  return (
    <LoadingState
      title="Chargement de l'Ã©tape"
      description="Ceci peut prendre quelques secondes."
    />
  );
};

export const EtapeIdErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement de l'Ã©tape"
      description="Une erreur est survenue."
    />
  );
};
