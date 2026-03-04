import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/responsive-dialog";

import { EtapeForm } from "./etape-form"; 

interface NewEtapeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewEtapeDialog = ({ open, onOpenChange }: NewEtapeDialogProps) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouvelle étape"
            description="Créer une nouvelle étape"
            open={open}
            onOpenChange={onOpenChange}
        >
            <EtapeForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/etape/${id}`); 
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
};
