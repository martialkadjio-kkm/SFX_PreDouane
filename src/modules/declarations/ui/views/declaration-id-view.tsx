"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Calendar } from "lucide-react";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { DeclarationIdViewHeader } from "../components/declaration-id-view-header";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteDeclaration } from "../../server/actions";
import { UpdateDeclarationDialog } from "../components/update-declaration-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DeclarationOrdersTransit } from "../components/declaration-orders-transit";

type DeclarationRecord = {
  id: string;
  orderTransitId: string;
  numeroDeclaration: string;
  statut?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

type OrderTransitRecord = {
  id: string | number;
  orderReference: string;
  typeDossierId?: string | number | null;
  observation?: string | null;
  statut?: string | null;
  createdAt?: string | Date | null;
};

interface Props {
  declarationId: string;
  declaration: DeclarationRecord;
  orders?: OrderTransitRecord[];
}

export const DeclarationIdView = ({ declarationId, declaration, orders = [] }: Props) => {
  const router = useRouter();

  const [updateDeclarationDialogOpen, setUpdateDeclarationDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Etes-vous sur?",
    `Voulez-vous vraiment supprimer la declaration "${declaration.numeroDeclaration}" ? Cette action est irreversible.`
  );

  const handleRemoveDeclaration = async () => {
    const ok = await confirmRemove();
    if (!ok) return;

    try {
      const res = await deleteDeclaration(declarationId);

      if (!res.success) {
        toast.error("Erreur lors de la suppression de la declaration.");
        return;
      }
      toast.success("Declaration supprimee avec succes.");
      router.push("/declaration");
    } catch {
      toast.error("Erreur lors de la suppression de la declaration.");
    }
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdateDeclarationDialog
        open={updateDeclarationDialogOpen}
        onOpenChange={setUpdateDeclarationDialogOpen}
        initialValues={{
          id: declaration.id,
          orderTransitId: declaration.orderTransitId,
          numeroDeclaration: declaration.numeroDeclaration,
        }}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        <DeclarationIdViewHeader
          declarationId={declarationId}
          declarationName={declaration.numeroDeclaration}
          onEdit={() => setUpdateDeclarationDialogOpen(true)}
          onRemove={handleRemoveDeclaration}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{declaration.numeroDeclaration}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />

              {declaration.statut && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Statut</h3>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Statut</p>
                        <p className="text-base">{declaration.statut}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
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
                  {declaration.createdAt
                    ? format(new Date(declaration.createdAt), "d MMMM yyyy a HH:mm", { locale: fr })
                    : "-"}
                </p>
              </div>

              {declaration.updatedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Derniere modification
                    </p>
                    <p className="text-sm mt-1">
                      {format(new Date(declaration.updatedAt), "d MMMM yyyy a HH:mm", { locale: fr })}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DeclarationOrdersTransit orders={orders} />
      </div>
    </>
  );
};

export const DeclarationIdLoadingView = () => {
  return (
    <LoadingState
      title="Chargement de la declaration"
      description="Ceci peut prendre quelques secondes."
    />
  );
};

export const DeclarationIdErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement de la declaration"
      description="Une erreur est survenue."
    />
  );
};
