"use client";

import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { checkConversionExists, getDevisesColisageDossier, setDeviseNoteDetail } from "../../server/note-detail-actions";

interface SelectDeviseNoteDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dossierId: number;
    entiteId: number;
    onSuccess: () => void;
}

export const SelectDeviseNoteDetailDialog = ({
    open,
    onOpenChange,
    dossierId,
    entiteId,
    onSuccess,
}: SelectDeviseNoteDetailDialogProps) => {
    const [devises, setDevises] = useState<any[]>([]);
    const [selectedDeviseId, setSelectedDeviseId] = useState<number | null>(null);
    const [dateDeclaration, setDateDeclaration] = useState<Date>();
    const [conversionExists, setConversionExists] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [taux, setTaux] = useState<{ [deviseId: number]: string }>({});

    useEffect(() => {
        if (open) {
            setSelectedDeviseId(null);
            setDateDeclaration(undefined);
            setConversionExists(null);
            setTaux({});
            getDevisesColisageDossier(dossierId).then((res) => {
                if (res.success && res.data) setDevises(res.data);
            });
        }
    }, [open, dossierId]);

    const autresDevises = devises.filter((d) => d.id !== selectedDeviseId);

    const handleDateSelect = async (date: Date | undefined) => {
        setDateDeclaration(date);
        setConversionExists(null);
        if (!date) return;
        setIsChecking(true);
        try {
            const result = await checkConversionExists(date, entiteId);
            setConversionExists(result.exists ?? false);
            if (!result.exists) toast.error("Aucune conversion trouvée pour cette date");
        } finally {
            setIsChecking(false);
        }
    };

    const handleSave = async () => {
        if (!selectedDeviseId || !dateDeclaration) {
            toast.error("Veuillez sélectionner une devise et une date");
            return;
        }
        if (!conversionExists) {
            toast.error("Aucune conversion disponible pour cette date");
            return;
        }
        for (const d of autresDevises) {
            const val = parseFloat(taux[d.id] || "");
            if (isNaN(val) || val <= 0) {
                toast.error(`Veuillez saisir un taux valide pour ${d.code}`);
                return;
            }
        }

        setIsSaving(true);
        try {
            const tauxArray = autresDevises.map((d) => ({
                deviseId: d.id,
                tauxChange: parseFloat(taux[d.id]),
            }));

            const result = await setDeviseNoteDetail(dossierId, selectedDeviseId, dateDeclaration, tauxArray);
            if (!result.success) {
                toast.error(result.error || "Erreur lors de la sauvegarde");
                return;
            }
            toast.success("Devise et taux configurés avec succès");
            onOpenChange(false);
            onSuccess();
        } finally {
            setIsSaving(false);
        }
    };

    const majoritaire = devises[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Configurer la devise de la note de détail</DialogTitle>
                    <DialogDescription>
                        Sélectionnez la devise de référence et la date de déclaration pour générer la note de détail.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div className="space-y-2">
                        <Label>Devise de la note de détail</Label>
                        <div className="flex flex-col gap-2">
                            {devises.map((d) => (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => setSelectedDeviseId(d.id)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors",
                                        selectedDeviseId === d.id
                                            ? "border-primary bg-primary/5 font-medium"
                                            : "border-border hover:bg-muted"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {d.id === majoritaire?.id && (
                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                                        )}
                                        {d.code} — {d.libelle}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        {Number(d.nbColisages)} colisage(s)
                                    </Badge>
                                </button>
                            ))}
                        </div>
                        {majoritaire && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-400" />
                                Devise majoritaire : {majoritaire.code}
                            </p>
                        )}
                    </div>

                    {autresDevises.length > 0 && selectedDeviseId && (
                        <div className="space-y-2">
                            <Label>Taux de change par rapport à {devises.find(d => d.id === selectedDeviseId)?.code}</Label>
                            {autresDevises.map((d) => (
                                <div key={d.id} className="flex items-center gap-3">
                                    <span className="w-16 text-sm font-medium">{d.code}</span>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        min="0"
                                        placeholder="Taux de change"
                                        value={taux[d.id] || ""}
                                        onChange={(e) => setTaux((prev) => ({ ...prev, [d.id]: e.target.value }))}
                                        className="flex-1"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Date de déclaration</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn("w-full justify-start text-left font-normal", !dateDeclaration && "text-muted-foreground")}
                                    disabled={isChecking || isSaving}
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
                                    initialFocus
                                    locale={fr}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {conversionExists === false && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Aucune conversion trouvée pour cette date. Créez une conversion avant de continuer.
                            </AlertDescription>
                        </Alert>
                    )}
                    {conversionExists === true && (
                        <Alert className="border-green-500 bg-green-50">
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-600">
                                Conversion disponible. Vous pouvez confirmer.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedDeviseId || !dateDeclaration || conversionExists !== true || isSaving}
                    >
                        {isSaving ? "Enregistrement..." : "Confirmer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
