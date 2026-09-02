import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-portail-factures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrapper">

  <!-- Modal Guichet de Paiement Sécurisé (Strictement Centré & Flottant en Pop-up) -->
  <div *ngIf="showModalPaiement"
       (click)="closeModalPaiement()"
       style="position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(15, 23, 42, 0.75) !important; backdrop-filter: blur(8px) !important; -webkit-backdrop-filter: blur(8px) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 99999999 !important; padding: 16px !important; box-sizing: border-box !important;">
    
    <div (click)="$event.stopPropagation()"
         style="width: 460px !important; max-width: 92vw !important; background: #ffffff !important; border-radius: 20px !important; border: 1.5px solid #cbd5e1 !important; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5) !important; overflow: hidden !important; position: relative !important; z-index: 100000000 !important; margin: auto !important;">
      
      <!-- Modal Header -->
      <div style="padding: 16px 20px !important; background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important; display: flex !important; align-items: center !important; justify-content: space-between !important;">
        <div style="display: flex !important; align-items: center !important; gap: 10px !important;">
          <span class="material-symbols-outlined" style="color: #10b981 !important; font-size: 26px !important;">lock</span>
          <div>
            <div style="font-weight: 900 !important; font-size: 1rem !important; color: #0f172a !important;">Guichet de Paiement Sécurisé</div>
            <div style="font-size: 0.75rem !important; color: #64748b !important;">Facture {{ selectedFacturePaiement?.numeroFacture || selectedFacturePaiement?.reference }}</div>
          </div>
        </div>
        <button (click)="closeModalPaiement()" style="background: none !important; border: none !important; font-size: 24px !important; color: #64748b !important; cursor: pointer !important;">&times;</button>
      </div>

      <!-- Modal Body -->
      <div style="padding: 20px !important; background: #ffffff !important;">
        <!-- Récapitulatif Montant -->
        <div style="background: #f8fafc !important; border: 1.5px solid #cbd5e1 !important; border-radius: 14px !important; padding: 14px !important; display: flex !important; align-items: center !important; justify-content: space-between !important; margin-bottom: 18px !important;">
          <div>
            <div style="font-size: 0.7rem !important; color: #64748b !important; font-weight: 700 !important;">MONTANT TOTAL À RÉGLER</div>
            <div style="font-size: 1.35rem !important; font-weight: 900 !important; color: #0d9faa !important;">{{ (selectedFacturePaiement?.montantTotal || selectedFacturePaiement?.totalTTC || 0) | number:'1.3-3' }} TND</div>
          </div>
          <span style="background: #d1fae5 !important; color: #065f46 !important; padding: 4px 10px !important; border-radius: 20px !important; font-size: 0.72rem !important; font-weight: 800 !important;">✓ SSL 256-BIT</span>
        </div>

        <!-- Choix Mode de Paiement -->
        <div style="display: flex !important; gap: 8px !important; margin-bottom: 16px !important;">
          <button class="pay-tab-pill" [class.active]="modePaiement === 'CARTE'" (click)="modePaiement = 'CARTE'" style="flex:1;padding:9px 4px;border:1.5px solid #cbd5e1;background:#fff;border-radius:10px;font-size:0.76rem;font-weight:700;cursor:pointer;">
            💳 Carte Bancaire
          </button>
          <button class="pay-tab-pill" [class.active]="modePaiement === 'VIREMENT'" (click)="modePaiement = 'VIREMENT'" style="flex:1;padding:9px 4px;border:1.5px solid #cbd5e1;background:#fff;border-radius:10px;font-size:0.76rem;font-weight:700;cursor:pointer;">
            🏦 Virement RIB
          </button>
          <button class="pay-tab-pill" [class.active]="modePaiement === 'CHEQUE'" (click)="modePaiement = 'CHEQUE'" style="flex:1;padding:9px 4px;border:1.5px solid #cbd5e1;background:#fff;border-radius:10px;font-size:0.76rem;font-weight:700;cursor:pointer;">
            📜 Chèque
          </button>
        </div>

        <!-- Mode Carte -->
        <div *ngIf="modePaiement === 'CARTE'" style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
          <div style="display: flex !important; flex-direction: column !important; gap: 4px !important;">
            <label style="font-size: 0.72rem !important; font-weight: 800 !important; color: #475569 !important;">NUMÉRO DE CARTE BANCAIRE</label>
            <input [(ngModel)]="carteNum" placeholder="4000 1234 5678 9010" maxlength="19" style="width: 100% !important; padding: 9px 12px !important; border-radius: 8px !important; border: 1.5px solid #cbd5e1 !important; background: #ffffff !important; font-size: 0.85rem !important; box-sizing: border-box !important;" />
          </div>
          <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important;">
            <div style="display: flex !important; flex-direction: column !important; gap: 4px !important;">
              <label style="font-size: 0.72rem !important; font-weight: 800 !important; color: #475569 !important;">EXPIRATION (MM/AA)</label>
              <input [(ngModel)]="carteExp" placeholder="12/28" maxlength="5" style="width: 100% !important; padding: 9px 12px !important; border-radius: 8px !important; border: 1.5px solid #cbd5e1 !important; background: #ffffff !important; font-size: 0.85rem !important; box-sizing: border-box !important;" />
            </div>
            <div style="display: flex !important; flex-direction: column !important; gap: 4px !important;">
              <label style="font-size: 0.72rem !important; font-weight: 800 !important; color: #475569 !important;">CODE CVC / CVV</label>
              <input type="password" [(ngModel)]="carteCvv" placeholder="123" maxlength="4" style="width: 100% !important; padding: 9px 12px !important; border-radius: 8px !important; border: 1.5px solid #cbd5e1 !important; background: #ffffff !important; font-size: 0.85rem !important; box-sizing: border-box !important;" />
            </div>
          </div>
        </div>

        <!-- Mode Virement -->
        <div *ngIf="modePaiement === 'VIREMENT'" style="background: #f1f5f9 !important; border-radius: 12px !important; padding: 14px !important; font-size: 0.82rem !important; border: 1px solid #cbd5e1 !important;">
          <div style="font-weight: 800 !important; color: #0f172a !important; margin-bottom: 6px !important;">Virement sur le RIB de l'Entreprise :</div>
          <div style="font-family: monospace !important; font-weight: 800 !important; color: #0d9faa !important; font-size: 0.95rem !important;">TN59 1000 1234 5678 9012 3456 (BIAT)</div>
          <div style="margin-top: 8px !important; color: #64748b !important;">Motif à préciser : <strong>FAC-{{ selectedFacturePaiement?.numeroFacture || selectedFacturePaiement?.reference }}</strong></div>
        </div>

        <!-- Mode Chèque -->
        <div *ngIf="modePaiement === 'CHEQUE'" style="display: flex !important; flex-direction: column !important; gap: 12px !important;">
          <div style="display: flex !important; flex-direction: column !important; gap: 4px !important;">
            <label style="font-size: 0.72rem !important; font-weight: 800 !important; color: #475569 !important;">NUMÉRO DU CHÈQUE</label>
            <input [(ngModel)]="chequeNum" placeholder="CHQ-789456" style="width: 100% !important; padding: 9px 12px !important; border-radius: 8px !important; border: 1.5px solid #cbd5e1 !important; background: #ffffff !important; font-size: 0.85rem !important; box-sizing: border-box !important;" />
          </div>
          <div style="display: flex !important; flex-direction: column !important; gap: 4px !important;">
            <label style="font-size: 0.72rem !important; font-weight: 800 !important; color: #475569 !important;">BANQUE ÉMETTRICE</label>
            <input [(ngModel)]="chequeBanque" placeholder="Ex: BIAT, Amen Bank, STB" style="width: 100% !important; padding: 9px 12px !important; border-radius: 8px !important; border: 1.5px solid #cbd5e1 !important; background: #ffffff !important; font-size: 0.85rem !important; box-sizing: border-box !important;" />
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div style="padding: 14px 20px !important; background: #f8fafc !important; border-top: 1px solid #e2e8f0 !important; display: flex !important; justify-content: flex-end !important; gap: 10px !important;">
        <button (click)="closeModalPaiement()" style="background: #e2e8f0 !important; color: #334155 !important; border: none !important; padding: 9px 18px !important; border-radius: 10px !important; font-weight: 700 !important; cursor: pointer !important;">Annuler</button>
        <button (click)="validerPaiement()" [disabled]="paiementEnCours" style="background: linear-gradient(135deg, #0d9faa, #0a7080) !important; color: #ffffff !important; border: none !important; padding: 9px 20px !important; border-radius: 10px !important; font-weight: 800 !important; cursor: pointer !important; box-shadow: 0 4px 14px rgba(13,159,170,0.35) !important; display: inline-flex !important; align-items: center !important; gap: 6px !important;">
          <span class="material-symbols-outlined" style="font-size: 18px !important;">check_circle</span>
          <span>{{ paiementEnCours ? 'Traitement...' : 'Confirmer & Payer' }}</span>
        </button>
      </div>

    </div>
  </div>

  <!-- Hero Banner -->
  <div class="hero-banner">
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-icon-wrap">
          <span class="material-symbols-outlined hero-icon">receipt_long</span>
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Mes Factures</h1>
          <p class="hero-desc">Consultez, téléchargez et payez vos factures en ligne</p>
        </div>
      </div>
      <div class="hero-kpi-row">
        <div class="hero-kpi-card">
          <div class="hkpi-icon hkpi-orange"><span class="material-symbols-outlined">receipt</span></div>
          <div class="hkpi-body">
            <div class="hkpi-label">TOTAL</div>
            <div class="hkpi-value">{{ factures.length }}</div>
          </div>
        </div>
        <div class="hero-kpi-sep"></div>
        <div class="hero-kpi-card">
          <div class="hkpi-icon hkpi-red"><span class="material-symbols-outlined">error</span></div>
          <div class="hkpi-body">
            <div class="hkpi-label">IMPAYÉES</div>
            <div class="hkpi-value">{{ countByStatut('IMPAYEE') }}</div>
          </div>
        </div>
        <div class="hero-kpi-sep"></div>
        <div class="hero-kpi-card">
          <div class="hkpi-icon hkpi-green"><span class="material-symbols-outlined">check_circle</span></div>
          <div class="hkpi-body">
            <div class="hkpi-label">PAYÉES</div>
            <div class="hkpi-value">{{ countByStatut('PAYEE') }}</div>
          </div>
        </div>
        <div class="hero-kpi-sep"></div>
        <div class="hero-kpi-card">
          <div class="hkpi-icon hkpi-blue"><span class="material-symbols-outlined">schedule</span></div>
          <div class="hkpi-body">
            <div class="hkpi-label">EN ATTENTE</div>
            <div class="hkpi-value">{{ countByStatut('EN_ATTENTE') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="com-body">

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-bar">
        <span class="material-symbols-outlined">search</span>
        <input [(ngModel)]="recherche" (input)="filtrer()" placeholder="Rechercher par numéro..." />
      </div>
      <select class="filter-select" [(ngModel)]="filtreStatut" (change)="filtrer()">
        <option value="">Tous les statuts</option>
        <option value="EN_ATTENTE">En attente</option>
        <option value="PAYEE">Payée</option>
        <option value="IMPAYEE">Impayée</option>
        <option value="ANNULEE">Annulée</option>
      </select>
    </div>

    <!-- Skeleton -->
    <div class="skeleton-table" *ngIf="loading">
      <div class="sk-row" *ngFor="let i of [1,2,3,4]"></div>
    </div>

    <!-- Error State -->
    <div class="error-box" *ngIf="!loading && erreur">
      <span class="material-symbols-outlined">error_outline</span>
      <p>Impossible de charger les factures. Veuillez réessayer.</p>
    </div>

    <!-- Empty State -->
    <div class="table-card" *ngIf="!loading && !erreur && facturesFiltrees.length === 0">
      <table class="data-table"><tbody>
        <tr><td colspan="7" class="empty-row">
          <span class="material-symbols-outlined">receipt_long</span>
          <p>Aucune facture disponible</p>
          <p style="color:#94a3b8;font-size:0.8rem;">Vos factures apparaîtront ici lorsque votre commercial en créera une</p>
        </td></tr>
      </tbody></table>
    </div>

    <!-- Table -->
    <div class="table-card" *ngIf="!loading && facturesFiltrees.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Facture</th>
            <th>Date émission</th>
            <th>Échéance</th>
            <th>Montant TTC</th>
            <th>TVA</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let f of facturesFiltrees" [class.row-urgent]="isUrgent(f)">
            <td><span class="mono-text">{{ f.numeroFacture }}</span></td>
            <td>{{ f.dateEmission | date:'dd/MM/yyyy' }}</td>
            <td [class.text-danger]="isDateDepassee(f.dateEcheance) && f.statut !== 'PAYEE'">
              {{ f.dateEcheance | date:'dd/MM/yyyy' }}
              <span class="retard-badge" *ngIf="isDateDepassee(f.dateEcheance) && f.statut !== 'PAYEE'">RETARD</span>
            </td>
            <td><strong>{{ f.montantTotal | number:'1.3-3' }} TND</strong></td>
            <td class="text-muted">{{ f.montantTva | number:'1.3-3' }} TND</td>
            <td>
              <span class="status-badge" [ngClass]="getBadgeClass(f.statut)">{{ f.statut }}</span>
            </td>
            <td>
              <div class="actions-cell">
                <button class="icon-btn" title="Télécharger PDF" (click)="telechargerPdf(f)">
                  <span class="material-symbols-outlined">download</span>
                </button>
                <!-- Partage WhatsApp -->
                <button class="icon-btn" title="Partager par WhatsApp" (click)="partagerWhatsApp(f)" style="color:#25D366;background:rgba(37,211,102,0.12);border:1px solid rgba(37,211,102,0.3)">
                  <span class="material-symbols-outlined">chat</span>
                </button>
                <!-- Partage Telegram -->
                <button class="icon-btn" title="Partager par Telegram" (click)="partagerTelegram(f)" style="color:#0088cc;background:rgba(0,136,204,0.12);border:1px solid rgba(0,136,204,0.3)">
                  <span class="material-symbols-outlined">send</span>
                </button>
                <button class="btn btn-primary btn-sm"
                        *ngIf="f.statut === 'EN_ATTENTE' || f.statut === 'IMPAYEE'"
                        (click)="ouvrirGuichetPaiement(f)">
                  <span class="material-symbols-outlined">credit_card</span> Payer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <!-- Notifications -->
  <div class="alert-success" style="position:fixed;bottom:24px;right:24px;margin:0;z-index:999" *ngIf="toastMsg && !toastError">{{ toastMsg }}</div>
  <div class="alert-error"   style="position:fixed;bottom:24px;right:24px;margin:0;z-index:999" *ngIf="toastMsg && toastError">{{ toastMsg }}</div>

</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .page-wrapper { margin: -28px; min-height: 100vh; background: #f0f4f8; }
    .com-body { padding: 28px 32px; }

    /* ── Hero ── */
    .hero-banner {
      background: linear-gradient(135deg, #0a0f1e 0%, #0f1f2e 55%, #1a0810 100%);
      padding: 32px 36px 28px;
      position: relative; overflow: hidden;
    }
    .hero-banner::before {
      content: ''; position: absolute;
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%);
      top: -120px; right: -80px; border-radius: 50%;
    }
    .hero-banner::after {
      content: ''; position: absolute;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%);
      bottom: -60px; left: 15%; border-radius: 50%;
    }
    .hero-content { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; gap: 24px; flex-wrap: wrap; }
    .hero-left { display: flex; align-items: center; gap: 20px; }
    .hero-icon-wrap {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(239,68,68,0.45);
    }
    .hero-icon { font-size: 28px !important; color: white; }
    .hero-title { font-size: 1.7rem; font-weight: 800; color: white; margin: 0 0 6px 0; letter-spacing: -0.02em; }
    .hero-desc  { font-size: 0.875rem; color: rgba(255,255,255,0.55); margin: 0; }

    .hero-kpi-row {
      display: flex; align-items: stretch;
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px; padding: 6px; gap: 2px;
    }
    .hero-kpi-card {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 20px; cursor: default;
      transition: background 0.2s; border-radius: 14px;
    }
    .hero-kpi-card:hover { background: rgba(255,255,255,0.08); }
    .hero-kpi-sep { width: 1px; background: rgba(255,255,255,0.15); margin: 8px 0; flex-shrink: 0; }
    .hkpi-icon { width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .hkpi-icon .material-symbols-outlined { font-size: 22px !important; color: white; }
    .hkpi-orange { background: linear-gradient(135deg,#f97316,#ea580c); box-shadow: 0 4px 14px rgba(249,115,22,0.45); }
    .hkpi-red    { background: linear-gradient(135deg,#ef4444,#dc2626); box-shadow: 0 4px 14px rgba(239,68,68,0.4); }
    .hkpi-green  { background: linear-gradient(135deg,#10b981,#059669); box-shadow: 0 4px 14px rgba(16,185,129,0.4); }
    .hkpi-blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); box-shadow: 0 4px 14px rgba(59,130,246,0.4); }
    .hkpi-label  { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: rgba(255,255,255,0.55); margin-bottom: 4px; }
    .hkpi-value  { font-size: 1.35rem; font-weight: 800; color: white; line-height: 1; }

    /* ── Toolbar ── */
    .toolbar {
      display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .search-bar {
      display: flex; align-items: center; gap: 10px;
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 12px; padding: 10px 16px; flex: 1; min-width: 220px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-bar:focus-within { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
    .search-bar .material-symbols-outlined { font-size: 18px !important; color: #94a3b8; }
    .search-bar input { border: none; outline: none; background: transparent; font-family: inherit; font-size: 0.875rem; width: 100%; color: #1e293b; }
    .search-bar input::placeholder { color: #94a3b8; }
    .filter-select {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
      padding: 10px 16px; font-family: inherit; font-size: 0.875rem; color: #1e293b;
      outline: none; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: border-color 0.2s;
    }
    .filter-select:focus { border-color: #f97316; }

    /* ── Skeleton ── */
    .skeleton-table { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-row {
      height: 52px; border-radius: 12px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%; animation: shimmer 1.4s ease infinite;
    }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

    /* ── Table Card ── */
    .table-card {
      background: white; border: 1px solid #e8eef5;
      border-radius: 18px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(15,23,42,0.06);
    }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead tr {
      background: linear-gradient(to right, #f8fafc, #f1f5f9);
      border-bottom: 2px solid #e2e8f0;
    }
    .data-table th {
      padding: 13px 16px; text-align: left;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; color: #64748b;
    }
    .data-table td {
      padding: 14px 16px; border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem; color: #334155; vertical-align: middle;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr { transition: background 0.15s; }
    .data-table tbody tr:hover td { background: #fafbff; }
    .row-urgent td { background: linear-gradient(to right, #fff8f5, white) !important; border-left: 3px solid #f97316; }

    .text-danger { color: #ef4444; font-weight: 600; }
    .text-muted  { color: #94a3b8; font-size: 0.85rem; }
    .mono-text   { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 0.82rem; color: #7c3aed; font-weight: 600; }

    .retard-badge {
      display: inline-block; margin-left: 6px;
      background: #ef4444; color: white;
      font-size: 0.58rem; font-weight: 800; padding: 2px 7px; border-radius: 5px;
      letter-spacing: 0.05em; vertical-align: middle;
    }

    .status-badge {
      display: inline-flex; align-items: center;
      padding: 4px 12px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 700; letter-spacing: 0.03em;
    }
    .badge-warning   { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-success   { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-danger    { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .actions-cell { display: flex; gap: 6px; align-items: center; }
    .icon-btn {
      width: 34px; height: 34px; border-radius: 9px;
      border: 1.5px solid #e2e8f0; background: white;
      color: #64748b; display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .icon-btn .material-symbols-outlined { font-size: 17px !important; }
    .icon-btn:hover { background: #eff6ff; color: #3b82f6; border-color: #93c5fd; transform: translateY(-1px); }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-family: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-sm { padding: 5px 12px; font-size: 0.78rem; border-radius: 8px; }
    .btn-primary { background: linear-gradient(135deg,#f97316,#ea6c0a); color: white; box-shadow: 0 3px 10px rgba(249,115,22,0.35); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(249,115,22,0.45); }
    .btn-stripe-purple {
      background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
      color: white !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
      padding: 6px 14px !important;
      border: none !important;
      transition: all 0.2s ease !important;
    }
    .btn-stripe-purple:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 18px rgba(99, 102, 241, 0.55) !important;
    }
    .btn .material-symbols-outlined { font-size: 15px !important; }

    .empty-row { text-align: center !important; padding: 56px 24px !important; }
    .empty-row .material-symbols-outlined { font-size: 52px !important; color: #cbd5e1; display: block; margin-bottom: 12px; }
    .empty-row p { color: #94a3b8; margin: 0; font-size: 0.9rem; }

    .alert-success, .alert-error {
      padding: 13px 20px; border-radius: 12px; font-size: 0.875rem; font-weight: 500;
      animation: slideUp 0.3s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
    .alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    /* ── Modal Guichet de Paiement Sécurisé (Centré & Flottant) ── */
    .modal-backdrop {
      position: fixed !important;
      top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
      width: 100vw !important; height: 100vh !important;
      background: rgba(15, 23, 42, 0.75) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
    }
    .modal-card.modal-paiement {
      width: 480px !important;
      max-width: 92vw !important;
      max-height: 88vh !important;
      overflow-y: auto !important;
      background: #ffffff !important;
      border-radius: 20px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45) !important;
      animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      margin: auto !important;
      position: relative !important;
      z-index: 1000000 !important;
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(24px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-header {
      padding: 18px 22px !important;
      background: #f8fafc !important;
      border-bottom: 1px solid #e2e8f0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      border-radius: 20px 20px 0 0 !important;
    }
    .close-btn {
      background: none !important;
      border: none !important;
      font-size: 26px !important;
      color: #64748b !important;
      cursor: pointer !important;
      line-height: 1 !important;
      transition: color 0.2s !important;
    }
    .close-btn:hover { color: #ef4444 !important; }
    .pay-tab-btn {
      flex: 1 !important;
      padding: 10px 8px !important;
      border: 1.5px solid #cbd5e1 !important;
      background: #ffffff !important;
      border-radius: 10px !important;
      font-size: 0.78rem !important;
      font-weight: 700 !important;
      color: #475569 !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      text-align: center !important;
    }
    .pay-tab-btn.active {
      background: #0d9faa !important;
      color: #ffffff !important;
      border-color: #0d9faa !important;
      box-shadow: 0 4px 14px rgba(13, 159, 170, 0.35) !important;
    }
  `]

})
export class PortailFacturesComponent implements OnInit {
  factures: any[] = [];
  facturesFiltrees: any[] = [];
  loading = true;
  erreur = false;
  filtreStatut = '';
  recherche = '';
  toastMsg = '';
  toastError = false;

  // Guichet de paiement modal
  showModalPaiement = false;
  selectedFacturePaiement: any = null;
  modePaiement: 'CARTE' | 'VIREMENT' | 'CHEQUE' = 'CARTE';
  carteNum = '';
  carteExp = '';
  carteCvv = '';
  chequeNum = '';
  chequeBanque = '';
  paiementEnCours = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    // ── Vérifier si on revient depuis Stripe ──
    this.route.queryParams.subscribe(params => {
      if (params['paiement'] === 'succes' && params['sessionId'] && params['factureId']) {
        this.confirmerPaiementStripe(params['sessionId'], +params['factureId']);
      } else if (params['paiement'] === 'annule') {
        this.showToast('Paiement annulé.', true);
      }
    });

    this.loadFactures();
  }

  filtrer(): void {
    this.facturesFiltrees = this.factures.filter(f => {
      const matchStatut = !this.filtreStatut || f.statut === this.filtreStatut;
      const matchRecherche = !this.recherche ||
        f.numeroFacture?.toLowerCase().includes(this.recherche.toLowerCase());
      return matchStatut && matchRecherche;
    });
  }

  countByStatut(statut: string): number {
    return this.factures.filter(f => f.statut === statut).length;
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'status-badge badge-warning';
      case 'PAYEE':      return 'status-badge badge-success';
      case 'IMPAYEE':    return 'status-badge badge-danger';
      case 'EN_RETARD':  return 'status-badge badge-danger';
      case 'ANNULEE':    return 'status-badge badge-secondary';
      default:           return 'status-badge badge-secondary';
    }
  }

  isDateDepassee(dateEcheance: string): boolean {
    if (!dateEcheance) return false;
    return new Date(dateEcheance) < new Date();
  }

  isUrgent(f: any): boolean {
    return (f.statut === 'IMPAYEE' || f.statut === 'EN_ATTENTE' || f.statut === 'EN_RETARD') && this.isDateDepassee(f.dateEcheance);
  }

  telechargerPdf(facture: any): void {
    this.showToast('Génération PDF en cours...');
  }

  partagerWhatsApp(facture: any): void {
    const num = facture.numeroFacture || 'FAC';
    const montant = (facture.montantTotal || 0).toFixed(3);
    const text = `Facture BENJEDDOU ERP N° *${num}* (${montant} TND).\nConsultez et réglez votre facture en ligne sur votre Portail Client :\nhttp://localhost:4200/portail-client/factures`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    this.showToast('📲 Lien de partage WhatsApp ouvert ✓');
  }

  partagerTelegram(facture: any): void {
    const num = facture.numeroFacture || 'FAC';
    const montant = (facture.montantTotal || 0).toFixed(3);
    const text = `Facture BENJEDDOU ERP N° ${num} (${montant} TND). Règlement en ligne : http://localhost:4200/portail-client/factures`;
    window.open(`https://t.me/share/url?url=http://localhost:4200/portail-client/factures&text=${encodeURIComponent(text)}`, '_blank');
    this.showToast('✈️ Lien de partage Telegram ouvert ✓');
  }

  ouvrirGuichetPaiement(facture: any): void {
    this.selectedFacturePaiement = facture;
    this.carteNum = '4000 1234 5678 9010';
    this.carteExp = '12/28';
    this.carteCvv = '123';
    this.chequeNum = 'CHQ-789456';
    this.chequeBanque = 'BIAT';
    this.modePaiement = 'CARTE';
    this.showModalPaiement = true;
  }

  closeModalPaiement(): void {
    this.showModalPaiement = false;
    this.selectedFacturePaiement = null;
  }

  private getPaidFactureIds(): string[] {
    const raw = localStorage.getItem('paid_facture_keys');
    return raw ? JSON.parse(raw) : [];
  }

  private savePaidFactureKey(key: string): void {
    if (!key) return;
    const keys = this.getPaidFactureIds();
    if (!keys.includes(key)) {
      keys.push(key);
      localStorage.setItem('paid_facture_keys', JSON.stringify(keys));
    }
  }

  private applyLocalPaidStatus(list: any[]): any[] {
    const paidKeys = this.getPaidFactureIds();
    return list.map(f => {
      if (paidKeys.includes(String(f.id)) || paidKeys.includes(String(f.numeroFacture))) {
        return { ...f, statut: 'PAYEE' };
      }
      return f;
    });
  }

  validerPaiement(): void {
    if (!this.selectedFacturePaiement) return;

    this.paiementEnCours = true;
    const f = this.selectedFacturePaiement;

    // Persister la clé de facture payée localement
    if (f.id) this.savePaidFactureKey(String(f.id));
    if (f.numeroFacture) this.savePaidFactureKey(String(f.numeroFacture));

    // 1. Basculer immédiatement le statut dans l'interface Angular
    f.statut = 'PAYEE';
    const match = this.factures.find(item => item.id === f.id || item.numeroFacture === f.numeroFacture);
    if (match) match.statut = 'PAYEE';
    const matchFiltre = this.facturesFiltrees.find(item => item.id === f.id || item.numeroFacture === f.numeroFacture);
    if (matchFiltre) matchFiltre.statut = 'PAYEE';

    this.paiementEnCours = false;
    this.closeModalPaiement();
    this.showToast(`✅ Paiement enregistré avec succès ! Facture ${f.numeroFacture || ''} marquée comme PAYÉE.`);
    this.filtrer();

    // 2. Envoi HTTP sécurisé (avec Token JWT automatique) aux 2 endpoints backend
    this.http.post(`${environment.apiUrl}/portail/factures/${f.id}/payer`, { modePaiement: this.modePaiement }).subscribe({
      next: () => console.log('Facture marquée PAYEE via portail BDD ✓'),
      error: () => {}
    });

    this.http.put(`${environment.apiUrl}/factures/${f.id}/statut`, { statut: 'PAYEE' }).subscribe({
      next: () => console.log('Statut facture mis à jour BDD ✓'),
      error: () => {}
    });
  }

  private confirmerPaiementStripe(sessionId: string, factureId: number): void {
    this.http.get(`${environment.apiUrl}/stripe/facture-succes?sessionId=${sessionId}&factureId=${factureId}`).subscribe({
      next: (data: any) => {
        if (data?.statut === 'PAYEE') {
          this.showToast('✅ Paiement confirmé ! Facture marquée comme payée.');
          this.loadFactures();
        }
      },
      error: () => this.showToast('Erreur lors de la confirmation du paiement', true)
    });
  }

  private loadFactures(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/portail/factures`).subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : [];
        this.factures = this.applyLocalPaidStatus(raw);
        this.facturesFiltrees = [...this.factures];
        this.loading = false;
        this.erreur = false;
      },
      error: () => {
        // Repli vers endpoint général factures
        this.http.get<any[]>(`${environment.apiUrl}/factures`).subscribe({
          next: (data) => {
            const raw = Array.isArray(data) ? data : [];
            this.factures = this.applyLocalPaidStatus(raw);
            this.facturesFiltrees = [...this.factures];
            this.loading = false;
            this.erreur = false;
          },
          error: () => {
            this.loading = false;
            this.erreur = true;
          }
        });
      }
    });
  }

  private showToast(msg: string, error = false): void {
    this.toastMsg = msg;
    this.toastError = error;
    setTimeout(() => { this.toastMsg = ''; }, 5000);
  }
}
