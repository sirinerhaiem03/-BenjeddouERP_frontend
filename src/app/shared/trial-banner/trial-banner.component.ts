import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
<!-- ═══════════════════ BANNIÈRE PERMANENTE ═══════════════════ -->
<div class="trial-banner" *ngIf="visible" [class.critique]="critique">
  <div class="tb-left">
    <div class="tb-icon-wrap" [class.pulse]="critique">
      <svg *ngIf="!critique" viewBox="0 0 24 24" fill="none" class="tb-svg">
        <path d="M5 3h14M5 21h14" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 3v4l6 5-6 5v4M18 3v4l-6 5 6 5v4" stroke="#f97316" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg *ngIf="critique" viewBox="0 0 24 24" fill="none" class="tb-svg">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M12 9v4M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="tb-text">
      <strong *ngIf="!critique">Mode Essai Gratuit</strong>
      <strong *ngIf="critique" class="critique-title">⚠ Essai presque épuisé !</strong>
      <span class="tb-msg">{{ message }}</span>
    </div>
  </div>

  <div class="tb-right">
    <div class="tb-progress-wrap">
      <div class="tb-progress-bar">
        <div class="tb-progress-fill" [style.width]="progressWidth"></div>
      </div>
      <span class="tb-progress-label">
        <strong>{{ restant }}</strong> / 30 connexions restantes
      </span>
    </div>
    <button class="tb-btn" (click)="souscrire()">
      <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px;flex-shrink:0">
        <rect x="1" y="3" width="14" height="10" rx="2" stroke="white" stroke-width="1.5"/>
        <path d="M1 7h14" stroke="white" stroke-width="1.5"/>
        <path d="M5 11h3" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Activer l'abonnement
    </button>
  </div>
</div>

