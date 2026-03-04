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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createColisage, updateColisage } from "../../server/actions";
import { useEffect, useState } from "react";
import { CommandSelect } from "@/components/command-select";
import {
  getAllDossiersForSelect,
  getAllHscodesForSelect,
  getAllDevisesForSelect,
  getAllPaysForSelect,
  getAllRegimeDeclarationsForSelect,
} from "../../server/actions";
import { ColisageCreate, ColisageCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";

type SelectPays = {
  id: string | number;
  code: string;
  libelle: string;
  flag?: string;
};

interface ColisageFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    description: string;
    numeroCommande?: string | null;
    nomFournisseur?: string | null;
    numeroFacture?: string | null;
    quantite: number;
    prixUnitaireColis: number;
    poidsBrut: number;
    poidsNet: number;
    volume: number;
    regroupementClient?: string | null;
    orderTransitId?: string;
    hscodeId?: string | null;
    deviseId?: string;
    paysOrigineId?: string;
    regimeDeclarationId?: string | null;
  };
}

export const ColisageForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: ColisageFormProps) => {
  const [orderTransits, setOrderTransits] = useState<any[]>([]);
  const [hscodes, setHscodes] = useState<any[]>([]);
  const [devises, setDevises] = useState<any[]>([]);
  const [pays, setPays] = useState<SelectPays[]>([]);
  const [regimes, setRegimes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ColisageCreate>({
    resolver: zodResolver(ColisageCreateSchema),
    defaultValues: {
      description: initialValues?.description ?? "",
      numeroCommande: initialValues?.numeroCommande ?? undefined,
      nomFournisseur: initialValues?.nomFournisseur ?? undefined,
      numeroFacture: initialValues?.numeroFacture ?? undefined,
      quantite: initialValues?.quantite ?? 1,
      prixUnitaireColis: initialValues?.prixUnitaireColis ?? 0,
      poidsBrut: initialValues?.poidsBrut ?? 0,
      poidsNet: initialValues?.poidsNet ?? 0,
      volume: initialValues?.volume ?? 0,
      regroupementClient: initialValues?.regroupementClient ?? undefined,
      orderTransitId: initialValues?.orderTransitId ?? undefined,
      hscodeId: initialValues?.hscodeId ?? undefined,
      deviseId: initialValues?.deviseId ?? undefined,
      paysOrigineId: initialValues?.paysOrigineId ?? undefined,
      regimeDeclarationId: initialValues?.regimeDeclarationId ?? undefined,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, hscodesRes, devisesRes, paysRes, regimesRes] =
          await Promise.all([
            getAllDossiersForSelect(),
            getAllHscodesForSelect(),
            getAllDevisesForSelect(),
            getAllPaysForSelect(),
            getAllRegimeDeclarationsForSelect(),
          ]);

        if (ordersRes.success) setOrderTransits(ordersRes.data || []);
        if (hscodesRes.success) setHscodes(hscodesRes.data || []);
        if (devisesRes.success) setDevises(devisesRes.data || []);
        if (paysRes.success) setPays((paysRes.data as SelectPays[]) || []);
        if (regimesRes.success) setRegimes(regimesRes.data || []);
      } catch (error) {
        console.error("Erreur chargement:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Mettre à jour les valeurs du formulaire quand les données initiales changent
  useEffect(() => {
    if (initialValues && !isLoading) {
      form.reset({
        description: initialValues.description ?? "",
        numeroCommande: initialValues.numeroCommande ?? undefined,
        nomFournisseur: initialValues.nomFournisseur ?? undefined,
        numeroFacture: initialValues.numeroFacture ?? undefined,
        quantite: initialValues.quantite ?? 1,
        prixUnitaireColis: initialValues.prixUnitaireColis ?? 0,
        poidsBrut: initialValues.poidsBrut ?? 0,
        poidsNet: initialValues.poidsNet ?? 0,
        volume: initialValues.volume ?? 0,
        regroupementClient: initialValues.regroupementClient ?? undefined,
        orderTransitId: initialValues.orderTransitId ?? undefined,
        hscodeId: initialValues.hscodeId ?? undefined,
        deviseId: initialValues.deviseId ?? undefined,
        paysOrigineId: initialValues.paysOrigineId ?? undefined,
        regimeDeclarationId: initialValues.regimeDeclarationId ?? undefined,
      });
    }
  }, [initialValues, isLoading, form]);

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: ColisageCreate) => {
    try {
      console.log("Données soumises:", data);

      if (isEdit) {
        const updated = await updateColisage(initialValues.id, data);
        console.log("Résultat update:", updated);

        if (updated.success) {
          toast.success("Colisage mis à jour avec succès");
          onSuccess?.(initialValues.id);
        } else {
          console.error("Erreur update:", updated.error);
          toast.error("Erreur lors de la mise à jour");
        }
      } else {
        const created = await createColisage(data);



        if (created.success) {
          toast.success("Colisage créé avec succès");
          onSuccess?.(created.data?.id);
        } else {
          console.error("Erreur création:", created.error);
          toast.error("Erreur lors de la création");
        }
      }
    } catch (error) {
      console.error("Erreur dans onSubmit:", error);
      toast.error("Une erreur est survenue");
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 h-[600px] overflow-y-scroll scrollbar-hide"
      >
        <FormField
          control={form.control}
          name="orderTransitId"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Ordre de Transit*</FormLabel>
                <FormControl>
                  <CommandSelect
                    options={orderTransits.map((order) => ({
                      id: String(order.id),
                      value: String(order.id),
                      children: <span>{order.orderReference ?? order.noDossier ?? order.id}</span>,
                    }))}
                    onSelect={field.onChange}
                    value={field.value || ""}
                    placeholder="Sélectionner un ordre de transit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="deviseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Devise*</FormLabel>
              <FormControl>
                <CommandSelect
                  options={devises.map((devise) => ({
                    id: String(devise.id),
                    value: String(devise.id),
                    children: <span>{devise.libelle}</span>,
                  }))}
                  onSelect={field.onChange}
                  value={field.value || ""}
                  placeholder="Sélectionner une devise"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paysOrigineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pays d'Origine*</FormLabel>
              <FormControl>
                <CommandSelect
                  options={pays.map((country) => ({
                    id: String(country.id),
                    value: String(country.id),
                    children: (
                      <div className="flex items-center gap-x-2">
                        {country.flag && (
                          <img
                            src={country.flag}
                            alt={country.code}
                            className="w-5 h-4 object-cover rounded"
                          />
                        )}
                        <span>{country.libelle}</span>
                      </div>
                    ),
                  }))}
                  onSelect={field.onChange}
                  value={field.value || ""}
                  placeholder="Sélectionner un pays"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hscodeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>HS Code</FormLabel>
              <FormControl>
                <CommandSelect
                  options={hscodes.map((hscode) => ({
                    id: String(hscode.id),
                    value: String(hscode.id),
                    children: <span>{hscode.code}</span>,
                  }))}
                  onSelect={field.onChange}
                  value={field.value || ""}
                  placeholder="Sélectionner un HS code"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="regimeDeclarationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Régime de Déclaration</FormLabel>
              <FormControl>
                <CommandSelect
                  options={regimes.map((regime) => ({
                    id: String(regime.id),
                    value: String(regime.id),
                    children: <span>{regime.libelle}</span>,
                  }))}
                  onSelect={field.onChange}
                  value={field.value || ""}
                  placeholder="Sélectionner un régime"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description*</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Description du colisage" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="numeroCommande"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Commande</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Numéro de commande"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nomFournisseur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fournisseur</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Nom du fournisseur"
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
            name="numeroFacture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Facture</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Numéro de facture"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="regroupementClient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regroupement Client</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Regroupement client"
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
            name="quantite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prixUnitaireColis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix Unitaire</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="poidsBrut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poids Brut (kg)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poidsNet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poids Net (kg)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="volume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volume (m³)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="0"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between gap-x-2 pt-4">
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
            {isPending ? "En cours..." : isEdit ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
