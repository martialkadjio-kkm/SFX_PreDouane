import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";

import { DevisesForm } from "./devises-form";

interface NewDevisesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export const NewDevisesDialog = ({ open, onOpenChange }: NewDevisesDialogProps) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Devise"
            description="Creer un nouveau Devise "
            open={open}
            onOpenChange={onOpenChange}
        >
            <DevisesForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/devises/${id}`);
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
}