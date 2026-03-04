import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TRegimeDouanierCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TRegimeDouanierCreate } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TRegimeDouanier as RegimePrisma } from "@/generated/prisma";
import { createRegimeDouanier, updateRegimeDouanier } from "../../server/actions";

interface RegimeFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: RegimePrisma;
}

export const RegimeForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: RegimeFormProps) => {
  const form = useForm<TRegimeDouanierCreate>({
    resolver: zodResolver(TRegimeDouanierCreateSchema),
    defaultValues: {
      code: initialValues?.code || "",
      libelle: initialValues?.libelle || "",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;
  const onSubmit = async (data: TRegimeDouanierCreate) => {
    if (isEdit) {
      try {
        const upadtedRegime = await updateRegimeDouanier(String(initialValues.id), data);
        if (upadtedRegime.success) {
          toast.success("Regime mis Ã  jour avec succÃ¨s");
          onSuccess?.(String(initialValues.id));
        }
      } catch (error) {
        toast.error("Erreur lors de la mise Ã  jour du Regime");
      }
    } else {
      try {
        const regime = await createRegimeDouanier(data);
        if (regime.success) {
          onSuccess?.(regime.data?.id?.toString());
          toast.success("Regime crÃ©Ã© avec succÃ¨s");
        }
      } catch (error) {
        toast.error("Erreur lors de la crÃ©ation du Regime");
      }
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Regime</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Code Regime" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="libelle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Libelle du  Regime</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Libelle du regime" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between gap-x-2">
            {onCancel && (
              <Button
                variant="ghost"
                disabled={isPending}
                type="button"
                onClick={onCancel}
              >
                Fermer
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Mettre Ã  jour le regime douanier" : "CrÃ©er le regime douanier"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

