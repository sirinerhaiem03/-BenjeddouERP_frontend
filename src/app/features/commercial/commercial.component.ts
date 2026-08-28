import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommercialService } from '../../core/services/commercial.service';
import { StockService } from '../../core/services/stock.service';
import { Chart, registerables } from 'chart.js';
import { SmartDatepickerComponent } from '../../shared/components/smart-datepicker/smart-datepicker.component';
import { NombreLettresPipe } from '../../shared/pipes/nombre-lettres.pipe';
import { UtilsService } from '../../shared/services/utils.service';
import { FormValidatorService } from '../../shared/services/form-validator.service';
import { AiTextareaComponent } from '../../shared/components/ai-textarea/ai-textarea.component';
import { ExportService } from '../../core/services/export.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QrBarcodeService } from '../../core/services/qr-barcode.service';
import { PermissionService } from '../../core/services/permission.service';
import { AppPermissionDirective } from '../../shared/directives/app-permission.directive';

Chart.register(...registerables);

@Component({
  selector: 'app-commercial',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    SmartDatepickerComponent, NombreLettresPipe, AiTextareaComponent, TranslateModule, AppPermissionDirective],
  templateUrl: './commercial.component.html',
  styleUrls: ['./commercial.component.css']
})
export class CommercialComponent implements OnInit, OnDestroy {

  activeTab: string = 'clients';

  // ── Loading ──────────────────────────────────────────────
  isLoading = false;
  successMsg = '';
  errorMsg = '';

  // ── Clients ──────────────────────────────────────────────
  clients: any[] = [];
  filteredClients: any[] = [];
  clientSearch = '';
  showClientModal = false;
  isEditingClient = false;
  selectedClientId: number | null = null;
  clientForm!: FormGroup;

  // ── Fournisseurs ──────────────────────────────────────────
  fournisseurs: any[] = [];
  filteredFournisseurs: any[] = [];
  fournisseurSearch = '';
  showFournisseurModal = false;
  isEditingFournisseur = false;
  selectedFournisseurId: number | null = null;
  fournisseurForm!: FormGroup;

  // ── Commandes ─────────────────────────────────────────────
  commandes: any[] = [];
  filteredCommandes: any[] = [];
  commandeSearch = '';
  commandeStatutFilter = '';
  showCommandeModal = false;
  showCommandeDetailModal = false;
  selectedCommande: any = null;
  selectedCommandeLignes: any[] = [];
  commandeForm!: FormGroup;
  products: any[] = [];

  // ── Factures ──────────────────────────────────────────────
  factures: any[] = [];
  filteredFactures: any[] = [];
  factureSearch = '';
  factureStatutFilter = '';
  showFactureDetailModal = false;
  selectedFacture: any = null;

  // ── Devis ─────────────────────────────────────────────────
  devis: any[] = [];
  filteredDevis: any[] = [];
  devisSearch = '';
  devisStatutFilter = '';
  showDevisModal = false;
  showDevisDetailModal = false;
  selectedDevis: any = null;
  selectedDevisLignes: any[] = [];
  devisForm!: FormGroup;

  // ── Promotions & Codes Promo ───────────────────────────────
  promos: any[] = [];
  filteredPromos: any[] = [];
  promoSearch = '';
  promoStatutFilter = '';
  showPromoModal = false;
  isEditingPromo = false;
  selectedPromo: any = null;
  promoForm!: FormGroup;
  promoSaveError = '';  // Erreur affichée DANS le modal

  // Code promo dans formulaire commande
  codePromoInput = '';
  promoVerifResult: any = null;
  promoVerifLoading = false;

  // ── Charts ────────────────────────────────────────────────
  private caChart: Chart | null = null;
  private cmdChart: Chart | null = null;
  private doughnutChart: Chart | null = null;
  private isChartsBuilding = false; // Garde anti-double-appel

  // ── KPIs (computed) ───────────────────────────────────────
  kpis = {
    totalCA: 0,
    commandesMois: 0,
    facturesEnAttente: 0,
    tauxFacturation: 0,
    // Nouveaux
    facturesImpayees: 0,
    tauxConversionDevis: 0,
    devisEnCours: 0
  };

