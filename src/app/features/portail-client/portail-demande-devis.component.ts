import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QrBarcodeService } from '../../core/services/qr-barcode.service';

interface LigneDevis {
  designation: string;
  quantite: number;
  unite: string;
  description: string;
}

@Component({
  selector: 'app-portail-demande-devis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrapper">

  <!-- ══ HERO BANNER ══ -->
  <div class="hero-banner">
    <div class="hero-glow"></div>
    <div class="hero-glow2"></div>
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-icon-wrap">
          <span class="material-symbols-outlined hero-icon">request_quote</span>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Demande de Devis</h1>
          <p class="hero-desc">Décrivez votre besoin — réponse garantie sous 24h ouvrées</p>
        </div>
      </div>
      <div class="hero-stat" *ngIf="mesDemandes.length > 0">
        <div class="stat-val">{{ mesDemandes.length }}</div>
        <div class="stat-lab">Demande{{ mesDemandes.length > 1 ? 's' : '' }} en cours</div>
      </div>
    </div>
    <div class="hero-tabs">
      <button class="hero-tab" [class.active]="activeTab === 'nouvelle'" (click)="activeTab = 'nouvelle'">
        <span class="material-symbols-outlined">add_circle</span> Nouvelle demande
      </button>
      <button class="hero-tab" [class.active]="activeTab === 'historique'" (click)="activeTab = 'historique'">
        <span class="material-symbols-outlined">history</span> Mes demandes
        <span class="badge-count" *ngIf="mesDemandes.length > 0">{{ mesDemandes.length }}</span>
      </button>
    </div>
  </div>

  <div class="com-body">

    <!-- ══ NOUVELLE DEMANDE ══ -->
    <div *ngIf="activeTab === 'nouvelle'">

      <div class="form-card" *ngIf="!envoye">

        <!-- Header formulaire -->
        <div class="form-card-header">
          <div class="fch-icon-wrap">
            <span class="material-symbols-outlined">edit_note</span>
          </div>
          <div class="fch-text">
            <div class="fch-title">Formulaire de demande de devis</div>
            <div class="fch-sub">Remplissez chaque section pour obtenir un devis précis</div>
          </div>
          <div class="fch-steps">
            <div class="step-dot active">1</div>
            <div class="step-line"></div>
            <div class="step-dot" [class.active]="form.objet.length > 0">2</div>
            <div class="step-line"></div>
            <div class="step-dot" [class.active]="form.lignes[0].designation.length > 0">3</div>
          </div>
        </div>

        <!-- Section 1 -->
        <div class="form-section">
          <div class="step-header">
            <div class="step-num teal">1</div>
            <div>
              <div class="step-title">Informations générales</div>
              <div class="step-sub">Décrivez l'objet de votre demande et ses contraintes</div>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Objet de la demande <span class="req">*</span></label>
            <input class="field-input" type="text" [(ngModel)]="form.objet"
                   placeholder="Ex : Fourniture de mobilier ergonomique pour bureau open-space">
          </div>

          <div class="field-group mt-16">
            <label class="field-label">Niveau d'urgence</label>
            <div class="urgence-pills">
              <button class="urgence-pill pill-normal" [class.selected]="form.urgence === 'NORMAL'"
                      (click)="form.urgence = 'NORMAL'" type="button">
                <span class="material-symbols-outlined">schedule</span>
                <span class="pill-label">Normal</span>
                <span class="pill-delay">5–7 jours</span>
              </button>
              <button class="urgence-pill pill-urgent" [class.selected]="form.urgence === 'URGENT'"
                      (click)="form.urgence = 'URGENT'" type="button">
                <span class="material-symbols-outlined">priority_high</span>
                <span class="pill-label">Urgent</span>
                <span class="pill-delay">2–3 jours</span>
              </button>
              <button class="urgence-pill pill-tres-urgent" [class.selected]="form.urgence === 'TRES_URGENT'"
                      (click)="form.urgence = 'TRES_URGENT'" type="button">
                <span class="material-symbols-outlined">warning</span>
                <span class="pill-label">Très urgent</span>
                <span class="pill-delay">24 heures</span>
              </button>
            </div>
          </div>

          <div class="form-grid-2 mt-16">
            <div class="field-group">
              <label class="field-label">
                <span class="material-symbols-outlined field-icon">calendar_today</span>
                Date de livraison souhaitée
              </label>
              <input class="field-input" type="date" [(ngModel)]="form.dateSouhaitee" [min]="today">
            </div>
            <div class="field-group">
              <label class="field-label">
                <span class="material-symbols-outlined field-icon">location_on</span>
                Lieu de livraison
              </label>
              <input class="field-input" type="text" [(ngModel)]="form.lieuLivraison" list="villes-list"
                     placeholder="Ex : Tunis Centre, Sfax, Sousse...">
            </div>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="form-section">
          <div class="step-header">
            <div class="step-num violet">2</div>
            <div>
              <div class="step-title">Produits &amp; Services demandés</div>
              <div class="step-sub">Listez chaque produit ou service avec ses spécifications</div>
            </div>
          </div>

          <div class="lignes-wrapper">
            <div class="ligne-col-labels">
              <span class="lc-num">#</span>
              <span class="lc-desig">Désignation *</span>
              <span class="lc-qty">Qté</span>
              <span class="lc-unit">Unité</span>
              <span class="lc-desc">Spécifications</span>
              <span class="lc-del"></span>
            </div>
            <div class="ligne-item" *ngFor="let l of form.lignes; let i = index">
              <div class="ligne-num">{{ i + 1 }}</div>
              <input class="fi fi-desig" type="text" [(ngModel)]="l.designation" list="produits-list"
                     placeholder="Nom du produit ou service">
              <input class="fi fi-qty" type="number" [(ngModel)]="l.quantite" min="1">
              <input class="fi fi-unit" type="text" [(ngModel)]="l.unite" list="unites-list" placeholder="UNITE">
              <input class="fi fi-desc" type="text" [(ngModel)]="l.description"
                     placeholder="Couleur, dimensions, qualité...">
              <button class="btn-del" (click)="supprimerLigne(i)" *ngIf="form.lignes.length > 1" title="Supprimer">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <button class="btn-add-ligne" (click)="ajouterLigne()">
            <span class="material-symbols-outlined">add_circle</span>
            Ajouter une ligne
          </button>
        </div>

        <!-- Section 3 -->
        <div class="form-section">
          <div class="step-header">
            <div class="step-num orange">3</div>
            <div>
              <div class="step-title">Remarques complémentaires</div>
              <div class="step-sub">Toute information utile à la préparation du devis</div>
            </div>
          </div>
          <textarea class="field-input field-textarea" rows="4" [(ngModel)]="form.remarques"
                    placeholder="Précisions sur la qualité, délais impératifs, conditions de livraison, contraintes budgétaires..."></textarea>
        </div>

        <!-- Erreur -->
        <div class="err-bar" *ngIf="erreurForm">
          <span class="material-symbols-outlined">error</span>
          {{ erreurForm }}
        </div>

        <!-- Footer -->
        <div class="form-footer">
          <button class="btn-reset" (click)="reinitialiser()">
            <span class="material-symbols-outlined">refresh</span> Réinitialiser
          </button>
          <div class="footer-right">
            <div class="footer-hint">
              <span class="material-symbols-outlined">lock</span>
              Données sécurisées · Confidentiel
            </div>
            <button class="btn-send" (click)="soumettre()" [disabled]="envoi">
              <span class="material-symbols-outlined">{{ envoi ? 'hourglass_top' : 'send' }}</span>
              {{ envoi ? 'Envoi en cours...' : 'Envoyer la demande' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Succès -->
      <div class="success-card" *ngIf="envoye">
        <div class="success-anim">
          <div class="success-ring"></div>
          <div class="success-check">
            <span class="material-symbols-outlined">check</span>
          </div>
        </div>
        <h2 class="success-title">Demande envoyée avec succès !</h2>
        <p class="success-msg">Notre équipe commerciale analysera votre besoin et vous contactera dans les meilleurs délais.</p>
        <div class="success-ref">
          <span class="material-symbols-outlined">tag</span>
          Référence : <strong>{{ refEnvoi }}</strong>
        </div>
        <div class="success-info-grid">
          <div class="sinfo-card">
            <span class="material-symbols-outlined">schedule</span>
            <span>Délai de réponse habituel</span>
            <strong>24h ouvrées</strong>
          </div>
          <div class="sinfo-card">
            <span class="material-symbols-outlined">notifications</span>
            <span>Vous serez notifié par</span>
            <strong>Email &amp; Portail</strong>
          </div>
        </div>
        <div class="success-actions">
          <button class="btn-send" (click)="nouvelleDemandeAction()">
            <span class="material-symbols-outlined">add</span> Nouvelle demande
          </button>
          <button class="btn-sec" (click)="printQrSuccess()" title="Imprimer le reçu de vérification QR Code">
            <span class="material-symbols-outlined">qr_code_2</span> Reçu QR Code
          </button>
          <button class="btn-sec" (click)="activeTab = 'historique'">
            <span class="material-symbols-outlined">history</span> Voir mes demandes
          </button>
        </div>
      </div>

    </div>

    <!-- ══ HISTORIQUE ══ -->
    <div *ngIf="activeTab === 'historique'">

      <div class="empty-hero" *ngIf="mesDemandes.length === 0">
        <div class="empty-orbit">
          <div class="empty-planet">
            <span class="material-symbols-outlined">request_quote</span>
          </div>
        </div>
        <h3 class="empty-h3">Aucune demande envoyée</h3>
        <p class="empty-p">Vous n'avez pas encore soumis de demande de devis. Créez votre première demande en quelques clics.</p>
        <button class="btn-send" (click)="activeTab = 'nouvelle'">
          <span class="material-symbols-outlined">add_circle</span>
          Créer ma première demande
        </button>
      </div>

      <div class="hist-list" *ngIf="mesDemandes.length > 0">
        <div class="hist-header-row">
          <span class="hist-count">{{ mesDemandes.length }} demande{{ mesDemandes.length > 1 ? 's' : '' }}</span>
          <button class="btn-new-inline" (click)="activeTab = 'nouvelle'">
            <span class="material-symbols-outlined">add</span> Nouvelle demande
          </button>
        </div>
        <div class="hist-card" *ngFor="let d of mesDemandes">
          <div class="hc-accent"></div>
          <div class="hc-body">
            <div class="hc-top">
              <div class="hc-left">
                <div class="hc-ref">{{ d.ref }}</div>
                <div class="hc-objet">{{ d.objet }}</div>
              </div>
              <div class="hc-badges">
                <span class="urg-pill" [ngClass]="'urg-' + d.urgence?.toLowerCase()">
                  <span class="material-symbols-outlined">{{ d.urgence === 'URGENT' ? 'priority_high' : d.urgence === 'TRES_URGENT' ? 'warning' : 'schedule' }}</span>
                  {{ d.urgence === 'TRES_URGENT' ? 'Très urgent' : d.urgence === 'URGENT' ? 'Urgent' : 'Normal' }}
                </span>
                <span class="st-pill" [ngClass]="'st-' + d.statut?.toLowerCase()">{{ d.statut }}</span>
              </div>
            </div>
            <div class="hc-meta">
              <span class="hc-meta-item">
                <span class="material-symbols-outlined">calendar_today</span> {{ d.date }}
              </span>
              <span class="hc-meta-item" *ngIf="d.dateSouhaitee">
                <span class="material-symbols-outlined">event_available</span> Souhaité le {{ d.dateSouhaitee }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</div>
  `,
  styles: [`
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined' !important;
      font-weight: normal; font-style: normal; font-size: 24px;
      line-height: 1; letter-spacing: normal; text-transform: none;
      display: inline-block; white-space: nowrap; word-wrap: normal;
      direction: ltr; -webkit-font-feature-settings: 'liga';
      font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased;
    }

    .page-wrapper { min-height: 100vh; background: #f0f4f8; }

    /* ── HERO ── */
    .hero-banner {
      background: linear-gradient(135deg, #0a0f1e 0%, #0f1f2e 50%, #0d5c61 100%);
      padding: 32px 40px 0; color: white; position: relative; overflow: hidden;
    }
    .hero-glow {
      position: absolute; top: -80px; right: -60px; width: 360px; height: 360px; border-radius: 50%;
      background: radial-gradient(circle, rgba(13,200,215,0.16) 0%, transparent 70%); pointer-events: none;
    }
    .hero-glow2 {
      position: absolute; bottom: -40px; left: 10%; width: 200px; height: 200px; border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%); pointer-events: none;
    }
    .hero-content {
      display: flex; align-items: center; justify-content: space-between;
      gap: 24px; margin-bottom: 28px; position: relative; z-index: 1;
    }
    .hero-left { display: flex; align-items: center; gap: 20px; }
    .hero-icon-wrap {
      width: 60px; height: 60px; border-radius: 18px; flex-shrink: 0;
      background: linear-gradient(135deg, #0d9faa, #0a7080);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(13,159,170,0.45);
    }
    .hero-icon { font-size: 30px !important; color: white; }
    .hero-title { font-size: 1.7rem; font-weight: 800; margin: 0 0 5px; letter-spacing: -0.02em; }
    .hero-desc  { font-size: 0.83rem; color: rgba(255,255,255,0.5); margin: 0; }
    .hero-stat {
      text-align: center; min-width: 110px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.13);
      border-radius: 16px; padding: 16px 24px; backdrop-filter: blur(12px);
    }
    .stat-val { font-size: 2.2rem; font-weight: 900; color: #34d399; line-height: 1; }
    .stat-lab { font-size: 0.65rem; color: rgba(255,255,255,0.45); margin-top: 5px; text-transform: uppercase; letter-spacing: 0.07em; }
    .hero-tabs { display: flex; gap: 4px; position: relative; z-index: 1; }
    .hero-tab {
      display: flex; align-items: center; gap: 7px;
      padding: 11px 22px; border: none; border-radius: 12px 12px 0 0;
      background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5);
      cursor: pointer; font-size: 0.83rem; font-weight: 600;
      transition: all 0.2s; font-family: inherit;
    }
    .hero-tab .material-symbols-outlined { font-size: 16px !important; }
    .hero-tab:hover:not(.active) { background: rgba(255,255,255,0.13); color: rgba(255,255,255,0.9); }
    .hero-tab.active { background: white; color: #0a0f1e; box-shadow: 0 -4px 16px rgba(0,0,0,0.15); }
    .badge-count {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white; border-radius: 999px; padding: 2px 8px; font-size: 0.62rem; font-weight: 700;
    }

    /* ── BODY ── */
    .com-body { padding: 32px 40px; max-width: 920px; margin: 0 auto; }

    /* ── FORM CARD ── */
    .form-card {
      background: white; border-radius: 22px;
      border: 1px solid rgba(220,230,242,0.9);
      box-shadow: 0 4px 6px rgba(0,0,0,0.02), 0 12px 40px rgba(13,115,119,0.07);
      overflow: hidden;
    }
    .form-card-header {
      display: flex; align-items: center; gap: 18px;
      background: linear-gradient(135deg, #f0fafa 0%, #e8f5f5 60%, #f5f8ff 100%);
      padding: 22px 30px; border-bottom: 2px solid rgba(13,115,119,0.1);
    }
    .fch-icon-wrap {
      width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
      background: linear-gradient(135deg, #0d9faa, #0a7080);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 18px rgba(13,115,119,0.35);
    }
    .fch-icon-wrap .material-symbols-outlined { font-size: 26px !important; color: white; }
    .fch-text { flex: 1; }
    .fch-title { font-size: 1rem; font-weight: 800; color: #0a1628; margin-bottom: 2px; }
    .fch-sub   { font-size: 0.76rem; color: #64748b; }
    .fch-steps { display: flex; align-items: center; gap: 6px; }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%; background: #e2e8f0; color: #94a3b8;
      font-size: 0.72rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; transition: all 0.3s;
    }
    .step-dot.active { background: linear-gradient(135deg, #0d9faa, #0a7080); color: white; box-shadow: 0 4px 12px rgba(13,115,119,0.4); }
    .step-line { width: 24px; height: 2px; background: #e2e8f0; border-radius: 1px; }

    /* ── SECTIONS ── */
    .form-section { padding: 28px 30px; border-bottom: 1px solid #f1f5f9; }
    .step-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
    .step-num {
      width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 900; color: white;
    }
    .step-num.teal   { background: linear-gradient(135deg, #0d9faa, #0a7080); box-shadow: 0 4px 12px rgba(13,115,119,0.4); }
    .step-num.violet { background: linear-gradient(135deg, #8b5cf6, #7c3aed); box-shadow: 0 4px 12px rgba(139,92,246,0.4); }
    .step-num.orange { background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 4px 12px rgba(249,115,22,0.4); }
    .step-title { font-size: 0.95rem; font-weight: 800; color: #0a1628; margin-bottom: 3px; }
    .step-sub   { font-size: 0.77rem; color: #94a3b8; }

    /* ── FIELDS ── */
    .field-group { display: flex; flex-direction: column; gap: 7px; }
    .field-label {
      font-size: 0.72rem; font-weight: 800; color: #374151;
      text-transform: uppercase; letter-spacing: 0.06em;
      display: flex; align-items: center; gap: 5px;
    }
    .field-label .field-icon { font-size: 14px !important; color: #0d7377; }
    .req { color: #ef4444; }
    .field-input {
      border: 2px solid #e8edf3; border-radius: 12px;
      padding: 12px 15px; font-size: 0.85rem; color: #0f172a;
      background: #fafbfc; outline: none; transition: all 0.22s;
      width: 100%; font-family: inherit; box-sizing: border-box;
    }
    .field-input:hover { border-color: #94a3b8; background: white; }
    .field-input:focus { border-color: #0d7377; background: white; box-shadow: 0 0 0 4px rgba(13,115,119,0.1); }
    .field-input::placeholder { color: #bcc4cf; }
    .field-textarea { min-height: 100px; resize: vertical; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .mt-16 { margin-top: 16px; }

    /* ── URGENCE PILLS ── */
    .urgence-pills { display: flex; gap: 12px; }
    .urgence-pill {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 16px 12px; border-radius: 14px; border: 2px solid #e2e8f0;
      background: #fafbfc; cursor: pointer; transition: all 0.22s; font-family: inherit;
    }
    .urgence-pill .material-symbols-outlined { font-size: 24px !important; }
    .pill-label { font-size: 0.82rem; font-weight: 800; }
    .pill-delay { font-size: 0.68rem; font-weight: 500; opacity: 0.6; }
    .urgence-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

    .pill-normal.selected  { background: linear-gradient(135deg,#ecfdf5,#d1fae5); border-color: #10b981; color: #065f46; }
    .pill-normal.selected .material-symbols-outlined { color: #10b981; }
    .pill-normal:not(.selected) .material-symbols-outlined { color: #94a3b8; }
    .pill-normal:not(.selected) { color: #475569; }

    .pill-urgent.selected  { background: linear-gradient(135deg,#fff7ed,#ffedd5); border-color: #f97316; color: #9a3412; }
    .pill-urgent.selected .material-symbols-outlined { color: #f97316; }
    .pill-urgent:not(.selected) .material-symbols-outlined { color: #94a3b8; }
    .pill-urgent:not(.selected) { color: #475569; }

    .pill-tres-urgent.selected  { background: linear-gradient(135deg,#fff5f5,#fee2e2); border-color: #ef4444; color: #991b1b; }
    .pill-tres-urgent.selected .material-symbols-outlined { color: #ef4444; }
    .pill-tres-urgent:not(.selected) .material-symbols-outlined { color: #94a3b8; }
    .pill-tres-urgent:not(.selected) { color: #475569; }

    /* ── LIGNES PRODUITS ── */
    .lignes-wrapper { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .ligne-col-labels {
      display: flex; align-items: center; gap: 8px; padding: 0 4px;
      font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.07em; color: #94a3b8;
    }
    .lc-num { width: 28px; text-align: center; flex-shrink: 0; }
    .lc-desig { flex: 3; }
    .lc-qty { width: 60px; text-align: center; flex-shrink: 0; }
    .lc-unit { width: 80px; flex-shrink: 0; }
    .lc-desc { flex: 3; }
    .lc-del { width: 32px; flex-shrink: 0; }

    .ligne-item {
      display: flex; align-items: center; gap: 8px;
      background: #f8fafc; border: 2px solid #e8edf3; border-radius: 14px;
      padding: 8px 10px; transition: all 0.2s;
    }
    .ligne-item:hover { border-color: rgba(13,115,119,0.4); box-shadow: 0 2px 10px rgba(13,115,119,0.08); background: white; }
    .ligne-num {
      width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white; font-size: 0.72rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .fi {
      border: none; background: transparent; outline: none; font-family: inherit;
      font-size: 0.83rem; color: #0f172a; padding: 6px 8px;
      border-radius: 8px; transition: all 0.15s;
    }
    .fi:focus { background: white; box-shadow: 0 0 0 2px rgba(13,115,119,0.2); }
    .fi::placeholder { color: #bcc4cf; }
    .fi-desig { flex: 3; }
    .fi-qty   { width: 60px; text-align: center; flex-shrink: 0; }
    .fi-unit  { width: 80px; flex-shrink: 0; }
    .fi-desc  { flex: 3; }

    .btn-del {
      width: 32px; height: 32px; flex-shrink: 0;
      border: none; border-radius: 8px; background: #fff5f5; color: #ef4444;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .btn-del:hover { background: #fee2e2; transform: scale(1.1); }
    .btn-del .material-symbols-outlined { font-size: 16px !important; }

    .btn-add-ligne {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 12px;
      border: 2px dashed rgba(139,92,246,0.4);
      background: rgba(139,92,246,0.04); color: #7c3aed;
      font-size: 0.8rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-add-ligne:hover { background: rgba(139,92,246,0.1); border-style: solid; transform: translateX(4px); }
    .btn-add-ligne .material-symbols-outlined { font-size: 18px !important; }

    /* ── ERREUR ── */
    .err-bar {
      display: flex; align-items: center; gap: 10px;
      background: #fef2f2; border-top: 2px solid #fecaca;
      padding: 13px 30px; color: #dc2626; font-size: 0.83rem; font-weight: 600;
    }
    .err-bar .material-symbols-outlined { font-size: 18px !important; color: #ef4444; }

    /* ── FOOTER ── */
    .form-footer {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 20px 30px;
      background: linear-gradient(to right, #f0fafa, white);
      border-top: 1px solid #e8eef5;
    }
    .footer-right { display: flex; align-items: center; gap: 16px; }
    .footer-hint { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: #94a3b8; }
    .footer-hint .material-symbols-outlined { font-size: 13px !important; }

    .btn-send {
      display: flex; align-items: center; gap: 8px;
      padding: 13px 28px; border-radius: 13px; border: none;
      background: linear-gradient(135deg, #0d9faa, #0a7080);
      color: white; font-size: 0.88rem; font-weight: 800;
      cursor: pointer; transition: all 0.25s; font-family: inherit;
      box-shadow: 0 4px 16px rgba(13,115,119,0.35); letter-spacing: 0.01em;
    }
    .btn-send .material-symbols-outlined { font-size: 18px !important; }
    .btn-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(13,115,119,0.45); }
    .btn-send:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-reset {
      display: flex; align-items: center; gap: 7px;
      padding: 12px 20px; border-radius: 12px;
      border: 1.5px solid #e2e8f0; background: white;
      color: #64748b; font-size: 0.83rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-reset .material-symbols-outlined { font-size: 16px !important; }
    .btn-reset:hover { border-color: #94a3b8; background: #f8fafc; }

    /* ── SUCCESS ── */
    .success-card {
      background: white; border-radius: 22px; border: 1.5px solid #a7f3d0;
      box-shadow: 0 8px 40px rgba(5,150,105,0.1); padding: 60px 40px; text-align: center;
    }
    .success-anim { position: relative; width: 100px; height: 100px; margin: 0 auto 28px; }
    .success-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 3px solid rgba(16,185,129,0.2);
      animation: ringPulse 2s ease-in-out infinite;
    }
    @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.5} }
    .success-check {
      position: absolute; inset: 10px; border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 12px 32px rgba(16,185,129,0.4);
      animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes popIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
    .success-check .material-symbols-outlined { font-size: 38px !important; color: white; }
    .success-title { font-size: 1.5rem; font-weight: 800; color: #0a1628; margin-bottom: 10px; }
    .success-msg   { color: #64748b; max-width: 380px; margin: 0 auto 20px; line-height: 1.6; font-size: 0.88rem; }
    .success-ref {
      display: inline-flex; align-items: center; gap: 7px;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border: 1px solid #a7f3d0; border-radius: 12px;
      padding: 10px 22px; font-size: 0.9rem; color: #065f46; font-weight: 700;
      margin-bottom: 24px;
    }
    .success-ref .material-symbols-outlined { font-size: 16px !important; }
    .success-info-grid { display: flex; gap: 12px; justify-content: center; margin-bottom: 28px; flex-wrap: wrap; }
    .sinfo-card {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 14px 22px; background: #f8fafc; border: 1px solid #e8eef5;
      border-radius: 14px; font-size: 0.76rem; color: #64748b;
    }
    .sinfo-card .material-symbols-outlined { font-size: 20px !important; color: #0d7377; margin-bottom: 2px; }
    .sinfo-card strong { color: #0a1628; font-size: 0.83rem; }
    .success-actions { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }
    .btn-sec {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 22px; border-radius: 12px;
      border: 1.5px solid #e2e8f0; background: white;
      color: #475569; font-size: 0.85rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-sec .material-symbols-outlined { font-size: 17px !important; }
    .btn-sec:hover { border-color: #94a3b8; background: #f8fafc; }

    /* ── EMPTY HISTORIQUE ── */
    .empty-hero {
      text-align: center; padding: 80px 40px;
      display: flex; flex-direction: column; align-items: center;
    }
    .empty-orbit { position: relative; width: 120px; height: 120px; margin: 0 auto 28px; }
    .empty-orbit::before {
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      border: 2px dashed rgba(13,115,119,0.25);
      animation: spinOrbit 12s linear infinite;
    }
    @keyframes spinOrbit { to{transform:rotate(360deg)} }
    .empty-planet {
      position: absolute; inset: 14px; border-radius: 50%;
      background: linear-gradient(135deg, #f0fafa, #dff0f0);
      border: 2px solid rgba(13,115,119,0.2);
      display: flex; align-items: center; justify-content: center;
      animation: floatY 3s ease-in-out infinite;
    }
    @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .empty-planet .material-symbols-outlined { font-size: 42px !important; color: #0d7377; }
    .empty-h3 { font-size: 1.2rem; font-weight: 800; color: #0a1628; margin-bottom: 10px; }
    .empty-p  { font-size: 0.85rem; color: #94a3b8; max-width: 320px; line-height: 1.65; margin-bottom: 28px; }

    /* ── HISTORIQUE LIST ── */
    .hist-list { display: flex; flex-direction: column; gap: 14px; }
    .hist-header-row {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;
    }
    .hist-count { font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; }
    .btn-new-inline {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #0d9faa, #0a7080);
      color: white; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; font-family: inherit; transition: all 0.2s;
      box-shadow: 0 3px 10px rgba(13,115,119,0.3);
    }
    .btn-new-inline .material-symbols-outlined { font-size: 16px !important; }
    .btn-new-inline:hover { transform: translateY(-1px); box-shadow: 0 5px 15px rgba(13,115,119,0.4); }

    .hist-card {
      display: flex; background: white; border-radius: 16px;
      border: 1.5px solid #e8eef5; box-shadow: 0 2px 8px rgba(15,23,42,0.04);
      overflow: hidden; transition: all 0.2s;
    }
    .hist-card:hover { box-shadow: 0 8px 28px rgba(13,115,119,0.1); transform: translateX(4px); border-color: rgba(13,115,119,0.25); }
    .hc-accent { width: 5px; flex-shrink: 0; background: linear-gradient(to bottom, #0d9faa, #0a7080); }
    .hc-body { flex: 1; padding: 18px 22px; }
    .hc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 12px; }
    .hc-left { flex: 1; }
    .hc-ref {
      display: inline-block; font-size: 0.7rem; color: #0d7377;
      background: rgba(13,115,119,0.08); padding: 2px 8px; border-radius: 6px; margin-bottom: 6px;
    }
    .hc-objet { font-size: 0.93rem; font-weight: 700; color: #0a1628; }
    .hc-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
    .urg-pill, .st-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 999px;
      font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .urg-pill .material-symbols-outlined { font-size: 13px !important; }
    .urg-normal    { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .urg-urgent    { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
    .urg-tres_urgent { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .st-envoyee    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .st-en_cours   { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
    .st-traite     { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .hc-meta { display: flex; gap: 16px; font-size: 0.74rem; color: #94a3b8; align-items: center; }
    .hc-meta-item { display: flex; align-items: center; gap: 5px; }
    .hc-meta-item .material-symbols-outlined { font-size: 13px !important; color: #0d7377; }
  `]
})
export class PortailDemandeDevisComponent implements OnInit {
  activeTab = 'nouvelle';
  envoye = false;
  envoi = false;
  refEnvoi = '';
  erreurForm = '';
  today = new Date().toISOString().split('T')[0];
  mesDemandes: any[] = [];

  form = {
    objet: '',
    urgence: 'NORMAL',
    dateSouhaitee: '',
    lieuLivraison: '',
    remarques: '',
    lignes: [this.nouvelleLigne()]
  };

  ngOnInit(): void {
    this.chargerMesDemandes();
  }

  private chargerMesDemandes(): void {
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw)?.token : null;
    if (!token) return;

    fetch('http://localhost:9090/api/portail/devis-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.ok ? r.json() : [])
    .then((data: any[]) => { this.mesDemandes = Array.isArray(data) ? data : []; })
    .catch(() => {
      const saved = localStorage.getItem('mesDemandes');
      if (saved) this.mesDemandes = JSON.parse(saved);
    });
  }

  nouvelleLigne(): LigneDevis {
    return { designation: '', quantite: 1, unite: 'pièce', description: '' };
  }

  ajouterLigne(): void {
    this.form.lignes.push(this.nouvelleLigne());
  }

  supprimerLigne(i: number): void {
    this.form.lignes.splice(i, 1);
  }

  soumettre(): void {
    this.erreurForm = '';
    if (!this.form.objet.trim()) { this.erreurForm = "L'objet de la demande est obligatoire."; return; }
    if (this.form.lignes.some(l => !l.designation.trim())) { this.erreurForm = "Toutes les lignes doivent avoir une désignation."; return; }

    this.envoi = true;
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw)?.token : null;

    if (!token) {
      this.erreurForm = "Session expirée. Veuillez vous reconnecter.";
      this.envoi = false;
      return;
    }

    fetch('http://localhost:9090/api/portail/devis-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...this.form })
    })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((res: any) => {
      this.refEnvoi = res?.reference || 'DR-' + Date.now().toString().slice(-6);
      this.finaliserEnvoi();
    })
    .catch((err) => {
      this.envoi = false;
      if (err.message?.includes('Failed to fetch')) {
        this.erreurForm = "Impossible de contacter le serveur. Vérifiez que le backend est démarré.";
      } else if (err.message?.includes('401')) {
        this.erreurForm = "Session expirée. Veuillez vous reconnecter.";
      } else {
        this.erreurForm = "Erreur lors de l'envoi (" + err.message + ").";
      }
    });
  }

  private finaliserEnvoi(): void {
    this.envoi = false;
    this.envoye = true;
    this.chargerMesDemandes();
    const demande = {
      ref: this.refEnvoi, objet: this.form.objet,
      urgence: this.form.urgence,
      date: new Date().toLocaleDateString('fr-FR'), statut: 'ENVOYEE'
    };
    localStorage.setItem('mesDemandes', JSON.stringify([demande, ...this.mesDemandes]));
  }

  nouvelleDemandeAction(): void {
    this.envoye = false;
    this.reinitialiser();
  }

  printQrSuccess(): void {
    this.printQr({ ref: this.refEnvoi, date: new Date().toLocaleDateString('fr-FR') });
  }

  printQr(demande: any): void {
    const qrService = new QrBarcodeService();
    qrService.printInvoiceQRCodeReceipt({
      reference: demande.ref || 'DEM-000',
      clientNom: 'Portail Client',
      totalTTC: 0,
      dateCreation: demande.date
    });
  }

  reinitialiser(): void {
    this.form = {
      objet: '', urgence: 'NORMAL', dateSouhaitee: '',
      lieuLivraison: '', remarques: '', lignes: [this.nouvelleLigne()]
    };
    this.erreurForm = '';
  }
}
