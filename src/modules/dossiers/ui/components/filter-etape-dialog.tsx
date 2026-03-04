"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CommandSelect } from "@/components/command-select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAllEtapes } from "../../server/actions";

const filterEtapeSchema = z.object({
    etapeId: z.string().optional(),
});

interface FilterEtapeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFilter: (etapeId: number | null) => void;
    selectedEtapeId: number | null;
}

export const FilterEtapeDialog = ({
    open,
    onOpenChange,
    onFilter,
    selectedEtapeId,
}: FilterEtapeDialogProps) => {
    const [etapes, setEtapes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof filterEtapeSchema>>({
        resolver: zodResolver(filterEtapeSchema),
        defaultValues: {
            etapeId: selectedEtapeId?.toString() || "",
        },
    });

    useEffect(() => {
        if (open) {
            loadEtapes();
            form.setValue("etapeId", selectedEtapeId?.toString() || "");
        }
    }, [open, selectedEtapeId, form]);

    const loadEtapes = async () => {
        setIsLoading(true);
        try {
            // Récupérer les étapes depuis la base de données
            console.log('🔍 [FilterEtapeDialog] Appel getAllEtapes...');
            const result = await getAllEtapes();
            console.log('📊 [FilterEtapeDialog] Résultat getAllEtapes:', result);
            
            if (result.success && result.data) {
                console.log('✅ [FilterEtapeDialog] Étapes trouvées:', result.data.length, result.data);
                const etapeOptions = result.data.map(e => ({
                    id: e!.idEtape!.toString(),
                    value: e!.idEtape!.toString(),
                    children: (
                        <div className="flex items-center gap-x-2">
                            <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div>
                            <span>{e.libelleEtape}</span>
                        </div>
                    ),
                }));

                // Ajouter l'option "Toutes les étapes"
                const finalEtapes = [
                    {
                        id: "",
                        value: "",
                        children: <span className="font-medium text-muted-foreground">Toutes les étapes</span>
                    },
                    ...etapeOptions
                ];
                
                console.log('🎯 [FilterEtapeDialog] Étapes finales pour CommandSelect:', finalEtapes);
                setEtapes(finalEtapes);
            } else {
                console.log('❌ [FilterEtapeDialog] Erreur ou pas de données:', result);
                // Fallback en cas d'erreur
                setEtapes([{
                    id: "",
                    value: "",
                    children: <span className="font-medium text-muted-foreground">Toutes les étapes</span>
                }]);
            }
        } catch (error) {
            console.error("Error loading etapes:", error);
            toast.error("Erreur lors du chargement des étapes");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = (data: z.infer<typeof filterEtapeSchema>) => {
        const etapeId = data.etapeId && data.etapeId !== "" ? parseInt(data.etapeId) : null;
        console.log('🚀 [FilterEtapeDialog] Soumission filtre:', { data, etapeId });
        onFilter(etapeId);
        onOpenChange(false);
    };

    const handleClearFilter = () => {
        form.setValue("etapeId", "");
        onFilter(null);
        onOpenChange(false);
    };

    const isPending = form.formState.isSubmitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Filtrer par étape</DialogTitle>
                    <DialogDescription>
                        Sélectionnez une étape pour afficher uniquement les dossiers à cette étape
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="etapeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Étape</FormLabel>
                                    <FormControl>
                                        <CommandSelect
                                            options={etapes}
                                            value={field.value || ""}
                                            onSelect={field.onChange}
                                            placeholder="Sélectionner une étape..."
                                            className={isLoading || isPending ? "opacity-50 pointer-events-none" : ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>

                <DialogFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleClearFilter}
                        disabled={isPending}
                        type="button"
                    >
                        Effacer le filtre
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            type="button"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isPending}
                            type="button"
                        >
                            {isPending ? "Application..." : "Appliquer"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};