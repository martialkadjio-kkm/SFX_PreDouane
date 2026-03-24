"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, Star, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { checkConversionEtTaux, genererNotesDetail, getDevisesColisageDossier } from "../../server/note-detail-actions";

interface GenererNotesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dossierId: number;
    entiteId: number;
    onSuccess: () => void;
}

export const GenererNotesDialog = ({
    open,
    onOpenChange,
    dossierId,
    onSuccess,
}: GenererNotesDialogProps) => {
    const [devises, setDevises] = useState<any[]>([]);
    const [selectedDeviseId, setSelectedDeviseId] = useState<number | null>(null);
    const [dateDeclaration, setDateDeclaration] = useState<Date>();
    const [isChecking, setIsChecking] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [checkResult, setCheckResult] = useState<{
        exists: boolean;
        tauxOk: boolean;
        devisesManquantes?: string[];
    } | null>(null);

    useEffect(() => {
        if (open) {
            setSelectedDeviseId(null);
            setDateDeclaration(undefined);
            setCheckResult(null);
            getDevisesColisageDossier(dossierId).then((res) => {
                if (res.success && res.data) setDevises(res.data);
            });
        }
    }, [open, dossierId]);

    const runCheck = async (date: Date | undefined, deviseId: number | null) => {
        setCheckResult(null);
        if (!date || !deviseId) return;
        setIsChecking(true);
        try {
            const result = await checkConversionEtTaux(dossierId, date, deviseId);
            if (!result.success) {
                toast.error(result.error || "Erreur de vérification");
                return;
            }
            setCheckResult({
                exists: result.exists ?? false,
                tauxOk: result.tauxOk ?? false,
                devisesManquantes: result.devisesManquantes,
            });
        } finally {
            setIsChecking(false);
        }
    };

    const handleDeviseSelect = async (deviseId: number) => {
        setSelectedDeviseId(deviseId);
        await runCheck(dateDeclaration, deviseId);
    };

    const handleDateSelect = async (date: Date | undefined) => {
        setDateDeclaration(date);
        await runCheck(date, selectedDeviseId);
    };

    const handleGenerer = async () => {
        if (!selectedDeviseId || !dateDeclaration) {
            toast.error("Veuillez sélectionner une devise et une date");
            return;
        }
        if (!checkResult?.exists) {
            toast.error("Aucune conversion disponible pour cette date");
            return;
        }
        if (!checkResult?.tauxOk) {
            toast.error("Des taux de change sont manquants pour cette date");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await genererNotesDetail(dossierId, dateDeclaration, selectedDeviseId);
            if (!result.success) {
                toast.error(result.error || "Erreur lors de la génération");
                return;
            }
            toast.success("Note de détail générée avec succès");
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            toast.error("Erreur lors de la génération");
        } finally {
            setIsGenerating(false);
        }
    };

    const majoritaire = devises[0];
    const selectedDevise = devises.find((d) => d.id === selectedDeviseId);
    const valeurTotale = devises.reduce((s, d) => s + Number(d.valeurTotale || 0), 0);

    const canGenerate =
        !!selectedDeviseId &&
        !!dateDeclaration &&
        checkResult?.exists === true &&
        checkResult?.tauxOk === true &&
        !isGenerating &&
        !isChecking;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Générer la note de détail</DialogTitle>
                    <DialogDescription>
                        Sélectionnez la devise de référence et la date de déclaration.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Sélection devise */}
                    <div className="space-y-2">
                        <Label>Devise de la note de détail</Label>
                        <div className="flex flex-col gap-2">
                            {devises.map((d) => {
                                const pct = valeurTotale > 0 ? (Number(d.valeurTotale) / valeurTotale) * 100 : 0;
                                const isMajoritaire = d.id === majoritaire?.id;
                                const isSelected = selectedDeviseId === d.id;
                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => handleDeviseSelect(d.id)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors",
                                            isSelected
                                                ? "border-primary bg-primary/5 font-medium"
                                                : "border-border hover:bg-muted"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            {isMajoritaire && (
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                                            )}
                                            <span>{d.code}</span>
                                            <span className="text-muted-foreground text-xs">{d.libelle}</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-semibold",
                                                isMajoritaire ? "text-green-600" : "text-orange-500"
                                            )}>
                                                {pct.toFixed(1)}%
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {Number(d.nbColisages)} col.
                                            </Badge>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedDevise && selectedDevise.id !== majoritaire?.id && (
                            <Alert className="border-orange-400 bg-orange-50 py-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <AlertDescription className="text-orange-700 text-xs">
                                    {selectedDevise.code} n&apos;est pas la devise majoritaire ({majoritaire?.code} représente {valeurTotale > 0 ? ((Number(majoritaire?.valeurTotale) / valeurTotale) * 100).toFixed(1) : 0}% de la valeur).
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Date de déclaration */}
                    <div className="space-y-2">
                        <Label>Date de déclaration</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn("w-full justify-start text-left font-normal", !dateDeclaration && "text-muted-foreground")}
                                    disabled={isChecking || isGenerating}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateDeclaration ? format(dateDeclaration, "PPP", { locale: fr }) : "Sélectionner une date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateDeclaration}
                                    onSelect={handleDateSelect}
                                    disabled={(date) => date > new Date()}
                                    locale={fr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Résultat de la vérification */}
                    {isChecking && (
                        <Alert>
                            <AlertCircle className="h-4 w-4 animate-pulse" />
                            <AlertDescription>Vérification en cours...</AlertDescription>
                        </Alert>
                    )}

                    {!isChecking && checkResult && (
                        <>
                            {!checkResult.exists && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Aucune conversion trouvée pour cette date. Créez une conversion avant de continuer.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {checkResult.exists && !checkResult.tauxOk && (
                                <Alert className="border-orange-400 bg-orange-50">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    <AlertDescription className="text-orange-700">
                                        Taux manquants pour : {checkResult.devisesManquantes?.join(", ")}. Ajoutez-les dans la page Conversions.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {checkResult.exists && checkResult.tauxOk && (
                                <Alert className="border-green-500 bg-green-50">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-700">
                                        Conversion et taux disponibles. Prêt à générer.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        Annuler
                    </Button>
                    <Button onClick={handleGenerer} disabled={!canGenerate}>
                        {isGenerating ? "Génération..." : "Générer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
