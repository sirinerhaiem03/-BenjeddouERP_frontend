import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditLog } from './audit.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="audit-container">

  <!-- ══ HERO ══ -->
  <div class="audit-hero">
    <div class="audit-hero-glow"></div>
    <div class="audit-hero-content">
      <div class="audit-hero-icon">
        <span class="material-symbols-outlined">security</span>
      </div>
      <div>
        <div class="audit-hero-badge">
          <span class="material-symbols-outlined">shield</span>
          {{ 'AUDIT.SECURITY_BADGE' | translate }}
        </div>
        <h1>{{ 'AUDIT.TITLE' | translate }}</h1>
        <p>{{ 'AUDIT.SUBTITLE' | translate }}</p>
      </div>
    </div>

    <!-- KPIs -->
    <div class="audit-kpis">
      <div class="audit-kpi">
        <div class="kpi-num">{{ stats?.totalLogs || 0 }}</div>
        <div class="kpi-label">{{ 'AUDIT.KPI.TOTAL_LOGS' | translate }}</div>
      </div>
      <div class="audit-kpi audit-kpi-danger">
        <div class="kpi-num">{{ stats?.logsCritiques || 0 }}</div>
        <div class="kpi-label">{{ 'AUDIT.KPI.CRITICAL_EVENTS' | translate }}</div>
      </div>
      <div class="audit-kpi audit-kpi-warn">
        <div class="kpi-num">{{ getCount('LOGIN_ECHEC') }}</div>
        <div class="kpi-label">{{ 'AUDIT.KPI.LOGIN_FAILURES' | translate }}</div>
      </div>
      <div class="audit-kpi audit-kpi-block">
        <div class="kpi-num">{{ getCount('RATE_LIMIT_BLOQUE') }}</div>
        <div class="kpi-label">{{ 'AUDIT.KPI.BLOCKED_IPS' | translate }}</div>
      </div>
    </div>
  </div>

  <!-- ══ TABS ══ -->
  <div class="audit-tabs">
    <button class="audit-tab" [class.active]="onglet === 'logs'" (click)="onglet='logs'">
      <span class="material-symbols-outlined">list_alt</span>
      {{ 'AUDIT.TABS.ALL_LOGS' | translate }}
    </button>
    <button class="audit-tab" [class.active]="onglet === 'critiques'" (click)="onglet='critiques'; loadCritiques()">
      <span class="material-symbols-outlined">warning</span>
      {{ 'AUDIT.TABS.CRITICAL' | translate }}
      <span class="audit-badge-danger" *ngIf="(stats?.logsCritiques || 0) > 0">{{ stats?.logsCritiques }}</span>
    </button>
  </div>

  <!-- ══ ONGLET TOUS LES LOGS ══ -->
  <div class="audit-panel" *ngIf="onglet === 'logs'">

    <!-- Filtres -->
    <div class="audit-filters">
      <div class="audit-search">
        <span class="material-symbols-outlined">search</span>
        <input type="text" [(ngModel)]="q" (ngModelChange)="onSearch()"
          [placeholder]="'AUDIT.FILTERS.SEARCH_PH' | translate" class="audit-search-input">
      </div>
      <select [(ngModel)]="filtreAction" (ngModelChange)="loadLogs()" class="audit-select">
        <option value="">{{ 'AUDIT.FILTERS.ALL_ACTIONS' | translate }}</option>
        <optgroup [label]="'AUDIT.FILTERS.GROUP_AUTH' | translate">
          <option value="LOGIN_SUCCESS">✅ {{ 'AUDIT.ACTIONS.LOGIN_SUCCESS' | translate }}</option>
          <option value="LOGIN_ECHEC">❌ {{ 'AUDIT.ACTIONS.LOGIN_ECHEC' | translate }}</option>
          <option value="RATE_LIMIT_BLOQUE">🚫 {{ 'AUDIT.ACTIONS.RATE_LIMIT_BLOQUE' | translate }}</option>
          <option value="LOGOUT">🔒 {{ 'AUDIT.ACTIONS.LOGOUT' | translate }}</option>
        </optgroup>
        <optgroup [label]="'AUDIT.FILTERS.GROUP_USERS' | translate">
          <option value="UTILISATEUR_CREE">👤 {{ 'AUDIT.ACTIONS.UTILISATEUR_CREE' | translate }}</option>
          <option value="UTILISATEUR_MODIFIE">✏️ {{ 'AUDIT.ACTIONS.UTILISATEUR_MODIFIE' | translate }}</option>
          <option value="ROLE_MODIFIE">🎭 {{ 'AUDIT.ACTIONS.ROLE_MODIFIE' | translate }}</option>
          <option value="TRIAL_RESET">🔄 {{ 'AUDIT.ACTIONS.TRIAL_RESET' | translate }}</option>
        </optgroup>
        <optgroup [label]="'AUDIT.FILTERS.GROUP_CALC' | translate">
          <option value="CALCUL_TAUX_UNIQUE">📐 {{ 'AUDIT.ACTIONS.CALCUL_TAUX_UNIQUE' | translate }}</option>
          <option value="CALCUL_TAUX_VARIABLE">📊 {{ 'AUDIT.ACTIONS.CALCUL_TAUX_VARIABLE' | translate }}</option>
        </optgroup>
      </select>
      <button class="audit-btn-reset" (click)="resetFiltres()">
        <span class="material-symbols-outlined">refresh</span>
        {{ 'AUDIT.FILTERS.RESET' | translate }}
      </button>
    </div>

    <!-- Spinner -->
    <div class="audit-spinner" *ngIf="loading">
      <span class="material-symbols-outlined spin">autorenew</span>
      {{ 'AUDIT.STATES.LOADING' | translate }}
    </div>

    <!-- Table -->
    <div class="audit-table-wrap" *ngIf="!loading && logs.length > 0">
      <table class="audit-table">
        <thead>
          <tr>
            <th>{{ 'AUDIT.TABLE.DATETIME' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.ACTION' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.RESULT' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.USER' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.IP' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.MODULE' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.DETAILS' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of logs" [class]="getRowClass(log)">
            <td class="audit-td-date">
              <div class="audit-date">{{ formatDate(log.createdAt) }}</div>
              <div class="audit-time">{{ formatTime(log.createdAt) }}</div>
            </td>
            <td>
              <span class="audit-action-badge" [class]="getActionClass(log.action)">
                {{ getActionIcon(log.action) }} {{ formatAction(log.action) }}
              </span>
            </td>
            <td>
              <span class="audit-resultat" [class]="getResultatClass(log.resultat)">
                {{ formatResultat(log.resultat) }}
              </span>
            </td>
            <td class="audit-td-user">
              <div class="audit-user" *ngIf="log.nomUtilisateur">
                <span class="material-symbols-outlined audit-user-icon">person</span>
                {{ log.nomUtilisateur }}
              </div>
              <span class="audit-anon" *ngIf="!log.nomUtilisateur">—</span>
            </td>
            <td>
              <span class="audit-ip" [class.audit-ip-suspect]="log.resultat === 'BLOQUE'">
                {{ log.adresseIp || '—' }}
              </span>
            </td>
            <td>
              <span class="audit-module" *ngIf="log.module">{{ log.module }}</span>
              <span *ngIf="!log.module">—</span>
            </td>
            <td class="audit-td-details">
              <div class="audit-details-text" [title]="log.details || ''">
                {{ log.details || '—' }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty -->
    <div class="audit-empty" *ngIf="!loading && logs.length === 0">
      <span class="material-symbols-outlined">search_off</span>
      <p>{{ 'AUDIT.STATES.NO_LOGS' | translate }}</p>
    </div>

    <!-- Pagination -->
    <div class="audit-pagination" *ngIf="totalPages > 1">
      <button class="audit-page-btn" [disabled]="currentPage === 0" (click)="changerPage(0)">«</button>
      <button class="audit-page-btn" [disabled]="currentPage === 0" (click)="changerPage(currentPage - 1)">‹</button>
      <span class="audit-page-info">{{ 'AUDIT.PAGINATION.PAGE' | translate }} {{ currentPage + 1 }} {{ 'AUDIT.PAGINATION.OF' | translate }} {{ totalPages }}</span>
      <button class="audit-page-btn" [disabled]="currentPage >= totalPages - 1" (click)="changerPage(currentPage + 1)">›</button>
      <button class="audit-page-btn" [disabled]="currentPage >= totalPages - 1" (click)="changerPage(totalPages - 1)">»</button>
      <span class="audit-total">{{ totalElements }} {{ 'AUDIT.PAGINATION.ENTRIES' | translate }}</span>
    </div>
  </div>

  <!-- ══ ONGLET ÉVÉNEMENTS CRITIQUES ══ -->
  <div class="audit-panel" *ngIf="onglet === 'critiques'">
    <div class="audit-critiques-header">
      <span class="material-symbols-outlined">warning</span>
      {{ 'AUDIT.STATES.CRITICAL_HEADER' | translate }}
    </div>

    <div class="audit-spinner" *ngIf="loadingCritiques">
      <span class="material-symbols-outlined spin">autorenew</span>
    </div>

    <div class="audit-table-wrap" *ngIf="!loadingCritiques && logsCritiques.length > 0">
      <table class="audit-table">
        <thead>
          <tr>
            <th>{{ 'AUDIT.TABLE.DATETIME' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.ACTION' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.RESULT' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.USER_TARGET' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.IP_SOURCE' | translate }}</th>
            <th>{{ 'AUDIT.TABLE.DETAILS' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of logsCritiques" [class]="getRowClass(log)">
            <td class="audit-td-date">
              <div class="audit-date">{{ formatDate(log.createdAt) }}</div>
              <div class="audit-time">{{ formatTime(log.createdAt) }}</div>
            </td>
            <td>
              <span class="audit-action-badge" [class]="getActionClass(log.action)">
                {{ getActionIcon(log.action) }} {{ formatAction(log.action) }}
              </span>
            </td>
            <td>
              <span class="audit-resultat" [class]="getResultatClass(log.resultat)">
                {{ formatResultat(log.resultat) }}
              </span>
            </td>
            <td>{{ log.nomUtilisateur || '—' }}</td>
            <td>
              <span class="audit-ip audit-ip-suspect">{{ log.adresseIp || '—' }}</span>
            </td>
            <td class="audit-td-details">{{ log.details || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="audit-empty" *ngIf="!loadingCritiques && logsCritiques.length === 0">
      <span class="material-symbols-outlined" style="color:#22c55e">check_circle</span>
      <p style="color:#22c55e">{{ 'AUDIT.STATES.NO_CRITICAL' | translate }}</p>
    </div>
  </div>

</div>
  `,
  styleUrls: ['./audit.component.css']
})
export class AuditComponent implements OnInit {

  onglet: 'logs' | 'critiques' = 'logs';

  // Logs principaux
  logs: AuditLog[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  loading = false;
  q = '';
  filtreAction = '';
  private searchTimer: any;

  // Logs critiques
  logsCritiques: AuditLog[] = [];
  loadingCritiques = false;

  // Stats
  stats: any = null;

  constructor(private auditService: AuditService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadLogs();
    this.loadStats();
  }

  loadLogs(): void {
    this.loading = true;
    this.auditService.getLogs(this.currentPage, 20, this.q || undefined, this.filtreAction || undefined)
      .subscribe({
        next: res => {
          this.logs = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          this.currentPage = res.currentPage;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  loadCritiques(): void {
    this.loadingCritiques = true;
    this.auditService.getLogsCritiques().subscribe({
      next: logs => { this.logsCritiques = logs; this.loadingCritiques = false; },
      error: () => { this.loadingCritiques = false; }
    });
  }

  loadStats(): void {
    this.auditService.getStats(24).subscribe(s => this.stats = s);
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadLogs();
    }, 300);
  }

  changerPage(page: number): void {
    this.currentPage = page;
    this.loadLogs();
  }

  resetFiltres(): void {
    this.q = '';
    this.filtreAction = '';
    this.currentPage = 0;
    this.loadLogs();
  }

  getCount(action: string): number {
    if (!this.stats?.statsParAction) return 0;
    const found = this.stats.statsParAction.find((s: any) => s.action === action);
    return found ? found.count : 0;
  }

  // ── Formatage ───────────────────────────────────────────────────────────

  formatDate(dt: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('fr-TN');
  }

  formatTime(dt: string): string {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatAction(action: string): string {
    const key = 'AUDIT.ACTIONS.' + action;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : action;
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      LOGIN_SUCCESS: '✅', LOGIN_ECHEC: '❌', LOGOUT: '🔒',
      RATE_LIMIT_BLOQUE: '🚫', TOKEN_REFRESH: '🔄',
      UTILISATEUR_CREE: '👤', UTILISATEUR_MODIFIE: '✏️',
      ROLE_MODIFIE: '🎭', TRIAL_RESET: '⏱️',
      CALCUL_TAUX_UNIQUE: '📐', CALCUL_TAUX_VARIABLE: '📊',
      DOCUMENT_EXPORTE: '📄', SESSION_REVOQUEE: '⛔', COMPTE_BLOQUE: '🔐',
    };
    return icons[action] || '📋';
  }

  getActionClass(action: string): string {
    if (['LOGIN_ECHEC', 'RATE_LIMIT_BLOQUE', 'COMPTE_BLOQUE', 'SESSION_REVOQUEE'].includes(action))
      return 'action-danger';
    if (action === 'LOGIN_SUCCESS') return 'action-success';
    if (action === 'LOGOUT' || action === 'TOKEN_REFRESH') return 'action-neutral';
    if (action.startsWith('UTILISATEUR') || action.startsWith('ROLE')) return 'action-admin';
    if (action.startsWith('CALCUL')) return 'action-calcul';
    return 'action-default';
  }

  formatResultat(resultat: string): string {
    const key = 'AUDIT.RESULTS.' + resultat;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : resultat;
  }

  getResultatClass(resultat: string): string {
    return { SUCCES: 'res-succes', ECHEC: 'res-echec', BLOQUE: 'res-bloque' }[resultat] || '';
  }

  getRowClass(log: AuditLog): string {
    if (log.resultat === 'BLOQUE') return 'row-bloque';
    if (log.resultat === 'ECHEC')  return 'row-echec';
    return '';
  }
}
