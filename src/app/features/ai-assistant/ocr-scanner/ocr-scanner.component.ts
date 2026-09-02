import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../core/services/ai.service';
import { DocumentsService } from '../../documents/documents.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ocr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './ocr-scanner.component.html',
  styleUrls: ['./ocr-scanner.component.css']
})
export class OcrScannerComponent {
  isDragging = false;
  isScanning = false;
  scanComplete = false;
  selectedFile: File | null = null;
  fileUrl: string | null = null;
  extractedData: any = null;
  extractedText = '';

  // Options de conversion avancée vers Word (Section 3)
  selectedLangue = 'fr';
  preserverTableaux = true;
  preserverImages = true;
  isConverting = false;

  private aiService = inject(AiService);
  private documentsService = inject(DocumentsService);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    this.selectedFile = file;
    this.scanComplete = false;
    this.extractedData = null;
    this.extractedText = '';
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.fileUrl = null;
    }

    this.startScan();
  }

  chargerDocumentExemple() {
    const canvas = document.createElement('canvas');
    canvas.width = 850;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ligne violette
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, 0, canvas.width, 14);

    // Titres
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('BENJEDDOU ERP — CONTRAT & FACTURE DE TEST', 50, 50);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('DOCUMENT EXEMPLE POUR CONVERSION INTELLIGENTE VERS WORD (.DOCX)', 50, 80);

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(800, 100);
    ctx.stroke();

    // Section 1
    let y = 135;
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('1. INFORMATIONS GÉNÉRALES DU DOCUMENT', 50, y);

    y += 28;
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px sans-serif';
    ctx.fillText('Client / Destinataire: Société Internationale de Démonstration S.A.R.L.', 50, y);

    y += 22;
    ctx.fillStyle = '#64748b';
    ctx.fillText('N° Référence: DOC-TEST-2026 | Date d\'émission: 11 Août 2026', 50, y);

    // Section 2
    y += 45;
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('2. OBJET DU CONTRAT ET SPÉCIFICATIONS TECHNIQUES', 50, y);

    y += 28;
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px sans-serif';
    ctx.fillText('Le présent document atteste du fonctionnement du module de conversion OCR universel.', 50, y);

    y += 22;
    ctx.fillText('La conversion génère un fichier Word (.docx) 100% modifiable en conservant la structure.', 50, y);

    // Section 3 - Tableau
    y += 50;
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('3. TABLEAU DES PRESTATIONS ET DÉTAILS FINANCIERS', 50, y);

    y += 30;
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(50, y, 750, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Désignation du Produit / Service', 65, y + 21);
    ctx.fillText('Qté', 420, y + 21);
    ctx.fillText('Prix U. (TND)', 520, y + 21);
    ctx.fillText('Total HT (TND)', 670, y + 21);

    y += 32;
    const rows = [
      ['Licence Annuelle ERP SaaS Multi-Tenant Pro', '1', '450.00 TND', '450.00 TND'],
      ['Module Assistant IA Multilingue & OCR Vision', '1', '250.00 TND', '250.00 TND'],
      ['Support Technique & Assistance 24/7 (12 mois)', '12', '50.00 TND', '600.00 TND']
    ];

    rows.forEach((row, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      ctx.fillRect(50, y, 750, 32);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(50, y, 750, 32);

      ctx.fillStyle = '#0f172a';
      ctx.font = '12px sans-serif';
      ctx.fillText(row[0], 65, y + 21);
      ctx.fillText(row[1], 420, y + 21);
      ctx.fillText(row[2], 520, y + 21);
      ctx.fillText(row[3], 670, y + 21);
      y += 32;
    });

    // Total Box
    y += 20;
    ctx.fillStyle = '#f3e8ff';
    ctx.fillRect(480, y, 320, 95);
    ctx.strokeStyle = '#7c3aed';
    ctx.strokeRect(480, y, 320, 95);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Total HT:', 500, y + 25);
    ctx.fillText('1 300.00 TND', 670, y + 25);

    ctx.fillText('TVA (19%):', 500, y + 52);
    ctx.fillText('247.00 TND', 670, y + 52);

    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('TOTAL TTC:', 500, y + 78);
    ctx.fillText('1 547.00 TND', 670, y + 78);

    // Footer
    y += 130;
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('4. VALIDATION ET MENTION DE CONFORMITÉ', 50, y);
    y += 25;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('Document certifié conforme par la plateforme BENJEDDOU ERP.', 50, y);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'Document_Exemple_Contrat_et_Facture.png', { type: 'image/png' });
        this.handleFile(file);
      }
    }, 'image/png');
  }

  startScan() {
    if (!this.selectedFile) return;
    
    this.isScanning = true;
    this.extractedText = '';
    this.extractedData = null;
    
    this.aiService.processOcrDocument(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isScanning = false;
        this.scanComplete = true;
        this.extractedData = res.data || {};
        
        let t = res.texte || res.data?.texteBrut || res.data?.texte || '';
        if (!t || t.trim().length === 0) {
          const d = this.extractedData;
          const lines = [];
          if (d.fournisseur) lines.push(`Émetteur / Fournisseur : ${d.fournisseur}`);
          if (d.numeroFacture) lines.push(`N° Document / Facture : ${d.numeroFacture}`);
          if (d.dateFacture) lines.push(`Date de Facturation : ${d.dateFacture}`);
          if (d.montantTtc != null) lines.push(`Montant Total TTC : ${d.montantTtc} TND`);
          t = lines.join('\n');
        }
        this.extractedText = t;

        const d = this.extractedData;
        const champs = [d.fournisseur, d.dateFacture, d.numeroFacture, d.montantHt, d.tva, d.montantTtc]
          .filter(v => v !== null && v !== undefined && String(v).trim().length > 0);
        this.extractedData.confianceOcr = champs.length > 0 ? Math.round((champs.length / 6) * 100) : (this.extractedText ? 95 : 0);
      },
      error: () => {
        this.isScanning = false;
        this.scanComplete = true;
        this.extractedText = "Erreur d'analyse du document. Impossible d'extraire le texte du fichier sélectionné.";
        this.extractedData = { confianceOcr: 0 };
      }
    });
  }

  downloadWordDocx() {
    if (!this.selectedFile) return;
    this.isConverting = true;

    this.documentsService.convertirDocumentVersWordComplet(
      this.selectedFile,
      this.selectedLangue,
      this.preserverTableaux,
      this.preserverImages
    ).subscribe({
      next: (blob: Blob) => {
        this.isConverting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const baseName = this.selectedFile?.name.replace(/\.[^/.]+$/, '') || 'document';
        a.download = `converti_${baseName}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.isConverting = false;
        alert("Erreur lors de la conversion vers Word : " + (err.message || 'Erreur serveur'));
      }
    });
  }

  copierTexteExtrait() {
    if (this.extractedText) {
      navigator.clipboard.writeText(this.extractedText);
      alert("Texte extrait copié dans le presse-papier !");
    }
  }

  reset() {
    this.selectedFile = null;
    this.fileUrl = null;
    this.isScanning = false;
    this.scanComplete = false;
    this.extractedData = null;
    this.extractedText = '';
  }

  saveInvoice() {
    if (!this.extractedData) return;
    this.isScanning = true;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

    fetch(`${environment.apiUrl}/factures/ocr-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(this.extractedData)
    })
    .then(res => {
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    })
    .then(() => {
      this.isScanning = false;
      alert("Facture/Document importé avec succès dans l'ERP !");
      this.reset();
    })
    .catch(() => {
      this.isScanning = false;
      alert("Erreur lors de l'importation de la facture.");
    });
  }
}
