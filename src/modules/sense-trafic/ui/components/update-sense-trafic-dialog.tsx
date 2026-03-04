import { ResponsiveDialog } from "@/components/responsive-dialog";
import { TSensTrafic } from "@/generated/prisma";
import { SenseTraficForm } from "./sense-trafic-form";

interface UpdateSenseTraficDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: TSensTrafic;
}

export const UpdateSenseTraficDialog = ({ open, onOpenChange, initialValues }: UpdateSenseTraficDialogProps) => {

    return (
        <ResponsiveDialog
            title="Modifier le Sense Trafic"
            description="Modifiez les informations du Sense Trafic ci-dessous."
            open={open}
            onOpenChange={onOpenChange}
        >
            <SenseTraficForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    )
}