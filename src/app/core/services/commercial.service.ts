import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:9090/api';

@Injectable({
  providedIn: 'root'
})
export class CommercialService {

  constructor(private http: HttpClient) {}

  // ══ CLIENTS ══════════════════════════════════════════════
  getClients(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/clients`);
  }
  getClient(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/clients/${id}`);
  }
  createClient(client: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/clients`, client);
  }
  updateClient(id: number, client: any): Observable<any> {
    return this.http.put<any>(`${API_BASE}/clients/${id}`, client);
  }
  deleteClient(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/clients/${id}`);
  }

  // ══ FOURNISSEURS ══════════════════════════════════════════
  getFournisseurs(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/fournisseurs`);
  }
  getFournisseur(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/fournisseurs/${id}`);
  }
  createFournisseur(f: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/fournisseurs`, f);
  }
  updateFournisseur(id: number, f: any): Observable<any> {
    return this.http.put<any>(`${API_BASE}/fournisseurs/${id}`, f);
  }
  deleteFournisseur(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/fournisseurs/${id}`);
  }

  // ══ COMMANDES ═════════════════════════════════════════════
  getCommandes(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/commandes`);
  }
  getCommande(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/commandes/${id}`);
  }
  getLignesCommande(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/commandes/${id}/lignes`);
  }
  createCommande(data: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/commandes`, data);
  }
  changerStatutCommande(id: number, statut: string): Observable<any> {
    return this.http.put<any>(`${API_BASE}/commandes/${id}/statut`, { statut });
  }
  deleteCommande(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/commandes/${id}`);
  }
  genererFacture(commandeId: number): Observable<any> {
    return this.http.post<any>(`${API_BASE}/commandes/${commandeId}/facture`, {});
  }

  // ══ FACTURES ══════════════════════════════════════════════
  getFactures(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/factures`);
  }
  getFacture(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/factures/${id}`);
  }
  getLignesFacture(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/factures/${id}/lignes`);
  }
  changerStatutFacture(id: number, statut: string): Observable<any> {
    return this.http.put<any>(`${API_BASE}/factures/${id}/statut`, { statut });
  }
  deleteFacture(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/factures/${id}`);
  }
  envoyerFactureEmail(id: number): Observable<any> {
    return this.http.post<any>(`${API_BASE}/factures/${id}/envoyer`, {});
  }
  envoyerRappelImpayee(id: number): Observable<any> {
    return this.http.post<any>(`${API_BASE}/factures/${id}/rappel`, {});
  }

  // ══ DEVIS ═════════════════════════════════════════════════
  getDevis(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/devis`);
  }
  getDevisById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/devis/${id}`);
  }
  getLignesDevis(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/devis/${id}/lignes`);
  }
  createDevis(data: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/devis`, data);
  }
  changerStatutDevis(id: number, statut: string): Observable<any> {
    return this.http.put<any>(`${API_BASE}/devis/${id}/statut`, { statut });
  }
  convertirEnCommande(id: number): Observable<any> {
    return this.http.post<any>(`${API_BASE}/devis/${id}/convertir`, {});
  }
  deleteDevis(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/devis/${id}`);
  }

  // ══ CODES PROMO ═══════════════════════════════════════════
  getPromos(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/promo`);
  }
  getPromosActives(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/promo/actifs`);
  }
  createPromo(data: any): Observable<any> {
    return this.http.post<any>(`${API_BASE}/promo`, data);
  }
  updatePromo(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${API_BASE}/promo/${id}`, data);
  }
  togglePromo(id: number): Observable<any> {
    return this.http.patch<any>(`${API_BASE}/promo/${id}/toggle`, {});
  }
  deletePromo(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE}/promo/${id}`);
  }
  verifierCodePromo(code: string, montantCommande: number): Observable<any> {
    return this.http.post<any>(`${API_BASE}/promo/verifier`, { code, montantCommande });
  }
}
