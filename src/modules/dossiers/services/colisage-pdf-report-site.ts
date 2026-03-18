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

export class ColisagePDFReportSite {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number = 15;
  private usableWidth: number;
  private language: 'fr' | 'en' = 'fr';

  // Traductions complètes
  private translations = {
    fr: {
      title: "RAPPORT DE COLISAGE PAR SITE",
      dossier: "DOSSIER:",
      exportDate: "Date d'export:",
      time: "Heure:",
      client: "Client:",
      syntheseColisage: "SYNTHESE COLISAGE",
      totalQte: "TOTAL QTE",
      totalPoidsBrut: "TOTAL POIDS BRUT PESÉE (KG)",
      totalPoidsNet: "TOTAL POIDS NET (KG)",
      totalVolume: "TOTAL VOLUME (M³)",
      nbreFacture: "NBRE FACTURE",
      nbreHsCode: "NBRE HS CODE",
      nbreHsCodeDiff: "NBRE HS CODE DIFF",
      nbreLigne: "NBRE LIGNE",
      nbreSite: "NBRE SITE",
      detailFacture: "DETAIL SITE",
      fournisseur: "FOURNISSEUR:",
      factureNo: "Facture N°:",
      commandeNo: "Commande N°:",
      nbreLigneLabel: "Nbre Ligne:",
      itemNo: "Item No",
      description: "Description",
      hsCode: "HS Code",
      regime: "Régime",
      quantite: "Quantité",
      prixUnit: "Prix Unit.",
      volume: "Volume",
      paysOrigine: "Pays d'Origine",
      total: "TOTAL",
      syntheseParDevise: "SYNTHESE PAR DEVISE",
      rowCount: "Rows count",
      copyright: "©Copyright Softronic Innoving",
      page: "Page",
      sur: "sur",
    },
    en: {
      title: "PACKING REPORT BY SITE",
      dossier: "FILE:",
      exportDate: "Export date:",
      time: "Time:",
      client: "Client:",
      syntheseColisage: "PACKING SUMMARY",
      totalQte: "TOTAL QTY",
      totalPoidsBrut: "TOTAL GROSS WEIGHT WEIGHED (KG)",
      totalPoidsNet: "TOTAL NET WEIGHT (KG)",
      totalVolume: "TOTAL VOLUME (M³)",
      nbreFacture: "NB INVOICE",
      nbreHsCode: "NB HS CODE",
      nbreHsCodeDiff: "NB HS CODE DIFF",
      nbreLigne: "NB LINE",
      nbreSite: "NB SITE",
      detailFacture: "SITE DETAIL",
      fournisseur: "SUPPLIER:",
      factureNo: "Invoice No:",
      commandeNo: "Order No:",
      nbreLigneLabel: "Nb Lines:",
      itemNo: "Item No",
      description: "Description",
      hsCode: "HS Code",
      regime: "Regime",
      quantite: "Quantity",
      prixUnit: "Unit Price",
      volume: "Volume",
      paysOrigine: "Origin Country",
      total: "TOTAL",
      syntheseParDevise: "SUMMARY BY CURRENCY",
      rowCount: "Rows count",
      copyright: "©Copyright Softronic Innoving",
      page: "Page",
      sur: "of",
    },
  };

