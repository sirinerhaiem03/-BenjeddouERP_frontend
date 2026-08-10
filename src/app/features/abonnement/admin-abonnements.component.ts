import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-abonnements',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="page">

  <!-- Header -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-icon">💳</div>
      <div>
        <h1 class="page-title">{{ 'ADMIN_ABONNEMENTS.TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'ADMIN_ABONNEMENTS.SUBTITLE' | translate }}</p>
      </div>
    </div>
    <div class="header-actions">
      <div class="stat-badge stat-attente" *ngIf="nbEnAttente > 0">{{ nbEnAttente }} {{ 'ADMIN_ABONNEMENTS.FILTER_PENDING' | translate }}</div>
      <button class="btn-refresh" (click)="charger()">🔄</button>
    </div>
  </div>

  <!-- Notifs -->
  <div class="notif success" *ngIf="successMsg">✅ {{ successMsg }}</div>
  <div class="notif error"   *ngIf="errorMsg">❌ {{ errorMsg }}</div>

  <!-- Filtres -->
  <div class="filter-bar">
    <button class="filter-btn" *ngFor="let f of filtres"
            [class.active]="filtreActif === f.value"
            (click)="filtreActif = f.value; appliquerFiltre()">
      {{ f.icon }} {{ getFiltreLabel(f.value) }}
      <span class="filter-count" *ngIf="countFiltre(f.value) > 0">{{ countFiltre(f.value) }}</span>
    </button>
  </div>

  <!-- Table -->
  <div class="table-card">
    <div class="table-empty" *ngIf="abonnementsFiltres.length === 0">
      <div class="empty-icon">📭</div>
      <p>{{ 'ADMIN_ABONNEMENTS.NO_REQUESTS' | translate }}</p>
    </div>

    <table class="abo-table" *ngIf="abonnementsFiltres.length > 0">
      <thead>
        <tr>
          <th>{{ 'ADMIN_CLIENTS.TH_COMPANY' | translate }}</th>
          <th>Plan</th>
          <th>Prix</th>
          <th>Paiement</th>
          <th>Soumis le</th>
          <th>{{ 'ADMIN_CLIENTS.TH_STATUS' | translate }}</th>
          <th>{{ 'ADMIN_CLIENTS.TH_ACTIONS' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let a of abonnementsFiltres" [class.row-attente]="a.statut === 'EN_ATTENTE'">
          <td>
            <div class="client-info">
              <div class="client-avatar">{{ getInitiales(a.clientNom) }}</div>
              <div>
                <div class="client-nom">{{ a.clientNom || '—' }}</div>
                <div class="client-email">{{ a.clientEmail }}</div>
                <div class="client-societe" *ngIf="a.clientSociete">🏢 {{ a.clientSociete }}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="plan-cell">
              <span class="plan-icon-sm">
                {{ a.typePlan === 'MENSUEL' ? '🥉' : a.typePlan === 'TRIMESTRIEL' ? '🥈' : '🥇' }}
              </span>
              <div>
                <div class="plan-label">{{ getLabelPlan(a.typePlan) }}</div>
                <div class="plan-duree">{{ a.dureeMois }} mois</div>
              </div>
            </div>
          </td>
          <td class="prix-cell">{{ a.prix }} DT</td>
          <td>
            <div class="paiement-cell">
              <span class="methode-tag">{{ getIconMethode(a.methodePaiement) }} {{ a.methodePaiement }}</span>
              <div class="ref-tag" *ngIf="a.referencePaiement">{{ a.referencePaiement }}</div>
            </div>
          </td>
          <td class="date-cell">{{ formatDate(a.dateSoumission) }}</td>
          <td>
            <span class="statut-pill" [ngClass]="getStatutClass(a.statut)">
              {{ getStatutLabel(a.statut) }}
            </span>
            <div class="dates-abo" *ngIf="a.dateDebut">
              <small>{{ formatDate(a.dateDebut) }} → {{ formatDate(a.dateFin) }}</small>
            </div>
          </td>
          <td>
            <div class="action-group" *ngIf="a.statut === 'EN_ATTENTE'">
              <button class="btn-valider" (click)="ouvrirDecision(a, 'VALIDER')">✅ Valider</button>
              <button class="btn-refuser" (click)="ouvrirDecision(a, 'REFUSER')">❌ Refuser</button>
            </div>
            <div class="statut-final" *ngIf="a.statut !== 'EN_ATTENTE'">
              <span *ngIf="a.statut === 'ACTIF'" class="done">Activé ✅</span>
              <span *ngIf="a.statut === 'ANNULE'" class="refuse">Refusé ❌</span>
              <span *ngIf="a.statut === 'EXPIRE'">Expiré ⌛</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="table-footer" *ngIf="abonnementsFiltres.length > 0">
      {{ abonnementsFiltres.length }} abonnement(s) — Total encaissé :
      <strong>{{ totalActifs() }} DT</strong>
    </div>
  </div>

  <!-- Modal décision -->
  <div class="modal-backdrop" *ngIf="showDecision" (click)="showDecision = false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>{{ decisionType === 'VALIDER' ? '✅ Valider le paiement' : '❌ Refuser la demande' }}</h2>
        <button class="modal-close" (click)="showDecision = false">✕</button>
      </div>
      <div class="modal-body" *ngIf="aboSelectionne">
        <div class="decision-summary">
          <div class="ds-row"><span>Client</span><strong>{{ aboSelectionne.clientNom }}</strong></div>
          <div class="ds-row"><span>Plan</span><strong>{{ getLabelPlan(aboSelectionne.typePlan) }}</strong></div>
          <div class="ds-row"><span>Montant</span><strong>{{ aboSelectionne.prix }} DT</strong></div>
          <div class="ds-row"><span>Méthode</span><strong>{{ aboSelectionne.methodePaiement }}</strong></div>
          <div class="ds-row" *ngIf="aboSelectionne.referencePaiement">
            <span>Référence</span><strong>{{ aboSelectionne.referencePaiement }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label>Notes / Observations (optionnel)</label>
          <textarea class="form-textarea" [(ngModel)]="notesDecision"
                    placeholder="Ex: Paiement reçu le 20/06/2026, référence VIR-001..."
                    rows="3"></textarea>
        </div>

        <div class="info-box-modal" *ngIf="decisionType === 'VALIDER'">
          ℹ️ Cette action <strong>activera le compte client</strong> et démarrera l'abonnement immédiatement.
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" (click)="showDecision = false">Annuler</button>
          <button class="btn-confirm-valider" *ngIf="decisionType === 'VALIDER'"
                  [disabled]="decisionLoading" (click)="confirmerDecision()">
            {{ decisionLoading ? '⏳ Traitement...' : '✅ Confirmer et activer' }}
          </button>
          <button class="btn-confirm-refuser" *ngIf="decisionType === 'REFUSER'"
                  [disabled]="decisionLoading" (click)="confirmerDecision()">
            {{ decisionLoading ? '⏳ Traitement...' : '❌ Confirmer le refus' }}
          </button>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

    .page { padding: 28px; min-height: 100vh; background: #f8fafc; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-header-left { display: flex; align-items: center; gap: 16px; }
    .page-icon { font-size: 2.2rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
    .page-subtitle { font-size: 0.8rem; color: #94a3b8; margin: 2px 0 0; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .stat-badge { padding: 6px 14px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .stat-attente { background: #fef9c3; color: #a16207; border: 1px solid #fde68a; }
    .btn-refresh { width: 38px; height: 38px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-size: 1rem; }

    .notif { padding: 12px 18px; border-radius: 10px; margin-bottom: 16px; font-weight: 600; font-size: 0.85rem; }
    .notif.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .notif.error   { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    .filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-btn {
      padding: 7px 16px; background: #fff; border: 1.5px solid #e2e8f0;
      border-radius: 99px; font-size: 0.78rem; font-weight: 600; color: #64748b;
      cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 6px;
    }
    .filter-btn:hover { border-color: #f97316; color: #f97316; }
    .filter-btn.active { background: #f97316; border-color: #f97316; color: #fff; }
    .filter-count {
      background: rgba(255,255,255,0.3); color: inherit;
      padding: 1px 7px; border-radius: 99px; font-size: 0.68rem; font-weight: 800;
    }
    .filter-btn.active .filter-count { background: rgba(255,255,255,0.35); }

    .table-card { background: #fff; border-radius: 18px; border: 1.5px solid #f1f5f9; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.04); }
    .table-empty { text-align: center; padding: 60px; color: #94a3b8; }
    .empty-icon  { font-size: 3rem; margin-bottom: 12px; }

    .abo-table { width: 100%; border-collapse: collapse; }
    .abo-table thead { background: linear-gradient(135deg, #0f172a, #1e3a5f); }
    .abo-table thead th { padding: 13px 16px; text-align: left; font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 0.05em; }
    .abo-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background .15s; }
    .abo-table tbody tr:hover { background: #fafafa; }
    .abo-table tbody tr.row-attente { background: #fffbeb; }
    .abo-table tbody td { padding: 14px 16px; vertical-align: middle; }

    .client-info { display: flex; align-items: flex-start; gap: 10px; }
    .client-avatar {
      width: 36px; height: 36px; background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;
    }
    .client-nom   { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
    .client-email { font-size: 0.72rem; color: #94a3b8; }
    .client-societe { font-size: 0.7rem; color: #64748b; margin-top: 2px; }

    .plan-cell { display: flex; align-items: center; gap: 10px; }
    .plan-icon-sm { font-size: 1.4rem; }
    .plan-label { font-size: 0.83rem; font-weight: 700; color: #0f172a; }
    .plan-duree { font-size: 0.7rem; color: #94a3b8; }
    .prix-cell { font-size: 0.9rem; font-weight: 800; color: #0f172a; white-space: nowrap; }

    .paiement-cell { display: flex; flex-direction: column; gap: 4px; }
    .methode-tag { font-size: 0.75rem; font-weight: 600; color: #475569; }
    .ref-tag { font-size: 0.68rem; color: #94a3b8; font-family: monospace; }
    .date-cell { font-size: 0.78rem; color: #64748b; }

    .statut-pill { padding: 4px 10px; border-radius: 99px; font-size: 0.68rem; font-weight: 700; display: inline-block; }
    .pill-actif    { background: #dcfce7; color: #15803d; }
    .pill-attente  { background: #fef9c3; color: #a16207; }
    .pill-valide   { background: #dbeafe; color: #1d4ed8; }
    .pill-expire   { background: #f1f5f9; color: #64748b; }
    .pill-annule   { background: #fee2e2; color: #b91c1c; }
    .dates-abo { font-size: 0.68rem; color: #94a3b8; margin-top: 4px; }

    .action-group { display: flex; flex-direction: column; gap: 6px; }
    .btn-valider { padding: 6px 12px; background: #dcfce7; color: #15803d; border: none; border-radius: 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all .2s; }
    .btn-valider:hover { background: #bbf7d0; }
    .btn-refuser { padding: 6px 12px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 8px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all .2s; }
    .btn-refuser:hover { background: #fecaca; }
    .statut-final { font-size: 0.75rem; color: #94a3b8; }
    .statut-final .done   { color: #15803d; font-weight: 700; }
    .statut-final .refuse { color: #b91c1c; font-weight: 700; }

    .table-footer { padding: 12px 16px; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
    .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 520px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,.25); animation: modalIn .25s cubic-bezier(.34,1.56,.64,1); }
    @keyframes modalIn { from { opacity: 0; transform: translateY(-20px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
    .modal-header h2 { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0; }
    .modal-close { width: 30px; height: 30px; background: #f1f5f9; border: none; border-radius: 8px; color: #64748b; cursor: pointer; font-size: 0.9rem; transition: all .2s; }
    .modal-close:hover { background: #fee2e2; color: #dc2626; }
    .modal-body { padding: 24px; }

    .decision-summary { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .ds-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.83rem; border-bottom: 1px solid #f1f5f9; }
    .ds-row:last-child { border-bottom: none; }
    .ds-row span { color: #94a3b8; }
    .ds-row strong { color: #0f172a; }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 6px; }
    .form-textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.83rem; resize: vertical; outline: none; }
    .form-textarea:focus { border-color: #f97316; }

    .info-box-modal { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; font-size: 0.8rem; color: #1e40af; margin-bottom: 20px; line-height: 1.6; }

    .modal-actions { display: flex; gap: 10px; }
    .btn-cancel { flex: 1; padding: 12px; background: #f1f5f9; border: none; border-radius: 10px; color: #64748b; font-weight: 700; cursor: pointer; font-size: 0.85rem; }
    .btn-confirm-valider { flex: 2; padding: 12px; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 10px; color: #fff; font-weight: 800; cursor: pointer; font-size: 0.85rem; transition: opacity .2s; }
    .btn-confirm-refuser { flex: 2; padding: 12px; background: linear-gradient(135deg, #ef4444, #dc2626); border: none; border-radius: 10px; color: #fff; font-weight: 800; cursor: pointer; font-size: 0.85rem; transition: opacity .2s; }
    .btn-confirm-valider:disabled, .btn-confirm-refuser:disabled { opacity: .6; cursor: not-allowed; }
  `]
})
export class AdminAbonnementsComponent implements OnInit {
  abonnements: any[] = [];
  abonnementsFiltres: any[] = [];
  filtreActif = 'TOUS';
  successMsg = '';
  errorMsg = '';

  showDecision = false;
  aboSelectionne: any = null;
  decisionType = '';
  notesDecision = '';
  decisionLoading = false;

  filtres = [
    { value: 'TOUS',       icon: '📋', labelKey: 'ADMIN_ABONNEMENTS.FILTER_ALL' },
    { value: 'EN_ATTENTE', icon: '⏳', labelKey: 'ADMIN_ABONNEMENTS.FILTER_PENDING' },
    { value: 'ACTIF',      icon: '✅', labelKey: 'ADMIN_ABONNEMENTS.FILTER_ACTIVE' },
    { value: 'ANNULE',     icon: '❌', labelKey: 'ADMIN_ABONNEMENTS.FILTER_REFUSED' },
    { value: 'EXPIRE',     icon: '⌛', labelKey: 'ADMIN_ABONNEMENTS.FILTER_EXPIRED' }
  ];

  get nbEnAttente(): number {
    return this.abonnements.filter(a => a.statut === 'EN_ATTENTE').length;
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  getFiltreLabel(val: string): string {
    const f = this.filtres.find(item => item.value === val);
    return f ? this.translate.instant(f.labelKey) : val;
  }

  private getHeaders(): { [key: string]: string } {
    const token = this.authService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.http.get<any[]>('/api/abonnement/admin/tous', { headers: this.getHeaders() }).subscribe({
      next: data => {
        this.abonnements = Array.isArray(data) ? data : [];
        this.appliquerFiltre();
        this.successMsg = '';
        this.errorMsg = '';
      },
      error: err => {
        if (err.status === 401 || err.status === 403) {
          this.errorMsg = '❌ Session expirée. Reconnectez-vous.';
        } else if (err.status === 0) {
          this.errorMsg = '❌ Serveur hors-ligne. Démarrez le backend Spring Boot (port 9090).';
        } else if (err.status === 500) {
          this.abonnements = [];
          this.appliquerFiltre();
          this.errorMsg = '⚠️ Redémarrez le serveur backend Spring Boot pour charger la nouvelle version corrigée sans erreur 500.';
        } else {
          this.errorMsg = `Erreur ${err.status} lors du chargement.`;
        }
      }
    });
  }

  appliquerFiltre(): void {
    if (this.filtreActif === 'TOUS') {
      this.abonnementsFiltres = [...this.abonnements];
    } else {
      this.abonnementsFiltres = this.abonnements.filter(a => a.statut === this.filtreActif);
    }
  }

  countFiltre(val: string): number {
    if (val === 'TOUS') return this.abonnements.length;
    return this.abonnements.filter(a => a.statut === val).length;
  }

  totalActifs(): string {
    const total = this.abonnements
      .filter(a => a.statut === 'ACTIF')
      .reduce((sum, a) => sum + parseFloat(a.prix || 0), 0);
    return total.toFixed(3);
  }

  ouvrirDecision(abo: any, type: string): void {
    this.aboSelectionne = abo;
    this.decisionType = type;
    this.notesDecision = '';
    this.showDecision = true;
  }

  confirmerDecision(): void {
    if (!this.aboSelectionne) return;
    this.decisionLoading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const url = `/api/abonnement/admin/${this.aboSelectionne.id}/decider?decision=${this.decisionType}&notes=${encodeURIComponent(this.notesDecision)}`;
    this.http.put<any>(url, {}, { headers: this.getHeaders() }).subscribe({
      next: res => {
        this.decisionLoading = false;
        this.showDecision = false;
        this.successMsg = res.message || (this.decisionType === 'VALIDER'
          ? '✅ Abonnement validé. Compte client activé. Email envoyé.'
          : '❌ Demande refusée.');
        this.charger();
      },
      error: err => {
        this.decisionLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMsg = '❌ Session expirée. Reconnectez-vous en tant qu\'administrateur.';
        } else if (err.status === 0) {
          this.errorMsg = '❌ Serveur inaccessible (port 9090). Démarrez IntelliJ.';
        } else {
          this.errorMsg = err?.error?.message || `Erreur ${err.status}.`;
        }
      }
    });
  }

  getLabelPlan(type: string): string {
    const m: any = { MENSUEL: 'Mensuel', TRIMESTRIEL: 'Trimestriel', ANNUEL: 'Annuel' };
    return m[type] || type;
  }
  getStatutClass(s: string): string {
    const m: any = { EN_ATTENTE: 'statut-pill pill-attente', ACTIF: 'statut-pill pill-actif', ANNULE: 'statut-pill pill-annule', EXPIRE: 'statut-pill pill-expire', VALIDE: 'statut-pill pill-valide' };
    return m[s] || 'statut-pill';
  }
  getStatutLabel(s: string): string {
    const m: any = { EN_ATTENTE: '⏳ En attente', ACTIF: '✅ Actif', ANNULE: '❌ Annulé', EXPIRE: '⌛ Expiré', VALIDE: '🔵 Validé' };
    return m[s] || s;
  }
  getIconMethode(m: string): string {
    const icons: any = { VIREMENT: '🏦', CHEQUE: '📝', ESPECES: '💵', CARTE: '💳' };
    return icons[m] || '💳';
  }
  getInitiales(nom: string): string {
    if (!nom) return '?';
    return nom.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }
  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  }
}
