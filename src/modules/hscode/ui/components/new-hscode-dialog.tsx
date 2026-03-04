import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";

import { HscodeForm } from "./hscode-form";



interface NewHscodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export const NewHscodeDialog = ({ open, onOpenChange }: NewHscodeDialogProps) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Hscode"
            description="Creer un nouveau Hscode"
            open={open}
            onOpenChange={onOpenChange}
        >
            <HscodeForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/hscode/${id}`);
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
}
