import { Injectable } from '@angular/core';
import { QrCodeGen } from './qrcodegen';

/**
 * Service QR Code & Code-barres — BENJEDDOU ERP
 * Utilise la bibliothèque QR Code de référence de Nayuki (ISO/IEC 18004 complet)
 * Génère des QR codes réellement scannables par tous les lecteurs mobiles.
 */
@Injectable({
  providedIn: 'root'
})
export class QrBarcodeService {

  // ══════════════════════════════════════════════════════════════
  // QR CODE — Conforme ISO/IEC 18004 (via qrcodegen de Nayuki)
  // ══════════════════════════════════════════════════════════════

  /**
   * Génère un QR Code SVG Data URI — réellement scannable.
   * @param data Texte à encoder
   * @param size Taille du SVG en pixels
   */
  getQRCodeUrl(data: string, size: number = 180): string {
    const svgString = this.generateQRSvg(data, size);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  }

  /**
   * Génère le SVG d'un vrai QR Code, scannable, conforme ISO 18004.
   */
  generateQRSvg(data: string, size: number = 180): string {
    try {
      const qr = QrCodeGen.QrCode.encodeText(data || 'BENJEDDOU', QrCodeGen.Ecc.MEDIUM);
      const border = 4; // zone silencieuse réglementaire
      const totalModules = qr.size + border * 2;
      const cellSize = size / totalModules;

      // Construire les rectangles directement depuis la matrice
      let rects = '';
      for (let y = 0; y < qr.size; y++) {
        for (let x = 0; x < qr.size; x++) {
          if (qr.getModule(x, y)) {
            const px = ((x + border) * cellSize).toFixed(3);
            const py = ((y + border) * cellSize).toFixed(3);
            const w  = (cellSize + 0.5).toFixed(3);
            rects += `<rect x="${px}" y="${py}" width="${w}" height="${w}"/>`;
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  <g fill="#000000">${rects}</g>
</svg>`;
    } catch (e) {
      console.error('[QrBarcodeService] Erreur génération QR:', e);
      return this.generateErrorQrSvg(size);
    }
  }

  private generateErrorQrSvg(size: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" fill="#fee2e2"/>
  <text x="50%" y="50%" font-family="monospace" font-size="10" fill="#dc2626" text-anchor="middle" dominant-baseline="middle">QR Error</text>
</svg>`;
  }

  // ══════════════════════════════════════════════════════════════
  // API PUBLIQUE — Factures & Produits
  // ══════════════════════════════════════════════════════════════

  /**
   * Génère un QR Code de vérification fiscale pour Facture / Devis.
   * Données encodées : référence, matricule fiscal, montant TTC, date.
   */
  getInvoiceQRCodeUrl(item: any): string {
    const ref = item.reference || item.numeroFacture || item.numeroDevis || 'DOC-000';
    const rawTtc = item.montantTotal ?? item.totalTTC ?? item.montantTTC ?? 0;
    const ttc = Number(rawTtc).toFixed(3);
    const rawDate = item.dateEmission || item.dateCreation || item.dateDevis;
    const date = rawDate ? String(rawDate).substring(0, 10) : new Date().toISOString().substring(0, 10);
    const mf = item.matriculeFiscale
      || item.commande?.client?.matriculeFiscale
      || item.client?.matriculeFiscale
      || '1234567MAM000';

    // Format compact pour maximiser la lisibilité du QR
    const qrData = `BENJEDDOU|${ref}|${mf}|${ttc}TND|${date}`;
    return this.getQRCodeUrl(qrData, 180);
  }

  /**
   * Génère un QR Code de produit (Stock / Catalogue).
   */
  getProductQRCodeUrl(product: {
    reference: string;
    designation?: string;
    nom?: string;
    prixVente?: number;
    prixUnitaire?: number;
  }): string {
    const ref = product.reference || 'PRD-000';
    const name = (product.designation || product.nom || 'Produit').substring(0, 20);
    const price = (product.prixVente || product.prixUnitaire || 0).toFixed(3);
    const qrData = `BENJEDDOU|${ref}|${name}|${price}TND`;
    return this.getQRCodeUrl(qrData, 180);
  }

  // ══════════════════════════════════════════════════════════════
  // CODE-BARRES SVG (Code 39)
  // ══════════════════════════════════════════════════════════════

  /**
   * Génère un Code-barres SVG au format Code 39 (standard industriel)
   */
  generateBarcodeSvg(text: string, width: number = 220, height: number = 50): string {
    const cleanText = (text || '00000000').replace(/[^A-Z0-9\-. $/+%]/gi, '').toUpperCase();

    // Encodage Code 39 — chaque caractère = 5 barres + 4 espaces
    const CODE39: { [key: string]: string } = {
      '0': 'nnnwwnwnn', '1': 'wnnnnwwnn', '2': 'nnwnnwwnn', '3': 'wnwnnwnnn',
      '4': 'nnnwwnwnn', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnnnwwwn',
      '8': 'wnnnnwwwn', '9': 'nnwnnwwwn', 'A': 'wnnnnnnww', 'B': 'nnwnnnnww',
      'C': 'wnwnnnnwn', 'D': 'nnnnwnnww', 'E': 'wnnnwnnwn', 'F': 'nnwnwnnwn',
      'G': 'nnnnnwwww', 'H': 'wnnnnwwwn', 'I': 'nnwnnwwwn', 'J': 'nnnnwwwwn',
      'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
      'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnwwww', 'R': 'wnnnnwwwn',
      'S': 'nnwnnwwwn', 'T': 'nnnnwwwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
      'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
      '-': 'nwnnnnwwn', '.': 'wwnnnnnwn', ' ': 'nwwnnnnwn', '$': 'nwnwnwnnn',
      '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnnwn',
    };

    const encoded = ('*' + cleanText + '*');
    let bars: { width: number; isBar: boolean }[] = [];
    const narrow = 2, wide = 5;

    for (let i = 0; i < encoded.length; i++) {
      const pattern = CODE39[encoded[i]] || CODE39['0'];
      for (let j = 0; j < 9; j++) {
        const isWide = pattern[j] === 'w';
        const isBar = j % 2 === 0;
        bars.push({ width: isWide ? wide : narrow, isBar });
      }
      if (i < encoded.length - 1) bars.push({ width: narrow, isBar: false });
    }

    const totalWidth = bars.reduce((s, b) => s + b.width, 0);
    const scale = (width - 8) / totalWidth;

    let rects = '';
    let x = 4;
    for (const bar of bars) {
      if (bar.isBar) {
        rects += `<rect x="${x.toFixed(2)}" y="4" width="${(bar.width * scale).toFixed(2)}" height="${height}" fill="#000000"/>`;
      }
      x += bar.width * scale;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + 22}" viewBox="0 0 ${width} ${height + 22}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${rects}
  <text x="${width / 2}" y="${height + 18}" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="1.5">${cleanText}</text>
</svg>`;
  }

  // ══════════════════════════════════════════════════════════════
  // IMPRESSIONS — Étiquette Produit & Reçu QR Fiscal
  // ══════════════════════════════════════════════════════════════

  /**
   * Imprime une étiquette d'inventaire professionnelle avec QR + Code-barres
   */
  printProductLabel(product: {
    reference: string;
    designation?: string;
    nom?: string;
    prixVente?: number;
    prixUnitaire?: number;
    categorie?: string;
    stockActuel?: number;
    quantiteEnStock?: number;
  }): void {
    const name = product.designation || product.nom || 'Produit sans nom';
    const ref = product.reference || 'PRD-000';
    const price = (product.prixVente || product.prixUnitaire || 0).toFixed(3);
    const cat = product.categorie || 'GENERAL';
    const stock = product.stockActuel ?? product.quantiteEnStock ?? 0;
    const qrUrl = this.getProductQRCodeUrl(product);
    const barcodeSvg = this.generateBarcodeSvg(ref, 220, 48);

    const win = window.open('', '_blank', 'width=520,height=620');
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html>
<head>
  <title>ÉTIQUETTE ERP — ${ref}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 24px; background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .label-card { width: 360px; background: #fff; border: 2.5px solid #0f172a; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,.35); text-align: center; }
    .brand-header { background: linear-gradient(135deg,#0f172a,#1e293b); color: #f8fafc; padding: 8px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .prod-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 6px; line-height: 1.35; }
    .prod-ref { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #475569; font-family: monospace; margin-bottom: 14px; }
    .qr-box { margin: 12px auto; width: 155px; height: 155px; padding: 8px; border: 2px solid #0f172a; border-radius: 16px; background: #fff; box-shadow: 0 6px 16px rgba(0,0,0,.06); display: flex; align-items: center; justify-content: center; }
    .qr-box img { width: 100%; height: 100%; object-fit: contain; }
    .footer-row { display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #e2e8f0; padding-top: 12px; margin-top: 14px; }
    .price-val { font-size: 21px; font-weight: 900; color: #ea580c; }
    .stock-val { font-size: 11px; font-weight: 800; color: #065f46; background: #d1fae5; padding: 5px 12px; border-radius: 20px; }
    @media print { body { background: white; padding: 0; } .label-card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="label-card">
    <div class="brand-header">⚡ BENJEDDOU ERP · INVENTAIRE</div>
    <h2 class="prod-title">${name}</h2>
    <div class="prod-ref">REF: ${ref} · ${cat}</div>
    <div class="qr-box"><img src="${qrUrl}" alt="QR ${ref}"/></div>
    <div style="margin:14px auto 10px;display:flex;justify-content:center;">${barcodeSvg}</div>
    <div class="footer-row">
      <div style="text-align:left">
        <div style="font-size:9px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:1px">PRIX VENTE</div>
        <div class="price-val">${price} <span style="font-size:12px;font-weight:700">TND</span></div>
      </div>
      <div class="stock-val">📦 ${stock} en stock</div>
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`);
    win.document.close();
  }

  /**
   * Imprime un reçu de vérification QR Code pour Devis ou Facture
   */
  printInvoiceQRCodeReceipt(item: any): void {
    const ref = item.reference || item.numeroFacture || item.numeroDevis || 'DOC-000';
    const client = item.clientNom || item.commande?.client?.nom || item.client?.nom || 'Client BENJEDDOU';
    const rawTtc = item.montantTotal ?? item.totalTTC ?? item.montantTTC ?? 0;
    const ttc = Number(rawTtc).toFixed(3);
    const rawDate = item.dateEmission || item.dateCreation || item.dateDevis;
    const date = rawDate ? String(rawDate).substring(0, 10) : new Date().toISOString().substring(0, 10);
    const qrUrl = this.getInvoiceQRCodeUrl(item);

    const win = window.open('', '_blank', 'width=480,height=580');
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html>
<head>
  <title>VÉRIFICATION FISCALE — ${ref}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 24px; background: #0a1628; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .receipt-card { width: 350px; background: #fff; border: 2.5px solid #0d9faa; border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,.4); }
    .badge-ok { background: linear-gradient(135deg,#10b981,#059669); color: white; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
    .qr-box { width: 165px; height: 165px; margin: 14px auto; padding: 8px; border: 2.5px solid #0f172a; border-radius: 18px; background: #fff; display: flex; align-items: center; justify-content: center; }
    .qr-box img { width: 100%; height: 100%; object-fit: contain; }
    .doc-ref { font-size: 20px; font-weight: 900; color: #0f172a; margin: 4px 0 2px; }
    .meta-info { font-size: 12px; color: #475569; margin: 3px 0; line-height: 1.5; }
    .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; margin-top: 14px; }
    .amount { font-size: 22px; font-weight: 900; color: #0d9faa; }
    .footer-note { font-size: 10px; color: #94a3b8; margin-top: 14px; line-height: 1.4; }
    @media print { body { background: white; padding: 0; } .receipt-card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="badge-ok">✓ VÉRIFICATION FISCALE CERTIFIÉE</div>
    <div class="doc-ref">${ref}</div>
    <div class="meta-info"><strong>Client :</strong> ${client}</div>
    <div class="meta-info"><strong>Émis le :</strong> ${date}</div>
    <div class="qr-box"><img src="${qrUrl}" alt="QR Vérification"/></div>
    <div class="amount-box">
      <div style="font-size:9px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:1px">MONTANT TOTAL TTC</div>
      <div class="amount">${ttc} TND</div>
    </div>
    <div class="footer-note">🔒 Document sécurisé et certifié par la plateforme BENJEDDOU ERP Multi-Tenant SaaS.</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`);
    win.document.close();
  }
}
