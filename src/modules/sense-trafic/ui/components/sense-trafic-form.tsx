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
import { TSensTraficCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TSensTraficCreate } from "@/lib/validation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createSensTrafic, updateSensTrafic } from "../../server/actions";
import { TSensTrafic } from "@/generated/prisma";


interface SenseTraficFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: TSensTrafic;
}

export const SenseTraficForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: SenseTraficFormProps) => {
  const form = useForm<TSensTraficCreate>({
    resolver: zodResolver(TSensTraficCreateSchema),
    defaultValues: {
      libelle: initialValues?.libelle ?? "",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;
  const onSubmit = async (data: TSensTraficCreate) => {
    if (isEdit) {
      try {
        const upadtedSenseTrafic = await updateSensTrafic(String(initialValues.id), data);
        if (upadtedSenseTrafic.success) {
          toast.success("SensTrafic mis Ã  jour avec succÃ¨s");
          onSuccess?.(String(initialValues.id));
        }
      } catch (error) {
        toast.error("Erreur lors de la mise Ã  jour du SensTrafic");
      }
    } else {
      try {
        const sensTrafic = await createSensTrafic(data);
        if (sensTrafic.success) {
          onSuccess?.(sensTrafic.data?.id?.toString());
          toast.success("SensTrafic crÃ©Ã© avec succÃ¨s");
        }
      } catch (error) {
        toast.error("Erreur lors de la crÃ©ation du SensTrafic");
      }
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              {isEdit ? "Mettre Ã  jour le SensTrafic" : "CrÃ©er le SensTrafic"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
