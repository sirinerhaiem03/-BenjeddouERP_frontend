import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

export interface LigneCalcul {
  id?: number;
  numeroLigne: number;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  taux: number;
  montantBase: number;
  resultatLigne: number;
  libellePeriode?: string;
}

export interface CalculMoteur {
  id: number;
  reference: string;
  typeCalcul: 'TAUX_UNIQUE' | 'TAUX_VARIABLE';
  montant: number;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  tauxUnique?: number;
  resultatTotal: number;
  moduleErp: string;
  libelle?: string;
  dateCreation: string;
  creeParNom?: string;
}

export interface PeriodeTaux {
  id?: number;
  dateDebut: string;
  dateFin: string;
  taux: number;
  libelle?: string;
  actif: boolean;
  dateCreation?: string;
}

export interface ResultatCalcul {
  success: boolean;
  calcul: CalculMoteur;
  lignes?: LigneCalcul[];
  message: string;
}

export interface SimulationResult {
  success: boolean;
  lignes: LigneCalcul[];
  resultatTotal: number;
  nombreJoursTotal: number;
  nbPeriodes: number;
}

@Injectable({ providedIn: 'root' })
export class CalculService {

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return new HttpHeaders({ Authorization: `Bearer ${user.token || ''}` });
  }

  // ── Mode 1 : Taux unique ────────────────────────────────────────

  calculerTauxUnique(params: {
    montant: number;
    dateDebut: string;
    dateFin: string;
    taux: number;
    moduleErp?: string;
    libelle?: string;
    userId?: number;
  }): Observable<ResultatCalcul> {
    return this.http.post<ResultatCalcul>(`${API}/calcul/taux-unique`, params,
      { headers: this.headers() }
    ).pipe(catchError(err => of({ success: false, calcul: null as any, message: err.error?.message || 'Erreur réseau' })));
  }

  // ── Mode 2 : Taux variables ─────────────────────────────────────

  calculerTauxVariable(params: {
    montant: number;
    dateDebut: string;
    dateFin: string;
    moduleErp?: string;
    libelle?: string;
    userId?: number;
  }): Observable<ResultatCalcul & { lignes: LigneCalcul[] }> {
    return this.http.post<ResultatCalcul & { lignes: LigneCalcul[] }>(
      `${API}/calcul/taux-variable`, params, { headers: this.headers() }
    ).pipe(catchError(err => of({ success: false, calcul: null as any, lignes: [], message: err.error?.message || 'Erreur réseau' })));
  }

  simulerTauxVariable(montant: number, dateDebut: string, dateFin: string): Observable<SimulationResult> {
    return this.http.post<SimulationResult>(`${API}/calcul/simuler-taux-variable`,
      { montant, dateDebut, dateFin }, { headers: this.headers() }
    ).pipe(catchError(() => of({ success: false, lignes: [], resultatTotal: 0, nombreJoursTotal: 0, nbPeriodes: 0 })));
  }

  // ── Utilitaire ──────────────────────────────────────────────────

  getNombreJours(dateDebut: string, dateFin: string): Observable<{ nombreJours: number }> {
    const params = new HttpParams().set('dateDebut', dateDebut).set('dateFin', dateFin);
    return this.http.get<{ nombreJours: number }>(`${API}/calcul/nombre-jours`,
      { headers: this.headers(), params }
    ).pipe(catchError(() => of({ nombreJours: 0 })));
  }

  // ── Historique ──────────────────────────────────────────────────

  getHistorique(page = 0, size = 20, q?: string): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    return this.http.get<any>(`${API}/calcul/historique`, { headers: this.headers(), params })
      .pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, currentPage: 0 })));
  }

  /** Historique filtré par type : TAUX_UNIQUE ou TAUX_VARIABLE */
  getHistoriqueParType(page = 0, size = 15, type: 'TAUX_UNIQUE' | 'TAUX_VARIABLE', q?: string): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size).set('type', type);
    if (q) params = params.set('q', q);
    return this.http.get<any>(`${API}/calcul/historique`, { headers: this.headers(), params })
      .pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, currentPage: 0 })));
  }

  getById(id: number): Observable<CalculMoteur> {
    return this.http.get<CalculMoteur>(`${API}/calcul/${id}`, { headers: this.headers() });
  }

  getLignes(id: number): Observable<LigneCalcul[]> {
    return this.http.get<LigneCalcul[]>(`${API}/calcul/${id}/lignes`, { headers: this.headers() })
      .pipe(catchError(() => of([])));
  }

  supprimer(id: number): Observable<any> {
    return this.http.delete(`${API}/calcul/${id}`, { headers: this.headers() });
  }

  // ── Périodes & Taux (Admin) ─────────────────────────────────────

  getPeriodes(): Observable<PeriodeTaux[]> {
    return this.http.get<PeriodeTaux[]>(`${API}/periodes-taux`, { headers: this.headers() })
      .pipe(catchError(() => of([])));
  }

  creerPeriode(periode: Partial<PeriodeTaux>): Observable<any> {
    return this.http.post(`${API}/periodes-taux`, periode, { headers: this.headers() });
  }

  modifierPeriode(id: number, periode: Partial<PeriodeTaux>): Observable<any> {
    return this.http.put(`${API}/periodes-taux/${id}`, periode, { headers: this.headers() });
  }

  togglePeriode(id: number): Observable<any> {
    return this.http.patch(`${API}/periodes-taux/${id}/toggle`, {}, { headers: this.headers() });
  }

  supprimerPeriode(id: number): Observable<any> {
    return this.http.delete(`${API}/periodes-taux/${id}`, { headers: this.headers() });
  }
}
