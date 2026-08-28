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
   * Exporte n'importe quel élément DOM (modale, facture, devis, rapport) vers un fichier Word (.doc).
   * Reproduit fidèlement la mise en page Web/PDF en utilisant des tables MS Word 100% compatibles,
   * convertit les SVG/QR-Codes en PNG Data-URI, remplace les icônes Material par des symboles Unicode,
   * et élimine tout bandeau parasite.
   */
  async exportElementToWord(elementId: string, title: string, filename: string): Promise<void> {
    const el = document.getElementById(elementId);
    if (!el) {
      console.warn(`ExportService: #${elementId} introuvable pour export Word`);
      return;
    }

    // ── Cloner le DOM ──
    const clone = el.cloneNode(true) as HTMLElement;

    // 1. Remplacer les icônes Material par des symboles Unicode propres
    const iconMap: { [key: string]: string } = {
      'location_on': '📍 ',
      'calendar_today': '📅 ',
      'phone': '📞 ',
      'mail': '✉️ ',
      'language': '🌐 ',
      'person': '👤 ',
      'badge': '🪪 ',
      'assignment': '📋 ',
      'domain': '🏢 ',
      'verified': '✓ ',
      'check_circle': '✓ ',
      'local_shipping': '🚚 ',
      'headset_mic': '🎧 ',
      'workspace_premium': '⭐ ',
      'account_balance': '🏦 ',
      'verified_user': '🔒 ',
      'receipt_long': '🧾 '
    };

    clone.querySelectorAll('.material-symbols-outlined, .material-icons, mat-icon').forEach(icon => {
      const text = icon.textContent?.trim() || '';
      if (iconMap[text]) {
        const span = document.createElement('span');
        span.textContent = iconMap[text];
        icon.parentNode?.replaceChild(span, icon);
      } else {
        icon.remove();
      }
    });

    // 2. Supprimer tous les éléments interactifs & boutons
    const selectorsToRemove = [
      'button', 'input', 'select', 'textarea', '.no-export', '.no-print',
      '.action-btn', '.btn-icon', '.btn-primary', '.btn-export', '.toolbar',
      '.filter-select', '.search-bar', 'form', '[class*="btn-"]'
    ];
    selectorsToRemove.forEach(sel => {
      clone.querySelectorAll(sel).forEach(node => node.remove());
    });

    // 3. Supprimer les attributs Angular internes
    clone.querySelectorAll('*').forEach(node => {
      Array.from(node.attributes).forEach(attr => {
        if (attr.name.startsWith('_ngcontent') || attr.name.startsWith('ng-') || attr.name.startsWith('(') || attr.name.startsWith('[')) {
          node.removeAttribute(attr.name);
        }
      });
    });

    // 4. Convertir les éléments <svg> et <img> SVG en PNG Data-URI pour MS Word
    const svgs = Array.from(clone.querySelectorAll('svg'));
    for (const svg of svgs) {
      try {
        const xml = new XMLSerializer().serializeToString(svg);
        const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
        const w = parseInt(svg.getAttribute('width') || '52', 10) || 52;
        const h = parseInt(svg.getAttribute('height') || '52', 10) || 52;
        const pngUrl = await this._convertSvgUrlToPng(svgUrl, w, h);
        if (pngUrl) {
          const img = document.createElement('img');
          img.src = pngUrl;
          img.setAttribute('width', String(w));
          img.setAttribute('height', String(h));
          img.style.width = w + 'px';
          img.style.height = h + 'px';
          img.style.display = 'inline-block';
          img.style.verticalAlign = 'middle';
          svg.parentNode?.replaceChild(img, svg);
        }
      } catch (e) {}
    }

    const imgs = Array.from(clone.querySelectorAll('img'));
    for (const img of imgs) {
      if (img.src && img.src.includes('data:image/svg+xml')) {
        try {
          const w = img.clientWidth || parseInt(img.style.width, 10) || 120;
          const h = img.clientHeight || parseInt(img.style.height, 10) || 120;
          const pngUrl = await this._convertSvgUrlToPng(img.src, w, h);
          if (pngUrl) {
            img.src = pngUrl;
          }
        } catch (e) {}
      }
    }

    const htmlContent = clone.innerHTML;
    const isRtl = el.getAttribute('dir') === 'rtl'
      || window.getComputedStyle(el).direction === 'rtl';
    const dir = isRtl ? 'rtl' : 'ltr';
    const dateStr = new Date().toLocaleDateString('fr-FR');

    const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>90</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4; margin: 1.5cm 1.2cm; }

    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      color: #0f172a;
      line-height: 1.45;
      background: #ffffff;
      direction: ${dir};
    }

    .facture-print-container {
      background: #ffffff !important;
      color: #0f172a !important;
      padding: 10px !important;
      font-family: 'Segoe UI', Arial, sans-serif !important;
    }

    /* 1. Header (Brand Left + Title/QR Right) */
    .fac-header {
      display: table !important;
      width: 100% !important;
      margin-bottom: 22px !important;
    }
    .fac-brand {
      display: table-cell !important;
      width: 52% !important;
      vertical-align: top !important;
    }
    .fac-logo-group {
      display: table !important;
      margin-bottom: 6px !important;
    }
    .fac-logo-icon {
      display: table-cell !important;
      width: 56px !important;
      vertical-align: middle !important;
    }
    .fac-brand-text {
      display: table-cell !important;
      vertical-align: middle !important;
      padding-left: 10px !important;
    }
    .fac-brand-tag {
      font-size: 8pt !important;
      font-weight: 800 !important;
      color: #f97316 !important;
      text-transform: uppercase !important;
    }
    .fac-company-name {
      font-size: 18pt !important;
      font-weight: 900 !important;
      color: #0a1e3f !important;
      margin: 0 !important;
      line-height: 1.1 !important;
    }
    .fac-company-sub {
      font-size: 9.5pt !important;
      font-weight: 800 !important;
      color: #f97316 !important;
    }
    .fac-activity {
      font-size: 9pt !important;
      font-weight: 600 !important;
      color: #334155 !important;
      margin: 4px 0 2px 0 !important;
    }
    .fac-address {
      font-size: 8.5pt !important;
      color: #64748b !important;
      margin: 0 !important;
    }

    .fac-header-right {
      display: table-cell !important;
      width: 48% !important;
      vertical-align: top !important;
      background: #071739 !important;
      color: #ffffff !important;
      border-radius: 12px !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .fac-title-block {
      display: table-cell !important;
      width: 68% !important;
      vertical-align: middle !important;
      padding: 14px 16px !important;
    }
    .fac-title-main {
      font-size: 18pt !important;
      font-weight: 900 !important;
      color: #ffffff !important;
      margin-bottom: 2px !important;
    }
    .fac-num {
      font-size: 10pt !important;
      font-weight: 800 !important;
      color: #fb923c !important;
      margin-bottom: 6px !important;
    }
    .fac-date {
      font-size: 8.5pt !important;
      color: #cbd5e1 !important;
    }
    .fac-qr-box {
      display: table-cell !important;
      width: 32% !important;
      vertical-align: middle !important;
      background: #ffffff !important;
      color: #0f172a !important;
      text-align: center !important;
      padding: 10px !important;
      border-left: 1px solid rgba(255,255,255,0.2) !important;
    }
    .fac-qr-hint {
      font-size: 7pt !important;
      font-weight: 600 !important;
      color: #475569 !important;
      display: block !important;
      margin-top: 4px !important;
    }

    /* 2. Parties Grid (Émetteur & Destinataire Side-by-Side) */
    .fac-parties-grid {
      display: table !important;
      width: 100% !important;
      table-layout: fixed !important;
      margin-bottom: 18px !important;
    }
    .fac-party-card {
      display: table-cell !important;
      vertical-align: top !important;
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 12px !important;
      padding: 14px 16px !important;
    }
    .fac-party-card.fac-emetteur-card {
      width: 56% !important;
    }
    .fac-party-card.fac-destinataire-card {
      width: 40% !important;
    }
    .fac-party-pill {
      background: #0a1e3f !important;
      color: #ffffff !important;
      padding: 4px 12px !important;
      border-radius: 14px !important;
      font-size: 8pt !important;
      font-weight: 800 !important;
      letter-spacing: 0.5px !important;
      display: inline-block !important;
      margin-bottom: 8px !important;
    }
    .pill-destinataire {
      background: #ea580c !important;
    }
    .fac-party-inner {
      display: table !important;
      width: 100% !important;
    }
    .fac-party-info {
      display: table-cell !important;
      vertical-align: top !important;
    }
    .fac-party-name, .fac-dest-name {
      font-size: 11pt !important;
      font-weight: 800 !important;
      color: #0a1e3f !important;
      margin: 0 0 4px 0 !important;
    }
    .fac-party-role {
      font-size: 8.5pt !important;
      color: #64748b !important;
      margin: 0 0 6px 0 !important;
    }
    .fac-party-details, .fac-dest-details {
      font-size: 8.5pt !important;
      color: #334155 !important;
      line-height: 1.5 !important;
    }
    .fp-row {
      margin-bottom: 3px !important;
    }
    .legal-line {
      color: #475569 !important;
    }
    .dest-mf-row {
      margin-top: 6px !important;
      padding-top: 6px !important;
      border-top: 1px dashed #e2e8f0 !important;
      color: #ea580c !important;
      font-weight: bold !important;
    }
    .fac-emetteur-building {
      display: table-cell !important;
      width: 80px !important;
      vertical-align: middle !important;
      background: #071739 !important;
      color: #ffffff !important;
      border-radius: 10px !important;
      text-align: center !important;
      padding: 10px 4px !important;
    }
    .building-brand {
      font-size: 7.5pt !important;
      font-weight: 900 !important;
      display: block !important;
      color: #ffffff !important;
    }
    .building-tag {
      font-size: 6.5pt !important;
      font-weight: 800 !important;
      background: #f97316 !important;
      color: #ffffff !important;
      padding: 1px 4px !important;
      border-radius: 3px !important;
      display: inline-block !important;
      margin-top: 2px !important;
    }

    /* 3. References Row (3 Cards Side-by-Side) */
    .fac-refs-row {
      display: table !important;
      width: 100% !important;
      table-layout: fixed !important;
      margin-bottom: 18px !important;
    }
    .fac-ref-card {
      display: table-cell !important;
      width: 32% !important;
      vertical-align: middle !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
    }
    .ref-title {
      font-size: 7.5pt !important;
      color: #64748b !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      display: block !important;
    }
    .ref-value {
      font-size: 9.5pt !important;
      font-weight: 800 !important;
      color: #0a1e3f !important;
      display: block !important;
    }

    /* 4. Table */
    table, .fac-table {
      display: table !important;
      width: 100% !important;
      border-collapse: collapse !important;
      margin-bottom: 18px !important;
    }
    thead tr, .fac-table thead tr {
      background-color: #0a1e3f !important;
      color: #ffffff !important;
    }
    th, .fac-table th {
      background-color: #0a1e3f !important;
      color: #ffffff !important;
      padding: 10px 12px !important;
      font-size: 8.5pt !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      border: 1px solid #0a1e3f !important;
    }
    td, .fac-table td {
      border: 1px solid #e2e8f0 !important;
      padding: 10px 12px !important;
      font-size: 9pt !important;
      color: #1e293b !important;
      vertical-align: middle !important;
    }
    tr:nth-child(even) td {
      background-color: #fbfcfe !important;
    }
    .prod-desc strong {
      display: block !important;
      font-size: 9.5pt !important;
      color: #0a1e3f !important;
    }
    .prod-sub {
      font-size: 8pt !important;
      color: #64748b !important;
    }
    .total-ttc-val {
      font-weight: 900 !important;
      color: #ea580c !important;
    }

    /* 5. Totals Row (Arrêté Somme Left + Numbers Right Side-by-Side) */
    .fac-totals-row {
      display: table !important;
      width: 100% !important;
      table-layout: fixed !important;
      margin-bottom: 22px !important;
    }
    .fac-in-words-box {
      display: table-cell !important;
      width: 55% !important;
      vertical-align: top !important;
      background: #071739 !important;
      color: #ffffff !important;
      border-radius: 12px !important;
      padding: 16px 18px !important;
    }
    .fiw-title {
      font-size: 8pt !important;
      font-weight: 800 !important;
      color: #cbd5e1 !important;
      text-transform: uppercase !important;
      margin-bottom: 6px !important;
      display: block !important;
    }
    .fiw-text-fr {
      font-size: 10pt !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      line-height: 1.35 !important;
      margin-bottom: 4px !important;
    }
    .fiw-text-ar {
      font-size: 9.5pt !important;
      font-weight: 700 !important;
      color: #fb923c !important;
    }

    .fac-numbers-box {
      display: table-cell !important;
      width: 42% !important;
      vertical-align: top !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      padding: 14px 18px !important;
    }
    .fnb-row {
      display: table !important;
      width: 100% !important;
      margin-bottom: 6px !important;
    }
    .fnb-label {
      display: table-cell !important;
      text-align: left !important;
      color: #64748b !important;
      font-size: 9pt !important;
      font-weight: 600 !important;
    }
    .fnb-val {
      display: table-cell !important;
      text-align: right !important;
      font-weight: 800 !important;
      color: #0f172a !important;
      font-size: 9.5pt !important;
    }
    .fnb-total .fnb-label {
      font-size: 11pt !important;
      font-weight: 800 !important;
      color: #0a1e3f !important;
      padding-top: 6px !important;
      border-top: 1px solid #e2e8f0 !important;
    }
    .fnb-total .fnb-val {
      font-size: 13pt !important;
      font-weight: 900 !important;
      color: #ea580c !important;
      padding-top: 6px !important;
      border-top: 1px solid #e2e8f0 !important;
    }

    /* Footer / Terms / Note */
    .fac-footer-note, .fac-bank-info, .fac-guarantee-strip {
      margin-top: 16px !important;
      font-size: 8.5pt !important;
      color: #475569 !important;
    }

    /* General Layout Fallbacks */
    .row, .grid, .flex-row, .d-flex { display: table !important; width: 100% !important; }
    .col, .col-6, .flex-col { display: table-cell !important; vertical-align: top !important; }

    .word-footer {
      margin-top: 30pt;
      padding-top: 10pt;
      border-top: 1.5px solid #e2e8f0;
      font-size: 7.5pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  ${htmlContent}

  <div class="word-footer">
    <strong>BENJEDDOU Technologie Services</strong> — Plateforme ERP Multi-Tenant — Document Officiel & Confidentiel<br>
    Généré automatiquement le ${dateStr}
  </div>
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    this._downloadBlob(blob, `${filename}.doc`);
  }

  /**
   * Helper d'aide pour convertir les URLs / chaînes SVG en PNG Data URI via HTML Canvas.
   */
  private _convertSvgUrlToPng(svgUrl: string, width: number = 120, height: number = 120): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width * 2;
          canvas.height = height * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {}
        resolve('');
      };
      img.onerror = () => resolve('');
      img.src = svgUrl;
    });
  }


  /**
   * Exporte un tableau vers un fichier Word (.doc) au format professionnel.
   */

  exportTableToWord(
    columns: string[],
    rows: (string | number)[][],
    title: string,
    filename: string
  ): void {
    const tableRows = rows.map((row, ri) =>
      `<tr style="background:${ri % 2 === 0 ? '#f8fafc' : '#ffffff'}">
        ${row.map((cell, ci) =>
          `<td style="border:1px solid #e2e8f0;padding:8pt 10pt;font-size:9.5pt;${ci === 0 ? 'font-weight:bold;color:#0f172a;' : ''}">${cell ?? '—'}</td>`
        ).join('')}
      </tr>`
    ).join('');

    const headerCells = columns.map(c =>
      `<th style="background:#0f172a;color:#ffffff;padding:9pt 10pt;font-size:9.5pt;text-align:left;border:1px solid #0f172a">${c}</th>`
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
    @page { size: A4 landscape; margin: 1.5cm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #0f172a; }
    .banner { background: #0f172a; color: #fff; padding: 14px 18px; border-radius: 6px; margin-bottom: 16px; border-left: 5px solid #4f46e5; }
    .banner h1 { margin: 0; font-size: 15pt; color: #fff; }
    .banner p { margin: 3px 0 0 0; font-size: 8.5pt; color: #94a3b8; }
    table { border-collapse: collapse; width: 100%; margin-top: 10pt; }
  </style>
</head>
<body>
  <div class="banner">
    <h1>${title}</h1>
    <p>Généré le ${new Date().toLocaleDateString('fr-FR')} — Plateforme BENJEDDOU ERP</p>
  </div>
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
   * Exporte un élément DOM ou document HTML vers Microsoft Excel (.xls).
   * Intègre la déclaration XML MS Excel avec grille active (Gridlines) et styles élégants.
   */
  exportElementToExcel(elementId: string, title: string, filename: string): void {
    const el = document.getElementById(elementId);
    if (!el) {
      console.warn(`ExportService: #${elementId} introuvable pour export Excel`);
      return;
    }

    const htmlContent = el.innerHTML;
    const isRtl = document.dir === 'rtl' || el.getAttribute('dir') === 'rtl';

    const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:x='urn:schemas-microsoft-com:office:excel'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>BENJEDDOU ERP</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:ValidPrinterInfo/>
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; direction: ${isRtl ? 'rtl' : 'ltr'}; }
    .excel-title-bar { background-color: #0f172a; color: #ffffff; font-size: 14pt; font-weight: bold; padding: 10px; }
    .excel-sub-bar { background-color: #f1f5f9; color: #475569; font-size: 9pt; padding: 6px; border-bottom: 2pt solid #cbd5e1; }
    table { border-collapse: collapse; width: 100%; margin-top: 10pt; }
    th { background-color: #1e293b; color: #ffffff; border: 0.5pt solid #94a3b8; padding: 8px 12px; font-weight: bold; font-size: 10pt; text-align: ${isRtl ? 'right' : 'left'}; }
    td { border: 0.5pt solid #cbd5e1; padding: 7px 10px; font-size: 9.5pt; vertical-align: middle; }
    tr:nth-child(even) td { background-color: #f8fafc; }
    tr.total-row td, tr.highlight-row td { background-color: #e0e7ff; font-weight: bold; color: #1e1b4b; border-top: 1.5pt solid #4f46e5; }
    .no-export, .no-print, button, input, select { display: none !important; }
    .badge { font-weight: bold; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="6" class="excel-title-bar">BENJEDDOU ERP — ${title}</td>
    </tr>
    <tr>
      <td colspan="6" class="excel-sub-bar">Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
    </tr>
  </table>
  <br>
  ${htmlContent}
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    this._downloadBlob(blob, `${filename}.xls`);
  }

  /**
   * Exporte un tableau de données vers Excel (.xls) avec grille active et styles modernes.
   */
  exportTableToExcel(
    columns: string[],
    rows: (string | number)[][],
    title: string,
    filename: string
  ): void {
    const headerCells = columns.map(c =>
      `<th style="background:#0f172a;color:#ffffff;padding:9px 12px;border:0.5pt solid #475569;font-weight:bold;font-size:10pt">${c}</th>`
    ).join('');

    const bodyRows = rows.map((row, ri) =>
      `<tr style="background:${ri % 2 === 0 ? '#f8fafc' : '#ffffff'}">
        ${row.map((cell, ci) => {
          const val = String(cell ?? '');
          const isNum = !isNaN(Number(val.replace(' TND', '').replace('%', '').trim()));
          const align = isNum ? 'text-align:right;' : 'text-align:left;';
          return `<td style="border:0.5pt solid #cbd5e1;padding:7px 10px;font-size:9.5pt;${align}">${val || '—'}</td>`;
        }).join('')}
      </tr>`
    ).join('');

    const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:x='urn:schemas-microsoft-com:office:excel'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>BENJEDDOU ERP</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    .title-cell { background-color: #0f172a; color: #ffffff; font-size: 13pt; font-weight: bold; padding: 10px; }
    .sub-cell { background-color: #f1f5f9; color: #64748b; font-size: 9pt; padding: 6px; }
  </style>
</head>
<body>
  <table>
    <tr><td colspan="${columns.length}" class="title-cell">BENJEDDOU ERP — ${title}</td></tr>
    <tr><td colspan="${columns.length}" class="sub-cell">Généré le ${new Date().toLocaleDateString('fr-FR')} — ${rows.length} enregistrement(s)</td></tr>
  </table>
  <br>
  <table border="1">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    this._downloadBlob(blob, `${filename}.xls`);
  }


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
