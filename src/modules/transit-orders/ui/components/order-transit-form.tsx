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
import { Textarea } from "@/components/ui/textarea";
import { OrderTransitCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { OrderTransitCreate } from "@/lib/validation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createOrderTransit,
  updateOrderTransit,
  getAllClientsForSelect,
} from "../../server/actions";
import { getAllDevisesForSelect } from "@/modules/devises/server/actions";
import { getAllCountriesFromAPI } from "@/modules/pays/server/actions";
import { toast } from "sonner";
import { OrderTransit } from "@/generated/prisma";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface OrderTransitFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: OrderTransit;
}

export const OrderTransitForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: OrderTransitFormProps) => {
  const [clients, setClients] = useState<Array<{ id: string; nom: string }>>(
    []
  );
  const [devises, setDevises] = useState<Array<{ id: string; libelle: string; code: string }>>(
    []
  );
  const [pays, setPays] = useState<Array<{ id: string; libelle: string; code: string }>>(
    []
  );
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingDevises, setIsLoadingDevises] = useState(true);
  const [isLoadingPays, setIsLoadingPays] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, devisesRes, paysRes] = await Promise.all([
          getAllClientsForSelect(),
          getAllDevisesForSelect(),
          getAllCountriesFromAPI(),
        ]);

        if (clientsRes.success) {
          setClients(clientsRes.data || []);
        }
        if (devisesRes.success) {
          setDevises(devisesRes.data || []);
        }
        if (paysRes.success) {
          setPays(paysRes.data || []);
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoadingClients(false);
        setIsLoadingDevises(false);
        setIsLoadingPays(false);
      }
    };

    loadData();
  }, []);

  const form = useForm<OrderTransitCreate>({
    resolver: zodResolver(OrderTransitCreateSchema),
    mode: "onChange",
    defaultValues: {
      clientId: initialValues?.clientId || "",
      typeDossierId: initialValues?.typeDossierId || "",
      orderReference: initialValues?.orderReference || "",
      description: initialValues?.description || "",
      numeroOT: initialValues?.numeroOT || "",
      nbrePaquetageOT: initialValues?.nbrePaquetageOT ? Number(initialValues.nbrePaquetageOT) : undefined,
      poidsBrutOT: initialValues?.poidsBrutOT ? Number(initialValues.poidsBrutOT) : undefined,
      poidsNetOT: initialValues?.poidsNetOT ? Number(initialValues.poidsNetOT) : undefined,
      volumeOT: initialValues?.volumeOT ? Number(initialValues.volumeOT) : undefined,
      observation: initialValues?.observation || "",
      statut: initialValues?.statut || "En attente",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: OrderTransitCreate) => {
    console.log("Form submitted with data:", data);

    if (isEdit) {
      try {
        const updatedOrder = await updateOrderTransit(initialValues.id, data);
        if (updatedOrder.success) {
          onSuccess?.(initialValues.id);
          toast.success("Ordre de transit mis à jour avec succès");
        } else {
          if (updatedOrder.error === "REFERENCE_EXISTS") {
            toast.error(
              "Cette référence existe déjà pour un autre ordre de transit"
            );
          } else {
            toast.error("Erreur lors de la mise à jour de l'ordre de transit");
          }
        }
      } catch (error) {
        console.error("Update error:", error);
        toast.error("Erreur lors de la mise à jour de l'ordre de transit");
      }
    } else {
      try {
        const order = await createOrderTransit(data);
        console.log("Create response:", order);
        if (order.success) {
          onSuccess?.(order.data?.id);
          toast.success("Ordre de transit créé avec succès");
        } else {
          console.error("Create error:", order.error);
          if (order.error === "REFERENCE_EXISTS") {
            toast.error("Un ordre de transit avec cette référence existe déjà");
          } else {
            toast.error("Erreur lors de la création de l'ordre de transit");
          }
        }
      } catch (error) {
        console.error("Create exception:", error);
        toast.error("Erreur lors de la création de l'ordre de transit");
      }
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <FormControl>
                  <CommandSelect
                    options={clients.map((client) => ({
                      id: client.id,
                      value: client.id,
                      children: (
                        <div className="flex items-center gap-x-2">
                          <GeneratedAvatar
                            seed={client.nom}
                            variant="initials"
                            className="border  size-6"
                          />
                          <span>{client.nom}</span>
                        </div>
                      ),
                    }))}
                    onSelect={field.onChange}
                    value={field.value}
                    placeholder="Sélectionner le client"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="orderReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence de l'Ordre de Transit*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. OT-2024-001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroOT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro OT*</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. OT-2024-001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="statut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. En attente, En cours, Complété" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Description de l'ordre de transit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nbrePaquetageOT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de paquets</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="poidsBrutOT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poids Brut (kg)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="poidsNetOT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poids Net (kg)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="volumeOT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume (m³)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="observation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observation</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Observations supplémentaires"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between gap-x-2">
            {onCancel && (
              <Button
                variant="secondary"
                disabled={isPending}
                type="button"
                onClick={onCancel}
              >
                Fermer
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Mettre à jour l'ordre" : "Créer l'ordre"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
