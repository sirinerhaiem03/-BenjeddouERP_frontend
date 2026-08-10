import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:9090/api/admin';

  constructor(private http: HttpClient) {}

  getUtilisateurs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  changerStatut(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/statut`, null,
      { params: new HttpParams().set('statut', statut) });
  }

  toggleTrial(id: number, activer: boolean, nbMax: number = 30): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/trial`, null, {
      params: new HttpParams()
        .set('activer', String(activer))
        .set('nbMax', String(nbMax))
    });
  }

  resetCompteur(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/trial/reset`, null);
  }

  getConnexions(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/${id}/connexions`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
  }
}