<!-- ═══════════════════ MODALE NOTIFICATION CONNEXION (PREMIUM) ═══════════════════ -->
<div class="trial-modal-overlay" *ngIf="modalVisible" (click)="closeModal()">
  <div class="trial-modal-premium" (click)="$event.stopPropagation()">
    
    <!-- Top Illustration Area -->
    <div class="tmp-header" [class.tmp-critique]="critique">
      <div class="tmp-header-content">
        <div class="tmp-icon-glow">
          <span class="material-symbols-outlined">rocket_launch</span>
        </div>
        <h2 class="tmp-title">Passez à la vitesse supérieure !</h2>
        <p class="tmp-subtitle">Débloquez tout le potentiel de votre ERP sans aucune limite.</p>
      </div>
      <button class="tmp-close" (click)="closeModal()">
        <span class="material-symbols-outlined">close</span>
      </button>
      
      <!-- decorative waves/circles -->
      <div class="tmp-decoration"></div>
    </div>

    <!-- Body -->
    <div class="tmp-body">
      
      <!-- Alert & Counter Row -->
      <div class="tmp-status-row">
        <div class="tmp-alert-box" [class.alert-critique]="critique">
          <span class="material-symbols-outlined">{{ critique ? 'warning' : 'info' }}</span>
          <div>
            <strong>Période d'essai en cours</strong>
            <p>{{ message }}</p>
          </div>
        </div>
        
        <div class="tmp-counter-widget" [class.counter-critique]="critique">
          <div class="tmp-ring">
            <span class="tmp-num">{{ restant }}</span>
          </div>
          <span class="tmp-lbl">visites<br>restantes</span>
        </div>
      </div>

      <!-- Benefits -->
      <div class="tmp-benefits-area">
        <h3 class="tmp-benefits-title">Pourquoi s'abonner aujourd'hui ?</h3>
        <div class="tmp-benefits-grid">
          <div class="tmp-benefit-item">
            <div class="tmp-b-icon"><span class="material-symbols-outlined">all_inclusive</span></div>
            <div>
              <strong>Accès Illimité</strong>
              <p>Plus de blocage ni restriction.</p>
            </div>
          </div>
          <div class="tmp-benefit-item">
            <div class="tmp-b-icon"><span class="material-symbols-outlined">receipt_long</span></div>
            <div>
              <strong>Facturation Légale</strong>
              <p>Documents officiels certifiés.</p>
            </div>
          </div>
          <div class="tmp-benefit-item">
            <div class="tmp-b-icon"><span class="material-symbols-outlined">support_agent</span></div>
            <div>
              <strong>Support VIP 24/7</strong>
              <p>Une équipe experte dédiée.</p>
            </div>
          </div>
          <div class="tmp-benefit-item">
            <div class="tmp-b-icon"><span class="material-symbols-outlined">psychology</span></div>
            <div>
              <strong>Module IA Avancé</strong>
              <p>OCR et automatisation poussée.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="tmp-footer">
      <button class="tmp-btn-ghost" (click)="closeModal()">Continuer l'essai ({{ restant }})</button>
      <button class="tmp-btn-glow" (click)="souscrireFromModal()">
        <span>Activer mon abonnement</span>
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
    
    <div class="tmp-progress">
      <div class="tmp-progress-fill" [style.width]="autoDismissWidth"></div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .trial-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      background: linear-gradient(135deg, #1e1a0e 0%, #2a1f08 100%);
      border-radius: 14px;
      padding: 14px 20px;
      margin: 0 0 20px 0;
      flex-wrap: wrap;
      animation: slideDown 0.4s ease-out;
      box-shadow: 0 4px 24px rgba(249,115,22,0.08), inset 0 1px 0 rgba(249,115,22,0.1);
    }
    .trial-banner.critique {
      background: linear-gradient(135deg, #1e0a0a 0%, #2a0f0f 100%);
      border-color: rgba(239,68,68,0.35);
      box-shadow: 0 4px 24px rgba(239,68,68,0.1), inset 0 1px 0 rgba(239,68,68,0.12);
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseBorder {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
      50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
    }

    /* ── Gauche ── */
    .tb-left { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

    .tb-icon-wrap {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: rgba(249,115,22,0.12);
      border: 1px solid rgba(249,115,22,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .trial-banner.critique .tb-icon-wrap {
      background: rgba(239,68,68,0.12);
      border-color: rgba(239,68,68,0.25);
    }
    .tb-icon-wrap.pulse { animation: pulseBorder 1.8s ease infinite; }
    .tb-svg { width: 20px; height: 20px; }

    .tb-text { display: flex; flex-direction: column; gap: 2px; }
    .tb-text strong {
      font-size: 0.82rem; font-weight: 800;
      color: #fb923c;
      letter-spacing: 0.01em;
    }
    .critique-title { color: #f87171 !important; }
    .tb-msg { font-size: 0.73rem; color: rgba(255,255,255,0.45); line-height: 1.4; }

    /* ── Droite ── */
    .tb-right { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }

    .tb-progress-wrap { display: flex; flex-direction: column; gap: 5px; min-width: 160px; }
    .tb-progress-bar {
      height: 5px;
      background: rgba(255,255,255,0.07);
      border-radius: 99px;
      overflow: hidden;
    }
    .tb-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #f97316, #fb923c);
      border-radius: 99px;
      transition: width 0.6s ease;
      box-shadow: 0 0 8px rgba(249,115,22,0.5);
    }
    .critique .tb-progress-fill {
      background: linear-gradient(90deg, #dc2626, #ef4444);
      box-shadow: 0 0 8px rgba(239,68,68,0.5);
    }
    .tb-progress-label {
      font-size: 0.67rem;
      color: rgba(255,255,255,0.35);
      font-weight: 500;
    }
    .tb-progress-label strong { color: rgba(255,255,255,0.7); font-weight: 700; }

    .tb-btn {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 18px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none; border-radius: 10px;
      color: #fff; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; white-space: nowrap;
      transition: all 0.2s;
      box-shadow: 0 2px 14px rgba(249,115,22,0.35);
      letter-spacing: 0.01em;
    }
    .tb-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 22px rgba(249,115,22,0.5); }

    /* ══════════════════════════════════════
       MODALE PREMIUM (WOW EFFECT)
    ══════════════════════════════════════ */
    .trial-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
      animation: fadeInOverlay 0.3s ease-out;
      padding: 20px;
    }
    
    .trial-modal-premium {
      background: #ffffff;
      border-radius: 24px;
      width: 100%; max-width: 620px;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset;
      animation: popInPremium 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }
    @keyframes popInPremium {
      from { opacity:0; transform:scale(0.92) translateY(20px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }

    /* Header Illustration */
    .tmp-header {
      position: relative;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      padding: 30px 30px 50px;
      color: white;
      text-align: center;
      overflow: hidden;
    }
    .tmp-header.tmp-critique {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    }
    .tmp-header-content { position: relative; z-index: 2; }
    .tmp-icon-glow {
      width: 64px; height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      box-shadow: 0 0 20px rgba(255,255,255,0.3);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255,255,255,0.4);
    }
    .tmp-icon-glow span { font-size: 34px; color: white; }
    .tmp-title { font-size: 1.6rem; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.02em; }
    .tmp-subtitle { font-size: 0.95rem; opacity: 0.9; margin: 0; font-weight: 500;}
    
    .tmp-close {
      position: absolute; top: 16px; right: 16px;
      background: rgba(255,255,255,0.15); border: none;
      color: white; border-radius: 50%; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; z-index: 3;
    }
    .tmp-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }
    
    /* Decoration inside header */
    .tmp-decoration {
      position: absolute; bottom: -50px; left: -10%; width: 120%; height: 100px;
      background: #ffffff;
      border-radius: 50%;
      z-index: 1;
    }

    /* Body */
    .tmp-body {
      padding: 10px 30px 30px;
      position: relative;
      z-index: 2;
    }
    
    /* Status Row */
    .tmp-status-row {
      display: flex; gap: 16px; align-items: stretch;
      margin-top: -20px; /* Overlaps with header */
    }
    
    .tmp-alert-box {
      flex: 1;
      background: #ffffff;
      border-radius: 16px;
      padding: 16px;
      display: flex; gap: 12px; align-items: flex-start;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }
    .tmp-alert-box.alert-critique { border-color: #fecaca; background: #fffcfc; }
    .tmp-alert-box span.material-symbols-outlined { color: #f97316; font-size: 28px; }
    .tmp-alert-box.alert-critique span.material-symbols-outlined { color: #ef4444; }
    .tmp-alert-box strong { display: block; color: #0f172a; font-size: 0.95rem; margin-bottom: 4px; }
    .tmp-alert-box p { margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.4; font-weight: 500;}
    
    .tmp-counter-widget {
      width: 120px; flex-shrink: 0;
      background: #ffffff;
      border-radius: 16px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px rgba(249,115,22,0.1);
      border: 1px solid #fed7aa;
      padding: 12px;
    }
    .tmp-counter-widget.counter-critique { box-shadow: 0 10px 25px rgba(239,68,68,0.15); border-color: #fecaca; }
    .tmp-ring {
      width: 54px; height: 54px;
      border-radius: 50%;
      background: #fff7ed;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 6px;
      border: 3px solid #fdba74;
    }
    .counter-critique .tmp-ring { background: #fef2f2; border-color: #fca5a5; }
    .tmp-num { font-size: 1.8rem; font-weight: 900; color: #ea580c; line-height: 1; }
    .counter-critique .tmp-num { color: #dc2626; }
    .tmp-lbl { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #64748b; text-align: center; line-height: 1.2; letter-spacing: 0.05em;}

    /* Benefits */
    .tmp-benefits-area { margin-top: 28px; }
    .tmp-benefits-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0 0 16px; }
    .tmp-benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    
    .tmp-benefit-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px;
      background: #f8fafc;
      border-radius: 14px; border: 1px solid #e2e8f0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tmp-benefit-item:hover {
      background: #ffffff; border-color: #cbd5e1;
      transform: translateY(-3px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.06);
    }
    .tmp-b-icon {
      width: 36px; height: 36px;
      background: #dcfce7; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: #16a34a;
    }
    .tmp-b-icon span { font-size: 20px; }
    .tmp-benefit-item strong { display: block; font-size: 0.9rem; color: #1e293b; margin-bottom: 2px; font-weight: 700;}
    .tmp-benefit-item p { margin: 0; font-size: 0.75rem; color: #64748b; line-height: 1.3; font-weight: 500;}

    /* Footer */
    .tmp-footer {
      display: flex; gap: 16px; padding: 24px 30px;
      background: #f8fafc; border-top: 1px solid #f1f5f9;
      align-items: center; justify-content: space-between;
    }
    .tmp-btn-ghost {
      padding: 12px 20px; background: transparent; border: 2px solid #cbd5e1;
      border-radius: 12px; color: #475569; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .tmp-btn-ghost:hover { border-color: #94a3b8; color: #0f172a; background: #ffffff; }
    
    .tmp-btn-glow {
      flex: 1; max-width: 320px;
      padding: 14px 24px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      border: none; border-radius: 12px;
      color: white; font-size: 1.05rem; font-weight: 800;
      cursor: pointer; transition: all 0.3s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 8px 25px rgba(249,115,22,0.35);
      position: relative; overflow: hidden;
    }
    .tmp-btn-glow::after {
      content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transform: skewX(-20deg); animation: shine 3s infinite;
    }
    @keyframes shine {
      0% { left: -100%; }
      20% { left: 200%; }
      100% { left: 200%; }
    }
    .tmp-btn-glow:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(249,115,22,0.45); }
    .tmp-btn-glow span.material-symbols-outlined { font-size: 20px; transition: transform 0.2s; }
    .tmp-btn-glow:hover span.material-symbols-outlined { transform: translateX(4px); }

    .tmp-progress { height: 4px; background: #e2e8f0; width: 100%; }
    .tmp-progress-fill { height: 100%; background: #f97316; transition: width 0.5s linear; }
  `]
})
export class TrialBannerComponent implements OnInit {
  visible = false;
  critique = false;
  message = '';
  restant = 0;
  progressWidth = '100%';

  // Modale connexion
  modalVisible = false;
  autoDismissWidth = '100%';
  private autoDismissTimer: any;
  private readonly MODAL_SESSION_KEY = 'trialModalShownAt';
  private readonly AUTO_DISMISS_MS = 30000;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.refreshBanner();
    this.checkShowModal();
  }

  refreshBanner(): void {
    const user = this.authService.getCurrentUser();
    if (!user) { this.visible = false; return; }

    const trialMsg = localStorage.getItem('trialMessage');
    if (user.modeTrial && trialMsg) {
      this.visible  = true;
      this.message  = trialMsg;
      this.critique = localStorage.getItem('trialCritique') === 'true';
      const match = trialMsg.match(/(\d+)/);
      this.restant = match ? parseInt(match[1]) : 0;
      this.progressWidth = ((this.restant / 30) * 100) + '%';
    } else {
      this.visible = false;
    }
  }

  private checkShowModal(): void {
    if (!this.visible) return;
    const lastShown = sessionStorage.getItem(this.MODAL_SESSION_KEY);
    if (lastShown) return; // déjà affichée cette session
    setTimeout(() => {
      this.modalVisible = true;
      sessionStorage.setItem(this.MODAL_SESSION_KEY, Date.now().toString());
      this.startAutoDismiss();
    }, 800);
  }

  private startAutoDismiss(): void {
    const steps = 60;
    const interval = this.AUTO_DISMISS_MS / steps;
    let step = steps;
    this.autoDismissWidth = '100%';
    this.autoDismissTimer = setInterval(() => {
      step--;
      this.autoDismissWidth = ((step / steps) * 100) + '%';
      if (step <= 0) {
        clearInterval(this.autoDismissTimer);
        this.modalVisible = false;
      }
    }, interval);
  }

  closeModal(): void {
    if (this.autoDismissTimer) clearInterval(this.autoDismissTimer);
    this.modalVisible = false;
  }

  souscrire(): void {
    this.router.navigate(['/abonnement']);
  }

  souscrireFromModal(): void {
    this.closeModal();
    this.router.navigate(['/abonnement']);
  }
}
