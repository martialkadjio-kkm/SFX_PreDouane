import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PaysForm, PaysFormInitialValues } from "./pays-form";

interface UpdatePaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: PaysFormInitialValues;
}

export const UpdatePaysDialog = ({
  open,
  onOpenChange,
  initialValues,
}: UpdatePaysDialogProps) => {
  return (
    <ResponsiveDialog
      title="Modifier le Pays"
      description="Modifiez les informations du Pays ci-dessous."
      open={open}
      onOpenChange={onOpenChange}
    >
      <PaysForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
