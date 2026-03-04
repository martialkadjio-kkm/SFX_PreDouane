import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";

import { DeclarationForm } from "./declaration-form";

interface NewDeclarationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewDeclarationDialog = ({ open, onOpenChange }: NewDeclarationDialogProps) => {

    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouvelle déclaration"
            description="Créer un nouvelle déclaration"
            open={open}
            onOpenChange={onOpenChange}
        >
            <DeclarationForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/declaration/${id}`);
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    )
}