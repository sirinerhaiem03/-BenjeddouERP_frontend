import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CalculService, LigneCalcul, CalculMoteur, PeriodeTaux } from './calcul.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-moteur-calcul',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './moteur-calcul.component.html',
  styleUrls: ['./moteur-calcul.component.css']
})
export class MoteurCalculComponent implements OnInit {

  activeTab: 'unique' | 'variable' | 'historique-unique' | 'historique-variable' | 'admin' = 'unique';
  isAdmin = false;
  isSuperAdmin = false;
  currentUserId: number | null = null;

  // ─── Mode 1 : Taux unique ───────────────────────────────────────────────
  u = {
    montant: null as number | null,
    dateDebut: '',
    dateFin: '',
    taux: null as number | null,
    moduleErp: 'GENERAL',
    libelle: '',
    nombreJours: 0,
    resultat: null as number | null,
    formule: '',
    loading: false,
    success: false,
    error: '',
    lastSavedCalcul: null as CalculMoteur | null
  };

  // ─── Mode 2 : Taux variables ────────────────────────────────────────────
  v = {
    montant: null as number | null,
    dateDebut: '',
    dateFin: '',
    moduleErp: 'GENERAL',
    libelle: '',
    lignes: [] as LigneCalcul[],
    resultatTotal: null as number | null,
    nombreJoursTotal: 0,
    nbPeriodes: 0,
    lastCalculId: null as number | null,
    lastSavedCalcul: null as CalculMoteur | null,
    lastSavedLignes: [] as LigneCalcul[],
    loading: false,
    simulating: false,
    success: false,
    error: '',
    errorCode: ''
  };

  // indicateur d'export en cours pour l'historique variable
  hvExportingId: number | null = null;

  // ─── Historique Taux Unique ─────────────────────────────────────────────
  hu = {
    calculs: [] as CalculMoteur[],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 15,
    q: '',
    loading: false,
    selectedCalcul: null as CalculMoteur | null,
    showDetail: false
  };

  // ─── Historique Taux Variables ──────────────────────────────────────────
  hv = {
    calculs: [] as CalculMoteur[],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 15,
    q: '',
    loading: false,
    selectedCalcul: null as CalculMoteur | null,
    selectedLignes: [] as LigneCalcul[],
    showDetail: false
  };

  // ─── Admin périodes & taux ──────────────────────────────────────────────
  a = {
    periodes: [] as PeriodeTaux[],
    loading: false,
    showForm: false,
    editingId: null as number | null,
    form: { dateDebut: '', dateFin: '', taux: null as number | null, libelle: '' },
    error: '',
    success: ''
  };

  // ─── Export / Impression ────────────────────────────────────────────────
  exportLoading = false;

  modules = ['GENERAL', 'FINANCE', 'COMPTABILITE', 'RH', 'TRESORERIE', 'VENTES', 'ACHATS', 'INVESTISSEMENTS', 'CONTRATS'];

