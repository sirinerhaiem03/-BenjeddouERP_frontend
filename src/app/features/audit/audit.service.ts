import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

const API_URL = 'http://localhost:9090/api/audit/';

export interface AuditLog {
  id: number;
  utilisateurId: number | null;
  nomUtilisateur: string | null;
  action: string;
  resultat: 'SUCCES' | 'ECHEC' | 'BLOQUE';
  details: string | null;
  adresseIp: string | null;
  userAgent: string | null;
  module: string | null;
  ressourceId: number | null;
  createdAt: string;
}

export interface AuditPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getLogs(page = 0, size = 20, q?: string, action?: string): Observable<AuditPage> {
    let params = new HttpParams()
      .set('page', page).set('size', size);
    if (q)      params = params.set('q', q);
    if (action) params = params.set('action', action);
    return this.http.get<AuditPage>(API_URL + 'logs', { headers: this.headers(), params });
  }

  getLogsCritiques(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(API_URL + 'critiques', { headers: this.headers() });
  }

  getStats(heures = 24): Observable<any> {
    const params = new HttpParams().set('heures', heures);
    return this.http.get<any>(API_URL + 'stats', { headers: this.headers(), params });
  }

  getActions(): Observable<string[]> {
    return this.http.get<string[]>(API_URL + 'actions', { headers: this.headers() });
  }

  getLogsUtilisateur(id: number, page = 0): Observable<AuditPage> {
    const params = new HttpParams().set('page', page).set('size', 15);
    return this.http.get<AuditPage>(API_URL + `utilisateur/${id}`, { headers: this.headers(), params });
  }
}
