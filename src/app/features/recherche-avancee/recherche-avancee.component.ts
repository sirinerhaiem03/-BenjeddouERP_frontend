import {
  Component, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UtilsService, ResultatRecherche } from '../../shared/services/utils.service';

/**
 * Page de Recherche Avancée (N°3).
 * Permet de rechercher dans toute la BD et d'éditer les entités selon les droits.
 * Route : /dashboard/recherche-avancee
 */
@Component({
  selector: 'app-recherche-avancee',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="ra-page">
  <!-- Header -->
  <div class="ra-header">
    <div class="ra-header-left">
      <div class="ra-icon-badge">
        <span class="material-symbols-outlined ra-header-icon">manage_search</span>
      </div>
      <div>
        <h1 class="ra-title">{{ 'RECHERCHE_AVANCEE.TITLE' | translate }}</h1>
        <p class="ra-sub">{{ 'RECHERCHE_AVANCEE.SUBTITLE' | translate }}</p>
      </div>
    </div>
  </div>

  <!-- Barre de recherche avancée -->
  <div class="ra-search-card">
    <div class="ra-search-row">
      <div class="ra-search-wrap">
        <span class="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          class="ra-search-input"
          [placeholder]="'RECHERCHE_AVANCEE.PLACEHOLDER' | translate"
          [(ngModel)]="query"
          (ngModelChange)="onQuery($event)"
          id="ra-search-input"
        />
        <div class="ra-loader" *ngIf="loading">
          <span class="material-symbols-outlined spin">progress_activity</span>
        </div>
        <button class="ra-clear" *ngIf="query" (click)="clear()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Filtres par type -->
      <div class="ra-filters">
        <button
          *ngFor="let f of filtres"
          class="ra-filter-btn"
          [class.ra-filter-active]="f.actif"
          (click)="toggleFiltre(f)"
        >
          <span class="material-symbols-outlined">{{ f.icone }}</span>
          {{ getFiltreLabel(f.key) }}
        </button>
      </div>
    </div>

    <!-- Statistiques de résultats -->
    <div class="ra-stats" *ngIf="totalResultats > 0">
      <span class="material-symbols-outlined">info</span>
      <strong>{{ totalResultats }}</strong> {{ 'RECHERCHE_AVANCEE.RESULT_COUNT' | translate }} "<em>{{ query }}</em>"
      <span class="ra-time">{{ tempsRecherche }}ms</span>
    </div>
  </div>

  <!-- Résultats groupés -->
  <div class="ra-results" *ngIf="resultatsGroupes.length > 0">
    <div class="ra-group" *ngFor="let groupe of resultatsGroupes">

      <div class="ra-group-header">
        <div class="ra-group-title">
          <span class="material-symbols-outlined">{{ groupe.icone }}</span>
          {{ groupe.labelTranslateKey ? (groupe.labelTranslateKey | translate) : groupe.label }}
          <span class="ra-group-count">{{ groupe.items.length }}</span>
        </div>
        <button class="ra-group-nav" (click)="naviguerModule(groupe.route)">
          <span class="material-symbols-outlined">open_in_new</span>
          {{ 'RECHERCHE_AVANCEE.OPEN_MODULE' | translate }}
        </button>
      </div>

      <!-- Table de résultats -->
      <div class="ra-table-wrap">
        <table class="ra-table">
          <thead>
            <tr>
              <th>{{ 'RECHERCHE_AVANCEE.TH_ID' | translate }}</th>
              <th>{{ 'RECHERCHE_AVANCEE.TH_NAME' | translate }}</th>
              <th>{{ 'RECHERCHE_AVANCEE.TH_INFO' | translate }}</th>
              <th>{{ 'RECHERCHE_AVANCEE.TH_DETAIL' | translate }}</th>
              <th>{{ 'RECHERCHE_AVANCEE.TH_ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of groupe.items" [class.ra-row-editing]="editingId === item.id + item.type">
              <td><span class="ra-id">#{{ item.id }}</span></td>

              <!-- Mode lecture -->
              <ng-container *ngIf="editingId !== item.id + item.type">
                <td class="ra-titre">{{ item.titre }}</td>
                <td class="ra-sub">{{ item.sousTitre }}</td>
                <td class="ra-detail">{{ item.detail }}</td>
              </ng-container>

              <!-- Mode édition inline -->
              <ng-container *ngIf="editingId === item.id + item.type">
                <td>
                  <input class="ra-inline-input" [(ngModel)]="editData['titre']" placeholder="Nom" />
                </td>
                <td>
                  <input class="ra-inline-input" [(ngModel)]="editData['sousTitre']" placeholder="Email / Référence" />
                </td>
                <td>
                  <input class="ra-inline-input" [(ngModel)]="editData['detail']" placeholder="Détail" />
                </td>
              </ng-container>

              <td class="ra-actions">
                <!-- Actions lecture -->
                <ng-container *ngIf="editingId !== item.id + item.type">
                  <button class="ra-btn ra-btn-view" (click)="naviguerVers(item)" title="Ouvrir">
                    <span class="material-symbols-outlined">open_in_new</span>
                  </button>
                  <button class="ra-btn ra-btn-edit" (click)="startEdit(item)" title="Modifier">
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                </ng-container>
                <!-- Actions édition -->
                <ng-container *ngIf="editingId === item.id + item.type">
                  <button class="ra-btn ra-btn-save" (click)="sauvegarder(item)" title="Sauvegarder">
                    <span class="material-symbols-outlined">save</span>
                  </button>
                  <button class="ra-btn ra-btn-cancel" (click)="annulerEdit()" title="Annuler">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Aucun résultat -->
  <div class="ra-empty" *ngIf="query.length >= 2 && !loading && totalResultats === 0">
    <div class="ra-empty-icon">
      <span class="material-symbols-outlined">search_off</span>
    </div>
    <p>{{ 'RECHERCHE_AVANCEE.NO_RESULTS' | translate }} "<strong>{{ query }}</strong>"</p>
    <span>{{ 'RECHERCHE_AVANCEE.NO_RESULTS_TIP' | translate }}</span>
  </div>

  <!-- Écran initial -->
  <div class="ra-idle" *ngIf="query.length < 2 && !loading">
    <div class="ra-idle-icon">
      <span class="material-symbols-outlined">manage_search</span>
    </div>
    <p>{{ 'RECHERCHE_AVANCEE.INITIAL_TITLE' | translate }}</p>
    <div class="ra-tips">
      <div class="ra-tip"><span class="material-symbols-outlined">person</span> {{ 'RECHERCHE_AVANCEE.TIP_NAME' | translate }}</div>
      <div class="ra-tip"><span class="material-symbols-outlined">email</span> {{ 'RECHERCHE_AVANCEE.TIP_EMAIL' | translate }}</div>
      <div class="ra-tip"><span class="material-symbols-outlined">phone</span> {{ 'RECHERCHE_AVANCEE.TIP_PHONE' | translate }}</div>
      <div class="ra-tip"><span class="material-symbols-outlined">badge</span> {{ 'RECHERCHE_AVANCEE.TIP_MATRICULE' | translate }}</div>
      <div class="ra-tip"><span class="material-symbols-outlined">qr_code</span> {{ 'RECHERCHE_AVANCEE.TIP_PRODUCT' | translate }}</div>
    </div>
  </div>
</div>
  `,
  styles: [`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.ra-page {
  padding: 28px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  max-width: 1280px;
  margin: 0 auto;
}

.ra-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}
.ra-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.ra-icon-badge {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05));
  border: 1px solid rgba(249,115,22,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(249,115,22,0.1);
}
.ra-header-icon {
  font-size: 28px;
  color: #f97316;
}
.ra-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}
.ra-sub {
  font-size: 0.88rem;
  color: #64748b;
  margin: 3px 0 0;
}

.ra-search-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 28px;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.05);
  transition: all 0.2s ease;
}
.ra-search-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.ra-search-wrap {
  flex: 1;
  min-width: 320px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 18px;
  background: #f8fafc;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.ra-search-wrap:focus-within {
  border-color: #f97316;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
}
.ra-search-wrap .search-icon {
  color: #94a3b8;
  font-size: 22px;
}
.ra-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: #0f172a;
  font-family: inherit;
  font-weight: 500;
  background: transparent;
}
.ra-search-input::placeholder {
  color: #94a3b8;
}
.ra-loader span {
  color: #f97316;
  font-size: 20px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.ra-clear {
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  transition: all 0.15s;
}
.ra-clear:hover {
  background: #fee2e2;
  color: #ef4444;
}

.ra-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ra-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}
.ra-filter-btn span {
  font-size: 18px;
  color: #64748b;
  transition: color 0.2s;
}
.ra-filter-btn:hover {
  border-color: #f97316;
  color: #f97316;
  transform: translateY(-1px);
}
.ra-filter-btn:hover span {
  color: #f97316;
}
.ra-filter-active {
  border-color: #f97316 !important;
  background: linear-gradient(135deg, #fff7ed, #ffedd5) !important;
  color: #c2410c !important;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.12);
}
.ra-filter-active span {
  color: #ea580c !important;
}

.ra-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
  font-size: 0.85rem;
  color: #64748b;
}
.ra-stats span.material-symbols-outlined {
  font-size: 18px;
  color: #f97316;
}
.ra-time {
  margin-left: auto;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
}

