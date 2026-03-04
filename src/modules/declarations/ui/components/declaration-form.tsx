"use client";

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
import { DeclarationCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DeclarationCreate } from "@/lib/validation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createDeclaration, updateDeclaration } from "../../server/actions";
import { getAllOrdersTransitForSelect } from "@/modules/declarations/server/actions";
import { toast } from "sonner";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

export type DeclarationFormInitialValues = {
  id?: string;
  orderTransitId?: string;
  numeroDeclaration?: string;
};

interface DeclarationFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: DeclarationFormInitialValues;
}

export const DeclarationForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: DeclarationFormProps) => {
  const [ordersTransit, setOrdersTransit] = useState<Array<{ id: string; orderReference: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ordersTransitRes = await getAllOrdersTransitForSelect();
        if (ordersTransitRes.success) {
          setOrdersTransit((ordersTransitRes.data || []).map((o: any) => ({ id: String(o.id), orderReference: String(o.orderReference) })));
        }
      } catch {
        toast.error("Erreur lors du chargement des donnees");
      }
    };

    loadData();
  }, []);

  const form = useForm<DeclarationCreate>({
    resolver: zodResolver(DeclarationCreateSchema),
    mode: "onChange",
    defaultValues: {
      orderTransitId: initialValues?.orderTransitId || "",
      numeroDeclaration: initialValues?.numeroDeclaration ?? "",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: DeclarationCreate) => {
    if (isEdit && initialValues?.id) {
      try {
        const updatedDeclaration = await updateDeclaration(initialValues.id, data);
        if (updatedDeclaration.success) {
          onSuccess?.(initialValues.id);
          toast.success("Declaration mise a jour avec succes");
        } else if (updatedDeclaration.error === "REFERENCE_EXISTS") {
          toast.error("Cette reference existe deja pour une autre declaration");
        } else {
          toast.error("Erreur lors de la mise a jour de la declaration");
        }
      } catch {
        toast.error("Erreur lors de la mise a jour de la declaration");
      }
      return;
    }

    try {
      const declaration = await createDeclaration(data);
      if (declaration.success) {
        onSuccess?.(declaration.data?.id);
        toast.success("Declaration creee avec succes");
      } else if (declaration.error === "REFERENCE_EXISTS") {
        toast.error("Une declaration avec cette reference existe deja");
      } else {
        toast.error("Erreur lors de la creation de la declaration");
      }
    } catch {
      toast.error("Erreur lors de la creation de la declaration");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="orderTransitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordre de Transit</FormLabel>
              <FormControl>
                <CommandSelect
                  options={ordersTransit.map((orderTransit) => ({
                    id: orderTransit.id,
                    value: orderTransit.id,
                    children: (
                      <div className="flex items-center gap-x-2">
                        <GeneratedAvatar
                          seed={orderTransit.orderReference}
                          variant="initials"
                          className="border size-6"
                        />
                        <span>{orderTransit.orderReference}</span>
                      </div>
                    ),
                  }))}
                  onSelect={field.onChange}
                  value={field.value}
                  placeholder="Selectionner l'ordre de transit"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="numeroDeclaration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero de Declaration*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="DE-2025-001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button variant="ghost" disabled={isPending} type="button" onClick={onCancel}>
              Fermer
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isEdit ? "Mettre a jour la declaration" : "Creer la declaration"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
