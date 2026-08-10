import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface EnterpriseBranding {
  nomEntreprise: string;
  sloganEntreprise: string;
  couleurPrimaire: string;
  couleurSecondaire: string;
  adresse: string;
  telephone: string;
  email: string;
  siteWeb: string;
  matriculeFiscal: string;
  rib: string;
  piedPageFacture: string;
  headerDevis: string;
}

@Component({
  selector: 'app-enterprise-branding',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="branding-root">

  <!-- Header -->
  <div class="branding-header">
    <div class="bh-left">
      <div class="bh-icon">
        <span class="material-symbols-outlined">business</span>
      </div>
      <div>
        <h1>{{ 'ENTERPRISE_BRANDING.TITLE' | translate }}</h1>
        <p>{{ 'ENTERPRISE_BRANDING.SUBTITLE' | translate }}</p>
      </div>
    </div>
    <button class="btn-save" (click)="saveBranding()">
      <span class="material-symbols-outlined">save</span>
      {{ 'ENTERPRISE_BRANDING.BTN_SAVE' | translate }}
    </button>
  </div>

  <!-- Success -->
  <div class="save-ok" *ngIf="saved">
    <span class="material-symbols-outlined">check_circle</span>
    {{ 'COMMON.SUCCESS' | translate }}
  </div>

  <div class="branding-layout">

    <!-- ── LEFT : Formulaire ────────────────────────────────────── -->
    <div class="form-panel">

      <!-- Logo -->
      <div class="form-section">
        <div class="fs-title">
          <span class="material-symbols-outlined">image</span>
          {{ 'ENTERPRISE_BRANDING.LOGO_SECTION' | translate }}
        </div>
        <div class="logo-area">
          <div class="logo-current">
            <img *ngIf="logoPreview" [src]="logoPreview" alt="Logo" class="logo-img" />
            <div *ngIf="!logoPreview" class="logo-placeholder">
              <span class="material-symbols-outlined">business</span>
              <span>{{ branding.nomEntreprise || ('ENTERPRISE_BRANDING.COMPANY_NAME' | translate) }}</span>
            </div>
          </div>
          <div class="logo-actions">
            <button class="btn-upload" (click)="fileInput.click()">
              <input #fileInput type="file" accept="image/*" style="display:none" (change)="onLogoUpload($event)" />
              <span class="material-symbols-outlined">upload</span>
              {{ 'ENTERPRISE_BRANDING.UPLOAD_LOGO' | translate }}
            </button>
            <div class="upload-specs">{{ 'ENTERPRISE_BRANDING.LOGO_SPECS' | translate }}</div>
          </div>
        </div>
      </div>

      <!-- Informations generales -->
      <div class="form-section">
        <div class="fs-title">
          <span class="material-symbols-outlined">info</span>
          {{ 'ENTERPRISE_BRANDING.GENERAL_INFO' | translate }}
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.COMPANY_NAME' | translate }}</label>
            <input type="text" [(ngModel)]="branding.nomEntreprise" placeholder="Ex: Alpha Invest SARL" />
          </div>
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.SLOGAN' | translate }}</label>
            <input type="text" [(ngModel)]="branding.sloganEntreprise" placeholder="Ex: L'excellence en gestion" />
          </div>
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.ADDRESS' | translate }}</label>
            <input type="text" [(ngModel)]="branding.adresse" placeholder="Ex: 12 Rue Habib Bourguiba, Tunis" />
          </div>
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.PHONE' | translate }}</label>
            <input type="tel" [(ngModel)]="branding.telephone" placeholder="Ex: +216 71 XXX XXX" />
          </div>
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.EMAIL' | translate }}</label>
            <input type="email" [(ngModel)]="branding.email" placeholder="Ex: contact@entreprise.com" />
          </div>
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.WEBSITE' | translate }}</label>
            <input type="url" [(ngModel)]="branding.siteWeb" placeholder="Ex: https://www.entreprise.com" />
          </div>
        </div>
      </div>

      <!-- Informations legales -->
      <div class="form-section">
        <div class="fs-title">
          <span class="material-symbols-outlined">gavel</span>
          {{ 'ENTERPRISE_BRANDING.LEGAL_INFO' | translate }}
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.TAX_ID' | translate }}</label>
            <input type="text" [(ngModel)]="branding.matriculeFiscal" placeholder="Ex: 1234567A/B/C/000" />
          </div>
          <div class="form-field">
            <label>{{ 'ENTERPRISE_BRANDING.RIB' | translate }}</label>
            <input type="text" [(ngModel)]="branding.rib" placeholder="Ex: TN59 0000 0000 0000 0000 0000" />
          </div>
        </div>
      </div>

      <!-- Couleurs -->
      <div class="form-section">
        <div class="fs-title">
          <span class="material-symbols-outlined">palette</span>
          {{ 'ENTERPRISE_BRANDING.COLORS_SECTION' | translate }}
        </div>
        <div class="colors-row">
          <div class="color-field">
            <label>{{ 'ENTERPRISE_BRANDING.PRIMARY_COLOR' | translate }}</label>
            <div class="color-pick-inline">
              <input type="color" [(ngModel)]="branding.couleurPrimaire" (ngModelChange)="updatePreview()" />
              <span class="color-label">{{ branding.couleurPrimaire }}</span>
            </div>
          </div>
          <div class="color-field">
            <label>{{ 'ENTERPRISE_BRANDING.SECONDARY_COLOR' | translate }}</label>
            <div class="color-pick-inline">
              <input type="color" [(ngModel)]="branding.couleurSecondaire" (ngModelChange)="updatePreview()" />
              <span class="color-label">{{ branding.couleurSecondaire }}</span>
            </div>
          </div>
          <div class="palette-presets">
            <div class="palette-label">{{ 'ENTERPRISE_BRANDING.SUGGESTED_PALETTES' | translate }}</div>
            <div class="palette-list">
              <button *ngFor="let p of palettes" class="palette-btn" (click)="applyPalette(p)">
                <span [style.background]="p[0]"></span>
                <span [style.background]="p[1]"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents commerciaux -->
      <div class="form-section">
        <div class="fs-title">
          <span class="material-symbols-outlined">description</span>
          Documents commerciaux
        </div>
        <div class="form-field full">
          <label>En-tete des devis (texte supplementaire)</label>
          <textarea [(ngModel)]="branding.headerDevis" rows="3" placeholder="Ex: Merci de votre confiance. Ce devis est valable 30 jours."></textarea>
        </div>
        <div class="form-field full">
          <label>Pied de page des factures</label>
          <textarea [(ngModel)]="branding.piedPageFacture" rows="3" placeholder="Ex: En cas de retard de paiement, une penalite de 2% par mois sera appliquee. Merci de votre confiance."></textarea>
        </div>
      </div>

    </div>

    <!-- ── RIGHT : Apercu Facture ─────────────────────────────── -->
    <div class="preview-column">
      <div class="preview-label">
        <span class="material-symbols-outlined">preview</span>
        Apercu document (Facture)
      </div>

      <div class="doc-preview">
        <!-- Header facture -->
        <div class="doc-header" [style.background]="'linear-gradient(135deg,' + branding.couleurPrimaire + ',' + branding.couleurSecondaire + ')'">
          <div class="doc-logo-area">
            <img *ngIf="logoPreview" [src]="logoPreview" alt="Logo" class="doc-logo" />
            <div *ngIf="!logoPreview" class="doc-logo-placeholder">
              <span class="material-symbols-outlined">business</span>
            </div>
          </div>
          <div class="doc-company-info">
            <div class="doc-company-name">{{ branding.nomEntreprise || 'Nom de l\'Entreprise' }}</div>
            <div class="doc-company-tagline">{{ branding.sloganEntreprise }}</div>
          </div>
          <div class="doc-title-box">
            <div class="doc-title">FACTURE</div>
            <div class="doc-num">N° FAC-2025-001</div>
          </div>
        </div>

        <!-- Infos facture -->
        <div class="doc-body">
          <div class="doc-info-row">
            <div class="doc-sender">
              <div class="doc-info-label">Emis par</div>
              <div class="doc-info-val">{{ branding.nomEntreprise || 'Votre Entreprise' }}</div>
              <div class="doc-info-sub">{{ branding.adresse || 'Adresse de l\'entreprise' }}</div>
              <div class="doc-info-sub">{{ branding.telephone }} · {{ branding.email }}</div>
              <div class="doc-info-sub">MF: {{ branding.matriculeFiscal || 'XXXX/A/B/000' }}</div>
            </div>
            <div class="doc-recipient">
              <div class="doc-info-label">Facture a</div>
              <div class="doc-info-val">Client Example SARL</div>
              <div class="doc-info-sub">123 Rue Example, Sfax</div>
              <div class="doc-info-sub">+216 74 XXX XXX</div>
            </div>
            <div class="doc-dates">
              <div class="doc-date-row">
                <span>Date</span>
                <span>{{ today }}</span>
              </div>
              <div class="doc-date-row">
                <span>Echeance</span>
                <span>{{ in30 }}</span>
              </div>
              <div class="doc-date-row due">
                <span>Total TTC</span>
                <span [style.color]="branding.couleurPrimaire">1 450.00 DT</span>
              </div>
            </div>
          </div>

          <!-- Table items -->
          <table class="doc-table">
            <thead>
              <tr [style.background]="branding.couleurPrimaire + '15'" [style.borderColor]="branding.couleurPrimaire + '30'">
                <th>Description</th>
                <th>Qte</th>
                <th>Prix U.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Prestation de service ERP</td><td>1</td><td>1 000.00 DT</td><td>1 000.00 DT</td>
              </tr>
              <tr>
                <td>Formation utilisateurs</td><td>2</td><td>200.00 DT</td><td>400.00 DT</td>
              </tr>
              <tr>
                <td>Support mensuel</td><td>1</td><td>50.00 DT</td><td>50.00 DT</td>
              </tr>
            </tbody>
          </table>

          <!-- Totaux -->
          <div class="doc-totals">
            <div class="dt-row"><span>Sous-total HT</span><span>1 250.00 DT</span></div>
            <div class="dt-row"><span>TVA (19%)</span><span>237.50 DT</span></div>
            <div class="dt-row total" [style.color]="branding.couleurPrimaire">
              <span>Total TTC</span><span>1 487.50 DT</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="doc-footer-note" *ngIf="branding.piedPageFacture">
            {{ branding.piedPageFacture }}
          </div>
          <div class="doc-footer-note" *ngIf="!branding.piedPageFacture" style="color: #1e293b; font-style: italic;">
            Pied de page de la facture apparaitra ici...
          </div>

          <div class="doc-rib" *ngIf="branding.rib">
            RIB : {{ branding.rib }} · {{ branding.siteWeb }}
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    .branding-root { padding: 28px; font-family: 'Inter', sans-serif; }

    .branding-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
    }
    .bh-left { display: flex; align-items: center; gap: 14px; }
    .bh-icon {
      width: 46px; height: 46px; border-radius: 12px;
      background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.2);
      display: flex; align-items: center; justify-content: center;
    }
    .bh-icon .material-symbols-outlined { color: #3b82f6; font-size: 22px; }
    .branding-header h1 { font-size: 1.2rem; font-weight: 800; color: #f1f5f9; margin: 0; }
    .branding-header p { font-size: .82rem; color: #334155; margin: 3px 0 0; }

    .btn-save {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 20px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none; border-radius: 10px;
      color: #fff; font-size: .83rem; font-weight: 700;
      cursor: pointer; box-shadow: 0 4px 14px rgba(249,115,22,.3);
      font-family: inherit; transition: all .2s;
    }
    .btn-save:hover { transform: translateY(-1px); }
    .btn-save .material-symbols-outlined { font-size: 16px; }

    .save-ok {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 18px;
      background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2);
      border-radius: 10px; color: #22c55e; font-size: .85rem; font-weight: 600;
      margin-bottom: 20px;
    }
    .save-ok .material-symbols-outlined { font-size: 18px; }

    .branding-layout {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      align-items: start;
    }

    /* Form Panel */
    .form-panel { display: flex; flex-direction: column; gap: 16px; }
    .form-section {
      background: rgba(255,255,255,.025);
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 14px;
      padding: 20px;
    }
    .fs-title {
      display: flex; align-items: center; gap: 8px;
      font-size: .78rem; font-weight: 800;
      color: #94a3b8; text-transform: uppercase; letter-spacing: .08em;
      margin-bottom: 18px;
    }
    .fs-title .material-symbols-outlined { font-size: 16px; color: #3b82f6; }

    .logo-area { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
    .logo-current {
      width: 120px; height: 64px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .logo-placeholder {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      font-size: .65rem; color: #334155; text-align: center;
    }
    .logo-placeholder .material-symbols-outlined { font-size: 22px; }
    .logo-actions { display: flex; flex-direction: column; gap: 6px; }
    .btn-upload {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 9px;
      color: #94a3b8; font-size: .8rem; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: all .2s;
    }
    .btn-upload:hover { border-color: rgba(249,115,22,.3); color: #f97316; }
    .btn-upload .material-symbols-outlined { font-size: 15px; }
    .upload-specs { font-size: .72rem; color: #1e293b; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-field { display: flex; flex-direction: column; gap: 5px; }
    .form-field.full { grid-column: 1 / -1; }
    .form-field label { font-size: .78rem; font-weight: 600; color: #64748b; }
    .form-field input, .form-field textarea {
      padding: 8px 12px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 9px;
      color: #e2e8f0; font-size: .85rem; font-family: inherit;
      transition: border-color .2s; resize: vertical;
    }
    .form-field input:focus, .form-field textarea:focus {
      outline: none; border-color: rgba(249,115,22,.4);
    }
    .form-field textarea { min-height: 70px; }

    .colors-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
    .color-field { display: flex; flex-direction: column; gap: 6px; }
    .color-field label { font-size: .78rem; font-weight: 600; color: #64748b; }
    .color-pick-inline { display: flex; align-items: center; gap: 8px; }
    .color-pick-inline input {
      width: 42px; height: 42px; padding: 2px;
      border: 2px solid rgba(255,255,255,.1); border-radius: 10px;
      background: transparent; cursor: pointer;
    }
    .color-label { font-size: .75rem; color: #334155; font-family: monospace; }
    .palette-presets { flex: 1; }
    .palette-label { font-size: .75rem; color: #334155; margin-bottom: 8px; }
    .palette-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .palette-btn {
      display: flex; overflow: hidden;
      width: 40px; height: 22px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,.1);
      cursor: pointer; transition: all .2s;
    }
    .palette-btn span { flex: 1; }
    .palette-btn:hover { transform: scale(1.1); border-color: rgba(255,255,255,.25); }

    /* Preview column */
    .preview-column { position: sticky; top: 80px; }
    .preview-label {
      display: flex; align-items: center; gap: 6px;
      font-size: .76rem; font-weight: 700; color: #334155;
      text-transform: uppercase; letter-spacing: .08em;
      margin-bottom: 14px;
    }
    .preview-label .material-symbols-outlined { font-size: 15px; }

    /* Document preview */
    .doc-preview {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,.4);
      font-family: 'Inter', sans-serif;
      font-size: .72rem;
    }
    .doc-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      color: #fff;
      transition: background .3s;
    }
    .doc-logo-area {
      width: 56px; height: 36px;
      background: rgba(255,255,255,.2);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .doc-logo { max-width: 100%; max-height: 100%; object-fit: contain; }
    .doc-logo-placeholder .material-symbols-outlined { font-size: 20px; color: rgba(255,255,255,.8); }
    .doc-company-info { flex: 1; }
    .doc-company-name { font-size: .85rem; font-weight: 800; }
    .doc-company-tagline { font-size: .65rem; opacity: .8; margin-top: 2px; }
    .doc-title-box { text-align: right; }
    .doc-title { font-size: 1.1rem; font-weight: 900; letter-spacing: .08em; }
    .doc-num { font-size: .65rem; opacity: .8; margin-top: 2px; }

    .doc-body { padding: 16px 20px; }
    .doc-info-row { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .doc-sender, .doc-recipient, .doc-dates { flex: 1; min-width: 100px; }
    .doc-info-label {
      font-size: .6rem; font-weight: 800; text-transform: uppercase;
      color: #94a3b8; letter-spacing: .08em; margin-bottom: 4px;
    }
    .doc-info-val { font-size: .72rem; font-weight: 700; color: #1e293b; }
    .doc-info-sub { font-size: .62rem; color: #64748b; margin-top: 1px; }
    .doc-date-row {
      display: flex; justify-content: space-between;
      padding: 3px 0; border-bottom: 1px solid #f1f5f9;
      font-size: .65rem; color: #64748b;
    }
    .doc-date-row.due { font-weight: 800; font-size: .72rem; }
    .doc-date-row.due span:first-child { color: #1e293b; }

    .doc-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: .65rem;
    }
    .doc-table th {
      text-align: left; padding: 5px 8px;
      font-weight: 700; color: #1e293b;
      border-bottom: 2px solid;
    }
    .doc-table td {
      padding: 4px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
    }

    .doc-totals {
      float: right;
      min-width: 160px;
      margin-bottom: 12px;
    }
    .dt-row {
      display: flex; justify-content: space-between; gap: 16px;
      padding: 3px 0; border-bottom: 1px solid #f1f5f9;
      font-size: .65rem; color: #475569;
    }
    .dt-row.total {
      font-size: .78rem; font-weight: 900;
      border-bottom: 2px solid currentColor;
      padding-top: 5px; margin-top: 4px;
    }

    .doc-footer-note {
      clear: both;
      padding: 10px 12px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: .6rem; color: #64748b; line-height: 1.5;
      border-left: 3px solid #e2e8f0;
      margin-top: 10px;
    }
    .doc-rib {
      margin-top: 8px; padding: 6px;
      text-align: center;
      font-size: .58rem; color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }

    @media (max-width: 1100px) {
      .branding-layout { grid-template-columns: 1fr; }
      .preview-column { position: static; }
    }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class EnterpriseBrandingComponent implements OnInit {
  branding: EnterpriseBranding = {
    nomEntreprise: '',
    sloganEntreprise: '',
    couleurPrimaire: '#f97316',
    couleurSecondaire: '#ea580c',
    adresse: '',
    telephone: '',
    email: '',
    siteWeb: '',
    matriculeFiscal: '',
    rib: '',
    piedPageFacture: '',
    headerDevis: '',
  };

  logoPreview: string | null = null;
  saved = false;

  palettes: [string, string][] = [
    ['#f97316', '#ea580c'],
    ['#3b82f6', '#2563eb'],
    ['#22c55e', '#16a34a'],
    ['#a855f7', '#7c3aed'],
    ['#ec4899', '#db2777'],
    ['#0891b2', '#0e7490'],
    ['#1e293b', '#334155'],
    ['#dc2626', '#b91c1c'],
  ];

  get today(): string {
    return new Date().toLocaleDateString('fr-TN');
  }
  get in30(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('fr-TN');
  }

  ngOnInit() {
    const saved = localStorage.getItem('enterprise_branding');
    if (saved) {
      try { this.branding = { ...this.branding, ...JSON.parse(saved) }; } catch {}
    }
    const logo = localStorage.getItem('enterprise_logo');
    if (logo) this.logoPreview = logo;
  }

  onLogoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview = e.target?.result as string;
      localStorage.setItem('enterprise_logo', this.logoPreview);
    };
    reader.readAsDataURL(file);
  }

  applyPalette(p: [string, string]) {
    this.branding.couleurPrimaire = p[0];
    this.branding.couleurSecondaire = p[1];
    this.updatePreview();
  }

  updatePreview() { /* live update handled by Angular binding */ }

  saveBranding() {
    localStorage.setItem('enterprise_branding', JSON.stringify(this.branding));
    this.saved = true;
    setTimeout(() => this.saved = false, 3500);
  }
}
