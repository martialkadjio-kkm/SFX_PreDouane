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
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateDossierPesee } from "../../server/actions";
import { useEffect } from "react";

interface UpdatePeseeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dossierId: string;
    initialValues?: {
        nbrePaquetagePesee?: number;
        poidsBrutPesee?: number;
        poidsNetPesee?: number;
        volumePesee?: number;
    };
}

export const UpdatePeseeDialog = ({
    open,
    onOpenChange,
    dossierId,
    initialValues,
}: UpdatePeseeDialogProps) => {
    const form = useForm({
        mode: "onChange",
        defaultValues: {
            nbrePaquetagePesee: initialValues?.nbrePaquetagePesee || 0,
            poidsBrutPesee: initialValues?.poidsBrutPesee || 0,
            poidsNetPesee: initialValues?.poidsNetPesee || 0,
            volumePesee: initialValues?.volumePesee || 0,
        },
    });

    // Réinitialiser le formulaire quand les initialValues changent
    useEffect(() => {
        if (initialValues) {
            form.reset({
                nbrePaquetagePesee: initialValues.nbrePaquetagePesee || 0,
                poidsBrutPesee: initialValues.poidsBrutPesee || 0,
                poidsNetPesee: initialValues.poidsNetPesee || 0,
                volumePesee: initialValues.volumePesee || 0,
            });
        }
    }, [initialValues, form]);

    const isPending = form.formState.isSubmitting;

    const onSubmit = async (data: any) => {
        try {
            const result = await updateDossierPesee(dossierId, data);
            if (result.success) {
                onOpenChange(false);
                toast.success("Pesée mise à jour avec succès");
                form.reset();
            } else {
                toast.error("Erreur lors de la mise à jour de la pesée");
            }
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de la pesée");
        }
    };

    return (
        <ResponsiveDialog
            title="Mise à jour de la pesée"
            description="Modifiez les informations de pesée du dossier ci-dessous."
            open={open}
            onOpenChange={onOpenChange}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="nbrePaquetagePesee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de Paquetages Pesée</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            step="1"
                                            placeholder="0"
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="poidsBrutPesee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Poids Brut Pesée (kg)</FormLabel>
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
                            name="poidsNetPesee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Poids Net Pesée (kg)</FormLabel>
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
                            name="volumePesee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Volume Pesée (m³)</FormLabel>
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

                    <div className="flex justify-between gap-x-2">
                        <Button
                            variant="secondary"
                            disabled={isPending}
                            type="button"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            Mettre à jour
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveDialog>
    );
};