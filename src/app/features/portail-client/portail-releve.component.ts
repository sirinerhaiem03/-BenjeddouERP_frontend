import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LigneReleve {
  date: string;
  reference: string;
  libelle: string;
  type: 'FACTURE' | 'PAIEMENT' | 'AVOIR' | 'COMMANDE';
  debit: number;
  credit: number;
  solde: number;
}

@Component({
  selector: 'app-portail-releve',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  template: `
<div class="page-wrapper">

  <!-- Hero Banner -->
  <div class="hero-banner">
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-icon-wrap">
          <span class="material-symbols-outlined hero-icon">account_balance</span>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Relevé de Compte</h1>
          <p class="hero-desc">Historique de vos transactions — Débit · Crédit · Solde courant</p>
        </div>
      </div>
      <div class="hero-solde-card" *ngIf="!loading">
        <div class="solde-label">SOLDE ACTUEL</div>
        <div class="solde-value" [class.solde-negatif]="soldeCourant > 0" [class.solde-positif]="soldeCourant <= 0">
          {{ soldeCourant | number:'1.3-3' }} TND
        </div>
        <div class="solde-sub">{{ soldeCourant > 0 ? '⚠️ Montant dû' : '✅ Compte soldé' }}</div>
      </div>
    </div>
  </div>

  <div class="com-body">

    <!-- KPI Row -->
    <div class="kpi-row" *ngIf="!loading">
      <div class="kpi-mini kpi-red">
        <span class="material-symbols-outlined">trending_down</span>
        <div>
          <div class="kpi-mini-val">{{ totalDebit | number:'1.3-3' }} TND</div>
          <div class="kpi-mini-lab">Total Débit (Dettes)</div>
        </div>
      </div>
      <div class="kpi-mini kpi-green">
        <span class="material-symbols-outlined">trending_up</span>
        <div>
          <div class="kpi-mini-val">{{ totalCredit | number:'1.3-3' }} TND</div>
          <div class="kpi-mini-lab">Total Crédit (Paiements)</div>
        </div>
      </div>
      <div class="kpi-mini kpi-blue">
        <span class="material-symbols-outlined">receipt_long</span>
        <div>
          <div class="kpi-mini-val">{{ lignes.length }}</div>
          <div class="kpi-mini-lab">Opérations totales</div>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Type</label>
        <select [(ngModel)]="filtreType" (change)="appliquerFiltres()">
          <option value="">Tous</option>
          <option value="FACTURE">Factures</option>
          <option value="PAIEMENT">Paiements</option>
          <option value="AVOIR">Avoirs</option>
          <option value="COMMANDE">Commandes</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Du</label>
        <input type="date" [(ngModel)]="filtreDu" (change)="appliquerFiltres()">
      </div>
      <div class="filter-group">
        <label>Au</label>
        <input type="date" [(ngModel)]="filtreAu" (change)="appliquerFiltres()">
      </div>
      <button class="btn-reset" (click)="reinitialiserFiltres()">
        <span class="material-symbols-outlined">refresh</span> Réinitialiser
      </button>
    </div>

    <!-- Skeleton -->
    <div class="skeleton-table" *ngIf="loading">
      <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
    </div>

    <!-- Erreur serveur -->
    <div class="empty-card" *ngIf="!loading && erreur">
      <span class="material-symbols-outlined" style="color:#ef4444;font-size:2.5rem">wifi_off</span>
      <p style="color:#ef4444;font-weight:700;margin:8px 0 4px">Serveur inaccessible</p>
      <p style="color:#64748b;font-size:0.82rem">Vérifiez que le backend est démarré sur le port 9090</p>
    </div>

    <!-- Aucune transaction réelle -->
    <div class="empty-card" *ngIf="!loading && !erreur && lignes.length === 0">
      <span class="material-symbols-outlined" style="color:#94a3b8;font-size:2.5rem">receipt_long</span>
      <p style="color:#64748b;font-weight:700;margin:8px 0 4px">Aucune transaction</p>
      <p style="color:#94a3b8;font-size:0.82rem">Votre relevé de compte apparaîtra ici dès qu'une facture vous sera émise.</p>
    </div>

    <!-- Tableau avec données réelles -->
    <div class="table-card" *ngIf="!loading && !erreur && lignes.length > 0">
      <table class="releve-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Référence</th>
            <th>Libellé</th>
            <th>Type</th>
            <th class="text-right">Débit</th>
            <th class="text-right">Crédit</th>
            <th class="text-right">Solde</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="lignesFiltrees.length === 0">
            <td colspan="7" class="empty-row">
              <span class="material-symbols-outlined">search_off</span>
              Aucune opération pour ces critères
            </td>
          </tr>
          <tr *ngFor="let l of lignesFiltrees" [class.row-debit]="l.debit > 0" [class.row-credit]="l.credit > 0">
            <td class="date-col">{{ l.date | date:'dd/MM/yyyy' }}</td>
            <td class="ref-col">{{ l.reference }}</td>
            <td>{{ l.libelle }}</td>
            <td><span class="type-badge" [ngClass]="'type-' + l.type.toLowerCase()">{{ l.type }}</span></td>
            <td class="text-right text-red">{{ l.debit > 0 ? (l.debit | number:'1.3-3') + ' TND' : '—' }}</td>
            <td class="text-right text-green">{{ l.credit > 0 ? (l.credit | number:'1.3-3') + ' TND' : '—' }}</td>
            <td class="text-right" [class.text-red]="l.solde > 0" [class.text-green]="l.solde <= 0">
              <strong>{{ l.solde | number:'1.3-3' }} TND</strong>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="footer-row">
            <td colspan="4"><strong>TOTAUX</strong></td>
            <td class="text-right text-red"><strong>{{ totalDebitFiltre | number:'1.3-3' }} TND</strong></td>
            <td class="text-right text-green"><strong>{{ totalCreditFiltre | number:'1.3-3' }} TND</strong></td>
            <td class="text-right" [class.text-red]="soldeCourant > 0" [class.text-green]="soldeCourant <= 0">
              <strong>{{ soldeCourant | number:'1.3-3' }} TND</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

  </div>
</div>
  `,
  styles: [`
    .page-wrapper { min-height: 100vh; background: #f8fafc; }

    .hero-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%);
      padding: 32px 36px; color: white;
    }
    .hero-content { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .hero-left { display: flex; align-items: center; gap: 20px; }
    .hero-icon-wrap {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      display: flex; align-items: center; justify-content: center;
    }
    .hero-icon { font-size: 28px; color: white; }
    .hero-title { font-size: 1.6rem; font-weight: 800; margin: 0 0 4px; }
    .hero-desc  { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin: 0; }

    .hero-solde-card {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 14px; padding: 16px 24px; text-align: right; min-width: 200px;
    }
    .solde-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); }
    .solde-value { font-size: 1.6rem; font-weight: 800; margin: 4px 0; }
    .solde-negatif { color: #fca5a5; }
    .solde-positif { color: #86efac; }
    .solde-sub { font-size: 0.75rem; color: rgba(255,255,255,0.5); }

    .com-body { padding: 28px 36px; max-width: 1200px; margin: 0 auto; }

    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-mini {
      display: flex; align-items: center; gap: 14px;
      background: white; border-radius: 12px; padding: 16px 20px;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .kpi-mini .material-symbols-outlined { font-size: 28px; width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 10px; flex-shrink: 0; }
    .kpi-mini-val { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .kpi-mini-lab { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
    .kpi-red .material-symbols-outlined { background: #fef2f2; color: #ef4444; }
    .kpi-green .material-symbols-outlined { background: #f0fdf4; color: #22c55e; }
    .kpi-blue .material-symbols-outlined { background: #eff6ff; color: #3b82f6; }

    .filter-bar {
      display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;
      background: white; border-radius: 12px; padding: 16px 20px;
      border: 1px solid #e2e8f0; margin-bottom: 20px;
    }
    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-group label { font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .filter-group select, .filter-group input {
      border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px;
      font-size: 0.82rem; color: #0f172a; background: #f8fafc;
      outline: none; min-width: 130px;
    }
    .btn-reset {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: white; color: #64748b; font-size: 0.8rem; cursor: pointer;
      transition: all 0.15s; align-self: flex-end;
    }
    .btn-reset:hover { border-color: #f97316; color: #f97316; }

    .table-card {
      background: white; border-radius: 14px; border: 1px solid #e2e8f0;
      overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .releve-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .releve-table thead th {
      background: #f8fafc; padding: 12px 14px; text-align: left;
      font-weight: 700; font-size: 0.7rem; text-transform: uppercase;
      letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0;
    }
    .releve-table tbody td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
    .releve-table tbody tr:last-child td { border-bottom: none; }
    .releve-table tbody tr:hover { background: #fafbff; }
    .row-debit { border-left: 3px solid #fecaca !important; }
    .row-credit { border-left: 3px solid #bbf7d0 !important; }
    .footer-row { background: #f8fafc; }
    .footer-row td { padding: 12px 14px; border-top: 2px solid #e2e8f0; font-size: 0.82rem; }

    .date-col { color: #475569; white-space: nowrap; }
    .ref-col { font-family: 'Courier New', monospace; font-size: 0.78rem; color: #334155; }
    .text-right { text-align: right; }
    .text-red { color: #ef4444; }
    .text-green { color: #22c55e; }

    .type-badge {
      padding: 2px 8px; border-radius: 6px; font-size: 0.65rem;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    }
    .type-facture  { background: #fff3cd; color: #b45309; }
    .type-paiement { background: #dcfce7; color: #15803d; }
    .type-avoir    { background: #e0e7ff; color: #4338ca; }
    .type-commande { background: #f3e8ff; color: #7c3aed; }

    .empty-row {
      text-align: center; padding: 40px !important; color: #94a3b8;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .empty-card {
      background: white; border-radius: 14px; border: 1px solid #e2e8f0;
      padding: 60px; text-align: center; color: #94a3b8;
    }

    .skeleton-table { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-row {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
      border-radius: 8px; height: 54px;
    }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  `]
})
export class PortailReleveComponent implements OnInit {
  lignes: LigneReleve[] = [];
  lignesFiltrees: LigneReleve[] = [];
  loading = true;
  erreur = false;