  constructor() {
    this.doc = new jsPDF('landscape', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = this.margin;
    this.usableWidth = this.pageWidth - (this.margin * 2);
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

  private async addHeaderWithLogo(dossierInfo: DossierInfo, language: 'fr' | 'en' = 'fr') {
    this.language = language;
    const t = this.translations[language];

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
    const titleWidth = this.doc.getTextWidth(t.title);
    this.doc.text(t.title, ((this.pageWidth - titleWidth) / 2) - 15, 18);

    // Informations du dossier (extrême droite - aligné à gauche)
    const rightX = this.pageWidth - 90;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(66, 139, 202);
    
    const dossierText = `${t.dossier} ${dossierInfo.noDossier || dossierInfo.noOT || dossierInfo.id}`;
    this.doc.text(dossierText, rightX, 15);

    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(0, 0, 0);
    
    const dateText = `${t.exportDate} ${new Date().toLocaleDateString(language === 'fr' ? "fr-FR" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`;
    this.doc.text(dateText, rightX, 20);
    
    const timeText = `${t.time} ${new Date().toLocaleTimeString(language === 'fr' ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    this.doc.text(timeText, rightX, 25);

    if (dossierInfo.nomClient) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`${t.client} ${dossierInfo.nomClient}`, rightX, 30);
    }
    
    this.currentY = 40;
  }

  private addSummary(dossierInfo: DossierInfo, colisages: ColisageData[]) {
    const t = this.translations[this.language];
    
    // Vérifier si on a assez de place (environ 60mm nécessaires)
    if (this.currentY > this.pageHeight - 70) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Titre avec style ultra professionnel - BLEU
    this.doc.setFillColor(52, 152, 219);
    this.doc.rect(this.margin, this.currentY, this.usableWidth, 10, 'F');
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(t.syntheseColisage, this.margin + 5, this.currentY + 6.5);
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

    // Créer des cartes visuelles pour les métriques principales (ligne 1)
    const cardWidth = (this.usableWidth - 15) / 4;
    const cardHeight = 22;
    const cardY = this.currentY;
    
    // Carte 1: Total Qte (nombre de colisage)
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.totalQte, this.margin + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalColisages.toString(), this.margin + cardWidth / 2, cardY + 15, { align: 'center' });
    
    // Carte 2: Total poids brut (kg)
    const card2X = this.margin + cardWidth + 5;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.totalPoidsBrut, card2X + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(this.formatNumber(totalPoidsBrut), card2X + cardWidth / 2, cardY + 15, { align: 'center' });
    
    // Carte 3: Total poids net (kg)
    const card3X = this.margin + (cardWidth + 5) * 2;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.totalPoidsNet, card3X + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(this.formatNumber(totalPoidsNet), card3X + cardWidth / 2, cardY + 15, { align: 'center' });
    
    // Carte 4: Total volume (m³)
    const card4X = this.margin + (cardWidth + 5) * 3;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.totalVolume, card4X + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(this.formatNumber(totalVolume), card4X + cardWidth / 2, cardY + 15, { align: 'center' });
    
    this.currentY += cardHeight + 8;
    
    // Deuxième ligne de cartes: 5 cartes avec largeur ajustée
    const card2Y = this.currentY;
    const cardWidth2 = (this.usableWidth - 20) / 5;
    
    // Carte 5: Nbre facture
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin, card2Y, cardWidth2, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, card2Y, cardWidth2, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.nbreFacture, this.margin + cardWidth2 / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalFactures.toString(), this.margin + cardWidth2 / 2, card2Y + 15, { align: 'center' });
    
    // Carte 6: Nbre de HS CODE
    const card6X = this.margin + cardWidth2 + 5;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card6X, card2Y, cardWidth2, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card6X, card2Y, cardWidth2, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.nbreHsCode, card6X + cardWidth2 / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalHSCodes.toString(), card6X + cardWidth2 / 2, card2Y + 15, { align: 'center' });
    
    // Carte 7: Nbre de HS CODE DIFFERENTS
    const card7X = this.margin + (cardWidth2 + 5) * 2;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card7X, card2Y, cardWidth2, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card7X, card2Y, cardWidth2, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.nbreHsCodeDiff, card7X + cardWidth2 / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalHSCodesDifferents.toString(), card7X + cardWidth2 / 2, card2Y + 15, { align: 'center' });
    
    // Carte 8: Nbre de ligne
    const card8X = this.margin + (cardWidth2 + 5) * 3;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card8X, card2Y, cardWidth2, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card8X, card2Y, cardWidth2, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.nbreLigne, card8X + cardWidth2 / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalLignes.toString(), card8X + cardWidth2 / 2, card2Y + 15, { align: 'center' });
    
    // Carte 9: Nbre de site
    const card9X = this.margin + (cardWidth2 + 5) * 4;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card9X, card2Y, cardWidth2, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card9X, card2Y, cardWidth2, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(t.nbreSite, card9X + cardWidth2 / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalSites.toString(), card9X + cardWidth2 / 2, card2Y + 15, { align: 'center' });
    
    this.currentY += cardHeight + 15;
  }

  private addColisagesByGroup(colisages: ColisageData[]) {
    const t = this.translations[this.language];
    
    // Forcer le passage à la page 2 pour DETAIL FACTURE
    this.doc.addPage();
    this.currentY = this.margin;

    // Ajouter le bloc DETAIL FACTURE
    this.doc.setFillColor(52, 152, 219);
    this.doc.rect(this.margin, this.currentY, this.usableWidth, 10, 'F');
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(t.detailFacture, this.margin + 5, this.currentY + 6.5);
    this.currentY += 12;

    // Regrouper par SITE (Regroupement_Client)
    const groupedBySite = colisages.reduce((acc, colisage) => {
      const site = colisage.Regroupement_Client || 'Site non spécifié';
      
      if (!acc[site]) {
        acc[site] = [];
      }
      
      acc[site].push(colisage);
      return acc;
    }, {} as Record<string, ColisageData[]>);

    Object.entries(groupedBySite).forEach(([site, colisagesGroup]) => {
      // Vérifier si on a assez de place pour le groupe (1cm = 10mm de la fin)
      if (this.currentY > this.pageHeight - 10) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      // Titre du SITE avec style professionnel
      this.doc.setFillColor(70, 70, 70);
      this.doc.rect(this.margin, this.currentY, this.usableWidth, 10, 'F');
      
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(site.toUpperCase(), this.margin + 5, this.currentY + 6.5);
      this.currentY += 12;

      // Trier les colisages par fournisseur pour les regrouper visuellement
      const colisagesSorted = colisagesGroup.sort((a, b) => {
        const fournisseurA = a.Nom_Fournisseur || '';
        const fournisseurB = b.Nom_Fournisseur || '';
        return fournisseurA.localeCompare(fournisseurB);
      });

      // Préparer les données du tableau avec toutes les lignes du site
      const tableData = colisagesSorted.map(colisage => [
        colisage.Nom_Fournisseur || '-',
        colisage.No_Commande || '-',
        colisage.No_Facture || '-',
        colisage.Item_No || '-',
        (colisage.Description_Colis || '').substring(0, 35),
        colisage.HS_Code || '-',
        (colisage.Libelle_Regime_Declaration || '').substring(0, 20),
        this.formatNumber(colisage.Qte_Colis),
        `${this.formatNumber(colisage.Prix_Unitaire_Colis)} ${colisage.Code_Devise || ''}`,
        this.formatNumber(colisage.Volume),
        colisage.Pays_Origine || '-',
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [[
          this.language === 'fr' ? 'Fournisseur' : 'Supplier',
          t.commandeNo.replace(':', ''),
          t.factureNo.replace(':', ''),
          t.itemNo,
          t.description,
          t.hsCode,
          t.regime,
          t.quantite,
          t.prixUnit,
          t.volume,
          t.paysOrigine
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [52, 152, 219], 
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 1.5,
          halign: 'center',
          valign: 'middle',
          overflow: 'visible'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'left', overflow: 'linebreak' },    // Fournisseur - 30mm
          1: { cellWidth: 'auto', halign: 'center' },
          2: { cellWidth: 'auto', halign: 'center' },
          3: { cellWidth: 'auto', halign: 'center' },
          4: { cellWidth: 'auto', halign: 'left' },
          5: { cellWidth: 'auto', halign: 'center' },
          6: { cellWidth: 'wrap', halign: 'left', overflow: 'visible' },    // Régime - s'adapte au contenu
          7: { cellWidth: 'auto', halign: 'right' },
          8: { cellWidth: 'auto', halign: 'right' },
          9: { cellWidth: 'auto', halign: 'right' },
          10: { cellWidth: 20, halign: 'center', overflow: 'linebreak' },    // Pays d'Origine - 20mm avec retour à la ligne
        },
        margin: { left: this.margin, right: this.margin },
        tableWidth: this.usableWidth,
        pageBreak: 'auto'
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
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
      this.doc.rect(this.margin, this.currentY, this.usableWidth, 10, 'F');
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(t.syntheseParDevise, this.margin + 5, this.currentY + 6.5);
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
            const formatted = this.formatNumber(data.valeur);
            console.log(`💰 Devise ${devise}: ${data.valeur} → ${formatted}`);
            row.push(formatted);
          } else {
            row.push('-');
          }
        });
        
        tableData.push(row);
      });

      // Créer l'en-tête du tableau principal
      const mainTableWidth = this.usableWidth * 0.55; // 55% pour le tableau principal
      const sideTableWidth = this.usableWidth * 0.40; // 40% pour le nouveau tableau
      const tableSpacing = this.usableWidth * 0.05; // 5% d'espacement
      
      const headers = [
        { content: '', styles: { fillColor: [255, 255, 255] as [number, number, number], lineWidth: 0 } },
        { content: t.rowCount, styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 10, cellPadding: 2 } },
        ...deviseArray.map(devise => ({ 
          content: devise, 
          styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 10, cellPadding: 2 } 
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
        didDrawCell: (data: any) => {
          // Forcer le formatage des valeurs numériques dans les colonnes de devises
          if (data.section === 'body' && data.column.index >= 2) {
            const cellValue = tableData[data.row.index][data.column.index];
            if (cellValue && cellValue !== '-') {
              // Le texte est déjà formaté par formatNumber, pas besoin de reformater
            }
          }
        },
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

      // Traductions pour les en-têtes du nouveau tableau
      const deviseHeader = this.language === 'fr' ? 'Devises' : 'Currencies';
      const rowsCountHeader = this.language === 'fr' ? 'Rows Count' : 'Rows Count';

      autoTable(this.doc, {
        startY: this.currentY,
        head: [
          [
            { content: deviseHeader, styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 10, cellPadding: 2 } },
            { content: rowsCountHeader, styles: { halign: 'center' as const, fillColor: [66, 139, 202] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 10, cellPadding: 2 } }
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
    const t = this.translations[this.language];
    const pageCount = (this.doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(120, 120, 120);
      
      // Copyright uniquement sur la dernière page
      if (i === pageCount) {
        const copyrightText = t.copyright;
        this.doc.text(copyrightText, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
      }
      
      // Numéro de page à droite sur toutes les pages
      const pageText = `${t.page} ${i} ${t.sur} ${pageCount}`;
      this.doc.text(pageText, this.pageWidth - this.margin - 20, this.pageHeight - 10);
    }
  }

  public async generateReport(dossierInfo: DossierInfo, colisages: ColisageData[], language: 'fr' | 'en' = 'fr'): Promise<void> {
    try {
      if (!colisages || colisages.length === 0) {
        throw new Error('Aucun colisage à inclure dans le rapport');
      }

      this.language = language;
      await this.addHeaderWithLogo(dossierInfo, language);
      this.addSummary(dossierInfo, colisages);
      this.addColisagesByGroup(colisages);
      this.addFooter();
      
      const fileName = `Rapport_Colisages_Site_${dossierInfo.noDossier || dossierInfo.noOT || dossierInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }
}
