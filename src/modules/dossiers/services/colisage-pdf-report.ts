import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ColisageData {
  ID_Colisage_Dossier: number;
  HS_Code?: string;
  Description_Colis?: string;
  No_Commande?: string;
  Nom_Fournisseur?: string;
  No_Facture?: string;
  Item_No?: string;
  Code_Devise?: string;
  Qte_Colis?: number;
  Prix_Unitaire_Colis?: number;
  Poids_Brut?: number;
  Poids_Net?: number;
  Volume?: number;
  Pays_Origine?: string;
  Libelle_Regime_Douanier?: string;
  Libelle_Regime_Declaration?: string;
  Regroupement_Client?: string;
  UploadKey?: string;
  Date_Creation?: string;
}

interface DossierInfo {
  id: number;
  noDossier?: string;
  noOT?: string;
  nomClient?: string;
  descriptionDossier?: string;
  nbrePaquetagesPesee?: number;
  poidsBrutPesee?: number;
  poidsNetPesee?: number;
  volumePesee?: number;
}

export class ColisagePDFReport {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = this.margin;
  }

  private formatNumber(value: any): string {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    
    // Utiliser toLocaleString pour un formatage natif avec séparateurs
    // 'en-US' utilise des virgules comme séparateurs et un point pour les décimales
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private formatDate(date: any): string {
    if (!date) return '-';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  }

  private async addHeader(dossierInfo: DossierInfo) {
    // === EN-TÊTE AVEC LOGO ===
    // Bordure d'en-tête
    this.doc.setDrawColor(66, 139, 202);
    this.doc.setLineWidth(0.5);
    this.doc.line(14, 8, this.pageWidth - 14, 8);
    this.doc.line(14, 32, this.pageWidth - 14, 32);

    // Essayer d'ajouter le logo
    try {
      const logoResponse = await fetch("/logo.jpeg");
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });

        // Ajouter le logo
        this.doc.addImage(logoBase64, "JPEG", 16, 10, 20, 20);
      } else {
        throw new Error("Logo non trouvé");
      }
    } catch (error) {
      // Fallback sans logo
      this.doc.setFontSize(18);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(66, 139, 202);
      this.doc.text("SFX PRE-DOUANE", 16, 20);
    }

    // === TITRE ET INFORMATIONS ===
    // Titre principal centré (décalé de 1.5cm à gauche)
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    const titleWidth = this.doc.getTextWidth("RAPPORT DE COLISAGE PAR FACTURE");
    this.doc.text("RAPPORT DE COLISAGE PAR FACTURE", ((this.pageWidth - titleWidth) / 2) - 15, 18);

    // Informations du dossier (côté droit - aligné à gauche)
    const rightX = this.pageWidth - 77;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(66, 139, 202);
    
    const dossierText = `DOSSIER: ${dossierInfo.noDossier || dossierInfo.noOT || dossierInfo.id}`;
    this.doc.text(dossierText, rightX, 15);

    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    
    const dateText = `Date d'export: ${new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`;
    this.doc.text(dateText, rightX, 20);
    
    const timeText = `Heure: ${new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    this.doc.text(timeText, rightX, 25);

    if (dossierInfo.nomClient) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`Client: ${dossierInfo.nomClient}`, rightX, 30);
    }
    
    this.currentY = 40;
  }

  private addSummary(dossierInfo: DossierInfo, colisages: ColisageData[]) {
    // Vérifier si on a assez de place (environ 60mm nécessaires)
    if (this.currentY > this.pageHeight - 70) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Titre avec style ultra professionnel - BLEU
    this.doc.setFillColor(52, 152, 219);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 10, 'F');
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("SYNTHESE COLISAGE", this.margin + 5, this.currentY + 6.5);
    this.currentY += 12;

    // Utiliser les valeurs du dossier pour les totaux
    const totalColisages = dossierInfo.nbrePaquetagesPesee || 0;
    const totalPoidsBrut = Number(dossierInfo.poidsBrutPesee || 0);
    const totalPoidsNet = Number(dossierInfo.poidsNetPesee || 0);
    const totalVolume = Number(dossierInfo.volumePesee || 0);

    // Statistiques pour ligne 2
    const factures = [...new Set(colisages.map(c => c.No_Facture).filter(f => f))];
    const totalFactures = factures.length;
    
    const hsCodes = colisages.map(c => c.HS_Code).filter(h => h);
    const totalHSCodes = hsCodes.length;
    const hsCodesUniques = [...new Set(hsCodes)];
    const totalHSCodesDifferents = hsCodesUniques.length;
    
    const totalLignes = colisages.length;
    
    const sites = [...new Set(colisages.map(c => c.Regroupement_Client).filter(s => s))];
    const totalSites = sites.length;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");

    // Tableau de résumé - Ligne 1
    const summaryData1 = [
      ['Nbre paquetages Pesée', totalColisages.toString()],
      ['Poids Brut Pesée (kg)', this.formatNumber(totalPoidsBrut)],
      ['Total poids net (kg)', this.formatNumber(totalPoidsNet)],
      ['Total volume (m³)', this.formatNumber(totalVolume)],
    ];

    // Tableau de résumé - Ligne 2
    const summaryData2 = [
      ['Nbre facture', totalFactures.toString()],
      ['Nbre de HS CODE', totalHSCodes.toString()],
      ['Nbre de HS CODE DIFFERENTS', totalHSCodesDifferents.toString()],
      ['Nbre de ligne', totalLignes.toString()],
      ['Nbre de site', totalSites.toString()],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Indicateur', 'Valeur']],
      body: summaryData1,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Indicateur', 'Valeur']],
      body: summaryData2,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  private addColisagesByGroup(colisages: ColisageData[]) {
    // Forcer le passage à la page 2 pour DETAIL FACTURE
    this.doc.addPage();
    this.currentY = this.margin;

    // Ajouter le bloc DETAIL FACTURE
    this.doc.setFillColor(52, 152, 219);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 10, 'F');
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("DETAIL FACTURE", this.margin + 5, this.currentY + 6.5);
    this.currentY += 12;

    const groupedData = colisages.reduce((acc, colisage) => {
      const fournisseur = colisage.Nom_Fournisseur || 'Fournisseur non spécifié';
      const regroupement = colisage.Regroupement_Client || 'Sans regroupement';
      
      if (!acc[fournisseur]) {
        acc[fournisseur] = {};
      }
      if (!acc[fournisseur][regroupement]) {
        acc[fournisseur][regroupement] = [];
      }
      
      acc[fournisseur][regroupement].push(colisage);
      return acc;
    }, {} as Record<string, Record<string, ColisageData[]>>);

    Object.entries(groupedData).forEach(([fournisseur, regroupements]) => {
      // Vérifier si on a assez de place (1cm = 10mm de la fin)
      if (this.currentY > this.pageHeight - 10) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(41, 128, 185);
      this.doc.text(`FOURNISSEUR: ${fournisseur.toUpperCase()}`, this.margin, this.currentY);
      this.currentY += 10;

      Object.entries(regroupements).forEach(([regroupement, colisagesGroup]) => {
        // Regrouper par facture dans ce regroupement
        const facturesInGroup = colisagesGroup.reduce((acc, colisage) => {
          const numeroFacture = colisage.No_Facture || 'Sans numéro de facture';
          const numeroCommande = colisage.No_Commande || 'Sans numéro de commande';
          
          const key = `${numeroFacture}|${numeroCommande}`;
          if (!acc[key]) {
            acc[key] = { facture: numeroFacture, commande: numeroCommande, items: [] };
          }
          acc[key].items.push(colisage);
          return acc;
        }, {} as Record<string, { facture: string; commande: string; items: ColisageData[] }>);

        Object.entries(facturesInGroup).forEach(([key, factureData]) => {
          // Vérifier si on a assez de place (1cm = 10mm de la fin)
          if (this.currentY > this.pageHeight - 10) {
            this.doc.addPage();
            this.currentY = this.margin;
          }

          // Facture, Commande et Nbre Ligne sur la même ligne
          this.doc.setFillColor(245, 245, 245);
          this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 8, 'F');
          
          // Bordure gauche colorée pour l'accent
          this.doc.setFillColor(46, 125, 50);
          this.doc.rect(this.margin, this.currentY, 3, 8, 'F');
          
          this.doc.setFontSize(9);
          this.doc.setFont("helvetica", "bold");
          this.doc.setTextColor(50, 50, 50);
          
          let currentX = this.margin + 8;
          
          // Facture N°:
          this.doc.text(`Facture N°: ${factureData.facture}`, currentX, this.currentY + 5.5);
          currentX += this.doc.getTextWidth(`Facture N°: ${factureData.facture}`) + 10;
          
          // Commande N°:
          this.doc.text(`Commande N°: ${factureData.commande}`, currentX, this.currentY + 5.5);
          currentX += this.doc.getTextWidth(`Commande N°: ${factureData.commande}`) + 10;
          
          // Nbre Ligne:
          const nbreLignes = factureData.items.length;
          this.doc.text(`Nbre Ligne: ${nbreLignes}`, currentX, this.currentY + 5.5);
          
          this.currentY += 10;

        const tableData = factureData.items.map(c => [
          c.Item_No || '-',
          (c.Description_Colis || '').substring(0, 30),
          c.HS_Code || '-',
          (c.Libelle_Regime_Declaration || '').substring(0, 15),
          this.formatNumber(c.Qte_Colis),
          this.formatNumber(c.Poids_Brut),
          this.formatNumber(c.Volume),
        ]);

        autoTable(this.doc, {
          startY: this.currentY,
          head: [['Item', 'Description', 'HS Code', 'Régime', 'Qté', 'Poids (kg)', 'Volume (m³)']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 11 },
          bodyStyles: { fontSize: 10 },
          margin: { left: this.margin, right: this.margin },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
      });
    });
  });
    
    // === SYNTHESE PAR DEVISE (À LA FIN DE TOUS LES TABLEAUX) ===
    // Calculer les totaux par régime et devise pour TOUS les colisages
    const regimeDeviseMap = new Map<string, Map<string, { quantite: number; valeur: number; count: number }>>();
    const allDevises = new Set<string>();
    
    colisages.forEach(c => {
      const regime = c.Libelle_Regime_Declaration || 'Non défini';
      const devise = c.Code_Devise || 'N/A';
      const qte = Number(c.Qte_Colis || 0);
      const valeur = qte * Number(c.Prix_Unitaire_Colis || 0);
      
      allDevises.add(devise);
      
      if (!regimeDeviseMap.has(regime)) {
        regimeDeviseMap.set(regime, new Map());
      }
      
      const regimeMap = regimeDeviseMap.get(regime)!;
      if (!regimeMap.has(devise)) {
        regimeMap.set(devise, { quantite: 0, valeur: 0, count: 0 });
      }
      
      const current = regimeMap.get(devise)!;
      current.quantite += qte;
      current.valeur += valeur;
      current.count += 1;
    });

    // Afficher le bloc SYNTHESE PAR DEVISE
    if (regimeDeviseMap.size > 0 && allDevises.size > 0) {
      // FORCER UNE NOUVELLE PAGE pour éviter que le bloc soit coupé
      this.doc.addPage();
      this.currentY = this.margin;
      
      // Titre du bloc
      this.doc.setFillColor(52, 152, 219);
      this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 10, 'F');
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text("SYNTHESE PAR DEVISE", this.margin + 5, this.currentY + 6.5);
      this.currentY += 12;

      // Préparer les données du tableau
      const deviseArray = Array.from(allDevises).sort();
      const tableData: any[] = [];
      
      regimeDeviseMap.forEach((deviseMap, regime) => {
        const row: any[] = [];
        
        // Première colonne : le régime
        row.push(regime);
        
        // Deuxième colonne : le nombre de lignes pour ce régime
        let totalCount = 0;
        deviseMap.forEach(data => {
          totalCount += data.count;
        });
        row.push(totalCount.toString());
        
        // Colonnes suivantes : les valeurs pour chaque devise
        deviseArray.forEach(devise => {
          const data = deviseMap.get(devise);
          if (data && data.valeur > 0) {
            row.push(this.formatNumber(data.valeur));
          } else {
            row.push('-');
          }
        });
        
        tableData.push(row);
      });

      // Créer l'en-tête du tableau principal
      const availableWidth = this.pageWidth - (this.margin * 2);
      const mainTableWidth = availableWidth * 0.55; // 55% pour le tableau principal
      const sideTableWidth = availableWidth * 0.40; // 40% pour le nouveau tableau
      const tableSpacing = availableWidth * 0.05; // 5% d'espacement
      
      const headers = [
        { content: '', styles: { fillColor: [255, 255, 255] as [number, number, number], lineWidth: 0 } },
        { content: 'Rows count', styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 11, cellPadding: 2 } },
        ...deviseArray.map(devise => ({ 
          content: devise, 
          styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 11, cellPadding: 2 } 
        }))
      ];

      // Calculer les largeurs de colonnes pour le tableau principal
      const regimeColWidth = mainTableWidth * 0.25;
      const countColWidth = mainTableWidth * 0.15;
      const deviseColWidth = (mainTableWidth - regimeColWidth - countColWidth) / deviseArray.length;

      autoTable(this.doc, {
        startY: this.currentY,
        head: [headers],
        body: tableData,
        theme: 'striped',
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
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2,
          minCellHeight: 6,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: regimeColWidth, halign: 'left', fontStyle: 'bold', fillColor: [248, 250, 252] },
          1: { cellWidth: countColWidth, halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] },
          // Les colonnes de devises
          ...Object.fromEntries(
            deviseArray.map((_, index) => [
              index + 2,
              { cellWidth: deviseColWidth, halign: 'right' }
            ])
          )
        },
        margin: { left: this.margin, right: this.margin },
        tableWidth: mainTableWidth,
        didParseCell: (data: any) => {
          // La première colonne du body contient les régimes
          if (data.section === 'body' && data.column.index === 0) {
            data.cell.styles.fontStyle = 'bold';
          }
          // La deuxième colonne du body contient Row count
          if (data.section === 'body' && data.column.index === 1) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      const mainTableFinalY = (this.doc as any).lastAutoTable.finalY;

      // === NOUVEAU TABLEAU : DEVISES ET ROWS COUNT (À DROITE) ===
      // Calculer les totaux par devise
      const deviseCountMap = new Map<string, number>();
      colisages.forEach(c => {
        const devise = c.Code_Devise || 'N/A';
        deviseCountMap.set(devise, (deviseCountMap.get(devise) || 0) + 1);
      });

      // Préparer les données du tableau des devises
      const deviseTableData: any[] = [];
      Array.from(deviseCountMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([devise, count]) => {
          deviseTableData.push([devise, count.toString()]);
        });

      // Position du nouveau tableau (à droite du premier)
      const sideTableX = this.margin + mainTableWidth + tableSpacing;

      autoTable(this.doc, {
        startY: this.currentY,
        head: [
          [
            { content: 'Devises', styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 11, cellPadding: 2 } },
            { content: 'Rows Count', styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 11, cellPadding: 2 } }
          ]
        ],
        body: deviseTableData,
        theme: 'striped',
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
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2,
          minCellHeight: 6,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: sideTableWidth * 0.6, halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] },
          1: { cellWidth: sideTableWidth * 0.4, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: sideTableX, right: this.margin },
        tableWidth: sideTableWidth,
      });

      this.currentY = Math.max(mainTableFinalY, (this.doc as any).lastAutoTable.finalY) + 15;
    }
  }

  private addFooter() {
    const pageCount = (this.doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(120, 120, 120);
      
      // Copyright uniquement sur la dernière page
      if (i === pageCount) {
        const copyrightText = "©Copyright Softronic Innoving";
        this.doc.text(copyrightText, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
      }
      
      // Numéro de page à droite sur toutes les pages
      const pageText = `Page ${i} sur ${pageCount}`;
      this.doc.text(pageText, this.pageWidth - this.margin - 20, this.pageHeight - 10);
    }
  }

  public async generateReport(dossierInfo: DossierInfo, colisages: ColisageData[]): Promise<void> {
    try {
      if (!colisages || colisages.length === 0) {
        throw new Error('Aucun colisage à inclure dans le rapport');
      }

      await this.addHeader(dossierInfo);
      this.addSummary(dossierInfo, colisages);
      this.addColisagesByGroup(colisages);
      this.addFooter();
      
      const fileName = `Rapport_Colisages_Facture_${dossierInfo.noDossier || dossierInfo.noOT || dossierInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }
}
