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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { createClient, updateClient } from "../../server/actions";
import { toast } from "sonner";

// Schema simplifié - seul le nom est requis
const ClientFormSchema = z.object({
  nom: z.string().min(1, "Le nom du client est requis"),
});

type ClientFormData = z.infer<typeof ClientFormSchema>;

interface ClientFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: { id: string; nomClient: string };
}

export const ClientForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: ClientFormProps) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: {
      nom: initialValues?.nomClient ?? "",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: ClientFormData) => {
    if (isEdit) {
      try {
        const updatedClient = await updateClient(initialValues.id, data);
        if (updatedClient.success) {
          toast.success("Client mis à jour avec succès");
          onSuccess?.(initialValues.id);
        } else {
          toast.error("Erreur lors de la mise à jour du client");
        }
      } catch (error) {
        toast.error("Erreur lors de la mise à jour du client");
      }
    } else {
      try {
        const client = await createClient(data);
        if (client.success) {
          onSuccess?.(client.data?.id.toString());
          toast.success("Client créé avec succès");
        } else {
          toast.error(client.error || "Erreur lors de la création du client");
        }
      } catch (error) {
        toast.error("Erreur lors de la création du client");
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du client*</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: ACME Corporation"
                  disabled={isPending}
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
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "En cours..." : isEdit ? "Mettre à jour" : "Créer le client"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