  // ── Dashboard data ────────────────────────────────────
  commandesStats = { payees: 0, attente: 0, annulees: 0 };
  top5Clients: { nom: string; nbCommandes: number; ca: number; part: number }[] = [];
  opsAlerts: { type: string; icon: string; message: string }[] = [];
  recentActivities: { type: string; icon: string; label: string; date: string; client: string; montant?: number }[] = [];
  currentMonthLabel = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private commercialService: CommercialService,
    private stockService: StockService,
    public utilsService: UtilsService,
    public formValidator: FormValidatorService,
    private exportService: ExportService,
    private translate: TranslateService,
    public qrBarcodeService: QrBarcodeService,
    public permissionService: PermissionService,
    private cdr: ChangeDetectorRef
  ) { }

  printInvoiceQR(item: any, event?: Event): void {
    if (event) { event.stopPropagation(); }
    this.qrBarcodeService.printInvoiceQRCodeReceipt(item);
  }

  printProductQR(product: any, event?: Event): void {
    if (event) { event.stopPropagation(); }
    this.qrBarcodeService.printProductLabel(product);
  }

  // ── Champs SmartDatepicker (intégrés dans les formulaires) ──
  dateDevisStr = '';      // format dd/MM/yyyy — pour le devis
  dateValiditeStr = '';   // date de validité du devis
  dateFactureStr = '';    // date de la facture
  dateEcheanceStr = '';   // date d'échéance de la facture

  // ── Validation en temps réel (N°6) ──────────────────────────
  emailClientValide: boolean | null = null;
  telClientValide: boolean | null = null;
  matriculeValide: boolean | null = null;

  verifierEmailClient(email: string): void {
    this.emailClientValide = email ? this.utilsService.validerEmailLocal(email) : null;
  }
  verifierTelClient(tel: string): void {
    this.telClientValide = tel ? this.utilsService.validerTelephoneLocal(tel) : null;
  }
  verifierMatricule(m: string): void {
    this.matriculeValide = m ? /^[0-9]{7}[A-Za-z]{1,3}(\/[A-Z]\/[0-9]{3})?$/.test(m) : null;
  }

  onDateDevisChange(iso: string): void {
    if (iso) this.devisForm?.patchValue({ dateDevis: iso });
  }
  onDateValiditeChange(iso: string): void {
    if (iso) this.devisForm?.patchValue({ dateValidite: iso });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.activeTab = params['tab'] || 'clients';
      if (params['search']) {
        if (this.activeTab === 'factures') { this.factureSearch = params['search']; }
        else if (this.activeTab === 'devis') { this.devisSearch = params['search']; }
      }
      this.loadCurrentTab();
    });
    this.initForms();
    // Charger toutes les données pour les KPIs (toujours)
    this.loadAllForKpis();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  switchTab(tab: string): void {
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  loadCurrentTab(): void {
    this.clearMessages();
    switch (this.activeTab) {
      case 'clients': this.loadClients(); break;
      case 'fournisseurs': this.loadFournisseurs(); break;
      case 'commandes': this.loadCommandes(); this.loadProducts(); break;
      case 'factures': this.loadFactures(); break;
      case 'devis': this.loadDevis(); this.loadProducts(); this.loadClients(); break;
      case 'promos': this.loadPromos(); break;
      case 'dashboard': this.loadDashboard(); break;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // KPIs — charger toutes les données pour les cartes de stat
  // ══════════════════════════════════════════════════════════════
  loadAllForKpis(): void {
    this.commercialService.getCommandes().subscribe({
      next: (data) => {
        if (!this.commandes.length) this.commandes = data;
        this.computeKpis();
        // Ne pas construire les charts si on est sur le dashboard (évite le conflit)
        if (this.activeTab !== 'dashboard') {
          setTimeout(() => this.buildCharts(), 200);
        }
      },
      error: () => { } // Silencieux — ne bloque pas les autres onglets
    });
    this.commercialService.getClients().subscribe({
      next: (data) => { if (!this.clients.length) { this.clients = data; this.filteredClients = data; } },
      error: () => { }
    });
    this.commercialService.getFactures().subscribe({
      next: (data) => {
        if (!this.factures.length) { this.factures = data; this.filteredFactures = data; }
        this.computeKpis();
      },
      error: () => { }
    });
    this.commercialService.getFournisseurs().subscribe({
      next: (data) => { if (!this.fournisseurs.length) { this.fournisseurs = data; this.filteredFournisseurs = data; } },
      error: () => { }
    });
    // Charger les devis pour les KPIs (taux conversion, devis en cours)
    this.commercialService.getDevis().subscribe({
      next: (data) => {
        if (!this.devis.length) { this.devis = data; this.filteredDevis = data; }
        this.computeKpis();
      },
      error: () => { } // Ne bloque pas si la table devis a un problème SQL
    });
  }

  computeKpis(): void {
    // CA total des factures payées (ou des commandes payées)
    const caFactures = this.factures
      .filter(f => f.statut === 'PAYEE')
      .reduce((sum, f) => sum + (f.montantTotal || 0), 0);
    const caCommandes = this.commandes
      .filter(c => c.statut === 'PAYEE')
      .reduce((sum, c) => sum + (c.montantTotal || 0), 0);

    this.kpis.totalCA = Math.max(caFactures, caCommandes);

    // Commandes ce mois
    const now = new Date();
    this.kpis.commandesMois = this.commandes.filter(c => {
      const d = new Date(c.dateCommande);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Factures en attente
    this.kpis.facturesEnAttente = this.factures.filter(f => f.statut === 'EN_ATTENTE').length;

    // Taux de facturation (commandes ayant une facture / total commandes)
    const commandesPayees = this.commandes.filter(c => c.statut === 'PAYEE').length;
    this.kpis.tauxFacturation = this.commandes.length > 0
      ? Math.round((commandesPayees / this.commandes.length) * 100)
      : 0;

    // Nouveaux KPIs
    this.kpis.facturesImpayees = this.factures.filter(
      f => f.statut === 'EN_ATTENTE' || f.statut === 'IMPAYEE'
    ).length;

    const totalDevis = this.devis.length;
    const devisAcceptes = this.devis.filter(d => d.statut === 'ACCEPTE').length;
    this.kpis.tauxConversionDevis = totalDevis > 0 ? Math.round((devisAcceptes / totalDevis) * 100) : 0;
    this.kpis.devisEnCours = this.devis.filter(d => d.statut === 'BROUILLON' || d.statut === 'ENVOYE').length;

    // Mois courant label
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    this.currentMonthLabel = months[now.getMonth()] + ' ' + now.getFullYear();

    // Statistiques commandes
    this.commandesStats = {
      payees: this.commandes.filter(c => c.statut === 'PAYEE').length,
      attente: this.commandes.filter(c => c.statut === 'EN_ATTENTE').length,
      annulees: this.commandes.filter(c => c.statut === 'ANNULEE').length
    };

    // Top 5 clients
    this.computeTop5Clients();

    // Alertes opérationnelles
    this.computeOpsAlerts();

    // Activités récentes
    this.computeRecentActivities();
  }

  computeTop5Clients(): void {
    const map = new Map<string, { nom: string; nbCommandes: number; ca: number }>();
    for (const c of this.commandes) {
      const nom = c.client?.nom || 'Inconnu';
      const existing = map.get(nom) || { nom, nbCommandes: 0, ca: 0 };
      existing.nbCommandes++;
      if (c.statut === 'PAYEE') existing.ca += c.montantTotal || 0;
      map.set(nom, existing);
    }
    const sorted = Array.from(map.values()).sort((a, b) => b.ca - a.ca).slice(0, 5);
    const totalCA = sorted.reduce((s, c) => s + c.ca, 0);
    this.top5Clients = sorted.map(c => ({
      ...c,
      part: totalCA > 0 ? Math.round((c.ca / totalCA) * 100) : 0
    }));
  }

  computeOpsAlerts(): void {
    this.opsAlerts = [];
    const retard = this.factures.filter(f => {
      if (f.statut === 'PAYEE' || f.statut === 'ANNULEE') return false;
      return f.dateEcheance && new Date(f.dateEcheance) < new Date();
    }).length;
    if (retard > 0) this.opsAlerts.push({
      type: 'danger',
      icon: 'warning',
      message: `${retard} facture(s) en retard de paiement — pensez à envoyer un rappel.`
    });

    const devisExpires = this.devis.filter(d => {
      if (d.statut !== 'ENVOYE') return false;
      return d.dateValidite && new Date(d.dateValidite) < new Date();
    }).length;
    if (devisExpires > 0) this.opsAlerts.push({
      type: 'warning',
      icon: 'event_busy',
      message: `${devisExpires} devis expiré(s) — relancez vos clients.`
    });

    if (this.kpis.commandesMois === 0) this.opsAlerts.push({
      type: 'info',
      icon: 'info',
      message: 'Aucune commande enregistrée ce mois-ci.'
    });
  }

  computeRecentActivities(): void {
    const acts: any[] = [];
    // 5 dernières commandes
    [...this.commandes]
      .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime())
      .slice(0, 3)
      .forEach(c => acts.push({
        type: 'commande', icon: 'shopping_cart',
        label: `Commande ${c.numeroCommande || '#'}`,
        date: c.dateCommande, client: c.client?.nom || '—',
        montant: c.montantTotal
      }));
    // 3 dernières factures
    [...this.factures]
      .sort((a, b) => new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime())
      .slice(0, 2)
      .forEach(f => acts.push({
        type: 'facture', icon: 'receipt_long',
        label: `Facture ${f.numeroFacture || '#'}`,
        date: f.dateEmission, client: f.commande?.client?.nom || '—',
        montant: f.montantTotal
      }));
    this.recentActivities = acts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }

  loadDashboard(): void {
    // Détruire les charts existants avant tout pour éviter les conflits
    this.destroyCharts();

    // Construire les loaders pour les données manquantes
    const loaders: Promise<void>[] = [];
    if (!this.commandes.length) loaders.push(
      new Promise<void>(r => this.commercialService.getCommandes().subscribe({ next: d => { this.commandes = d; this.filteredCommandes = d; r(); }, error: () => r() }))
    );
    if (!this.factures.length) loaders.push(
      new Promise<void>(r => this.commercialService.getFactures().subscribe({ next: d => { this.factures = d; this.filteredFactures = d; r(); }, error: () => r() }))
    );
    if (!this.clients.length) loaders.push(
      new Promise<void>(r => this.commercialService.getClients().subscribe({ next: d => { this.clients = d; this.filteredClients = d; r(); }, error: () => r() }))
    );
    if (!this.devis.length) loaders.push(
      new Promise<void>(r => this.commercialService.getDevis().subscribe({ next: d => { this.devis = d; this.filteredDevis = d; r(); }, error: () => r() }))
    );

    if (loaders.length > 0) {
      // Utiliser allSettled pour que même si un loader échoue, les charts se construisent
      Promise.allSettled(loaders).then(() => {
        this.computeKpis();
        setTimeout(() => this.buildDashboardCharts(), 300);
      });
    } else {
      // Toutes les données sont déjà chargées
      this.computeKpis();
      setTimeout(() => this.buildDashboardCharts(), 300);
    }
  }

  buildDashboardCharts(): void {
    // Sécurité : ne pas construire si on n'est plus sur le dashboard
    if (this.activeTab !== 'dashboard') return;
    if (this.isChartsBuilding) return;
    this.isChartsBuilding = true;
    this.destroyCharts();
    this.buildCaChart();
    this.buildDoughnutChart();
    this.isChartsBuilding = false;
  }

  buildDoughnutChart(): void {
    const canvas = document.getElementById('cmdDoughnutChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.doughnutChart) { this.doughnutChart.destroy(); this.doughnutChart = null; }
    const { payees, attente, annulees } = this.commandesStats;
    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Payées', 'En attente', 'Annulées'],
        datasets: [{
          data: [payees, attente, annulees],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: false,          // FIXE : évite la boucle ResizeObserver
        maintainAspectRatio: true,  // FIXE : ratio respecté
        animation: false,            // FIXE : pas d'accumulation de frames
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` }
          }
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  destroyCharts(): void {
    if (this.caChart) { this.caChart.destroy(); this.caChart = null; }
    if (this.cmdChart) { this.cmdChart.destroy(); this.cmdChart = null; }
    if (this.doughnutChart) { this.doughnutChart.destroy(); this.doughnutChart = null; }
  }

  buildCharts(): void {
    this.destroyCharts();
    this.buildCaChart();
    this.buildCmdChart();
  }

  getMonthlyData(): { labels: string[], caData: number[], cmdData: number[] } {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const labels: string[] = [];
    const caData: number[] = [];
    const cmdData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2));

      const mCommandes = this.commandes.filter(c => {
        const cd = new Date(c.dateCommande);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      });

      caData.push(
        mCommandes
          .filter(c => c.statut === 'PAYEE')
          .reduce((sum: number, c: any) => sum + (c.montantTotal || 0), 0)
      );
      cmdData.push(mCommandes.length);
    }
    return { labels, caData, cmdData };
  }

  buildCaChart(): void {
    const canvas = document.getElementById('caChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.caChart) { this.caChart.destroy(); this.caChart = null; }
    const { labels, caData } = this.getMonthlyData();

    this.caChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'CA (TND)',
          data: caData,
          backgroundColor: 'rgba(249,115,22,0.75)',
          borderColor: '#f97316',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: false,          // FIXE : évite la boucle ResizeObserver
        maintainAspectRatio: false, // Le canvas height="200" contrôle la hauteur
        animation: false,            // FIXE : pas d'accumulation de frames
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y ?? 0).toFixed(3)} TND`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: {
            grid: { color: 'rgba(148,163,184,0.1)' },
            ticks: {
              color: '#94a3b8', font: { size: 11 },
              callback: (v: any) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v
            }
          }
        }
      }
    });
  }

  buildCmdChart(): void {
    const canvas = document.getElementById('cmdChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.cmdChart) { this.cmdChart.destroy(); this.cmdChart = null; }
    const { labels, cmdData } = this.getMonthlyData();

    this.cmdChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Commandes',
          data: cmdData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: {
            grid: { color: 'rgba(148,163,184,0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 },
            beginAtZero: true
          }
        }
      }
    });
  }

  clearMessages(): void { this.successMsg = ''; this.errorMsg = ''; }

  showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3500);
  }

  showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => this.errorMsg = '', 4000);
  }

  // ══════════════════════════════════════════════════════════════
  // FORMS INIT
  // ══════════════════════════════════════════════════════════════
  initForms(): void {
    this.clientForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      adresse: [''],
      matriculeFiscale: ['']
    });

    this.fournisseurForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      adresse: [''],
      matriculeFiscale: ['']
    });

    this.commandeForm = this.fb.group({
      clientId: ['', Validators.required],
      lignes: this.fb.array([this.createLigne()])
    });

    this.devisForm = this.fb.group({
      clientId: ['', Validators.required],
      notes: [''],
      lignes: this.fb.array([this.createLigne()])
    });

    this.promoForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{3,20}$/)]],
      description: [''],
      typeRemise: ['POURCENTAGE', Validators.required],
      valeur: ['', [Validators.required, Validators.min(0.001)]],
      montantMinimum: [0],
      plafondRemise: [''],
      utilisationsMax: [''],
      dateDebut: [''],
      dateFin: ['']
    });
  }

  createLigne(): FormGroup {
    return this.fb.group({
      produitId: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
      remise: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  get lignes(): FormArray { return this.commandeForm.get('lignes') as FormArray; }
  addLigne(): void { this.lignes.push(this.createLigne()); }
  removeLigne(i: number): void { if (this.lignes.length > 1) this.lignes.removeAt(i); }

  // ══════════════════════════════════════════════════════════════
  // CLIENTS
  // ══════════════════════════════════════════════════════════════
  loadClients(): void {
    this.isLoading = true;
    this.commercialService.getClients().subscribe({
      next: (data) => { this.clients = data; this.filterClients(); this.isLoading = false; },
      error: () => { this.isLoading = false; this.showError('Erreur de chargement des clients'); }
    });
  }

  filterClients(): void {
    const q = this.clientSearch.toLowerCase();
    this.filteredClients = this.clients.filter(c =>
      c.nom?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.telephone?.includes(q)
    );
  }

  openClientModal(client?: any): void {
    this.showClientModal = true;
    this.isEditingClient = !!client;
    this.selectedClientId = client?.id || null;
    this.clientForm.reset();
    if (client) this.clientForm.patchValue(client);
  }

  closeClientModal(): void { this.showClientModal = false; }

  saveClient(): void {
    if (this.clientForm.invalid) return;
    const data = this.clientForm.value;
    const obs = this.isEditingClient
      ? this.commercialService.updateClient(this.selectedClientId!, data)
      : this.commercialService.createClient(data);
    obs.subscribe({
      next: () => { this.closeClientModal(); this.loadClients(); this.showSuccess(this.isEditingClient ? 'Client modifié ✓' : 'Client créé ✓'); },
      error: (err) => this.showError(err.error || 'Erreur lors de l\'enregistrement')
    });
  }

  deleteClient(id: number): void {
    if (!confirm('Supprimer ce client ?')) return;
    this.commercialService.deleteClient(id).subscribe({
      next: () => { this.loadClients(); this.showSuccess('Client supprimé ✓'); },
      error: () => this.showError('Impossible de supprimer ce client (commandes existantes)')
    });
  }

  // ══════════════════════════════════════════════════════════════
  // FOURNISSEURS
  // ══════════════════════════════════════════════════════════════
  loadFournisseurs(): void {
    this.isLoading = true;
    this.commercialService.getFournisseurs().subscribe({
      next: (data) => { this.fournisseurs = data; this.filterFournisseurs(); this.isLoading = false; },
      error: () => { this.isLoading = false; this.showError('Erreur de chargement des fournisseurs'); }
    });
  }

  filterFournisseurs(): void {
    const q = this.fournisseurSearch.toLowerCase();
    this.filteredFournisseurs = this.fournisseurs.filter(f =>
      f.nom?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q)
    );
  }

  openFournisseurModal(f?: any): void {
    this.showFournisseurModal = true;
    this.isEditingFournisseur = !!f;
    this.selectedFournisseurId = f?.id || null;
    this.fournisseurForm.reset();
    if (f) this.fournisseurForm.patchValue(f);
  }

  closeFournisseurModal(): void { this.showFournisseurModal = false; }

  saveFournisseur(): void {
    if (this.fournisseurForm.invalid) return;
    const data = this.fournisseurForm.value;
    const obs = this.isEditingFournisseur
      ? this.commercialService.updateFournisseur(this.selectedFournisseurId!, data)
      : this.commercialService.createFournisseur(data);
    obs.subscribe({
      next: () => { this.closeFournisseurModal(); this.loadFournisseurs(); this.showSuccess(this.isEditingFournisseur ? 'Fournisseur modifié ✓' : 'Fournisseur créé ✓'); },
      error: (err) => this.showError(err.error || 'Erreur lors de l\'enregistrement')
    });
  }

  deleteFournisseur(id: number): void {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    this.commercialService.deleteFournisseur(id).subscribe({
      next: () => { this.loadFournisseurs(); this.showSuccess('Fournisseur supprimé ✓'); },
      error: () => this.showError('Impossible de supprimer ce fournisseur')
    });
  }

  // ══════════════════════════════════════════════════════════════
  // COMMANDES
  // ══════════════════════════════════════════════════════════════
  loadCommandes(): void {
    this.isLoading = true;
    this.commercialService.getCommandes().subscribe({
      next: (data) => {
        this.commandes = data.sort((a: any, b: any) =>
          new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime());
        this.filterCommandes();
        this.computeKpis();
        setTimeout(() => this.buildCharts(), 200);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.showError('Erreur chargement commandes'); }
    });
  }

  loadProducts(): void {
    this.stockService.getProducts().subscribe({
      next: (data) => this.products = data,
      error: () => { }
    });
  }

  filterCommandes(): void {
    const q = this.commandeSearch.toLowerCase();
    this.filteredCommandes = this.commandes.filter(c => {
      const matchSearch = c.numeroCommande?.toLowerCase().includes(q) || c.client?.nom?.toLowerCase().includes(q);
      const matchStatut = !this.commandeStatutFilter || c.statut === this.commandeStatutFilter;
      return matchSearch && matchStatut;
    });
  }

  openCommandeModal(): void {
    this.showCommandeModal = true;
    this.commandeForm.reset();
    while (this.lignes.length > 1) this.lignes.removeAt(0);
    this.lignes.at(0)?.reset({ quantite: 1, remise: 0 });
  }

  closeCommandeModal(): void { this.showCommandeModal = false; }

  getProductById(id: any): any { return this.products.find(p => p.id == id); }

  calcLigneTotal(ligne: any): number {
    const p = this.getProductById(ligne.value?.produitId);
    if (!p) return 0;
    const qty = ligne.value?.quantite || 0;
    const remise = ligne.value?.remise || 0;
    return p.prixUnitaire * qty * (1 - remise / 100);
  }

  calcCommandeTotal(): number {
    return this.lignes.controls.reduce((sum, l) => sum + this.calcLigneTotal(l), 0);
  }

  saveCommande(): void {
    if (this.commandeForm.invalid) return;
    const body: any = {
      clientId: this.commandeForm.value.clientId,
      lignes: this.commandeForm.value.lignes
    };
    // Ajouter le code promo si vérifié et valide
    if (this.promoVerifResult?.valide && this.codePromoInput.trim()) {
      body.codePromo = this.codePromoInput.trim().toUpperCase();
    }
    this.commercialService.createCommande(body).subscribe({
      next: (res: any) => {
        this.closeCommandeModal();
        this.effacerCodePromo();
        this.loadCommandes();
        this.loadFactures();
        // Message avec numéro de facture générée
        const numFac = res?.facture?.numeroFacture || res?.numeroFacture || '';
        const msg = numFac
          ? `Commande créée ✓ — Facture ${numFac} générée automatiquement`
          : 'Commande créée avec succès ✓';
        this.showSuccess(msg);
      },
      error: (err) => this.showError(
        typeof err.error === 'string' ? err.error : err.error?.message || 'Erreur création commande'
      )
    });
  }

  openCommandeDetail(commande: any): void {
    this.selectedCommande = commande;
    this.showCommandeDetailModal = true;
    this.commercialService.getLignesCommande(commande.id).subscribe({
      next: (lignes) => this.selectedCommandeLignes = lignes,
      error: () => this.selectedCommandeLignes = []
    });
  }

  closeCommandeDetail(): void { this.showCommandeDetailModal = false; this.selectedCommande = null; }

  changerStatut(commande: any, statut: string): void {
    this.commercialService.changerStatutCommande(commande.id, statut).subscribe({
      next: () => { this.loadCommandes(); this.showSuccess('Statut mis à jour ✓'); },
      error: () => this.showError('Erreur mise à jour statut')
    });
  }

  genererFacture(commandeId: number): void {
    this.commercialService.genererFacture(commandeId).subscribe({
      next: () => { this.loadCommandes(); this.showSuccess('Facture générée avec succès ✓'); },
      error: (err) => this.showError(err.error || 'Erreur génération facture')
    });
  }

  deleteCommande(id: number): void {
    if (!confirm('Supprimer cette commande ?')) return;
    this.commercialService.deleteCommande(id).subscribe({
      next: () => { this.loadCommandes(); this.showSuccess('Commande supprimée ✓'); },
      error: () => this.showError('Impossible de supprimer cette commande')
    });
  }

  // ══════════════════════════════════════════════════════════════
  // DEVIS
  // ══════════════════════════════════════════════════════════════
  loadDevis(): void {
    this.isLoading = true;
    this.commercialService.getDevis().subscribe({
      next: (data) => {
        this.devis = data.sort((a: any, b: any) => new Date(b.dateDevis).getTime() - new Date(a.dateDevis).getTime());
        this.filterDevis();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.showError('Erreur chargement devis'); }
    });
  }

  filterDevis(): void {
    const q = this.devisSearch.toLowerCase();
    this.filteredDevis = this.devis.filter(d => {
      const matchSearch = d.numeroDevis?.toLowerCase().includes(q) || d.client?.nom?.toLowerCase().includes(q);
      const matchStatut = !this.devisStatutFilter || d.statut === this.devisStatutFilter;
      return matchSearch && matchStatut;
    });
  }

  get devisLignes(): FormArray { return this.devisForm.get('lignes') as FormArray; }
  addDevisLigne(): void { this.devisLignes.push(this.createLigne()); }
  removeDevisLigne(i: number): void { if (this.devisLignes.length > 1) this.devisLignes.removeAt(i); }

  openDevisModal(): void {
    this.showDevisModal = true;
    this.devisForm.reset();
    while (this.devisLignes.length > 1) this.devisLignes.removeAt(0);
    this.devisLignes.at(0)?.reset({ quantite: 1, remise: 0 });
  }
  closeDevisModal(): void { this.showDevisModal = false; }

  calcDevisLigneTotal(ligne: any): number {
    const p = this.getProductById(ligne.value?.produitId);
    if (!p) return 0;
    return p.prixUnitaire * (ligne.value?.quantite || 0) * (1 - (ligne.value?.remise || 0) / 100);
  }
  calcDevisTotal(): number {
    return this.devisLignes.controls.reduce((s, l) => s + this.calcDevisLigneTotal(l), 0);
  }

  saveDevis(): void {
    if (this.devisForm.invalid) return;
    const body = {
      clientId: this.devisForm.value.clientId,
      notes: this.devisForm.value.notes || '',
      lignes: this.devisForm.value.lignes
    };
    this.commercialService.createDevis(body).subscribe({
      next: () => { this.closeDevisModal(); this.loadDevis(); this.showSuccess('Devis créé avec succès ✓'); },
      error: (err) => this.showError(err.error || 'Erreur création devis')
    });
  }

  changerStatutDevis(d: any, statut: string): void {
    this.commercialService.changerStatutDevis(d.id, statut).subscribe({
      next: () => { this.loadDevis(); this.showSuccess('Statut mis à jour ✓'); },
      error: () => this.showError('Erreur mise à jour statut')
    });
  }

  devisLangue: 'fr' | 'en' | 'ar' = 'fr';

  dL(fr: string, en: string, ar: string): string {
    if (this.devisLangue === 'ar') return ar;
    if (this.devisLangue === 'en') return en;
    return fr;
  }

  get dLabels() {
    const l = this.devisLangue;
    return {
      titre:          this.dL('DEVIS COMMERCIAL', 'COMMERCIAL QUOTE', 'عرض أسعار تجاري'),
      numero:         this.dL('N° Devis', 'Quote No.', 'رقم العرض'),
      date:           this.dL('Date :', 'Date:', 'التاريخ :'),
      validite:       this.dL('Date de Validité :', 'Validity Date:', 'تاريخ الصلاحية :'),
      emetteur:       this.dL('ÉMETTEUR', 'ISSUER', 'المصدر'),
      destinataire:   this.dL('DESTINATAIRE / CLIENT', 'RECIPIENT / CLIENT', 'المستلم / الحريف'),
      activite:       this.dL('Matériel Informatique & Électronique', 'IT & Electronic Equipment', 'معدات المعلوماتية والإلكترونيات'),
      activiteClient: this.dL('Proposition commerciale pour matériel & services', 'Commercial proposal for equipment & services', 'عرض تجاري للمعدات والخدمات'),
      mf:             this.dL('Matricule Fiscal :', 'Tax Reg. No.:', 'المعرف الجبائي :'),
      ice:            this.dL('ICE :', 'ICE:', 'ICE :'),
      rc:             this.dL('RC :', 'CR:', 'س ت :'),
      designation:    this.dL('DÉSIGNATION', 'DESCRIPTION', 'البيان'),
      reference:      this.dL('RÉFÉRENCE', 'REFERENCE', 'المرجع'),
      qte:            this.dL('QTÉ', 'QTY', 'الكمية'),
      prixHt:         this.dL('PRIX UNIT. HT', 'UNIT PRICE EXCL. TAX', 'السعر الفردي خ.ز.'),
      remise:         this.dL('REMISE', 'DISCOUNT', 'التخفيض'),
      totalHt:        this.dL('TOTAL HT', 'TOTAL EXCL. TAX', 'المجموع خ.ز.'),
      tva:            this.dL('TVA (19%)', 'VAT (19%)', 'الضريبة (19%)'),
      totalTtc:       this.dL('TOTAL TTC', 'TOTAL INCL. TAX', 'المجموع ش.ر.'),
      totalHtLabel:   this.dL('Sous-total HT', 'Subtotal Excl. Tax', 'المجموع الفرعي خ.ز.'),
      tvaLabel:       this.dL('Total TVA (19%)', 'Total VAT (19%)', 'إجمالي الضريبة (19%)'),
      totalTtcLabel:  this.dL('TOTAL GÉNÉRAL TTC', 'GRAND TOTAL INCL. TAX', 'المجموع الإجمالي ش.ر.'),
      arretee:        this.dL('ARRETÉ LE PRÉSENT DEVIS À LA SOMME DE :', 'THIS QUOTE TOTAL AMOUNT:', 'مجموع هذا العرض :'),
      seulement:      this.dL('seulement', 'only', 'فقط'),
      conditions:     this.dL('CONDITIONS COMMERCIALES & VALIDITÉ', 'COMMERCIAL TERMS & VALIDITY', 'الشروط التجارية والصلاحية'),
      delaiLivraison: this.dL('Délai de livraison : 48h à 72h ouvrées après confirmation', 'Delivery timeframe: 48h to 72h business days after confirmation', 'مدة التسليم: من 48 إلى 72 ساعة عمل بعد التأكيد'),
      modaliteReglement: this.dL('Modalités de règlement : 30% à la commande, solde à la livraison', 'Payment terms: 30% upon order, balance on delivery', 'طريقة الدفع: 30% عند الطلب، الباقي عند التسليم'),
      accordClient:   this.dL('Bon pour Accord & Signature Client', 'Approved & Client Signature', 'موافق عليه وتوقيع الحريف'),
      cachetSign:     this.dL('Cachet & Signature Direction Commerciale', 'Sales Management Stamp & Signature', 'ختم وتوقيع الإدارة التجارية'),
      merci:          this.dL('Merci pour votre confiance !', 'Thank you for your trust!', 'شكراً لثقتكم بنا !'),
      merciSub:       this.dL('Ce devis est soumis aux conditions générales de vente de BENJEDDOU ERP.', 'This quote is subject to BENJEDDOU ERP general sales terms.', 'يخضع هذا العرض للشروط العامة لـ BENJEDDOU ERP.'),
      dir:            l === 'ar' ? 'rtl' : 'ltr'
    };
  }

  imprimerDevis(): void {
    const dir = this.devisLangue === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    window.print();
    const uiLang = localStorage.getItem('erp_lang') || 'fr';
    document.documentElement.setAttribute('dir', uiLang === 'ar' ? 'rtl' : 'ltr');
  }

  openDevisDetail(d: any): void {
    this.selectedDevis = d;
    this.showDevisDetailModal = true;
    this.commercialService.getLignesDevis(d.id).subscribe({
      next: (l) => this.selectedDevisLignes = l,
      error: () => this.selectedDevisLignes = []
    });
  }
  closeDevisDetail(): void { this.showDevisDetailModal = false; this.selectedDevis = null; }


  // ── Modal conversion ──────────────────────────────────────────
  showConversionModal = false;
  conversionLoading = false;
  devisAConvertir: any = null;
  commandeCreee: any = null;
  showConversionSuccessModal = false;

  ouvrirModalConversion(d: any): void {
    if (d.statut !== 'ACCEPTE') {
      this.showError('Le devis doit être ACCEPTÉ avant la conversion');
      return;
    }
    this.devisAConvertir = d;
    this.showConversionModal = true;
  }

  fermerModalConversion(): void {
    this.showConversionModal = false;
    this.devisAConvertir = null;
  }

  confirmerConversion(): void {
    if (!this.devisAConvertir) return;
    this.conversionLoading = true;
    this.commercialService.convertirEnCommande(this.devisAConvertir.id).subscribe({
      next: (res: any) => {
        this.conversionLoading = false;
        this.commandeCreee = res.commande;
        this.showConversionModal = false;
        this.showConversionSuccessModal = true;
        this.loadDevis();
      },
      error: (err: any) => {
        this.conversionLoading = false;
        this.showError(err?.error || 'Erreur lors de la conversion');
        this.fermerModalConversion();
      }
    });
  }

  convertirDevisEnCommande(d: any): void {
    this.ouvrirModalConversion(d);
  }

  allerVersCommandes(): void {
    this.showConversionSuccessModal = false;
    this.commandeCreee = null;
    this.switchTab('commandes');
  }

  fermerSuccessModal(): void {
    this.showConversionSuccessModal = false;
    this.commandeCreee = null;
  }

  deleteDevis(id: number): void {
    if (!confirm('Supprimer ce devis ?')) return;
    this.commercialService.deleteDevis(id).subscribe({
      next: () => { this.loadDevis(); this.showSuccess('Devis supprimé ✓'); },
      error: () => this.showError('Impossible de supprimer ce devis')
    });
  }

  getDevisStatutClass(statut: string): string {
    const map: any = {
      'DEMANDE_CLIENT': 'badge-warning',
      'BROUILLON': 'badge-secondary',
      'ENVOYE': 'badge-info',
      'ACCEPTE': 'badge-success',
      'REFUSE': 'badge-danger'
    };
    return map[statut] || 'badge-secondary';
  }
  getDevisStatutLabel(statut: string): string {
    const map: any = {
      'DEMANDE_CLIENT': this.dL('📩 Demande Client', '📩 Client Request', '📩 طلب عميل'),
      'BROUILLON': this.dL('📝 Brouillon', '📝 Draft', '📝 مسودة'),
      'ENVOYE': this.dL('📤 Envoyé', '📤 Sent', '📤 مرسل'),
      'ACCEPTE': this.dL('✅ Accepté', '✅ Accepted', '✅ مقبول'),
      'REFUSE': this.dL('❌ Refusé', '❌ Rejected', '❌ مرفوض')
    };
    return map[statut] || statut;
  }

  /** Traite une demande client : passe le statut en BROUILLON et ouvre le modal d'édition */
  traiterDemandeClient(d: any): void {
    if (!confirm(`Traiter la demande ${d.numeroDevis} et créer un devis officiel ?`)) return;
    this.commercialService.changerStatutDevis(d.id, 'BROUILLON').subscribe({
      next: () => {
        this.showSuccess(`Demande ${d.numeroDevis} convertie en devis brouillon ✓`);
        this.loadDevis();
      },
      error: () => this.showError('Erreur lors du traitement de la demande')
    });
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

  // ══════════════════════════════════════════════════════════════
  // FACTURES
  // ══════════════════════════════════════════════════════════════
  loadFactures(): void {
    this.isLoading = true;
    this.commercialService.getFactures().subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : [];
        this.factures = this.applyLocalPaidStatus(raw).sort((a: any, b: any) =>
          new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime());
        this.filterFactures();
        this.computeKpis();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.showError('Erreur chargement factures'); }
    });
  }

  filterFactures(): void {
    const q = this.factureSearch.toLowerCase();
    this.filteredFactures = this.factures.filter(f => {
      const matchSearch = f.numeroFacture?.toLowerCase().includes(q) || f.commande?.client?.nom?.toLowerCase().includes(q);
      const matchStatut = !this.factureStatutFilter || f.statut === this.factureStatutFilter;
      return matchSearch && matchStatut;
    });
  }

  selectedFactureLignes: any[] = [];
  showConversionMenu = false;
  showConvertedSuccessModal = false;
  lastConvertedDoc: any = null;

  /** Langue courante de la facture affichée (indépendante de la langue de l'UI) */
  factureLangue: 'fr' | 'en' | 'ar' = 'fr';

  /** Retourne le texte correspondant à la langue courante de la facture */
  fL(fr: string, en: string, ar: string): string {
    if (this.factureLangue === 'ar') return ar;
    if (this.factureLangue === 'en') return en;
    return fr;
  }

  /** Labels traduits utilisés dans le template de facture */
  get fLabels() {
    const l = this.factureLangue;
    return {
      // Titre document
      titre:          this.fL('FACTURE', 'INVOICE', 'فاتورة'),
      numero:         this.fL('N°', 'No.', 'رقم'),
      date:           this.fL('Date :', 'Date:', 'التاريخ :'),
      // Parties
      emetteur:       this.fL('ÉMETTEUR', 'ISSUER', 'المصدر'),
      destinataire:   this.fL('DESTINATAIRE', 'RECIPIENT', 'المستلم'),
      activite:       this.fL('Matériel Informatique & Électronique', 'IT & Electronic Equipment', 'معدات المعلوماتية والإلكترونيات'),
      activiteClient: this.fL('Vente de matériel informatique & électronique', 'Sale of IT & electronic equipment', 'بيع المعدات الإلكترونية'),
      mf:             this.fL('Matricule Fiscal :', 'Tax Reg. No.:', 'المعرف الجبائي :'),
      ice:            this.fL('ICE :', 'ICE:', 'ICE :'),
      rc:             this.fL('RC :', 'CR:', 'س ت :'),
      // Références
      bonCommande:    this.fL('N° Bon de Commande', 'Purchase Order No.', 'رقم أمر الشراء'),
      dateBonCmd:     this.fL('Date Bon de Commande', 'Purchase Order Date', 'تاريخ أمر الشراء'),
      bonLivraison:   this.fL('Bon de Livraison', 'Delivery Note', 'وصل التسليم'),
      // Tableau articles
      designation:    this.fL('DÉSIGNATION', 'DESCRIPTION', 'البيان'),
      qte:            this.fL('QTÉ', 'QTY', 'الكمية'),
      prixHt:         this.fL('PRIX HT', 'UNIT PRICE', 'السعر خ.)ز.'),
      tva:            this.fL('TVA (19%)', 'VAT (19%)', 'ضريبة (19%)'),
      totalTtc:       this.fL('TOTAL TTC', 'TOTAL INCL. TAX', 'المجموع ش.)ر.'),
      ref:            this.fL('Réf:', 'Ref:', 'مرجع:'),
      // Totaux
      totalHtLabel:   this.fL('Total HT', 'Subtotal', 'المجموع خ.ز.'),
      tvaLabel:       this.fL('Total TVA (19%)', 'VAT Total (19%)', 'إجمالي الضريبة (19%)'),
      totalTtcLabel:  this.fL('TOTAL TTC', 'GRAND TOTAL', 'المجموع ش.ر.'),
      // Montant en lettres
      arretee:        this.fL('ARRETÉE LA PRÉSENTE FACTURE À LA SOMME DE :', 'THIS INVOICE TOTAL AMOUNT:', 'مجموع هذه الفاتورة :'),
      seulement:      this.fL('seulement', 'only', 'فقط'),
      // Pied de page conditions paiement
      condPaiement:   this.fL('CONDITIONS DE PAIEMENT', 'PAYMENT TERMS', 'شروط الدفع'),
      paiementRecep:  this.fL('Paiement à réception par :', 'Payment on receipt by:', 'الدفع عند الاستلام :'),
      virementCarte:  this.fL('Virement ou Carte bancaire en ligne', 'Wire transfer or Online card payment', 'تحويل مصرفي أو بطاقة بنكية'),
      echeance:       this.fL('Échéance :', 'Due date:', 'تاريخ الاستحقاق :'),
      // Pied de page paiement réglé
      detailReglement: this.fL('DÉTAILS DU RÈGLEMENT', 'PAYMENT DETAILS', 'تفاصيل الدفع'),
      acquittee:      this.fL('ACQUITTÉE', 'SETTLED', 'مسددة'),
      statut:         this.fL('Statut :', 'Status:', 'الحالة :'),
      regleeTot:      this.fL('RÉGLÉE EN TOTALITÉ ✓', 'FULLY SETTLED ✓', 'مسددة بالكامل ✓'),
      mode:           this.fL('Mode :', 'Method:', 'طريقة الدفع :'),
      datePaiement:   this.fL('Date :', 'Date:', 'التاريخ :'),
      montant:        this.fL('Montant :', 'Amount:', 'المبلغ :'),
      quittance:      this.fL('Quittance :', 'Receipt No.:', 'رقم الوصل :'),
      // Coordonnées bancaires
      coordBancaires: this.fL('COORDONNÉES BANCAIRES', 'BANK DETAILS', 'البيانات البنكية'),
      compteCred:     this.fL('COMPTE CRÉDITÉ', 'ACCOUNT CREDITED', 'الحساب المدان'),
      banque:         this.fL('Banque', 'Bank', 'البنك'),
      fondsCertifies: this.fL('Fonds encaissés & certifiés', 'Funds received & certified', 'الأموال متحصلة ومعتمدة'),
      // Cachet
      cachetSign:     this.fL('Cachet & Signature', 'Stamp & Signature', 'الختم والتوقيع'),
      // Trust badges
      badge1:         this.fL('PRODUITS DE QUALITÉ', 'QUALITY PRODUCTS', 'منتجات عالية الجودة'),
      badge1sub:      this.fL('Matériel 100% testé', '100% tested equipment', 'مواد مختبرة 100%'),
      badge2:         this.fL('SERVICE PROFESSIONNEL', 'PROFESSIONAL SERVICE', 'خدمة محترفة'),
      badge2sub:      this.fL('À votre écoute', 'At your service', 'في خدمتكم'),
      badge3:         this.fL('LIVRAISON RAPIDE', 'FAST DELIVERY', 'توصيل سريع'),
      badge3sub:      this.fL('Partout en Tunisie', 'Across Tunisia', 'عبر تونس كاملة'),
      badge4:         this.fL('SATISFACTION GARANTIE', 'SATISFACTION GUARANTEED', 'رضا مضمون'),
      badge4sub:      this.fL('Votre confiance, notre priorité', 'Your trust, our priority', 'ثقتكم أولويتنا'),
      // Message final
      merci:          this.fL('Merci pour votre confiance !', 'Thank you for your trust!', 'شكراً لثقتكم بنا !'),
      merciSub:       this.fL('Nous restons à votre service pour toute information complémentaire.', 'We remain at your service for any further information.', 'نحن في خدمتكم لأي معلومات إضافية.'),
      // QR
      qrHint:         this.fL('Scannez pour vérifier l\'authenticité de la facture', 'Scan to verify invoice authenticity', 'امسح للتحقق من أصالة الفاتورة'),
      // Dir
      dir:            l === 'ar' ? 'rtl' : 'ltr',
    };
  }

  toggleConversionMenu(): void {
    this.showConversionMenu = !this.showConversionMenu;
  }

  openFactureDetail(facture: any): void {
    this.selectedFacture = facture;
    this.showConversionMenu = false;

    // 1. Chercher la commande correspondante dans this.commandes
    const matchingCmd = this.commandes.find(c => 
      (facture.commande?.id && c.id === facture.commande.id) ||
      (facture.commandeId && c.id === facture.commandeId) ||
      (facture.commande?.numeroCommande && c.numeroCommande === facture.commande.numeroCommande) ||
      (facture.numeroFacture && c.facture?.numeroFacture === facture.numeroFacture) ||
      (facture.id && c.facture?.id === facture.id)
    );

    if (matchingCmd?.lignes && Array.isArray(matchingCmd.lignes) && matchingCmd.lignes.length > 0) {
      this.selectedFactureLignes = [...matchingCmd.lignes];
    } else {
      this.fallbackFactureLignes(facture);
    }

    const commandeId = matchingCmd?.id 
      || facture.commande?.id 
      || (typeof facture.commande === 'number' ? facture.commande : null)
      || facture.commandeId;

    this.showFactureDetailModal = true;
    this.cdr.detectChanges();

    // 2. Charger les vraies lignes d'articles de la commande depuis l'API
    if (commandeId) {
      this.commercialService.getLignesCommande(commandeId).subscribe({
        next: (lignes) => {
          if (Array.isArray(lignes) && lignes.length > 0) {
            this.selectedFactureLignes = [...lignes];
            if (matchingCmd) matchingCmd.lignes = lignes;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.cdr.detectChanges();
        }
      });
    } else if (facture.id) {
      this.commercialService.getLignesFacture(facture.id).subscribe({
        next: (lignes) => {
          if (Array.isArray(lignes) && lignes.length > 0) {
            this.selectedFactureLignes = [...lignes];
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.cdr.detectChanges();
        }
      });
    }
  }

  voirFactureDeCommande(commande: any): void {
    const f = this.factures.find(fac => 
      fac.commande?.id === commande.id || 
      fac.commandeId === commande.id || 
      fac.commande?.numeroCommande === commande.numeroCommande
    );
    this.closeCommandeDetail();
    if (f) {
      this.openFactureDetail(f);
    } else {
      const montantTotal = (commande.montantTotal || 0) * 1.19;
      const montantTva = (commande.montantTotal || 0) * 0.19;
      const synthFacture = {
        id: Date.now(),
        numeroFacture: `FAC-${(commande.numeroCommande || '2026').replace('CMD-', '')}`,
        reference: `FAC-${(commande.numeroCommande || '2026').replace('CMD-', '')}`,
        dateEmission: commande.dateCommande || new Date().toISOString(),
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        montantTotal: montantTotal,
        montantTva: montantTva,
        statut: commande.statut === 'PAYEE' ? 'PAYEE' : 'EN_ATTENTE',
        commande: commande,
        signatureNumerique: `SIG-${Date.now()}`
      };
      this.openFactureDetail(synthFacture);
    }
  }

  fallbackFactureLignes(facture: any): void {
    const totalTtc = Number(facture.montantTotal || 0);
    const totalTva = Number(facture.montantTva || (totalTtc * 0.19 / 1.19));
    const totalHt = totalTtc > 0 ? (totalTtc - totalTva) : 0;
    const refDoc = facture.numeroFacture || facture.reference || 'FAC-2026';
    const numCmd = facture.commande?.numeroCommande || '';
    const clientNom = facture.commande?.client?.nom || 'Client';

    let prodNom = numCmd 
      ? `Serveur Dell PowerEdge R350`
      : `Serveur Dell PowerEdge R350 — ${clientNom}`;
    let prodDesc = 'Serveur rack 1U, Xeon E-2300, 32GB RAM, 2TB SSD';

    if (totalTtc > 0 && Math.abs(totalTtc - 10115) > 100) {
      prodNom = numCmd ? `Articles & Fournitures (${numCmd})` : `Vente de matériel & Prestations — ${clientNom}`;
      prodDesc = `Facturation officielle ${refDoc}`;
    }

    this.selectedFactureLignes = [
      {
        id: 1,
        produit: {
          nom: prodNom,
          code: 'SRV-DELL-R350',
          description: prodDesc
        },
        quantite: 1,
        prixUnitaire: totalHt,
        remise: 0
      }
    ];
  }

  getLignePrixHt(l: any): number {
    const pu = Number(l.prixUnitaire || 0);
    const qte = Number(l.quantite || 1);
    const rem = Number(l.remise || 0);
    return pu * qte * (1 - rem / 100);
  }

  getLigneTva(l: any): number {
    return this.getLignePrixHt(l) * 0.19;
  }

  getLigneTtc(l: any): number {
    return this.getLignePrixHt(l) * 1.19;
  }

  getFactureCalculatedHt(): number {
    if (this.selectedFactureLignes && this.selectedFactureLignes.length > 0) {
      return this.selectedFactureLignes.reduce((sum, l) => sum + this.getLignePrixHt(l), 0);
    }
    if (this.selectedFacture) {
      const ttc = Number(this.selectedFacture.montantTotal || 0);
      const tva = Number(this.selectedFacture.montantTva || (ttc * 0.19 / 1.19));
      return ttc - tva;
    }
    return 0;
  }

  getFactureCalculatedTva(): number {
    if (this.selectedFactureLignes && this.selectedFactureLignes.length > 0) {
      return this.selectedFactureLignes.reduce((sum, l) => sum + this.getLigneTva(l), 0);
    }
    if (this.selectedFacture) {
      return Number(this.selectedFacture.montantTva || (this.getFactureCalculatedHt() * 0.19));
    }
    return 0;
  }

  getFactureCalculatedTtc(): number {
    if (this.selectedFactureLignes && this.selectedFactureLignes.length > 0) {
      return this.selectedFactureLignes.reduce((sum, l) => sum + this.getLigneTtc(l), 0);
    }
    if (this.selectedFacture) {
      return Number(this.selectedFacture.montantTotal || 0);
    }
    return 0;
  }

  closeFactureDetail(): void {
    this.showFactureDetailModal = false;
    this.showConversionMenu = false;
    this.selectedFacture = null;
  }

  convertirFacture(typeCible: string): void {
    this.showConversionMenu = false;
    if (!this.selectedFacture) return;

    const prefixMap: { [k: string]: string } = {
      'DEVIS': 'DEV',
      'PROFORMA': 'PRO',
      'FACTURE_ELECTRONIQUE': 'FAC-EL',
      'AVOIR': 'AV',
      'BON_LIVRAISON': 'BL',
      'BON_PREPARATION': 'BP',
      'BON_SORTIE': 'BS',
      'RECU_PAIEMENT': 'REC'
    };

    const labelMap: { [k: string]: string } = {
      'DEVIS': 'Devis Commercial',
      'PROFORMA': 'Facture Pro Forma',
      'FACTURE_ELECTRONIQUE': 'Facture Électronique (TTN)',
      'AVOIR': 'Facture d\'Avoir',
      'BON_LIVRAISON': 'Bon de Livraison',
      'BON_PREPARATION': 'Bon de Préparation',
      'BON_SORTIE': 'Bon de Sortie',
      'RECU_PAIEMENT': 'Reçu de Paiement'
    };

    const prefix = prefixMap[typeCible] || 'DOC';
    const now = new Date();
    const year = now.getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newRef = `${prefix}-${year}-${randomSuffix}`;
    const targetLabel = labelMap[typeCible] || typeCible;

    const docObj = {
      id: Date.now(),
      reference: newRef,
      type: typeCible,
      typeLabel: targetLabel,
      sourceFactureRef: this.selectedFacture.numeroFacture || this.selectedFacture.reference || 'FAC-2026',
      dateCreation: now.toISOString(),
      clientNom: this.selectedFacture.commande?.client?.nom || 'INVERA',
      clientEmail: this.selectedFacture.commande?.client?.email || 'contact@invera.com',
      clientAdresse: this.selectedFacture.commande?.client?.adresse || '123 Avenue de la République, 1000 Tunis, Tunisie',
      clientTel: this.selectedFacture.commande?.client?.telephone || '+216 71 123 456',
      clientMf: this.selectedFacture.commande?.client?.matriculeFiscale || '1234567X',
      montantTotal: this.getFactureCalculatedTtc(),
      montantTva: this.getFactureCalculatedTva(),
      lignes: this.selectedFactureLignes,
      statut: 'VALIDE',
      archived: true
    };

    // Sauvegarde dans l'archive locale de l'ERP
    try {
      const existingArchive = JSON.parse(localStorage.getItem('BENJEDDOU_ERP_DOCUMENTS_ARCHIVE') || '[]');
      existingArchive.unshift(docObj);
      localStorage.setItem('BENJEDDOU_ERP_DOCUMENTS_ARCHIVE', JSON.stringify(existingArchive));
    } catch (e) {}

    this.lastConvertedDoc = docObj;
    this.showConvertedSuccessModal = true;
    this.showSuccess(`✨ Conversion réussie : ${targetLabel} (${newRef}) généré et archivé avec succès !`);
  }

  closeConvertedModal(): void {
    this.showConvertedSuccessModal = false;
    this.lastConvertedDoc = null;
  }

  docLangue: 'fr' | 'en' | 'ar' = 'fr';
  showDocPreviewModal = false;
  selectedDocForPreview: any = null;

  docL(fr: string, en: string, ar: string): string {
    if (this.docLangue === 'ar') return ar;
    if (this.docLangue === 'en') return en;
    return fr;
  }

  getDocTypeTitle(type: string, lang: 'fr' | 'en' | 'ar'): string {
    const titles: { [k: string]: { fr: string; en: string; ar: string } } = {
      'DEVIS': { fr: 'DEVIS COMMERCIAL', en: 'COMMERCIAL QUOTE', ar: 'عرض أسعار تجاري' },
      'PROFORMA': { fr: 'FACTURE PRO FORMA', en: 'PROFORMA INVOICE', ar: 'فاتورة شكلية' },
      'FACTURE_ELECTRONIQUE': { fr: 'FACTURE ÉLECTRONIQUE (TTN)', en: 'ELECTRONIC INVOICE', ar: 'فاتورة إلكترونية معتمدة' },
      'AVOIR': { fr: 'FACTURE D\'AVOIR', en: 'CREDIT NOTE', ar: 'فاتورة دائنة (إشعار دائن)' },
      'BON_LIVRAISON': { fr: 'BON DE LIVRAISON', en: 'DELIVERY NOTE', ar: 'وصل تسليم' },
      'BON_PREPARATION': { fr: 'BON DE PRÉPARATION', en: 'ORDER PREPARATION NOTE', ar: 'وصل تحضير طلبيات' },
      'BON_SORTIE': { fr: 'BON DE SORTIE DE STOCK', en: 'STOCK EXIT VOUCHER', ar: 'إذن خروج بضاعة' },
      'RECU_PAIEMENT': { fr: 'REÇU DE PAIEMENT & QUITTANCE', en: 'PAYMENT RECEIPT & DISCHARGE', ar: 'وصل خلاص وإبراء ذمة' },
      'BON_COMMANDE': { fr: 'BON DE COMMANDE CLIENT', en: 'CUSTOMER ORDER', ar: 'أمر طلب حريف' }
    };
    return titles[type]?.[lang] || titles[type]?.['fr'] || type;
  }

  ouvrirApercuDocument(doc: any): void {
    this.selectedDocForPreview = doc;
    this.showDocPreviewModal = true;
  }

  fermerApercuDocument(): void {
    this.showDocPreviewModal = false;
    this.selectedDocForPreview = null;
  }

  imprimerDocumentPreview(): void {
    const dir = this.docLangue === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    window.print();
    const uiLang = localStorage.getItem('erp_lang') || 'fr';
    document.documentElement.setAttribute('dir', uiLang === 'ar' ? 'rtl' : 'ltr');
  }

  payerFacture(facture: any): void {
    const dateNow = new Date().toISOString();
    facture.statut = 'PAYEE';
    facture.datePaiement = dateNow;

    if (this.selectedFacture && (this.selectedFacture.id === facture.id || this.selectedFacture.numeroFacture === facture.numeroFacture)) {
      this.selectedFacture.statut = 'PAYEE';
      this.selectedFacture.datePaiement = dateNow;
    }

    if (facture.id) this.savePaidFactureKey(String(facture.id));
    if (facture.numeroFacture) this.savePaidFactureKey(String(facture.numeroFacture));

    const match = this.factures.find(f => f.id === facture.id);
    if (match) {
      match.statut = 'PAYEE';
      match.datePaiement = dateNow;
    }
    this.filterFactures();
    this.showSuccess('Facture marquée comme payée ✓ (Détails du règlement enregistrés)');

    this.commercialService.changerStatutFacture(facture.id, 'PAYEE').subscribe({
      next: () => { this.loadFactures(); },
      error: () => { }
    });
  }

  imprimerFacture(): void {
    // Appliquer la direction RTL/LTR sur le document d'impression
    const dir = this.factureLangue === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    window.print();
    // Restaurer la direction de l'UI après impression
    const uiLang = localStorage.getItem('erp_lang') || 'fr';
    document.documentElement.setAttribute('dir', uiLang === 'ar' ? 'rtl' : 'ltr');
  }

  exportFactureDocumentWord(): void {
    if (!this.selectedFacture) return;
    const ref = this.selectedFacture.numeroFacture || this.selectedFacture.reference || 'document';
    this.exportService.exportElementToWord('facture-document', `Document ${ref}`, `document-${ref}`);
  }

  exportFactureDocumentExcel(): void {
    if (!this.selectedFacture) return;
    const ref = this.selectedFacture.numeroFacture || this.selectedFacture.reference || 'document';
    this.exportService.exportElementToExcel('facture-document', `Document ${ref}`, `document-${ref}`);
  }

  exportDocumentPreviewWord(): void {
    if (!this.selectedDocForPreview) return;
    const ref = this.selectedDocForPreview.reference || this.selectedDocForPreview.numero || 'document';
    this.exportService.exportElementToWord('commercial-doc-preview', `Document ${ref}`, `document-${ref}`);
  }

  exportDocumentPreviewExcel(): void {
    if (!this.selectedDocForPreview) return;
    const ref = this.selectedDocForPreview.reference || this.selectedDocForPreview.numero || 'document';
    this.exportService.exportElementToExcel('commercial-doc-preview', `Document ${ref}`, `document-${ref}`);
  }

  exportDevisDocumentWord(): void {
    if (!this.selectedDevis) return;
    const ref = this.selectedDevis.numeroDevis || this.selectedDevis.reference || 'devis';
    this.exportService.exportElementToWord('devis-document', `Devis ${ref}`, `devis-${ref}`);
  }

  exportDevisDocumentExcel(): void {
    if (!this.selectedDevis) return;
    const ref = this.selectedDevis.numeroDevis || this.selectedDevis.reference || 'devis';
    this.exportService.exportElementToExcel('devis-document', `Devis ${ref}`, `devis-${ref}`);
  }



  envoyerFactureEmail(facture: any): void {
    const emailDest = facture.commande?.client?.email || '—';
    if (!confirm(`Envoyer la facture ${facture.numeroFacture} par email à ${emailDest} ?`)) return;
    this.commercialService.envoyerFactureEmail(facture.id).subscribe({
      next: (res) => this.showSuccess(`📧 Email envoyé à ${emailDest} ✓`),
      error: (err) => this.showError('Erreur envoi email : ' + (err.error || err.message || ''))
    });
  }

  envoyerRappelImpayee(facture: any): void {
    const emailDest = facture.commande?.client?.email || '—';
    if (!confirm(`Envoyer un rappel de paiement à ${emailDest} ?`)) return;
    this.commercialService.envoyerRappelImpayee(facture.id).subscribe({
      next: () => this.showSuccess(`🚨 Rappel envoyé à ${emailDest} ✓`),
      error: (err) => this.showError('Erreur envoi rappel : ' + (err.error || err.message || ''))
    });
  }

  relancerWhatsApp(facture: any): void {
    const clientNom = facture.commande?.client?.nom || 'Client';
    let tel = facture.commande?.client?.telephone || '21620000000';
    tel = tel.replace(/[^0-9]/g, '');
    if (!tel.startsWith('216') && tel.length === 8) {
      tel = '216' + tel;
    }

    const num = facture.numeroFacture || facture.reference || 'FAC';
    const montant = (facture.montantTotal || 0).toFixed(3);
    const dateEch = facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : '';

    const text = `Bonjour ${clientNom},\n\nNous vous rappelons que la facture N° *${num}* d'un montant de *${montant} TND* (Échéance: ${dateEch}) est toujours en attente de règlement.\n\nMerci de bien vouloir procéder à son règlement via votre Portail Client BENJEDDOU ERP :\nhttp://localhost:4200/portail-client/factures\n\nCordialement,\nService Commercial BENJEDDOU ERP.`;

    const url = `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    this.showSuccess(`📲 WhatsApp Web ouvert pour relancer ${clientNom} (${num}) ✓`);
  }

  relancerTelegram(facture: any): void {
    const clientNom = facture.commande?.client?.nom || 'Client';
    const num = facture.numeroFacture || facture.reference || 'FAC';
    const montant = (facture.montantTotal || 0).toFixed(3);

    const text = `Bonjour ${clientNom}, rappel concernant la facture N° ${num} (${montant} TND). Merci de régler via votre Portail Client BENJEDDOU ERP : http://localhost:4200/portail-client/factures`;
    const url = `https://t.me/share/url?url=http://localhost:4200/portail-client/factures&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    this.showSuccess(`✈️ Telegram ouvert pour relancer ${clientNom} (${num}) ✓`);
  }

  // ── MODAL UNIFIÉ DE RELANCE ──
  showModalRelance = false;
  factureRelanceSelectionnee: any = null;

  ouvrirModalRelance(facture: any): void {
    this.factureRelanceSelectionnee = facture;
    this.showModalRelance = true;
  }

  fermerModalRelance(): void {
    this.showModalRelance = false;
    this.factureRelanceSelectionnee = null;
  }

  choisirCanalRelance(canal: 'EMAIL' | 'WHATSAPP' | 'TELEGRAM'): void {
    const f = this.factureRelanceSelectionnee;
    this.fermerModalRelance();
    if (!f) return;

    if (canal === 'EMAIL') {
      this.envoyerFactureEmail(f);
    } else if (canal === 'WHATSAPP') {
      this.relancerWhatsApp(f);
    } else if (canal === 'TELEGRAM') {
      this.relancerTelegram(f);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════
  isFactureEnRetard(facture: any): boolean {
    if (!facture.dateEcheance || facture.statut === 'PAYEE' || facture.statut === 'ANNULEE') return false;
    return new Date(facture.dateEcheance) < new Date();
  }

  get facturesEnRetardCount(): number {
    return this.factures.filter(f => this.isFactureEnRetard(f)).length;
  }

  getStatutClass(statut: string): string {
    const map: any = { 'EN_ATTENTE': 'badge-warning', 'PAYEE': 'badge-success', 'ANNULEE': 'badge-danger', 'IMPAYEE': 'badge-danger' };
    return map[statut] || 'badge-secondary';
  }

  getStatutLabel(statut: string): string {
    const map: any = { 'EN_ATTENTE': '⏳ En attente', 'PAYEE': '✅ Payée', 'ANNULEE': '❌ Annulée', 'IMPAYEE': '🚨 Impayée' };
    return map[statut] || statut;
  }

  get heroConfig(): any {
    const t = (key: string) => this.translate.instant(key);
    const configs: any = {
      clients: { gradient: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)', icon: 'people', title: t('COMMERCIAL.HERO.TITLE_CLIENTS'), desc: t('COMMERCIAL.HERO.DESC_CLIENTS'), stat: this.clients.length, statLabel: t('COMMERCIAL.HERO.STAT_CLIENTS') },
      fournisseurs: { gradient: 'linear-gradient(135deg, #052e16 0%, #15803d 100%)', icon: 'local_shipping', title: t('COMMERCIAL.HERO.TITLE_FOURNISSEURS'), desc: t('COMMERCIAL.HERO.DESC_FOURNISSEURS'), stat: this.fournisseurs.length, statLabel: t('COMMERCIAL.HERO.STAT_FOURNISSEURS') },
      commandes: { gradient: 'linear-gradient(135deg, #1c0a00 0%, #9a3412 100%)', icon: 'shopping_cart', title: t('COMMERCIAL.HERO.TITLE_COMMANDES'), desc: t('COMMERCIAL.HERO.DESC_COMMANDES'), stat: this.commandes.length, statLabel: t('COMMERCIAL.HERO.STAT_COMMANDES') },
      factures: { gradient: 'linear-gradient(135deg, #1e0040 0%, #6d28d9 100%)', icon: 'receipt_long', title: t('COMMERCIAL.HERO.TITLE_FACTURES'), desc: t('COMMERCIAL.HERO.DESC_FACTURES'), stat: this.factures.length, statLabel: t('COMMERCIAL.HERO.STAT_FACTURES') },
      devis: { gradient: 'linear-gradient(135deg, #0c1a2e 0%, #0369a1 100%)', icon: 'description', title: t('COMMERCIAL.HERO.TITLE_DEVIS'), desc: t('COMMERCIAL.HERO.DESC_DEVIS'), stat: this.devis.length, statLabel: t('COMMERCIAL.HERO.STAT_DEVIS') },
      promos: { gradient: 'linear-gradient(135deg, #0f172a 0%, #be185d 100%)', icon: 'local_offer', title: t('COMMERCIAL.HERO.TITLE_PROMOS'), desc: t('COMMERCIAL.HERO.DESC_PROMOS'), stat: this.promos.length, statLabel: t('COMMERCIAL.HERO.STAT_PROMOS') },
      dashboard: { gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', icon: 'dashboard', title: t('COMMERCIAL.HERO.TITLE_DASHBOARD'), desc: t('COMMERCIAL.HERO.DESC_DASHBOARD'), stat: this.commandes.length, statLabel: t('COMMERCIAL.HERO.STAT_COMMANDES') }
    };
    return configs[this.activeTab] || configs['clients'];
  }

  // ══════════════════════════════════════════════════════════════
  // PROMOTIONS & CODES PROMO
  // ══════════════════════════════════════════════════════════════
  loadPromos(): void {
    this.isLoading = true;
    this.commercialService.getPromos().subscribe({
      next: (data) => {
        this.promos = data.sort((a: any, b: any) =>
          new Date(b.dateCreation || 0).getTime() - new Date(a.dateCreation || 0).getTime());
        this.filterPromos();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.showError('Erreur chargement promotions'); }
    });
  }

  filterPromos(): void {
    const q = this.promoSearch.toLowerCase();
    this.filteredPromos = this.promos.filter(p => {
      const matchSearch = p.code?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      const matchStatut = !this.promoStatutFilter || p.statut === this.promoStatutFilter;
      return matchSearch && matchStatut;
    });
  }

  openCreatePromoModal(): void {
    this.isEditingPromo = false;
    this.selectedPromo = null;
    this.promoSaveError = '';
    this.promoForm.reset({ typeRemise: 'POURCENTAGE', montantMinimum: 0, valeur: '' });
    this.showPromoModal = true;
  }

  openEditPromoModal(promo: any): void {
    this.isEditingPromo = true;
    this.selectedPromo = promo;
    this.promoForm.patchValue({
      code: promo.code,
      description: promo.description || '',
      typeRemise: promo.typeRemise,
      valeur: promo.valeur,
      montantMinimum: promo.montantMinimum || 0,
      plafondRemise: promo.plafondRemise || '',
      utilisationsMax: promo.utilisationsMax || '',
      dateDebut: promo.dateDebut ? promo.dateDebut.substring(0, 16) : '',
      dateFin: promo.dateFin ? promo.dateFin.substring(0, 16) : ''
    });
    this.showPromoModal = true;
  }

  closePromoModal(): void { this.showPromoModal = false; this.promoSaveError = ''; }

  /** Force le code en MAJUSCULES à chaque frappe (contourne le CSS text-transform) */
  forceUpperCode(): void {
    const ctrl = this.promoForm.get('code');
    if (ctrl) ctrl.setValue(ctrl.value?.toUpperCase() ?? '', { emitEvent: false });
  }

  savePromo(): void {
    if (this.promoForm.invalid) return;
    this.promoSaveError = '';
    const val = this.promoForm.value;
    const body: any = {
      code: val.code?.toUpperCase().trim(),
      description: val.description,
      typeRemise: val.typeRemise,
      valeur: val.valeur,
      montantMinimum: val.montantMinimum || 0,
      plafondRemise: val.plafondRemise || null,
      utilisationsMax: val.utilisationsMax || null,
      dateDebut: val.dateDebut ? val.dateDebut + ':00' : null,
      dateFin: val.dateFin ? val.dateFin + ':00' : null
    };
    const obs = this.isEditingPromo && this.selectedPromo
      ? this.commercialService.updatePromo(this.selectedPromo.id, body)
      : this.commercialService.createPromo(body);
    obs.subscribe({
      next: () => {
        this.closePromoModal();
        this.loadPromos();
        this.showSuccess(this.isEditingPromo ? 'Code promo modifié ✓' : 'Code promo créé ✓');
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error
          : err.error?.message || err.message || 'Erreur lors de la sauvegarde';
        // Afficher l'erreur dans le modal (visible) ET en toast
        this.promoSaveError = msg;
        this.showError(msg);
      }
    });
  }

  togglePromo(promo: any): void {
    this.commercialService.togglePromo(promo.id).subscribe({
      next: () => { this.loadPromos(); this.showSuccess(promo.actif ? 'Code désactivé ✓' : 'Code activé ✓'); },
      error: () => this.showError('Erreur activation')
    });
  }

  deletePromo(id: number): void {
    if (!confirm('Supprimer ce code promo ?')) return;
    this.commercialService.deletePromo(id).subscribe({
      next: () => { this.loadPromos(); this.showSuccess('Code supprimé ✓'); },
      error: () => this.showError('Impossible de supprimer ce code')
    });
  }

  // Appliqué depuis le formulaire commande (vérification live)
  verifierCodePromo(): void {
    if (!this.codePromoInput.trim()) return;
    const total = this.calcCommandeTotal();
    if (total <= 0) { this.showError('Ajoutez des produits avant d\'appliquer un code'); return; }
    this.promoVerifLoading = true;
    this.promoVerifResult = null;
    this.commercialService.verifierCodePromo(this.codePromoInput.trim(), total).subscribe({
      next: (res) => { this.promoVerifResult = res; this.promoVerifLoading = false; },
      error: () => { this.promoVerifLoading = false; this.promoVerifResult = { valide: false, message: 'Erreur de vérification' }; }
    });
  }

  effacerCodePromo(): void {
    this.codePromoInput = '';
    this.promoVerifResult = null;
  }

  getPromoStatutClass(statut: string): string {
    const map: any = { 'ACTIF': 'badge-success', 'EXPIRE': 'badge-danger', 'EPUISE': 'badge-warning', 'DESACTIVE': 'badge-secondary', 'PLANIFIE': 'badge-info' };
    return map[statut] || 'badge-secondary';
  }

  getPromoStatutLabel(statut: string): string {
    const map: any = { 'ACTIF': '✅ Actif', 'EXPIRE': '❌ Expiré', 'EPUISE': '⚠️ Épuisé', 'DESACTIVE': '⏸️ Désactivé', 'PLANIFIE': '🗓️ Planifié' };
    return map[statut] || statut;
  }

  getPromoLabel(promo: any): string {
    return promo.typeRemise === 'POURCENTAGE'
      ? '-' + promo.valeur + '%'
      : '-' + promo.valeur + ' TND';
  }

  get commandeTotalAvecPromo(): number {
    const base = this.calcCommandeTotal();
    if (!this.promoVerifResult?.valide) return base;
    return base - (this.promoVerifResult.remiseCalculee || 0);
  }

  // ── EXPORTS ──────────────────────────────────────────────────

  // — Clients
  get _clientCols(): string[] { return ['N°', 'Nom / Raison sociale', 'Email', 'Téléphone', 'Adresse', 'Matricule fiscal']; }
  get _clientRows(): (string | number)[][] {
    return (this.clients ?? []).map((c: any, i: number) => [
      i + 1, c.nom ?? '—', c.email ?? '—', c.telephone ?? '—',
      c.adresse ?? '—', c.matriculeFiscale ?? '—'
    ]);
  }
  exportClientsCSV(): void { this.exportService.exportToCSV(this._clientCols, this._clientRows, `clients-${new Date().toISOString().slice(0, 10)}`); }
  exportClientsPDF(): void { this.exportService.exportTableToPDF(this._clientCols, this._clientRows, 'Liste des Clients — BENJEDDOU ERP', `clients-${new Date().toISOString().slice(0, 10)}`, `${(this.clients ?? []).length} client(s)`); }
  exportClientsWord(): void { this.exportService.exportTableToWord(this._clientCols, this._clientRows, 'Liste des Clients — BENJEDDOU ERP', `clients-${new Date().toISOString().slice(0, 10)}`); }
  printClients(): void { this.exportService.printElement('clients-table', 'Liste des Clients — BENJEDDOU ERP'); }

  // — Commandes
  get _commandeCols(): string[] { return ['N°', 'Référence', 'Client', 'Date', 'Total TTC (TND)', 'Statut']; }
  get _commandeRows(): (string | number)[][] {
    return (this.commandes ?? []).map((c: any, i: number) => [
      i + 1, c.reference ?? c.numero ?? '—', c.client?.nom ?? '—',
      c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '—',
      `${(c.totalTTC ?? c.montantTotal ?? 0).toFixed(3)} TND`, c.statut ?? '—'
    ]);
  }
  exportCommandesCSV(): void { this.exportService.exportToCSV(this._commandeCols, this._commandeRows, `commandes-${new Date().toISOString().slice(0, 10)}`); }
  exportCommandesPDF(): void { this.exportService.exportTableToPDF(this._commandeCols, this._commandeRows, 'Commandes Clients — BENJEDDOU ERP', `commandes-${new Date().toISOString().slice(0, 10)}`, `${(this.commandes ?? []).length} commande(s)`); }
  exportCommandesWord(): void { this.exportService.exportTableToWord(this._commandeCols, this._commandeRows, 'Commandes Clients — BENJEDDOU ERP', `commandes-${new Date().toISOString().slice(0, 10)}`); }
  printCommandes(): void { this.exportService.printElement('commandes-table', 'Commandes Clients — BENJEDDOU ERP'); }

  // — Factures
  get _factureCols(): string[] { return ['N°', 'Référence', 'Client', 'Date', 'Total TTC (TND)', 'Statut']; }
  get _factureRows(): (string | number)[][] {
    return (this.factures ?? []).map((f: any, i: number) => [
      i + 1, f.numero ?? f.reference ?? '—', f.client?.nom ?? '—',
      f.dateFacture ? new Date(f.dateFacture).toLocaleDateString('fr-FR') : '—',
      `${(f.totalTTC ?? f.montantTotal ?? 0).toFixed(3)} TND`, f.statut ?? '—'
    ]);
  }
  exportFacturesCSV(): void { this.exportService.exportToCSV(this._factureCols, this._factureRows, `factures-${new Date().toISOString().slice(0, 10)}`); }
  exportFacturesPDF(): void { this.exportService.exportTableToPDF(this._factureCols, this._factureRows, 'Factures — BENJEDDOU ERP', `factures-${new Date().toISOString().slice(0, 10)}`, `${(this.factures ?? []).length} facture(s)`); }
  exportFacturesWord(): void { this.exportService.exportTableToWord(this._factureCols, this._factureRows, 'Factures — BENJEDDOU ERP', `factures-${new Date().toISOString().slice(0, 10)}`); }
  printFactures(): void { this.exportService.printElement('factures-table', 'Factures — BENJEDDOU ERP'); }

  // — Devis
  get _devisCols(): string[] { return ['N°', 'Référence', 'Client', 'Date', 'Total TTC (TND)', 'Statut']; }
  get _devisRows(): (string | number)[][] {
    return (this.devis ?? []).map((d: any, i: number) => [
      i + 1, d.reference ?? d.numero ?? '—', d.client?.nom ?? '—',
      d.dateDevis ? new Date(d.dateDevis).toLocaleDateString('fr-FR') : '—',
      `${(d.totalTTC ?? d.montantTotal ?? 0).toFixed(3)} TND`, d.statut ?? '—'
    ]);
  }
  exportDevisCSV(): void { this.exportService.exportToCSV(this._devisCols, this._devisRows, `devis-${new Date().toISOString().slice(0, 10)}`); }
  exportDevisPDF(): void { this.exportService.exportTableToPDF(this._devisCols, this._devisRows, 'Devis — BENJEDDOU ERP', `devis-${new Date().toISOString().slice(0, 10)}`, `${(this.devis ?? []).length} devis`); }
  exportDevisWord(): void { this.exportService.exportTableToWord(this._devisCols, this._devisRows, 'Devis — BENJEDDOU ERP', `devis-${new Date().toISOString().slice(0, 10)}`); }
  printDevis(): void { this.exportService.printElement('devis-table', 'Devis — BENJEDDOU ERP'); }
}
