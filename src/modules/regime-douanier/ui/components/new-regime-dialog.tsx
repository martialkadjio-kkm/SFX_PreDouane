import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { RegimeForm } from "./regime-form";





interface NewRegimeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewRegimeDialog = ({ open, onOpenChange }: NewRegimeDialogProps) => {

    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Regime"
            description="Creer un nouveau Regime"
            open={open}
            onOpenChange={onOpenChange}
        >
            <RegimeForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/regime-douanier/${id}`);
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    )
}