  constructor(
    private calculService: CalculService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;
    this.isSuperAdmin = user?.roles?.includes('ROLE_SUPERADMIN') || false;
    this.currentUserId = user?.id || null;
    this.loadHistoriqueUnique();
    this.loadHistoriqueVariable();
    if (this.isAdmin || this.isSuperAdmin) this.loadPeriodes();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODE 1 — TAUX UNIQUE
  // ═══════════════════════════════════════════════════════════════════════

  onDateUnique(): void {
    if (this.u.dateDebut && this.u.dateFin) {
      this.calculService.getNombreJours(this.u.dateDebut, this.u.dateFin).subscribe(r => {
        this.u.nombreJours = r.nombreJours;
        this.calculerApercu();
      });
    }
  }

  calculerApercu(): void {
    if (this.u.montant && this.u.taux && this.u.nombreJours > 0) {
      const res = this.u.montant * (this.u.taux / 100) * (this.u.nombreJours / 365);
      this.u.resultat = Math.round(res * 1000) / 1000;
      this.u.formule = `${this.formatNum(this.u.montant)} × ${this.u.taux}% × (${this.u.nombreJours} / 365) = ${this.formatNum(this.u.resultat)} DT`;
    } else {
      this.u.resultat = null;
      this.u.formule = '';
    }
  }

  sauvegarderTauxUnique(): void {
    if (!this.u.montant || !this.u.taux || !this.u.dateDebut || !this.u.dateFin) return;
    this.u.loading = true;
    this.u.error = '';
    this.u.success = false;

    this.calculService.calculerTauxUnique({
      montant: this.u.montant,
      dateDebut: this.u.dateDebut,
      dateFin: this.u.dateFin,
      taux: this.u.taux,
      moduleErp: this.u.moduleErp,
      libelle: this.u.libelle,
      userId: this.currentUserId || undefined
    }).subscribe(res => {
      this.u.loading = false;
      if (res.success) {
        this.u.success = true;
        this.u.resultat = res.calcul.resultatTotal;
        this.u.lastSavedCalcul = res.calcul;
        this.loadHistoriqueUnique();
      } else {
        this.u.error = res.message;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MODE 2 — TAUX VARIABLES
  // ═══════════════════════════════════════════════════════════════════════

  simuler(): void {
    if (!this.v.montant || !this.v.dateDebut || !this.v.dateFin) return;
    this.v.simulating = true;
    this.v.error = '';
    this.v.lignes = [];
    this.v.resultatTotal = null;

    this.calculService.simulerTauxVariable(this.v.montant, this.v.dateDebut, this.v.dateFin)
      .subscribe(res => {
        this.v.simulating = false;
        if (res.success) {
          this.v.lignes = res.lignes;
          this.v.resultatTotal = res.resultatTotal;
          this.v.nombreJoursTotal = res.nombreJoursTotal;
          this.v.nbPeriodes = res.nbPeriodes;
        } else {
          this.v.error = 'Aucune période configurée pour cette plage. Vérifiez la configuration.';
          this.v.errorCode = 'PERIODES_MANQUANTES';
        }
      });
  }

  // ─── Recalcul en temps réel quand l'utilisateur modifie une ligne ─────────
  recalcFromEdit(): void {
    let total = 0;
    let joursTotal = 0;
    this.v.lignes = this.v.lignes.map(l => {
      const res = (this.v.montant || 0) * (l.taux / 100) * (l.nombreJours / 365);
      const rounded = Math.round(res * 1000) / 1000;
      total += rounded;
      joursTotal += Number(l.nombreJours);
      return { ...l, resultatLigne: rounded, montantBase: this.v.montant || 0 };
    });
    this.v.resultatTotal = Math.round(total * 1000) / 1000;
    this.v.nombreJoursTotal = joursTotal;
    this.v.nbPeriodes = this.v.lignes.length;
  }

  sauvegarderTauxVariable(): void {
    if (!this.v.montant || !this.v.dateDebut || !this.v.dateFin) return;
    this.v.loading = true;
    this.v.error = '';

    this.calculService.calculerTauxVariable({
      montant: this.v.montant,
      dateDebut: this.v.dateDebut,
      dateFin: this.v.dateFin,
      moduleErp: this.v.moduleErp,
      libelle: this.v.libelle,
      userId: this.currentUserId || undefined
    }).subscribe(res => {
      this.v.loading = false;
      if (res.success) {
        this.v.success = true;
        this.v.lastCalculId = res.calcul.id;
        this.v.lastSavedCalcul = res.calcul;
        this.v.lastSavedLignes = [...this.v.lignes];
        this.loadHistoriqueVariable();
      } else {
        this.v.error = res.message;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HISTORIQUE TAUX UNIQUE (séparé)
  // ═══════════════════════════════════════════════════════════════════════

  loadHistoriqueUnique(): void {
    this.hu.loading = true;
    this.calculService.getHistoriqueParType(this.hu.currentPage, this.hu.pageSize, 'TAUX_UNIQUE', this.hu.q || undefined)
      .subscribe(res => {
        this.hu.calculs = res.content || [];
        this.hu.totalElements = res.totalElements;
        this.hu.totalPages = res.totalPages;
        this.hu.currentPage = res.currentPage;
        this.hu.loading = false;
      });
  }

  voirDetailUnique(calcul: CalculMoteur): void {
    this.hu.selectedCalcul = calcul;
    this.hu.showDetail = true;
  }

  fermerDetailUnique(): void {
    this.hu.showDetail = false;
    this.hu.selectedCalcul = null;
  }

  changerPageUnique(page: number): void {
    this.hu.currentPage = page;
    this.loadHistoriqueUnique();
  }

  supprimerCalculUnique(id: number): void {
    if (!confirm('Supprimer ce calcul de l\'historique ?')) return;
    this.calculService.supprimer(id).subscribe(() => this.loadHistoriqueUnique());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HISTORIQUE TAUX VARIABLES (séparé)
  // ═══════════════════════════════════════════════════════════════════════

  loadHistoriqueVariable(): void {
    this.hv.loading = true;
    this.calculService.getHistoriqueParType(this.hv.currentPage, this.hv.pageSize, 'TAUX_VARIABLE', this.hv.q || undefined)
      .subscribe(res => {
        this.hv.calculs = res.content || [];
        this.hv.totalElements = res.totalElements;
        this.hv.totalPages = res.totalPages;
        this.hv.currentPage = res.currentPage;
        this.hv.loading = false;
      });
  }

  voirDetailVariable(calcul: CalculMoteur): void {
    this.hv.selectedCalcul = calcul;
    this.hv.showDetail = true;
    this.calculService.getLignes(calcul.id).subscribe(lignes => {
      this.hv.selectedLignes = lignes;
    });
  }

  fermerDetailVariable(): void {
    this.hv.showDetail = false;
    this.hv.selectedCalcul = null;
    this.hv.selectedLignes = [];
  }

  changerPageVariable(page: number): void {
    this.hv.currentPage = page;
    this.loadHistoriqueVariable();
  }

  supprimerCalculVariable(id: number): void {
    if (!confirm('Supprimer ce calcul de l\'historique ?')) return;
    this.calculService.supprimer(id).subscribe(() => this.loadHistoriqueVariable());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN PÉRIODES & TAUX (SuperAdmin uniquement)
  // ═══════════════════════════════════════════════════════════════════════

  loadPeriodes(): void {
    this.a.loading = true;
    this.calculService.getPeriodes().subscribe(periodes => {
      this.a.periodes = periodes;
      this.a.loading = false;
    });
  }

  ouvrirFormulaire(periode?: PeriodeTaux): void {
    this.a.showForm = true;
    this.a.error = '';
    this.a.success = '';
    if (periode) {
      this.a.editingId = periode.id || null;
      this.a.form = {
        dateDebut: periode.dateDebut,
        dateFin: periode.dateFin,
        taux: periode.taux,
        libelle: periode.libelle || ''
      };
    } else {
      this.a.editingId = null;
      this.a.form = { dateDebut: '', dateFin: '', taux: null, libelle: '' };
    }
  }

  sauvegarderPeriode(): void {
    if (!this.a.form.dateDebut || !this.a.form.dateFin || this.a.form.taux == null) return;
    const payload = { ...this.a.form, taux: this.a.form.taux ?? undefined };
    const obs = this.a.editingId
      ? this.calculService.modifierPeriode(this.a.editingId, payload)
      : this.calculService.creerPeriode(payload);

    obs.subscribe((res: any) => {
      if (res.success) {
        this.a.success = res.message;
        this.a.showForm = false;
        this.loadPeriodes();
      } else {
        this.a.error = res.message;
      }
    });
  }

  togglePeriode(id: number): void {
    this.calculService.togglePeriode(id).subscribe(() => this.loadPeriodes());
  }

  supprimerPeriode(id: number): void {
    if (!confirm('Supprimer définitivement cette période ?')) return;
    this.calculService.supprimerPeriode(id).subscribe(() => this.loadPeriodes());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT PDF — Taux Unique (rapport sans formule)
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Génère un PDF via HTML+Print (sans dépendance externe) ────────────
  private openPrintWindow(htmlContent: string): void {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Veuillez autoriser les popups pour exporter le rapport.'); return; }
    win.document.write(htmlContent);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  }

  private getPrintStyles(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Inter',Arial,sans-serif; font-size:10pt; color:#1e293b; background:#fff; }
      .header { background:#0f172a; padding:18px 24px 14px; display:flex; justify-content:space-between; align-items:center; margin:-20px -20px 24px; }
      .brand { color:#f97316; font-size:18pt; font-weight:900; letter-spacing:-0.02em; }
      .subtitle { color:#94a3b8; font-size:9pt; margin-top:2px; }
      .header-right { text-align:right; }
      .ref-tag { color:#f97316; font-size:9pt; font-weight:700; font-family:monospace; }
      .gen-date { color:#64748b; font-size:8pt; margin-top:3px; }
      .report-title { font-size:14pt; font-weight:800; color:#0f172a; margin-bottom:4px; letter-spacing:-0.01em; }
      .divider { height:3px; background:linear-gradient(90deg,#f97316,#3b82f6,transparent); border-radius:2px; margin:6px 0 18px; }
      h2 { font-size:9pt; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.07em; margin:18px 0 8px; display:flex; align-items:center; gap:6px; }
      h2::before { content:''; display:inline-block; width:3px; height:13px; background:#f97316; border-radius:2px; }
      table { width:100%; border-collapse:collapse; font-size:9pt; }
      th { background:#0f172a; color:#fff; padding:8px 11px; text-align:left; font-size:8pt; text-transform:uppercase; letter-spacing:0.06em; font-weight:700; }
      th:first-child { border-radius:6px 0 0 0; } th:last-child { border-radius:0 6px 0 0; }
      td { padding:8px 11px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
      tr:last-child td { border-bottom:none; }
      tr.alt td { background:#f8fafc; }
      .label { color:#64748b; font-size:9pt; }
      .val { font-weight:700; text-align:right; color:#0f172a; }
      .result-box { background:#0f172a; border-radius:12px; padding:18px 24px; margin:20px 0 8px; display:flex; justify-content:space-between; align-items:center; }
      .result-label { color:#94a3b8; font-size:8pt; text-transform:uppercase; letter-spacing:0.1em; font-weight:700; }
      .result-currency { color:#64748b; font-size:7.5pt; margin-top:3px; }
      .result-amount { color:#f97316; font-size:24pt; font-weight:900; letter-spacing:-0.02em; }
      .taux-cell { color:#c2410c; font-weight:700; background:linear-gradient(135deg,#fff7ed,#ffedd5); padding:2px 8px; border-radius:5px; display:inline-block; font-size:8.5pt; }
      .res-cell { color:#f97316; font-weight:800; }
      .footer { margin-top:22px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; color:#94a3b8; font-size:7.5pt; }
      .badge { display:inline-block; padding:2px 9px; border-radius:99px; font-size:7.5pt; font-weight:700; }
      .badge-orange { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
      .badge-purple { background:#f5f3ff; color:#7c3aed; border:1px solid #ddd6fe; }
      .info-note { background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 14px; font-size:8pt; color:#1d4ed8; margin:10px 0; }
      @media print {
        body { padding:0; font-size:9.5pt; }
        .header { margin:0 0 16px; }
        @page { margin:1cm 1.2cm; size:A4; }
        table { page-break-inside:auto; }
        tr { page-break-inside:avoid; }
      }`;
  }

  exportPdfTauxUnique(type: 'detail' | 'simple'): void {
    if (!this.u.resultat || !this.u.montant) return;
    this.exportLoading = true;
    const ref = this.u.lastSavedCalcul?.reference || '';
    const titre = type === 'detail' ? 'RAPPORT DÉTAILLÉ — CALCUL TAUX UNIQUE' : 'RAPPORT SIMPLIFIÉ — RÉSULTAT';
    const date = new Date().toLocaleDateString('fr-TN') + ' à ' + new Date().toLocaleTimeString('fr-TN');

    let paramsHtml = '';
    const params: [string, string][] = [
      ['Montant de base', `${this.formatNum(this.u.montant)} DT`],
      ['Date de début', this.formatDate(this.u.dateDebut)],
      ['Date de fin', this.formatDate(this.u.dateFin)],
      ['Nombre de jours', `${this.u.nombreJours} jours`],
      ['Taux annuel appliqué', `<span class="taux-cell">${this.u.taux} %</span>`],
      ['Module ERP', this.u.moduleErp],
      ['Libellé', this.u.libelle || '—'],
    ];
    const simpleParams: [string, string][] = [
      ['Montant de base', `${this.formatNum(this.u.montant)} DT`],
      ['Période', `${this.formatDate(this.u.dateDebut)} → ${this.formatDate(this.u.dateFin)}`],
      ['Durée', `${this.u.nombreJours} jours`],
      ['Module ERP', this.u.moduleErp],
    ];
    const rows = type === 'detail' ? params : simpleParams;
    rows.forEach(([l, v], i) => {
      paramsHtml += `<tr class="${i%2===1?'alt':''}"><td class="label">${l}</td><td class="val">${v}</td></tr>`;
    });

    const noteHtml = type === 'simple'
      ? `<div class="info-note">📋 Ce rapport simplifié présente uniquement le résultat final. Consultez le rapport détaillé pour les paramètres complets.</div>` : '';

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport ${titre}</title>
      <style>${this.getPrintStyles()}</style></head>
      <body style="padding:20px">
        <div class="header">
          <div><div class="brand">⚡ BENJEDDOU ERP</div><div class="subtitle">Moteur de Calcul — ${titre}</div></div>
          <div class="header-right">${ref?`<div class="ref-tag">Réf: ${ref}</div>`:''}<div class="gen-date">Généré le ${date}</div></div>
        </div>
        <div class="report-title">${titre}</div>
        <div class="divider"></div>
        ${noteHtml}
        <h2>Paramètres du calcul</h2>
        <table><tbody>${paramsHtml}</tbody></table>
        <div class="result-box">
          <div><div class="result-label">Résultat Final</div><div class="result-currency">Dinars Tunisiens (DT)</div></div>
          <div class="result-amount">${this.formatNum(this.u.resultat!)} DT</div>
        </div>
        <div class="footer">
          <span>Document confidentiel — BENJEDDOU ERP SaaS © 2026</span>
          <span>Usage interne uniquement</span>
        </div>
      </body></html>`;

    this.openPrintWindow(html);
    this.exportLoading = false;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT PDF — Taux Variables (avec tableau périodes)
  // ═══════════════════════════════════════════════════════════════════════



  exportPdfTauxVariable(type: 'detail' | 'simple'): void {
    if (!this.v.resultatTotal) return;
    this.exportLoading = true;
    const ref = this.v.lastSavedCalcul?.reference || '';
    const titre = type === 'detail' ? 'RAPPORT DÉTAILLÉ — TAUX VARIABLES' : 'RAPPORT SIMPLIFIÉ — RÉSULTAT GLOBAL';
    const date = new Date().toLocaleDateString('fr-TN') + ' à ' + new Date().toLocaleTimeString('fr-TN');

    const infoRows: [string, string][] = [
      ['Montant de base', `${this.formatNum(this.v.montant)} DT`],
      ['Période globale', `${this.formatDate(this.v.dateDebut)} → ${this.formatDate(this.v.dateFin)}`],
      ['Nombre total de jours', `${this.v.nombreJoursTotal} jours`],
      ['Nombre de périodes', `${this.v.nbPeriodes} période(s)`],
      ['Module ERP', this.v.moduleErp],
      ['Libellé', this.v.libelle || '—'],
    ];
    let paramsHtml = '';
    infoRows.forEach(([l, v], i) => {
      paramsHtml += `<tr class="${i%2===1?'alt':''}"><td class="label">${l}</td><td class="val">${v}</td></tr>`;
    });

    let lignesHtml = '';
    if (type === 'detail' && this.v.lignes.length > 0) {
      let rows = '';
      this.v.lignes.forEach((l, i) => {
        // CDC : La formule de calcul ne doit JAMAIS apparaître dans le rapport
        rows += `<tr class="${i%2===1?'alt':''}"><td>${l.numeroLigne}</td>
          <td>${this.formatDate(l.dateDebut)} → ${this.formatDate(l.dateFin)}</td>
          <td style="text-align:center">${l.nombreJours} j</td>
          <td><span class="taux-cell">${l.taux}%</span></td>
          <td class="res-cell">${this.formatNum(l.resultatLigne)} DT</td></tr>`;
      });
      lignesHtml = `<h2>Détail par période</h2>
        <table>
          <thead><tr><th>#</th><th>Période</th><th>Nb jours</th><th>Taux appliqué</th><th>Résultat</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    const noteHtml = type === 'simple'
      ? `<div class="info-note">📋 Rapport simplifié — résultat global uniquement. Consultez le rapport détaillé pour le tableau des périodes.</div>` : '';

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport ${titre}</title>
      <style>${this.getPrintStyles()}</style></head>
      <body style="padding:20px">
        <div class="header">
          <div><div class="brand">⚡ BENJEDDOU ERP</div><div class="subtitle">Moteur de Calcul — ${titre}</div></div>
          <div class="header-right">${ref?`<div class="ref-tag">Réf: ${ref}</div>`:''}<div class="gen-date">Généré le ${date}</div></div>
        </div>
        <div class="report-title">${titre}</div>
        <div class="divider"></div>
        ${noteHtml}
        <h2>Paramètres du calcul</h2>
        <table><tbody>${paramsHtml}</tbody></table>
        ${lignesHtml}
        <div class="result-box">
          <div><div class="result-label">Résultat Total Global</div><div class="result-currency">Dinars Tunisiens (DT)</div></div>
          <div class="result-amount">${this.formatNum(this.v.resultatTotal!)} DT</div>
        </div>
        <div class="footer">
          <span>Document confidentiel — BENJEDDOU ERP SaaS © 2026</span>
          <span>Usage interne uniquement</span>
        </div>
      </body></html>`;

    this.openPrintWindow(html);
    this.exportLoading = false;
  }


  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT WORD (.docx) — Taux Unique
  // ═══════════════════════════════════════════════════════════════════════


  exportWordTauxUnique(type: 'detail' | 'simple'): void {
    if (!this.u.resultat || !this.u.montant) return;
    this.exportLoading = true;

    const dateGeneration = new Date().toLocaleDateString('fr-TN');
    const ref = this.u.lastSavedCalcul?.reference || 'Non sauvegardé';
    const titre = type === 'detail' ? 'RAPPORT DÉTAILLÉ — CALCUL DE TAUX' : 'RAPPORT SIMPLIFIÉ — RÉSULTAT';

    let content = `
BENJEDDOU ERP — MOTEUR DE CALCUL
${titre}
Référence : ${ref}
Date de génération : ${dateGeneration}
================================================================

PARAMÈTRES DU CALCUL
${type === 'detail' ? `
Montant de base     : ${this.formatNum(this.u.montant)} DT
Date de début       : ${this.formatDate(this.u.dateDebut)}
Date de fin         : ${this.formatDate(this.u.dateFin)}
Nombre de jours     : ${this.u.nombreJours} jours
Taux annuel         : ${this.u.taux} %
Module ERP          : ${this.u.moduleErp}
Libellé             : ${this.u.libelle || '—'}
` : `
Montant de base     : ${this.formatNum(this.u.montant)} DT
Période             : ${this.formatDate(this.u.dateDebut)} → ${this.formatDate(this.u.dateFin)}
Durée               : ${this.u.nombreJours} jours
Module ERP          : ${this.u.moduleErp}
`}

================================================================
RÉSULTAT FINAL : ${this.formatNum(this.u.resultat!)} DT (Dinars Tunisiens)
================================================================

Document confidentiel — BENJEDDOU ERP SaaS © 2026
`;

    this.downloadTextAsWord(content, `rapport-taux-unique-${type}-${new Date().toISOString().slice(0,10)}.doc`);
    this.exportLoading = false;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT WORD (.docx) — Taux Variables
  // ═══════════════════════════════════════════════════════════════════════

  exportWordTauxVariable(type: 'detail' | 'simple'): void {
    if (!this.v.resultatTotal) return;
    this.exportLoading = true;

    const dateGeneration = new Date().toLocaleDateString('fr-TN');
    const ref = this.v.lastSavedCalcul?.reference || 'Non sauvegardé';
    const titre = type === 'detail' ? 'RAPPORT DÉTAILLÉ — CALCUL MULTI-PÉRIODES' : 'RAPPORT SIMPLIFIÉ — RÉSULTAT GLOBAL';

    let lignesStr = '';
    if (type === 'detail') {
      lignesStr = '\nDÉTAIL PAR PÉRIODE\n';
      lignesStr += '─'.repeat(70) + '\n';
      lignesStr += `${'#'.padEnd(4)} ${'Période'.padEnd(30)} ${'Jours'.padEnd(8)} ${'Taux'.padEnd(8)} ${'Résultat'.padEnd(15)}\n`;
      lignesStr += '─'.repeat(70) + '\n';
      this.v.lignes.forEach(l => {
        lignesStr += `${String(l.numeroLigne).padEnd(4)} `;
        lignesStr += `${(this.formatDate(l.dateDebut)+' → '+this.formatDate(l.dateFin)).padEnd(30)} `;
        lignesStr += `${String(l.nombreJours)+'j'.padEnd(8)} `;
        lignesStr += `${(l.taux+'%').padEnd(8)} `;
        lignesStr += `${this.formatNum(l.resultatLigne)+' DT'}\n`;
      });
    }

    const content = `
BENJEDDOU ERP — MOTEUR DE CALCUL
${titre}
Référence : ${ref}
Date de génération : ${dateGeneration}
================================================================

PARAMÈTRES DU CALCUL
Montant de base        : ${this.formatNum(this.v.montant)} DT
Période globale        : ${this.formatDate(this.v.dateDebut)} → ${this.formatDate(this.v.dateFin)}
Nombre total de jours  : ${this.v.nombreJoursTotal} jours
Nombre de périodes     : ${this.v.nbPeriodes}
Module ERP             : ${this.v.moduleErp}
Libellé                : ${this.v.libelle || '—'}

${lignesStr}
================================================================
RÉSULTAT TOTAL GLOBAL : ${this.formatNum(this.v.resultatTotal!)} DT (Dinars Tunisiens)
================================================================

Document confidentiel — BENJEDDOU ERP SaaS © 2026
`;

    this.downloadTextAsWord(content, `rapport-taux-variables-${type}-${new Date().toISOString().slice(0,10)}.doc`);
    this.exportLoading = false;
  }

  private downloadTextAsWord(content: string, filename: string): void {
    // HTML Word format (compatible Microsoft Word)
    const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>BENJEDDOU ERP — Rapport</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; margin: 2cm; color: #1e293b; }
    h1 { color: #f97316; font-size: 16pt; border-bottom: 2px solid #f97316; padding-bottom: 8px; }
    h2 { color: #0f172a; font-size: 12pt; margin-top: 20px; }
    .header { background-color: #0f172a; color: white; padding: 15px 20px; margin: -2cm -2cm 20px -2cm; }
    .header-brand { color: #f97316; font-size: 18pt; font-weight: bold; }
    .header-sub { color: #94a3b8; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
    th { background-color: #0f172a; color: white; padding: 8px 10px; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background-color: #f8fafc; }
    .result-box { background-color: #0f172a; color: white; padding: 15px 20px; margin: 15px 0; }
    .result-amount { color: #f97316; font-size: 22pt; font-weight: bold; }
    .result-label { color: #94a3b8; font-size: 9pt; }
    .footer { color: #94a3b8; font-size: 8pt; border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 8px; }
    .ref { color: #f97316; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-brand">⚡ BENJEDDOU ERP</div>
    <div class="header-sub">Moteur de Calcul — Rapport Officiel</div>
  </div>
  <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${content}</pre>
  <div class="footer">Document confidentiel — BENJEDDOU ERP SaaS © 2026 — Usage interne uniquement</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // IMPRESSION DIRECTE (Print)
  // ═══════════════════════════════════════════════════════════════════════

  printTauxUnique(): void {
    if (!this.u.resultat || !this.u.montant) return;
    const ref = this.u.lastSavedCalcul?.reference || '';
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(this.buildPrintHtml(
      'Taux Unique',
      ref,
      [
        ['Montant de base', `${this.formatNum(this.u.montant)} DT`],
        ['Date de début', this.formatDate(this.u.dateDebut)],
        ['Date de fin', this.formatDate(this.u.dateFin)],
        ['Nombre de jours', `${this.u.nombreJours} jours`],
        ['Taux annuel', `${this.u.taux} %`],
        ['Module ERP', this.u.moduleErp],
        ['Libellé', this.u.libelle || '—'],
      ],
      this.formatNum(this.u.resultat!),
      null
    ));
    win.document.close();
    win.print();
  }

  printTauxVariable(): void {
    if (!this.v.resultatTotal) return;
    const ref = this.v.lastSavedCalcul?.reference || '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(this.buildPrintHtml(
      'Taux Variables',
      ref,
      [
        ['Montant de base', `${this.formatNum(this.v.montant)} DT`],
        ['Période globale', `${this.formatDate(this.v.dateDebut)} → ${this.formatDate(this.v.dateFin)}`],
        ['Nombre total de jours', `${this.v.nombreJoursTotal} jours`],
        ['Nombre de périodes', `${this.v.nbPeriodes}`],
        ['Module ERP', this.v.moduleErp],
        ['Libellé', this.v.libelle || '—'],
      ],
      this.formatNum(this.v.resultatTotal!),
      this.v.lignes
    ));
    win.document.close();
    win.print();
  }

  private buildPrintHtml(
    type: string,
    ref: string,
    params: [string, string][],
    resultat: string,
    lignes: LigneCalcul[] | null
  ): string {
    const lignesHtml = lignes && lignes.length > 0 ? `
      <h2 style="color:#0f172a;font-size:13pt;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
        Détail par période
      </h2>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Période</th><th>Jours</th><th>Taux</th><th>Résultat</th>
          </tr>
        </thead>
        <tbody>
          ${lignes.map((l, i) => `
          <tr style="${i%2===0?'background:#f8fafc':''}">
            <td>${l.numeroLigne}</td>
            <td>${this.formatDate(l.dateDebut)} → ${this.formatDate(l.dateFin)}</td>
            <td>${l.nombreJours} j</td>
            <td>${l.taux}%</td>
            <td style="font-weight:bold;color:#f97316">${this.formatNum(l.resultatLigne)} DT</td>
          </tr>`).join('')}
        </tbody>
      </table>` : '';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>BENJEDDOU ERP — Rapport ${type}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #1e293b; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 16px 22px; margin: -20px -20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .brand { color: #f97316; font-size: 18pt; font-weight: 900; }
    .subtitle { color: #94a3b8; font-size: 9pt; margin-top: 3px; }
    .ref { color: #f97316; font-size: 9pt; font-weight: bold; }
    h1 { color: #0f172a; font-size: 13pt; margin-bottom: 4px; }
    .divider { height: 2px; background: linear-gradient(90deg, #f97316, #3b82f6); margin: 6px 0 16px; border-radius: 2px; }
    h2 { color: #0f172a; font-size: 11pt; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th { background: #0f172a; color: white; padding: 7px 10px; text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
    .label { color: #64748b; }
    .val { font-weight: 600; text-align: right; }
    .result-box { background: #0f172a; color: white; padding: 16px 22px; margin: 20px 0; display: flex; align-items: center; justify-content: space-between; border-radius: 8px; }
    .res-label { color: #94a3b8; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.1em; }
    .res-amount { color: #f97316; font-size: 24pt; font-weight: 900; }
    .res-currency { color: #64748b; font-size: 8pt; margin-top: 2px; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 7.5pt; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 0; }
      .header { margin: 0 0 16px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">⚡ BENJEDDOU ERP</div>
      <div class="subtitle">Moteur de Calcul — Rapport ${type}</div>
    </div>
    <div style="text-align:right">
      ${ref ? `<div class="ref">Réf: ${ref}</div>` : ''}
      <div style="color:#94a3b8;font-size:8pt">${new Date().toLocaleDateString('fr-TN')} ${new Date().toLocaleTimeString('fr-TN')}</div>
    </div>
  </div>

  <h1>Rapport — Calcul ${type}</h1>
  <div class="divider"></div>

  <h2>Paramètres du calcul</h2>
  <table>
    <tbody>
      ${params.map(([label, val], i) => `
      <tr style="${i%2===0?'background:#f8fafc':''}">
        <td class="label">${label}</td>
        <td class="val">${val}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  ${lignesHtml}

  <div class="result-box">
    <div>
      <div class="res-label">Résultat Final</div>
      <div class="res-currency">Dinars Tunisiens (DT)</div>
    </div>
    <div style="text-align:right">
      <div class="res-amount">${resultat} DT</div>
    </div>
  </div>

  <div class="footer">
    <span>Document confidentiel — BENJEDDOU ERP SaaS © 2026</span>
    <span>Usage interne uniquement</span>
  </div>
</body>
</html>`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT PDF — depuis l'historique
  // ═══════════════════════════════════════════════════════════════════════

  exportPdfFromHistorique(calcul: CalculMoteur, lignes: LigneCalcul[]): void {
    this.exportLoading = true;
    const date = new Date().toLocaleDateString('fr-TN') + ' à ' + new Date().toLocaleTimeString('fr-TN');
    const typeLabel = calcul.typeCalcul === 'TAUX_UNIQUE' ? 'Taux Unique' : 'Taux Variables';
    const badgeClass = calcul.typeCalcul === 'TAUX_UNIQUE' ? 'badge-orange' : 'badge-purple';

    const params: [string, string][] = [
      ['Référence', `<span style="font-family:monospace;font-weight:700;color:#f97316">${calcul.reference}</span>`],
      ['Type de calcul', `<span class="badge ${badgeClass}">${typeLabel}</span>`],
      ['Montant de base', `${this.formatNum(calcul.montant)} DT`],
      ['Période', `${this.formatDate(calcul.dateDebut)} → ${this.formatDate(calcul.dateFin)}`],
      ['Nombre de jours', `${calcul.nombreJours} jours`],
      ...(calcul.tauxUnique ? [['Taux unique', `<span class="taux-cell">${calcul.tauxUnique}%</span>`] as [string,string]] : []),
      ['Module ERP', calcul.moduleErp],
      ['Libellé', calcul.libelle || '—'],
      ['Créé le', this.formatDate(calcul.dateCreation)],
    ];
    let paramsHtml = '';
    params.forEach(([l, v], i) => {
      paramsHtml += `<tr class="${i%2===1?'alt':''}"><td class="label">${l}</td><td class="val">${v}</td></tr>`;
    });

    let lignesHtml = '';
    if (lignes.length > 0) {
      let rows = '';
      lignes.forEach((l, i) => {
        // CDC : La formule ne doit jamais apparaître dans le rapport
        rows += `<tr class="${i%2===1?'alt':''}"><td>${l.numeroLigne}</td>
          <td>${this.formatDate(l.dateDebut)} → ${this.formatDate(l.dateFin)}</td>
          <td style="text-align:center">${l.nombreJours} j</td>
          <td><span class="taux-cell">${l.taux}%</span></td>
          <td class="res-cell">${this.formatNum(l.resultatLigne)} DT</td></tr>`;
      });
      lignesHtml = `<h2>Détail par période</h2>
        <table>
          <thead><tr><th>#</th><th>Période</th><th>Nb jours</th><th>Taux appliqué</th><th>Résultat</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport ${calcul.reference}</title>
      <style>${this.getPrintStyles()}</style></head>
      <body style="padding:20px">
        <div class="header">
          <div><div class="brand">⚡ BENJEDDOU ERP</div><div class="subtitle">Moteur de Calcul — Rapport depuis Historique</div></div>
          <div class="header-right"><div class="ref-tag">Réf: ${calcul.reference}</div><div class="gen-date">Généré le ${date}</div></div>
        </div>
        <div class="report-title">RAPPORT — CALCUL ${typeLabel.toUpperCase()}</div>
        <div class="divider"></div>
        <h2>Informations du calcul</h2>
        <table><tbody>${paramsHtml}</tbody></table>
        ${lignesHtml}
        <div class="result-box">
          <div><div class="result-label">Résultat Total</div><div class="result-currency">Dinars Tunisiens (DT)</div></div>
          <div class="result-amount">${this.formatNum(calcul.resultatTotal)} DT</div>
        </div>
        <div class="footer">
          <span>Document confidentiel — BENJEDDOU ERP SaaS © 2026</span>
          <span>Usage interne uniquement</span>
        </div>
      </body></html>`;

    this.openPrintWindow(html);
    this.exportLoading = false;
  }

  // ─── Export PDF depuis historique taux variables (charge les lignes depuis la BDD) ─
  exportPdfVariableFromHistorique(calcul: CalculMoteur, type: 'detail' | 'simple'): void {
    this.hvExportingId = calcul.id;
    this.calculService.getLignes(calcul.id).subscribe(lignes => {
      this.hvExportingId = null;
      if (type === 'detail') {
        this.exportPdfFromHistorique(calcul, lignes);
      } else {
        // Rapport simplifié : aucune ligne, juste infos globales
        this.exportPdfFromHistorique(calcul, []);
      }
    });
  }

  // ─── Export Word depuis historique taux variables ───────────────────────────
  exportWordVariableFromHistorique(calcul: CalculMoteur, type: 'detail' | 'simple'): void {
    this.hvExportingId = calcul.id;
    this.calculService.getLignes(calcul.id).subscribe(lignes => {
      this.hvExportingId = null;
      const titre = type === 'detail' ? 'RAPPORT DÉTAILLÉ — CALCUL MULTI-PÉRIODES' : 'RAPPORT SIMPLIFIÉ — RÉSULTAT GLOBAL';
      const ref = calcul.reference || '';
      const dateGen = new Date().toLocaleDateString('fr-TN');

      let lignesStr = '';
      if (type === 'detail' && lignes.length > 0) {
        lignesStr = '\nDÉTAIL PAR PÉRIODE\n' + '─'.repeat(60) + '\n';
        lignesStr += '#    Période                          Jours   Taux     Résultat\n';
        lignesStr += '─'.repeat(60) + '\n';
        lignes.forEach(l => {
          // CDC : Pas de formule dans le rapport
          lignesStr += `${String(l.numeroLigne).padEnd(5)}`;
          lignesStr += `${(this.formatDate(l.dateDebut)+' → '+this.formatDate(l.dateFin)).padEnd(33)}`;
          lignesStr += `${String(l.nombreJours+'j').padEnd(8)}`;
          lignesStr += `${(l.taux+'%').padEnd(9)}`;
          lignesStr += `${this.formatNum(l.resultatLigne)} DT\n`;
        });
      }

      const content = `BENJEDDOU ERP — MOTEUR DE CALCUL\n${titre}\nRéférence : ${ref}\nDate : ${dateGen}\n${'='.repeat(60)}\n\nPARAMÈTRES\nMontant de base        : ${this.formatNum(calcul.montant)} DT\nPériode globale        : ${this.formatDate(calcul.dateDebut)} → ${this.formatDate(calcul.dateFin)}\nNombre total de jours  : ${calcul.nombreJours} jours\nModule ERP             : ${calcul.moduleErp}\nLibellé                : ${calcul.libelle || '—'}\n\n${lignesStr}\n${'='.repeat(60)}\nRÉSULTAT TOTAL GLOBAL : ${this.formatNum(calcul.resultatTotal)} DT\n${'='.repeat(60)}\n\nDocument confidentiel — BENJEDDOU ERP SaaS © 2026`;

      this.downloadTextAsWord(content, `rapport-variables-${type}-${calcul.reference}-${new Date().toISOString().slice(0,10)}.doc`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════════════════

  formatNum(n: number | null | undefined): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get pagesArrayUnique(): number[] {
    return Array.from({ length: this.hu.totalPages }, (_, i) => i);
  }

  get pagesArrayVariable(): number[] {
    return Array.from({ length: this.hv.totalPages }, (_, i) => i);
  }

  getModuleBadge(m: string): string {
    const map: Record<string, string> = {
      FINANCE: 'badge-blue', RH: 'badge-green', COMPTABILITE: 'badge-purple',
      TRESORERIE: 'badge-cyan', VENTES: 'badge-orange', ACHATS: 'badge-red',
      INVESTISSEMENTS: 'badge-indigo', CONTRATS: 'badge-gray', GENERAL: 'badge-slate'
    };
    return map[m] || 'badge-slate';
  }

  resetUnique(): void {
    this.u = { ...this.u, montant: null, dateDebut: '', dateFin: '', taux: null, libelle: '', nombreJours: 0, resultat: null, formule: '', success: false, error: '', lastSavedCalcul: null };
  }

  resetVariable(): void {
    this.v = { ...this.v, montant: null, dateDebut: '', dateFin: '', libelle: '', lignes: [], resultatTotal: null, nombreJoursTotal: 0, nbPeriodes: 0, success: false, error: '', lastSavedCalcul: null, lastSavedLignes: [] };
  }

  // ── Getter pour compatibilité template legacy
  get h() { return this.hu; }
}
