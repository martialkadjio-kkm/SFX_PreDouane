import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { ColisageForm } from "./colisage-form";

interface NewColisageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewColisageDialog = ({
    open,
    onOpenChange,
}: NewColisageDialogProps) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Colisage"
            description="Créer un nouveau colisage"
            open={open}
            onOpenChange={onOpenChange}
        >
            <ColisageForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/colisage/${id}`);
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
};