.ra-group {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px -5px rgba(15, 23, 42, 0.05);
}
.ra-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
}
.ra-group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.92rem;
}
.ra-group-title span {
  font-size: 20px;
  color: #f97316;
}
.ra-group-count {
  background: rgba(249, 115, 22, 0.25);
  color: #fdba74;
  border-radius: 99px;
  padding: 2px 10px;
  font-size: 0.75rem;
  font-weight: 700;
}
.ra-group-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.ra-group-nav:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}
.ra-group-nav span {
  font-size: 16px;
}

.ra-table-wrap {
  overflow-x: auto;
}
.ra-table {
  width: 100%;
  border-collapse: collapse;
}
.ra-table th {
  padding: 12px 18px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  text-align: left;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.ra-table td {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.86rem;
  color: #334155;
  vertical-align: middle;
}
.ra-table tbody tr:last-child td {
  border-bottom: none;
}
.ra-table tbody tr:hover {
  background: #f8fafc;
}
.ra-row-editing td {
  background: #fff7ed !important;
}
.ra-id {
  background: #f1f5f9;
  color: #475569;
  padding: 3px 9px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 600;
}
.ra-titre {
  font-weight: 700;
  color: #0f172a;
}
.ra-sub {
  color: #64748b;
  font-weight: 500;
}
.ra-detail {
  color: #64748b;
  font-size: 0.8rem;
}

.ra-inline-input {
  width: 100%;
  border: 1.5px solid #f97316;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.84rem;
  color: #0f172a;
  outline: none;
  font-family: inherit;
  background: #ffffff;
}

.ra-actions {
  display: flex;
  gap: 6px;
}
.ra-btn {
  display: flex;
  align-items: center;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  padding: 6px 9px;
  transition: all 0.2s;
}
.ra-btn span {
  font-size: 17px;
}
.ra-btn-view {
  background: #eff6ff;
  color: #2563eb;
}
.ra-btn-edit {
  background: #f5f3ff;
  color: #7c3aed;
}
.ra-btn-save {
  background: #dcfce7;
  color: #16a34a;
}
.ra-btn-cancel {
  background: #fee2e2;
  color: #dc2626;
}
.ra-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.ra-empty, .ra-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  gap: 14px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
}
.ra-empty-icon, .ra-idle-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ra-empty-icon span, .ra-idle-icon span {
  font-size: 32px;
  color: #94a3b8;
}
.ra-empty p, .ra-idle p {
  color: #334155;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}
.ra-empty span {
  color: #64748b;
  font-size: 0.82rem;
}
.ra-tips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 10px;
}
.ra-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}
.ra-tip span {
  font-size: 17px;
  color: #f97316;
}
  `]
})
export class RechercheAvanceeComponent implements OnInit {

  query = '';
  loading = false;
  totalResultats = 0;
  tempsRecherche = 0;
  resultatsGroupes: { label: string; labelTranslateKey?: string; icone: string; route: string; items: ResultatRecherche[] }[] = [];

  editingId: string | null = null;
  editData: Record<string, string> = {};

  filtres = [
    { key: 'UTILISATEUR', labelKey: 'RECHERCHE_AVANCEE.FILTER_USERS',     label: 'Utilisateurs', icone: 'manage_accounts', actif: true },
    { key: 'CLIENT',      labelKey: 'RECHERCHE_AVANCEE.FILTER_CLIENTS',   label: 'Clients',      icone: 'person',           actif: true },
    { key: 'FOURNISSEUR', labelKey: 'RECHERCHE_AVANCEE.FILTER_SUPPLIERS', label: 'Fournisseurs', icone: 'local_shipping',   actif: true },
    { key: 'PRODUIT',     labelKey: 'RECHERCHE_AVANCEE.FILTER_PRODUCTS',  label: 'Produits',     icone: 'inventory_2',      actif: true },
  ];

  private queryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private utilsService: UtilsService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  getFiltreLabel(key: string): string {
    const f = this.filtres.find(item => item.key === key);
    return f ? this.translate.instant(f.labelKey) : key;
  }

  onQuery(q: string): void {
    if (this.queryTimer) clearTimeout(this.queryTimer);
    if (q.length < 2) { this.resultatsGroupes = []; this.totalResultats = 0; return; }
    this.queryTimer = setTimeout(() => this.rechercher(q), 300);
  }

  rechercher(q: string): void {
    this.loading = true;
    const debut = Date.now();
    const filtresActifs = this.filtres.filter(f => f.actif).map(f => f.key);

    this.utilsService.rechercherGlobal(q, 20).subscribe(resultats => {
      this.loading = false;
      this.tempsRecherche = Date.now() - debut;
      const iconeMap: Record<string, string> = {
        'Utilisateurs': 'manage_accounts', 'Clients': 'person',
        'Fournisseurs': 'local_shipping', 'Produits': 'inventory_2'
      };
      const translateKeyMap: Record<string, string> = {
        'Utilisateurs': 'RECHERCHE_AVANCEE.FILTER_USERS',
        'Clients': 'RECHERCHE_AVANCEE.FILTER_CLIENTS',
        'Fournisseurs': 'RECHERCHE_AVANCEE.FILTER_SUPPLIERS',
        'Produits': 'RECHERCHE_AVANCEE.FILTER_PRODUCTS'
      };
      const routeMap: Record<string, string> = {
        'Utilisateurs': 'admin-users', 'Clients': 'clients',
        'Fournisseurs': 'achats', 'Produits': 'products'
      };
      this.resultatsGroupes = Object.entries(resultats)
        .filter(([, items]) => {
          if (items.length === 0) return false;
          return filtresActifs.includes(items[0].type);
        })
        .map(([label, items]) => ({
          label,
          labelTranslateKey: translateKeyMap[label],
          items,
          icone: iconeMap[label] || 'search',
          route: routeMap[label] || ''
        }));
      this.totalResultats = this.resultatsGroupes.reduce((s, g) => s + g.items.length, 0);
    });
  }

  toggleFiltre(f: { actif: boolean; key: string }): void {
    f.actif = !f.actif;
    if (this.query.length >= 2) this.rechercher(this.query);
  }

  clear(): void {
    this.query = '';
    this.resultatsGroupes = [];
    this.totalResultats = 0;
    this.editingId = null;
  }

  naviguerVers(item: ResultatRecherche): void {
    this.router.navigate(['/dashboard', item.route]);
  }

  naviguerModule(route: string): void {
    this.router.navigate(['/dashboard', route]);
  }

  startEdit(item: ResultatRecherche): void {
    this.editingId = item.id + item.type;
    this.editData = { titre: item.titre, sousTitre: item.sousTitre, detail: item.detail };
  }

  sauvegarder(item: ResultatRecherche): void {
    item.titre     = this.editData['titre']     || item.titre;
    item.sousTitre = this.editData['sousTitre'] || item.sousTitre;
    item.detail    = this.editData['detail']    || item.detail;
    this.editingId = null;
  }

  annulerEdit(): void { this.editingId = null; }
}
