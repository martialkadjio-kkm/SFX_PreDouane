'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getColisageReportData } from '../server/colisage-report-actions';
import { ColisagePDFReportSite } from '../services/colisage-pdf-report-site';

export const useColisagePDFReportSite = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDFReport = async (dossierId: number, language: 'fr' | 'en' = 'fr') => {
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
      const pdfReport = new ColisagePDFReportSite();
      await pdfReport.generateReport(result.data.dossierInfo, result.data.colisages, language);
      
      toast.success(language === 'fr' ? 'Rapport PDF généré avec succès' : 'PDF report generated successfully');
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la génération du rapport PDF' : 'Error generating PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDFReport,
    isGenerating
  };
};
