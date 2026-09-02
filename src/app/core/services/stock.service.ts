import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_BASE = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(private http: HttpClient) {}

  // ==========================================
  // PRODUITS
  // ==========================================
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/produits`);
  }

  getProduct(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/produits/${id}`);
  }

  createProduct(product: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/produits`, product);
  }

  updateProduct(id: number, product: any): Observable<any> {
    return this.http.put<any>(`${API_BASE}/produits/${id}`, product);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/produits/${id}`);
  }

  getProductAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/produits/alertes`);
  }

  getProductStocksByWarehouse(productId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/produits/${productId}/stocks`);
  }

  // ==========================================
  // ENTREPOTS
  // ==========================================
  getWarehouses(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/entrepots`);
  }

  getWarehouse(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/entrepots/${id}`);
  }

  createWarehouse(warehouse: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/entrepots`, warehouse);
  }

  updateWarehouse(id: number, warehouse: any): Observable<any> {
    return this.http.put<any>(`${API_BASE}/entrepots/${id}`, warehouse);
  }

  deleteWarehouse(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/entrepots/${id}`);
  }

  getWarehouseStocks(warehouseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/entrepots/${warehouseId}/stocks`);
  }

  // ==========================================
  // MOUVEMENTS DE STOCK
  // ==========================================
  getMovements(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/mouvements`);
  }

  getProductMovements(productId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/mouvements/produit/${productId}`);
  }

  createMovement(movement: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/mouvements`, movement);
  }

  // ==========================================
  // INVENTAIRES PHYSIQUES
  // ==========================================
  getInventories(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/inventaires`);
  }

  getInventory(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/inventaires/${id}`);
  }

  createInventory(inventory: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/inventaires`, inventory);
  }

  saveInventoryLines(inventoryId: number, lines: any[]): Observable<any> {
    return this.http.put<any>(`${API_BASE}/inventaires/${inventoryId}/lignes`, lines);
  }

  validateInventory(inventoryId: number): Observable<any> {
    return this.http.post<any>(`${API_BASE}/inventaires/${inventoryId}/valider`, {});
  }

  // ==========================================
  // IMPORT / EXPORT CSV
  // ==========================================
  exportProductsCSV(products: any[]): void {
    const headers = ['reference', 'nom', 'description', 'categorie', 'prixAchat', 'prixUnitaire', 'seuilStockMin', 'quantiteStock'];
    const headerLabels = ['Référence', 'Nom', 'Description', 'Catégorie', 'Prix Achat (TND)', 'Prix Vente (TND)', 'Seuil Min Stock', 'Quantité Actuelle'];

    const rows = products.map(p => [
      `"${(p.reference || '').replace(/"/g, '""')}"`,
      `"${(p.nom || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${(p.categorie || '').replace(/"/g, '""')}"`,
      p.prixAchat ?? 0,
      p.prixUnitaire ?? 0,
      p.seuilStockMin ?? 0,
      p.quantiteStock ?? 0
    ]);

    const csvContent = [
      headerLabels.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `catalogue-produits-benjeddou-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  parseCSVToProducts(csvText: string): any[] {
    const lines = csvText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Skip header row
    const dataLines = lines.slice(1);
    return dataLines.map(line => {
      const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return {
        reference: cols[0] || '',
        nom: cols[1] || '',
        description: cols[2] || '',
        categorie: cols[3] || '',
        prixAchat: parseFloat(cols[4]) || 0,
        prixUnitaire: parseFloat(cols[5]) || 0,
        seuilStockMin: parseInt(cols[6]) || 5,
      };
    }).filter(p => p.reference && p.nom);
  }
}