  filtreType = '';
  filtreDu = '';
  filtreAu = '';

  get soldeCourant(): number {
    return this.totalDebit - this.totalCredit;
  }
  get totalDebit(): number {
    return this.lignes.reduce((s, l) => s + l.debit, 0);
  }
  get totalCredit(): number {
    return this.lignes.reduce((s, l) => s + l.credit, 0);
  }
  get totalDebitFiltre(): number {
    return this.lignesFiltrees.reduce((s, l) => s + l.debit, 0);
  }
  get totalCreditFiltre(): number {
    return this.lignesFiltrees.reduce((s, l) => s + l.credit, 0);
  }

  private applyLocalPaidReleve(lignes: LigneReleve[]): LigneReleve[] {
    const rawKeys = localStorage.getItem('paid_facture_keys');
    const paidKeys: string[] = rawKeys ? JSON.parse(rawKeys) : [];
    if (!paidKeys.length) return lignes;

    const result: LigneReleve[] = [];
    let soldeCumule = 0;

    for (const l of lignes) {
      soldeCumule += (l.debit || 0) - (l.credit || 0);
      l.solde = soldeCumule;
      result.push(l);

      // Si c'est une facture payée localement et que le paiement n'est pas encore dans le relevé
      const keyMatch = paidKeys.some(k => k === l.reference || l.reference.includes(k) || k.includes(l.reference));
      const payRef = 'PAY-' + l.reference;
      const alreadyHasCredit = lignes.some(other => other.reference === payRef);

      if (l.type === 'FACTURE' && keyMatch && !alreadyHasCredit) {
        soldeCumule -= l.debit;
        result.push({
          date: new Date().toISOString().split('T')[0],
          reference: payRef,
          libelle: 'Paiement facture ' + l.reference,
          type: 'PAIEMENT',
          debit: 0,
          credit: l.debit,
          solde: soldeCumule
        });
      }
    }
    return result;
  }

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw)?.token : null;
    if (!token) { this.loading = false; this.erreur = true; return; }

    fetch('http://localhost:9090/api/portail/releve', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => {
      if (!r.ok) throw new Error('Erreur serveur ' + r.status);
      return r.json();
    })
    .then((data: LigneReleve[]) => {
      this.lignes = this.applyLocalPaidReleve(data);
      this.appliquerFiltres();
      this.loading = false;
    })
    .catch(() => {
      this.erreur = true;
      this.loading = false;
    });
  }

  appliquerFiltres(): void {
    this.lignesFiltrees = this.lignes.filter(l => {
      if (this.filtreType && l.type !== this.filtreType) return false;
      if (this.filtreDu && l.date < this.filtreDu) return false;
      if (this.filtreAu && l.date > this.filtreAu) return false;
      return true;
    });
  }

  reinitialiserFiltres(): void {
    this.filtreType = '';
    this.filtreDu = '';
    this.filtreAu = '';
    this.appliquerFiltres();
  }
}
