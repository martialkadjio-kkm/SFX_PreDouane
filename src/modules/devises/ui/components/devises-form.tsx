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
import { TDevisesCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TDevisesCreate } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createDevise, updateDevise } from "../../server/actions";

type DeviseInitialValues = {
  id: string;
  code: string;
  libelle: string;
  decimal: number;
};

interface TDevisesFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: DeviseInitialValues;
}

export const DevisesForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: TDevisesFormProps) => {
  const form = useForm<TDevisesCreate>({
    resolver: zodResolver(TDevisesCreateSchema),
    defaultValues: {
      code: initialValues?.code ?? "",
      libelle: initialValues?.libelle ?? "",
      decimal: initialValues?.decimal ?? 2,
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: TDevisesCreate) => {
    if (isEdit && initialValues) {
      try {
        const updatedDevise = await updateDevise(initialValues.id, data);
        if (updatedDevise.success) {
          toast.success("Mise a jour de la devise avec succes");
          onSuccess?.(initialValues.id);
        }
      } catch {
        toast.error("Erreur lors de la mise a jour de la devise");
      }
      return;
    }

    try {
      const devise = await createDevise(data);
      if (devise.success) {
        onSuccess?.(devise.data?.id?.toString());
        toast.success("Devise creee avec succes");
      }
    } catch {
      toast.error("Erreur lors de la creation de la devise");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. XAF" />
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
              <FormLabel>Libelle*</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="Libelle" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="decimal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Decimal*</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  value={field.value ?? 2}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 2"
                />
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
            {isEdit ? "Mettre a jour la devise" : "Creer la devise"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
