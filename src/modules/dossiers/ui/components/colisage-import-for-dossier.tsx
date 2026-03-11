"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";
import {
    parseColisageExcelFile,
    checkExistingRowKeys,
} from "../../server/import-colisage-actions";
import { ColisageImportPreviewDialog } from "./colisage-import-preview-dialog";
import { MissingValuesDialog } from "./missing-values-dialog";
import { MissingDevisesDialog } from "./missing-devises-dialog";
import { MissingPaysDialog } from "./missing-pays-dialog";
import { MissingHSCodesDialog } from "./missing-hscodes-dialog";
import { MissingRegimeDeclarationsDialog } from "./missing-regime-declarations-dialog";
import { RegimeAssociationDialog } from "./regime-association-dialog";
import { associateRegimesToClient, getClientName } from "../../server/associate-regimes-actions";

interface ColisageImportForDossierProps {
    dossierId: number;
}

export const ColisageImportForDossier = ({ dossierId }: ColisageImportForDossierProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showMissingValues, setShowMissingValues] = useState(false);
    const [showMissingDevises, setShowMissingDevises] = useState(false);
    const [showMissingPays, setShowMissingPays] = useState(false);
    const [showMissingHSCodes, setShowMissingHSCodes] = useState(false);
    const [showMissingRegimeDeclarations, setShowMissingRegimeDeclarations] = useState(false);
    const [currentStep, setCurrentStep] = useState<'regime-declarations' | 'regimes' | 'devises' | 'pays' | 'hscodes' | 'preview'>('regime-declarations');


    const startSequentialProcess = (missingValuesData: any) => {
        if (missingValuesData.regimes?.length > 0) {
            setCurrentStep('regime-declarations');
            setShowMissingRegimeDeclarations(true);
            return;
        }


        if (missingValuesData.unassociatedRegimes?.length > 0) {
            setCurrentStep('regimes');
            setShowRegimeAssociation(true);
            return;
        }

        if (missingValuesData.devises?.length > 0) {
            setCurrentStep('devises');
            setShowMissingDevises(true);
            return;
        }

        if (missingValuesData.pays?.length > 0) {
            setCurrentStep('pays');
            setShowMissingPays(true);
            return;
        }

        if (missingValuesData.hscodes?.length > 0) {
            setCurrentStep('hscodes');
            setShowMissingHSCodes(true);
            return;
        }
        setCurrentStep('preview');
        setShowPreview(true);
    };

    const goToNextStep = async (updatedMissingValues?: any) => {
        const currentMissingValues = updatedMissingValues || missingValues;
        if (currentStep === 'regime-declarations') {
            if (currentMissingValues?.unassociatedRegimes?.length > 0) {
                setCurrentStep('regimes');
                setShowRegimeAssociation(true);
            } else {
                setCurrentStep('devises');
                setTimeout(() => goToNextStep(currentMissingValues), 0); // Récursif asynchrone
            }
        } else if (currentStep === 'regimes') {
            if (currentMissingValues?.devises?.length > 0) {
                setCurrentStep('devises');
                setShowMissingDevises(true);
            } else {

                setCurrentStep('pays');
                setTimeout(() => {
                    goToNextStep(currentMissingValues);
                }, 100); // Récursif asynchrone
            }
        } else if (currentStep === 'devises') {
            if (currentMissingValues?.pays?.length > 0) {
                setCurrentStep('pays');
                setShowMissingPays(true);
            } else {
                setCurrentStep('hscodes');
                setTimeout(() => goToNextStep(currentMissingValues), 0); // Récursif asynchrone
            }
        } else if (currentStep === 'pays') {
            if (currentMissingValues?.hscodes?.length > 0) {
                setCurrentStep('hscodes');
                setShowMissingHSCodes(true);
            } else {
                setCurrentStep('preview');
                setShowPreview(true);
            }
        } else if (currentStep === 'hscodes') {
            setCurrentStep('preview');
            setShowPreview(true);
        }
    };

    // Fonction pour annuler tout le processus
    const cancelAllProcess = () => {
        setShowMissingRegimeDeclarations(false);
        setShowRegimeAssociation(false);
        setShowMissingDevises(false);
        setShowMissingPays(false);
        setShowMissingHSCodes(false);
        setShowPreview(false);
        setParsedRows([]);
        setMissingValues(null);
        setCurrentStep('regime-declarations');
    };
    const [showRegimeAssociation, setShowRegimeAssociation] = useState(false);
    const [parsedRows, setParsedRows] = useState<any[]>([]);
    const [existingRowKeys, setExistingRowKeys] = useState<any[]>([]);
    const [missingValues, setMissingValues] = useState<any>(null);
    const [clientName, setClientName] = useState<string>("");
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            toast.error("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
            return;
        }

        setIsLoading(true);
        setCurrentFile(file); // Stocker le fichier pour re-parsing ultérieur

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Parse le fichier avec le dossierId pour récupérer le client
            const parseResult = await parseColisageExcelFile(formData, dossierId);
            if (!parseResult.success || !parseResult.data) {
                toast.error(parseResult.error || "Erreur lors du parsing");
                return;
            }

            // Vérifier les rowKeys existants
            const rowKeys = parseResult.data.rows.map((r: any) => r.rowKey).filter(Boolean);
            const existingResult = await checkExistingRowKeys(dossierId, rowKeys);

            setParsedRows(parseResult.data.rows);
            setExistingRowKeys(existingResult.success ? existingResult.data || [] : []);
            
            setMissingValues({
                ...parseResult.data.missingValues,
                clientId: parseResult.data.clientId
            });

            // Récupérer le nom du client
            const clientNameResult = await getClientName(parseResult.data.clientId);
            setClientName(clientNameResult.data || `Client ${parseResult.data.clientId}`);

            // Démarrer le processus séquentiel

            startSequentialProcess(parseResult.data.missingValues);

            e.target.value = "";
        } catch (err) {
            toast.error("Erreur lors du traitement du fichier");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = () => {
        // Télécharger le template depuis public/data/Template Colisage.xlsx
        const link = document.createElement('a');
        link.href = '/data/Template Colisage.xlsx';
        link.download = 'Template Colisage.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Template téléchargé", {
            description: "Consultez l'onglet '📖 Instructions' pour le format Regime_Ratio"
        });
    };

    return (
        <>
            <div className="space-y-2 flex items-center max-w-[500px] gap-3">
                <div className="flex items-center gap-2">
                    <Button
                        onClick={downloadTemplate}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4 text-green-600" />
                        Template
                    </Button>

                    <label htmlFor="excel-import-dossier" className="cursor-pointer">
                        <Button
                            asChild
                            disabled={isLoading}
                            variant="outline"
                            size="sm"
                        >
                            <span className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-green-600" />
                                {isLoading ? "Chargement..." : "Importer Excel"}
                            </span>
                        </Button>
                        <input
                            id="excel-import-dossier"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            disabled={isLoading}
                            className="hidden"
                        />
                    </label>
                </div>
                
                {/* <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                    <strong>Format Regime_Ratio:</strong> Utilisez des valeurs décimales: 
                    <span className="ml-1">0 (EXO), 0.4578 (45.78% DC), 1 (100% DC), -1 (100% TR), -2 (TTC)</span>
                </div>   */}
            </div>

            <MissingRegimeDeclarationsDialog
                open={showMissingRegimeDeclarations}
                onOpenChange={setShowMissingRegimeDeclarations}
                missingRegimes={missingValues?.regimes || []}
                onRegimeCreated={async (regimeCode) => {
                    // Re-parser le fichier immédiatement après création d'un régime
                    if (currentFile) {
                        const formData = new FormData();
                        formData.append("file", currentFile);
                        const reparseResult = await parseColisageExcelFile(formData, dossierId);
                        
                        if (reparseResult.success && reparseResult.data) {
                            // Mettre à jour avec les nouvelles données validées
                            setMissingValues({
                                ...reparseResult.data.missingValues,
                                clientId: reparseResult.data.clientId
                            });
                        }
                    }
                }}
                onContinue={async () => {
                    if (currentFile) {
                        const formData = new FormData();
                        formData.append("file", currentFile);
                        const reparseResult = await parseColisageExcelFile(formData, dossierId);
                        
                        if (reparseResult.success && reparseResult.data) {
                            const updatedMissingValues = {
                                ...reparseResult.data.missingValues,
                                clientId: reparseResult.data.clientId
                            };
                            setMissingValues(updatedMissingValues);
                            
                            setShowMissingRegimeDeclarations(false);
                            goToNextStep(updatedMissingValues);
                        } else {
                            setShowMissingRegimeDeclarations(false);
                            goToNextStep();
                        }
                    } else {
                        setShowMissingRegimeDeclarations(false);
                        goToNextStep();
                    }
                }}
                onCancel={cancelAllProcess}
            />

            <RegimeAssociationDialog
                open={showRegimeAssociation}
                onOpenChange={(open) => {
                    if (!open) return;
                    setShowRegimeAssociation(open);
                }}
                regimes={missingValues?.unassociatedRegimes || []}
                clientName={clientName}
                onConfirm={async () => {
                    if (missingValues?.unassociatedRegimes && missingValues.clientId) {
                        const result = await associateRegimesToClient(
                            missingValues.unassociatedRegimes,
                            missingValues.clientId
                        );
                        
                        if (result.success) {
                            const { associated, alreadyAssociated } = result.data || {};
                            if (associated && associated > 0) {
                                toast.success(`${associated} régime(s) associé(s) au client - L'import va continuer automatiquement`);
                            }
                            if (alreadyAssociated && alreadyAssociated > 0) {
                                toast.info(`${alreadyAssociated} régime(s) déjà associé(s)`);
                            }
                            
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // Re-parser le fichier pour revalider avec les nouvelles associations
                            if (currentFile) {
                                console.log('🔄 [RegimeAssociation] Re-parsing après association...');
                                const formData = new FormData();
                                formData.append("file", currentFile);
                                const reparseResult = await parseColisageExcelFile(formData, dossierId);
                                
                                
                                if (reparseResult.success && reparseResult.data) {
                                    // Mettre à jour avec les nouvelles données validées
                                    const updatedMissingValues = {
                                        ...reparseResult.data.missingValues,
                                        clientId: reparseResult.data.clientId
                                    };
                                    setMissingValues(updatedMissingValues);
                                    
                               
                                    setShowRegimeAssociation(false);
                                    
                                    // Redémarrer le processus séquentiel avec les données mises à jour
                                    setTimeout(() => {
                                      
                                        setCurrentStep('devises');
                                        
                                        // Redémarrer le processus
                                        setTimeout(() => {
                                            startSequentialProcess(updatedMissingValues);
                                        }, 100);
                                    }, 300);
                                } else {
                                    // En cas d'erreur de re-parsing, afficher un message et fermer
                                    setShowRegimeAssociation(false);
                                    toast.info("Régimes associés avec succès. Veuillez relancer l'import pour continuer.", {
                                        duration: 5000
                                    });
                                }
                            } else {
                                // Pas de fichier à re-parser, afficher un message et fermer
                                setShowRegimeAssociation(false);
                                toast.info("Régimes associés avec succès. Veuillez relancer l'import pour continuer.", {
                                    duration: 5000
                                });
                            }
                        } else {
                            toast.error("Erreur lors de l'association des régimes");
                        }
                    }
                }}
                onCancel={cancelAllProcess}
            />

            <MissingDevisesDialog
                open={showMissingDevises}
                onOpenChange={setShowMissingDevises}
                missingDevises={missingValues?.devises || []}
                onContinue={async () => {
                  
                    if (currentFile) {
                        // Petit délai pour s'assurer que les données sont commitées
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        const formData = new FormData();
                        formData.append("file", currentFile);
                        const reparseResult = await parseColisageExcelFile(formData, dossierId);
                        
                        if (reparseResult.success && reparseResult.data) {
                            const updatedMissingValues = {
                                ...reparseResult.data.missingValues,
                                clientId: reparseResult.data.clientId
                            };
                            setMissingValues(updatedMissingValues);
                            
                            setShowMissingDevises(false);
                            goToNextStep(updatedMissingValues);
                        } else {
                            setShowMissingDevises(false);
                            goToNextStep();
                        }
                    } else {
                        setShowMissingDevises(false);
                        goToNextStep();
                    }
                }}
                onCancel={cancelAllProcess}
            />

            <MissingPaysDialog
                open={showMissingPays}
                onOpenChange={setShowMissingPays}
                missingPays={missingValues?.pays || []}
                onContinue={async () => {
                    if (currentFile) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        const formData = new FormData();
                        formData.append("file", currentFile);
                        const reparseResult = await parseColisageExcelFile(formData, dossierId);
                        
                        if (reparseResult.success && reparseResult.data) {
                            const updatedMissingValues = {
                                ...reparseResult.data.missingValues,
                                clientId: reparseResult.data.clientId
                            };
                            setMissingValues(updatedMissingValues);
                            
                            setShowMissingPays(false);
                            goToNextStep(updatedMissingValues);
                        } else {
                            setShowMissingPays(false);
                            goToNextStep();
                        }
                    } else {
                        setShowMissingPays(false);
                        goToNextStep();
                    }
                }}
                onCancel={cancelAllProcess}
            />

            <MissingHSCodesDialog
                open={showMissingHSCodes}
                onOpenChange={setShowMissingHSCodes}
                missingHSCodes={missingValues?.hscodes || []}
                onContinue={async () => {
                    if (currentFile) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        const formData = new FormData();
                        formData.append("file", currentFile);
                        const reparseResult = await parseColisageExcelFile(formData, dossierId);
                        
                        if (reparseResult.success && reparseResult.data) {
                            const updatedMissingValues = {
                                ...reparseResult.data.missingValues,
                                clientId: reparseResult.data.clientId
                            };
                            setMissingValues(updatedMissingValues);
                            
                            setShowMissingHSCodes(false);
                            goToNextStep(updatedMissingValues);
                        } else {
                            setShowMissingHSCodes(false);
                            goToNextStep();
                        }
                    } else {
                        setShowMissingHSCodes(false);
                        goToNextStep();
                    }
                }}
                onCancel={cancelAllProcess}
            />

            <MissingValuesDialog
                open={showMissingValues}
                onOpenChange={setShowMissingValues}
                missingValues={missingValues || { devises: [], pays: [], hscodes: [], regimes: [], clientId: undefined }}
                onContinue={() => {
                    setShowMissingValues(false);
                    setShowPreview(true);
                }}
                onCancel={cancelAllProcess}
            />

            <ColisageImportPreviewDialog
                open={showPreview}
                onOpenChange={setShowPreview}
                dossierId={dossierId}
                parsedRows={parsedRows}
                existingRowKeys={existingRowKeys}
            />
        </>
    );
};
