"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { useConfirm } from "@/hooks/use-confirm";
import { Regime } from "@/generated/prisma";
import { deleteRegimeDouanier } from "../../server/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegimeIdViewHeader } from "../components/regime-id-view-header";
import { UpdateRegimeDouanierDialog } from "../components/update-regime-dialog";
import { format } from "date-fns";

interface Props {
  regimeId: string;
  regime: Regime;
}

export const RegimeIdView = ({ regimeId, regime }: Props) => {
  const router = useRouter();

  const [updateRegimeDialogOpen, setUpdateRegimeDialogOpen] = useState(false);

  const [RemevoConfirmation, confirmRemove] = useConfirm(
    "Êtes-vous sûr?",
    `Voulez-vous vraiment supprimer le Regime "${regime.code}" ? Cette action est irréversible.`
  );

  const handleRemoveRegime = async () => {
    const ok = await confirmRemove();

    if (!ok) return;

    try {
      const res = await deleteRegimeDouanier(regimeId);

      if (!res.success) {
        toast.error("Erreur lors de la suppression du Regime.");
        return;
      }
      toast.success("Regime supprimé avec succès.");
      router.push("/regime-douanier");
    } catch (error) {
      toast.error("Erreur lors de la suppression du Regime.");
    }
  };

  return (
    <>
      <RemevoConfirmation />
      <UpdateRegimeDouanierDialog
        open={updateRegimeDialogOpen}
        onOpenChange={setUpdateRegimeDialogOpen}
        initialValues={regime}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        <RegimeIdViewHeader
          regimeId={regimeId}
          regimeCode={regime.code}
          onEdit={() => setUpdateRegimeDialogOpen(true)}
          onRemove={handleRemoveRegime}
        />

        <div className="grid grid-cols-1 max-w-[600px] gap-6">
          <Card>
            <CardContent className="flex flex-col">
              <div className="grid grid-cols-2 gap-3 ">
                <p>Code : {regime.code}</p>
                <p>Libelle : {regime.libelle}</p>
                <p>
                  Cree le : {format(new Date(regime.createdAt), "dd MMM yyyy")}
                </p>
                <p>
                  Modifie le :{" "}
                  {format(new Date(regime.updatedAt), "dd MMM yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export const RegimeIdLoadingView = () => {
  return (
    <LoadingState
      title="Chargement du Regime"
      description="Ceci peut prendre quelques secondes."
    />
  );
};

export const RegimeIdErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement du Regime"
      description="Une erreur est survenue."
    />
  );
};
