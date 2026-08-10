import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-portail-devis',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-wrapper">

  <!-- Hero Banner -->
  <div class="hero-banner">
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-icon-wrap">
          <span class="material-symbols-outlined hero-icon">description</span>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Mes Devis</h1>
          <p class="hero-desc">Consultez vos devis et répondez-y directement</p>
        </div>
      </div>
      <div class="hero-mini-stat" *ngIf="!loading && devis.length > 0">
        <div class="hms-value">{{ devis.length }}</div>
        <div class="hms-label">Devis</div>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="com-body">

    <!-- Skeleton -->
    <div class="skeleton-table" *ngIf="loading">
      <div class="skeleton-row" *ngFor="let i of [1,2,3]"></div>
    </div>

    <!-- Empty -->
    <div class="table-card" *ngIf="!loading && devis.length === 0">
      <div class="empty-row-standalone">
        <div class="empty-icon-circle">
          <span class="material-symbols-outlined">description</span>
        </div>
        <p>Aucun devis disponible</p>
        <span class="empty-sub">Vos devis apparaîtront ici lorsque votre commercial en créera un</span>
      </div>
    </div>

    <!-- Liste devis -->
    <div class="devis-list" *ngIf="!loading && devis.length > 0">
      <div class="devis-card" *ngFor="let d of devis" [class.devis-urgent]="d.statut === 'ENVOYE'">

        <!-- Header -->
        <div class="card-header-row">
          <div class="card-header-left">
            <span class="mono-text">{{ d.numeroDevis || 'DEV-' + d.id }}</span>
            <span class="urgent-chip" *ngIf="d.statut === 'ENVOYE'">
              <span class="material-symbols-outlined" style="font-size:14px">notifications_active</span>
              Action requise
            </span>
          </div>
          <span class="status-badge" [ngClass]="getBadgeClass(d.statut)">{{ d.statut }}</span>
        </div>

        <!-- Info grid -->
        <div class="info-grid">
          <div class="info-cell">
            <div class="info-lbl">Date création</div>
            <div class="info-val">{{ d.dateCreation | date:'dd/MM/yyyy' }}</div>
          </div>
          <div class="info-cell">
            <div class="info-lbl">Date validité</div>
            <div class="info-val" [class.text-danger]="isExpired(d.dateValidite)">
              {{ d.dateValidite ? (d.dateValidite | date:'dd/MM/yyyy') : '—' }}
            </div>
          </div>
          <div class="info-cell">
            <div class="info-lbl">Montant</div>
            <div class="info-val">{{ d.montantTotal | number:'1.3-3' }} TND</div>
          </div>
          <div class="info-cell info-cell-accent">
            <div class="info-lbl">Statut devis</div>
            <div class="info-val info-val-primary">{{ d.statut }}</div>
          </div>
        </div>

        <!-- Lignes -->
        <div class="table-card lignes-wrap" *ngIf="d.lignesDevis && d.lignesDevis.length > 0">
          <div class="lignes-header">
            <span class="material-symbols-outlined" style="font-size:16px;color:#64748b">inventory_2</span>
            Détail du devis ({{ d.lignesDevis.length }} ligne(s))
          </div>
          <table class="data-table">
            <thead>
              <tr><th>Produit</th><th>Qté</th><th>Prix unitaire</th><th>Remise</th><th>Total ligne</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of d.lignesDevis">
                <td>{{ l.produit?.nom || 'Produit' }}</td>
                <td>{{ l.quantite }}</td>
                <td>{{ l.prixUnitaire | number:'1.3-3' }} TND</td>
                <td><span class="remise-badge">{{ l.remise || 0 }}%</span></td>
                <td><strong>{{ (l.quantite * l.prixUnitaire * (1 - (l.remise||0)/100)) | number:'1.3-3' }} TND</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions si ENVOYE -->
        <div class="action-banner" *ngIf="d.statut === 'ENVOYE'">
          <span class="material-symbols-outlined">pending_actions</span>
          <span class="action-txt">Ce devis est en attente de votre réponse</span>
          <div class="action-btns">
            <button class="btn btn-success btn-sm" (click)="repondre(d, 'ACCEPTE')" [disabled]="loadingReponse === d.id">
              <span class="material-symbols-outlined">check</span> Accepter
            </button>
            <button class="btn btn-danger btn-sm" (click)="repondre(d, 'REFUSE')" [disabled]="loadingReponse === d.id">
              <span class="material-symbols-outlined">close</span> Refuser
            </button>
          </div>
        </div>

        <div class="alert-success mt-8" *ngIf="reponseSuccess === d.id">Réponse envoyée avec succès !</div>
        <div class="alert-error   mt-8" *ngIf="reponseError   === d.id">Erreur lors de l'envoi. Réessayez.</div>

      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    .page-wrapper { margin: -28px; min-height: 100vh; background: #f0f4f8; }
    .com-body { padding: 28px 32px; }

    /* Hero */
    .hero-banner {
      background: linear-gradient(135deg, #0a0f1e 0%, #0f1f2e 55%, #1a1060 100%);
      padding: 32px 36px 28px; position: relative; overflow: hidden;
    }
    .hero-banner::before {
      content: ''; position: absolute;
      width: 380px; height: 380px;
      background: radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%);
      top: -100px; right: -60px; border-radius: 50%;
    }
    .hero-content { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; gap: 20px; }
    .hero-left { display: flex; align-items: center; gap: 20px; }
    .hero-icon-wrap {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(139,92,246,0.4);
    }
    .hero-icon { font-size: 28px !important; color: white; }
    .hero-title { font-size: 1.7rem; font-weight: 800; color: white; margin: 0 0 6px; letter-spacing: -0.02em; }
    .hero-desc  { font-size: 0.875rem; color: rgba(255,255,255,0.55); margin: 0; }
    .hero-mini-stat {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px; padding: 18px 28px; text-align: center; min-width: 110px;
      backdrop-filter: blur(12px);
    }
    .hms-value { font-size: 2.2rem; font-weight: 900; color: #a78bfa; line-height: 1; }
    .hms-label { font-size: 0.72rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }

    /* Skeleton */
    .skeleton-table { display: flex; flex-direction: column; gap: 12px; }
    .skeleton-row { height: 110px; border-radius: 14px; background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

    /* Empty */
    .table-card { background: white; border: 1px solid #e8eef5; border-radius: 18px; overflow: hidden; box-shadow: 0 2px 12px rgba(15,23,42,0.06); }
    .empty-row-standalone { text-align: center; padding: 72px 40px; display: flex; flex-direction: column; align-items: center; }
    .empty-icon-circle {
      width: 88px; height: 88px; border-radius: 50%;
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
      border: 2px solid rgba(139,92,246,0.2);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
      animation: floatAnim 3s ease-in-out infinite;
    }
    @keyframes floatAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .empty-icon-circle .material-symbols-outlined { font-size: 40px !important; color: #8b5cf6; }
    .empty-row-standalone p { color: #334155; font-weight: 700; margin: 0 0 6px; font-size: 1rem; }
    .empty-sub { font-size: 0.82rem; color: #94a3b8; }

    /* Cards */
    .devis-list { display: flex; flex-direction: column; gap: 16px; }
    .devis-card {
      background: white; border: 1.5px solid #e8eef5;
      border-radius: 18px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(15,23,42,0.05);
      transition: box-shadow 0.25s, transform 0.2s;
    }
    .devis-card:hover { box-shadow: 0 8px 28px rgba(15,23,42,0.1); transform: translateY(-2px); }
    .devis-urgent { border-left: 4px solid #f97316; box-shadow: 0 2px 12px rgba(249,115,22,0.1); }

    .card-header-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(to right, #fafbff, white);
    }
    .card-header-left { display: flex; align-items: center; gap: 12px; }
    .mono-text { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 0.9rem; color: #7c3aed; font-weight: 700; }
    .urgent-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fed7aa;
      color: #c2410c; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 20px;
    }

    .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.03em; }
    .badge-warning   { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-success   { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-danger    { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badge-info      { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-bottom: 1px solid #f1f5f9; }
    .info-cell { padding: 16px 22px; border-right: 1px solid #f1f5f9; }
    .info-cell:last-child { border-right: none; }
    .info-cell-accent { background: linear-gradient(135deg, #fffbeb, #fef3c7); }
    .info-lbl { font-size: 0.63rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 5px; }
    .info-val { font-size: 0.92rem; font-weight: 600; color: #1e293b; }
    .info-val-primary { color: #b45309; font-weight: 800; font-size: 1rem; }
    .text-danger { color: #ef4444; }

    /* Lignes */
    .lignes-wrap { margin: 0; border-radius: 0; border: none; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; box-shadow: none; }
    .lignes-header { display: flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 0.78rem; font-weight: 700; color: #475569; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead tr { background: #f8fafc; }
    .data-table th { padding: 10px 16px; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 11px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .remise-badge { background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; }

    /* Action banner */
    .action-banner {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 22px; background: linear-gradient(135deg, #fffbeb, #fef3c7);
      border-top: 1px solid #fde68a; flex-wrap: wrap;
    }
    .action-banner .material-symbols-outlined { font-size: 22px !important; color: #d97706; flex-shrink: 0; }
    .action-txt { font-size: 0.875rem; font-weight: 600; color: #92400e; flex: 1; }
    .action-btns { display: flex; gap: 10px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 10px; font-family: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-sm { padding: 7px 15px; font-size: 0.82rem; border-radius: 9px; }
    .btn-success { background: linear-gradient(135deg,#10b981,#059669); color: white; box-shadow: 0 3px 12px rgba(16,185,129,0.35); }
    .btn-success:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16,185,129,0.45); }
    .btn-danger  { background: white; border: 1.5px solid #ef4444; color: #dc2626; }
    .btn-danger:hover { background: #fee2e2; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
    .btn .material-symbols-outlined { font-size: 16px !important; }

    .alert-success, .alert-error { padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; animation: fadeIn 0.3s ease; }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
    .alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .mt-8 { margin: 10px 22px 14px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]

})
export class PortailDevisComponent implements OnInit {
  devis: any[] = [];
  loading = true;
  loadingReponse: number | null = null;
  reponseSuccess: number | null = null;
  reponseError:   number | null = null;

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw).token : null;
    if (!token) { this.loading = false; return; }

    fetch('http://localhost:9090/api/portail/devis', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.ok ? r.json() : [])
    .then((data: any[]) => {
      // Exclure les demandes client (DEMANDE_CLIENT) — ce sont des demandes en attente de traitement
      // Le client les voit dans "Demande de Devis", pas ici
      this.devis = (data || []).filter((d: any) => d.statut !== 'DEMANDE_CLIENT');
      this.loading = false;
    })
    .catch(() => { this.loading = false; });
  }

  repondre(devis: any, action: 'ACCEPTE' | 'REFUSE'): void {
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw).token : null;
    if (!token) return;

    this.loadingReponse = devis.id;
    this.reponseSuccess = null;
    this.reponseError   = null;

    fetch(`http://localhost:9090/api/portail/devis/${devis.id}/reponse`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    .then(r => r.json())
    .then(() => {
      devis.statut = action;
      this.reponseSuccess = devis.id;
      this.loadingReponse = null;
      setTimeout(() => { this.reponseSuccess = null; }, 4000);
    })
    .catch(() => {
      this.reponseError = devis.id;
      this.loadingReponse = null;
      setTimeout(() => { this.reponseError = null; }, 4000);
    });
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'ENVOYE':    return 'status-badge badge-warning';
      case 'ACCEPTE':   return 'status-badge badge-success';
      case 'REFUSE':    return 'status-badge badge-danger';
      case 'BROUILLON': return 'status-badge badge-secondary';
      case 'EXPIRE':    return 'status-badge badge-danger';
      default:          return 'status-badge badge-secondary';
    }
  }

  isExpired(date: string): boolean {
    return !!date && new Date(date) < new Date();
  }
}
