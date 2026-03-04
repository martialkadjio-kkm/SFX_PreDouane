import { ResponsiveDialog } from "@/components/responsive-dialog";
import {Regime } from "@/generated/prisma";
import { RegimeForm } from "./regime-form";




interface UpdateRegimeDouanierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: Regime;
}

export const UpdateRegimeDouanierDialog = ({ open, onOpenChange, initialValues }: UpdateRegimeDouanierDialogProps) => {

    return (
        <ResponsiveDialog
            title="Modifier le Regime Douanier"
            description="Modifiez les informations du client ci-dessous."
            open={open}
            onOpenChange={onOpenChange}
        >
            <RegimeForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    )
}