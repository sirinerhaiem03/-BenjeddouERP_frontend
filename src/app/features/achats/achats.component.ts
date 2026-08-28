import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ExportService } from '../../core/services/export.service';
import { PermissionService } from '../../core/services/permission.service';
import { AppPermissionDirective } from '../../shared/directives/app-permission.directive';
Chart.register(...registerables);


import { NombreLettresPipe } from '../../shared/pipes/nombre-lettres.pipe';

@Component({
  selector: 'app-achats',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DecimalPipe, DatePipe, TranslateModule, AppPermissionDirective, NombreLettresPipe],
  templateUrl: './achats.component.html',
  styleUrls: ['./achats.component.css']
})
export class AchatsComponent implements OnInit, OnDestroy, AfterViewInit {


  activeTab: string = 'dashboard';

  // ── Data ──
  commandes: any[] = [];
  commandesFiltrees: any[] = [];
  receptions: any[] = [];
  receptionsFiltrees: any[] = [];
  fournisseurs: any[] = [];
  produits: any[] = [];
  entrepots: any[] = [];

  // ── KPIs ──
  kpis: any = {
    totalDepenses: 0,
    bonsEnAttente: 0,
    fournisseursActifs: 0,
    receptionsCeMois: 0,
    totalCommandes: 0,
    totalReceptions: 0
  };

  // ── Filtres ──
  commandeSearch: string = '';
  commandeStatutFilter: string = '';
  receptionSearch: string = '';

  // ── Modales ──
  showCommandeModal: boolean = false;
  showReceptionModal: boolean = false;
  showDeleteModal: boolean = false;
  showDetailModal: boolean = false;

  // ── Rôle utilisateur ──
  get isAdmin(): boolean {
    const stored = localStorage.getItem('currentUser');
    const user = stored ? JSON.parse(stored) : null;
    return user?.roles?.includes('ROLE_ADMIN') || user?.role === 'ADMIN';
  }

  selectedCommande: any = null;
  commandeDetail: any = null;

  // ── Formulaires ──
  commandeForm: any = {
    fournisseurId: null,
    notes: '',
    lignes: [{ produitId: null, designation: '', quantite: 1, prixUnitaire: 0 }]
  };

  receptionForm: any = {
    commandeAchatId: null,
    produitId: null,
    entrepotId: null,
    quantiteCommandee: 0,
    quantiteRecue: 0,
    statut: 'CONFORME',
    observations: ''
  };

  // ── État ──
  loading: boolean = false;
  isSubmitting: boolean = false;  // garde anti-double-clic
  successMsg: string = '';
  errorMsg: string = '';
  private msgTimer: any;

  private baseUrl = 'http://localhost:9090/api';

  // ── Chart.js instances ──
  private chartStatut: Chart | null = null;
  private chartFournisseur: Chart | null = null;

  constructor(private http: HttpClient, public router: Router, private exportService: ExportService, public permissionService: PermissionService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    // Les graphiques sont construits après chargement des données
  }

  ngOnDestroy(): void {
    if (this.msgTimer) clearTimeout(this.msgTimer);
    if (this.chartStatut)     { this.chartStatut.destroy();     this.chartStatut = null; }
    if (this.chartFournisseur){ this.chartFournisseur.destroy(); this.chartFournisseur = null; }
  }

