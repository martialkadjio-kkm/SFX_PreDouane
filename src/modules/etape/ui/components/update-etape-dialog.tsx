import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Etape } from "@/generated/prisma"; 
import { EtapeForm } from "./etape-form";   

interface UpdateEtapeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: Etape;
}

export const UpdateEtapeDialog = ({ open, onOpenChange, initialValues }: UpdateEtapeDialogProps) => {

    return (
        <ResponsiveDialog
            title="Modifier l'étape"
            description="Modifiez les informations de l'étape ci-dessous."
            open={open}
            onOpenChange={onOpenChange}
        >
            <EtapeForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    );
};
