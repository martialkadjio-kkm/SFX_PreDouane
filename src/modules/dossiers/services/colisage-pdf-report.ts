import jsPDF from 'jspdf';

// Import direct pour s'assurer que autoTable est disponible
if (typeof window !== 'undefined') {
  require('jspdf-autotable');
}

// Étendre le type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

export class ColisagePDFReport {
  private doc: jsPDF;
  private pageHeight: number;
  private currentY: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.currentY = this.margin;
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

  private addHeader(dossierInfo: DossierInfo) {
    // Logo et titre (simulé)
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("RAPPORT DE COLISAGES", this.margin, this.currentY);
    
    this.currentY += 15;
    
    // Informations du dossier
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    
    const dossierRef = dossierInfo.noDossier || dossierInfo.noOT || `Dossier #${dossierInfo.id}`;
    this.doc.text(`Dossier: ${dossierRef}`, this.margin, this.currentY);
    
    if (dossierInfo.nomClient) {
      this.currentY += 7;
      this.doc.text(`Client: ${dossierInfo.nomClient}`, this.margin, this.currentY);
    }
    
    if (dossierInfo.descriptionDossier) {
      this.currentY += 7;
      this.doc.text(`Description: ${dossierInfo.descriptionDossier}`, this.margin, this.currentY);
    }
    
    this.currentY += 7;
    this.doc.text(`Date de génération: ${this.formatDate(new Date())}`, this.margin, this.currentY);
    
    this.currentY += 15;
    
    // Ligne de séparation
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.doc.internal.pageSize.width - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addSummary(colisages: ColisageData[]) {
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("RÉSUMÉ GÉNÉRAL", this.margin, this.currentY);
    this.currentY += 10;

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

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");

    // Tableau de résumé
    const summaryData = [
      ['Nombre total de colisages', totalColisages.toString()],
      ['Nombre de fournisseurs', totalFournisseurs.toString()],
      ['Nombre de codes HS différents', totalHSCodes.toString()],
      ['Quantité totale', this.formatNumber(totalQuantite)],
      ['Poids brut total (kg)', this.formatNumber(totalPoidsBrut)],
      ['Poids net total (kg)', this.formatNumber(totalPoidsNet)],
      ['Volume total (m³)', this.formatNumber(totalVolume)],
    ];

    // Ajouter les valeurs par devise
    Object.entries(valeurParDevise).forEach(([devise, valeur]) => {
      if (valeur > 0) {
        summaryData.push([`Valeur totale (${devise})`, this.formatNumber(valeur)]);
      }
    });

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Indicateur', 'Valeur']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  private addColisagesByGroup(colisages: ColisageData[]) {
    // Regrouper par fournisseur, puis par regroupement client
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
      // Vérifier si on a assez de place pour le groupe
      if (this.currentY > this.pageHeight - 100) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      // Titre du fournisseur
      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(41, 128, 185);
      this.doc.text(`FOURNISSEUR: ${fournisseur.toUpperCase()}`, this.margin, this.currentY);
      this.currentY += 10;

      Object.entries(regroupements).forEach(([regroupement, colisagesGroup]) => {
        // Sous-titre du regroupement
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(0, 0, 0);
        this.doc.text(`Regroupement: ${regroupement}`, this.margin + 5, this.currentY);
        this.currentY += 8;

        // Préparer les données du tableau
        const tableData = colisagesGroup.map(colisage => [
          colisage.UploadKey || '-',
          colisage.HS_Code || '-',
          (colisage.Description_Colis || '').substring(0, 30) + (colisage.Description_Colis && colisage.Description_Colis.length > 30 ? '...' : ''),
          colisage.No_Commande || '-',
          colisage.No_Facture || '-',
          colisage.Item_No || '-',
          this.formatNumber(colisage.Qte_Colis),
          `${this.formatNumber(colisage.Prix_Unitaire_Colis)} ${colisage.Code_Devise || ''}`,
          this.formatNumber(colisage.Poids_Brut),
          this.formatNumber(colisage.Poids_Net),
          this.formatNumber(colisage.Volume),
          colisage.Pays_Origine || '-',
        ]);

        // Calculer les totaux du groupe
        const totalQte = colisagesGroup.reduce((sum, c) => sum + Number(c.Qte_Colis || 0), 0);
        const totalPoidsBrut = colisagesGroup.reduce((sum, c) => sum + Number(c.Poids_Brut || 0), 0);
        const totalPoidsNet = colisagesGroup.reduce((sum, c) => sum + Number(c.Poids_Net || 0), 0);
        const totalVolume = colisagesGroup.reduce((sum, c) => sum + Number(c.Volume || 0), 0);

        // Ajouter ligne de total
        tableData.push([
          'TOTAL',
          '',
          '',
          '',
          '',
          '',
          this.formatNumber(totalQte),
          '',
          this.formatNumber(totalPoidsBrut),
          this.formatNumber(totalPoidsNet),
          this.formatNumber(totalVolume),
          ''
        ]);

        this.doc.autoTable({
          startY: this.currentY,
          head: [[
            'Row Key',
            'HS Code',
            'Description',
            'N° Cmd',
            'N° Facture',
            'N° Item',
            'Qté',
            'Prix Unit.',
            'Poids Brut',
            'Poids Net',
            'Volume',
            'Pays'
          ]],
          body: tableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [52, 152, 219], 
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 15 }, // Row Key
            1: { cellWidth: 15 }, // HS Code
            2: { cellWidth: 25 }, // Description
            3: { cellWidth: 12 }, // N° Cmd
            4: { cellWidth: 12 }, // N° Facture
            5: { cellWidth: 12 }, // N° Item
            6: { cellWidth: 10, halign: 'right' }, // Qté
            7: { cellWidth: 15, halign: 'right' }, // Prix
            8: { cellWidth: 12, halign: 'right' }, // Poids Brut
            9: { cellWidth: 12, halign: 'right' }, // Poids Net
            10: { cellWidth: 12, halign: 'right' }, // Volume
            11: { cellWidth: 15 }, // Pays
          },
          margin: { left: this.margin + 5, right: this.margin },
          didParseCell: (data: any) => {
            // Mettre en évidence la ligne de total
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [241, 196, 15];
            }
          }
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
      });

      this.currentY += 5;
    });
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Numéro de page
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(
        `Page ${i} sur ${pageCount}`,
        this.doc.internal.pageSize.width - this.margin - 20,
        this.pageHeight - 15
      );
      
      // Informations de génération
      this.doc.text(
        `©Copyright Softronic Innoving`,
        this.margin,
        this.pageHeight - 15
      );
    }
  }

  public generateReport(dossierInfo: DossierInfo, colisages: ColisageData[]): void {
    try {
      // Validation des données
      if (!colisages || colisages.length === 0) {
        throw new Error('Aucun colisage à inclure dans le rapport');
      }

      // En-tête
      this.addHeader(dossierInfo);
      
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