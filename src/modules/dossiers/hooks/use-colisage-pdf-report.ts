'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getColisageReportData } from '../server/colisage-report-actions';
import { ColisagePDFReportV2 } from '../services/colisage-pdf-report-v2';

export const useColisagePDFReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDFReport = async (dossierId: number) => {
    setIsGenerating(true);
    
    try {
      // Récupérer les données du serveur
      const result = await getColisageReportData(dossierId);
      
      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la récupération des données');
        return;
      }

      if (!result.data || !result.data.colisages || result.data.colisages.length === 0) {
        toast.error('Aucun colisage trouvé pour ce dossier');
        return;
      }

      // Générer le PDF
      const pdfReport = new ColisagePDFReportV2();
      await pdfReport.generateReport(result.data.dossierInfo, result.data.colisages);
      
      toast.success('Rapport PDF généré avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du rapport PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDFReport,
    isGenerating
  };
};