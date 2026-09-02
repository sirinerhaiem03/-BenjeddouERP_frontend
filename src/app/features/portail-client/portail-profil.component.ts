import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-portail-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrapper">

  <!-- Hero Banner avec avatar -->
  <div class="hero-banner">
    <div class="hero-content">
      <div class="hero-left" *ngIf="!loading && client">
        <div class="avatar-box">{{ initiales }}</div>
        <div class="hero-text">
          <h1 class="hero-title">{{ client.nom }}</h1>
          <p class="hero-desc">CLIENT ERP PORTAIL</p>
          <p class="hero-email">{{ client.email }}</p>
        </div>
      </div>
      <div class="hero-left" *ngIf="loading || !client">
        <div class="hero-icon-wrap">
          <span class="material-symbols-outlined hero-icon">manage_accounts</span>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Mon Profil</h1>
          <p class="hero-desc">Vos informations et coordonnées</p>
        </div>
      </div>
      <button class="btn-edit-hero" *ngIf="!loading && client && !editMode" (click)="startEdit()">
        <span class="material-symbols-outlined">edit</span>
        Modifier
      </button>
    </div>
  </div>

  <!-- Body -->
  <div class="com-body">

    <!-- Skeleton -->
    <div class="skeleton-table" *ngIf="loading">
      <div class="skeleton-row" style="height:200px; border-radius:14px;"></div>
    </div>

    <!-- Grid LECTURE -->
    <div class="profil-grid" *ngIf="!loading && client && !editMode">

      <!-- Informations affichage -->
      <div class="table-card">
        <div class="section-header">
          <span class="material-symbols-outlined">badge</span>
          Informations de contact
        </div>
        <div class="info-list">
          <div class="info-row">
            <div class="info-icon-wrap blue"><span class="material-symbols-outlined">mail</span></div>
            <div class="info-body">
              <div class="info-lbl">Adresse email</div>
              <div class="info-val">{{ client.email }}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-icon-wrap orange"><span class="material-symbols-outlined">person</span></div>
            <div class="info-body">
              <div class="info-lbl">Prénom & Nom</div>
              <div class="info-val">{{ (client.prenom ? client.prenom + ' ' : '') + (client.nom || '—') }}</div>
            </div>
          </div>
          <div class="info-row" *ngIf="client.societe">
            <div class="info-icon-wrap blue"><span class="material-symbols-outlined">business</span></div>
            <div class="info-body">
              <div class="info-lbl">Société</div>
              <div class="info-val">{{ client.societe }}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-icon-wrap green"><span class="material-symbols-outlined">phone</span></div>
            <div class="info-body">
              <div class="info-lbl">Téléphone</div>
              <div class="info-val" [class.text-muted]="!client.telephone">{{ client.telephone || 'Non renseigné' }}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-icon-wrap purple"><span class="material-symbols-outlined">location_on</span></div>
            <div class="info-body">
              <div class="info-lbl">Adresse</div>
              <div class="info-val" [class.text-muted]="!client.adresse">{{ client.adresse || 'Non renseignée' }}</div>
            </div>
          </div>
          <div class="info-row" *ngIf="client.matriculeFiscale">
            <div class="info-icon-wrap gray"><span class="material-symbols-outlined">domain</span></div>
            <div class="info-body">
              <div class="info-lbl">Matricule fiscal</div>
              <div class="info-val mono-text">{{ client.matriculeFiscale }}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-icon-wrap gray"><span class="material-symbols-outlined">calendar_today</span></div>
            <div class="info-body">
              <div class="info-lbl">Client depuis</div>
              <div class="info-val">{{ client.dateCreation | date:'dd/MM/yyyy' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sécurité et services -->
      <div class="features-col">
        <div class="kpi-strip-card kpi-s-green">
          <div class="kpi-s-icon"><span class="material-symbols-outlined">lock</span></div>
          <div>
            <div class="kpi-s-label">Sécurité</div>
            <div class="kpi-s-value">Accès sécurisé</div>
            <div class="kpi-s-sub">Données chiffrées et isolées</div>
          </div>
        </div>
        <div class="kpi-strip-card kpi-s-blue">
          <div class="kpi-s-icon"><span class="material-symbols-outlined">sync</span></div>
          <div>
            <div class="kpi-s-label">Synchronisation</div>
            <div class="kpi-s-value">Données temps réel</div>
            <div class="kpi-s-sub">Factures, devis, commandes synchronisés</div>
          </div>
        </div>
        <div class="kpi-strip-card kpi-s-orange">
          <div class="kpi-s-icon"><span class="material-symbols-outlined">credit_card</span></div>
          <div>
            <div class="kpi-s-label">Paiement</div>
            <div class="kpi-s-value">Stripe sécurisé</div>
            <div class="kpi-s-sub">Réglez vos factures en ligne</div>
          </div>
        </div>
      </div>

    </div>

    <!-- ─── MODE EDITION ─── -->
    <div class="edit-layout" *ngIf="!loading && client && editMode">

      <div class="table-card edit-card">
        <div class="section-header">
          <span class="material-symbols-outlined">edit_note</span>
          Modifier mes informations
        </div>

        <div class="edit-form">

          <!-- Email (readonly) -->
          <div class="form-group">
            <label class="form-label">
              <span class="material-symbols-outlined">mail</span>
              Adresse email
            </label>
            <input class="form-input form-input-readonly" [value]="client.email" readonly />
            <span class="form-hint">L'email ne peut pas être modifié</span>
          </div>

          <!-- Prenom -->
          <div class="form-group">
            <label class="form-label">
              <span class="material-symbols-outlined">badge</span>
              Prénom
            </label>
            <input class="form-input" [(ngModel)]="editData.prenom"
                   placeholder="Votre prénom" maxlength="50" />
          </div>

          <!-- Nom -->
          <div class="form-group">
            <label class="form-label">
              <span class="material-symbols-outlined">person</span>
              Nom <span class="required">*</span>
            </label>
            <input class="form-input" [(ngModel)]="editData.nom"
                   placeholder="Votre nom de famille" maxlength="50" />
          </div>

          <!-- Société -->
          <div class="form-group">
            <label class="form-label">
              <span class="material-symbols-outlined">business</span>
              Société
            </label>
            <input class="form-input" [(ngModel)]="editData.societe"
                   placeholder="Nom de votre entreprise" maxlength="200" />
          </div>

          <!-- Téléphone -->
          <div class="form-group">
            <label class="form-label">
              <span class="material-symbols-outlined">phone</span>
              Téléphone
            </label>
            <input class="form-input" [(ngModel)]="editData.telephone"
                   placeholder="+216 XX XXX XXX" maxlength="20" />
          </div>

          <!-- Adresse -->
          <div class="form-group">
            <label class="form-label">
              <span class="material-symbols-outlined">location_on</span>
              Adresse
            </label>
            <textarea class="form-input form-textarea" [(ngModel)]="editData.adresse"
                      placeholder="Votre adresse complète" rows="3" maxlength="500"></textarea>
          </div>

          <!-- Boutons -->
          <div class="form-actions">
            <button class="btn btn-secondary btn-sm" (click)="cancelEdit()" [disabled]="saving">
              <span class="material-symbols-outlined">close</span>
              Annuler
            </button>
            <button class="btn btn-primary" (click)="saveProfile()" [disabled]="saving || !editData.nom?.trim()">
              <span class="material-symbols-outlined" *ngIf="!saving">save</span>
              <span class="btn-spinner" *ngIf="saving"></span>
              {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>

          <!-- Erreur formulaire -->
          <div class="alert-error mt-8" *ngIf="formError">{{ formError }}</div>

        </div>
      </div>

      <!-- Résumé à droite -->
      <div class="features-col">
        <div class="table-card hint-card">
          <div class="section-header">
            <span class="material-symbols-outlined">info</span>
            Informations actuelles
          </div>
          <div class="hint-list">
            <div class="hint-item">
              <span class="hint-lbl">Email</span>
              <span class="hint-val">{{ client.email }}</span>
            </div>
            <div class="hint-item">
              <span class="hint-lbl">Nom</span>
              <span class="hint-val">{{ client.nom }}</span>
            </div>
            <div class="hint-item" *ngIf="client.telephone">
              <span class="hint-lbl">Téléphone</span>
              <span class="hint-val">{{ client.telephone }}</span>
            </div>
            <div class="hint-item" *ngIf="client.adresse">
              <span class="hint-lbl">Adresse</span>
              <span class="hint-val">{{ client.adresse }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- Toast -->
  <div class="alert-success" style="position:fixed;bottom:24px;right:24px;margin:0;z-index:999;animation:fadeInDown 0.3s" *ngIf="toastMsg && !toastError">{{ toastMsg }}</div>
  <div class="alert-error"   style="position:fixed;bottom:24px;right:24px;margin:0;z-index:999;animation:fadeInDown 0.3s" *ngIf="toastMsg && toastError">{{ toastMsg }}</div>

</div>
  `,
  styles: [`
    .page-wrapper { margin: -28px; min-height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; }
    .com-body { padding: 28px 32px; }

    /* ── Hero ── */
    .hero-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1a2744 40%, #0f172a 100%);
      padding: 32px 36px 28px; position: relative; overflow: hidden;
    }
    .hero-banner::before {
      content: ''; position: absolute;
      width: 380px; height: 380px;
      background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
      top: -100px; right: -60px; border-radius: 50%;
    }
    .hero-content { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; gap: 20px; }
    .hero-left { display: flex; align-items: center; gap: 22px; }
    .avatar-box {
      width: 72px; height: 72px; flex-shrink: 0;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      font-size: 1.65rem; font-weight: 900; color: white;
      box-shadow: 0 8px 28px rgba(249,115,22,0.5), 0 0 0 3px rgba(249,115,22,0.2);
      border: 2px solid rgba(255,255,255,0.2);
    }
    .hero-icon-wrap {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1));
      border: 1px solid rgba(249,115,22,0.35);
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(249,115,22,0.2);
    }
    .hero-icon { font-size: 30px !important; color: #f97316; }
    .hero-title { font-size: 1.7rem; font-weight: 800; color: white; margin: 0 0 4px; letter-spacing: -0.02em; }
    .hero-desc  { font-size: 0.7rem; color: #f97316; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 5px; }
    .hero-email { font-size: 0.875rem; color: rgba(255,255,255,0.5); margin: 0; }
    .btn-edit-hero {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.4);
      color: #fdba74; padding: 11px 22px; border-radius: 12px;
      font-size: 0.875rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s; font-family: inherit;
    }
    .btn-edit-hero:hover { background: rgba(249,115,22,0.25); color: white; border-color: rgba(249,115,22,0.6); transform: translateY(-1px); }
    .btn-edit-hero .material-symbols-outlined { font-size: 18px !important; }

    /* ── Skeleton ── */
    .skeleton-row { border-radius: 16px; background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

    /* ── Grid ── */
    .profil-grid, .edit-layout { display: grid; grid-template-columns: 1fr 300px; gap: 22px; }

    /* ── Table card ── */
    .table-card {
      background: white; border: 1.5px solid #e8eef5;
      border-radius: 18px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(15,23,42,0.06);
    }
    .section-header {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 22px; font-size: 0.92rem; font-weight: 800; color: #0f172a;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(to right, #fafbff, white);
    }
    .section-header .material-symbols-outlined { font-size: 20px !important; color: #f97316; }

    /* ── Info rows ── */
    .info-list { display: flex; flex-direction: column; }
    .info-row {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 22px; border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s, border-left 0.15s;
      border-left: 3px solid transparent;
    }
    .info-row:last-child { border-bottom: none; }
    .info-row:hover { background: #fafbff; border-left-color: #f97316; }
    .info-icon-wrap {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .info-icon-wrap .material-symbols-outlined { font-size: 20px !important; }
    .info-icon-wrap.blue   { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #2563eb; }
    .info-icon-wrap.orange { background: linear-gradient(135deg, #fff7ed, #ffedd5); color: #ea580c; }
    .info-icon-wrap.green  { background: linear-gradient(135deg, #f0fdf4, #dcfce7); color: #059669; }
    .info-icon-wrap.purple { background: linear-gradient(135deg, #f5f3ff, #ede9fe); color: #7c3aed; }
    .info-icon-wrap.gray   { background: #f8fafc; color: #64748b; }
    .info-lbl { font-size: 0.64rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
    .info-val { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    .info-val.text-muted { color: #94a3b8; font-style: italic; font-weight: 400; }
    .mono-text { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #7c3aed; }

    /* ── KPI Cards ── */
    .features-col { display: flex; flex-direction: column; gap: 12px; }
    .kpi-strip-card {
      background: white; border-radius: 16px; padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      border: 1px solid #e8eef5; border-left-width: 4px;
      box-shadow: 0 2px 10px rgba(15,23,42,0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-strip-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.1); }
    .kpi-s-icon { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .kpi-s-icon .material-symbols-outlined { font-size: 22px !important; color: white; }
    .kpi-s-label { font-size: 0.64rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
    .kpi-s-value { font-size: 0.92rem; font-weight: 800; color: #0f172a; }
    .kpi-s-sub   { font-size: 0.7rem; color: #64748b; margin-top: 3px; }
    .kpi-s-green  { border-left-color: #10b981; }
    .kpi-s-green  .kpi-s-icon { background: linear-gradient(135deg,#10b981,#059669); box-shadow: 0 4px 14px rgba(16,185,129,0.35); }
    .kpi-s-blue   { border-left-color: #3b82f6; }
    .kpi-s-blue   .kpi-s-icon { background: linear-gradient(135deg,#3b82f6,#2563eb); box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
    .kpi-s-orange { border-left-color: #f97316; }
    .kpi-s-orange .kpi-s-icon { background: linear-gradient(135deg,#f97316,#ea580c); box-shadow: 0 4px 14px rgba(249,115,22,0.35); }

    /* ── Edit form ── */
    .edit-form { padding: 26px 24px; display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 7px; }
    .form-label { display: flex; align-items: center; gap: 6px; font-size: 0.83rem; font-weight: 700; color: #374151; }
    .form-label .material-symbols-outlined { font-size: 17px !important; color: #f97316; }
    .required { color: #ef4444; }
    .form-input {
      width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px;
      font-family: inherit; font-size: 0.875rem; color: #1e293b; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
      background: white;
    }
    .form-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
    .form-input-readonly { background: #f8fafc; color: #64748b; cursor: not-allowed; }
    .form-textarea { resize: vertical; min-height: 90px; }
    .form-hint { font-size: 0.72rem; color: #94a3b8; }

    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 11px; font-family: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-sm { padding: 8px 16px; font-size: 0.82rem; }
    .btn-primary { background: linear-gradient(135deg,#f97316,#ea6c0a); color: white; box-shadow: 0 4px 14px rgba(249,115,22,0.35); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 7px 20px rgba(249,115,22,0.45); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #f8fafc; border: 1.5px solid #e2e8f0; color: #475569; }
    .btn-secondary:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
    .btn .material-symbols-outlined { font-size: 16px !important; }
    .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Hint card ── */
    .hint-list { padding: 14px 22px; display: flex; flex-direction: column; gap: 14px; }
    .hint-item { display: flex; flex-direction: column; gap: 3px; }
    .hint-lbl { font-size: 0.64rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; }
    .hint-val { font-size: 0.875rem; font-weight: 500; color: #374151; word-break: break-word; }

    .alert-success, .alert-error {
      padding: 13px 20px; border-radius: 12px; font-size: 0.875rem; font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12); animation: slideUp 0.3s ease;
    }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
    .alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .mt-8 { margin-top: 10px; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 720px) { .profil-grid, .edit-layout { grid-template-columns: 1fr; } }
  `]

})
export class PortailProfilComponent implements OnInit {
  client: any = null;
  loading = true;
  initiales = '';
  toastMsg = '';
  toastError = false;
  editMode = false;
  saving = false;
  formError = '';
  editData: { nom: string; prenom: string; telephone: string; adresse: string; societe: string } =
    { nom: '', prenom: '', telephone: '', adresse: '', societe: '' };

  ngOnInit(): void {
    this.loadProfil();
  }

  loadProfil(): void {
    const raw = localStorage.getItem('currentUser');
    const parsed = raw ? JSON.parse(raw) : null;
    const token = parsed?.token || null;

    // Fallback immédiat depuis le localStorage
    const fallbackUser = parsed?.user || parsed || null;

    if (!token) {
      // Afficher les données du localStorage si pas de token
      if (fallbackUser) {
        this.buildClientFromFallback(fallbackUser);
      }
      this.loading = false;
      return;
    }

    fetch(`${environment.apiUrl}/portail/profil`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data: any) => {
      if (!data || data.error) {
        // Réponse invalide — fallback
        this.buildClientFromFallback(fallbackUser);
      } else {
        this.client = data;
        const p = (data.prenom || '').trim();
        const n = (data.nom || data.nomUtilisateur || '').trim();
        this.initiales = ((p ? p[0] : '') + (n ? n[0] : '')).toUpperCase() || 'U';
      }
      this.loading = false;
    })
    .catch(() => {
      // Erreur réseau ou serveur — on affiche ce qu'on a dans le localStorage
      this.buildClientFromFallback(fallbackUser);
      this.loading = false;
    });
  }

  private buildClientFromFallback(u: any): void {
    if (!u) {
      this.client = { nom: 'Inconnu', prenom: '', email: '', telephone: '', adresse: '', societe: '' };
    } else {
      this.client = {
        nom:       u.nom      || u.nomUtilisateur || '',
        prenom:    u.prenom   || '',
        email:     u.email    || u.username || '',
        telephone: u.telephone || '',
        adresse:   u.adresse   || '',
        societe:   u.societe   || '',
        dateCreation: u.dateCreation || null,
        nomUtilisateur: u.nomUtilisateur || u.username || ''
      };
    }
    const p = (this.client.prenom || '').trim();
    const n = (this.client.nom || '').trim();
    this.initiales = ((p ? p[0] : '') + (n ? n[0] : '')).toUpperCase() || 'U';
  }

  startEdit(): void {
    this.editData = {
      nom:       this.client.nom       || '',
      prenom:    this.client.prenom    || '',
      telephone: this.client.telephone || '',
      adresse:   this.client.adresse   || '',
      societe:   this.client.societe   || ''
    };
    this.formError = '';
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
    this.formError = '';
  }

  saveProfile(): void {
    if (!this.editData.nom?.trim()) {
      this.formError = 'Le nom est obligatoire.';
      return;
    }
    this.formError = '';
    this.saving = true;

    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw).token : null;
    if (!token) { this.saving = false; return; }

    fetch(`${environment.apiUrl}/portail/profil`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(this.editData)
    })
    .then(r => {
      if (!r.ok) throw new Error('Erreur serveur');
      return r.json();
    })
    .then((updated: any) => {
      this.client = updated;
      const p = (updated.prenom || '').trim();
      const n = (updated.nom || updated.nomUtilisateur || '').trim();
      this.initiales = ((p ? p[0] : '') + (n ? n[0] : '')).toUpperCase() || 'U';
      this.saving = false;

      this.editMode = false;
      this.showToast('Profil mis à jour avec succès !');
    })
    .catch(() => {
      this.saving = false;
      this.showToast('Erreur lors de la mise à jour. Réessayez.', true);
    });
  }

  private showToast(msg: string, error = false): void {
    this.toastMsg = msg;
    this.toastError = error;
    setTimeout(() => { this.toastMsg = ''; }, 4000);
  }
}
