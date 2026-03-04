import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";

import { SenseTraficForm } from "./sense-trafic-form";


interface NewSenseTraficDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export const NewSenseTraficDialog = ({ open, onOpenChange }: NewSenseTraficDialogProps) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Sense Trafic"
            description="Creer un nouveau Sense Trafic"
            open={open}
            onOpenChange={onOpenChange}
        >
            <SenseTraficForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.push(`/sense-trafic/${id}`);
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
}