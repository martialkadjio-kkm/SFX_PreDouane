"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  Trash2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import {
  genererNotesDetail,
  supprimerNotesDetail,
  getNotesDetail,
  getTauxChangeDossier,
} from "../../server/note-detail-actions";
import { GenererNotesDialog } from "./generer-notes-dialog";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/laoding-state";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteDetailViewProps {
  dossierId: number;
  entiteId: number;
  dossierName: string;
}

export const NoteDetailView = ({
  dossierId,
  entiteId,
  dossierName,
}: NoteDetailViewProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [showGenererDialog, setShowGenererDialog] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{ [devise: string]: number }>({});
  const [dateDeclaration, setDateDeclaration] = useState<Date | null>(null);
  const router = useRouter();

  const [DeleteConfirmation, confirmDelete] = useConfirm(
    "Supprimer la note de détails?",
    "Voulez-vous vraiment supprimer toutes les lignes de la note de détails ? Cette action est irréversible.",
  );

  useEffect(() => {
    loadNotes();
  }, [dossierId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const result = await getNotesDetail(dossierId);
      if (result.success && result.data) {
        setNotes(result.data);
      }

      // Récupérer les taux de change
      const tauxResult = await getTauxChangeDossier(dossierId);
      if (tauxResult.success && tauxResult.data) {
        const rates: { [devise: string]: number } = {};
        tauxResult.data.forEach((taux: any) => {
          rates[taux.Code_Devise] = Number(taux.Taux_Change || 0);
        });
        setExchangeRates(rates);
        
        // Récupérer la date de déclaration
        if (tauxResult.dateDeclaration) {
          setDateDeclaration(new Date(tauxResult.dateDeclaration));
        }
        
        console.log("[NoteDetailView] Taux de change chargés:", rates);
        console.log("[NoteDetailView] Date de déclaration:", tauxResult.dateDeclaration);
      } else {
        console.warn("[NoteDetailView] Impossible de charger les taux de change:", tauxResult.error);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;

    setIsDeleting(true);
    try {
      const result = await supprimerNotesDetail(dossierId);

      if (result.success) {
        toast.success("Note de détails supprimée avec succès");
        await loadNotes();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression de la note");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    try {
      const XLSX = require("xlsx");

      const exportData = notes.map((note) => ({
        Groupement: note.Regroupement_Client || "",
        "Régime Déclaration": note.Libelle_Regime_Declaration || "",
        Régime: note.Regime || "",
        "Pays d'origine": note.Pays_Origine || "",
        "HS Code": note.HS_Code || "",
        "Nbre Paquetage": note.Nbre_paquetage,
        Devise: note.Code_Devise || "",
        Valeur: Number(note.Valeur),
        "Volume (m³)": Number(note.Volume),
        "Poids Brut (kg)": Number(note.Poids_Brut || 0),
        "Poids Net (kg)": Number(note.Poids_Net || 0),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Note de Détails");

      worksheet["!cols"] = [
        { wch: 15 }, // Groupement
        { wch: 30 }, // Régime Déclaration
        { wch: 10 }, // Régime
        { wch: 20 }, // Pays d'origine
        { wch: 15 }, // HS Code
        { wch: 15 }, // Nbre Paquetage
        { wch: 10 }, // Devise
        { wch: 15 }, // Valeur
        { wch: 12 }, // Volume
        { wch: 12 }, // Poids Brut
        { wch: 12 }, // Poids Net
      ];

      XLSX.writeFile(workbook, `note-details-dossier-${dossierId}.xlsx`);
      toast.success("Export Excel réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export Excel");
      console.error(error);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "Groupement",
        "Régime Déclaration",
        "Régime",
        "Pays d'origine",
        "HS Code",
        "Nbre Paquetage",
        "Devise",
        "Valeur",
        "Volume (m³)",
        "Poids Brut (kg)",
        "Poids Net (kg)",
      ];

      const rows = notes.map((note) => [
        `"${(note.Regroupement_Client || "").replace(/"/g, '""')}"`,
        `"${(note.Libelle_Regime_Declaration || "").replace(/"/g, '""')}"`,
        note.Regime || "",
        `"${(note.Pays_Origine || "").replace(/"/g, '""')}"`,
        note.HS_Code || "",
        Number(note.Nbre_Paquetage),
        note.Code_Devise || "",
        Number(note.Valeur),
        Number(note.Volume),
        Number(note.Poids_Brut || 0),
        Number(note.Poids_Net || 0),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `note-details-dossier-${dossierId}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export CSV réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export CSV");
      console.error(error);
    }
  };

  const exportToPDF = async (language: 'fr' | 'en' = 'fr') => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      // Traductions
      const translations = {
        fr: {
          weighingInfo: "INFORMATIONS SUR LA PESÉE",
          qty: "QTE",
          grossWeight: "POIDS BRUT (kg)",
          netWeight: "POIDS NET (kg)",
          volume: "VOLUME (m³)",
          declarationSummary: "SYNTHÈSE DE DÉCLARATION",
          declarationDate: "Date de déclaration :",
          rowCount: "Row count",
          totalXOF: "Total XOF",
          xof: "XOF",
          total: "TOTAL",
          details: "DETAILS",
          grouping: "Groupement",
          regimeDecl: "Régime Décl.",
          originCountry: "Pays D'origine",
          hsCode: "HS Code",
          nbPackages: "Nbre Paq.",
          currency: "Dev.",
          value: "Valeur",
          volumeCol: "Volume",
          grossWeightCol: "Poids Brut",
          netWeightCol: "Poids Net",
          copyright: "©Copyright Softronic Innoving",
          page: "Page",
        },
        en: {
          weighingInfo: "WEIGHING INFORMATION",
          qty: "QTY",
          grossWeight: "GROSS WEIGHT (kg)",
          netWeight: "NET WEIGHT (kg)",
          volume: "VOLUME (m³)",
          declarationSummary: "DECLARATION SUMMARY",
          declarationDate: "Declaration date:",
          rowCount: "Row count",
          totalXOF: "Total XOF",
          xof: "XOF",
          total: "TOTAL",
          details: "DETAILS",
          grouping: "Grouping",
          regimeDecl: "Decl. Regime",
          originCountry: "Origin Country",
          hsCode: "HS Code",
          nbPackages: "Nb Packages",
          currency: "Curr.",
          value: "Value",
          volumeCol: "Volume",
          grossWeightCol: "Gross Weight",
          netWeightCol: "Net Weight",
          copyright: "©Copyright Softronic Innoving",
          page: "Page",
        },
      };

      const t = translations[language];

      // Fonction pour formater les nombres avec séparateurs de milliers
      const formatNumber = (value: any): string => {
        const num = Number(value);
        if (isNaN(num)) return '0.00';
        
        // Utiliser toLocaleString pour un formatage natif avec séparateurs
        // 'en-US' utilise des virgules comme séparateurs et un point pour les décimales
        return num.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      };

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // === EN-TÊTE AVEC LOGO ===
      // Bordure d'en-tête
      doc.setDrawColor(66, 139, 202);
      doc.setLineWidth(0.5);
      doc.line(14, 8, 283, 8);
      doc.line(14, 32, 283, 32);

      // Essayer d'ajouter le logo PNG
      try {
        const logoResponse = await fetch("/logo.jpeg");
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });

          // Ajouter le logo (ajuster la taille selon le logo)
          doc.addImage(logoBase64, "PNG", 16, 10, 20, 20);

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
        } else {
          throw new Error("Logo non trouvé");
        }
      } catch (error) {
        // Fallback sans logo
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(66, 139, 202);
        doc.text("SFX PRE-DOUANE", 16, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
      }

      // === TITRE ET INFORMATIONS ===
      // Titre principal centré
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      const titleWidth = doc.getTextWidth("NOTE DE DÉTAIL");
      doc.text("NOTE DE DÉTAIL", (297 - titleWidth) / 2, 18);

      // Informations du dossier (côté droit)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(66, 139, 202);
      doc.text(`DOSSIER :${dossierName}`, 220, 15);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Date d'export: ${new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}`,
        220,
        20,
      );
      doc.text(
        `Heure: ${new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        220,
        25,
      );

      // === STATISTIQUES - CALCULS ===
      const ttcCount = notes.filter((n) => n.Regime === "TTC").length;
      const tr100Count = notes.filter((n) => n.Regime === "100% TR").length;
      const dc100Count = notes.filter((n) => n.Regime === "100% DC").length;
      const exoCount = notes.filter((n) => n.Regime === "EXO").length;
      const ratioCount = notes.filter((n) => {
        const regime = n.Regime || "";
        return regime.includes("%") && !regime.includes("100%");
      }).length;
      const totalPaquetage = notes.reduce(
        (sum, n) => sum + Number(n.Nbre_Paquetage || 0),
        0,
      );
      const totalPoids = notes.reduce(
        (sum, n) => sum + Number(n.Poids_Brut || 0),
        0,
      );
      const totalVolume = notes.reduce(
        (sum, n) => sum + Number(n.Volume || 0),
        0,
      );
      const totalValeur = notes.reduce(
        (sum, n) => sum + Number(n.Valeur || 0),
        0,
      );

      // Calculer les totaux par régime et par devise
      const regimeStats: { [key: string]: { [devise: string]: number } } = {};
      const deviseStats: { [devise: string]: number } = {};
      
      notes.forEach((note) => {
        const regime = note.Regime || "Non défini";
        const devise = note.Code_Devise || "N/A";
        const valeur = Number(note.Valeur || 0);
        
        if (!regimeStats[regime]) {
          regimeStats[regime] = {};
        }
        if (!regimeStats[regime][devise]) {
          regimeStats[regime][devise] = 0;
        }
        regimeStats[regime][devise] += valeur;
        
        if (!deviseStats[devise]) {
          deviseStats[devise] = 0;
        }
        deviseStats[devise] += valeur;
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 14;
      const marginRight = 14;
      const availableWidth = pageWidth - marginLeft - marginRight;
      
      let currentY = 40;

      // === Informations sur la pesée (style moderne avec cartes) ===
      // Titre avec style bleu comme les autres tableaux
      doc.setFillColor(66, 139, 202);
      doc.rect(marginLeft, currentY, availableWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(t.weighingInfo, marginLeft + 3, currentY + 5.5);
      currentY += 10;

      // Créer des cartes visuelles pour les métriques (4 cartes)
      const cardsPerLine = 4;
      const cardSpacing = 3;
      const totalSpacing = cardSpacing * (cardsPerLine - 1);
      const cardWidth = (availableWidth - totalSpacing) / cardsPerLine;
      const cardHeight = 12;
      const cardY = currentY;
      
      // Carte: Paquetages
      doc.setFillColor(255, 255, 255); // Blanc
      doc.roundedRect(marginLeft, cardY, cardWidth, cardHeight, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginLeft, cardY, cardWidth, cardHeight, 1, 1, 'S');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(t.qty, marginLeft + cardWidth / 2, cardY + 3.5, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(totalPaquetage.toFixed(1), marginLeft + cardWidth / 2, cardY + 9, { align: 'center' });
      
      // Carte: Poids Brut
      const card2X = marginLeft + cardWidth + cardSpacing;
      doc.setFillColor(255, 255, 255); // Blanc
      doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 1, 1, 'S');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(t.grossWeight, card2X + cardWidth / 2, cardY + 3.5, { align: 'center' });
      
      const totalPoidsBrut = notes.reduce((sum, n) => sum + Number(n.Poids_Brut || 0), 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(totalPoidsBrut.toFixed(2), card2X + cardWidth / 2, cardY + 9, { align: 'center' });
      
      // Carte: Poids Net
      const card3X = marginLeft + (cardWidth + cardSpacing) * 2;
      doc.setFillColor(255, 255, 255); // Blanc
      doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 1, 1, 'S');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(t.netWeight, card3X + cardWidth / 2, cardY + 3.5, { align: 'center' });
      
      const totalPoidsNet = notes.reduce((sum, n) => sum + Number(n.Poids_Net || 0), 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(totalPoidsNet.toFixed(2), card3X + cardWidth / 2, cardY + 9, { align: 'center' });
      
      // Carte: Volume Total
      const card4X = marginLeft + (cardWidth + cardSpacing) * 3;
      doc.setFillColor(255, 255, 255); // Blanc
      doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 1, 1, 'S');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(t.volume, card4X + cardWidth / 2, cardY + 3.5, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(totalVolume.toFixed(1), card4X + cardWidth / 2, cardY + 9, { align: 'center' });

      currentY += cardHeight + 5;

      // === SYNTHÈSE DE DÉCLARATION ===
      // Titre avec style bleu comme les autres sections
      doc.setFillColor(66, 139, 202);
      doc.rect(marginLeft, currentY, availableWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(t.declarationSummary, marginLeft + 3, currentY + 5.5);
      currentY += 10;

      // Afficher "Date de déclaration :" suivi de la date
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(t.declarationDate, marginLeft, currentY + 5);
      
      // Récupérer la date de déclaration du dossier
      const dateDeclarationFormatted = dateDeclaration 
        ? dateDeclaration.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      // Calculer la position de la date juste après le label
      const labelWidth = doc.getTextWidth(t.declarationDate + " ");
      doc.setFont("helvetica", "normal");
      doc.setTextColor(22, 163, 74); // Vert
      doc.text(dateDeclarationFormatted, marginLeft + labelWidth, currentY + 5);

      currentY += 10;

      // === TABLEAU 2: TOTAUX PAR RÉGIME ET DEVISE (tableau croisé avec Source) - Style Professionnel ===
      // Obtenir toutes les devises uniques triées
      const allDevises = Object.keys(deviseStats).sort();
      
      // Calculer le nombre d'occurrences par régime
      const regimeCount: { [regime: string]: number } = {};
      notes.forEach((note) => {
        const regime = note.Regime || "Non défini";
        regimeCount[regime] = (regimeCount[regime] || 0) + 1;
      });
      
      // Créer les lignes de données
      const regimeDeviseDataCross: any[] = [];
      let grandTotal = 0;
      let grandTotalConverti = 0;
      let grandTotalCount = 0;
      
      Object.keys(regimeStats).sort().forEach((regime) => {
        const row: any[] = [regime];
        
        // Ajouter le nombre d'occurrences
        const count = regimeCount[regime] || 0;
        row.push(count);
        grandTotalCount += count;
        
        let rowTotal = 0;
        let rowTotalConverti = 0;
        
        // Pour chaque devise, ajouter la valeur ou vide
        allDevises.forEach((devise) => {
          const valeur = regimeStats[regime][devise] || 0;
          row.push(valeur > 0 ? formatNumber(valeur) : "-");
          rowTotal += valeur;
          
          // Calculer le total converti avec le taux de change
          const tauxChange = exchangeRates[devise] || 0;
          if (tauxChange > 0) {
            rowTotalConverti += valeur * tauxChange;
          }
        });
        
        // Ajouter le total converti calculé
        row.push(formatNumber(rowTotalConverti));
        grandTotal += rowTotal;
        grandTotalConverti += rowTotalConverti;
        regimeDeviseDataCross.push(row);
      });
      
      // Calculer les totaux convertis par devise pour le footer
      const deviseStatsConverti: { [devise: string]: number } = {};
      allDevises.forEach((devise) => {
        const tauxChange = exchangeRates[devise] || 0;
        deviseStatsConverti[devise] = deviseStats[devise] * tauxChange;
      });
      
      // Calculer les largeurs de colonnes dynamiquement
      const nbDevises = allDevises.length;
      const regimeColWidth = availableWidth * 0.15; // 15% pour la colonne des régimes
      const countColWidth = availableWidth * 0.08; // 8% pour Row count
      const totalColWidth = availableWidth * 0.15; // 15% pour Total XOF
      const sourceColWidth = availableWidth - regimeColWidth - countColWidth - totalColWidth; // Reste pour les devises
      const deviseColWidth = sourceColWidth / nbDevises;
      
      const columnStyles: any = {
        0: { cellWidth: regimeColWidth, halign: 'left', fontStyle: 'bold', fillColor: [248, 250, 252] }, // Colonne des régimes
        1: { cellWidth: countColWidth, halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] } // Colonne Row count
      };
      
      // Colonnes des devises (alignées à droite)
      for (let i = 2; i <= nbDevises + 1; i++) {
        columnStyles[i] = { cellWidth: deviseColWidth, halign: 'right' };
      }
      
      // Colonne Total XOF
      columnStyles[nbDevises + 2] = { cellWidth: totalColWidth, halign: 'right', fontStyle: 'bold' };

      // Créer l'en-tête avec style professionnel (sans Source, Total Converti renommé en Total XOF)
      autoTable(doc, {
        startY: currentY,
        head: [
          [
            { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },  // Cellule vide pour régimes
            { content: t.rowCount, styles: { halign: 'center' as const, fillColor: [66, 139, 202], textColor: [255, 255, 255], fontSize: 10, cellPadding: 2 } }, // Row count
            ...allDevises,
            { content: t.totalXOF, styles: { halign: 'center' as const, fillColor: [66, 139, 202], textColor: [255, 255, 255], fontSize: 10, cellPadding: 2 } }
          ]
        ],
        body: regimeDeviseDataCross,
        theme: "striped",
        styles: {
          fontSize: 10,
          cellPadding: 2,
          lineColor: [226, 232, 240],
          lineWidth: 0.5,
          minCellHeight: 6,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: 10,
          cellPadding: 2,
          minCellHeight: 6,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: columnStyles,
        margin: { left: marginLeft, right: marginRight },
        tableWidth: availableWidth,
        didParseCell: (data: any) => {
          // Style de l'en-tête (les devises)
          if (data.section === 'head' && data.column.index > 1 && data.column.index <= nbDevises + 1) {
            data.cell.styles.fillColor = [66, 139, 202]; // Fond bleu
            data.cell.styles.textColor = [255, 255, 255]; // Texte blanc
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
            data.cell.styles.cellPadding = 2;
          }
          // La première colonne du body contient les régimes
          if (data.section === 'body' && data.column.index === 0) {
            data.cell.styles.fontStyle = 'bold';
          }
          // La deuxième colonne du body contient Row count
          if (data.section === 'body' && data.column.index === 1) {
            data.cell.styles.fontStyle = 'bold';
          }
          // Colonne Total XOF
          if (data.section === 'body' && data.column.index === nbDevises + 2) {
            data.cell.styles.fontStyle = 'bold';
          }
        },
        foot: [[
          { content: t.total, styles: { fontStyle: "bold" as const, halign: "right" as const, fontSize: 10, fillColor: [240, 253, 244], textColor: [22, 163, 74], cellPadding: 2 } },
          { content: grandTotalCount.toString(), styles: { fontStyle: "bold" as const, halign: "center" as const, fontSize: 10, fillColor: [240, 253, 244], textColor: [22, 163, 74], cellPadding: 2 } },
          ...allDevises.map((devise) => ({
            content: formatNumber(deviseStats[devise]),
            styles: { fontStyle: "bold" as const, halign: "right" as const, fontSize: 10, fillColor: [240, 253, 244], textColor: [22, 163, 74], cellPadding: 2 }
          })),
          { content: formatNumber(grandTotalConverti), styles: { fontStyle: "bold" as const, halign: "right" as const, fillColor: [240, 253, 244], textColor: [22, 163, 74], fontSize: 10, cellPadding: 2 } },
        ]],
        footStyles: {
          fillColor: [240, 253, 244],
          textColor: [22, 163, 74],
          minCellHeight: 6,
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // === TABLEAU TAUX DE CHANGE - Style italique taille 9 ===
      // Préparer les données des taux de change (avec devise et taux à 3 décimales)
      const tauxChangeData = allDevises.map((devise) => [
        devise,
        (exchangeRates[devise] || 0).toFixed(3)
      ]);

      // Largeur du tableau: 1/4 de la largeur disponible
      const tauxTableWidth = availableWidth * 0.25;

      autoTable(doc, {
        startY: currentY,
        head: [[{ content: "", styles: { fillColor: [255, 255, 255], lineWidth: 0 } }, t.xof]],
        body: tauxChangeData,
        theme: "striped",
        styles: {
          fontSize: 9,
          fontStyle: 'italic',
          cellPadding: 2,
          lineColor: [226, 232, 240],
          lineWidth: 0.5,
          minCellHeight: 6,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: 'italic',
          halign: "center",
          fontSize: 9,
          cellPadding: 2,
          minCellHeight: 6,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: tauxTableWidth * 0.4, halign: 'center', fontStyle: 'italic', fillColor: [248, 250, 252], textColor: [30, 41, 59] },
          1: { cellWidth: tauxTableWidth * 0.6, halign: 'right', fontStyle: 'italic' }
        },
        margin: { left: marginLeft, right: marginRight },
        tableWidth: tauxTableWidth,
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Forcer le tableau principal à commencer sur une nouvelle page
      doc.addPage();
      currentY = 20; // Réinitialiser à la position de départ

      const tableData = notes.map((note) => [
        (note.Regroupement_Client || "").substring(0, 15),
        (note.Libelle_Regime_Declaration || "").substring(0, 20),
        (note.Pays_Origine || "").substring(0, 15),
        note.HS_Code || "",
        note.Regime || "",
        Number(note.Nbre_Paquetage).toFixed(2),
        note.Code_Devise || "",
        Number(note.Valeur).toFixed(2),
        Number(note.Volume).toFixed(1),
        Number(note.Poids_Brut || 0).toFixed(1),
        Number(note.Poids_Net || 0).toFixed(1),
      ]);

      // === BARRE DE TITRE "DETAILS" ===
      doc.setFillColor(66, 139, 202); // Bleu
      doc.rect(marginLeft, currentY, availableWidth, 8, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(t.details, marginLeft + 2, currentY + 5.5);
      doc.setTextColor(0, 0, 0);
      currentY += 10;

      // === TABLEAU DES DONNÉES DÉTAILLÉES ===
      autoTable(doc, {
        startY: currentY,
        margin: { left: marginLeft, right: marginRight },
        tableWidth: availableWidth,
        head: [
          [
            t.grouping,
            t.regimeDecl,
            t.originCountry,
            t.hsCode,
            "",
            t.nbPackages,
            t.currency,
            t.value,
            t.volumeCol,
            t.grossWeightCol,
            t.netWeightCol,
          ],
        ],
        body: tableData,
        styles: {
          fontSize: 10,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          overflow: "linebreak",
          halign: "left",
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
          2: { halign: "center" }, // Régime
          4: { halign: "center" }, // HS Code
          5: { halign: "right" }, // Nbre Paq.
          6: { halign: "center" }, // Devise
          7: { halign: "right" }, // Valeur
          8: { halign: "right" }, // Volume
          9: { halign: "right" }, // Poids Brut
          10: { halign: "right" }, // Poids Net
        },
      });

      // === PIED DE PAGE ===
      const totalPages = doc.internal.pages.length - 1; // -1 car le premier élément est vide
      const pageHeight = doc.internal.pageSize.height;

      // Ajouter le pied de page uniquement sur la dernière page
      doc.setPage(totalPages);
      
      // Ligne de séparation
      doc.setDrawColor(200, 200, 200);
      doc.line(14, pageHeight - 20, 283, pageHeight - 20);

      // Informations de pied de page
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        t.copyright,
        14,
        pageHeight - 10,
      );

      // Numéro de page (côté droit)
      doc.text(`${t.page} ${totalPages}/${totalPages}`, 270, pageHeight - 10);

      doc.save(
        `note-details-dossier-${dossierName}-${language}-${new Date().toISOString().split("T")[0]}.pdf`,
      );
      toast.success(`Export PDF réussi (${language === 'fr' ? 'Français' : 'English'})`);
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
      console.error(error);
    }
  };

  const columns: ColumnDef<any>[] = [
    // 1. Groupement
    {
      accessorKey: "Regroupement_Client",
      header: "Groupement",
      cell: ({ row }) => {
        const groupement = row.getValue("Regroupement_Client") as string;
        return (
          <div className="text-xs" title={groupement}>
            {groupement || "-"}
          </div>
        );
      },
    },
    // 2. Régime déclaration
    {
      accessorKey: "Libelle_Regime_Declaration",
      header: "Régime Décl.",
      cell: ({ row }) => {
        const libelle = row.getValue("Libelle_Regime_Declaration") as string;
        return (
          <div className="max-w-xs truncate text-xs" title={libelle}>
            {libelle || "-"}
          </div>
        );
      },
    },
    // 3. Pays d'origine
    {
      accessorKey: "Pays_Origine",
      header: "Pays d'origine",
      cell: ({ row }) => {
        const pays = row.getValue("Pays_Origine") as string;
        return (
          <div className="text-xs" title={pays}>
            {pays || "-"}
          </div>
        );
      },
    },
    // 4. HS Code
    {
      accessorKey: "HS_Code",
      header: "HS Code",
      cell: ({ row }) => {
        const hsCode = row.getValue("HS_Code") as string;
        return (
          <div className="text-xs font-mono" title={hsCode}>
            {hsCode || "-"}
          </div>
        );
      },
    },
    // 5. Régime
    {
      accessorKey: "Regime",
      header: "-",
      cell: ({ row }) => {
        const regime = row.getValue("Regime") as string;
        const color =
          regime === "DC"
            ? "bg-red-100 text-red-800"
            : regime === "TR"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800";
        return <Badge className={color}>{regime || ""}</Badge>;
      },
    },
    // 6. Nbre Paquetage
    {
      accessorKey: "Nbre_Paquetage",
      header: "Nbre Paq.",
      cell: ({ row }) => {
        const nbre = row.getValue("Nbre_Paquetage") as number;
        return Number(nbre).toFixed(2);
      },
    },
    // 7. Devise
    {
      accessorKey: "Code_Devise",
      header: "Devise",
      cell: ({ row }) => {
        const devise = row.getValue("Code_Devise") as string;
        return (
          <Badge variant="outline" className="text-xs">
            {devise || "-"}
          </Badge>
        );
      },
    },
    // 8. Valeur
    {
      accessorKey: "Valeur",
      header: "Valeur",
      cell: ({ row }) => {
        const valeur = row.getValue("Valeur") as number;
        return (
          <div className="font-semibold text-green-700 text-xs">
            {Number(valeur).toFixed(2)}
          </div>
        );
      },
    },
    // 9. Volume
    {
      accessorKey: "Poids_Brut",
      header: "Poids Brut",
      cell: ({ row }) => {
        const poids = row.getValue("Poids_Brut") as number;
        return `${Number(poids || 0).toFixed(2)} kg`;
      },
    },
    // 11. Poids Net
    {
      accessorKey: "Poids_Net",
      header: "Poids Net",
      cell: ({ row }) => {
        const poids = row.getValue("Poids_Net") as number;
        return `${Number(poids || 0).toFixed(2)} kg`;
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingState
          title="Chargement de la note de détails..."
          description="Veuillez patienter..."
        />
      </div>
    );
  }
  return (
    <>
      <DeleteConfirmation />
      <GenererNotesDialog
        open={showGenererDialog}
        onOpenChange={(open) => {
          setShowGenererDialog(open);
          if (!open) {
            loadNotes();
          }
        }}
        dossierId={dossierId}
        entiteId={entiteId}
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Note de Détails</p>
            <p className="text-xs text-muted-foreground">
              Générez la note de détails à partir des colisages et régimes de
              déclaration
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notes.length > 0 && (
              <>
                <Button
                  onClick={loadNotes}
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isDeleting}>
                      <Download className="w-4 h-4" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToExcel}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => exportToPDF('fr')}>
                          🇫🇷 Français
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToPDF('en')}>
                          🇬🇧 English
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={exportToCSV}>
                      <FileDown className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </>
                  )}
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowGenererDialog(true)}
              disabled={isDeleting}
              size="sm"
            >
              <FileText className="w-4 h-4" />
              {notes.length > 0 ? "Régénérer" : "Générer"}
            </Button>
          </div>
        </div>

        {notes.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Lignes</p>
                  <p className="text-2xl font-bold">{notes.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TTC</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {notes.filter((n) => n.Regime === "TTC").length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">100% TR</p>
                  <p className="text-2xl font-bold text-green-600">
                    {notes.filter((n) => n.Regime === "100% TR").length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">100% DC</p>
                  <p className="text-2xl font-bold text-red-600">
                    {notes.filter((n) => n.Regime === "100% DC").length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">EXO</p>
                  <p className="text-2xl font-bold text-zinc-600">
                    {notes.filter((n) => n.Regime === "EXO").length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ratios</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {notes.filter((n) => {
                      const regime = n.Regime || "";
                      return regime.includes("%") && !regime.includes("100%");
                    }).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Paquetages
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {notes
                          .reduce(
                            (sum, n) => sum + Number(n.Nbre_Paquetage || 0),
                            0,
                          )
                          .toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Poids Total</p>
                  <p className="text-2xl font-bold">
                    {notes
                          .reduce(
                            (sum, n) => sum + Number(n.Poids_Brut || 0),
                            0,
                          )
                          .toFixed(2)}{" "}
                    kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {notes
                      .reduce((sum, n) => sum + Number(n.Volume || 0), 0)
                      .toFixed(1)}{" "}
                    m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valeur Totale</p>
                  <p className="text-2xl font-bold text-green-600">
                    {notes
                      .reduce((sum, n) => sum + Number(n.Valeur || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {notes.length > 0 ? (
          <DataTable
            columns={columns}
            data={notes}
            searchKey="Libelle_Regime_Declaration"
            searchPlaceholder="Rechercher par régime déclaration..."
          />
        ) : (
          <EmptyState
            title="Aucune note de détails"
            description="Cliquez sur 'Générer' pour créer la note de détails à partir des colisages"
          />
        )}
      </div>
    </>
  );
};


