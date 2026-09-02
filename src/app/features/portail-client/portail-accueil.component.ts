import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Kpis {
  facturesImpayees: number;
  montantDu: number;
  devisEnAttente: number;
  commandesEnCours: number;
  facturesPayees: number;
  totalFactures: number;
  totalCommandes: number;
  totalDevis: number;
}

@Component({
  selector: 'app-portail-accueil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="accueil-wrapper">

  <!-- Hero greeting -->
  <div class="greeting-hero">
    <div class="greeting-left">
      <div class="greeting-avatar">{{ initiales }}</div>
      <div>
        <div class="greeting-welcome">Bienvenue dans votre espace client</div>
        <div class="greeting-name">{{ nomClient }}</div>
        <div class="greeting-date">
          <span class="material-symbols-outlined">calendar_today</span>
          {{ dateAujourdhui }}
        </div>
      </div>
    </div>
    <div class="hero-badge" *ngIf="!loading">
      <span class="material-symbols-outlined">verified</span>
      Compte vérifié
    </div>
  </div>

  <!-- Alerte factures impayées -->
  <div class="alert-banner" *ngIf="kpis && kpis.facturesImpayees > 0">
    <span class="material-symbols-outlined alert-icon">warning</span>
    <div class="alert-text">
      <strong>{{ kpis.facturesImpayees }} facture(s) impayée(s)</strong>
      &nbsp;— Montant dû : <strong>{{ kpis.montantDu | number:'1.3-3' }} TND</strong>
    </div>
    <a routerLink="/dashboard/client-factures" class="alert-btn">
      Voir les factures
      <span class="material-symbols-outlined">arrow_forward</span>
    </a>
  </div>

  <!-- Loading -->
  <div class="loading-box" *ngIf="loading">
    <div class="spinner"></div>
    <p>Chargement de vos données...</p>
  </div>

  <!-- KPI Grid -->
  <div class="kpi-grid" *ngIf="kpis && !loading">
    <div class="kpi-card kpi-red">
      <div class="kpi-icon-wrap">
        <span class="material-symbols-outlined">receipt_long</span>
      </div>
      <div class="kpi-body">
        <div class="kpi-num">{{ kpis.facturesImpayees }}</div>
        <div class="kpi-label">Factures impayées</div>
        <div class="kpi-sub">{{ kpis.montantDu | number:'1.3-3' }} TND dû</div>
      </div>
    </div>
    <div class="kpi-card kpi-blue">
      <div class="kpi-icon-wrap">
        <span class="material-symbols-outlined">request_quote</span>
      </div>
      <div class="kpi-body">
        <div class="kpi-num">{{ kpis.devisEnAttente }}</div>
        <div class="kpi-label">Devis à traiter</div>
        <div class="kpi-sub">En attente de réponse</div>
      </div>
    </div>
    <div class="kpi-card kpi-orange">
      <div class="kpi-icon-wrap">
        <span class="material-symbols-outlined">shopping_bag</span>
      </div>
      <div class="kpi-body">
        <div class="kpi-num">{{ kpis.commandesEnCours }}</div>
        <div class="kpi-label">Commandes en cours</div>
        <div class="kpi-sub">{{ kpis.totalCommandes }} commandes total</div>
      </div>
    </div>
    <div class="kpi-card kpi-green">
      <div class="kpi-icon-wrap">
        <span class="material-symbols-outlined">check_circle</span>
      </div>
      <div class="kpi-body">
        <div class="kpi-num">{{ kpis.facturesPayees }}</div>
        <div class="kpi-label">Factures payées</div>
        <div class="kpi-sub">{{ kpis.totalFactures }} factures total</div>
      </div>
    </div>
  </div>

  <!-- Accès rapide -->
  <div class="section-header">
    <span class="material-symbols-outlined">grid_view</span>
    Accès rapide
  </div>
  <div class="shortcuts-grid">
    <a routerLink="/dashboard/client-factures" class="shortcut-card sc-orange">
      <div class="shortcut-icon-wrap">
        <span class="material-symbols-outlined">receipt_long</span>
      </div>
      <div class="shortcut-label">Mes Factures</div>
      <div class="shortcut-sub">Consulter & payer</div>
      <span class="material-symbols-outlined shortcut-arrow">arrow_forward</span>
    </a>
    <a routerLink="/dashboard/client-devis" class="shortcut-card sc-blue">
      <div class="shortcut-icon-wrap">
        <span class="material-symbols-outlined">request_quote</span>
      </div>
      <div class="shortcut-label">Mes Devis</div>
      <div class="shortcut-sub">Accepter ou refuser</div>
      <span class="material-symbols-outlined shortcut-arrow">arrow_forward</span>
    </a>
    <a routerLink="/dashboard/client-commandes" class="shortcut-card sc-purple">
      <div class="shortcut-icon-wrap">
        <span class="material-symbols-outlined">shopping_bag</span>
      </div>
      <div class="shortcut-label">Mes Commandes</div>
      <div class="shortcut-sub">Suivi en temps réel</div>
      <span class="material-symbols-outlined shortcut-arrow">arrow_forward</span>
    </a>
    <a routerLink="/dashboard/client-profil" class="shortcut-card sc-green">
      <div class="shortcut-icon-wrap">
        <span class="material-symbols-outlined">manage_accounts</span>
      </div>
      <div class="shortcut-label">Mon Profil</div>
      <div class="shortcut-sub">Mes informations</div>
      <span class="material-symbols-outlined shortcut-arrow">arrow_forward</span>
    </a>
    <a routerLink="/dashboard/client-releve" class="shortcut-card sc-teal">
      <div class="shortcut-icon-wrap">
        <span class="material-symbols-outlined">account_balance</span>
      </div>
      <div class="shortcut-label">Relevé de Compte</div>
      <div class="shortcut-sub">Débit · Crédit · Solde</div>
      <span class="material-symbols-outlined shortcut-arrow">arrow_forward</span>
    </a>
    <a routerLink="/dashboard/client-demande-devis" class="shortcut-card sc-cyan">
      <div class="shortcut-icon-wrap">
        <span class="material-symbols-outlined">add_comment</span>
      </div>
      <div class="shortcut-label">Demander un Devis</div>
      <div class="shortcut-sub">Nouveau besoin</div>
      <span class="material-symbols-outlined shortcut-arrow">arrow_forward</span>
    </a>
  </div>

</div>
  `,
  styles: [`
    .accueil-wrapper {
      max-width: 1000px;
      padding: 28px 32px;
    }

    /* ══ HERO GREETING ══ */
    .greeting-hero {
      display: flex; align-items: center; justify-content: space-between;
      background: linear-gradient(135deg, #0a0f1e 0%, #0f1f2e 55%, #0d5c61 100%);
      border-radius: 20px; padding: 28px 32px; margin-bottom: 20px;
      color: white; position: relative; overflow: hidden;
    }
    .greeting-hero::after {
      content: '';
      position: absolute; top: -60px; right: -60px;
      width: 220px; height: 220px; border-radius: 50%;
      background: radial-gradient(circle, rgba(13,200,215,0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .greeting-left { display: flex; align-items: center; gap: 18px; }
    .greeting-avatar {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 16px; display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; font-weight: 900; color: white; flex-shrink: 0;
      box-shadow: 0 8px 20px rgba(249,115,22,0.4);
    }
    .greeting-welcome { font-size: 0.78rem; color: rgba(255,255,255,0.5); margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
    .greeting-name { font-size: 1.4rem; font-weight: 800; color: white; letter-spacing: -0.02em; margin-bottom: 6px; }
    .greeting-date {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.75rem; color: rgba(255,255,255,0.45);
    }
    .greeting-date .material-symbols-outlined { font-size: 14px !important; }
    .hero-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(52,211,153,0.15);
      border: 1px solid rgba(52,211,153,0.3);
      border-radius: 999px; padding: 8px 16px;
      color: #34d399; font-size: 0.78rem; font-weight: 700;
    }
    .hero-badge .material-symbols-outlined { font-size: 16px !important; }

    /* ══ ALERT ══ */
    .alert-banner {
      display: flex; align-items: center; gap: 12px;
      background: linear-gradient(135deg, #fff5f5, #fef2f2);
      border: 1.5px solid #fecaca; border-radius: 14px;
      padding: 14px 20px; margin-bottom: 20px;
    }
    .alert-icon { color: #ef4444; font-size: 22px !important; }
    .alert-text { flex: 1; font-size: 0.84rem; color: #7f1d1d; }
    .alert-btn {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white; padding: 8px 16px; border-radius: 10px;
      text-decoration: none; font-size: 0.78rem; font-weight: 700;
      white-space: nowrap; transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(239,68,68,0.3);
    }
    .alert-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(239,68,68,0.4); }
    .alert-btn .material-symbols-outlined { font-size: 15px !important; }

    /* ══ KPI GRID ══ */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
      margin-bottom: 28px;
    }
    .kpi-card {
      border-radius: 16px; padding: 20px;
      display: flex; align-items: flex-start; gap: 14px;
      border: 1.5px solid transparent;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative; overflow: hidden;
    }
    .kpi-card::after {
      content: '';
      position: absolute; bottom: -20px; right: -20px;
      width: 80px; height: 80px; border-radius: 50%;
      opacity: 0.07;
    }
    .kpi-card:hover { transform: translateY(-3px); }

    .kpi-red    { background: linear-gradient(135deg, #fff5f5, #fee2e2); border-color: #fecaca; }
    .kpi-blue   { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #bfdbfe; }
    .kpi-orange { background: linear-gradient(135deg, #fff7ed, #ffedd5); border-color: #fed7aa; }
    .kpi-green  { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-color: #bbf7d0; }
    .kpi-red:hover    { box-shadow: 0 8px 24px rgba(239,68,68,0.15); }
    .kpi-blue:hover   { box-shadow: 0 8px 24px rgba(59,130,246,0.15); }
    .kpi-orange:hover { box-shadow: 0 8px 24px rgba(249,115,22,0.15); }
    .kpi-green:hover  { box-shadow: 0 8px 24px rgba(34,197,94,0.15); }

    .kpi-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-red    .kpi-icon-wrap { background: rgba(239,68,68,0.12);  }
    .kpi-blue   .kpi-icon-wrap { background: rgba(59,130,246,0.12); }
    .kpi-orange .kpi-icon-wrap { background: rgba(249,115,22,0.12); }
    .kpi-green  .kpi-icon-wrap { background: rgba(34,197,94,0.12);  }
    .kpi-red    .kpi-icon-wrap .material-symbols-outlined { color: #ef4444; font-size: 22px !important; }
    .kpi-blue   .kpi-icon-wrap .material-symbols-outlined { color: #3b82f6; font-size: 22px !important; }
    .kpi-orange .kpi-icon-wrap .material-symbols-outlined { color: #f97316; font-size: 22px !important; }
    .kpi-green  .kpi-icon-wrap .material-symbols-outlined { color: #22c55e; font-size: 22px !important; }

    .kpi-num { font-size: 1.9rem; font-weight: 900; line-height: 1; }
    .kpi-red    .kpi-num { color: #ef4444; }
    .kpi-blue   .kpi-num { color: #3b82f6; }
    .kpi-orange .kpi-num { color: #f97316; }
    .kpi-green  .kpi-num { color: #22c55e; }
    .kpi-label { font-size: 0.78rem; font-weight: 700; color: #374151; margin-top: 5px; }
    .kpi-sub   { font-size: 0.68rem; color: #9ca3af; margin-top: 3px; }

    /* ══ SECTION HEADER ══ */
    .section-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.88rem; font-weight: 800; color: #0f172a;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f1f5f9;
    }
    .section-header .material-symbols-outlined { font-size: 18px !important; color: #64748b; }

    /* ══ SHORTCUTS ══ */
    .shortcuts-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    }
    .shortcut-card {
      background: white; border: 1.5px solid #e8eef5; border-radius: 16px;
      padding: 20px; text-decoration: none;
      transition: all 0.22s; cursor: pointer;
      display: flex; flex-direction: column; position: relative; overflow: hidden;
    }
    .shortcut-card:hover {
      transform: translateY(-3px);
      border-color: transparent;
    }
    .sc-orange:hover { box-shadow: 0 8px 28px rgba(249,115,22,0.18); background: linear-gradient(135deg, #fff7ed, white); }
    .sc-blue:hover   { box-shadow: 0 8px 28px rgba(59,130,246,0.18); background: linear-gradient(135deg, #eff6ff, white); }
    .sc-purple:hover { box-shadow: 0 8px 28px rgba(139,92,246,0.18); background: linear-gradient(135deg, #f5f3ff, white); }
    .sc-green:hover  { box-shadow: 0 8px 28px rgba(34,197,94,0.18);  background: linear-gradient(135deg, #f0fdf4, white); }
    .sc-teal:hover   { box-shadow: 0 8px 28px rgba(20,184,166,0.18); background: linear-gradient(135deg, #f0fdfa, white); }
    .sc-cyan:hover   { box-shadow: 0 8px 28px rgba(6,182,212,0.18);  background: linear-gradient(135deg, #ecfeff, white); }

    .shortcut-icon-wrap {
      width: 46px; height: 46px; border-radius: 14px; margin-bottom: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .sc-orange .shortcut-icon-wrap { background: rgba(249,115,22,0.1); }
    .sc-blue   .shortcut-icon-wrap { background: rgba(59,130,246,0.1); }
    .sc-purple .shortcut-icon-wrap { background: rgba(139,92,246,0.1); }
    .sc-green  .shortcut-icon-wrap { background: rgba(34,197,94,0.1);  }
    .sc-teal   .shortcut-icon-wrap { background: rgba(20,184,166,0.1); }
    .sc-cyan   .shortcut-icon-wrap { background: rgba(6,182,212,0.1);  }

    .sc-orange .shortcut-icon-wrap .material-symbols-outlined { color: #f97316; font-size: 22px !important; }
    .sc-blue   .shortcut-icon-wrap .material-symbols-outlined { color: #3b82f6; font-size: 22px !important; }
    .sc-purple .shortcut-icon-wrap .material-symbols-outlined { color: #8b5cf6; font-size: 22px !important; }
    .sc-green  .shortcut-icon-wrap .material-symbols-outlined { color: #22c55e; font-size: 22px !important; }
    .sc-teal   .shortcut-icon-wrap .material-symbols-outlined { color: #14b8a6; font-size: 22px !important; }
    .sc-cyan   .shortcut-icon-wrap .material-symbols-outlined { color: #06b6d4; font-size: 22px !important; }

    .shortcut-label { font-size: 0.88rem; font-weight: 800; color: #0f172a; }
    .shortcut-sub   { font-size: 0.72rem; color: #94a3b8; margin-top: 3px; flex: 1; }
    .shortcut-arrow {
      font-size: 16px !important; color: #cbd5e1;
      align-self: flex-end; margin-top: 12px;
      transition: transform 0.2s, color 0.2s;
    }
    .shortcut-card:hover .shortcut-arrow { transform: translateX(4px); color: #64748b; }

    /* ══ LOADING ══ */
    .loading-box {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #94a3b8; font-size: 0.84rem;
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #0d7377;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PortailAccueilComponent implements OnInit {
  kpis: Kpis | null = null;
  loading = true;
  nomClient = '';
  initiales = '';
  dateAujourdhui = '';

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw).token : null;

    if (raw) {
      try {
        const u = JSON.parse(raw);
        this.nomClient = u.prenom ? `${u.prenom} ${u.nom || ''}`.trim() : u.nomUtilisateur || 'Client';
        this.initiales = this.nomClient.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
      } catch {}
    }

    const now = new Date();
    this.dateAujourdhui = now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    if (!token) { this.loading = false; return; }

    fetch(`${environment.apiUrl}/portail/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then((data: any) => {
      this.kpis = data.kpis;
      this.loading = false;
    })
    .catch(() => { this.loading = false; });
  }
}
