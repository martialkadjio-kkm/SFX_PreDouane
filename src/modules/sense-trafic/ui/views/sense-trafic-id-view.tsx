"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone,CodeSquare,Edit, MapPin, Globe, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { SenseTraficIdViewHeader } from "../components/sense-trafic-id-view-header";
import { useConfirm } from "@/hooks/use-confirm";
import { TSensTrafic } from "@/generated/prisma";
import { deleteSensTrafic } from "../../server/actions";
import { UpdateSenseTraficDialog } from "../components/update-sense-trafic-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  senseTraficId: string;
  senseTrafic: TSensTrafic;
}

export const SenseTraficIdView = ({ senseTraficId, senseTrafic }: Props) => {
  const router = useRouter();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Êtes-vous sûr?",
    `Voulez-vous vraiment supprimer ce sense trafic "${senseTrafic.libelle}" ? Cette action est irréversible.`
  );
  const handleRemoveSenseTrafic = async () => {
    const ok = await confirmRemove();

    if (!ok) return;

    try {
      const res = await deleteSensTrafic(senseTraficId);

      if (!res.success) {
        toast.error("Erreur lors de la suppression du sense trafic.");
        return;
      }
      toast.success("Sense trafic supprimé avec succès.");
      router.push("/sense-trafic");
    } catch (error) {
      toast.error("Erreur lors de la suppression du sense trafic.");
    }
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdateSenseTraficDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        initialValues={senseTrafic}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        <SenseTraficIdViewHeader
          senseTraficId={senseTraficId}
          libelle={senseTrafic.libelle}
          onEdit={() => setIsUpdateDialogOpen(true)}
          onRemove={handleRemoveSenseTrafic}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{senseTrafic.libelle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Information sur Sense Trafic
                </h3>
                <div className="space-y-3">
                  {senseTrafic.libelle && (
                    <div className="flex items-center gap-3">
                      <CodeSquare className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Sense Trafic Libelle
                        </p>
                        <a
                          href={`tel:${senseTrafic.libelle}`}
                          className="text-blue-600 hover:underline"
                        >
                          {senseTrafic.libelle}
                        </a>
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
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de création
                </p>
                <p className="text-sm mt-1">
                  {format(new Date(senseTrafic.createdAt), "d MMMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </p>
              </div>

              {senseTrafic.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dernière modification
                    </p>
                    <p className="text-sm mt-1">
                      {format(
                        new Date(senseTrafic.updatedAt),
                        "d MMMM yyyy à HH:mm",
                        { locale: fr }
                      )}
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

export const SenseTraficIdLoadingView = () => {
  return (
    <LoadingState
      title="Chargement du sense trafic"
      description="Ceci peut prendre quelques secondes."
    />
  );
};

export const SenseTraficIdErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement du sense trafic"
      description="Une erreur est survenue."
    />
  );
};
