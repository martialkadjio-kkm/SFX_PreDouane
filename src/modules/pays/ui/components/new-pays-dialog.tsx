import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";

import { PaysForm } from "./pays-form";

interface NewPaysDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export const NewPaysDialog = ({ open, onOpenChange }: NewPaysDialogProps) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Pays"
            description="Creer un nouveau Pays "
            open={open}
            onOpenChange={onOpenChange}
        >
            <PaysForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/pays/${id}`);
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
}