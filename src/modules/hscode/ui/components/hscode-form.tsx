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
import { HscodeCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { HscodeCreate } from "@/lib/validation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createHSCode, updateHSCode } from "../../server/actions";

interface HscodeFormData {
  id?: string;
  code?: string;
  libelle?: string;
}

interface HscodeFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: HscodeFormData;
}


export const HscodeForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: HscodeFormProps) => {
  const form = useForm<HscodeCreate>({
    resolver: zodResolver(HscodeCreateSchema),
    defaultValues: {
      code: initialValues?.code ?? "",
      libelle: initialValues?.libelle ?? "",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;
  const onSubmit = async (data: HscodeCreate) => {
    if (isEdit && initialValues?.id) {
      try {
        const upadtedHscode = await updateHSCode(initialValues.id, data);
        if (upadtedHscode.success) {
          toast.success("Hscode mis Ã  jour avec succÃ¨s");
          onSuccess?.(initialValues.id);
        }
      } catch (error) {
        toast.error("Erreur lors de la mise Ã  jour du Hscode");
      }
    } else {
      try {
        const hscode = await createHSCode(data);
        if (hscode.success) {
          onSuccess?.(hscode.data?.id?.toString());
          toast.success("Hscode crÃ©Ã© avec succÃ¨s");
        }
      } catch (error) {
        toast.error("Erreur lors de la crÃ©ation du Hscode");
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
                <FormLabel>Code*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. 1234" />
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
              {isEdit ? "Mettre Ã  jour le Hscode" : "CrÃ©er le Hscode"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
