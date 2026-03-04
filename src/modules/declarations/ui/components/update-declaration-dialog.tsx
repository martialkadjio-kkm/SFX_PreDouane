import { ResponsiveDialog } from "@/components/responsive-dialog";

import { DeclarationForm, DeclarationFormInitialValues } from "./declaration-form";

interface UpdateDeclarationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: DeclarationFormInitialValues;
}

export const UpdateDeclarationDialog = ({
  open,
  onOpenChange,
  initialValues,
}: UpdateDeclarationDialogProps) => {
  return (
    <ResponsiveDialog
      title="Modifier la declaration"
      description="Modifiez les informations de la declaration ci-dessous."
      open={open}
      onOpenChange={onOpenChange}
    >
      <DeclarationForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
