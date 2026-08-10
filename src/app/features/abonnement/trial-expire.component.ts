import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-trial-expire',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="trial-expire-page">

  <!-- Particules de fond -->
  <div class="bg-orb orb1"></div>
  <div class="bg-orb orb2"></div>

  <div class="expire-card">

    <!-- Icône animée -->
    <div class="lock-wrap">
      <div class="lock-circle">
        <svg viewBox="0 0 52 52" class="lock-svg">
          <rect x="14" y="24" width="24" height="18" rx="3" fill="none" stroke="#fff" stroke-width="3"/>
          <path d="M19 24v-6a7 7 0 0 1 14 0v6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="lock-ring"></div>
      <div class="lock-ring lock-ring2"></div>
    </div>

    <div class="expire-badge">Période d'essai terminée</div>
    <h1 class="expire-title">Vos 30 connexions ont été utilisées</h1>
    <p class="expire-desc">
      Vous avez profité de votre période d'essai gratuite.<br>
      <strong>Toutes vos données sont conservées</strong> et resteront disponibles 
      dès que vous activerez votre abonnement.
    </p>

    <!-- Compteur -->
    <div class="expire-counter">
      <div class="ec-item">
        <span class="ec-val">30</span>
        <span class="ec-label">Connexions utilisées</span>
      </div>
      <div class="ec-divider"></div>
      <div class="ec-item">
        <span class="ec-val">0</span>
        <span class="ec-label">Restantes</span>
      </div>
      <div class="ec-divider"></div>
      <div class="ec-item">
        <span class="ec-val">100%</span>
        <span class="ec-label">Données conservées</span>
      </div>
    </div>

    <!-- Barre de progression pleine -->
    <div class="progress-wrap">
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-labels">
        <span>0</span>
        <span style="color:#ef4444; font-weight:700">30 / 30 utilisées</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="expire-actions">
      <button class="btn-subscribe" (click)="goToAbonnement()">
        🚀 Activer mon abonnement
      </button>
      <button class="btn-export" (click)="exporterDonnees()" [disabled]="exportLoading">
        <span *ngIf="!exportLoading">📦 Exporter mes données</span>
        <span *ngIf="exportLoading">⏳ Export en cours...</span>
      </button>
    </div>

    <!-- Message export -->
    <div class="export-success" *ngIf="exportSuccess">
      ✅ Données exportées ! Vérifiez vos téléchargements.
    </div>
    <div class="export-error" *ngIf="exportError">
      ❌ {{ exportError }}
    </div>

    <!-- Note informative -->
    <div class="expire-note">
      <span class="note-icon">ℹ️</span>
      <span>Vos données (commandes, devis, factures) sont sécurisées et vous seront accessibles 
      immédiatement après activation de votre abonnement.</span>
    </div>

    <!-- Déconnexion -->
    <button class="btn-logout" (click)="logout()">Se déconnecter →</button>

  </div>
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .trial-expire-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .orb1 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(239,68,68,0.12), transparent 70%);
      top: -100px; right: -100px;
    }
    .orb2 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(249,115,22,0.08), transparent 70%);
      bottom: -80px; left: -80px;
    }

    .expire-card {
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 560px;
      width: 100%;
      text-align: center;
      backdrop-filter: blur(20px);
      box-shadow: 0 32px 80px rgba(0,0,0,0.4);
      position: relative;
      z-index: 1;
      animation: cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(30px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Lock icon */
    .lock-wrap {
      position: relative;
      width: 90px; height: 90px;
      margin: 0 auto 28px;
    }
    .lock-circle {
      width: 90px; height: 90px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 32px rgba(239,68,68,0.4);
      animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
    }
    @keyframes popIn {
      from { transform: scale(0.5); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    .lock-svg { width: 44px; height: 44px; }
    .lock-ring, .lock-ring2 {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      border: 2px solid rgba(239,68,68,0.25);
      animation: ringPulse 2s ease-out infinite;
    }
    .lock-ring2 { animation-delay: 0.7s; border-color: rgba(239,68,68,0.12); }
    @keyframes ringPulse {
      0%   { transform: scale(1);    opacity: 0.7; }
      100% { transform: scale(1.45); opacity: 0; }
    }

    /* Badge */
    .expire-badge {
      display: inline-block;
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.3);
      color: #f87171;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 99px;
      margin-bottom: 16px;
    }

    .expire-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .expire-desc {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.55);
      line-height: 1.7;
      margin-bottom: 28px;
    }
    .expire-desc strong { color: rgba(255,255,255,0.85); }

    /* Counter */
    .expire-counter {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .ec-item { flex: 1; }
    .ec-val   { display: block; font-size: 1.8rem; font-weight: 900; color: #fff; line-height: 1; }
    .ec-label { font-size: 0.65rem; color: rgba(255,255,255,0.4); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; display: block; }
    .ec-item:first-child .ec-val { color: #f87171; }
    .ec-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }

    /* Progress */
    .progress-wrap { margin-bottom: 28px; }
    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.08);
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-fill {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #ef4444, #dc2626);
      border-radius: 99px;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.68rem;
      color: rgba(255,255,255,0.4);
    }

    /* Actions */
    .expire-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .btn-subscribe {
      padding: 15px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 14px;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 20px rgba(249,115,22,0.35);
    }
    .btn-subscribe:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(249,115,22,0.5); }

    .btn-export {
      padding: 13px;
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      color: rgba(255,255,255,0.8);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-export:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
    .btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

    .export-success {
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.25);
      color: #22c55e;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.78rem;
      margin-bottom: 12px;
    }
    .export-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      color: #f87171;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.78rem;
      margin-bottom: 12px;
    }

    /* Note */
    .expire-note {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 0.74rem;
      color: rgba(255,255,255,0.4);
      line-height: 1.6;
      margin-bottom: 24px;
      text-align: left;
    }
    .note-icon { flex-shrink: 0; }

    .btn-logout {
      background: none;
      border: none;
      color: rgba(255,255,255,0.3);
      font-size: 0.75rem;
      cursor: pointer;
      transition: color 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .btn-logout:hover { color: rgba(255,255,255,0.6); }
  `]
})
export class TrialExpireComponent implements OnInit {
  exportLoading = false;
  exportSuccess = false;
  exportError = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Vérifier que l'utilisateur est bien en mode trial expiré
    // (Si pas de flag, c'est peut-être une navigation directe — on laisse passer)
  }

  goToAbonnement(): void {
    this.router.navigate(['/abonnement']);
  }

  exporterDonnees(): void {
    this.exportLoading = true;
    this.exportSuccess = false;
    this.exportError = '';

    const token = this.authService.getToken();
    const headers = new HttpHeaders(token ? { 'Authorization': `Bearer ${token}` } : {});

    this.http.get<any>('/api/export/mes-donnees', { headers }).subscribe({
      next: (data) => {
        this.exportLoading = false;
        this.exportSuccess = true;
        // Télécharger le JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `export-mes-donnees-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        setTimeout(() => this.exportSuccess = false, 4000);
      },
      error: (err) => {
        this.exportLoading = false;
        this.exportError = err?.error?.message || 'Erreur lors de l\'export. Réessayez.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    localStorage.removeItem('trialExpire');
    this.router.navigate(['/login']);
  }
}
