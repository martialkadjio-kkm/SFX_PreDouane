"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CodeSquare, Edit, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { DevisesIdViewHeader } from "../components/devises-id-view-header";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteDevise } from "../../server/actions";
import { UpdateDevisesDialog } from "../components/update-devises-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeviseRecord = {
  idDevise: number;
  codeDevise: string;
  libelleDevise: string;
  decimales: number;
  dateCreation: Date | string;
  nomCreation: string | null;
};

interface Props {
  devisesId: string;
  devises: DeviseRecord;
}

export const DevisesIdView = ({ devisesId, devises }: Props) => {
  const router = useRouter();

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Etes-vous sur?",
    `Voulez-vous vraiment supprimer cette devise "${devises.codeDevise}" ? Cette action est irreversible.`
  );

  const handleRemoveDevises = async () => {
    const ok = await confirmRemove();
    if (!ok) return;

    try {
      const res = await deleteDevise(devisesId);

      if (!res.success) {
        toast.error("Erreur lors de la suppression de la devise.");
        return;
      }
      toast.success("Devise supprimee avec succes.");
      router.push("/devises");
    } catch {
      toast.error("Erreur lors de la suppression de la devise.");
    }
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdateDevisesDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        initialValues={{
          id: devises.idDevise.toString(),
          code: devises.codeDevise,
          libelle: devises.libelleDevise,
          decimal: devises.decimales,
        }}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        <DevisesIdViewHeader
          deviseId={devisesId}
          code={devises.codeDevise}
          onEdit={() => setIsUpdateDialogOpen(true)}
          onRemove={handleRemoveDevises}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{devises.codeDevise}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Information sur la devise</h3>
                <div className="space-y-3">
                  {devises.codeDevise && (
                    <div className="flex items-center gap-3">
                      <CodeSquare className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Code devise</p>
                        <span className="text-blue-600">{devises.codeDevise}</span>
                      </div>
                    </div>
                  )}
                  {devises.libelleDevise && (
                    <div className="flex items-center gap-3">
                      <Edit className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Libelle devise</p>
                        <span className="text-blue-600">{devises.libelleDevise}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de creation
                </p>
                <p className="text-sm mt-1">
                  {format(new Date(devises.dateCreation), "d MMMM yyyy a HH:mm", {
                    locale: fr,
                  })}
                </p>
              </div>

              {devises.nomCreation && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Cree par</p>
                    <p className="text-sm mt-1">{devises.nomCreation}</p>
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

export const DeviseLoadingView = () => {
  return (
    <LoadingState
      title="Chargement de la devise"
      description="Ceci peut prendre quelques secondes."
    />
  );
};

export const DeviseIdErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement de la devise"
      description="Une erreur est survenue."
    />
  );
};
