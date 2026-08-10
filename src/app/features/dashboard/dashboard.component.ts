import { Component, AfterViewInit, ElementRef, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { StockService } from '../../core/services/stock.service';
import { CommercialService } from '../../core/services/commercial.service';
import { AdminService } from '../../core/services/admin.service';
import { TrialBannerComponent } from '../../shared/trial-banner/trial-banner.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink, TrialBannerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // Views child for Admin
  @ViewChild('adminRevenueChart') adminRevenueChartRef!: ElementRef;
  @ViewChild('adminRoleChart') adminRoleChartRef!: ElementRef;

  // Views child for Commercial
  @ViewChild('commercialSalesChart') commercialSalesChartRef!: ElementRef;
  @ViewChild('commercialProductChart') commercialProductChartRef!: ElementRef;

  // Views child for Comptable
  @ViewChild('comptableFlowChart') comptableFlowChartRef!: ElementRef;
  @ViewChild('comptableMethodChart') comptableMethodChartRef!: ElementRef;

  // Views child for Stock
  @ViewChild('stockCategoryChart') stockCategoryChartRef!: ElementRef;
  @ViewChild('stockFlowChart') stockFlowChartRef!: ElementRef;

  user: any = null;
  userRole: string = 'USER';
  today = new Date();

  // Bannière Mode Trial
  trialMessage: string = localStorage.getItem('trialMessage') || '';
  trialCritique: boolean = localStorage.getItem('trialCritique') === 'true';
  showTrialBanner: boolean = !!localStorage.getItem('trialMessage');

  // Common and Role-Specific Data Lists
  recentSales: any[] = [];
  stockAlerts: any[] = [];
  systemLogs: any[] = [];
  quickActions: any[] = [];
  newClients: any[] = [];
  pendingInvoices: any[] = [];
  recentPayments: any[] = [];
  stockMovements: any[] = [];

  // Real stock data
  realProducts: any[] = [];
  realWarehouses: any[] = [];
  realMovements: any[] = [];
  realAlertProducts: any[] = [];
  stockLoading = true;

  // ── KPIs calculés une seule fois (plus de getter = plus de gel) ──
  realTotalStockValue  = 0;
  realActiveProducts   = 0;
  realAlertCount       = 0;
  realMonthMovementsValue = 0;
  recentRealMovements: any[] = [];

  /** Recalcule toutes les métriques stock après chaque chargement */
  private computeStockKpis(): void {
    this.realTotalStockValue     = this.realProducts.reduce((s, p) => s + (p.quantiteStock * p.prixAchat), 0);
    this.realActiveProducts      = this.realProducts.filter(p => p.quantiteStock > 0).length;
    this.realAlertCount          = this.realAlertProducts.length;
    const now = new Date();
    this.realMonthMovementsValue = this.realMovements
      .filter(m => {
        const d = new Date(m.dateMouvement);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && m.typeMouvement === 'ENTREE';
      })
      .reduce((s, m) => {
        const p = this.realProducts.find(pr => pr.id === m.produit?.id);
        return s + (m.quantite * (p?.prixAchat ?? 0));
      }, 0);
    this.recentRealMovements = [...this.realMovements]
      .sort((a, b) => new Date(b.dateMouvement).getTime() - new Date(a.dateMouvement).getTime())
      .slice(0, 6);
  }

  // Chart instances for proper cleanup
  charts: any[] = [];
  private dashCaChart: Chart | null = null;
  private dashCmdChart: Chart | null = null;

  // Commercial KPIs (real data)
  commercialKpis = {
    totalCA: 0,
    commandesMois: 0,
    facturesEnAttente: 0,
    totalFactures: 0,
    totalClients: 0,
    totalCommandes: 0,
    tauxFacturation: 0
  };
  private commercialCommandes: any[] = [];
  adminStats: any = null;

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private stockService: StockService,
    private commercialService: CommercialService,
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.determineUserRole();

    // Ne pas charger les données staff pour les clients
    const roles = this.authService.getUserRoles();
    if (roles.includes('CLIENT') || roles.includes('ROLE_CLIENT')) {
      return; // Le dashboard client est affiché via *ngIf="userRole === 'CLIENT'" dans le HTML
    }

    this.loadMockData();
    if (this.userRole === 'STOCK') {
      this.loadRealStockData();
    }
    if (this.userRole === 'COMMERCIAL' || this.userRole === 'ADMIN') {
      this.loadCommercialData();
    }
    if (this.userRole === 'ADMIN') {
      // Pre-fill with mock data so charts always render on AfterViewInit
      this.adminStats = this.getMockAdminStats();
      this.loadAdminData();
    }
  }

  loadAdminData(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        // Only update if real API data has the expected structure
        if (data && data.revenueChart && data.rolesChart) {
          this.adminStats = data;
        } else {
          // Merge real counts into mock structure
          const mock = this.getMockAdminStats();
          this.adminStats = { ...mock, ...data, revenueChart: mock.revenueChart, rolesChart: mock.rolesChart };
        }
        this.cdr.detectChanges();
        // Redraw charts with real data
        setTimeout(() => this.initAdminChartsById(), 150);
      },
      error: () => {
        // Mock data was already set in ngOnInit – charts are already drawn
      }
    });
  }

  private getMockAdminStats(): any {
    return {
      totalUsers: this.commercialKpis.totalClients || 8,
      activeUsers: 6,
      pendingKyc: 2,
      totalTransactions: 124,
      totalRevenue: this.commercialKpis.totalCA || 48750,
      revenueChart: {
        labels: ['Mar 25','Avr 25','Mai 25','Jun 25','Jul 25','Aoû 25'],
        data: [8200, 11500, 9800, 14200, 12600, 16800]
      },
      rolesChart: {
        labels: ['Administrateurs','Commerciaux','Comptables','Stock'],
        data: [2, 3, 1, 2]
      }
    };
  }

  private initAdminChartsById(): void {
    const revenueCanvas = document.getElementById('adminRevenueChart') as HTMLCanvasElement;
    const roleCanvas    = document.getElementById('adminRoleChart')    as HTMLCanvasElement;
    if (!revenueCanvas || !roleCanvas || !this.adminStats) return;

    // Destroy existing charts if any
    const existingRevenue = Chart.getChart(revenueCanvas);
    if (existingRevenue) existingRevenue.destroy();
    const existingRole = Chart.getChart(roleCanvas);
    if (existingRole) existingRole.destroy();

    const chartRevenue = new Chart(revenueCanvas, {
      type: 'line',
      data: {
        labels: this.adminStats.revenueChart.labels,
        datasets: [{
          label: 'CA Global (TND)',
          data: this.adminStats.revenueChart.data,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#7c3aed',
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y as number).toLocaleString('fr-TN')} TND`
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(124,58,237,0.06)' },
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, callback: (v: any) => v >= 1000 ? (v/1000).toFixed(1)+'k' : v }
          },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
        }
      }
    });
    this.charts.push(chartRevenue);

    const chartRoles = new Chart(roleCanvas, {
      type: 'doughnut',
      data: {
        labels: this.adminStats.rolesChart.labels,
        datasets: [{
          data: this.adminStats.rolesChart.data,
          backgroundColor: ['#7c3aed', '#3b82f6', '#f59e0b', '#10b981'],
          borderWidth: 3,
          borderColor: 'var(--bg-card, #1e293b)',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 16 }
          }
        },
        cutout: '62%'
      }
    });
    this.charts.push(chartRoles);
  }

  loadRealStockData(): void {
    this.stockLoading = true;
    this.stockService.getProducts().subscribe({ next: d => { this.realProducts = d; this.checkStockLoaded(); }, error: () => this.checkStockLoaded() });
    this.stockService.getWarehouses().subscribe({ next: d => { this.realWarehouses = d; }, error: () => {} });
    this.stockService.getMovements().subscribe({ next: d => { this.realMovements = d; this.checkStockLoaded(); }, error: () => this.checkStockLoaded() });
    this.stockService.getProductAlerts().subscribe({ next: d => { this.realAlertProducts = d; this.checkStockLoaded(); }, error: () => this.checkStockLoaded() });
  }

  private _loadedCount = 0;
  private checkStockLoaded(): void {
    this._loadedCount++;
    if (this._loadedCount >= 3) {
      this.stockLoading = false;
      this.computeStockKpis();   // ← calcul unique des KPIs
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.userRole === 'ADMIN') {
        // adminStats was pre-filled with mock data in ngOnInit, draw charts now
        this.initAdminChartsById();
      } else {
        this.initChartsForRole();
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    if (this.dashCaChart) { this.dashCaChart.destroy(); }
    if (this.dashCmdChart) { this.dashCmdChart.destroy(); }
  }

  loadCommercialData(): void {
    this.commercialService.getCommandes().subscribe({
      next: (data) => {
        this.commercialCommandes = data;
        this.computeCommercialKpis();
        setTimeout(() => this.buildCommercialCharts(), 300);
      }
    });
    this.commercialService.getFactures().subscribe({
      next: (data) => {
        this.commercialKpis.totalFactures = data.length;
        this.commercialKpis.facturesEnAttente = data.filter((f: any) => f.statut === 'EN_ATTENTE').length;
      }
    });
    this.commercialService.getClients().subscribe({
      next: (data) => { this.commercialKpis.totalClients = data.length; }
    });
  }

  computeCommercialKpis(): void {
    const now = new Date();
    this.commercialKpis.totalCommandes = this.commercialCommandes.length;
    this.commercialKpis.totalCA = this.commercialCommandes
      .filter((c: any) => c.statut === 'PAYEE')
      .reduce((s: number, c: any) => s + (c.montantTotal || 0), 0);
    this.commercialKpis.commandesMois = this.commercialCommandes.filter((c: any) => {
      const d = new Date(c.dateCommande);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const payees = this.commercialCommandes.filter((c: any) => c.statut === 'PAYEE').length;
    this.commercialKpis.tauxFacturation = this.commercialCommandes.length > 0
      ? Math.round((payees / this.commercialCommandes.length) * 100) : 0;
  }

  buildCommercialCharts(): void {
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const now = new Date();
    const labels: string[] = [];
    const caData: number[] = [];
    const cmdData: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2));
      const m = this.commercialCommandes.filter((c: any) => {
        const cd = new Date(c.dateCommande);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      });
      caData.push(m.filter((c: any) => c.statut === 'PAYEE').reduce((s: number, c: any) => s + (c.montantTotal || 0), 0));
      cmdData.push(m.length);
    }
    const caCanvas = document.getElementById('dashCaChart') as HTMLCanvasElement;
    if (caCanvas) {
      if (this.dashCaChart) this.dashCaChart.destroy();
      this.dashCaChart = new Chart(caCanvas, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'CA (TND)', data: caData, backgroundColor: 'rgba(249,115,22,0.75)', borderColor: '#f97316', borderWidth: 2, borderRadius: 8, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }, y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v: any) => v >= 1000 ? (v/1000).toFixed(1)+'k' : v } } } }
      });
    }
    const cmdCanvas = document.getElementById('dashCmdChart') as HTMLCanvasElement;
    if (cmdCanvas) {
      if (this.dashCmdChart) this.dashCmdChart.destroy();
      this.dashCmdChart = new Chart(cmdCanvas, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Commandes', data: cmdData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 2.5, pointBackgroundColor: '#3b82f6', pointRadius: 5, fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }, y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 }, beginAtZero: true } } }
      });
    }

    // Build advanced charts
    this.buildRepartitionChart();
    this.buildTopClientsChart();
    this.buildStockFlowChart();
    this.buildTresorerieChart();
  }

  private buildRepartitionChart(): void {
    const canvas = document.getElementById('dashRepartitionChart') as HTMLCanvasElement;
    if (!canvas) return;
    // Build product repartition from real commandes data
    const productMap: {[key: string]: number} = {};
    this.commercialCommandes.forEach((c: any) => {
      const nom = c.client?.nom || 'Autre';
      productMap[nom] = (productMap[nom] || 0) + (c.montantTotal || 0);
    });
    const sortedEntries = Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const labels = sortedEntries.length > 0 ? sortedEntries.map(e => e[0]) : ['Câbles', 'Switches', 'Routeurs', 'Caméras', 'Autres'];
    const data   = sortedEntries.length > 0 ? sortedEntries.map(e => e[1]) : [35, 25, 20, 12, 8];
    new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#f97316','#3b82f6','#10b981','#8b5cf6','#f59e0b'],
          borderWidth: 3,
          borderColor: 'var(--surface, #1e293b)',
          hoverOffset: 12
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, padding: 14, font: { size: 11 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${(ctx.parsed as number).toFixed(3)} TND` } }
        },
        cutout: '65%'
      }
    });
  }

  private buildTopClientsChart(): void {
    const canvas = document.getElementById('dashTopClientsChart') as HTMLCanvasElement;
    if (!canvas) return;
    // Aggregate CA by client from commandes
    const clientMap: {[key: string]: number} = {};
    this.commercialCommandes.forEach((c: any) => {
      const nom = c.client?.nom || 'Client inconnu';
      clientMap[nom] = (clientMap[nom] || 0) + (c.statut === 'PAYEE' ? (c.montantTotal || 0) : 0);
    });
    const sorted = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = sorted.length > 0 ? sorted.map(e => e[0]) : ['Sotrapil S.A.','Tunisie Telecom','El-Bouniane','Clinique Pasteur','Dar Deco','STEG','SONEDE','ONAS'];
    const data   = sorted.length > 0 ? sorted.map(e => e[1]) : [12400,4850,3150,2800,2100,1800,1500,1200];
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'CA (TND)',
          data,
          backgroundColor: labels.map((_, i) => `hsla(${220 + i * 25}, 80%, 60%, 0.8)`),
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v: any) => v >= 1000 ? (v/1000).toFixed(1)+'k' : v } },
          y: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 10 } } }
        }
      }
    });
  }

  private buildStockFlowChart(): void {
    const canvas = document.getElementById('dashStockFlowChart') as HTMLCanvasElement;
    if (!canvas) return;
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    // Simulated realistic stock movements data (enriched)
    const entrees = [24, 18, 30, 22, 28, 35, 20, 25, 32, 19, 27, 40];
    const sorties  = [18, 22, 25, 19, 24, 30, 16, 20, 28, 15, 22, 35];
    const now = new Date();
    const moisLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      moisLabels.push(months[d.getMonth()]);
    }
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: moisLabels,
        datasets: [
          { label: 'Entrées', data: entrees.slice(now.getMonth()-5, now.getMonth()+1), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 6 },
          { label: 'Sorties',  data: sorties.slice(now.getMonth()-5, now.getMonth()+1),  backgroundColor: 'rgba(239,68,68,0.75)',   borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }

  private buildTresorerieChart(): void {
    const canvas = document.getElementById('dashTresorerieChart') as HTMLCanvasElement;
    if (!canvas) return;
    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const now = new Date();
    // Build 6 past months from real CA, then forecast 6 ahead
    const pastLabels: string[] = [];
    const pastData: number[] = [];
    const futureLabels: string[] = [];
    const futureData: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      pastLabels.push(months[d.getMonth()]);
      const m = this.commercialCommandes.filter((c: any) => {
        const cd = new Date(c.dateCommande);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      });
      pastData.push(m.filter((c: any) => c.statut === 'PAYEE').reduce((s: number, c: any) => s + (c.montantTotal || 0), 0));
    }
    const avgCA = pastData.reduce((a, b) => a + b, 0) / (pastData.length || 1);
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      futureLabels.push(months[d.getMonth()]);
      futureData.push(Math.round(avgCA * (1 + i * 0.05)));
    }
    const allLabels = [...pastLabels, ...futureLabels];
    const realLine  = [...pastData, ...Array(6).fill(null)];
    const forecastLine = [...Array(6).fill(null), ...futureData];

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Réalisé',
            data: realLine,
            borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
            borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#10b981', fill: true, tension: 0.4, spanGaps: false
          },
          {
            label: 'Prévision',
            data: forecastLine,
            borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.07)',
            borderWidth: 2.5, borderDash: [6, 5], pointRadius: 5, pointBackgroundColor: '#f97316', fill: true, tension: 0.4, spanGaps: false
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
          y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v: any) => v >= 1000 ? (v/1000).toFixed(1)+'k TND' : v + ' TND' }, beginAtZero: true }
        }
      }
    });
  }


  determineUserRole(): void {
    const roles = this.authService.getUserRoles();
    if (roles.includes('ROLE_ADMIN')) {
      this.userRole = 'ADMIN';
    } else if (roles.includes('ROLE_COMMERCIAL')) {
      this.userRole = 'COMMERCIAL';
    } else if (roles.includes('ROLE_COMPTABLE')) {
      this.userRole = 'COMPTABLE';
    } else if (roles.includes('ROLE_STOCK')) {
      this.userRole = 'STOCK';
    } else {
      this.userRole = 'USER';
    }
  }

  loadMockData(): void {
    // Admin specific data
    this.systemLogs = [
      { type: 'info', user: 'comptable', action: 'Validation facture FACT-2026-002', time: 'Il y a 10 min' },
      { type: 'warning', user: 'system', action: 'Seuil critique atteint: Switch Cisco Catalyst 24 Port', time: 'Il y a 32 min' },
      { type: 'info', user: 'commercial', action: 'Nouveau client "Dar Deco" créé', time: 'Il y a 2 heures' },
      { type: 'danger', user: 'system', action: 'Tentative de connexion échouée (IP 197.3.2.14)', time: 'Il y a 4 heures' }
    ];

    this.quickActions = [
      { label: 'Utilisateurs', icon: 'manage_accounts', link: '/users', color: 'purple' },
      { label: 'Paramètres', icon: 'settings', link: '/settings', color: 'blue' },
      { label: 'Assistant IA', icon: 'psychology', link: '/assistant', color: 'green' },
      { label: 'Factures', icon: 'currency_exchange', link: '/billing', color: 'orange' }
    ];

    // Commercial specific data
    this.recentSales = [
      { id: 'CMD-2026-001', client: 'Sotrapil S.A.', amount: 4850.00, status: 'PAYEE', date: '2026-06-15' },
      { id: 'CMD-2026-002', client: 'Société El-Bouniane', amount: 12400.00, status: 'EN_ATTENTE', date: '2026-06-14' },
      { id: 'CMD-2026-003', client: 'Tunisie Telecom', amount: 920.00, status: 'PAYEE', date: '2026-06-14' },
      { id: 'CMD-2026-004', client: 'Dar Deco', amount: 3150.00, status: 'ANNULEE', date: '2026-06-12' }
    ];

    this.newClients = [
      { name: 'Sotrapil S.A.', contact: 'M. Ali Ben Amor', tel: '+216 71 900 100', email: 'contact@sotrapil.com.tn' },
      { name: 'Société El-Bouniane', contact: 'Mme. Sarah Toumi', tel: '+216 71 800 200', email: 'info@elbouniane.com.tn' },
      { name: 'Tunisie Telecom', contact: 'M. Hedi Chelly', tel: '+216 71 100 100', email: 'business@tunisietelecom.tn' }
    ];

    // Comptable specific data
    this.pendingInvoices = [
      { id: 'FACT-2026-002', client: 'Société El-Bouniane', amount: 12400.00, due: '2026-07-14', delay: 'Dans 28 jours' },
      { id: 'FACT-2026-004', client: 'Dar Deco', amount: 3150.00, due: '2026-07-12', delay: 'Dans 26 jours' },
      { id: 'FACT-2026-005', client: 'Clinique Pasteur', amount: 15400.00, due: '2026-07-11', delay: 'Dans 25 jours' }
    ];

    this.recentPayments = [
      { ref: 'PAY-87FA67', client: 'Sotrapil S.A.', amount: 4850.00, method: 'Virement', date: '2026-06-15' },
      { ref: 'PAY-BF54E0', client: 'Tunisie Telecom', amount: 920.00, method: 'Chèque', date: '2026-06-14' }
    ];

    // Stock specific data
    this.stockAlerts = [
      { name: 'Câble Réseau Cat6 UTP 305m', remaining: 4, limit: 10, unit: 'Rouleaux' },
      { name: 'Switch Cisco Catalyst 24 Port', remaining: 2, limit: 5, unit: 'Unités' },
      { name: 'Routeur Wi-Fi Dual Band AC1200', remaining: 8, limit: 15, unit: 'Unités' },
      { name: 'Caméra IP Dôme 4MP POE', remaining: 5, limit: 12, unit: 'Unités' }
    ];

    this.stockMovements = [
      { product: 'Routeur Wi-Fi Dual Band AC1200', qty: '+20', type: 'ENTREE', user: 'Responsable Stock', date: 'Aujourd\'hui, 11:30' },
      { product: 'Câble Réseau Cat6 UTP 305m', qty: '-2', type: 'SORTIE', user: 'Commercial A', date: 'Aujourd\'hui, 09:15' },
      { product: 'Switch Cisco Catalyst 24 Port', qty: '-1', type: 'SORTIE', user: 'Commercial B', date: 'Hier, 15:45' },
      { product: 'Caméra IP Dôme 4MP POE', qty: '+5', type: 'ENTREE', user: 'Responsable Stock', date: 'Le 14 Juin, 14:00' }
    ];
  }

  initChartsForRole(): void {
    this.destroyCharts();

    if (this.userRole === 'ADMIN') {
      this.initAdminCharts();
    } else if (this.userRole === 'COMMERCIAL') {
      this.initCommercialCharts();
    } else if (this.userRole === 'COMPTABLE') {
      this.initComptableCharts();
    } else if (this.userRole === 'STOCK') {
      this.initStockCharts();
    }
  }

  destroyCharts(): void {
    this.charts.forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = [];
  }

  private initAdminCharts(): void {
    // Redirect to ID-based method for reliability
    this.initAdminChartsById();
  }

  private initCommercialCharts(): void {
    if (!this.commercialSalesChartRef || !this.commercialProductChartRef) return;

    const ctxSales = this.commercialSalesChartRef.nativeElement.getContext('2d');
    const chart1 = new Chart(ctxSales, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [{
          label: 'Ventes Réelles (TND)',
          data: [12000, 19000, 15000, 28000, 25000, 36000],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#3b82f6'
        }, {
          label: 'Objectif Fixé',
          data: [15000, 20000, 20000, 25000, 25000, 30000],
          borderColor: 'rgba(59, 130, 246, 0.25)',
          borderDash: [6, 6],
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointBackgroundColor: 'transparent'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter' } } } },
        scales: {
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Inter' } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
        }
      }
    });
    this.charts.push(chart1);

    const ctxProd = this.commercialProductChartRef.nativeElement.getContext('2d');
    const chart2 = new Chart(ctxProd, {
      type: 'bar',
      data: {
        labels: ['Câble Réseau', 'Switch Cisco', 'Routeur Wi-Fi', 'Caméra IP'],
        datasets: [{
          label: 'Volume de vente',
          data: [45, 12, 28, 18],
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Inter' } } },
          y: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
        }
      }
    });
    this.charts.push(chart2);
  }

  private initComptableCharts(): void {
    if (!this.comptableFlowChartRef || !this.comptableMethodChartRef) return;

    const ctxFlow = this.comptableFlowChartRef.nativeElement.getContext('2d');
    const chart1 = new Chart(ctxFlow, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [{
          label: 'Encaissé (TND)',
          data: [15000, 21000, 18000, 29000, 28000, 32400],
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }, {
          label: 'Impayé / En attente',
          data: [3000, 3000, 3000, 6000, 4000, 27800],
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Inter' } } },
          y: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Inter' } } }
        },
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter' } } } }
      }
    });
    this.charts.push(chart1);

    const ctxMethods = this.comptableMethodChartRef.nativeElement.getContext('2d');
    const chart2 = new Chart(ctxMethods, {
      type: 'doughnut',
      data: {
        labels: ['Virement', 'Chèque', 'Traite', 'Espèces'],
        datasets: [{
          data: [60, 25, 10, 5],
          backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: 'Inter' }, padding: 15 }
          }
        }
      }
    });
    this.charts.push(chart2);
  }

  private initStockCharts(): void {
    if (!this.stockCategoryChartRef || !this.stockFlowChartRef) return;

    const ctxCat = this.stockCategoryChartRef.nativeElement.getContext('2d');
    const chart1 = new Chart(ctxCat, {
      type: 'polarArea',
      data: {
        labels: ['Réseau', 'Sécurité', 'Câblage', 'Télécom'],
        datasets: [{
          data: [42000, 25000, 12000, 6400],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: 'Inter' }, padding: 15 }
          }
        },
        scales: {
          r: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    });
    this.charts.push(chart1);

    const ctxFlow = this.stockFlowChartRef.nativeElement.getContext('2d');
    const chart2 = new Chart(ctxFlow, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        datasets: [{
          label: 'Entrées',
          data: [12, 18, 5, 22, 14, 2],
          backgroundColor: '#10b981',
          borderRadius: 4
        }, {
          label: 'Sorties',
          data: [15, 8, 12, 10, 18, 4],
          backgroundColor: '#ef4444',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Inter' } } } },
        scales: {
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { family: 'Inter' } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
        }
      }
    });
    this.charts.push(chart2);
  }
}

