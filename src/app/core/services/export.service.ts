import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

/**
 * ExportService — Service centralisé pour les exports
 *
 * Fonctionnalités :
 *  ✅ PDF  — via jsPDF (tableaux dessinés manuellement, pas de plugin externe)
 *  ✅ Word — via blob HTML (compatible MS Word / LibreOffice)
 *  ✅ CSV  — format Excel-compatible UTF-8 BOM
 *  ✅ Print — via window.print avec feuille de style optimisée
 *
 * Dépendance unique : jsPDF (déjà dans package.json)
 */
@Injectable({ providedIn: 'root' })
export class ExportService {

  // ─────────────────────────────────────────────────────────────
  // PDF EXPORT
  // ─────────────────────────────────────────────────────────────

  /**
   * Exporte un tableau de données vers un PDF formaté.
   * @param columns  En-têtes de colonnes ex: ['Nom', 'Prix', 'Qté']
   * @param rows     Tableau de lignes (chaque ligne = tableau de valeurs)
   * @param title    Titre du document
   * @param filename Nom du fichier (sans extension)
   * @param subtitle Sous-titre optionnel
   */
  exportTableToPDF(
    columns: string[],
    rows: (string | number)[][],
    title: string,
    filename: string,
    subtitle?: string
  ): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 14;

    this._addPDFHeader(doc, title, subtitle);

    const startY = subtitle ? 36 : 30;
    const colCount = columns.length;
    const colW = (pageW - marginX * 2) / colCount;
    const rowH = 7;

