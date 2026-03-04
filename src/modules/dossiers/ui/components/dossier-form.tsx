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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    createDossier,
    updateDossier,
    getAllClientsForSelect,
    getAllTypesDossiers,
} from "../../server/actions";
import { toast } from "sonner";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface DossierFormProps {
    onSuccess?: (id?: string) => void;
    onCancel?: () => void;
    initialValues?: any;
}

export const DossierForm = ({
    onSuccess,
    onCancel,
    initialValues,
}: DossierFormProps) => {
    const [clients, setClients] = useState<Array<{ id: number; nomClient: string }>>(
        []
    );
    const [typesDossiers, setTypesDossiers] = useState<Array<{ id: number; libelle: string }>>(
        []
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    clientsRes,
                    typesRes,
                ] = await Promise.all([
                    getAllClientsForSelect(),
                    getAllTypesDossiers(),
                ]);

                if (clientsRes.success) setClients(clientsRes.data || []);
                if (typesRes.success) setTypesDossiers(typesRes.data || []);
            } catch (error) {
                toast.error("Erreur lors du chargement des données");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const form = useForm({
        mode: "onChange",
        defaultValues: {
            clientId: initialValues?.idClient || "",
            typeDossierId: initialValues?.idTypeDossier || "",
            noOT: initialValues?.noOT || "",
            noDossier: initialValues?.noDossier || "",
            description: initialValues?.descriptionDossier || "",
        },
    });

    const isPending = form.formState.isSubmitting;
    const isEdit = !!initialValues?.idDossier;

    const onSubmit = async (data: any) => {
        if (isEdit) {
            try {
                const result = await updateDossier(initialValues.idDossier.toString(), data);
                if (result.success) {
                    onSuccess?.(initialValues.idDossier.toString());
                    toast.success("Dossier mis à jour avec succès");
                } else {
                    toast.error("Erreur lors de la mise à jour du dossier");
                }
            } catch (error) {
                toast.error("Erreur lors de la mise à jour du dossier");
            }
        } else {
            try {
                const result = await createDossier(data);
                if (result.success) {
                    onSuccess?.(result.data?.id?.toString());
                    toast.success("Dossier créé avec succès");
                } else {
                    toast.error("Erreur lors de la création du dossier");
                }
            } catch (error) {
                toast.error("Erreur lors de la création du dossier");
            }
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center">Chargement...</div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="noOT"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>N° OT*</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Numéro d'ordre de transit" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="noDossier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>N° Dossier</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Numéro de dossier" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Sélecteurs principaux */}

                <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Client*</FormLabel>
                            <FormControl>
                                <CommandSelect
                                    options={clients.map((client) => ({
                                        id: client.id.toString(),
                                        value: client.id.toString(),
                                        children: (
                                            <div className="flex items-center gap-x-2">
                                                <GeneratedAvatar
                                                    seed={client.nomClient}
                                                    variant="initials"
                                                    className="border size-6"
                                                />
                                                <span>{client.nomClient}</span>
                                            </div>
                                        ),
                                    }))}
                                    onSelect={(value) => field.onChange(parseInt(value))}
                                    value={field.value?.toString()}
                                    placeholder="Sélectionner le client"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="typeDossierId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type de Dossier*</FormLabel>
                            <FormControl>
                                <CommandSelect
                                    options={typesDossiers.map((type) => ({
                                        id: type.id.toString(),
                                        value: type.id.toString(),
                                        children: <span>{type.libelle}</span>,
                                    }))}
                                    onSelect={(value) => field.onChange(parseInt(value))}
                                    value={field.value?.toString()}
                                    placeholder="Sélectionner le type"
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Description du dossier"
                                    rows={3}
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
                            Annuler
                        </Button>
                    )}
                    <Button type="submit" disabled={isPending}>
                        {isEdit ? "Mettre à jour" : "Créer le dossier"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
