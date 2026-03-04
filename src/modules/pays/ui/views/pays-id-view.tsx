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
import { PaysIdViewHeader } from "../components/pays-id-view-header";
import { useConfirm } from "@/hooks/use-confirm";
import { deletePays } from "../../server/actions";
import { UpdatePaysDialog } from "../components/update-pays-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VPaysDetails = {
  idPays: number;
  codePays: string;
  libellePays: string;
  deviseLocale: string;
  dateCreation: Date | string;
  nomCreation: string | null;
};

interface Props {
  paysId: string;
  pays: VPaysDetails;
}

export const PaysIdView = ({ paysId, pays }: Props) => {
  const router = useRouter();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Etes-vous sur?",
    `Voulez-vous vraiment supprimer ce pays "${pays.codePays}" ? Cette action est irreversible.`
  );

  const handleRemovePays = async () => {
    const ok = await confirmRemove();
    if (!ok) return;

    try {
      const res = await deletePays(paysId);
      if (!res.success) {
        toast.error("Erreur lors de la suppression du pays.");
        return;
      }
      toast.success("Pays supprime avec succes.");
      router.push("/pays");
    } catch {
      toast.error("Erreur lors de la suppression du pays.");
    }
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdatePaysDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        initialValues={{
          id: pays.idPays.toString(),
          code: pays.codePays,
          libelle: pays.libellePays,
        }}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        <PaysIdViewHeader
          paysId={paysId}
          code={pays.codePays}
          onEdit={() => setIsUpdateDialogOpen(true)}
          onRemove={handleRemovePays}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{pays.codePays}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Information sur Pays</h3>
                <div className="space-y-3">
                  {pays.codePays && (
                    <div className="flex items-center gap-3">
                      <CodeSquare className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Code Pays</p>
                        <span className="text-blue-600">{pays.codePays}</span>
                      </div>
                    </div>
                  )}
                  {pays.libellePays && (
                    <div className="flex items-center gap-3">
                      <Edit className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Libelle du pays</p>
                        <span className="text-blue-600">{pays.libellePays}</span>
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
                  {format(new Date(pays.dateCreation), "d MMMM yyyy a HH:mm", {
                    locale: fr,
                  })}
                </p>
              </div>

              {pays.nomCreation && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Cree par</p>
                    <p className="text-sm mt-1">{pays.nomCreation}</p>
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

export const PaysLoadingView = () => {
  return (
    <LoadingState
      title="Chargement des pays"
      description="Ceci peut prendre quelques secondes."
    />
  );
};

export const PaysIdErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement des pays"
      description="Une erreur est survenue."
    />
  );
};
