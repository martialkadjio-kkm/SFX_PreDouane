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
import { TPaysCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TPaysCreate } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createPays, updatePays } from "../../server/actions";

export type PaysFormInitialValues = {
  id: string;
  code: string;
  libelle: string;
};

interface TPaysFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: PaysFormInitialValues;
}

export const PaysForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: TPaysFormProps) => {
  const form = useForm<TPaysCreate>({
    resolver: zodResolver(TPaysCreateSchema),
    defaultValues: {
      code: initialValues?.code ?? "",
      libelle: initialValues?.libelle ?? "",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: TPaysCreate) => {
    if (isEdit && initialValues) {
      try {
        const updatedPays = await updatePays(initialValues.id, data);
        if (updatedPays.success) {
          toast.success("Mise a jour du pays avec succes");
          onSuccess?.(initialValues.id);
        }
      } catch {
        toast.error("Erreur lors de la mise a jour du pays");
      }
      return;
    }

    try {
      const pays = await createPays(data);
      if (pays.success) {
        onSuccess?.(pays.data?.id?.toString());
        toast.success("Pays cree avec succes");
      }
    } catch {
      toast.error("Erreur lors de la creation du pays");
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
                <Input {...field} placeholder="e.g. CM" />
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
                <Input {...field} type="text" placeholder="e.g Cameroun" />
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
            {isEdit ? "Mettre a jour le Pays" : "Creer le Pays"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
