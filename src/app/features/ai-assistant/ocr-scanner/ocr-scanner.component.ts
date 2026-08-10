import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../core/services/ai.service';

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

  constructor(private aiService: AiService) {}

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
    
    // Create local URL for preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.fileUrl = null; // Can't preview PDF easily here without a library, show an icon instead
    }

    this.startScan();
  }

  startScan() {
    if (!this.selectedFile) return;
    
    this.isScanning = true;
    
    this.aiService.processOcrDocument(this.selectedFile).subscribe({
      next: (res) => {
        this.isScanning = false;
        this.scanComplete = true;
        this.extractedData = res.data || {};

        // Calcul dynamique du score de confiance selon les champs réellement extraits (Point 4)
        const d = this.extractedData;
        const champs = [d.fournisseur, d.dateFacture, d.numeroFacture, d.montantHt, d.tva, d.montantTtc]
          .filter(v => v !== null && v !== undefined && String(v).trim().length > 0);
        this.extractedData.confianceOcr = champs.length > 0 ? Math.round((champs.length / 6) * 100) : 0;
      },
      error: (err) => {
        this.isScanning = false;
        alert("Une erreur est survenue lors de l'analyse OCR.");
      }
    });
  }

  downloadWordDocx() {
    if (!this.selectedFile) return;
    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    formData.append('langue', 'fr');

    if (this.extractedData) {
      if (this.extractedData.fournisseur) formData.append('fournisseur', this.extractedData.fournisseur);
      if (this.extractedData.dateFacture) formData.append('dateFacture', this.extractedData.dateFacture);
      if (this.extractedData.numeroFacture) formData.append('numeroFacture', this.extractedData.numeroFacture);
      if (this.extractedData.montantHt != null) formData.append('montantHt', String(this.extractedData.montantHt));
      if (this.extractedData.tva != null) formData.append('tva', String(this.extractedData.tva));
      if (this.extractedData.montantTtc != null) formData.append('montantTtc', String(this.extractedData.montantTtc));
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const token = currentUser.token || '';

    fetch('http://localhost:9090/api/documents/convert-to-word', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status}) - Impossible de générer le document Word`);
      }
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ocr_${this.selectedFile?.name.replace(/\.[^/.]+$/, '') || 'document'}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => alert("Erreur lors de la conversion vers Word : " + err.message));
  }

  reset() {
    this.selectedFile = null;
    this.fileUrl = null;
    this.isScanning = false;
    this.scanComplete = false;
    this.extractedData = null;
  }

  saveInvoice() {
    this.isScanning = true; // Use as loading indicator for saving
    
    // We import HttpClient dynamically or just use standard fetch if we want to avoid DI issues, but we have HttpClient.
    // Actually, let's use the standard fetch API with the token from localStorage to keep it simple and robust.
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const token = currentUser.token;

    fetch('http://localhost:9090/api/factures/ocr-import', {
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
    .then(data => {
      alert("Facture d'achat créée avec succès ! \nElle est maintenant visible dans votre module Commercial.");
      this.reset();
    })
    .catch(err => {
      alert("Erreur lors de l'enregistrement de la facture. " + err.message);
      this.isScanning = false;
    });
  }
}
