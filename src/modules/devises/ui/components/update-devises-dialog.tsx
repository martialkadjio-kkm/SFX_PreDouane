import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DevisesForm } from "./devises-form";

interface UpdateDevisesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    id: string;
    code: string;
    libelle: string;
    decimal: number;
  };
}

export const UpdateDevisesDialog = ({
  open,
  onOpenChange,
  initialValues,
}: UpdateDevisesDialogProps) => {
  return (
    <ResponsiveDialog
      title="Modifier la devise"
      description="Modifiez les informations de la devise ci-dessous."
      open={open}
      onOpenChange={onOpenChange}
    >
      <DevisesForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
