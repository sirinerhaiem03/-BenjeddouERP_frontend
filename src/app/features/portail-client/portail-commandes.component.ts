import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-portail-commandes',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-wrapper">

  <!-- Hero Banner -->
  <div class="hero-banner">
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-icon-wrap">
          <span class="material-symbols-outlined hero-icon">shopping_bag</span>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Mes Commandes</h1>
          <p class="hero-desc">Suivez l'état d'avancement de vos commandes en temps réel</p>
        </div>
      </div>
      <div class="hero-mini-stat" *ngIf="!loading && commandes.length > 0">
        <div class="hms-value">{{ commandes.length }}</div>
        <div class="hms-label">Commande{{ commandes.length > 1 ? 's' : '' }}</div>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="com-body">

    <!-- Skeleton -->
    <div class="skeleton-table" *ngIf="loading">
      <div class="skeleton-row" *ngFor="let i of [1,2,3]"></div>
    </div>

    <!-- Erreur réseau -->
    <div class="table-card" *ngIf="!loading && erreur">
      <div class="empty-standalone">
        <span class="material-symbols-outlined" style="color:#ef4444">wifi_off</span>
        <p style="color:#ef4444;font-weight:700;">Connexion impossible</p>
        <span class="empty-sub">Le serveur ne répond pas. Vérifiez que le backend est démarré.</span>
      </div>
    </div>

    <!-- Empty -->
    <div class="table-card" *ngIf="!loading && !erreur && commandes.length === 0">
      <div class="empty-standalone">
        <div class="empty-icon-circle">
          <span class="material-symbols-outlined">shopping_bag</span>
        </div>
        <p>Aucune commande disponible</p>
        <span class="empty-sub">Vos commandes apparaîtront ici lorsqu'elles seront créées</span>
      </div>
    </div>

    <!-- Liste commandes -->
    <div class="commandes-list" *ngIf="!loading && commandes.length > 0">
      <div class="commande-card" *ngFor="let c of commandes">

        <!-- Header -->
        <div class="card-header-row">
          <div class="card-header-left">
            <span class="mono-text">{{ c.numeroCommande }}</span>
            <span class="date-chip">
              <span class="material-symbols-outlined" style="font-size:14px">calendar_today</span>
              {{ c.dateCommande | date:'dd/MM/yyyy' }}
            </span>
          </div>
          <div class="card-header-right">
            <span class="montant-text">{{ c.montantTotal | number:'1.3-3' }} TND</span>
            <span class="status-badge" [ngClass]="getBadgeClass(c.statut)">{{ formatStatut(c.statut) }}</span>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-section">
          <div class="timeline-bar">
            <div class="timeline-step" *ngFor="let step of getTimeline(c.statut)"
                 [class.done]="step.done" [class.active]="step.active">
              <div class="step-dot">
                <span class="material-symbols-outlined" *ngIf="step.done" style="font-size:14px">check</span>
                <span class="material-symbols-outlined" *ngIf="!step.done && step.active" style="font-size:14px">radio_button_checked</span>
                <span class="material-symbols-outlined" *ngIf="!step.done && !step.active" style="font-size:14px">radio_button_unchecked</span>
              </div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>
        </div>

        <!-- Produits -->
        <div class="lignes-section" *ngIf="c.lignes && c.lignes.length > 0">
          <div class="lignes-header">
            <span class="material-symbols-outlined" style="font-size:16px;color:#64748b">inventory_2</span>
            Produits commandés
          </div>
          <table class="data-table">
            <thead>
              <tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of c.lignes">
                <td>{{ l.produit?.nom || 'Produit' }}</td>
                <td><span class="qty-badge">× {{ l.quantite }}</span></td>
                <td class="text-purple">{{ l.prixUnitaire | number:'1.3-3' }} TND</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    .page-wrapper { margin: -28px; min-height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; }
    .com-body { padding: 28px 32px; }

    .page-wrapper { margin: -28px; min-height: 100vh; background: #f0f4f8; }
    .com-body { padding: 28px 32px; }

    /* Hero */
    .hero-banner {
      background: linear-gradient(135deg, #0a0f1e 0%, #0f1f2e 55%, #1a0f00 100%);
      padding: 32px 36px 28px; position: relative; overflow: hidden;
    }
    .hero-banner::before {
      content: ''; position: absolute;
      width: 380px; height: 380px;
      background: radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%);
      top: -100px; right: -60px; border-radius: 50%;
    }
    .hero-content { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; gap: 20px; }
    .hero-left { display: flex; align-items: center; gap: 20px; }
    .hero-icon-wrap {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(249,115,22,0.45);
    }
    .hero-icon { font-size: 28px !important; color: white; }
    .hero-title { font-size: 1.7rem; font-weight: 800; color: white; margin: 0 0 6px; letter-spacing: -0.02em; }
    .hero-desc  { font-size: 0.875rem; color: rgba(255,255,255,0.55); margin: 0; }
    .hero-mini-stat {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px; padding: 18px 28px; text-align: center; min-width: 110px;
      backdrop-filter: blur(12px);
    }
    .hms-value { font-size: 2.2rem; font-weight: 900; color: #fb923c; line-height: 1; }
    .hms-label { font-size: 0.72rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }

    /* Skeleton */
    .skeleton-row { height: 130px; border-radius: 14px; background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; margin-bottom: 14px; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

    /* Empty */
    .table-card { background: white; border: 1px solid #e8eef5; border-radius: 18px; overflow: hidden; box-shadow: 0 2px 12px rgba(15,23,42,0.06); }
    .empty-standalone { text-align: center; padding: 72px 40px; display: flex; flex-direction: column; align-items: center; }
    .empty-icon-circle {
      width: 88px; height: 88px; border-radius: 50%;
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border: 2px solid rgba(249,115,22,0.2);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
      animation: floatAnim 3s ease-in-out infinite;
    }
    @keyframes floatAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .empty-icon-circle .material-symbols-outlined { font-size: 40px !important; color: #f97316; }
    .empty-standalone p { color: #334155; font-weight: 700; margin: 0 0 6px; font-size: 1rem; }
    .empty-sub { font-size: 0.82rem; color: #94a3b8; }

    /* Cards */
    .commandes-list { display: flex; flex-direction: column; gap: 16px; }
    .commande-card {
      background: white; border: 1.5px solid #e8eef5;
      border-radius: 18px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(15,23,42,0.05);
      transition: box-shadow 0.25s, transform 0.2s;
    }
    .commande-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.1); transform: translateY(-2px); }

    .card-header-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(to right, #fafbff, white);
      flex-wrap: wrap; gap: 10px;
    }
    .card-header-left  { display: flex; align-items: center; gap: 12px; }
    .card-header-right { display: flex; align-items: center; gap: 12px; }
    .mono-text { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 0.9rem; color: #7c3aed; font-weight: 700; }
    .date-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 600;
      padding: 4px 11px; border-radius: 20px; border: 1px solid #e2e8f0;
    }
    .montant-text { font-size: 1rem; font-weight: 800; color: #5b21b6; }

    .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.03em; }
    .badge-warning   { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-success   { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-danger    { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badge-info      { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

    /* Timeline */
    .timeline-section { background: linear-gradient(to bottom, #fafbff, #f8fafc); padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
    .timeline-bar { display: flex; align-items: flex-start; }
    .timeline-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; }
    .timeline-step:not(:last-child)::after {
      content: ''; position: absolute; top: 15px; left: 50%; width: 100%; height: 2px;
      background: #e2e8f0; z-index: 0;
    }
    .timeline-step.done:not(:last-child)::after   { background: linear-gradient(90deg, #10b981, #059669); }
    .timeline-step.active:not(:last-child)::after  { background: linear-gradient(90deg, #f97316, #e2e8f0); }
    .step-dot {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      position: relative; z-index: 1; background: #e2e8f0; color: #94a3b8;
      border: 2px solid #e2e8f0; transition: all 0.25s;
    }
    .timeline-step.done   .step-dot { background: #10b981; color: white; border-color: #10b981; box-shadow: 0 2px 8px rgba(16,185,129,0.35); }
    .timeline-step.active .step-dot { background: linear-gradient(135deg,#f97316,#ea580c); color: white; border-color: #f97316; box-shadow: 0 0 0 5px rgba(249,115,22,0.15), 0 3px 10px rgba(249,115,22,0.4); }
    .step-dot .material-symbols-outlined { font-size: 15px !important; }
    .step-label { font-size: 0.65rem; font-weight: 600; color: #94a3b8; text-align: center; line-height: 1.3; letter-spacing: 0.01em; }
    .timeline-step.done   .step-label { color: #059669; font-weight: 700; }
    .timeline-step.active .step-label { color: #ea580c; font-weight: 800; }

    /* Lignes */
    .lignes-section { }
    .lignes-header { display: flex; align-items: center; gap: 6px; padding: 11px 18px; font-size: 0.78rem; font-weight: 700; color: #475569; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead tr { background: #f8fafc; }
    .data-table th { padding: 10px 16px; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 11px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover td { background: #fafbff; }
    .qty-badge { background: #f1f5f9; color: #475569; padding: 2px 9px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; border: 1px solid #e2e8f0; }
    .text-purple { color: #7c3aed; font-weight: 600; }
  `]
})
export class PortailCommandesComponent implements OnInit {
  commandes: any[] = [];
  loading = true;
  erreur = false;

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw).token : null;
    if (!token) { this.loading = false; return; }

    fetch('http://localhost:9090/api/portail/commandes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data: any) => {
      this.commandes = Array.isArray(data) ? data : [];
      this.loading = false;
    })
    .catch(() => {
      this.commandes = [];
      this.erreur = true;
      this.loading = false;
    });
  }

  getTimeline(statut: string): { label: string; done: boolean; active: boolean }[] {
    const steps = [
      { label: 'Commande reçue', key: 'EN_ATTENTE' },
      { label: 'En traitement',  key: 'EN_COURS' },
      { label: 'Expédiée',       key: 'EXPEDIEE' },
      { label: 'Livrée',         key: 'LIVREE' },
    ];
    const order = ['EN_ATTENTE', 'EN_COURS', 'EXPEDIEE', 'LIVREE'];
    const currentIdx = order.indexOf(statut);

    if (statut === 'ANNULEE') {
      return [{ label: 'Annulée', done: false, active: true }];
    }

    return steps.map((s, i) => ({
      label: s.label,
      done: i < currentIdx,
      active: i === currentIdx
    }));
  }

  formatStatut(s: string): string {
    switch (s) {
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_COURS':   return 'En cours';
      case 'EXPEDIEE':   return 'Expédiée';
      case 'LIVREE':     return 'Livrée';
      case 'ANNULEE':    return 'Annulée';
      case 'PAYEE':      return 'Payée';
      default: return s;
    }
  }

  getBadgeClass(s: string): string {
    switch (s) {
      case 'EN_ATTENTE': return 'status-badge badge-secondary';
      case 'EN_COURS':   return 'status-badge badge-warning';
      case 'EXPEDIEE':   return 'status-badge badge-info';
      case 'LIVREE':
      case 'PAYEE':      return 'status-badge badge-success';
      case 'ANNULEE':    return 'status-badge badge-danger';
      default:           return 'status-badge badge-secondary';
    }
  }
}