  private getHeaders(): HttpHeaders {
    const stored = localStorage.getItem('currentUser');
    const token = stored ? JSON.parse(stored)?.token : '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ══════════════════════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════════════════════

  loadAll(): void {
    this.loadKpis();
    this.loadCommandes();
    this.loadReceptions();
    this.loadFournisseurs();
    this.loadProduits();
    this.loadEntrepots();
  }

  loadKpis(): void {
    this.http.get<any>(`${this.baseUrl}/achats/kpis`, { headers: this.getHeaders() }).subscribe({
      next: k => this.kpis = k,
      error: () => {}
    });
  }

  loadCommandes(): void {
    this.http.get<any[]>(`${this.baseUrl}/achats/commandes`, { headers: this.getHeaders() }).subscribe({
      next: data => {
        this.commandes = data;
        this.filterCommandes();
        // Construire les graphiques après le chargement des données
        setTimeout(() => this.buildCharts(), 200);
      },
      error: () => {}
    });
  }

  loadReceptions(): void {
    this.http.get<any[]>(`${this.baseUrl}/achats/receptions`, { headers: this.getHeaders() }).subscribe({
      next: data => { this.receptions = data; this.filterReceptions(); },
      error: () => {}
    });
  }

  loadFournisseurs(): void {
    this.http.get<any[]>(`${this.baseUrl}/fournisseurs`, { headers: this.getHeaders() }).subscribe({
      next: data => this.fournisseurs = data,
      error: () => {}
    });
  }

  loadProduits(): void {
    this.http.get<any[]>(`${this.baseUrl}/produits`, { headers: this.getHeaders() }).subscribe({
      next: data => this.produits = data,
      error: () => {}
    });
  }

  loadEntrepots(): void {
    this.http.get<any[]>(`${this.baseUrl}/entrepots`, { headers: this.getHeaders() }).subscribe({
      next: data => this.entrepots = data,
      error: () => {}
    });
  }

  // ══════════════════════════════════════════════════════════
  // NAVIGATION TABS
  // ══════════════════════════════════════════════════════════

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'commandes') this.loadCommandes();
    if (tab === 'receptions') this.loadReceptions();
    if (tab === 'dashboard') {
      this.loadKpis();
      this.loadCommandes(); // recharge et reconstruit les graphiques
    }
  }

  // ══════════════════════════════════════════════════════════
  // FILTRES
  // ══════════════════════════════════════════════════════════

  filterCommandes(): void {
    let list = [...this.commandes];
    if (this.commandeSearch) {
      const s = this.commandeSearch.toLowerCase();
      list = list.filter(c =>
        c.numeroCommande?.toLowerCase().includes(s) ||
        c.fournisseur?.nom?.toLowerCase().includes(s)
      );
    }
    if (this.commandeStatutFilter) {
      list = list.filter(c => c.statut === this.commandeStatutFilter);
    }
    this.commandesFiltrees = list;
  }

  filterReceptions(): void {
    let list = [...this.receptions];
    if (this.receptionSearch) {
      const s = this.receptionSearch.toLowerCase();
      list = list.filter(r =>
        r.numeroReception?.toLowerCase().includes(s) ||
        r.commandeAchat?.numeroCommande?.toLowerCase().includes(s)
      );
    }
    this.receptionsFiltrees = list;
  }

  // ══════════════════════════════════════════════════════════
  // BONS DE COMMANDE ACHAT
  // ══════════════════════════════════════════════════════════

  ouvrirNouvelleCommande(): void {
    this.commandeForm = {
      fournisseurId: null, notes: '',
      lignes: [{ produitId: null, designation: '', quantite: 1, prixUnitaire: 0 }]
    };
    this.showCommandeModal = true;
  }

  ajouterLigne(): void {
    this.commandeForm.lignes.push({ produitId: null, designation: '', quantite: 1, prixUnitaire: 0 });
  }

  supprimerLigne(i: number): void {
    if (this.commandeForm.lignes.length > 1) this.commandeForm.lignes.splice(i, 1);
  }

  onProduitChange(i: number): void {
    const pid = this.commandeForm.lignes[i].produitId;
    if (pid) {
      const prod = this.produits.find(p => p.id == pid);
      if (prod) {
        this.commandeForm.lignes[i].designation = prod.nom;
        this.commandeForm.lignes[i].prixUnitaire = prod.prixAchat || prod.prixUnitaire || 0;
      }
    }
  }

  calculerTotalLigne(ligne: any): number {
    return (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
  }

  calculerTotalCommande(): number {
    return this.commandeForm.lignes.reduce((sum: number, l: any) => sum + this.calculerTotalLigne(l), 0);
  }

  soumettreCommande(): void {
    if (this.isSubmitting) return;  // ← blocage immédiat
    if (!this.commandeForm.fournisseurId) {
      this.afficherErreur('Veuillez sélectionner un fournisseur.');
      return;
    }
    this.isSubmitting = true;
    this.loading = true;
    this.showCommandeModal = false;  // ← fermeture immédiate de la modale
    const payload = {
      fournisseurId: this.commandeForm.fournisseurId,
      notes: this.commandeForm.notes,
      lignes: this.commandeForm.lignes.map((l: any) => ({
        produitId: l.produitId || null,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire
      }))
    };
    this.http.post<any>(`${this.baseUrl}/achats/commandes`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loading = false;
        this.isSubmitting = false;
        this.afficherSucces('Bon de commande créé avec succès !');
        this.loadCommandes();
        this.loadKpis();
      },
      error: err => {
        this.loading = false;
        this.isSubmitting = false;
        this.showCommandeModal = true;  // ré-ouvrir si erreur
        this.afficherErreur(this.extractErrMsg(err));
      }
    });
  }

  changerStatut(cmd: any, statut: string): void {
    this.http.put<any>(`${this.baseUrl}/achats/commandes/${cmd.id}/statut`, { statut }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.afficherSucces(`Statut mis à jour : ${statut}`); this.loadCommandes(); this.loadKpis(); },
      error: err => this.afficherErreur(this.extractErrMsg(err))
    });
  }

  // ──────────────────────────────────────────────────
  // P4 — GRAPHIQUES CHART.JS
  // ──────────────────────────────────────────────────

  buildCharts(): void {
    if (this.activeTab !== 'dashboard') return;

    // ── Graphique 1 : Donut statuts commandes ──
    const statuts = ['EN_ATTENTE','EN_VALIDATION','ENVOYEE','RECUE_PARTIELLE','RECUE_TOTALE','ANNULEE'];
    const counts  = statuts.map(s => this.commandes.filter(c => c.statut === s).length);
    const labels  = ['En attente','🔍 Validation','Envoyée','Reçue partielle','Reçue','Annulée'];
    const colors  = ['#f97316','#f59e0b','#3b82f6','#8b5cf6','#22c55e','#ef4444'];

    const canvS = document.getElementById('achatStatutChart') as HTMLCanvasElement;
    if (canvS) {
      if (this.chartStatut) { this.chartStatut.destroy(); }
      this.chartStatut = new Chart(canvS, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { font: { size: 11, family: 'Inter' }, padding: 14 } }
          }
        }
      });
    }

    // ── Graphique 2 : Barres horizontales top 5 fournisseurs ──
    const fournMap: {[nom:string]: number} = {};
    this.commandes.filter(c => c.statut !== 'ANNULEE').forEach(c => {
      const nom = c.fournisseur?.nom || 'Inconnu';
      fournMap[nom] = (fournMap[nom] || 0) + (c.montantTotal || 0);
    });
    const topFourn = Object.entries(fournMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5);
    const fLabels = topFourn.map(([nom]) => nom);
    const fVals   = topFourn.map(([, val]) => Number(val.toFixed(3)));

    const canvF = document.getElementById('achatFournisseurChart') as HTMLCanvasElement;
    if (canvF) {
      if (this.chartFournisseur) { this.chartFournisseur.destroy(); }
      this.chartFournisseur = new Chart(canvF, {
        type: 'bar',
        data: {
          labels: fLabels,
          datasets: [{
            label: 'Montant TND',
            data: fVals,
            backgroundColor: 'rgba(139,92,246,0.8)',
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
            y: { ticks: { font: { size: 11, family: 'Inter' } } }
          }
        }
      });
    }
  }

  // ── P3 : Workflow multi-niveaux ──────────────────────────
  soumettrePourValidation(cmd: any): void {
    this.changerStatut(cmd, 'EN_VALIDATION');
  }

  validerEtEnvoyer(cmd: any): void {
    if (!this.isAdmin) {
      this.afficherErreur('Seul un administrateur peut valider et envoyer une commande.');
      return;
    }
    this.changerStatut(cmd, 'ENVOYEE');
  }

  // ── P5 : Relance email fournisseur ───────────────────────
  relancerFournisseur(cmd: any): void {
    this.http.post<any>(`${this.baseUrl}/achats/commandes/${cmd.id}/relance-email`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => this.afficherSucces(`📧 ${res.message || 'Email de relance envoyé !'}` ),
      error: err => this.afficherErreur(this.extractErrMsg(err))
    });
  }

  ouvrirDetail(cmd: any): void {
    this.commandeDetail = cmd;
    this.showDetailModal = true;
  }

  confirmerSuppression(cmd: any): void {
    this.selectedCommande = cmd;
    this.showDeleteModal = true;
  }

  supprimerCommande(): void {
    if (!this.selectedCommande) return;
    this.http.delete<any>(`${this.baseUrl}/achats/commandes/${this.selectedCommande.id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.afficherSucces('Commande supprimée.');
        this.loadCommandes();
        this.loadKpis();
      },
      error: err => {
        this.showDeleteModal = false;
        this.afficherErreur(this.extractErrMsg(err));
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // RÉCEPTIONS
  // ══════════════════════════════════════════════════════════

  ouvrirNouvelleReception(cmd: any = null): void {
    this.receptionForm = {
      commandeAchatId: cmd?.id || null,
      produitId: null, entrepotId: null,
      quantiteCommandee: 0, quantiteRecue: 0,
      statut: 'CONFORME', observations: ''
    };
    if (cmd && cmd.lignes?.length > 0) {
      const premiereLigne = cmd.lignes[0];
      // Tenter plusieurs sources pour récupérer l'id du produit
      this.receptionForm.produitId =
        premiereLigne.produit?.id ||
        premiereLigne.produitId ||
        null;
      this.receptionForm.quantiteCommandee = premiereLigne.quantite || 0;
      this.receptionForm.quantiteRecue     = premiereLigne.quantite || 0;
    }
    this.showReceptionModal = true;
  }

  soumettreReception(): void {
    if (!this.receptionForm.commandeAchatId) {
      this.afficherErreur('Veuillez sélectionner une commande.');
      return;
    }
    this.loading = true;
    this.http.post<any>(`${this.baseUrl}/achats/receptions`, this.receptionForm, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.showReceptionModal = false;
        // Utiliser le message du serveur (indique si le stock a été mis à jour)
        const msg = res?.message || 'Réception enregistrée avec succès !';
        this.afficherSucces(msg);
        this.loadReceptions();
        this.loadCommandes();
        this.loadKpis();
      },
      error: err => {
        this.loading = false;
        this.afficherErreur(this.extractErrMsg(err));
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════════

  getStatutClass(statut: string): string {
    const map: any = {
      'EN_ATTENTE'     : 'statut-attente',
      'EN_VALIDATION'  : 'statut-validation',
      'ENVOYEE'        : 'statut-envoyee',
      'RECUE_PARTIELLE': 'statut-partielle',
      'RECUE_TOTALE'   : 'statut-recue',
      'ANNULEE'        : 'statut-annulee',
      'CONFORME'       : 'statut-recue',
      'NON_CONFORME'   : 'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: any = {
      'EN_ATTENTE'     : 'En attente',
      'EN_VALIDATION'  : '🔍 En validation',
      'ENVOYEE'        : 'Envoyée',
      'RECUE_PARTIELLE': 'Reçue partielle',
      'RECUE_TOTALE'   : 'Reçue',
      'ANNULEE'        : 'Annulée',
      'CONFORME'       : 'Conforme',
      'NON_CONFORME'   : 'Non conforme',
      'PARTIELLE'      : 'Partielle'
    };
    return map[statut] || statut;
  }

  private afficherSucces(msg: string): void {
    this.successMsg = msg; this.errorMsg = '';
    if (this.msgTimer) clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.successMsg = '', 4000);
  }

  private afficherErreur(msg: string): void {
    this.errorMsg = msg; this.successMsg = '';
    if (this.msgTimer) clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.errorMsg = '', 5000);
  }

  fermerToutesModales(): void {
    this.showCommandeModal = false;
    this.showReceptionModal = false;
    this.showDeleteModal = false;
    this.showDetailModal = false;
  }

  private extractErrMsg(err: any): string {
    if (!err) return 'Erreur inconnue.';
    if (typeof err.error === 'string') return err.error;
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    if (err.status === 0) return 'Backend non accessible. Vérifiez que le serveur est démarré (port 9090).';
    if (err.status === 401) return 'Session expirée. Veuillez vous reconnecter.';
    if (err.status === 403) return 'Accès refusé. Droits insuffisants.';
    if (err.status === 404) return 'Ressource introuvable.';
    if (err.status >= 500) return 'Erreur serveur. Vérifiez les logs du backend.';
    return `Erreur ${err.status || ''}`;
  }

  // ── EXPORTS ──────────────────────────────────────────────────

  private get _commandeCols(): string[] {
    return ['N°', 'Référence', 'Fournisseur', 'Date', 'Statut', 'Montant TTC (TND)', 'Notes'];
  }
  private get _commandeRows(): (string | number)[][] {
    return this.commandesFiltrees.map((c, i) => [
      i + 1,
      c.reference ?? '—',
      c.fournisseur?.nom ?? '—',
      c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '—',
      c.statut ?? '—',
      `${(c.montantTTC ?? 0).toFixed(3)} TND`,
      c.notes ?? '—'
    ]);
  }

  private get _receptionCols(): string[] {
    return ['N°', 'Produit', 'Entrepôt', 'Qé commandée', 'Qé reçue', 'Statut', 'Observations'];
  }
  private get _receptionRows(): (string | number)[][] {
    return this.receptionsFiltrees.map((r, i) => [
      i + 1,
      r.produitNom ?? '—',
      r.entrepotNom ?? '—',
      r.quantiteCommandee ?? 0,
      r.quantiteRecue ?? 0,
      r.statut ?? '—',
      r.observations ?? '—'
    ]);
  }

  exportCommandesCSV(): void {
    this.exportService.exportToCSV(this._commandeCols, this._commandeRows,
      `bons-achat-${new Date().toISOString().slice(0, 10)}`);
  }
  exportCommandesPDF(): void {
    this.exportService.exportTableToPDF(
      this._commandeCols, this._commandeRows,
      'Bons de Commande Achats — BENJEDDOU ERP',
      `bons-achat-${new Date().toISOString().slice(0, 10)}`,
      `${this.commandesFiltrees.length} commande(s) — ${new Date().getFullYear()}`
    );
  }
  exportCommandesExcel(): void {
    this.exportService.exportTableToExcel(
      this._commandeCols, this._commandeRows,
      'Bons de Commande Achats — BENJEDDOU ERP',
      `bons-achat-${new Date().toISOString().slice(0, 10)}`);
  }
  exportCommandesWord(): void {
    this.exportService.exportTableToWord(
      this._commandeCols, this._commandeRows,
      'Bons de Commande Achats — BENJEDDOU ERP',
      `bons-achat-${new Date().toISOString().slice(0, 10)}`);
  }
  printCommandes(): void {
    this.exportService.printElement('commandes-table', 'Bons de Commande Achats — BENJEDDOU ERP');
  }

  exportReceptionsCSV(): void {
    this.exportService.exportToCSV(this._receptionCols, this._receptionRows,
      `receptions-${new Date().toISOString().slice(0, 10)}`);
  }
  exportReceptionsExcel(): void {
    this.exportService.exportTableToExcel(
      this._receptionCols, this._receptionRows,
      'Réceptions Fournisseurs — BENJEDDOU ERP',
      `receptions-${new Date().toISOString().slice(0, 10)}`);
  }
  exportReceptionsPDF(): void {
    this.exportService.exportTableToPDF(
      this._receptionCols, this._receptionRows,
      'Réceptions Fournisseurs — BENJEDDOU ERP',
      `receptions-${new Date().toISOString().slice(0, 10)}`,
      `${this.receptionsFiltrees.length} réception(s)`
    );
  }
  exportReceptionsWord(): void {
    this.exportService.exportTableToWord(
      this._receptionCols, this._receptionRows,
      'Réceptions Fournisseurs — BENJEDDOU ERP',
      `receptions-${new Date().toISOString().slice(0, 10)}`);
  }
  printReceptions(): void {
    this.exportService.printElement('receptions-table', 'Réceptions Fournisseurs — BENJEDDOU ERP');
  }


  // ══════════════════════════════════════════════════════════
  // DOCUMENTS ACHATS MULTILINGUES (FR / EN / AR)
  // ══════════════════════════════════════════════════════════
  achatDocLangue: 'fr' | 'en' | 'ar' = 'fr';

  imprimerBonCommandeAchat(cmd?: any, langOverride?: string): void {
    const c = cmd || this.commandeDetail;
    if (!c) return;

    const lang = (langOverride || this.achatDocLangue || localStorage.getItem('erp_lang') || 'fr').toLowerCase();
    const isAr = lang === 'ar';
    const isEn = lang === 'en';
    const dir = isAr ? 'rtl' : 'ltr';

    const t = {
      title: isAr ? 'أمر شراء / طلبيّة تزوّد' : (isEn ? 'PURCHASE ORDER' : 'BON DE COMMANDE ACHAT'),
      num: isAr ? 'رقم الطلب' : (isEn ? 'PO Number' : 'N° Bon'),
      date: isAr ? 'تاريخ الطلب' : (isEn ? 'Order Date' : 'Date de Commande'),
      buyer: isAr ? 'المشتري / المؤسسة' : (isEn ? 'BUYER / COMPANY' : 'ACHETEUR / ÉMETTEUR'),
      supplier: isAr ? 'المزود / المورد' : (isEn ? 'SUPPLIER / VENDOR' : 'FOURNISSEUR'),
      activity: isAr ? 'معدات المعلوماتية والإلكترونيات' : (isEn ? 'IT & Electronic Equipment' : 'Matériel Informatique & Électronique'),
      mf: isAr ? 'المعرف الجبائي :' : (isEn ? 'Tax ID:' : 'Matricule Fiscal :'),
      status: isAr ? 'الحالة' : (isEn ? 'Status' : 'Statut'),
      colNum: '#',
      colDesignation: isAr ? 'البيان / المادة' : (isEn ? 'Description' : 'Désignation'),
      colQty: isAr ? 'الكمية' : (isEn ? 'Qty' : 'Quantité'),
      colPu: isAr ? 'السعر الفردي خ.ز.' : (isEn ? 'Unit Price Excl. Tax' : 'Prix Unit. HT'),
      colTotal: isAr ? 'المجموع خ.ز.' : (isEn ? 'Total Excl. Tax' : 'Total HT'),
      subtotal: isAr ? 'المجموع خ.ز.' : (isEn ? 'Subtotal' : 'Sous-total HT'),
      tva: isAr ? 'الضريبة (19%)' : (isEn ? 'VAT (19%)' : 'TVA (19%)'),
      grandTotal: isAr ? 'المجموع الإجمالي ش.ر.' : (isEn ? 'GRAND TOTAL' : 'TOTAL GÉNÉRAL TTC'),
      notes: isAr ? 'ملاحظات وشروط التسليم' : (isEn ? 'Notes & Delivery Terms' : 'Notes & Conditions de Livraison'),
      sigBuyer: isAr ? 'توقيع وختم قسم المشتريات' : (isEn ? 'Purchasing Dept. Stamp & Signature' : 'Service Achats (Cachet & Signature)'),
      sigSupplier: isAr ? 'تأكيد وقبول المزود' : (isEn ? 'Supplier Acknowledgment' : 'Accusé de Réception Fournisseur'),
      footer: isAr ? 'BENJEDDOU ERP — أمر شراء رسمي موجه للمزود' : (isEn ? 'BENJEDDOU ERP — Official Purchase Order' : 'BENJEDDOU ERP — Bon de Commande Achat Officiel')
    };

    const dateStr = new Date(c.dateCommande || Date.now()).toLocaleDateString(isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-TN'));
    const totalTtc = c.montantTotal || 0;
    const totalHt = totalTtc / 1.19;
    const montantTva = totalTtc - totalHt;

    const rowsHtml = (c.lignes || []).map((l: any, idx: number) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${l.designation || l.produit?.nom || 'Article'}</strong></td>
        <td style="text-align:center; font-weight:700;">${l.quantite}</td>
        <td style="text-align:right;">${(l.prixUnitaire || 0).toFixed(3)} TND</td>
        <td style="text-align:right; font-weight:700;">${((l.quantite || 1) * (l.prixUnitaire || 0)).toFixed(3)} TND</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${t.title} - ${c.numeroCommande}</title>
  <style>
    body { font-family: ${isAr ? "'Tahoma', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif"}; padding: 24px; color: #0f172a; direction: ${dir}; }
    .doc-page { max-width: 850px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #f97316; padding-bottom: 16px; margin-bottom: 20px; }
    .brand h1 { color: #f97316; font-size: 22pt; margin: 0; }
    .brand p { font-size: 9pt; color: #64748b; margin-top: 4px; }
    .badge-po { background: #0b1b3d; color: #fff; padding: 10px 18px; border-radius: 8px; text-align: ${isAr ? 'left' : 'right'}; }
    .badge-po h2 { margin: 0; font-size: 14pt; color: #f97316; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .party-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: ${isAr ? 'right' : 'left'}; }
    .party-title { font-size: 8pt; font-weight: 800; color: #f97316; text-transform: uppercase; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5pt; }
    th { background: #1e293b; color: #fff; padding: 9px 12px; text-align: ${isAr ? 'right' : 'left'}; font-size: 8.5pt; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    .totals-grid { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .totals-box { width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .tot-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 9pt; }
    .tot-grand { font-weight: 800; font-size: 11pt; color: #f97316; border-top: 2px solid #e2e8f0; margin-top: 6px; padding-top: 6px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .sig-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; min-height: 85px; text-align: ${isAr ? 'right' : 'left'}; }
    .footer { text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 20px; padding-top: 10px; border-top: 1px solid #f1f5f9; }
    @media print { body { padding: 0; } .doc-page { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="doc-page">
    <div class="header">
      <div class="brand">
        <h1>BENJEDDOU ERP</h1>
        <p>${t.activity}<br>123, Avenue Habib Bourguiba, Tunis</p>
      </div>
      <div class="badge-po">
        <h2>${t.title}</h2>
        <div>${t.num} : <strong>${c.numeroCommande}</strong></div>
        <div>${t.date} : ${dateStr}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party-box">
        <div class="party-title">${t.buyer}</div>
        <strong>Société Benjeddou Technologie Service</strong><br>
        123, Avenue Habib Bourguiba, 1000 Tunis<br>
        Tel : +216 71 123 456 | MF : 1234567X
      </div>
      <div class="party-box">
        <div class="party-title">${t.supplier}</div>
        <strong>${c.fournisseur?.nom || 'Fournisseur Agréé'}</strong><br>
        ${c.fournisseur?.adresse || 'Tunisie'}<br>
        Tel : ${c.fournisseur?.telephone || '—'} | Email : ${c.fournisseur?.email || '—'}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px; text-align:center;">${t.colNum}</th>
          <th>${t.colDesignation}</th>
          <th style="width:70px; text-align:center;">${t.colQty}</th>
          <th style="width:110px; text-align:right;">${t.colPu}</th>
          <th style="width:120px; text-align:right;">${t.colTotal}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding:20px;">Aucune ligne</td></tr>'}
      </tbody>
    </table>

    <div class="totals-grid">
      <div class="totals-box">
        <div class="tot-row"><span>${t.subtotal} :</span><strong>${totalHt.toFixed(3)} TND</strong></div>
        <div class="tot-row"><span>${t.tva} :</span><strong>${montantTva.toFixed(3)} TND</strong></div>
        <div class="tot-row tot-grand"><span>${t.grandTotal} :</span><span>${totalTtc.toFixed(3)} TND</span></div>
      </div>
    </div>

    <div *ngIf="c.notes" style="background:#fffbeb; border:1px solid #fef3c7; padding:10px 14px; border-radius:6px; font-size:8.5pt; margin-bottom:16px;">
      <strong>${t.notes} :</strong> ${c.notes}
    </div>

    <div class="signatures">
      <div class="sig-box"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">${t.sigBuyer}</span></div>
      <div class="sig-box"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">${t.sigSupplier}</span></div>
    </div>

    <div class="footer">${t.footer} — ${dateStr}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=750');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  imprimerBonReception(rec: any, langOverride?: string): void {
    const lang = (langOverride || this.achatDocLangue || localStorage.getItem('erp_lang') || 'fr').toLowerCase();
    const isAr = lang === 'ar';
    const isEn = lang === 'en';
    const dir = isAr ? 'rtl' : 'ltr';

    const t = {
      title: isAr ? 'وصل استلام ومراقبة بضائع المورد' : (isEn ? 'GOODS RECEIPT & CONFORMITY NOTE' : 'BON DE RÉCEPTION MARCHANDISES'),
      supplier: isAr ? 'المزود' : (isEn ? 'Supplier' : 'Fournisseur'),
      product: isAr ? 'المنتج' : (isEn ? 'Product' : 'Produit Réceptionné'),
      warehouse: isAr ? 'مستودع التخزين' : (isEn ? 'Target Warehouse' : 'Entrepôt de Stockage'),
      qtyOrdered: isAr ? 'الكمية المطلوبة' : (isEn ? 'Qty Ordered' : 'Quantité Commandée'),
      qtyReceived: isAr ? 'الكمية المستلمة' : (isEn ? 'Qty Received' : 'Quantité Reçue'),
      conformity: isAr ? 'مطابقة الجودة' : (isEn ? 'Conformity' : 'Contrôle Qualité'),
      notes: isAr ? 'ملاحظات الاستلام' : (isEn ? 'Observations' : 'Observations'),
      stamp: isAr ? 'توقيع وختم أمين المستودع' : (isEn ? 'Warehouse Manager Stamp' : 'Visa & Cachet Magasinier'),
      footer: isAr ? 'BENJEDDOU ERP — وصل استلام معتمد ومسجل في المخزون' : (isEn ? 'BENJEDDOU ERP — Certified Goods Receipt Note' : 'BENJEDDOU ERP — Bon de Réception Conforme Enregistré')
    };

    const dateStr = new Date(rec?.dateReception || Date.now()).toLocaleDateString(isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-TN'));

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${t.title}</title>
  <style>
    body { font-family: ${isAr ? "'Tahoma', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif"}; padding: 24px; color: #0f172a; direction: ${dir}; }
    .card { max-width: 800px; margin: auto; border: 2px solid #22c55e; border-radius: 12px; padding: 24px; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px; }
    .badge { background: #166534; color: #fff; padding: 8px 16px; border-radius: 8px; font-weight: 700; text-align: center; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; text-align: ${isAr ? 'right' : 'left'}; }
    .item label { font-size: 8pt; color: #64748b; font-weight: 700; display: block; }
    .item value { font-size: 11pt; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div><h2 style="color:#166534; margin:0;">BENJEDDOU ERP</h2><p style="margin:2px 0; font-size:9pt; color:#64748b;">Service Contrôle & Réception Achats</p></div>
      <div class="badge"><h3 style="margin:0;">${t.title}</h3><span>${dateStr}</span></div>
    </div>
    <div class="grid">
      <div class="item"><label>${t.supplier}</label><value>${rec?.fournisseurNom || 'Fournisseur'}</value></div>
      <div class="item"><label>${t.product}</label><value>${rec?.produitNom || 'Article'}</value></div>
      <div class="item"><label>${t.warehouse}</label><value>${rec?.entrepotNom || 'Entrepôt Principal'}</value></div>
      <div class="item"><label>${t.conformity}</label><value style="color:#16a34a;">${rec?.statut || 'CONFORME'}</value></div>
      <div class="item"><label>${t.qtyOrdered}</label><value>${rec?.quantiteCommandee || 0}</value></div>
      <div class="item"><label>${t.qtyReceived}</label><value style="color:#166534; font-size:13pt;">${rec?.quantiteRecue || 0}</value></div>
      <div class="item" style="grid-column: span 2;"><label>${t.notes}</label><value>${rec?.observations || 'Aucune anomalie signalée.'}</value></div>
    </div>
    <div style="margin-top:20px; border:1px dashed #cbd5e1; padding:14px; border-radius:8px; min-height:80px; text-align:${isAr ? 'right' : 'left'};">
      <span style="font-size:8.5pt; color:#64748b; font-weight:700;">${t.stamp}</span>
    </div>
    <div style="text-align:center; font-size:8pt; color:#94a3b8; margin-top:16px;">${t.footer}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=850,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  imprimerDemandeAchat(da?: any, langOverride?: string): void {
    const lang = (langOverride || this.achatDocLangue || localStorage.getItem('erp_lang') || 'fr').toLowerCase();
    const isAr = lang === 'ar';
    const isEn = lang === 'en';
    const dir = isAr ? 'rtl' : 'ltr';

    const t = {
      title: isAr ? 'مطلب شراء داخلي (DA)' : (isEn ? 'INTERNAL PURCHASE REQUISITION' : 'DEMANDE D\'ACHAT INTERNE (DA)'),
      ref: isAr ? 'رمز المطلب' : (isEn ? 'Requisition Ref' : 'Réf Demande'),
      date: isAr ? 'تاريخ المطلب' : (isEn ? 'Date' : 'Date Demande'),
      dept: isAr ? 'القسم الطالب' : (isEn ? 'Department' : 'Département Demandeur'),
      applicant: isAr ? 'مقدم المطلب' : (isEn ? 'Requested By' : 'Demandeur'),
      product: isAr ? 'المادة / الخدمة' : (isEn ? 'Item / Service' : 'Désignation Besoin'),
      qty: isAr ? 'الكمية المقدرة' : (isEn ? 'Estimated Qty' : 'Quantité Demandée'),
      budget: isAr ? 'الميزانية التقديرية' : (isEn ? 'Estimated Cost' : 'Budget Estimé'),
      justification: isAr ? 'التعليل والمبرر' : (isEn ? 'Justification' : 'Justification du Besoin'),
      approval: isAr ? 'موافقة الإدارة والاعتماد' : (isEn ? 'Management Approval' : 'Visa Chef de Département & Direction'),
      footer: isAr ? 'BENJEDDOU ERP — وثيقة داخلية للمصادقة على الشراء' : (isEn ? 'BENJEDDOU ERP — Internal Purchase Requisition' : 'BENJEDDOU ERP — Document Interne de Demande d\'Achat')
    };

    const dateStr = new Date(da?.dateCreation || Date.now()).toLocaleDateString(isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-TN'));

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${t.title}</title>
  <style>
    body { font-family: ${isAr ? "'Tahoma', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif"}; padding: 24px; color: #0f172a; direction: ${dir}; }
    .card { max-width: 800px; margin: auto; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px; }
    .badge { background: #1e40af; color: #fff; padding: 8px 16px; border-radius: 8px; font-weight: 700; text-align: center; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; text-align: ${isAr ? 'right' : 'left'}; }
    .item label { font-size: 8pt; color: #64748b; font-weight: 700; display: block; }
    .item value { font-size: 11pt; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div><h2 style="color:#1e40af; margin:0;">BENJEDDOU ERP</h2><p style="margin:2px 0; font-size:9pt; color:#64748b;">Département Achats & Approvisionnements</p></div>
      <div class="badge"><h3 style="margin:0;">${t.title}</h3><span>${dateStr}</span></div>
    </div>
    <div class="grid">
      <div class="item"><label>${t.ref}</label><value>DA-${da?.id || '2026-001'}</value></div>
      <div class="item"><label>${t.date}</label><value>${dateStr}</value></div>
      <div class="item"><label>${t.dept}</label><value>${da?.departement || 'Direction Technique'}</value></div>
      <div class="item"><label>${t.applicant}</label><value>${da?.demandeur || 'Responsable Achat'}</value></div>
      <div class="item"><label>${t.product}</label><value>${da?.designation || 'Fourniture & Équipement'}</value></div>
      <div class="item"><label>${t.qty}</label><value style="color:#2563eb; font-size:13pt;">${da?.quantite || 1}</value></div>
      <div class="item" style="grid-column: span 2;"><label>${t.justification}</label><value>${da?.justification || 'Renouvellement de stock et approvisionnement courant.'}</value></div>
    </div>
    <div style="margin-top:20px; border:1px dashed #cbd5e1; padding:14px; border-radius:8px; min-height:80px; text-align:${isAr ? 'right' : 'left'};">
      <span style="font-size:8.5pt; color:#64748b; font-weight:700;">${t.approval}</span>
    </div>
    <div style="text-align:center; font-size:8pt; color:#94a3b8; margin-top:16px;">${t.footer}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=850,height=600');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  exportBonCommandeAchatWord(cmd?: any): void {
    const c = cmd || this.commandeDetail;
    if (!c) return;
    const ref = c.numeroCommande || c.id || 'BC-ACHAT';
    const supplierName = c.fournisseur?.nom || 'Legrand Tunisie';
    const notes = c.notes || 'Materiaux electriques Legrand';
    const montantTotal = (c.montantTotal || 2200).toFixed(3);

    let lignes = (c.lignes && c.lignes.length > 0) ? c.lignes : [
      {
        designation: notes || `Fourniture & Équipement — ${supplierName}`,
        quantite: 1,
        prixUnitaire: c.montantTotal || 2200
      }
    ];

    const rows = lignes.map((l: any, i: number) => [
      i + 1,
      l.designation || l.produit?.nom || notes || 'Article',
      l.quantite || 1,
      (l.prixUnitaire || (c.montantTotal || 0)).toFixed(3) + ' TND',
      ((l.quantite || 1) * (l.prixUnitaire || (c.montantTotal || 0))).toFixed(3) + ' TND'
    ]);

    // Ligne Récapitulative Totale
    rows.push([
      'TOTAL',
      `MONTANT TOTAL — ${notes}`,
      '—',
      '—',
      `${montantTotal} TND TTC`
    ]);

    this.exportService.exportTableToWord(
      ['N°', 'Désignation / Article', 'Quantité', 'Prix Unit. (TND)', 'Montant Total (TND)'],
      rows,
      `Bon de Commande Achat ${ref} — ${supplierName}`,
      `bon-commande-achat-${ref}`
    );
  }

  exportBonCommandeAchatExcel(cmd?: any): void {
    const c = cmd || this.commandeDetail;
    if (!c) return;
    const ref = c.numeroCommande || c.id || 'BC-ACHAT';
    const supplierName = c.fournisseur?.nom || 'Legrand Tunisie';
    const notes = c.notes || 'Materiaux electriques Legrand';
    const montantTotal = (c.montantTotal || 2200).toFixed(3);

    let lignes = (c.lignes && c.lignes.length > 0) ? c.lignes : [
      {
        designation: notes || `Fourniture & Équipement — ${supplierName}`,
        quantite: 1,
        prixUnitaire: c.montantTotal || 2200
      }
    ];

    const rows = lignes.map((l: any, i: number) => [
      i + 1,
      l.designation || l.produit?.nom || notes || 'Article',
      l.quantite || 1,
      (l.prixUnitaire || (c.montantTotal || 0)).toFixed(3) + ' TND',
      ((l.quantite || 1) * (l.prixUnitaire || (c.montantTotal || 0))).toFixed(3) + ' TND'
    ]);

    // Ligne Récapitulative Totale
    rows.push([
      'TOTAL',
      `MONTANT TOTAL — ${notes}`,
      '—',
      '—',
      `${montantTotal} TND TTC`
    ]);

    this.exportService.exportTableToExcel(
      ['N°', 'Désignation / Article', 'Quantité', 'Prix Unit. (TND)', 'Montant Total (TND)'],
      rows,
      `Bon de Commande Achat ${ref} — ${supplierName}`,
      `bon-commande-achat-${ref}`
    );
  }

  exportBonReceptionWord(rec: any): void {
    if (!rec) return;
    const ref = rec.id ? `BR-${rec.id}` : 'BR-RECEPTION';
    const supplier = rec.fournisseurNom || rec.commande?.fournisseur?.nom || 'Fournisseur';
    const product = rec.produitNom || rec.produit?.nom || 'Article Réceptionné';
    const warehouse = rec.entrepotNom || rec.entrepot?.nom || 'Entrepôt Principal';
    const dateStr = rec.dateReception ? new Date(rec.dateReception).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const statut = rec.statut || 'CONFORME';
    const qtyCmd = rec.quantiteCommandee || rec.quantite || 1;
    const qtyRec = rec.quantiteRecue || rec.quantite || 1;
    const obs = rec.observations || 'Aucune anomalie signalée. Réception conforme.';

    const rows = [
      ['Date de Réception', dateStr],
      ['Fournisseur', supplier],
      ['Produit Réceptionné', product],
      ['Entrepôt de Stockage', warehouse],
      ['Statut Contrôle Qualité', statut],
      ['Quantité Commandée', qtyCmd],
      ['Quantité Reçue & Validée', qtyRec],
      ['Observations / Remarques', obs]
    ];

    this.exportService.exportTableToWord(
      ['Propriété / Information', 'Valeur Renseignée'],
      rows,
      `Bon de Réception ${ref} — ${supplier}`,
      `bon-reception-${ref}`
    );
  }

  exportBonReceptionExcel(rec: any): void {
    if (!rec) return;
    const ref = rec.id ? `BR-${rec.id}` : 'BR-RECEPTION';
    const supplier = rec.fournisseurNom || rec.commande?.fournisseur?.nom || 'Fournisseur';
    const product = rec.produitNom || rec.produit?.nom || 'Article Réceptionné';
    const warehouse = rec.entrepotNom || rec.entrepot?.nom || 'Entrepôt Principal';
    const dateStr = rec.dateReception ? new Date(rec.dateReception).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const statut = rec.statut || 'CONFORME';
    const qtyCmd = rec.quantiteCommandee || rec.quantite || 1;
    const qtyRec = rec.quantiteRecue || rec.quantite || 1;
    const obs = rec.observations || 'Aucune anomalie signalée. Réception conforme.';

    const rows = [
      ['Date de Réception', dateStr],
      ['Fournisseur', supplier],
      ['Produit Réceptionné', product],
      ['Entrepôt de Stockage', warehouse],
      ['Statut Contrôle Qualité', statut],
      ['Quantité Commandée', qtyCmd],
      ['Quantité Reçue & Validée', qtyRec],
      ['Observations / Remarques', obs]
    ];

    this.exportService.exportTableToExcel(
      ['Propriété / Information', 'Valeur Renseignée'],
      rows,
      `Bon de Réception ${ref} — ${supplier}`,
      `bon-reception-${ref}`
    );
  }
}


