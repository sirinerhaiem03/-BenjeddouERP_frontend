import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface TableInfo { nom: string; lignes: number | string; }
interface BackupInfo { fichier: string; tailleKo: number; dateCreation: string; }
interface BaseInfo { succes: boolean; schema: string; nbTables: number; tables: TableInfo[]; horodatage: string; }

@Component({
  selector: 'app-db-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="db-page">

  <!-- ══════════════════════════════════════════════════════
       HEADER
  ══════════════════════════════════════════════════════ -->
  <div class="db-page-header">
    <div class="db-header-left">
      <div class="db-header-icon">
        <span class="material-symbols-outlined">storage</span>
      </div>
      <div>
        <h1 class="db-page-title">Gestion des Bases de Données</h1>
        <p class="db-page-subtitle">Export · Import · Sauvegarde · Restauration · Suppression contrôlée</p>
      </div>
    </div>
    <div class="db-role-badge" [class.superadmin]="isSuperAdmin">
      <span class="material-symbols-outlined">{{ isSuperAdmin ? 'verified' : 'badge' }}</span>
      <span>{{ isSuperAdmin ? 'Super Admin' : 'Administrateur' }}</span>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       SÉLECTEUR DE BASE
  ══════════════════════════════════════════════════════ -->
  <div class="db-section-card">
    <div class="db-section-label">
      <span class="material-symbols-outlined">dns</span>
      Base de données cible
    </div>
    <div class="db-schema-tabs">
      <button *ngFor="let s of schemasDisponibles"
              class="db-schema-tab"
              [class.active]="schemaSelectionne === s.value"
              (click)="selectionnerSchema(s.value)">
        <span class="material-symbols-outlined">{{ s.value === 'master' ? 'hub' : 'apartment' }}</span>
        <span class="db-schema-name">{{ s.label }}</span>
        <span class="db-schema-badge" [class.master]="s.value === 'master'">{{ s.type }}</span>
      </button>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       INFOS BASE
  ══════════════════════════════════════════════════════ -->
  <div class="db-section-card db-info-card" *ngIf="baseInfo">
    <div class="db-info-header">
      <div class="db-info-title">
        <span class="material-symbols-outlined">table_chart</span>
        <span>{{ baseInfo.schema }}</span>
      </div>
      <span class="db-info-badge">
        <span class="material-symbols-outlined">grid_view</span>
        {{ baseInfo.nbTables }} tables
      </span>
    </div>
    <div class="db-tables-grid">
      <div class="db-table-item" *ngFor="let t of baseInfo.tables">
        <span class="material-symbols-outlined db-table-icon">table_rows</span>
        <span class="db-table-name">{{ t.nom }}</span>
        <span class="db-table-count">{{ t.lignes }}</span>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       STATS CHIPS
  ══════════════════════════════════════════════════════ -->
  <div class="db-chips-row">
    <div class="db-chip db-chip-export">
      <span class="material-symbols-outlined">upload_file</span>
      Export SQL disponible
    </div>
    <div class="db-chip db-chip-import">
      <span class="material-symbols-outlined">download</span>
      Import par glisser-déposer
    </div>
    <div class="db-chip db-chip-backup">
      <span class="material-symbols-outlined">backup</span>
      Sauvegarde horodatée
    </div>
    <div class="db-chip db-chip-secure">
      <span class="material-symbols-outlined">lock</span>
      Token de sécurité requis
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       ACTIONS
  ══════════════════════════════════════════════════════ -->
  <div class="db-actions-grid">

    <!-- EXPORT SQL -->
    <div class="db-action-card db-card-export">
      <div class="db-action-top">
        <div class="db-action-icon db-icon-export">
          <span class="material-symbols-outlined">upload_file</span>
        </div>
        <div class="db-action-info">
          <h3>Exporter la base</h3>
          <p>Télécharge un dump SQL complet avec structure et données</p>
        </div>
      </div>
      <button class="db-btn db-btn-export" (click)="exporterSQL()" [disabled]="loading">
        <span class="material-symbols-outlined">{{ loading ? 'hourglass_empty' : 'download' }}</span>
        {{ loading ? 'Génération...' : 'Télécharger .sql' }}
      </button>
    </div>

    <!-- IMPORT SQL -->
    <div class="db-action-card db-card-import">
      <div class="db-action-top">
        <div class="db-action-icon db-icon-import">
          <span class="material-symbols-outlined">upload</span>
        </div>
        <div class="db-action-info">
          <h3>Importer un fichier SQL</h3>
          <p>Exécute un script SQL dans la base sélectionnée</p>
        </div>
      </div>
      <div class="db-drop-zone" (click)="fileInput.click()"
           (dragover)="$event.preventDefault()"
           (drop)="onFileDrop($event)"
           [class.has-file]="fichierSelectionne">
        <input #fileInput type="file" accept=".sql" style="display:none" (change)="onFileSelect($event)">
        <span class="material-symbols-outlined db-drop-icon">{{ fichierSelectionne ? 'check_circle' : 'cloud_upload' }}</span>
        <span class="db-drop-text">
          {{ fichierSelectionne ? fichierSelectionne.name : 'Cliquez ou déposez un fichier .sql' }}
        </span>
      </div>
      <div class="db-destructive-toggle" *ngIf="isSuperAdmin">
        <label class="db-toggle-label">
          <input type="checkbox" [(ngModel)]="allowDestructive" class="db-checkbox">
          <span class="material-symbols-outlined" style="font-size:16px;color:#d97706">warning</span>
          <span>Autoriser DROP / TRUNCATE</span>
        </label>
      </div>
      <button class="db-btn db-btn-import" (click)="importerSQL()" [disabled]="!fichierSelectionne || loading">
        <span class="material-symbols-outlined">upload</span>
        Importer le fichier SQL
      </button>
    </div>

    <!-- SAUVEGARDE -->
    <div class="db-action-card db-card-backup">
      <div class="db-action-top">
        <div class="db-action-icon db-icon-backup">
          <span class="material-symbols-outlined">backup</span>
        </div>
        <div class="db-action-info">
          <h3>Créer une sauvegarde</h3>
          <p>Génère un fichier .sql horodaté dans le dossier de sauvegardes</p>
        </div>
      </div>
      <div class="db-backup-info-row">
        <span class="material-symbols-outlined">schedule</span>
        <span>Sauvegarde automatique chaque nuit à 02h00</span>
      </div>
      <button class="db-btn db-btn-backup" (click)="sauvegarder()" [disabled]="loading">
        <span class="material-symbols-outlined">save</span>
        Sauvegarder maintenant
      </button>
    </div>

    <!-- SUPPRESSION CONTRÔLÉE — SuperAdmin only -->
    <div class="db-action-card db-card-danger" *ngIf="isSuperAdmin && schemaSelectionne !== 'master'">
      <div class="db-action-top">
        <div class="db-action-icon db-icon-danger">
          <span class="material-symbols-outlined">delete_sweep</span>
        </div>
        <div class="db-action-info">
          <h3>Vider les données</h3>
          <p>Supprime toutes les données sans supprimer la structure des tables</p>
        </div>
      </div>
      <div class="db-danger-alert">
        <span class="material-symbols-outlined">report</span>
        <span>Action irréversible — sauvegardez d'abord !</span>
      </div>
      <button class="db-btn db-btn-danger" (click)="demanderTokenVidage()" [disabled]="loading">
        <span class="material-symbols-outlined">delete_sweep</span>
        Vider (confirmation requise)
      </button>
    </div>

  </div>

  <!-- ══════════════════════════════════════════════════════
       SAUVEGARDES DISPONIBLES
  ══════════════════════════════════════════════════════ -->
  <div class="db-section-card">
    <div class="db-list-header">
      <div class="db-list-title">
        <span class="material-symbols-outlined">folder_open</span>
        Sauvegardes disponibles
      </div>
      <button class="db-btn-refresh" (click)="chargerSauvegardes()">
        <span class="material-symbols-outlined">refresh</span>
        Actualiser
      </button>
    </div>

    <div class="db-empty" *ngIf="sauvegardes.length === 0">
      <span class="material-symbols-outlined">folder_off</span>
      <span class="db-empty-title">Aucune sauvegarde disponible.</span>
      <span class="db-empty-hint">Cliquez sur "Sauvegarder maintenant" pour créer votre première sauvegarde.</span>
    </div>

    <div class="db-backup-list" *ngIf="sauvegardes.length > 0">
      <div class="db-backup-row" *ngFor="let s of sauvegardes">
        <div class="db-backup-file-icon">
          <span class="material-symbols-outlined">description</span>
        </div>
        <div class="db-backup-details">
          <span class="db-backup-filename">{{ s.fichier }}</span>
          <span class="db-backup-meta">
            <span class="material-symbols-outlined" style="font-size:13px">sd_storage</span>
            {{ s.tailleKo }} Ko
            <span class="material-symbols-outlined" style="font-size:13px;margin-left:8px">schedule</span>
            {{ s.dateCreation | date:'dd/MM/yyyy HH:mm' }}
          </span>
        </div>
        <button class="db-btn-restore" (click)="demanderTokenRestauration(s.fichier)" [disabled]="loading">
          <span class="material-symbols-outlined">restore</span>
          Restaurer
        </button>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       MODALE DE CONFIRMATION
  ══════════════════════════════════════════════════════ -->
  <div class="db-modal-overlay" *ngIf="modaleVisible" (click)="fermerModale()">
    <div class="db-modal" (click)="$event.stopPropagation()">

      <div class="db-modal-header" [class.danger]="modaleOperation === 'vidage'">
        <span class="material-symbols-outlined">{{ modaleOperation === 'vidage' ? 'delete_sweep' : 'restore' }}</span>
        <span>{{ modaleOperation === 'vidage' ? 'Confirmation — Vidage des données' : 'Confirmation — Restauration' }}</span>
      </div>

      <div class="db-modal-body">
        <p *ngIf="modaleOperation === 'restauration'">
          Voulez-vous restaurer la base <strong>{{ schemaSelectionne }}</strong>
          depuis le fichier <strong>{{ fichierRestauration }}</strong> ?
        </p>
        <p *ngIf="modaleOperation === 'vidage'">
          Voulez-vous vider <strong>toutes les données</strong> de la base
          <strong>{{ schemaSelectionne }}</strong> ?
          <br><br>
          <span class="db-modal-warning">
            <span class="material-symbols-outlined">warning</span>
            Cette action est irréversible. Assurez-vous d'avoir une sauvegarde valide.
          </span>
        </p>

        <div class="db-token-box" *ngIf="tokenConfirmation">
          <div class="db-token-label">
            <span class="material-symbols-outlined">key</span>
            Token de sécurité (usage unique)
          </div>
          <code class="db-token-value">{{ tokenConfirmation }}</code>
        </div>
      </div>

      <div class="db-modal-actions">
        <button class="db-btn-modal-cancel" (click)="fermerModale()">
          <span class="material-symbols-outlined">close</span>
          Annuler
        </button>
        <button class="db-btn-modal-confirm" [class.danger]="modaleOperation === 'vidage'"
                (click)="confirmerOperation()" [disabled]="loading || !tokenConfirmation">
          <span class="material-symbols-outlined">check_circle</span>
          Confirmer l'opération
        </button>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════
       TOAST
  ══════════════════════════════════════════════════════ -->
  <div class="db-toast" *ngIf="toastMessage" [class]="'db-toast-' + toastType">
    <span class="material-symbols-outlined">
      {{ toastType === 'success' ? 'check_circle' : toastType === 'error' ? 'error' : toastType === 'warning' ? 'warning' : 'info' }}
    </span>
    {{ toastMessage }}
  </div>

</div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════
       GESTION BASE DE DONNÉES — Design Clair & Cartes Blanches
    ═══════════════════════════════════════════════════ */

    .db-page {
      padding: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* ── HEADER ──────────────────────────────────────── */
    .db-page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
    }
    .db-header-left { display: flex; align-items: center; gap: 14px; }
    .db-header-icon {
      width: 48px; height: 48px;
      background: #f3e8ff;
      border: 1px solid #e9d5ff;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: #7c3aed;
    }
    .db-header-icon .material-symbols-outlined { font-size: 26px; }
    .db-page-title {
      font-size: 22px; font-weight: 800;
      color: #1e1b4b; margin: 0;
    }
    .db-page-subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0; }

    .db-role-badge {
      display: flex; align-items: center; gap: 7px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #475569;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      border-radius: 20px; padding: 8px 16px;
      font-size: 13px; font-weight: 600;
    }
    .db-role-badge.superadmin {
      background: #fef3c7;
      border-color: #fde68a;
      color: #d97706;
    }
    .db-role-badge .material-symbols-outlined { font-size: 16px; }

    /* ── CARDS BLANCHES ───────────────────────────────── */
    .db-section-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    }

    /* ── SECTION LABEL ───────────────────────────────── */
    .db-section-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 700;
      color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 14px;
    }
    .db-section-label .material-symbols-outlined { font-size: 16px; color: #7c3aed; }

    /* ── SCHEMA TABS ─────────────────────────────────── */
    .db-schema-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
    .db-schema-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #475569;
      font-size: 13px; font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .db-schema-tab:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #1e293b;
    }
    .db-schema-tab.active {
      background: #7c3aed;
      border-color: #6d28d9;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
    }
    .db-schema-tab .material-symbols-outlined { font-size: 18px; }
    .db-schema-name { flex: 1; }
    .db-schema-badge {
      font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 20px;
      background: #f1f5f9;
      color: #64748b;
    }
    .db-schema-tab.active .db-schema-badge {
      background: rgba(255,255,255,0.2);
      color: #ffffff;
    }
    .db-schema-badge.master { background: #fee2e2; color: #991b1b; }

    /* ── INFO BASE ───────────────────────────────────── */
    .db-info-card { border-left: 4px solid #7c3aed !important; }
    .db-info-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .db-info-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 700; color: #0f172a;
    }
    .db-info-title .material-symbols-outlined { font-size: 20px; color: #7c3aed; }
    .db-info-badge {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 700;
      padding: 4px 12px; border-radius: 20px;
      background: #f3e8ff;
      border: 1px solid #e9d5ff;
      color: #6d28d9;
    }
    .db-info-badge .material-symbols-outlined { font-size: 14px; }

    .db-tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    .db-table-item {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .db-table-item:hover { background: #f1f5f9; }
    .db-table-icon { font-size: 16px; color: #7c3aed; }
    .db-table-name { flex: 1; font-size: 12px; font-weight: 600; color: #1e293b; font-family: monospace; }
    .db-table-count {
      font-size: 11px; font-weight: 700;
      color: #166534;
      background: #dcfce7;
      border: 1px solid #bbf7d0;
      padding: 2px 7px; border-radius: 4px;
    }

    /* ── CHIPS ROW ───────────────────────────────────── */
    .db-chips-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .db-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
      background: #f5f3ff; border: 1px solid #ddd6fe; color: #6d28d9;
    }
    .db-chip .material-symbols-outlined { font-size: 15px; color: #7c3aed; }

    /* ── ACTIONS GRID ────────────────────────────────── */
    .db-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .db-action-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .db-action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.12);
      border-color: #c4b5fd;
    }
    .db-card-danger { border-color: #fecaca !important; background: #fff5f5 !important; }
    .db-card-danger:hover { border-color: #ef4444 !important; }

    .db-action-top { display: flex; align-items: flex-start; gap: 14px; }

    .db-action-icon {
      width: 44px; height: 44px; flex-shrink: 0;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: #f3e8ff; border: 1px solid #e9d5ff; color: #7c3aed;
    }
    .db-action-icon .material-symbols-outlined { font-size: 22px; }
    .db-icon-danger { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

    .db-action-info h3 { margin: 0; font-size: 15px; font-weight: 700; color: #0f172a; }
    .db-action-info p  { margin: 4px 0 0; font-size: 12px; color: #64748b; line-height: 1.5; }

    /* ── BOUTONS (Tous en VIOLET) ────────────────────── */
    .db-btn {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      padding: 11px 18px;
      border-radius: 10px;
      font-size: 13px; font-weight: 700;
      border: none; cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
      background: #7c3aed;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(124, 58, 237, 0.25);
    }
    .db-btn:hover:not(:disabled) {
      background: #6d28d9;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
    }
    .db-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
    .db-btn .material-symbols-outlined { font-size: 18px; }

    .db-btn-danger { background: #dc2626; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25); }
    .db-btn-danger:hover:not(:disabled) { background: #b91c1c; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35); }

    /* ── DROP ZONE ───────────────────────────────────── */
    .db-drop-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
      padding: 20px 16px;
      text-align: center;
      cursor: pointer;
      color: #64748b;
      font-size: 13px;
      transition: all 0.2s ease;
      background: #f8fafc;
    }
    .db-drop-zone:hover { border-color: #7c3aed; background: #f5f3ff; color: #7c3aed; }
    .db-drop-zone.has-file { border-color: #10b981; color: #047857; background: #ecfdf5; }
    .db-drop-icon { font-size: 28px; display: block; margin-bottom: 6px; }
    .db-drop-text { font-weight: 500; }

    .db-destructive-toggle { display: flex; align-items: center; }
    .db-toggle-label {
      display: flex; align-items: center; gap: 6px;
      cursor: pointer; font-size: 12px;
      color: #b45309; font-weight: 600;
    }
    .db-checkbox { accent-color: #d97706; }

    .db-backup-info-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #64748b;
    }
    .db-backup-info-row .material-symbols-outlined { font-size: 15px; color: #7c3aed; }

    .db-danger-alert {
      display: flex; align-items: center; gap: 7px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px; padding: 10px 14px;
      font-size: 12px; color: #991b1b; font-weight: 600;
    }
    .db-danger-alert .material-symbols-outlined { font-size: 17px; color: #dc2626; }

    /* ── LISTE SAUVEGARDES ───────────────────────────── */
    .db-list-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .db-list-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 700; color: #0f172a;
    }
    .db-list-title .material-symbols-outlined { font-size: 20px; color: #7c3aed; }

    .db-btn-refresh {
      display: flex; align-items: center; gap: 6px;
      background: #f3e8ff;
      border: 1px solid #e9d5ff;
      color: #7c3aed;
      border-radius: 10px; padding: 8px 14px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .db-btn-refresh:hover { background: #7c3aed; color: #ffffff; }
    .db-btn-refresh .material-symbols-outlined { font-size: 16px; }

    .db-empty {
      text-align: center; padding: 40px 20px;
      color: #94a3b8;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .db-empty .material-symbols-outlined { font-size: 40px; color: #cbd5e1; }
    .db-empty-title { font-size: 14px; font-weight: 600; color: #64748b; }
    .db-empty-hint { font-size: 12px; color: #94a3b8; }

    .db-backup-list { display: flex; flex-direction: column; gap: 8px; }
    .db-backup-row {
      display: flex; align-items: center; gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px; padding: 12px 16px;
      transition: all 0.2s ease;
    }
    .db-backup-row:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .db-backup-file-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: #f3e8ff;
      border: 1px solid #e9d5ff;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #7c3aed;
    }
    .db-backup-file-icon .material-symbols-outlined { font-size: 18px; }
    .db-backup-details { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .db-backup-filename { font-size: 13px; font-weight: 600; color: #0f172a; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .db-backup-meta { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #64748b; }

    .db-btn-restore {
      display: flex; align-items: center; gap: 5px;
      padding: 8px 14px;
      background: #f3e8ff;
      border: 1px solid #ddd6fe;
      border-radius: 8px; color: #7c3aed;
      font-size: 12px; font-weight: 700; cursor: pointer;
      transition: all 0.2s ease; white-space: nowrap;
    }
    .db-btn-restore:hover:not(:disabled) { background: #7c3aed; color: #ffffff; }
    .db-btn-restore:disabled { opacity: 0.4; cursor: not-allowed; }
    .db-btn-restore .material-symbols-outlined { font-size: 16px; }

    /* ── MODALE ──────────────────────────────────────── */
    .db-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: dbFadeIn 0.2s ease;
    }
    @keyframes dbFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .db-modal {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      max-width: 500px; width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
      animation: dbSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes dbSlideUp { from { transform: translateY(20px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

    .db-modal-header {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 15px; font-weight: 700; color: #0f172a;
    }
    .db-modal-header.danger { background: #fef2f2; border-bottom-color: #fecaca; color: #991b1b; }
    .db-modal-header .material-symbols-outlined { font-size: 20px; color: #7c3aed; }
    .db-modal-header.danger .material-symbols-outlined { color: #dc2626; }

    .db-modal-body { padding: 24px; }
    .db-modal-body p { margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.7; }
    .db-modal-body strong { color: #0f172a; }

    .db-modal-warning {
      display: flex; align-items: center; gap: 6px;
      color: #b91c1c; font-weight: 600; font-size: 13px;
    }
    .db-modal-warning .material-symbols-outlined { font-size: 17px; color: #dc2626; }

    .db-token-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px; padding: 14px;
    }
    .db-token-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 700;
      color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .db-token-label .material-symbols-outlined { font-size: 14px; color: #7c3aed; }
    .db-token-value {
      font-family: monospace; font-size: 13px;
      color: #7c3aed; font-weight: 700; word-break: break-all;
      display: block;
    }

    .db-modal-actions {
      display: flex; gap: 10px; justify-content: flex-end;
      padding: 0 24px 24px;
    }
    .db-btn-modal-cancel {
      display: flex; align-items: center; gap: 5px;
      padding: 9px 18px; border-radius: 8px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .db-btn-modal-cancel:hover { background: #e2e8f0; }
    .db-btn-modal-cancel .material-symbols-outlined { font-size: 16px; }

    .db-btn-modal-confirm {
      display: flex; align-items: center; gap: 5px;
      padding: 9px 18px; border-radius: 8px;
      background: #7c3aed;
      border: none;
      color: #ffffff;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: all 0.2s;
    }
    .db-btn-modal-confirm:hover:not(:disabled) { background: #6d28d9; }
    .db-btn-modal-confirm.danger { background: #dc2626; }
    .db-btn-modal-confirm.danger:hover:not(:disabled) { background: #b91c1c; }
    .db-btn-modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
    .db-btn-modal-confirm .material-symbols-outlined { font-size: 16px; }

    /* ── TOAST ───────────────────────────────────────── */
    .db-toast {
      position: fixed; bottom: 28px; right: 28px;
      display: flex; align-items: center; gap: 10px;
      padding: 13px 20px; border-radius: 12px;
      font-size: 13px; font-weight: 700;
      z-index: 2000;
      animation: dbToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
      max-width: 400px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
    }
    .db-toast .material-symbols-outlined { font-size: 18px; }
    @keyframes dbToastIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .db-toast-success { background: #10b981; color: #ffffff; }
    .db-toast-error   { background: #ef4444; color: #ffffff; }
    .db-toast-warning { background: #f59e0b; color: #ffffff; }
    .db-toast-info    { background: #7c3aed; color: #ffffff; }
  `]
})
export class DbManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private apiBase = 'http://localhost:9090';

  isSuperAdmin = false;
  schemaSelectionne = 'master';
  schemasDisponibles: any[] = [];

  baseInfo: BaseInfo | null = null;
  sauvegardes: BackupInfo[] = [];

  fichierSelectionne: File | null = null;
  allowDestructive = false;

  loading = false;
  toastMessage = '';
  toastType = 'info';

  modaleVisible = false;
  modaleOperation: 'restauration' | 'vidage' = 'restauration';
  fichierRestauration = '';
  tokenConfirmation = '';

  ngOnInit() {
    this.detecterRole();
    this.chargerSchemas();
    this.chargerInfosBase();
    this.chargerSauvegardes();
  }

  private detecterRole() {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles: string[] = payload.roles || [];
        this.isSuperAdmin = roles.includes('ROLE_SUPERADMIN');
      }
    } catch { this.isSuperAdmin = false; }
  }

  private chargerSchemas() {
    this.schemasDisponibles = [
      { value: 'master', label: 'benjeddou_erp', type: 'Master' },
      { value: 'erp_ent_00000', label: 'erp_ent_00000', type: 'Démo' }
    ];
    if (!this.isSuperAdmin) {
      this.schemasDisponibles = this.schemasDisponibles.filter(s => s.value !== 'master');
      this.schemaSelectionne = 'erp_ent_00000';
    }
  }

  selectionnerSchema(schema: string) {
    this.schemaSelectionne = schema;
    this.baseInfo = null;
    this.chargerInfosBase();
    this.chargerSauvegardes();
  }

  chargerInfosBase() {
    const headers = this.authHeaders();
    this.http.get<BaseInfo>(`${this.apiBase}/api/db-management/infos?schema=${this.schemaSelectionne}`, { headers })
      .subscribe({ next: (r) => { this.baseInfo = r; }, error: () => {} });
  }

  chargerSauvegardes() {
    const headers = this.authHeaders();
    this.http.get<any>(`${this.apiBase}/api/db-management/sauvegardes`, { headers })
      .subscribe({ next: (r) => { this.sauvegardes = r.sauvegardes || []; }, error: () => {} });
  }

  exporterSQL() {
    this.loading = true;
    const headers = this.authHeaders();
    this.http.get(`${this.apiBase}/api/db-management/export?schema=${this.schemaSelectionne}`,
      { headers, responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.schemaSelectionne}_export_${new Date().toISOString().slice(0,10)}.sql`;
          a.click();
          URL.revokeObjectURL(url);
          this.afficherToast('Export SQL téléchargé avec succès !', 'success');
          this.loading = false;
        },
        error: (err) => {
          if (err.error instanceof Blob) {
            err.error.text().then((text: string) => {
              try {
                const json = JSON.parse(text);
                this.afficherToast('❌ ' + (json.erreur || 'Erreur lors de l\'export SQL'), 'error');
              } catch {
                this.afficherToast('❌ Erreur lors de l\'export SQL', 'error');
              }
            });
          } else {
            this.afficherToast('❌ Erreur lors de l\'export SQL', 'error');
          }
          this.loading = false;
        }
      });
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.fichierSelectionne = input.files[0];
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files?.length) this.fichierSelectionne = files[0];
  }

  importerSQL() {
    if (!this.fichierSelectionne) return;
    this.loading = true;
    const headers = this.authHeaders();
    const formData = new FormData();
    formData.append('fichier', this.fichierSelectionne);
    this.http.post<any>(
      `${this.apiBase}/api/db-management/import?schema=${this.schemaSelectionne}&allowDestructive=${this.allowDestructive}`,
      formData, { headers })
      .subscribe({
        next: (r) => {
          this.loading = false;
          if (r.instructionsDestructives) {
            this.afficherToast(`Import bloqué : ${r.instructionsDestructives.length} instruction(s) destructive(s) détectée(s).`, 'warning');
          } else if (r.succes) {
            this.afficherToast(`Import réussi : ${r.instructionsExecutees} instructions exécutées.`, 'success');
            this.chargerInfosBase();
          } else {
            this.afficherToast('Erreur import : ' + r.erreur, 'error');
          }
          this.fichierSelectionne = null;
        },
        error: () => { this.afficherToast('Erreur réseau lors de l\'import.', 'error'); this.loading = false; }
      });
  }

  sauvegarder() {
    this.loading = true;
    const headers = this.authHeaders();
    this.http.post<any>(`${this.apiBase}/api/db-management/sauvegarder?schema=${this.schemaSelectionne}`, {}, { headers })
      .subscribe({
        next: (r) => {
          this.loading = false;
          if (r.succes) { this.afficherToast(`Sauvegarde créée : ${r.fichier}`, 'success'); this.chargerSauvegardes(); }
          else { this.afficherToast('Erreur : ' + r.erreur, 'error'); }
        },
        error: () => { this.afficherToast('Erreur réseau.', 'error'); this.loading = false; }
      });
  }

  demanderTokenRestauration(fichier: string) {
    this.fichierRestauration = fichier;
    this.modaleOperation = 'restauration';
    const headers = this.authHeaders();
    this.http.post<any>(`${this.apiBase}/api/db-management/confirmation-token`,
      { schema: this.schemaSelectionne, operation: 'restauration' }, { headers })
      .subscribe({
        next: (r) => { this.tokenConfirmation = r.token; this.modaleVisible = true; },
        error: () => { this.afficherToast('Impossible d\'obtenir le token de confirmation.', 'error'); }
      });
  }

  demanderTokenVidage() {
    this.modaleOperation = 'vidage';
    const headers = this.authHeaders();
    this.http.post<any>(`${this.apiBase}/api/db-management/confirmation-token`,
      { schema: this.schemaSelectionne, operation: 'vidage' }, { headers })
      .subscribe({
        next: (r) => { this.tokenConfirmation = r.token; this.modaleVisible = true; },
        error: () => { this.afficherToast('Impossible d\'obtenir le token de confirmation.', 'error'); }
      });
  }

  confirmerOperation() {
    this.loading = true;
    const headers = this.authHeaders();
    if (this.modaleOperation === 'restauration') {
      this.http.post<any>(`${this.apiBase}/api/db-management/restaurer`,
        { schema: this.schemaSelectionne, fichier: this.fichierRestauration, tokenConfirmation: this.tokenConfirmation },
        { headers })
        .subscribe({
          next: (r) => {
            this.loading = false; this.fermerModale();
            if (r.succes) { this.afficherToast(`Restauration réussie depuis ${this.fichierRestauration}`, 'success'); this.chargerInfosBase(); }
            else { this.afficherToast('Erreur : ' + r.erreur, 'error'); }
          },
          error: () => { this.afficherToast('Erreur réseau.', 'error'); this.loading = false; this.fermerModale(); }
        });
    } else {
      this.http.post<any>(`${this.apiBase}/api/db-management/vider`,
        { schema: this.schemaSelectionne, tokenConfirmation: this.tokenConfirmation }, { headers })
        .subscribe({
          next: (r) => {
            this.loading = false; this.fermerModale();
            if (r.succes) { this.afficherToast(`${r.tablesVidees} tables vidées dans ${r.schema}`, 'success'); this.chargerInfosBase(); }
            else { this.afficherToast('Erreur : ' + r.erreur, 'error'); }
          },
          error: () => { this.afficherToast('Erreur réseau.', 'error'); this.loading = false; this.fermerModale(); }
        });
    }
  }

  fermerModale() { this.modaleVisible = false; this.tokenConfirmation = ''; this.fichierRestauration = ''; }

  private afficherToast(msg: string, type: string) {
    this.toastMessage = msg; this.toastType = type;
    setTimeout(() => { this.toastMessage = ''; }, 5000);
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
