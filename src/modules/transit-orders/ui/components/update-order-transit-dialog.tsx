import { ResponsiveDialog } from "@/components/responsive-dialog";
import { OrderTransitForm } from "./order-transit-form";
import { OrderTransit } from "@/generated/prisma";

interface UpdateOrderTransitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: OrderTransit;
}

export const UpdateOrderTransitDialog = ({ open, onOpenChange, initialValues }: UpdateOrderTransitDialogProps) => {
    return (
        <ResponsiveDialog
            title="Modifier l'ordre de transit"
            description="Modifiez les informations de l'ordre de transit ci-dessous."
            open={open}
            onOpenChange={onOpenChange}
        >
            <OrderTransitForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    )
}
