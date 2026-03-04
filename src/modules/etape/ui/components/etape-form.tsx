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
import { Switch } from "@/components/ui/switch";
import { EtapeCreateSchema } from "@/lib/validation"; 
import { zodResolver } from "@hookform/resolvers/zod";
import type { EtapeCreate } from "@/lib/validation"; 
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createEtape, updateEtape } from "../../server/actions"; 
import { Etape } from "@/generated/prisma";

interface EtapeFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: Etape;
}

export const EtapeForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: EtapeFormProps) => {
  const form = useForm<EtapeCreate>({
    resolver: zodResolver(EtapeCreateSchema),
    defaultValues: {
      code: initialValues?.code ?? "",
      libelle: initialValues?.libelle ?? "",
      ordre: initialValues?.ordre ?? 0,
      suiviDuree: initialValues?.suiviDuree ?? false,
      delai: initialValues?.delai ?? 0,
      circuit: initialValues?.circuit ?? "-",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: EtapeCreate) => {
    if (isEdit) {
      try {
        const updatedEtape = await updateEtape(String(initialValues.id), data);
        if (updatedEtape.success) {
          toast.success("Ã‰tape mise Ã  jour avec succÃ¨s");
          onSuccess?.(String(initialValues.id));
        }
      } catch (error) {
        toast.error("Erreur lors de la mise Ã  jour de l'Ã©tape");
      }
    } else {
      try {
        const etape = await createEtape(data);
        if (etape.success) {
          onSuccess?.(etape.data?.id?.toString());
          toast.success("Ã‰tape crÃ©Ã©e avec succÃ¨s");
        }
      } catch (error) {
        toast.error("Erreur lors de la crÃ©ation de l'Ã©tape");
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Code */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="EX : ET001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Libelle */}
        <FormField
          control={form.control}
          name="libelle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LibellÃ©*</FormLabel>
              <FormControl>
                <Input {...field} type="text" placeholder="Nom de l'Ã©tape" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ordre */}
        <FormField
          control={form.control}
          name="ordre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordre*</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="1" placeholder="1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Suivi durÃ©e */}
        <FormField
          control={form.control}
          name="suiviDuree"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suivi de durÃ©e ?</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DÃ©lai */}
        <FormField
          control={form.control}
          name="delai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DÃ©lai (en jours)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" placeholder="0" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Circuit */}
        <FormField
          control={form.control}
          name="circuit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Circuit</FormLabel>
              <FormControl>
                <Input {...field} placeholder="EX : Direction / Service / Etc" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions buttons */}
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
            {isEdit ? "Mettre Ã  jour l'Ã©tape" : "CrÃ©er l'Ã©tape"}
          </Button>
        </div>

      </form>
    </Form>
  );
};