    // ── En-têtes ──
    doc.setFillColor(99, 102, 241); // indigo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    columns.forEach((col, i) => {
      const x = marginX + i * colW;
      doc.rect(x, startY, colW, rowH, 'F');
      doc.text(String(col), x + 2, startY + 5);
    });

    // ── Lignes ──
    doc.setFont('helvetica', 'normal');
    let y = startY + rowH;

    rows.forEach((row, ri) => {
      // Saut de page si nécessaire
      if (y + rowH > pageH - 18) {
        doc.addPage();
        y = 20;
        // Répéter l'en-tête
        doc.setFillColor(99, 102, 241);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        columns.forEach((col, i) => {
          const x = marginX + i * colW;
          doc.rect(x, y, colW, rowH, 'F');
          doc.text(String(col), x + 2, y + 5);
        });
        doc.setFont('helvetica', 'normal');
        y += rowH;
      }

      // Fond alterné
      if (ri % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(marginX, y, pageW - marginX * 2, rowH, 'F');
      }

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(8);

      row.forEach((cell, i) => {
        const x = marginX + i * colW;
        const text = String(cell ?? '—');
        // Tronquer le texte si trop long
        const maxLen = Math.floor(colW / 2.2);
        const displayText = text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
        doc.text(displayText, x + 2, y + 5);
      });

      // Bordure de ligne
      doc.setDrawColor(220, 220, 220);
      doc.line(marginX, y + rowH, pageW - marginX, y + rowH);

      y += rowH;
    });

    // Bordure globale du tableau
    doc.setDrawColor(180, 180, 200);
    doc.rect(marginX, startY, pageW - marginX * 2, y - startY);

    this._addPDFFooter(doc);
    doc.save(`${filename}.pdf`);
  }

  /**
   * Exporte un document/fiche (facture, devis, profil) vers PDF.
   * @param fields   Tableau de { label, value }
   * @param title    Titre (ex: "FACTURE #2024-001")
   * @param filename Nom du fichier sans extension
   */
  exportDocumentToPDF(
    fields: { label: string; value: string | number }[],
    title: string,
    filename: string
  ): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageH = doc.internal.pageSize.getHeight();

    this._addPDFHeader(doc, title);

    let y = 38;
    const labelX = 14;
    const valueX = 80;

    fields.forEach(field => {
      if (y > pageH - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'normal');
      doc.text(field.label + ' :', labelX, y);

      doc.setFontSize(9.5);
      doc.setTextColor(30);
      doc.setFont('helvetica', 'bold');
      doc.text(String(field.value ?? '—'), valueX, y);

      doc.setDrawColor(235);
      doc.line(labelX, y + 2, 196, y + 2);

      y += 9;
    });

    this._addPDFFooter(doc);
    doc.save(`${filename}.pdf`);
  }

  // ─────────────────────────────────────────────────────────────
  // WORD EXPORT
  // ─────────────────────────────────────────────────────────────

  /**
   * Exporte un tableau vers un fichier Word (.doc) via HTML blob.
   * Compatible Microsoft Word, LibreOffice Writer.
   */
  exportTableToWord(
    columns: string[],
    rows: (string | number)[][],
    title: string,
    filename: string
  ): void {
    const tableRows = rows.map((row, ri) =>
      `<tr style="background:${ri % 2 === 0 ? '#f9faff' : '#fff'}">
        ${row.map(cell =>
          `<td style="border:1px solid #ddd;padding:6px 10px;font-size:10.5pt">${cell ?? ''}</td>`
        ).join('')}
      </tr>`
    ).join('');

    const headerCells = columns.map(c =>
      `<th style="background:#6366f1;color:#fff;padding:8px 10px;font-size:10.5pt;text-align:left">${c}</th>`
    ).join('');

    const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
  <![endif]-->
  <style>
    @page { size: A4 landscape; margin: 2cm; }
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1a1a2e; }
    h1 { color: #6366f1; font-size: 15pt; margin-bottom: 2pt; }
    p.meta { color: #888; font-size: 9pt; margin-bottom: 14pt; }
    table { border-collapse: collapse; width: 100%; margin-top: 8pt; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Généré le ${new Date().toLocaleDateString('fr-FR')} — BENJEDDOU ERP</p>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    this._downloadBlob(blob, `${filename}.doc`);
  }

  // ─────────────────────────────────────────────────────────────
  // CSV / EXCEL EXPORT
  // ─────────────────────────────────────────────────────────────

  /**
   * Exporte vers CSV (séparateur `;`, BOM UTF-8 pour Excel FR).
   */
  exportToCSV(
    columns: string[],
    rows: (string | number)[][],
    filename: string
  ): void {
    const sep = ';';
    const escape = (v: string | number) => {
      const s = String(v ?? '');
      return s.includes(sep) || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const header = columns.map(escape).join(sep);
    const body = rows.map(row => row.map(escape).join(sep)).join('\n');
    const csv = `\uFEFF${header}\n${body}`;
    this._downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
  }

  // ─────────────────────────────────────────────────────────────
  // PRINT
  // ─────────────────────────────────────────────────────────────

  /**
   * Ouvre une fenêtre d'impression avec uniquement le contenu d'un élément DOM.
   * @param elementId ID de l'élément HTML à imprimer
   * @param title     Titre de la fenêtre
   */
  printElement(elementId: string, title: string = 'Impression — BENJEDDOU ERP'): void {
    const el = document.getElementById(elementId);
    if (!el) { console.warn(`ExportService: #${elementId} introuvable`); return; }

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;

    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>${title}</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: Calibri,'Segoe UI',Arial,sans-serif; font-size: 11pt; color:#1a1a2e; margin: 18mm; }
        h1, h2, h3 { color: #6366f1; }
        table { border-collapse: collapse; width: 100%; }
        th { background:#6366f1; color:#fff; padding:7px 10px; text-align:left; font-size:10pt; }
        td { border:1px solid #e2e8f0; padding:6px 10px; font-size:10pt; }
        tr:nth-child(even) td { background:#f8f9ff; }
        .no-print { display:none!important; }
        .print-header { border-bottom:2px solid #6366f1; margin-bottom:12pt; padding-bottom:8pt; }
        .print-meta { color:#888; font-size:9pt; }
        @page { size: A4; margin: 15mm; }
      </style>
    </head><body>
      <div class="print-header">
        <strong style="font-size:13pt;color:#6366f1">BENJEDDOU ERP</strong>
        <span class="print-meta" style="margin-left:16pt">— ${title}</span>
        <div class="print-meta">Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      ${el.innerHTML}
    </body></html>`);

    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  /** Déclenche window.print() directement (pour pages déjà stylisées @media print). */
  printPage(): void { window.print(); }

  // ─────────────────────────────────────────────────────────────
  // Privé
  // ─────────────────────────────────────────────────────────────

  private _addPDFHeader(doc: jsPDF, title: string, subtitle?: string): void {
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, w, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const ts = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    doc.text(ts, w - 14, 12, { align: 'right' });
    if (subtitle) {
      doc.setTextColor(80);
      doc.setFontSize(8);
      doc.text(subtitle, 14, 26);
    }
    doc.setTextColor(0);
  }

  private _addPDFFooter(doc: jsPDF): void {
    const n = doc.getNumberOfPages();
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setDrawColor(210);
      doc.line(14, h - 12, w - 14, h - 12);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text('BENJEDDOU Technologie Services — Plateforme ERP Multi-Tenant', 14, h - 6);
      doc.text(`Page ${i} / ${n}`, w - 14, h - 6, { align: 'right' });
    }
  }

  private _downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
