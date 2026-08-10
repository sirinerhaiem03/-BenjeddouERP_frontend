import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription, interval } from 'rxjs';

/**
 * TrialBannerComponent — J3 Sécurité (S3)
 *
 * Bannière affichée en haut de toutes les pages pour les comptes en période d'essai.
 * 3 niveaux de sévérité selon les jours restants :
 * - 🔵 > 10 jours : bannière discrète (info)
 * - 🟠 ≤ 10 jours : bannière orange pulsante (warning)
 * - 🔴 ≤ 3 jours  : bannière rouge + bouton CTA urgent (danger)
 */
@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="trial-banner" [class]="bannerClass">
      <div class="trial-inner">
        <div class="trial-left">
          <span class="trial-icon">{{ icon }}</span>
          <div class="trial-text">
            <strong>{{ titleText }}</strong>
            <span>{{ subtitleText }}</span>
          </div>
        </div>
        <div class="trial-right">
          <div class="trial-countdown" *ngIf="joursRestants >= 0">
            <span class="trial-days">{{ joursRestants }}</span>
            <span class="trial-days-label">jour{{ joursRestants !== 1 ? 's' : '' }} restant{{ joursRestants !== 1 ? 's' : '' }}</span>
          </div>
          <button class="trial-cta" (click)="goToAbonnement()">
            {{ joursRestants <= 3 ? '🔥 Activer maintenant' : 'Voir les offres' }}
          </button>
          <button class="trial-close" *ngIf="joursRestants > 10" (click)="dismiss()" title="Fermer">✕</button>
        </div>
      </div>
      <div class="trial-progress" *ngIf="progressPercent !== null">
        <div class="trial-progress-bar" [style.width.%]="progressPercent"></div>
      </div>
    </div>
  `,
  styles: [`
    .trial-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      font-family: 'Inter', sans-serif;
      transition: all 0.3s ease;
    }

    /* ── Niveau 1 : Info (> 10 jours) ── */
    .trial-info {
      background: linear-gradient(135deg, #1e40af, #1d4ed8);
      border-top: 2px solid rgba(96, 165, 250, 0.4);
    }

    /* ── Niveau 2 : Warning (≤ 10 jours) ── */
    .trial-warning {
      background: linear-gradient(135deg, #92400e, #d97706);
      border-top: 2px solid rgba(251, 191, 36, 0.5);
      animation: pulse-warning 2s ease-in-out infinite;
    }

    /* ── Niveau 3 : Danger (≤ 3 jours) ── */
    .trial-danger {
      background: linear-gradient(135deg, #7f1d1d, #dc2626);
      border-top: 2px solid rgba(252, 165, 165, 0.5);
      animation: pulse-danger 1s ease-in-out infinite;
    }

    @keyframes pulse-warning {
      0%, 100% { box-shadow: 0 -2px 12px rgba(217, 119, 6, 0.3); }
      50% { box-shadow: 0 -4px 20px rgba(217, 119, 6, 0.6); }
    }

    @keyframes pulse-danger {
      0%, 100% { box-shadow: 0 -2px 16px rgba(220, 38, 38, 0.5); }
      50% { box-shadow: 0 -6px 28px rgba(220, 38, 38, 0.9); }
    }

    .trial-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      gap: 16px;
    }

    .trial-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .trial-icon {
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .trial-text {
      display: flex;
      flex-direction: column;
    }

    .trial-text strong {
      color: white;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .trial-text span {
      color: rgba(255,255,255,0.75);
      font-size: 0.72rem;
      margin-top: 1px;
    }

    .trial-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .trial-countdown {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(0,0,0,0.2);
      padding: 4px 12px;
      border-radius: 8px;
    }

    .trial-days {
      color: white;
      font-size: 1.4rem;
      font-weight: 900;
      line-height: 1;
    }

    .trial-days-label {
      color: rgba(255,255,255,0.7);
      font-size: 0.58rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .trial-cta {
      background: white;
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 0.78rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .trial-info .trial-cta { color: #1d4ed8; }
    .trial-info .trial-cta:hover { background: #eff6ff; }
    .trial-warning .trial-cta { color: #92400e; }
    .trial-warning .trial-cta:hover { background: #fffbeb; }
    .trial-danger .trial-cta { color: #7f1d1d; }
    .trial-danger .trial-cta:hover { background: #fef2f2; }

    .trial-close {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.8);
      border-radius: 6px;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.65rem;
      transition: all 0.2s;
    }

    .trial-close:hover {
      background: rgba(255,255,255,0.25);
      color: white;
    }

    /* Barre de progression */
    .trial-progress {
      height: 3px;
      background: rgba(0,0,0,0.2);
    }

    .trial-progress-bar {
      height: 100%;
      background: rgba(255,255,255,0.6);
      transition: width 0.5s ease;
    }

    @media (max-width: 640px) {
      .trial-inner { padding: 10px 14px; flex-wrap: wrap; }
      .trial-text span { display: none; }
      .trial-countdown { display: none; }
    }
  `]
})
export class TrialBannerComponent implements OnInit, OnDestroy {

  visible = false;
  joursRestants = 0;
  progressPercent: number | null = null;
  bannerClass = 'trial-info';
  icon = '🕐';
  titleText = '';
  subtitleText = '';

  private dismissed = false;
  private sub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.update();

    // Mettre à jour toutes les heures
    this.sub = interval(60 * 60 * 1000).subscribe(() => this.update());

    // S'abonner aux changements du user (login/logout)
    this.authService.currentUser.subscribe(() => this.update());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private update(): void {
    const user = this.authService.currentUserValue;

    if (!user || !user.modeTrial || this.dismissed) {
      this.visible = false;
      return;
    }

    this.joursRestants = this.authService.getJoursTrialRestants();
    const joursMax = 30;

    // Durée utilisée = combien de jours depuis le début du trial
    const joursUtilises = joursMax - this.joursRestants;
    this.progressPercent = Math.min(100, Math.round((joursUtilises / joursMax) * 100));

    if (this.joursRestants <= 0) {
      this.visible = false; // Géré par le heartbeat
      return;
    }

    this.visible = true;

    if (this.joursRestants <= 3) {
      this.bannerClass = 'trial-danger';
      this.icon = '🔴';
      this.titleText = 'Période d\'essai critique !';
      this.subtitleText = `Il ne vous reste que ${this.joursRestants} jour${this.joursRestants > 1 ? 's' : ''} — Activez votre abonnement maintenant`;
    } else if (this.joursRestants <= 10) {
      this.bannerClass = 'trial-warning';
      this.icon = '⚠️';
      this.titleText = 'Période d\'essai bientôt terminée';
      this.subtitleText = `${this.joursRestants} jours restants — Passez à l'abonnement complet pour garder accès`;
    } else {
      this.bannerClass = 'trial-info';
      this.icon = '🕐';
      this.titleText = 'Mode Période d\'Essai actif';
      this.subtitleText = `Vous explorez BENJEDDOU ERP — ${this.joursRestants} jours restants dans votre essai gratuit`;
    }
  }

  goToAbonnement(): void {
    this.router.navigate(['/abonnement']);
  }

  dismiss(): void {
    this.dismissed = true;
    this.visible = false;
    // Réapparaître le lendemain
    setTimeout(() => { this.dismissed = false; this.update(); }, 24 * 60 * 60 * 1000);
  }
}
