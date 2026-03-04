import { ResponsiveDialog } from "@/components/responsive-dialog";
import { ColisageForm } from "./colisage-form";

interface UpdateColisageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: {
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
    };
}

export const UpdateColisageDialog = ({
    open,
    onOpenChange,
    initialValues,
}: UpdateColisageDialogProps) => {
    return (
        <ResponsiveDialog
            title="Modifier Colisage"
            description="Modifier les informations du colisage"
            open={open}
            onOpenChange={onOpenChange}
        >
            <ColisageForm
                initialValues={initialValues}
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
};
