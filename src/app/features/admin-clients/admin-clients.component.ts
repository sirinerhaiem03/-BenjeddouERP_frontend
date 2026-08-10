import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
<div class="clients-page">

  <!-- En-tête -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-icon">
        <svg viewBox="0 0 24 24" fill="none" style="width:28px;height:28px">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="white" stroke-width="2"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <h1 class="page-title">{{ 'ADMIN_CLIENTS.TITLE' | translate }}</h1>
        <p class="page-subtitle">{{ 'ADMIN_CLIENTS.SUBTITLE' | translate }}</p>
      </div>
    </div>
    <div class="header-actions">
      <div class="stat-badge stat-attente" *ngIf="clientsEnAttente > 0">
        <svg viewBox="0 0 16 16" fill="none" style="width:12px;height:12px">
          <circle cx="8" cy="8" r="7" stroke="#fbbf24" stroke-width="1.5"/>
          <path d="M8 5v3l2 2" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        {{ clientsEnAttente }} {{ 'ADMIN_CLIENTS.FILTER_PENDING' | translate }}
      </div>
      <button class="btn-refresh" (click)="charger()" [title]="'ADMIN_CLIENTS.REFRESH' | translate">
        <svg viewBox="0 0 20 20" fill="none" style="width:16px;height:16px">
          <path d="M4 10a6 6 0 0110.39-4M16 10a6 6 0 01-10.39 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M14 6l.39 4M6 14l-.39-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Notif -->
  <div class="notif success" *ngIf="successMsg">
    <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px;flex-shrink:0">
      <circle cx="8" cy="8" r="7" fill="#22c55e"/>
      <path d="M5 8l2 2 4-4" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    {{ successMsg }}
  </div>
  <div class="notif error" *ngIf="errorMsg">
    <svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px;flex-shrink:0">
      <circle cx="8" cy="8" r="7" fill="#ef4444"/>
      <path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
    {{ errorMsg }}
  </div>

  <!-- Chargement -->
  <div class="loading-box" *ngIf="loading">
    <div class="spinner"></div>
    <p>{{ 'COMMON.LOADING' | translate }}</p>
  </div>

  <!-- Tableau -->
  <div class="table-card" *ngIf="!loading">
    <div class="table-empty" *ngIf="clients.length === 0">
      <div class="empty-icon">
        <svg viewBox="0 0 48 48" fill="none" style="width:48px;height:48px">
          <circle cx="24" cy="24" r="20" stroke="#e2e8f0" stroke-width="2"/>
          <path d="M24 16v8M24 32h.01" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p>{{ 'ADMIN_CLIENTS.NO_CLIENTS' | translate }}</p>
      <span>{{ 'ADMIN_CLIENTS.REGISTER_TIP' | translate }}</span>
    </div>

    <table class="clients-table" *ngIf="clients.length > 0">
      <thead>
        <tr>
          <th>Client</th>
          <th>Contact</th>
          <th>Statut KYC</th>
          <th>Documents</th>
          <th>Trial</th>
          <th>Date inscription</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of clients">

          <!-- Identité -->
          <td>
            <div class="client-info">
              <div class="client-avatar">{{ (c.prenom || c.nomUtilisateur)[0].toUpperCase() }}</div>
              <div>
                <span class="client-name">{{ c.prenom }} {{ c.nom }}</span>
                <span class="client-user">{{ '@' + c.nomUtilisateur }}</span>
                <span class="client-societe" *ngIf="c.societe">
                  <svg viewBox="0 0 12 12" fill="none" style="width:10px;height:10px">
                    <rect x="1" y="4" width="10" height="7" rx="1" stroke="#94a3b8" stroke-width="1.2"/>
                    <path d="M4 4V3a2 2 0 014 0v1" stroke="#94a3b8" stroke-width="1.2"/>
                  </svg>
                  {{ c.societe }}
                </span>
              </div>
            </div>
          </td>

          <!-- Contact -->
          <td>
            <span class="client-email">{{ c.email }}</span>
            <span class="client-tel" *ngIf="c.telephone">
              <svg viewBox="0 0 12 12" fill="none" style="width:10px;height:10px">
                <path d="M10.5 8.5l-1.5-1.5-1.5 1-2-2 1-1.5L5 3C3.5 4.5 3 6.5 5 8.5s4 1.5 5.5 0z" stroke="#94a3b8" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
              {{ c.telephone }}
            </span>
          </td>

          <!-- Statut -->
          <td>
            <span class="statut-pill" [ngClass]="getStatutClass(c.statutCompte)">
              <span class="pill-dot"></span>
              {{ getStatutLabel(c.statutCompte) }}
            </span>
          </td>

          <!-- Documents KYC -->
          <td>
            <div class="docs-info" *ngIf="c.kycSoumis; else noKyc">
              <div class="docs-count">
                <span class="doc-badge badge-valide">
                  <svg viewBox="0 0 10 10" fill="none" style="width:8px;height:8px">
                    <path d="M2 5l2 2 4-4" stroke="#15803d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ c.docsValides }} validé(s)
                </span>
                <span class="doc-badge badge-attente" *ngIf="c.docsEnAttente > 0">
                  <svg viewBox="0 0 10 10" fill="none" style="width:8px;height:8px">
                    <circle cx="5" cy="5" r="4" stroke="#a16207" stroke-width="1.2"/>
                    <path d="M5 3v2l1.5 1.5" stroke="#a16207" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                  {{ c.docsEnAttente }} en attente
                </span>
              </div>
              <button class="btn-see-docs" (click)="voirDocuments(c)">
                <svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px">
                  <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.3"/>
                  <circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/>
                </svg>
                Voir docs
              </button>
            </div>
            <ng-template #noKyc>
              <span class="no-docs">Non soumis</span>
            </ng-template>
          </td>

          <!-- Trial -->
          <td>
            <span class="trial-tag active" *ngIf="c.modeTrial">
              <svg viewBox="0 0 10 10" fill="none" style="width:8px;height:8px">
                <path d="M2 5l2 2 4-4" stroke="#15803d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Essai
            </span>
            <span class="trial-tag" *ngIf="!c.modeTrial">—</span>
          </td>

          <!-- Date -->
          <td class="date-cell">{{ formatDate(c.dateCreation) }}</td>

          <!-- Actions -->
          <td>
            <div class="action-group" *ngIf="c.statutCompte === 'EN_ATTENTE'">
              <button class="btn-valider" (click)="validerClient(c, 'VALIDE')">
                <svg viewBox="0 0 14 14" fill="none" style="width:12px;height:12px">
                  <path d="M2.5 7l3 3 6-6" stroke="#15803d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Valider
              </button>
              <button class="btn-refuser" (click)="validerClient(c, 'REFUSE')">
                <svg viewBox="0 0 14 14" fill="none" style="width:12px;height:12px">
                  <path d="M3.5 10.5l7-7M10.5 10.5l-7-7" stroke="#b91c1c" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Refuser
              </button>
            </div>
            <div class="action-group" *ngIf="c.statutCompte === 'VALIDE'">
              <button class="btn-activer" (click)="validerClient(c, 'ACTIF')">
                <svg viewBox="0 0 14 14" fill="none" style="width:12px;height:12px">
                  <path d="M7 2v3M7 9v3M2 7h3M9 7h3" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                Activer
              </button>
            </div>
            <span class="statut-final" *ngIf="c.statutCompte === 'ACTIF'">
              <svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px">
                <circle cx="7" cy="7" r="6" fill="#dcfce7"/>
                <path d="M4 7l2 2 4-4" stroke="#15803d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Compte actif
            </span>
            <span class="statut-final refuse" *ngIf="c.statutCompte === 'REFUSE'">
              <svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px">
                <circle cx="7" cy="7" r="6" fill="#fee2e2"/>
                <path d="M4.5 9.5l5-5M9.5 9.5l-5-5" stroke="#b91c1c" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Refusé
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="table-footer" *ngIf="clients.length > 0">
      <svg viewBox="0 0 16 16" fill="none" style="width:13px;height:13px">
        <path d="M12 13v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="6.5" cy="5" r="2.5" stroke="#94a3b8" stroke-width="1.5"/>
        <path d="M15 13v-1a4 4 0 00-2-3.46" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M11 3.13a3 3 0 010 5.74" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      {{ clients.length }} client(s) inscrit(s)
    </div>
  </div>

  <!-- Modal documents -->
  <div class="modal-backdrop" *ngIf="showDocs" (click)="showDocs = false">
    <div class="modal modal-large" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-header-info">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px">
              <path d="M13 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7z" stroke="#f97316" stroke-width="1.5"/>
              <polyline points="13 2 13 7 18 7" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            <h2>Documents KYC</h2>
          </div>
          <span class="modal-client-name">{{ selectedClient?.prenom }} {{ selectedClient?.nom }} &mdash; {{ '@' + selectedClient?.nomUtilisateur }}</span>
        </div>
        <button class="modal-close" (click)="showDocs = false">✕</button>
      </div>

      <!-- Zone d'aperçu intégré -->
      <div class="doc-preview-panel" *ngIf="previewDoc">
        <div class="preview-bar">
          <div style="display:flex;align-items:center;gap:6px;">
            <svg viewBox="0 0 16 16" fill="none" style="width:13px;height:13px">
              <path d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5z" stroke="#475569" stroke-width="1.3"/>
              <path d="M10 2v3h3" stroke="#475569" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            <span class="preview-label">{{ previewDoc.nomFichier }}</span>
          </div>
          <div class="preview-actions">
            <button class="btn-open"  (click)="ouvrirDoc(previewDoc)">↗ Ouvrir</button>
            <button class="btn-dl"    (click)="telechargerDoc(previewDoc)">⬇ Télécharger</button>
            <button class="btn-close-preview" (click)="previewDoc = null">✕ Fermer</button>
          </div>
        </div>
        <div class="preview-container" [id]="'preview-container-' + previewDoc.id">
          <div class="preview-loading" *ngIf="previewLoading">
            <div class="spinner"></div>
            <span>Chargement...</span>
          </div>
          <div class="preview-content" [innerHTML]="previewHtml"></div>
        </div>
      </div>

      <div class="modal-body">
        <div class="doc-list-empty" *ngIf="documents.length === 0 && !docsLoading">Aucun document soumis.</div>
        <div class="loading-box" *ngIf="docsLoading"><div class="spinner"></div></div>

        <div class="doc-row" *ngFor="let doc of documents" [class.active-preview]="previewDoc?.id === doc.id">
          <div class="doc-row-icon">
            <svg viewBox="0 0 20 20" fill="none" style="width:24px;height:24px">
              <path d="M13 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7z" stroke="#f97316" stroke-width="1.5" fill="rgba(249,115,22,0.08)"/>
              <polyline points="13 2 13 7 18 7" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M8 12h4M8 9h2" stroke="#f97316" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="doc-row-info">
            <span class="doc-row-type">{{ getDocLabel(doc.typeDocument) }}</span>
            <span class="doc-row-file">{{ doc.nomFichier }}</span>
            <span class="doc-row-date">{{ formatDate(doc.dateSoumission) }}</span>
          </div>
          <span class="statut-pill" [ngClass]="getStatutVerifClass(doc.statutVerification)">
            <span class="pill-dot"></span>
            {{ getStatutVerifLabel(doc.statutVerification) }}
          </span>
          <div class="doc-row-actions">
            <button class="btn-preview" (click)="previewDocument(doc)">
              <svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px">
                <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.3"/>
                <circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              Voir
            </button>
            <button class="btn-download" (click)="telechargerDoc(doc)" title="Télécharger">
              <svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px">
                <path d="M7 2v7M4 7l3 4 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>
  `,

  styles: [`
    .clients-page { display: flex; flex-direction: column; gap: 24px; }

    /* ── Header ── */
    .page-header {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 28px 32px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2952 100%);
      border-radius: 20px; position: relative; overflow: hidden;
    }
    .page-header::before {
      content:''; position:absolute; width:280px; height:280px;
      background:rgba(249,115,22,0.07); border-radius:50%;
      right:-50px; top:-100px; pointer-events:none;
    }
    .page-header-left { display:flex; align-items:center; gap:18px; position:relative; z-index:1; }
    .page-icon {
      width:56px; height:56px;
      background:linear-gradient(135deg,#f97316,#ea580c); border-radius:16px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 8px 20px rgba(249,115,22,.35); flex-shrink:0;
    }
    .page-title { font-size:1.4rem; font-weight:800; color:#fff; margin:0 0 4px; letter-spacing:-0.02em; }
    .page-subtitle { font-size:0.8rem; color:#94a3b8; margin:0; }
    .header-actions { display:flex; align-items:center; gap:10px; position:relative; z-index:1; }

    .stat-badge {
      display:flex; align-items:center; gap:6px;
      padding:7px 14px; border-radius:99px; font-size:0.75rem; font-weight:700;
    }
    .stat-attente { background:rgba(251,191,36,.12); color:#fbbf24; border:1px solid rgba(251,191,36,.3); }

    .btn-refresh {
      width:38px; height:38px;
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
      border-radius:10px; display:flex; align-items:center; justify-content:center;
      color:#e2e8f0; cursor:pointer; transition:all .2s;
    }
    .btn-refresh:hover { background:rgba(249,115,22,.2); color:#f97316; transform:rotate(90deg); }

    /* ── Notifs ── */
    .notif {
      padding:12px 18px; border-radius:12px; font-size:.875rem; font-weight:500;
      display:flex; align-items:center; gap:8px;
    }
    .notif.success { background:#d1fae5; color:#065f46; border:1px solid #a7f3d0; }
    .notif.error   { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }

    /* ── Loading ── */
    .loading-box { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:#94a3b8; font-size:.875rem; }
    .spinner { width:32px; height:32px; border:3px solid #e2e8f0; border-top-color:#f97316; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* ── Table card ── */
    .table-card {
      background:#fff; border:1px solid #f1f5f9; border-radius:20px;
      overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.05);
    }
    .table-empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:#94a3b8; text-align:center; }
    .empty-icon { opacity:.5; }

    /* ── Table ── */
    .clients-table { width:100%; border-collapse:collapse; table-layout:fixed; }
    .clients-table th {
      padding:11px 14px; background:#f8fafc; color:#94a3b8;
      font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
      text-align:left; border-bottom:1px solid #f1f5f9;
    }
    .clients-table td { padding:14px 14px; border-bottom:1px solid #f8fafc; vertical-align:middle; }
    .clients-table tr:last-child td { border-bottom:none; }
    .clients-table tbody tr { transition:background .15s; }
    .clients-table tbody tr:hover td { background:#fafbff; }

    /* Largeurs colonnes fixes */
    .clients-table th:nth-child(1), .clients-table td:nth-child(1) { width:19%; }
    .clients-table th:nth-child(2), .clients-table td:nth-child(2) { width:18%; }
    .clients-table th:nth-child(3), .clients-table td:nth-child(3) { width:12%; }
    .clients-table th:nth-child(4), .clients-table td:nth-child(4) { width:17%; }
    .clients-table th:nth-child(5), .clients-table td:nth-child(5) { width:8%;  text-align:center; }
    .clients-table th:nth-child(6), .clients-table td:nth-child(6) { width:14%; }
    .clients-table th:nth-child(7), .clients-table td:nth-child(7) { width:12%; }

    /* ── Cellule client ── */
    .client-info { display:flex; align-items:center; gap:10px; }
    .client-avatar {
      width:38px; height:38px; border-radius:10px;
      background:linear-gradient(135deg,#f97316,#ea580c); color:#fff;
      font-weight:800; font-size:.85rem;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0; box-shadow:0 3px 8px rgba(249,115,22,.25);
    }
    .client-name    { font-weight:700; font-size:.82rem; color:#0f172a; display:block; margin-bottom:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .client-user    { font-size:.67rem; color:#f97316; font-weight:600; display:block; margin-bottom:2px; }
    .client-societe {
      display:inline-flex; align-items:center; gap:3px;
      font-size:.62rem; color:#64748b; background:#f8fafc;
      border:1px solid #e2e8f0; border-radius:5px;
      padding:1px 6px; font-weight:600;
    }
    .client-email  { font-size:.75rem; color:#475569; display:block; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .client-tel    { font-size:.7rem; color:#94a3b8; display:flex; align-items:center; gap:3px; }

    /* ── Statut pills ── */
    .statut-pill {
      display:inline-flex; align-items:center; gap:6px;
      padding:5px 12px; border-radius:99px;
      font-size:.7rem; font-weight:700; white-space:nowrap;
    }
    .pill-dot {
      width:6px; height:6px; border-radius:50%; flex-shrink:0;
    }
    .pill-attente .pill-dot { background:#a16207; }
    .pill-valide  .pill-dot { background:#1d4ed8; }
    .pill-actif   .pill-dot { background:#15803d; }
    .pill-refuse  .pill-dot { background:#b91c1c; }
    .pill-attente { background:#fef9c3; color:#a16207; border:1px solid #fde68a; }
    .pill-valide  { background:#dbeafe; color:#1d4ed8; border:1px solid #bfdbfe; }
    .pill-actif   { background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; }
    .pill-refuse  { background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; }

    /* ── Documents ── */
    .docs-info { display:flex; flex-direction:column; gap:5px; }
    .docs-count { display:flex; flex-direction:row; flex-wrap:wrap; gap:4px; }
    .doc-badge {
      display:inline-flex; align-items:center; gap:4px;
      padding:3px 8px; border-radius:99px; font-size:.62rem; font-weight:700;
      white-space:nowrap;
    }
    .badge-valide  { background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; }
    .badge-attente { background:#fef9c3; color:#a16207; border:1px solid #fde68a; }
    .btn-see-docs {
      display:inline-flex; align-items:center; gap:4px;
      background:none; border:1px solid #e2e8f0; border-radius:6px;
      padding:3px 9px; font-size:.68rem; color:#64748b; cursor:pointer;
      transition:all .2s; font-weight:600; width:fit-content;
    }
    .btn-see-docs:hover { border-color:#f97316; color:#f97316; background:#fff7ed; }
    .no-docs { font-size:.72rem; color:#cbd5e1; font-style:italic; }

    /* ── Trial tag ── */
    .trial-tag {
      display:inline-flex; align-items:center; gap:5px;
      padding:4px 11px; border-radius:99px; font-size:.7rem; font-weight:700;
      background:#f1f5f9; color:#94a3b8;
    }
    .trial-tag.active { background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; }

    /* ── Date ── */
    .date-cell { font-size:.78rem; color:#64748b; white-space:nowrap; }

    /* ── Actions ── */
    .action-group { display:flex; flex-direction:row; gap:5px; flex-wrap:wrap; }
    .btn-valider {
      display:inline-flex; align-items:center; gap:5px;
      padding:6px 11px; border:none; border-radius:8px;
      background:#dcfce7; color:#15803d; font-size:.7rem; font-weight:700;
      cursor:pointer; transition:all .2s; white-space:nowrap;
    }
    .btn-valider:hover { background:#bbf7d0; transform:translateY(-1px); box-shadow:0 3px 10px rgba(34,197,94,.2); }
    .btn-refuser {
      display:inline-flex; align-items:center; gap:5px;
      padding:6px 11px; border:none; border-radius:8px;
      background:#fee2e2; color:#b91c1c; font-size:.7rem; font-weight:700;
      cursor:pointer; transition:all .2s; white-space:nowrap;
    }
    .btn-refuser:hover { background:#fecaca; transform:translateY(-1px); box-shadow:0 3px 10px rgba(239,68,68,.2); }
    .btn-activer {
      display:inline-flex; align-items:center; gap:5px;
      padding:6px 11px; border:none; border-radius:8px;
      background:linear-gradient(135deg,#f97316,#ea580c); color:#fff;
      font-size:.7rem; font-weight:700; cursor:pointer;
      box-shadow:0 3px 10px rgba(249,115,22,.3); transition:all .2s; white-space:nowrap;
    }
    .btn-activer:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(249,115,22,.35); }
    .statut-final {
      display:inline-flex; align-items:center; gap:5px;
      font-size:.72rem; color:#64748b; font-weight:600; white-space:nowrap;
    }
    .statut-final.refuse { color:#b91c1c; }

    /* ── Footer ── */
    .table-footer {
      display:flex; align-items:center; gap:7px;
      padding:13px 18px; font-size:.75rem; color:#94a3b8; font-weight:500;
      border-top:1px solid #f1f5f9; background:#fafafa;
    }

    /* ══ Modal ══ */
    .modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.7); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; }
    .modal {
      background:#fff; border-radius:20px; width:100%; max-width:580px;
      max-height:85vh; display:flex; flex-direction:column;
      box-shadow:0 32px 80px rgba(0,0,0,.25); overflow:hidden;
      animation:modalIn .25s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes modalIn { from { opacity:0; transform:translateY(-20px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; background:#f8fafc; border-bottom:1px solid #f1f5f9; }
    .modal-header h2 { font-size:.95rem; font-weight:800; color:#0f172a; margin:0; }
    .modal-close { width:30px; height:30px; background:#f1f5f9; border:none; border-radius:8px; color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:.9rem; transition:all .2s; }
    .modal-close:hover { background:#fee2e2; color:#dc2626; transform:rotate(90deg); }
    .modal-body { padding:20px 24px; overflow-y:auto; }
    .modal-header-info { display:flex; flex-direction:column; gap:4px; }
    .modal-client-name { font-size:.75rem; color:#64748b; font-weight:500; }

    /* Doc rows */
    .doc-row { display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid #f8fafc; transition:background .15s; }
    .doc-row:last-child { border-bottom:none; }
    .doc-row-icon { flex-shrink:0; }
    .doc-row-info { flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
    .doc-row-type { font-weight:700; font-size:.85rem; color:#0f172a; }
    .doc-row-file { font-size:.72rem; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .doc-row-date { font-size:.68rem; color:#cbd5e1; }
    .doc-list-empty { text-align:center; padding:32px; color:#94a3b8; font-size:.875rem; }

    /* Statuts vérif */
    .sv-attente { background:#fef9c3; color:#a16207; border:1px solid #fde68a; }
    .sv-valide  { background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; }
    .sv-refuse  { background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; }

    .modal-large { max-width: 860px !important; }

    /* Preview */
    .doc-preview-panel { border-bottom:1px solid #f1f5f9; background:#f8fafc; }
    .preview-bar { display:flex; align-items:center; justify-content:space-between; padding:10px 20px; gap:12px; flex-wrap:wrap; }
    .preview-label { font-size:.78rem; font-weight:600; color:#475569; display:flex; align-items:center; gap:5px; }
    .preview-actions { display:flex; align-items:center; gap:8px; }
    .btn-open  { padding:5px 12px; background:#dbeafe; color:#1d4ed8; border:none; border-radius:7px; font-size:.72rem; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-open:hover { background:#bfdbfe; }
    .btn-dl    { padding:5px 12px; background:#dcfce7; color:#15803d; border:none; border-radius:7px; font-size:.72rem; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-dl:hover { background:#bbf7d0; }
    .btn-close-preview { padding:5px 12px; background:#fee2e2; color:#dc2626; border:none; border-radius:7px; font-size:.72rem; font-weight:700; cursor:pointer; transition:all .2s; }
    .btn-close-preview:hover { background:#fecaca; }
    .preview-container { min-height:80px; background:#fff; }
    .preview-loading { display:flex; align-items:center; justify-content:center; gap:12px; padding:32px; color:#94a3b8; font-size:.85rem; }
    .preview-content { display:flex; justify-content:center; align-items:center; }

    .doc-row-actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }

    .btn-preview  {
      display:inline-flex; align-items:center; gap:5px;
      padding:5px 10px; background:#f1f5f9; border:1px solid #e2e8f0;
      border-radius:7px; font-size:.72rem; font-weight:700; color:#475569; cursor:pointer; transition:all .2s;
    }
    .btn-preview:hover { background:#f97316; color:#fff; border-color:#f97316; }
    .btn-download {
      display:inline-flex; align-items:center; justify-content:center;
      width:30px; height:30px; background:#f0fdf4; border:1px solid #bbf7d0;
      border-radius:7px; color:#15803d; cursor:pointer; transition:all .2s;
    }
    .btn-download:hover { background:#dcfce7; }
    .doc-row.active-preview { background:#fff7ed; border-radius:10px; padding-left:10px; padding-right:10px; }
  `]
})
export class AdminClientsComponent implements OnInit {
  // URL relatives → passent par le proxy Angular (proxy.conf.json) → plus de CORS
  private backendUrl = '';                         // chemin relatif : /api/client/kyc/document/1
  private apiUrl     = '/api/admin';

  clients: any[] = [];
  loading = true;
  successMsg = '';
  errorMsg = '';
  clientsEnAttente = 0;

  showDocs = false;
  selectedClient: any = null;
  documents: any[] = [];
  docsLoading = false;

  previewDoc: any = null;      // document en cours de prévisualisation
  previewLoading = false;
  previewHtml = '';            // HTML injecté dans le conteneur

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/clients`).subscribe({
      next: (data: any[]) => {
        this.clients = data;
        this.clientsEnAttente = data.filter(c => c.statutCompte === 'EN_ATTENTE').length;
        this.loading = false;
      },
      error: (_err: any) => { this.loading = false; this.showError('Erreur chargement clients.'); }
    });
  }

  validerClient(client: any, decision: string): void {
    const params = new HttpParams().set('decision', decision);
    this.http.put(`${this.apiUrl}/clients/${client.id}/valider`, null, { params }).subscribe({
      next: (_res: any) => {
        client.statutCompte = decision;
        if (decision === 'VALIDE') client.actif = true;
        if (decision === 'REFUSE') client.actif = false;
        if (decision === 'ACTIF')  { client.actif = true; client.modeTrial = false; }
        this.clientsEnAttente = this.clients.filter(c => c.statutCompte === 'EN_ATTENTE').length;
        this.showSuccess(`Client ${decision.toLowerCase()} avec succès.`);
      },
      error: (_err: any) => this.showError('Erreur lors de la décision.')
    });
  }

  voirDocuments(client: any): void {
    this.selectedClient = client;
    this.documents = [];
    this.previewDoc = null;
    this.previewHtml = '';
    this.showDocs = true;
    this.docsLoading = true;
    this.http.get<any[]>(`${this.apiUrl}/clients/${client.id}/kyc`).subscribe({
      next: (data: any[]) => { this.documents = data; this.docsLoading = false; },
      error: (_err: any) => { this.docsLoading = false; }
    });
  }

  getDocUrl(doc: any): string {
    return `${this.backendUrl}${doc.viewUrl}`;
  }

  /** Token JWT */
  private getAuthHeaders(): HttpHeaders {
    try {
      const stored = localStorage.getItem('currentUser');
      const token  = stored ? JSON.parse(stored)?.token : null;
      if (token) return new HttpHeaders({ Authorization: `Bearer ${token}` });
    } catch { /* */ }
    return new HttpHeaders();
  }

  /** Ouvrir dans un nouvel onglet */
  ouvrirDoc(doc: any): void {
    window.open(this.getDocUrl(doc), '_blank');
  }

  /** Télécharger via HttpClient blob — endpoint permitAll, pas d'auth header */
  telechargerDoc(doc: any): void {
    const url = this.getDocUrl(doc);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        if (blob.size === 0) { window.open(url, '_blank'); return; }
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href     = blobUrl;
        a.download = doc.nomFichier;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      },
      error: () => window.open(url, '_blank')
    });
  }

  /** Prévisualiser — endpoint permitAll, sans header Authorization (évite CORS preflight) */
  previewDocument(doc: any): void {
    this.previewDoc  = doc;
    this.previewHtml = '';
    const url = this.getDocUrl(doc);
    const ext = (doc.nomFichier ?? '').toLowerCase();

    if (ext.endsWith('.pdf')) {
      window.open(url, '_blank');
      this.previewDoc = null;
      return;
    }

    this.previewLoading = true;
    // Pas d'Authorization header → simple GET → pas de preflight CORS
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        this.previewLoading = false;
        if (blob.size === 0) {
          this.previewHtml = this.htmlFichierNonDispo();
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        this.previewHtml = `
          <div style="text-align:center;padding:12px;">
            <img src="${blobUrl}"
              style="max-width:100%;max-height:420px;border-radius:12px;
                     box-shadow:0 4px 20px rgba(0,0,0,0.12);"
              alt="Aperçu">
          </div>`;
      },
      error: (err: any) => {
        this.previewLoading = false;
        const status = err?.status ?? 0;
        if (status === 204 || status === 404) {
          this.previewHtml = this.htmlFichierNonDispo();
        } else {
          this.previewHtml = `
            <div style="text-align:center;padding:28px;">
              <p style="color:#ef4444;font-weight:700;">Erreur HTTP ${status}</p>
              <p style="color:#94a3b8;font-size:.82rem;">
                ${status === 0 ? 'CORS bloqué — vérifiez la config Spring Security.' : 'Vérifiez les logs du backend.'}
              </p>
              <button onclick="window.open('${url}','_blank')"
                style="margin-top:10px;padding:8px 20px;background:#f97316;color:#fff;
                       border:none;border-radius:8px;cursor:pointer;font-weight:700;">
                Ouvrir dans un onglet ↗
              </button>
            </div>`;
        }
      }
    });
  }


  private htmlFichierNonDispo(): string {
    return `
      <div style="text-align:center;padding:32px;background:#fffbeb;border-radius:12px;margin:12px;">
        <div style="font-size:2.5rem;">⚠️</div>
        <p style="color:#92400e;font-weight:700;margin:8px 0 4px;">Fichier non disponible</p>
        <p style="color:#b45309;font-size:.82rem;margin:0;">
          Ce document a été soumis avant la migration BLOB.<br>
          Demandez au client de le soumettre à nouveau.
        </p>
      </div>`;
  }



  getStatutClass(s: string): string {
    const map: any = { EN_ATTENTE: 'pill-attente', VALIDE: 'pill-valide', ACTIF: 'pill-actif', REFUSE: 'pill-refuse' };
    return map[s] || 'pill-attente';
  }
  getStatutLabel(s: string): string {
    const map: any = { EN_ATTENTE: 'En attente', VALIDE: 'Validé', ACTIF: 'Actif', REFUSE: 'Refusé' };
    return map[s] || s;
  }
  /** Valider/Refuser un document KYC individuel */
  validerDocument(doc: any, decision: string): void {
    const params = new HttpParams().set('decision', decision);
    this.http.put<any>(`${this.apiUrl}/documents/${doc.id}/valider`, null, { params }).subscribe({
      next: (res) => {
        doc.statutVerification = decision;
        // Mettre à jour les compteurs sur le client sélectionné
        if (this.selectedClient) {
          this.selectedClient.docsValides   = res.docsValides;
          this.selectedClient.docsEnAttente = res.docsEnAttente;
          // Mettre à jour dans la liste principale
          const found = this.clients.find(c => c.id === this.selectedClient.id);
          if (found) {
            found.docsValides   = res.docsValides;
            found.docsEnAttente = res.docsEnAttente;
          }
        }
        this.showSuccess(`Document ${decision.toLowerCase()} avec succès.`);
      },
      error: () => this.showError('Erreur lors de la validation du document.')
    });
  }

  getStatutVerifClass(s: string): string {
    const map: any = { EN_ATTENTE: 'statut-pill sv-attente', VALIDE: 'statut-pill sv-valide', REFUSE: 'statut-pill sv-refuse' };
    return map[s] || 'statut-pill sv-attente';
  }

  getStatutVerifLabel(s: string): string {
    const map: any = { EN_ATTENTE: 'En attente', VALIDE: 'Validé', REFUSE: 'Refusé' };
    return map[s] || s;
  }
  getDocIcon(t: string): string {
    const map: any = { CNI: '🪪', PASSEPORT: '📘', REGISTRE_COMMERCE: '🏢', PATENTE: '📜', JUSTIFICATIF: '🏠' };
    return map[t] || '📄';
  }
  getDocLabel(t: string): string {
    const map: any = { CNI: 'Carte Nationale d\'Identité', PASSEPORT: 'Passeport', REGISTRE_COMMERCE: 'Registre du Commerce', PATENTE: 'Patente Fiscale', JUSTIFICATIF: 'Justificatif de domicile' };
    return map[t] || t;
  }
  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR') + ' à ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  private showSuccess(m: string): void { this.successMsg = m; setTimeout(() => this.successMsg = '', 4000); }
  private showError(m: string):   void { this.errorMsg   = m; setTimeout(() => this.errorMsg   = '', 4000); }
}
