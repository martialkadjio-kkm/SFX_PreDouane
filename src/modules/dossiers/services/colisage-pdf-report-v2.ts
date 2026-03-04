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
}

export class ColisagePDFReportV2 {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number = 15; // Marges réduites pour plus d'espace
  private usableWidth: number;

  constructor() {
    this.doc = new jsPDF('landscape', 'mm', 'a4'); // Format A4 PAYSAGE pour plus d'espace
    this.pageHeight = this.doc.internal.pageSize.height; // 210mm en paysage
    this.pageWidth = this.doc.internal.pageSize.width;   // 297mm en paysage
    this.usableWidth = this.pageWidth - (this.margin * 2); // 267mm utilisables
    this.currentY = this.margin;
  }

  private addLogoFallback(logoWidth: number, logoHeight: number) {
    // Fallback si le logo ne peut pas être chargé
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin + 5, this.currentY + 3, logoWidth, logoHeight, 'F');
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("LOGO", this.margin + 25, this.currentY + 12);
    this.doc.setFontSize(8);
    this.doc.text("SFX TRANSIT", this.margin + 20, this.currentY + 18);
  }

  private formatNumber(value: any): string {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  }

  private formatDate(date: any): string {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("fr-FR");
    } catch {
      return "-";
    }
  }

  private async loadLogoAsBase64(): Promise<string | null> {
    try {
      // En environnement client, charger l'image et la convertir en base64
      if (typeof window !== 'undefined') {
        const response = await fetch('/logo.jpeg');
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
      return null;
    } catch (error) {
      console.warn('Erreur lors du chargement du logo:', error);
      return null;
    }
  }

  private async addHeaderWithLogo(dossierInfo: DossierInfo) {
    // En-tête avec titre principal
    this.doc.setFillColor(52, 152, 219);
    this.doc.rect(this.margin, this.currentY, this.usableWidth, 12, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("RAPPORT DE COLISAGES", this.margin + 5, this.currentY + 8);
    
    // Date de génération à droite
    this.doc.setFontSize(10);
    this.doc.text(`Généré le ${this.formatDate(new Date())}`, this.pageWidth - this.margin - 40, this.currentY + 8);
    
    this.currentY += 20;
    
    // Cadre unique avec justify-between : logo à gauche, infos à droite
    const frameHeight = 30;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, this.currentY, this.usableWidth, frameHeight);
    
    // GAUCHE : Logo réel (logo.jpeg)
    const logoWidth = 40;
    const logoHeight = frameHeight - 6;
    
    // Charger le logo en base64
    const logoBase64 = await this.loadLogoAsBase64();
    
    if (logoBase64) {
      try {
        this.doc.addImage(logoBase64, 'JPEG', this.margin + 5, this.currentY + 3, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Erreur lors de l\'ajout du logo:', error);
        this.addLogoFallback(logoWidth, logoHeight);
      }
    } else {
      this.addLogoFallback(logoWidth, logoHeight);
    }
    
    // DROITE : Informations du dossier (justify-end dans le cadre)
    const rightStartX = this.pageWidth - this.margin - 120;
    
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    const dossierRef = dossierInfo.noDossier || dossierInfo.noOT || `Dossier: ${dossierInfo.id}`;
    this.doc.text(`${dossierRef}`, rightStartX, this.currentY + 8);
    
    if (dossierInfo.nomClient) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(`Client: ${dossierInfo.nomClient}`, rightStartX, this.currentY + 15);
    }
    
    if (dossierInfo.descriptionDossier) {
      this.doc.setFontSize(9);
      this.doc.text(`Description: ${dossierInfo.descriptionDossier}`, rightStartX, this.currentY + 22);
    }
    
    this.currentY += frameHeight + 15;
  }

  private addSummary(colisages: ColisageData[]) {
    // Titre avec style ultra professionnel
    this.doc.setFillColor(45, 55, 72);
    this.doc.rect(this.margin, this.currentY, this.usableWidth, 12, 'F');
    this.doc.setFontSize(13);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("RÉSUMÉ GÉNÉRAL", this.margin + 5, this.currentY + 7.5);
    this.currentY += 16;

    // Calculs des totaux
    const totalColisages = colisages.length;
    const totalQuantite = colisages.reduce((sum, c) => sum + Number(c.Qte_Colis || 0), 0);
    const totalPoidsBrut = colisages.reduce((sum, c) => sum + Number(c.Poids_Brut || 0), 0);
    const totalPoidsNet = colisages.reduce((sum, c) => sum + Number(c.Poids_Net || 0), 0);
    const totalVolume = colisages.reduce((sum, c) => sum + Number(c.Volume || 0), 0);

    // Regroupement par devise pour la valeur totale
    const valeurParDevise = colisages.reduce((acc, c) => {
      const devise = c.Code_Devise || 'N/A';
      const valeur = Number(c.Qte_Colis || 0) * Number(c.Prix_Unitaire_Colis || 0);
      acc[devise] = (acc[devise] || 0) + valeur;
      return acc;
    }, {} as Record<string, number>);

    // Statistiques par fournisseur
    const fournisseurs = [...new Set(colisages.map(c => c.Nom_Fournisseur || 'Non spécifié'))];
    const totalFournisseurs = fournisseurs.length;

    // Statistiques par HS Code
    const hsCodes = [...new Set(colisages.map(c => c.HS_Code || 'N/A'))];
    const totalHSCodes = hsCodes.length;

    // Créer des cartes visuelles pour les métriques principales (ligne 1)
    const cardWidth = (this.usableWidth - 15) / 4;
    const cardHeight = 22;
    const cardY = this.currentY;
    
    // Carte 1: Colisages
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("COLISAGES", this.margin + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalColisages.toString(), this.margin + cardWidth / 2, cardY + 15, { align: 'center' });
    
    // Carte 2: Fournisseurs
    const card2X = this.margin + cardWidth + 5;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("FOURNISSEURS", card2X + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalFournisseurs.toString(), card2X + cardWidth / 2, cardY + 15, { align: 'center' });
    
    // Carte 3: Codes HS
    const card3X = this.margin + (cardWidth + 5) * 2;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("HS CODES", card3X + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(totalHSCodes.toString(), card3X + cardWidth / 2, cardY + 15, { align: 'center' });
    
    // Carte 4: Quantité
    const card4X = this.margin + (cardWidth + 5) * 3;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("QUANTITÉ TOTALE", card4X + cardWidth / 2, cardY + 6, { align: 'center' });
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(this.formatNumber(totalQuantite), card4X + cardWidth / 2, cardY + 15, { align: 'center' });
    
    this.currentY += cardHeight + 8;
    
    // Deuxième ligne de cartes: Poids brut, Poids net, Volume, Valeur
    const card2Y = this.currentY;
    
    // Carte 5: Poids brut
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(this.margin, card2Y, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, card2Y, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("POIDS BRUT TOTAL", this.margin + cardWidth / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(`${this.formatNumber(totalPoidsBrut)} kg`, this.margin + cardWidth / 2, card2Y + 15, { align: 'center' });
    
    // Carte 6: Poids net
    const card6X = this.margin + cardWidth + 5;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card6X, card2Y, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card6X, card2Y, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("POIDS NET TOTAL", card6X + cardWidth / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(`${this.formatNumber(totalPoidsNet)} kg`, card6X + cardWidth / 2, card2Y + 15, { align: 'center' });
    
    // Carte 7: Volume
    const card7X = this.margin + (cardWidth + 5) * 2;
    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(card7X, card2Y, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(card7X, card2Y, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("VOLUME TOTAL", card7X + cardWidth / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(`${this.formatNumber(totalVolume)} m³`, card7X + cardWidth / 2, card2Y + 15, { align: 'center' });
    
    // Carte 8: Valeur totale (première devise ou la plus importante)
    const card8X = this.margin + (cardWidth + 5) * 3;
    const devisesPrincipales = Object.entries(valeurParDevise).sort(([,a], [,b]) => b - a);
    const [deviseMain, valeurMain] = devisesPrincipales.length > 0 ? devisesPrincipales[0] : ['N/A', 0];
    
    this.doc.setFillColor(46, 125, 50);
    this.doc.roundedRect(card8X, card2Y, cardWidth, cardHeight, 2, 2, 'F');
    this.doc.setDrawColor(46, 125, 50);
    this.doc.roundedRect(card8X, card2Y, cardWidth, cardHeight, 2, 2, 'S');
    
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`VALEUR TOTALE (${deviseMain})`, card8X + cardWidth / 2, card2Y + 6, { align: 'center' });
    
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(this.formatNumber(valeurMain), card8X + cardWidth / 2, card2Y + 15, { align: 'center' });
    
    this.currentY += cardHeight + 15;
  }

  private addColisagesByGroup(colisages: ColisageData[]) {
    // Regrouper par FOURNISSEUR → NUMÉRO DE COMMANDE → NUMÉRO DE FACTURE (3 niveaux)
    const groupedData = colisages.reduce((acc, colisage) => {
      const fournisseur = colisage.Nom_Fournisseur || 'Fournisseur non spécifié';
      const numeroCommande = colisage.No_Commande || 'Sans numéro de commande';
      const numeroFacture = colisage.No_Facture || 'Sans numéro de facture';
      
      if (!acc[fournisseur]) {
        acc[fournisseur] = {};
      }
      if (!acc[fournisseur][numeroCommande]) {
        acc[fournisseur][numeroCommande] = {};
      }
      if (!acc[fournisseur][numeroCommande][numeroFacture]) {
        acc[fournisseur][numeroCommande][numeroFacture] = [];
      }
      
      acc[fournisseur][numeroCommande][numeroFacture].push(colisage);
      return acc;
    }, {} as Record<string, Record<string, Record<string, ColisageData[]>>>);

    Object.entries(groupedData).forEach(([fournisseur, commandes]) => {
      // Vérifier si on a assez de place pour le groupe
      if (this.currentY > this.pageHeight - 100) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      // NIVEAU 1: Titre du FOURNISSEUR avec style professionnel
      // Fond gris foncé élégant
      this.doc.setFillColor(70, 70, 70);
      this.doc.rect(this.margin, this.currentY, this.usableWidth, 10, 'F');
      
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(`FOURNISSEUR: ${fournisseur.toUpperCase()}`, this.margin + 5, this.currentY + 6.5);
      this.currentY += 12;

      Object.entries(commandes).forEach(([numeroCommande, factures]) => {
        Object.entries(factures).forEach(([numeroFacture, colisagesGroup]) => {
          // NIVEAU 2 & 3: Facture et Commande avec style professionnel
          // Fond gris clair élégant
          this.doc.setFillColor(245, 245, 245);
          this.doc.rect(this.margin, this.currentY, this.usableWidth, 14, 'F');
          
          // Bordure gauche colorée pour l'accent (vert professionnel)
          this.doc.setFillColor(46, 125, 50);
          this.doc.rect(this.margin, this.currentY, 3, 14, 'F');
          
          // Facture sur la première ligne
          this.doc.setFontSize(10);
          this.doc.setFont("helvetica", "bold");
          this.doc.setTextColor(52, 73, 94);
          this.doc.text(`Facture N°: `, this.margin + 8, this.currentY + 5);
          
          this.doc.setFont("helvetica", "normal");
          this.doc.setTextColor(0, 0, 0);
          const factureWidth = this.doc.getTextWidth(`Facture N°: `);
          this.doc.text(numeroFacture, this.margin + 8 + factureWidth, this.currentY + 5);
          
          // Commande sur la ligne suivante, décalée
          this.doc.setFont("helvetica", "bold");
          this.doc.setTextColor(52, 73, 94);
          const nbLignes = colisagesGroup.length;
          this.doc.text(`Commande N°: `, this.margin + 18, this.currentY + 10);
          
          this.doc.setFont("helvetica", "normal");
          this.doc.setTextColor(0, 0, 0);
          const commandeWidth = this.doc.getTextWidth(`Commande N°: `);
          this.doc.text(
            `${numeroCommande} (${nbLignes} ligne${nbLignes > 1 ? 's' : ''})`,
            this.margin + 18 + commandeWidth,
            this.currentY + 10
          );
          
          this.currentY += 16;

          // Préparer les données du tableau - COMMENCE PAR ITEM_NO
          const tableData = colisagesGroup.map(colisage => [
            colisage.Item_No || '-',               // Item No (1ère colonne)
            (colisage.Description_Colis || '').substring(0, 35), // Description
            colisage.HS_Code || '-',               // HS Code
            this.formatNumber(colisage.Qte_Colis), // Quantité
            `${this.formatNumber(colisage.Prix_Unitaire_Colis)} ${colisage.Code_Devise || ''}`, // Prix Unitaire
            this.formatNumber(colisage.Volume),    // Volume
            colisage.Regroupement_Client || '-',   // Site
            colisage.Pays_Origine || '-',          // Pays d'Origine
          ]);

          // Calculer les totaux du groupe
          const totalQte = colisagesGroup.reduce((sum, c) => sum + Number(c.Qte_Colis || 0), 0);
          const totalVolume = colisagesGroup.reduce((sum, c) => sum + Number(c.Volume || 0), 0);
          
          // Calculer la valeur totale par devise
          const valeurParDevise = colisagesGroup.reduce((acc, c) => {
            const devise = c.Code_Devise || 'N/A';
            const valeur = Number(c.Qte_Colis || 0) * Number(c.Prix_Unitaire_Colis || 0);
            acc[devise] = (acc[devise] || 0) + valeur;
            return acc;
          }, {} as Record<string, number>);
          
          // Formater la valeur totale (prendre la première devise ou la plus importante)
          const devisesPrincipales = Object.entries(valeurParDevise).sort(([,a], [,b]) => b - a);
          const totalValeur = devisesPrincipales.length > 0 
            ? `${this.formatNumber(devisesPrincipales[0][1])} ${devisesPrincipales[0][0]}`
            : '-';

          // Ajouter ligne de total
          tableData.push([
            'TOTAL',
            '',
            '',
            this.formatNumber(totalQte),
            totalValeur,
            this.formatNumber(totalVolume),
            '',
            ''
          ]);

          autoTable(this.doc, {
            startY: this.currentY,
            head: [[
              'Item No',
              'Description',
              'HS Code',
              'Quantité',
              'Prix Unit.',
              'Volume',
              'Site',
              'Pays d\'Origine'
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
              cellPadding: 2,
              halign: 'center',
              valign: 'middle'
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            columnStyles: {
              0: { cellWidth: 25, halign: 'center' }, // Item No
              1: { cellWidth: 70, halign: 'left' },   // Description (plus large)
              2: { cellWidth: 28, halign: 'center' }, // HS Code
              3: { cellWidth: 22, halign: 'right' },  // Quantité
              4: { cellWidth: 32, halign: 'right' },  // Prix Unitaire
              5: { cellWidth: 22, halign: 'right' },  // Volume
              6: { cellWidth: 30, halign: 'center' }, // Site
              7: { cellWidth: 28, halign: 'center' }, // Pays d'Origine
            },
            margin: { left: this.margin, right: this.margin },
            tableWidth: this.usableWidth,
            pageBreak: 'auto',
            didParseCell: (data: any) => {
              // Mettre en évidence la ligne de total
              if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [255, 235, 59];
                data.cell.styles.textColor = [0, 0, 0];
              }
            }
          });

          this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
        });
      });

      this.currentY += 5;
    });
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      
      // Pied de page avec style
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100, 100, 100);
      
      // Copyright au centre
      const copyrightText = `©Copyright Softronic Innoving`;
      const copyrightWidth = this.doc.getTextWidth(copyrightText);
      this.doc.text(
        copyrightText,
        (this.pageWidth - copyrightWidth) / 2,
        this.pageHeight - 12
      );
      
      // Numéro de page à droite
      this.doc.text(
        `Page ${i} sur ${pageCount}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 12
      );
    }
  }

  public async generateReport(dossierInfo: DossierInfo, colisages: ColisageData[]): Promise<void> {
    try {
      // Validation des données
      if (!colisages || colisages.length === 0) {
        throw new Error('Aucun colisage à inclure dans le rapport');
      }

      // En-tête avec logo
      await this.addHeaderWithLogo(dossierInfo);
      
      // Résumé
      this.addSummary(colisages);
      
      // Détail par groupes
      this.addColisagesByGroup(colisages);
      
      // Pied de page
      this.addFooter();
      
      // Télécharger le PDF
      const fileName = `Rapport_Colisages_${dossierInfo.noDossier || dossierInfo.noOT || dossierInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }
}