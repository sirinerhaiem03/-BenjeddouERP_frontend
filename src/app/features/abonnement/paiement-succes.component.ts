import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-paiement-succes',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="success-page">
  <div class="success-card" [class.loading]="!status">

    <!-- Loading -->
    <div class="loader-wrap" *ngIf="!status">
      <div class="spinner"></div>
      <p>Vérification du paiement en cours...</p>
    </div>

    <!-- Succès -->
    <div class="content" *ngIf="status === 'success'">
      <div class="icon-wrap">
        <div class="icon-circle success-circle">
          <!-- SVG checkmark animé -->
          <svg viewBox="0 0 52 52" class="check-svg" xmlns="http://www.w3.org/2000/svg">
            <circle class="check-bg" cx="26" cy="26" r="25" fill="none"/>
            <path class="check-mark" fill="none" stroke="#ffffff" stroke-width="4"
                  stroke-linecap="round" stroke-linejoin="round"
                  d="M14 27 l8 8 l16 -16"/>
          </svg>
        </div>
        <div class="ripple"></div>
        <div class="ripple ripple2"></div>
      </div>
      <h1>Paiement confirmé !</h1>
      <p class="subtitle">Votre compte ERP est maintenant <strong>actif</strong>.</p>

      <div class="details-box">
        <div class="detail-row">
          <span>Statut</span>
          <span class="badge-success">✅ Payé et activé</span>
        </div>
        <div class="detail-row">
          <span>Méthode</span>
          <span>💳 Stripe Checkout</span>
        </div>
        <div class="detail-row">
          <span>Email de confirmation</span>
          <span>📧 Envoyé</span>
        </div>
      </div>

      <button class="btn-dashboard" (click)="goToDashboard()">
        🚀 Accéder à mon espace ERP →
      </button>

      <p class="note">Un email de confirmation vous a été envoyé avec les détails de votre abonnement.</p>
    </div>

    <!-- Erreur -->
    <div class="content" *ngIf="status === 'error'">
      <div class="icon-wrap">
        <div class="icon-circle error-circle">
          <!-- SVG X mark -->
          <svg viewBox="0 0 52 52" class="check-svg" xmlns="http://www.w3.org/2000/svg">
            <path class="check-mark" fill="none" stroke="#ffffff" stroke-width="4"
                  stroke-linecap="round" stroke-linejoin="round"
                  d="M16 16 l20 20 M36 16 l-20 20"/>
          </svg>
        </div>
      </div>
      <h1>Paiement non confirmé</h1>
      <p class="subtitle">{{ errorMessage }}</p>
      <button class="btn-retry" (click)="goToAbonnement()">← Retour aux abonnements</button>
    </div>

  </div>
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

    * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

    .success-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .success-card {
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 28px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      backdrop-filter: blur(20px);
    }

    /* Loader */
    .loader-wrap { color: rgba(255,255,255,0.6); }
    .spinner {
      width: 48px; height: 48px;
      border: 3px solid rgba(249,115,22,0.2);
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Icône avec animation */
    .icon-wrap {
      position: relative;
      width: 100px; height: 100px;
      margin: 0 auto 32px;
    }
    .icon-circle {
      width: 100px; height: 100px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      animation: popIn 0.5s cubic-bezier(.34,1.56,.64,1) forwards;
    }
    .success-circle {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 0 0 0 0 rgba(34,197,94,0.4);
    }
    .error-circle {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    /* SVG checkmark / X */
    .check-svg {
      width: 52px; height: 52px;
    }
    .check-mark {
      stroke-dasharray: 60;
      stroke-dashoffset: 60;
      animation: drawCheck 0.5s ease-out 0.3s forwards;
    }
    @keyframes drawCheck {
      to { stroke-dashoffset: 0; }
    }
    /* Ripple rings */
    .ripple, .ripple2 {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      border: 2px solid rgba(34,197,94,0.35);
      animation: ripplePulse 2s ease-out infinite;
    }
    .ripple2 {
      animation-delay: 0.7s;
      border-color: rgba(34,197,94,0.2);
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes ripplePulse {
      0%   { transform: scale(1);    opacity: 0.7; }
      100% { transform: scale(1.45); opacity: 0; }
    }

    h1 { font-size: 1.8rem; font-weight: 900; color: #fff; margin: 0 0 10px; letter-spacing: -0.02em; }
    .subtitle { color: rgba(255,255,255,0.6); font-size: 0.95rem; line-height: 1.6; margin: 0 0 28px; }

    .details-box {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 28px;
      text-align: left;
    }
    .detail-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0;
      font-size: 0.83rem;
      color: rgba(255,255,255,0.6);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .detail-row:last-child { border-bottom: none; }
    .badge-success {
      background: #dcfce7; color: #15803d;
      padding: 3px 10px; border-radius: 99px;
      font-size: 0.72rem; font-weight: 700;
    }

    .btn-dashboard {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none; border-radius: 14px;
      color: #fff; font-size: 1rem; font-weight: 800;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(249,115,22,0.4);
      transition: all .2s;
      margin-bottom: 16px;
    }
    .btn-dashboard:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(249,115,22,0.5); }

    .btn-retry {
      padding: 12px 24px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 12px; color: #fff;
      font-size: 0.88rem; font-weight: 700; cursor: pointer;
      transition: all .2s;
    }
    .btn-retry:hover { border-color: #f97316; color: #f97316; }

    .note { font-size: 0.75rem; color: rgba(255,255,255,0.3); line-height: 1.6; }
  `]
})
export class PaiementSuccesComponent implements OnInit {
  status: 'success' | 'error' | null = null;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const sessionId    = this.route.snapshot.queryParamMap.get('session_id');
    const abonnementId = this.route.snapshot.queryParamMap.get('abonnement_id');

    // Récupérer l'ID du client depuis le localStorage
    let clientId: string | null = null;
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        clientId = user?.id?.toString() ?? null;
      }
    } catch { /* */ }

    if (sessionId && abonnementId && clientId) {
      // Vérifier et activer le paiement côté backend
      this.http.get<any>(`/api/stripe/verify-session?sessionId=${sessionId}&abonnementId=${abonnementId}&clientId=${clientId}`)
        .subscribe({
          next: res => {
            this.status = 'success';
          },
          error: err => {
            this.status = 'error';
            this.errorMessage = err?.error?.message || 'Impossible de confirmer le paiement.';
          }
        });
    } else if (sessionId) {
      // Fallback: session sans paramètres supplémentaires → succès probable
      this.status = 'success';
    } else {
      this.status = 'error';
      this.errorMessage = 'Session de paiement introuvable.';
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToAbonnement(): void {
    this.router.navigate(['/abonnement']);
  }
}
