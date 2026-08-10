import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StockService } from '../../core/services/stock.service';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { AiTextareaComponent } from '../../shared/components/ai-textarea/ai-textarea.component';
import { QrBarcodeService } from '../../core/services/qr-barcode.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, AiTextareaComponent],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit {
  activeTab: string = 'products'; // products, warehouses, movements, inventories
  stockStatusChart: any = null;
  categoryValueChart: any = null;

  // Data lists
  products: any[] = [];
  warehouses: any[] = [];
  movements: any[] = [];
  inventories: any[] = [];
  selectedWarehouseStocks: any[] = [];
  selectedInventoryDetails: any = null;
  selectedInventoryLines: any[] = [];

  // Modals visibility
  showProductModal = false;
  showWarehouseModal = false;
  showMovementModal = false;
  showInventoryModal = false;
  showInventoryDetailsModal = false;
  showTransferModal = false;
  showProductDetailModal = false;

  // Product Detail Data
  selectedProductDetail: any = null;
  productMovements: any[] = [];
  productWarehouseStocks: any[] = [];
  loadingProductDetail = false;

  // Forms
  productForm!: FormGroup;
  warehouseForm!: FormGroup;
  movementForm!: FormGroup;
  inventoryForm!: FormGroup;
  transferForm!: FormGroup;

  // Edit states
  isEditingProduct = false;
  isEditingWarehouse = false;
  selectedProductId: number | null = null;
  selectedWarehouseId: number | null = null;
  selectedWarehouseFilter: number | null = null;

  // CSV import
  @ViewChild('csvFileInput') csvFileInput!: ElementRef;
  csvImportLoading = false;
  csvImportResult: { success: number; errors: string[] } | null = null;

  // ==========================================
  // VIEW MODE (Table / Grid)
  // ==========================================
  productViewMode: 'table' | 'grid' = 'table';

  // ==========================================
  // SEARCH & FILTERS
  // ==========================================
  searchQuery = '';
  filterCategory = '';
  filterAlertStatus = ''; // '' = all, 'alert' = rupture/critique, 'ok' = stock optimal
  filterWarehouseId: number | '' = '';

  get filteredProducts(): any[] {
    return this.products.filter(p => {
      // Search by name or reference
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q || p.nom?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q);

      // Filter by category
      const matchCategory = !this.filterCategory || p.categorie === this.filterCategory;

      // Filter by alert status
      let matchAlert = true;
      if (this.filterAlertStatus === 'alert') {
        matchAlert = p.quantiteStock <= p.seuilStockMin;
      } else if (this.filterAlertStatus === 'ok') {
        matchAlert = p.quantiteStock > p.seuilStockMin;
      }

      return matchSearch && matchCategory && matchAlert;
    });
  }

  get uniqueCategories(): string[] {
    const cats = this.products.map(p => p.categorie).filter(Boolean);
    return [...new Set(cats)].sort();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterCategory = '';
    this.filterAlertStatus = '';
    this.filterWarehouseId = '';
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.filterCategory) count++;
    if (this.filterAlertStatus) count++;
    return count;
  }

  get alertProducts(): any[] {
    return this.products.filter(p => p.quantiteStock <= p.seuilStockMin);
  }

  // ==========================================
  // KPI COMPUTED GETTERS
  // ==========================================
  get totalStockValue(): number {
    return this.products.reduce((sum, p) => sum + (p.quantiteStock * p.prixAchat), 0);
  }

  get totalActiveProducts(): number {
    return this.products.filter(p => p.quantiteStock > 0).length;
  }

  get totalAlertCount(): number {
    return this.alertProducts.length;
  }

  get monthMovementsValue(): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    return this.movements
      .filter(m => {
        const d = new Date(m.dateMouvement);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear && m.typeMouvement === 'ENTREE';
      })
      .reduce((sum, m) => {
        const prod = this.products.find(p => p.id === m.produit?.id);
        return sum + (m.quantite * (prod?.prixAchat ?? 0));
      }, 0);
  }

  // Current User roles
  canWrite = false;
  isStockOnly = false;

  // Expose Math to template
  Math = Math;

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private fb: FormBuilder,
    private exportService: ExportService,
    public qrBarcodeService: QrBarcodeService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  printQrLabel(product: any, event?: Event): void {
    if (event) { event.stopPropagation(); }
    this.qrBarcodeService.printProductLabel(product);
  }

  getQrCodeUrl(product: any): string {
    return this.qrBarcodeService.getProductQRCodeUrl(product);
  }

  ngOnInit(): void {
    const roles = this.authService.getUserRoles();
    this.canWrite = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_STOCK');
    this.isStockOnly = roles.includes('ROLE_STOCK') && !roles.includes('ROLE_ADMIN');

    // Sync active tab with URL query param
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && ['products', 'warehouses', 'movements', 'inventories'].includes(tab)) {
        this.activeTab = tab;
      } else {
        this.activeTab = 'products';
      }
    });

    this.initForms();
    this.loadAllData();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  initForms(): void {
    this.productForm = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      reference: ['', [Validators.required, Validators.maxLength(50)]],
      description: [''],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
      prixAchat: [0, [Validators.required, Validators.min(0)]],
      seuilStockMin: [5, [Validators.required, Validators.min(0)]],
      categorie: ['', [Validators.required]]
    });

    this.warehouseForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      adresse: ['', [Validators.required]],
      description: ['']
    });

    this.movementForm = this.fb.group({
      produitId: ['', [Validators.required]],
      entrepotId: ['', [Validators.required]],
      typeMouvement: ['ENTREE', [Validators.required]],
      quantite: [1, [Validators.required, Validators.min(1)]],
      description: ['']
    });

    this.inventoryForm = this.fb.group({
      entrepotId: ['', [Validators.required]],
      description: ['']
    });

    this.transferForm = this.fb.group({
      produitId: ['', [Validators.required]],
      entrepotSourceId: ['', [Validators.required]],
      entrepotCibleId: ['', [Validators.required]],
      quantite: [1, [Validators.required, Validators.min(1)]],
      description: ['']
    });
  }


  loadAllData(): void {
    this.loadProducts();
    this.loadWarehouses();
    this.loadMovements();
    this.loadInventories();
  }

  loadTabSpecificData(): void {
    if (this.activeTab === 'products') {
      this.loadProducts();
    } else if (this.activeTab === 'warehouses') {
      this.loadWarehouses();
      if (this.selectedWarehouseFilter) {
        this.loadWarehouseStocks(this.selectedWarehouseFilter);
      }
    } else if (this.activeTab === 'movements') {
      this.loadMovements();
      this.loadProducts();
      this.loadWarehouses();
    } else if (this.activeTab === 'inventories') {
      this.loadInventories();
      this.loadWarehouses();
    }
  }

  // ==========================================
  // DATA LOADERS
  // ==========================================
  loadProducts(): void {
    this.stockService.getProducts().subscribe({
      next: (res) => {
        this.products = res;
        setTimeout(() => this.buildStockCharts(), 200);
      },
      error: (err) => console.error(err)
    });
  }

  buildStockCharts(): void {
    this.buildStockStatusChart();
    this.buildCategoryValueChart();
  }

  buildStockStatusChart(): void {
    const canvas = document.getElementById('stockStatusChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.stockStatusChart) { this.stockStatusChart.destroy(); this.stockStatusChart = null; }

    let normalCount = 0;
    let lowCount = 0;
    let emptyCount = 0;

    (this.products || []).forEach(p => {
      const qty = p.quantiteStock ?? p.stockActuel ?? 0;
      const min = p.seuilStockMin ?? 5;
      if (qty === 0) emptyCount++;
      else if (qty <= min) lowCount++;
      else normalCount++;
    });

    this.stockStatusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Stock Optimal', 'Stock Faible', 'Rupture'],
        datasets: [{
          data: [normalCount, lowCount, emptyCount],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
        }
      }
    });
  }

  buildCategoryValueChart(): void {
    const canvas = document.getElementById('categoryValueChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.categoryValueChart) { this.categoryValueChart.destroy(); this.categoryValueChart = null; }

    const catMap: { [key: string]: number } = {};
    (this.products || []).forEach(p => {
      const cat = p.categorie || 'GENERAL';
      const qty = p.quantiteStock ?? p.stockActuel ?? 0;
      const price = p.prixVente ?? p.prixUnitaire ?? 0;
      catMap[cat] = (catMap[cat] || 0) + (qty * price);
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    this.categoryValueChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['GÉNÉRAL'],
        datasets: [{
          label: 'Valeur Stock (TND)',
          data: data.length > 0 ? data : [0],
          backgroundColor: 'rgba(13, 159, 170, 0.75)',
          borderColor: '#0d9faa',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y ?? 0).toFixed(3)} TND`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  loadWarehouses(): void {
    this.stockService.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses = res;
        if (res.length > 0 && !this.selectedWarehouseFilter) {
          this.selectedWarehouseFilter = res[0].id;
          this.loadWarehouseStocks(res[0].id);
        }
      },
      error: (err) => console.error(err)
    });
  }

  loadWarehouseStocks(warehouseId: number): void {
    this.selectedWarehouseFilter = warehouseId;
    this.stockService.getWarehouseStocks(warehouseId).subscribe({
      next: (res) => this.selectedWarehouseStocks = res,
      error: (err) => console.error(err)
    });
  }

  loadMovements(): void {
    this.stockService.getMovements().subscribe({
      next: (res) => this.movements = res,
      error: (err) => console.error(err)
    });
  }

  loadInventories(): void {
    this.stockService.getInventories().subscribe({
      next: (res) => this.inventories = res,
      error: (err) => console.error(err)
    });
  }

  // ==========================================
  // COMPUTED HELPERS
  // ==========================================
  getMargePercent(prod: any): number {
    if (!prod || !prod.prixUnitaire || prod.prixUnitaire === 0) return 0;
    return Math.round(((prod.prixUnitaire - prod.prixAchat) / prod.prixUnitaire) * 100);
  }

  getMargeClass(marge: number): string {
    if (marge >= 30) return 'marge-excellent';
    if (marge >= 15) return 'marge-good';
    if (marge >= 0) return 'marge-low';
    return 'marge-negative';
  }

  getWarehouseStockPercent(stock: any): number {
    const total = this.productWarehouseStocks.reduce((sum: number, s: any) => sum + s.quantite, 0);
    if (total === 0) return 0;
    return Math.round((stock.quantite / total) * 100);
  }

  // ==========================================
  // PRODUCT ACTIONS (MODALS & SAVE)
  // ==========================================
  openAddProductModal(): void {
    this.isEditingProduct = false;
    this.selectedProductId = null;
    this.productForm.reset({ prixUnitaire: 0, prixAchat: 0, seuilStockMin: 5 });
    this.showProductModal = true;
  }

  openEditProductModal(product: any): void {
    this.isEditingProduct = true;
    this.selectedProductId = product.id;
    this.productForm.patchValue({
      nom: product.nom,
      reference: product.reference,
      description: product.description,
      prixUnitaire: product.prixUnitaire,
      prixAchat: product.prixAchat,
      seuilStockMin: product.seuilStockMin,
      categorie: product.categorie
    });
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;

    const val = this.productForm.value;
    if (this.isEditingProduct && this.selectedProductId) {
      this.stockService.updateProduct(this.selectedProductId, val).subscribe({
        next: () => { this.loadProducts(); this.closeProductModal(); },
        error: (err) => alert(err.error || 'Erreur lors de la modification')
      });
    } else {
      this.stockService.createProduct(val).subscribe({
        next: () => { this.loadProducts(); this.closeProductModal(); },
        error: (err) => alert(err.error || 'Erreur lors de la création')
      });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce produit de la base ?')) {
      this.stockService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => alert(err.error || 'Erreur lors de la suppression')
      });
    }
  }

  // ==========================================
  // FICHE PRODUIT DÉTAILLÉE
  // ==========================================
  openProductDetail(product: any): void {
    this.selectedProductDetail = product;
    this.productMovements = [];
    this.productWarehouseStocks = [];
    this.loadingProductDetail = true;
    this.showProductDetailModal = true;

    // Load product movements
    this.stockService.getProductMovements(product.id).subscribe({
      next: (res) => { this.productMovements = res; },
      error: () => { this.productMovements = []; }
    });

    // Load product stock by warehouse
    this.stockService.getProductStocksByWarehouse(product.id).subscribe({
      next: (res) => { this.productWarehouseStocks = res; this.loadingProductDetail = false; },
      error: () => { this.productWarehouseStocks = []; this.loadingProductDetail = false; }
    });
  }

  closeProductDetailModal(): void {
    this.showProductDetailModal = false;
    this.selectedProductDetail = null;
    this.productMovements = [];
    this.productWarehouseStocks = [];
  }

  // ==========================================
  // WAREHOUSES ACTIONS
  // ==========================================
  openAddWarehouseModal(): void {
    this.isEditingWarehouse = false;
    this.selectedWarehouseId = null;
    this.warehouseForm.reset();
    this.showWarehouseModal = true;
  }

  openEditWarehouseModal(warehouse: any): void {
    this.isEditingWarehouse = true;
    this.selectedWarehouseId = warehouse.id;
    this.warehouseForm.patchValue({
      code: warehouse.code,
      nom: warehouse.nom,
      adresse: warehouse.adresse,
      description: warehouse.description
    });
    this.showWarehouseModal = true;
  }

  closeWarehouseModal(): void {
    this.showWarehouseModal = false;
  }

  saveWarehouse(): void {
    if (this.warehouseForm.invalid) return;

    const val = this.warehouseForm.value;
    if (this.isEditingWarehouse && this.selectedWarehouseId) {
      this.stockService.updateWarehouse(this.selectedWarehouseId, val).subscribe({
        next: () => { this.loadWarehouses(); this.closeWarehouseModal(); },
        error: (err) => alert(err.error || 'Erreur lors de la modification')
      });
    } else {
      this.stockService.createWarehouse(val).subscribe({
        next: () => { this.loadWarehouses(); this.closeWarehouseModal(); },
        error: (err) => alert(err.error || 'Erreur lors de la création')
      });
    }
  }

  deleteWarehouse(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cet entrepôt ?')) {
      this.stockService.deleteWarehouse(id).subscribe({
        next: () => this.loadWarehouses(),
        error: (err) => alert(err.error || 'Erreur lors de la suppression')
      });
    }
  }

  // ==========================================
  // TRANSFERT INTER-ENTREPÔTS
  // ==========================================
  openTransferModal(): void {
    this.transferForm.reset({ quantite: 1 });
    this.showTransferModal = true;
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
  }

  saveTransfer(): void {
    if (this.transferForm.invalid) return;

    const val = this.transferForm.value;
    if (val.entrepotSourceId === val.entrepotCibleId) {
      alert('Erreur : L\'entrepôt source et l\'entrepôt cible doivent être différents !');
      return;
    }

    const currentUser = this.authService.currentUserValue;

    // Mouvement 1 : SORTIE de la source
    const mouvementSortie = {
      produit: { id: Number(val.produitId) },
      entrepot: { id: Number(val.entrepotSourceId) },
      typeMouvement: 'TRANSFERT',
      quantite: val.quantite,
      description: `Transfert vers entrepôt cible — ${val.description || ''}`,
      utilisateur: currentUser ? { id: currentUser.id } : null
    };

    this.stockService.createMovement(mouvementSortie).subscribe({
      next: () => {
        // Mouvement 2 : ENTRÉE dans la cible
        const mouvementEntree = {
          produit: { id: Number(val.produitId) },
          entrepot: { id: Number(val.entrepotCibleId) },
          typeMouvement: 'ENTREE',
          quantite: val.quantite,
          description: `Réception par transfert depuis entrepôt source — ${val.description || ''}`,
          utilisateur: currentUser ? { id: currentUser.id } : null
        };

        this.stockService.createMovement(mouvementEntree).subscribe({
          next: () => {
            alert('Transfert effectué avec succès ! 2 mouvements de stock ont été générés.');
            this.closeTransferModal();
            this.loadAllData();
          },
          error: (err) => alert('Erreur lors de l\'entrée dans l\'entrepôt cible : ' + (err.error || ''))
        });
      },
      error: (err) => alert('Erreur lors de la sortie de l\'entrepôt source : ' + (err.error || ''))
    });
  }

  // ==========================================
  // MOVEMENTS
  // ==========================================
  openAddMovementModal(): void {
    this.movementForm.reset({ typeMouvement: 'ENTREE', quantite: 1 });
    this.showMovementModal = true;
  }

  closeMovementModal(): void {
    this.showMovementModal = false;
  }

  saveMovement(): void {
    if (this.movementForm.invalid) return;

    const val = this.movementForm.value;
    const req = {
      produit: { id: val.produitId },
      entrepot: { id: val.entrepotId },
      typeMouvement: val.typeMouvement,
      quantite: val.quantite,
      description: val.description,
      utilisateur: { id: this.authService.currentUserValue.id }
    };

    this.stockService.createMovement(req).subscribe({
      next: () => { this.loadTabSpecificData(); this.closeMovementModal(); },
      error: (err) => alert(err.error || 'Erreur lors de l\'enregistrement')
    });
  }


  triggerCSVImport(): void {
    if (this.csvFileInput) {
      this.csvFileInput.nativeElement.click();
    }
  }

  onImportCSV(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.csvImportLoading = true;
    this.csvImportResult = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const productsToImport = this.stockService.parseCSVToProducts(csvText);

      if (productsToImport.length === 0) {
        alert('Aucun produit valide trouvé dans le fichier CSV. Vérifiez le format et réessayez.');
        this.csvImportLoading = false;
        return;
      }

      let successCount = 0;
      const errors: string[] = [];
      let processed = 0;

      productsToImport.forEach((product, index) => {
        this.stockService.createProduct(product).subscribe({
          next: () => {
            successCount++;
            processed++;
            if (processed === productsToImport.length) {
              this.csvImportResult = { success: successCount, errors };
              this.csvImportLoading = false;
              this.loadProducts();
            }
          },
          error: (err) => {
            errors.push(`Ligne ${index + 2} (${product.reference}): ${err.error || 'Erreur'}`);
            processed++;
            if (processed === productsToImport.length) {
              this.csvImportResult = { success: successCount, errors };
              this.csvImportLoading = false;
              this.loadProducts();
            }
          }
        });
      });
    };
    reader.readAsText(file, 'utf-8');
    // Reset file input
    input.value = '';
  }

  // ==========================================
  // INVENTORIES
  // ==========================================
  openAddInventoryModal(): void {
    this.inventoryForm.reset();
    this.showInventoryModal = true;
  }

  closeInventoryModal(): void {
    this.showInventoryModal = false;
  }

  saveInventory(): void {
    if (this.inventoryForm.invalid) return;

    const val = this.inventoryForm.value;
    const req = {
      entrepot: { id: val.entrepotId },
      description: val.description
    };

    this.stockService.createInventory(req).subscribe({
      next: () => { this.loadInventories(); this.closeInventoryModal(); },
      error: (err) => alert(err.error || 'Erreur lors de la planification')
    });
  }

  viewInventoryDetails(invId: number): void {
    this.stockService.getInventory(invId).subscribe({
      next: (res: any) => {
        this.selectedInventoryDetails = res.inventaire;
        this.selectedInventoryLines = res.lignes;
        this.showInventoryDetailsModal = true;
      },
      error: (err) => console.error(err)
    });
  }

  closeInventoryDetailsModal(): void {
    this.showInventoryDetailsModal = false;
    this.selectedInventoryDetails = null;
    this.selectedInventoryLines = [];
  }

  saveInventoryCounts(): void {
    if (!this.selectedInventoryDetails) return;
    
    this.stockService.saveInventoryLines(this.selectedInventoryDetails.id, this.selectedInventoryLines).subscribe({
      next: () => {
        alert('Saisies physiques sauvegardées temporairement.');
        this.closeInventoryDetailsModal();
        this.loadInventories();
      },
      error: (err) => alert(err.error || 'Erreur lors de la sauvegarde')
    });
  }

  validateInventory(id: number): void {
    if (confirm('Voulez-vous valider définitivement cet inventaire ? Cette action mettra à jour les quantités réelles en stock et générera des mouvements correctifs en cas d\'écart.')) {
      this.stockService.validateInventory(id).subscribe({
        next: () => {
          alert('Inventaire validé avec succès. Les stocks ont été mis à jour.');
          this.closeInventoryDetailsModal();
          this.loadInventories();
        },
        error: (err) => alert(err.error || 'Erreur de validation')
      });
    }
  }

  // ==========================================
  // RAPPORT PDF INVENTAIRE
  // ==========================================
  printInventoryReport(inventory: any, lines: any[]): void {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });

    const ecartRows = lines.map((l, i) => {
      const ecart = (l.quantitePhysique != null) ? (l.quantitePhysique - l.quantiteTheorique) : 'N/A';
      const ecartClass = typeof ecart === 'number' ? (ecart > 0 ? 'pos' : ecart < 0 ? 'neg' : 'zero') : 'zero';
      const ecartDisplay = typeof ecart === 'number' ? (ecart > 0 ? `+${ecart}` : `${ecart}`) : '—';
      return `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${l.produit?.nom || '—'}</strong></td>
          <td>${l.produit?.reference || '—'}</td>
          <td>${l.produit?.categorie || '—'}</td>
          <td class="qty">${l.quantiteTheorique}</td>
          <td class="qty">${l.quantitePhysique ?? '—'}</td>
          <td class="qty ${ecartClass}">${ecartDisplay}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport d'Inventaire - ${inventory?.code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 11pt; }
    .page { padding: 28px 32px; max-width: 900px; margin: auto; }

    /* Header */
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 3px solid #f97316; margin-bottom: 22px; }
    .company-info h1 { font-size: 22pt; font-weight: 800; color: #f97316; letter-spacing: -0.5px; }
    .company-info p { font-size: 9pt; color: #64748b; margin-top: 4px; line-height: 1.5; }
    .report-badge { background: #f97316; color: white; padding: 8px 16px; border-radius: 8px; font-size: 9pt; font-weight: 700; text-align: right; }
    .report-badge .badge-title { font-size: 13pt; display: block; margin-bottom: 3px; }

    /* Meta grid */
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
    .meta-item { padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .meta-item .label { font-size: 8pt; color: #94a3b8; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px; }
    .meta-item .value { font-size: 11pt; font-weight: 700; color: #1e293b; }
    .status-ok { color: #16a34a; }
    .status-pending { color: #d97706; }

    /* Summary */
    .summary { display: flex; gap: 10px; margin-bottom: 22px; }
    .summary-card { flex: 1; padding: 10px 14px; border-radius: 8px; text-align: center; }
    .summary-card .s-val { font-size: 18pt; font-weight: 800; display: block; }
    .summary-card .s-lbl { font-size: 8pt; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .card-total { background: #f1f5f9; }
    .card-total .s-val { color: #1e293b; }
    .card-ok { background: #f0fdf4; }
    .card-ok .s-val { color: #16a34a; }
    .card-pos { background: #eff6ff; }
    .card-pos .s-val { color: #2563eb; }
    .card-neg { background: #fef2f2; }
    .card-neg .s-val { color: #dc2626; }

    /* Table */
    .section-title { font-size: 12pt; font-weight: 700; color: #1e293b; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; display: inline-block; width: 4px; height: 16px; background: #f97316; border-radius: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 28px; }
    thead { background: #1e293b; color: white; }
    thead th { padding: 9px 10px; text-align: left; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #f1f5f9; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .qty { text-align: center; font-weight: 700; }
    .pos { color: #2563eb; }
    .neg { color: #dc2626; }
    .zero { color: #94a3b8; }

    /* Signature */
    .signature-zone { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .sig-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px; min-height: 100px; }
    .sig-box .sig-label { font-size: 8pt; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: block; }
    .sig-box .sig-name { font-size: 10pt; font-weight: 600; color: #1e293b; }

    /* Footer */
    .report-footer { margin-top: 20px; text-align: center; font-size: 8pt; color: #94a3b8; padding-top: 10px; border-top: 1px solid #f1f5f9; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 15px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="report-header">
    <div class="company-info">
      <h1>BENJEDDOU ERP</h1>
      <p>Plateforme de Gestion d'Entreprise<br>Tunisie — ${dateStr}</p>
    </div>
    <div class="report-badge">
      <span class="badge-title">RAPPORT D'INVENTAIRE</span>
      <span>Généré le ${dateStr} à ${timeStr}</span>
    </div>
  </div>

  <!-- Meta Info -->
  <div class="meta-grid">
    <div class="meta-item">
      <span class="label">Code Inventaire</span>
      <span class="value">${inventory?.code || '—'}</span>
    </div>
    <div class="meta-item">
      <span class="label">Entrepôt</span>
      <span class="value">${inventory?.entrepot?.nom || '—'}</span>
    </div>
    <div class="meta-item">
      <span class="label">Date d'inventaire</span>
      <span class="value">${inventory?.dateInventaire ? new Date(inventory.dateInventaire).toLocaleDateString('fr-TN') : '—'}</span>
    </div>
    <div class="meta-item">
      <span class="label">Statut</span>
      <span class="value ${inventory?.statut === 'VALIDE' ? 'status-ok' : 'status-pending'}">
        ${inventory?.statut === 'VALIDE' ? '✓ Validé' : '⏳ En cours'}
      </span>
    </div>
  </div>

  <!-- Summary KPIs -->
  <div class="summary">
    <div class="summary-card card-total">
      <span class="s-val">${lines.length}</span>
      <span class="s-lbl">Total Lignes</span>
    </div>
    <div class="summary-card card-ok">
      <span class="s-val">${lines.filter(l => (l.quantitePhysique - l.quantiteTheorique) === 0).length}</span>
      <span class="s-lbl">Sans écart</span>
    </div>
    <div class="summary-card card-pos">
      <span class="s-val">${lines.filter(l => l.quantitePhysique > l.quantiteTheorique).length}</span>
      <span class="s-lbl">Excédents</span>
    </div>
    <div class="summary-card card-neg">
      <span class="s-val">${lines.filter(l => l.quantitePhysique < l.quantiteTheorique).length}</span>
      <span class="s-lbl">Manques</span>
    </div>
  </div>

  <!-- Table des écarts -->
  <div class="section-title">Tableau des Écarts d'Inventaire</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Produit</th>
        <th>Référence</th>
        <th>Catégorie</th>
        <th>Qté Théorique</th>
        <th>Qté Physique</th>
        <th>Écart</th>
      </tr>
    </thead>
    <tbody>
      ${ecartRows || '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #94a3b8;">Aucune ligne d\'inventaire.</td></tr>'}
    </tbody>
  </table>

  <!-- Signature Zone -->
  <div class="section-title">Signatures et Approbation</div>
  <div class="signature-zone">
    <div class="sig-box">
      <span class="sig-label">Responsable Stock</span>
      <div style="height: 50px;"></div>
      <span class="sig-name">Signature :</span>
    </div>
    <div class="sig-box">
      <span class="sig-label">Directeur Logistique</span>
      <div style="height: 50px;"></div>
      <span class="sig-name">Signature :</span>
    </div>
    <div class="sig-box">
      <span class="sig-label">Direction Générale</span>
      <div style="height: 50px;"></div>
      <span class="sig-name">Signature & Cachet :</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="report-footer">
    BENJEDDOU ERP — Rapport d'Inventaire ${inventory?.code} — Document confidentiel — ${dateStr}
  </div>

</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // EXPORTS — PDF / Word / CSV / Print (via ExportService centralisé)
  // ──────────────────────────────────────────────────────────────

  /** Colonnes et lignes pour les exports */
  private get _exportCols(): string[] {
    return ['Référence', 'Nom', 'Catégorie', 'Prix Unitaire', 'Prix Achat', 'Stock', 'Seuil Min', 'Unité'];
  }
  private get _exportRows(): (string | number)[][] {
    return this.filteredProducts.map(p => [
      p.reference ?? '',
      p.nom ?? '',
      p.categorie ?? '—',
      `${(p.prixUnitaire ?? 0).toFixed(2)} TND`,
      `${(p.prixAchat ?? 0).toFixed(2)} TND`,
      p.quantiteStock ?? 0,
      p.seuilStockMin ?? 0,
      p.unite ?? '—'
    ]);
  }

  exportCSV(): void {
    this.exportService.exportToCSV(this._exportCols, this._exportRows, `stock-produits-${new Date().toISOString().slice(0,10)}`);
  }

  exportPDF(): void {
    this.exportService.exportTableToPDF(
      this._exportCols,
      this._exportRows,
      'Catalogue des Produits — BENJEDDOU ERP',
      `stock-produits-${new Date().toISOString().slice(0,10)}`,
      `${this.filteredProducts.length} produit(s) — Valeur stock : ${this.totalStockValue.toFixed(2)} TND`
    );
  }

  exportWord(): void {
    this.exportService.exportTableToWord(
      this._exportCols,
      this._exportRows,
      'Catalogue des Produits — BENJEDDOU ERP',
      `stock-produits-${new Date().toISOString().slice(0,10)}`
    );
  }

  printProducts(): void {
    this.exportService.printElement('products-table', 'Catalogue des Produits — BENJEDDOU ERP');
  }
}

