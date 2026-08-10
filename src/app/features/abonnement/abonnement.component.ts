import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-abonnement',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="abo-page">

  <!-- Hero -->
  <div class="abo-hero">
    <div class="hero-badge">{{ 'ABONNEMENT.HERO_BADGE' | translate }}</div>
    <h1 class="hero-title">{{ 'ABONNEMENT.HERO_TITLE' | translate }}</h1>
    <p class="hero-sub">{{ 'ABONNEMENT.HERO_SUB' | translate }}</p>
  </div>

  <!-- Succès / Erreur -->
  <div class="notif success" *ngIf="successMsg">✅ {{ successMsg }}</div>
  <div class="notif error"   *ngIf="errorMsg">❌ {{ errorMsg }}</div>

  <!-- Abonnement existant -->
  <div class="current-abo" *ngIf="abonnementActuel">
    <div class="current-icon">
      <span *ngIf="abonnementActuel.statut === 'ACTIF'">✅</span>
      <span *ngIf="abonnementActuel.statut === 'EN_ATTENTE'">⏳</span>
      <span *ngIf="abonnementActuel.statut === 'VALIDE'">🔵</span>
    </div>
    <div class="current-info">
      <div class="current-title">{{ 'ABONNEMENT.CURRENT.TITLE' | translate }} {{ getLabelPlan(abonnementActuel.typePlan) }}</div>
      <div class="current-sub">
        <span class="statut-pill" [ngClass]="getStatutClass(abonnementActuel.statut)">
          {{ getStatutLabel(abonnementActuel.statut) }}
        </span>
        <span *ngIf="abonnementActuel.dateDebut">{{ 'ABONNEMENT.CURRENT.START' | translate }} {{ formatDate(abonnementActuel.dateDebut) }}</span>
        <span *ngIf="abonnementActuel.dateFin">{{ 'ABONNEMENT.CURRENT.EXPIRE' | translate }} {{ formatDate(abonnementActuel.dateFin) }}</span>
      </div>
      <div class="current-note" *ngIf="abonnementActuel.statut === 'EN_ATTENTE'">
        {{ 'ABONNEMENT.CURRENT.PENDING_NOTE' | translate }}
      </div>
    </div>
    <div class="current-prix">{{ abonnementActuel.prix }} DT</div>
  </div>

  <!-- Plans (si pas d'abonnement actif/en-attente) -->
  <ng-container *ngIf="!abonnementActuel || abonnementActuel.statut === 'EXPIRE' || abonnementActuel.statut === 'ANNULE'">

    <!-- Cards plans -->
    <div class="plans-grid" *ngIf="!planSelectionne">
      <div class="plan-card" *ngFor="let plan of plans"
           [class.featured]="plan.type === 'ANNUEL'"
           (click)="selectionnerPlan(plan)">
        <div class="plan-badge" *ngIf="plan.type === 'ANNUEL'">{{ 'ABONNEMENT.PLANS.BEST_VALUE' | translate }}</div>
        <div class="plan-badge badge-pop" *ngIf="plan.type === 'TRIMESTRIEL'">{{ 'ABONNEMENT.PLANS.POPULAR' | translate }}</div>
        <div class="plan-icon">
          <span *ngIf="plan.type === 'MENSUEL'">🥉</span>
          <span *ngIf="plan.type === 'TRIMESTRIEL'">🥈</span>
          <span *ngIf="plan.type === 'ANNUEL'">🥇</span>
        </div>
        <h2 class="plan-name">{{ plan.label }}</h2>
        <div class="plan-duration">{{ plan.dureeMois }} {{ 'ABONNEMENT.PLANS.MONTHS_ACCESS' | translate }}</div>
        <div class="plan-price-wrap">
          <span class="plan-old-price" *ngIf="plan.prixOriginal">{{ plan.prixOriginal }} DT</span>
          <div class="plan-price">{{ plan.prix }} <span>DT</span></div>
          <div class="plan-reduction" *ngIf="plan.reduction">{{ plan.reduction }} d'économie</div>
        </div>
        <p class="plan-desc">{{ plan.description }}</p>
        <ul class="plan-features">
          <li *ngFor="let f of plan.fonctionnalites">✓ {{ f }}</li>
        </ul>
        <button class="btn-choisir" [class.btn-featured]="plan.type === 'ANNUEL'">
          {{ 'ABONNEMENT.PLANS.CHOOSE_PLAN' | translate }}
        </button>
      </div>
    </div>

    <!-- Formulaire de paiement -->
    <div class="payment-form" *ngIf="planSelectionne">
      <button class="btn-back" (click)="planSelectionne = null">{{ 'ABONNEMENT.PAYMENT.BACK' | translate }}</button>

      <div class="payment-header">
        <div class="payment-icon">💳</div>
        <div>
          <h2>{{ 'ABONNEMENT.PAYMENT.TITLE' | translate }}</h2>
          <p>{{ 'ABONNEMENT.PAYMENT.SUBTITLE_PREFIX' | translate }} {{ planSelectionne.label }} — <strong>{{ planSelectionne.prix }} DT</strong></p>
        </div>
      </div>

      <div class="payment-summary">
        <div class="summary-row">
          <span>{{ 'ABONNEMENT.PAYMENT.SUMMARY_PLAN' | translate }}</span>
          <span>{{ planSelectionne.label }} ({{ planSelectionne.dureeMois }} {{ 'ABONNEMENT.PLANS.MONTHS_ACCESS' | translate }})</span>
        </div>
        <div class="summary-row">
          <span>{{ 'ABONNEMENT.PAYMENT.SUMMARY_TOTAL' | translate }}</span>
          <strong>{{ planSelectionne.prix }} DT TTC</strong>
        </div>
        <div class="summary-row" *ngIf="planSelectionne.reduction">
          <span>{{ 'ABONNEMENT.PAYMENT.SUMMARY_SAVING' | translate }}</span>
          <span class="saving">{{ planSelectionne.reduction }} {{ 'ABONNEMENT.PAYMENT.SAVING_COMPARED' | translate }}</span>
        </div>
      </div>

      <!-- Méthode de paiement -->
      <div class="form-group">
        <label>{{ 'ABONNEMENT.PAYMENT.METHOD_LABEL' | translate }}</label>
        <div class="methode-grid">
          <div class="methode-card" *ngFor="let m of methodes"
               [class.selected]="methodePaiement === m.value"
               (click)="methodePaiement = m.value">
            <span class="methode-icon">{{ m.icon }}</span>
            <span>{{ 'ABONNEMENT.METHODES.' + m.value | translate }}</span>
          </div>
        </div>
      </div>

      <div class="form-group" *ngIf="methodePaiement === 'VIREMENT'">
        <label>{{ 'ABONNEMENT.VIREMENT.REF_LABEL' | translate }}</label>
        <input class="form-input" [(ngModel)]="referencePaiement"
               [placeholder]="'ABONNEMENT.VIREMENT.REF_PH' | translate">
        <!-- Coordonnées bancaires complètes -->
        <div class="bank-card">
          <div class="bank-card-header">
            <span>🏦</span>
            <span>{{ 'ABONNEMENT.VIREMENT.BANK_HEADER' | translate }}</span>
          </div>
          <div class="bank-card-body">
            <div class="bank-row">
              <span class="bank-label">{{ 'ABONNEMENT.VIREMENT.BANK_NAME' | translate }}</span>
              <span class="bank-value">{{ 'ABONNEMENT.VIREMENT.BANK_NAME_VAL' | translate }}</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">{{ 'ABONNEMENT.VIREMENT.BANK_HOLDER' | translate }}</span>
              <span class="bank-value">{{ 'ABONNEMENT.VIREMENT.BANK_HOLDER_VAL' | translate }}</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">{{ 'ABONNEMENT.VIREMENT.BANK_RIB' | translate }}</span>
              <span class="bank-value mono">10 906 0020010000764 55</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">{{ 'ABONNEMENT.VIREMENT.BANK_IBAN' | translate }}</span>
              <span class="bank-value mono">TN59 1090 6002 0010 0007 6455</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">{{ 'ABONNEMENT.VIREMENT.BANK_SWIFT' | translate }}</span>
              <span class="bank-value mono">BNTUTNTТ</span>
            </div>
            <div class="bank-row">
              <span class="bank-label">{{ 'ABONNEMENT.VIREMENT.BANK_AMOUNT' | translate }}</span>
              <span class="bank-value" style="color:#f97316;font-weight:800;">{{ planSelectionne?.prix }} DT</span>
            </div>
          </div>
          <div class="bank-card-footer">
            {{ 'ABONNEMENT.VIREMENT.BANK_FOOTER' | translate }}
          </div>
        </div>
      </div>

      <div class="form-group" *ngIf="methodePaiement === 'CHEQUE'">
        <label>{{ 'ABONNEMENT.CHEQUE.NUM_LABEL' | translate }}</label>
        <input class="form-input" [(ngModel)]="referencePaiement"
               [placeholder]="'ABONNEMENT.CHEQUE.NUM_PH' | translate">
        <div class="info-box">
          {{ 'ABONNEMENT.CHEQUE.TO_ORDER' | translate }} <strong>BENJEDDOU TECHNOLOGIE SERVICES</strong>
        </div>
      </div>

      <div class="form-group" *ngIf="methodePaiement === 'CARTE'">
        <div class="stripe-box">
          <div class="stripe-header">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                 alt="Stripe" class="stripe-logo">
            <span class="stripe-badge">{{ 'ABONNEMENT.CARTE.SECURE' | translate }}</span>
          </div>
          <p class="stripe-desc">{{ 'ABONNEMENT.CARTE.DESC' | translate }}</p>
          <div class="stripe-features">
            <span>{{ 'ABONNEMENT.CARTE.SSL' | translate }}</span>
            <span>{{ 'ABONNEMENT.CARTE.PCI' | translate }}</span>
            <span>{{ 'ABONNEMENT.CARTE.INSTANT' | translate }}</span>
          </div>
          <button class="btn-stripe" (click)="payerAvecStripe()" [disabled]="stripeLoading">
            <span *ngIf="!stripeLoading">{{ 'ABONNEMENT.CARTE.PAY_BTN' | translate }} {{ planSelectionne?.prix }} DT {{ 'ABONNEMENT.CARTE.PAY_WITH' | translate }}</span>
            <span *ngIf="stripeLoading">{{ 'ABONNEMENT.CARTE.REDIRECTING' | translate }}</span>
          </button>
        </div>
      </div>

      <div class="form-group" *ngIf="methodePaiement === 'ESPECES'">
        <div class="info-box info-green">
          {{ 'ABONNEMENT.ESPECES.INFO' | translate }} <strong>{{ planSelectionne.prix }} DT</strong>
        </div>
      </div>

      <button class="btn-soumettre"
              [disabled]="loading || !methodePaiement"
              (click)="soumettreDemande()">
        <span *ngIf="!loading">{{ 'ABONNEMENT.PAYMENT.SUBMIT' | translate }}</span>
        <span *ngIf="loading">{{ 'ABONNEMENT.PAYMENT.SUBMITTING' | translate }}</span>
      </button>

      <p class="note-submit">{{ 'ABONNEMENT.PAYMENT.SUBMIT_NOTE' | translate }}</p>
    </div>

  </ng-container>

</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

    .abo-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      padding: 40px 24px 80px;
    }

    /* ── Hero ───────────────────────────────────────────── */
    .abo-hero { text-align: center; margin-bottom: 48px; }
    .hero-badge {
      display: inline-block;
      background: rgba(249,115,22,0.15);
      border: 1px solid rgba(249,115,22,0.4);
      color: #fb923c;
      padding: 6px 20px;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .hero-title {
      font-size: 2.6rem;
      font-weight: 900;
      color: #fff;
      margin: 0 0 12px;
      letter-spacing: -0.03em;
    }
    .hero-sub {
      color: rgba(255,255,255,0.55);
      font-size: 1rem;
      max-width: 500px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ── Notifs ─────────────────────────────────────────── */
    .notif {
      max-width: 700px;
      margin: 0 auto 24px;
      padding: 14px 20px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.88rem;
    }
    .notif.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .notif.error   { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    /* ── Abonnement actuel ──────────────────────────────── */
    .current-abo {
      max-width: 700px;
      margin: 0 auto 40px;
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      align-items: flex-start;
      gap: 18px;
    }
    .current-icon { font-size: 2rem; flex-shrink: 0; }
    .current-info { flex: 1; }
    .current-title { font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .current-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.82rem; color: rgba(255,255,255,0.55); }
    .current-note { margin-top: 10px; font-size: 0.8rem; color: #fb923c; font-weight: 500; line-height: 1.5; }
    .current-prix { font-size: 1.3rem; font-weight: 800; color: #f97316; flex-shrink: 0; }
    .statut-pill { padding: 3px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
    .pill-actif    { background: #dcfce7; color: #15803d; }
    .pill-attente  { background: #fef9c3; color: #a16207; }
    .pill-valide   { background: #dbeafe; color: #1d4ed8; }
    .pill-expire   { background: #f1f5f9; color: #64748b; }
    .pill-annule   { background: #fee2e2; color: #b91c1c; }

    /* ── Plans grid ─────────────────────────────────────── */
    .plans-grid {
      display: flex;
      gap: 24px;
      max-width: 1000px;
      margin: 0 auto;
      align-items: stretch;
    }
    .plan-card {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 32px 28px;
      cursor: pointer;
      transition: all .3s cubic-bezier(.34,1.56,.64,1);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .plan-card:hover {
      transform: translateY(-6px);
      border-color: rgba(249,115,22,0.5);
      background: rgba(249,115,22,0.08);
      box-shadow: 0 24px 50px rgba(249,115,22,0.2);
    }
    .plan-card.featured {
      border-color: #f97316;
      background: rgba(249,115,22,0.1);
      box-shadow: 0 16px 40px rgba(249,115,22,0.25);
    }
    .plan-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff;
      padding: 4px 16px;
      border-radius: 99px;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .plan-badge.badge-pop { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .plan-icon { font-size: 2.4rem; }
    .plan-name { font-size: 1.4rem; font-weight: 800; color: #fff; margin: 0; }
    .plan-duration { font-size: 0.8rem; color: rgba(255,255,255,0.45); }
    .plan-price-wrap { margin: 4px 0; }
    .plan-old-price { font-size: 0.85rem; color: rgba(255,255,255,0.35); text-decoration: line-through; }
    .plan-price { font-size: 2rem; font-weight: 900; color: #fff; }
    .plan-price span { font-size: 1rem; font-weight: 600; color: rgba(255,255,255,0.6); }
    .plan-reduction {
      display: inline-block;
      background: rgba(34,197,94,0.2);
      color: #4ade80;
      border: 1px solid rgba(34,197,94,0.3);
      padding: 2px 10px;
      border-radius: 99px;
      font-size: 0.72rem;
      font-weight: 700;
      margin-top: 4px;
    }
    .plan-desc { font-size: 0.82rem; color: rgba(255,255,255,0.5); line-height: 1.6; }
    .plan-features { list-style: none; padding: 0; margin: 4px 0; flex: 1; }
    .plan-features li { font-size: 0.8rem; color: rgba(255,255,255,0.6); padding: 4px 0; }
    .btn-choisir {
      width: 100%;
      padding: 14px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      color: #fff;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s;
      margin-top: auto;
    }
    .btn-choisir:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }
    .btn-choisir.btn-featured {
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-color: #f97316;
    }
    .btn-choisir.btn-featured:hover { opacity: 0.9; }

    /* ── Formulaire paiement ────────────────────────────── */
    .payment-form {
      max-width: 640px;
      margin: 0 auto;
      background: rgba(255,255,255,0.05);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 36px;
    }
    .btn-back {
      background: none;
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.6);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      margin-bottom: 28px;
      transition: all .2s;
    }
    .btn-back:hover { border-color: #f97316; color: #f97316; }
    .payment-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .payment-icon { font-size: 2.4rem; }
    .payment-header h2 { font-size: 1.3rem; font-weight: 800; color: #fff; margin: 0 0 4px; }
    .payment-header p  { font-size: 0.85rem; color: rgba(255,255,255,0.55); margin: 0; }
    .payment-summary {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 28px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.6);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .summary-row:last-child { border-bottom: none; color: #fff; font-size: 0.95rem; }
    .saving { color: #4ade80; font-weight: 600; }

    .form-group { margin-bottom: 22px; }
    .form-group label { display: block; color: rgba(255,255,255,0.7); font-size: 0.82rem; font-weight: 600; margin-bottom: 10px; }
    .methode-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .methode-card {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 16px 12px;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      cursor: pointer;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.6);
      transition: all .2s;
    }
    .methode-card:hover { border-color: rgba(249,115,22,0.4); color: #f97316; }
    .methode-card.selected { border-color: #f97316; background: rgba(249,115,22,0.12); color: #f97316; font-weight: 700; }
    .methode-icon { font-size: 1.5rem; }
    .form-input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      color: #fff;
      font-size: 0.88rem;
      outline: none;
      transition: border-color .2s;
    }
    .form-input::placeholder { color: rgba(255,255,255,0.3); }
    .form-input:focus { border-color: #f97316; }
    .info-box {
      margin-top: 10px;
      background: rgba(249,115,22,0.1);
      border: 1px solid rgba(249,115,22,0.25);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 0.8rem;
      color: #fb923c;
      line-height: 1.6;
    }
    .info-box.info-blue { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.25); color: #93c5fd; }
    .info-box.info-green { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.25); color: #4ade80; }

    /* ── Carte bancaire ─────────────────────────────────── */
    .bank-card {
      margin-top: 14px;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(99,179,237,0.3);
      border-radius: 14px;
      overflow: hidden;
    }
    .bank-card-header {
      background: rgba(59,130,246,0.15);
      border-bottom: 1px solid rgba(99,179,237,0.2);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #93c5fd;
    }
    .bank-card-body { padding: 14px 16px; }
    .bank-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .bank-row:last-child { border-bottom: none; }
    .bank-label { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .bank-value { font-size: 0.8rem; color: rgba(255,255,255,0.85); font-weight: 600; text-align: right; }
    .bank-value.mono { font-family: 'Courier New', monospace; letter-spacing: 0.05em; color: #93c5fd; }
    .bank-card-footer {
      background: rgba(249,115,22,0.08);
      border-top: 1px solid rgba(249,115,22,0.2);
      padding: 10px 16px;
      font-size: 0.72rem;
      color: #fb923c;
      line-height: 1.6;
    }

    /* ── Stripe ─────────────────────────────────────────── */
    .stripe-box {
      margin-top: 10px;
      background: rgba(99,91,255,0.08);
      border: 1.5px solid rgba(99,91,255,0.3);
      border-radius: 14px;
      overflow: hidden;
    }
    .stripe-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      background: rgba(99,91,255,0.1);
      border-bottom: 1px solid rgba(99,91,255,0.2);
    }
    .stripe-logo { height: 22px; filter: brightness(0) invert(1); opacity: 0.85; }
    .stripe-badge {
      font-size: 0.7rem; font-weight: 700;
      background: rgba(34,197,94,0.2); color: #4ade80;
      border: 1px solid rgba(34,197,94,0.3);
      padding: 3px 10px; border-radius: 99px;
    }
    .stripe-desc {
      font-size: 0.8rem; color: rgba(255,255,255,0.55);
      padding: 12px 16px 8px; margin: 0; line-height: 1.6;
    }
    .stripe-features {
      display: flex; gap: 8px; flex-wrap: wrap;
      padding: 0 16px 14px;
    }
    .stripe-features span {
      font-size: 0.7rem; color: rgba(255,255,255,0.5);
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 3px 10px; border-radius: 99px;
    }
    .btn-stripe {
      width: calc(100% - 32px);
      margin: 0 16px 16px;
      padding: 14px;
      background: linear-gradient(135deg, #635bff, #4f46e5);
      border: none; border-radius: 12px;
      color: #fff; font-size: 0.92rem; font-weight: 800;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(99,91,255,0.4);
      transition: all .2s;
    }
    .btn-stripe:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(99,91,255,0.5); }
    .btn-stripe:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-soumettre {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 14px;
      color: #fff;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      margin-top: 8px;
      transition: all .2s;
      box-shadow: 0 8px 25px rgba(249,115,22,0.4);
    }
    .btn-soumettre:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(249,115,22,0.5); }
    .btn-soumettre:disabled { opacity: 0.6; cursor: not-allowed; }
    .note-submit { text-align: center; font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 16px; line-height: 1.6; }

    @media (max-width: 768px) {
      .plans-grid { flex-direction: column; }
      .hero-title { font-size: 1.8rem; }
    }
  `]
})
export class AbonnementComponent implements OnInit {
  plans: any[] = [];
  planSelectionne: any = null;
  abonnementActuel: any = null;
  methodePaiement = '';
  referencePaiement = '';
  loading = false;
  stripeLoading = false;
  successMsg = '';
  errorMsg = '';

  methodes = [
    { value: 'VIREMENT', icon: '🏦' },
    { value: 'CHEQUE',   icon: '📝' },
    { value: 'ESPECES',  icon: '💵' },
    { value: 'CARTE',    icon: '💳' }
  ];

  private clientId: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        this.clientId = user?.id ?? null;
      }
    } catch { /* */ }

    this.chargerPlans();
    if (this.clientId) {
      this.chargerMonAbonnement();
    }
  }

  chargerPlans(): void {
    this.http.get<any[]>('/api/abonnement/plans').subscribe({
      next: data => this.plans = data,
      error: () => {}
    });
  }

  chargerMonAbonnement(): void {
    this.http.get<any>(`/api/abonnement/mon-abonnement/${this.clientId}`).subscribe({
      next: data => {
        this.abonnementActuel = data?.abonnement !== null ? data : null;
        if (data && data.id) this.abonnementActuel = data;
      },
      error: () => {}
    });
  }

  selectionnerPlan(plan: any): void {
    this.planSelectionne = plan;
    this.methodePaiement = '';
    this.referencePaiement = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  soumettreDemande(): void {
    if (!this.clientId || !this.planSelectionne || !this.methodePaiement) return;
    if (this.methodePaiement === 'CARTE') { this.payerAvecStripe(); return; }

    this.loading = true;
    this.errorMsg = '';

    const body = {
      clientId:          String(this.clientId),
      typePlan:          this.planSelectionne.type,
      methodePaiement:   this.methodePaiement,
      referencePaiement: this.referencePaiement
    };

    this.http.post<any>('/api/abonnement/souscrire', body).subscribe({
      next: res => {
        this.loading = false;
        this.successMsg = res.message || this.translate.instant('ABONNEMENT.PAYMENT.SUBMIT');
        this.planSelectionne = null;
        this.chargerMonAbonnement();
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Erreur lors de la soumission.';
      }
    });
  }

  payerAvecStripe(): void {
    if (!this.clientId || !this.planSelectionne) return;
    this.stripeLoading = true;
    this.errorMsg = '';

    const token = this.authService.getToken();

    if (!token) {
      this.stripeLoading = false;
      this.errorMsg = '❌ Vous devez être connecté pour payer. Reconnectez-vous sur la page de login.';
      return;
    }

    const body = {
      clientId: String(this.clientId),
      typePlan: this.planSelectionne.type
    };

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    this.http.post<any>('/api/stripe/create-checkout', body, { headers }).subscribe({
      next: res => {
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        } else {
          this.stripeLoading = false;
          this.errorMsg = 'Impossible de créer la session Stripe. Réessayez.';
        }
      },
      error: err => {
        this.stripeLoading = false;
        console.error('[Stripe] Erreur:', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMsg = '❌ Session expirée. Reconnectez-vous puis revenez sur cette page.';
        } else if (err.status === 400) {
          this.errorMsg = err?.error?.message || '⚠️ Vous avez déjà un abonnement en cours.';
        } else if (err.status === 0) {
          this.errorMsg = '❌ Serveur inaccessible (port 9090). Démarrez IntelliJ / le backend Spring Boot.';
        } else {
          this.errorMsg = `Erreur ${err.status} : ${err?.error?.message || err.message || "Contactez l'administrateur."}`;
        }
      }
    });
  }

  getLabelPlan(type: string): string {
    return this.translate.instant(`ABONNEMENT.PLAN_LABEL.${type}`) || type;
  }

  getStatutClass(s: string): string {
    const map: any = {
      EN_ATTENTE: 'statut-pill pill-attente',
      ACTIF:      'statut-pill pill-actif',
      VALIDE:     'statut-pill pill-valide',
      EXPIRE:     'statut-pill pill-expire',
      ANNULE:     'statut-pill pill-annule'
    };
    return map[s] || 'statut-pill';
  }

  getStatutLabel(s: string): string {
    return this.translate.instant(`ABONNEMENT.STATUT.${s}`) || s;
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR');
  }
}
