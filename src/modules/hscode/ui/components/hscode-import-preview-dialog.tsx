"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, FileCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importHSCodesFromExcel } from "../../server/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface HSCodePreviewItem {
  HS_Code: string;
  Description: string;
  status: 'new' | 'existing';
  rowIndex: number;
}

interface PreviewData {
  preview: HSCodePreviewItem[];
  total: number;
  valid: number;
  stats: {
    new: number;
    existing: number;
  };
  errors?: string[];
}

interface HSCodeImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: PreviewData | null;
}

export const HSCodeImportPreviewDialog = ({
  open,
  onOpenChange,
  previewData,
}: HSCodeImportPreviewDialogProps) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const router = useRouter();

  // Initialize selection when preview data changes
  useState(() => {
    if (previewData) {
      setSelectedRows(new Set(previewData.preview.map((_, idx) => idx)));
    }
  });

  if (!previewData) return null;

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === previewData.preview.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(previewData.preview.map((_, idx) => idx)));
    }
  };

  const handleImport = async () => {
    const rowsToImport = previewData.preview.filter((_, idx) => selectedRows.has(idx));

    if (rowsToImport.length === 0) {
      toast.error("Veuillez sélectionner au moins une ligne");
      return;
    }

    setIsImporting(true);

    try {
      // Déterminer le mode selon la checkbox et les données
      const mode = updateExisting ? 'both' : 'create';
      const result = await importHSCodesFromExcel(rowsToImport, mode);

      if (!result.success) {
        toast.error(result.error || "Erreur lors de l'import");
        return;
      }

      if (result.data) {
        const { created, updated } = result.data;
        toast.success(`${created} créé(s), ${updated} mis à jour`);
        router.refresh();
        onOpenChange(false);
      }
    } catch (err) {
      toast.error("Erreur lors de l'import");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = selectedRows.size;
  
  // Séparer les lignes nouvelles et existantes
  const newRows = previewData.preview.filter((row) => row.status === 'new');
  const existingRows = previewData.preview.filter((row) => row.status === 'existing');
  
  const newCount = previewData.preview.filter(
    (row, idx) => selectedRows.has(idx) && row.status === 'new'
  ).length;
  const existingCount = previewData.preview.filter(
    (row, idx) => selectedRows.has(idx) && row.status === 'existing'
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! max-h-[90vh]!">
        <DialogHeader>
          <DialogTitle>Aperçu de l'import - {previewData.preview.length} ligne(s)</DialogTitle>
          <DialogDescription>
            Sélectionnez les lignes à importer. Les lignes existantes sont marquées en orange.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedRows.size === previewData.preview.length && previewData.preview.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">
              Tout sélectionner ({selectedCount}/{previewData.preview.length})
            </span>
          </div>

          {existingCount > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(!!checked)}
              />
              <span className="text-sm">Mettre à jour les existants</span>
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <Badge variant="secondary">{newCount} nouveau(x)</Badge>
            {existingCount > 0 && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                {existingCount} existant(s)
              </Badge>
            )}
          </div>
        </div>

        {previewData.errors && previewData.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Erreurs détectées:</div>
              <ul className="mt-2 list-disc list-inside text-sm">
                {previewData.errors.slice(0, 5).map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
                {previewData.errors.length > 5 && (
                  <li>... et {previewData.errors.length - 5} autres erreurs</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Nouveaux HS Codes ({newRows.length})
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              HS Codes existants ({existingRows.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-2">
                {newRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-2 opacity-50" />
                    <p>Aucun nouveau HS Code</p>
                  </div>
                ) : (
                  newRows.map((row) => {
                    const originalIndex = previewData.preview.indexOf(row);
                    const isSelected = selectedRows.has(originalIndex);

                    return (
                      <div
                        key={originalIndex}
                        className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                          isSelected ? "bg-accent/50" : "bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(originalIndex)}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              Ligne {row.rowIndex + 1}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              HS: {row.HS_Code}
                            </Badge>
                          </div>

                          <p className="text-sm font-medium">{row.Description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="existing" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-2">
                {existingRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <FileCheck className="h-12 w-12 mb-2 opacity-50" />
                    <p>Aucun HS Code existant</p>
                  </div>
                ) : (
                  existingRows.map((row) => {
                    const originalIndex = previewData.preview.indexOf(row);
                    const isSelected = selectedRows.has(originalIndex);

                    return (
                      <div
                        key={originalIndex}
                        className={`flex items-start gap-3 p-3 border rounded-lg transition-colors border-orange-300 ${
                          isSelected ? "bg-accent/50" : "bg-background"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(originalIndex)}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              Ligne {row.rowIndex + 1}
                            </span>
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                              Existe
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              HS: {row.HS_Code}
                            </Badge>
                          </div>

                          <p className="text-sm font-medium">{row.Description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={isImporting || selectedCount === 0}>
              {isImporting ? "Import en cours..." : `Importer ${selectedCount} ligne(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
