import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/utils`;

export interface ResultatRecherche {
  type: string;
  id: number;
  titre: string;
  sousTitre: string;
  detail: string;
  route: string;
  icone: string;
}

export interface MontantComplet {
  montantHt: string;
  montantTva: string;
  montantTtc: string;
  montantHtLettres: string;
  montantTvaLettres: string;
  montantTtcLettres: string;
}

export interface ResultatCorrection {
  texteOriginal: string;
  texteCorrected: string;
  erreursTrouvees: string[];
  explication: string;
  scoreQualite?: number;
  success: boolean;
}

export interface ResultatDate {
  valide: boolean;
  dateNormalisee?: string;
  affichageFr?: string;
  jourSemaine?: string;
  estPasse?: boolean;
  estFutur?: boolean;
  estAujourdHui?: boolean;
  erreur?: string;
}

@Injectable({ providedIn: 'root' })
export class UtilsService {

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return new HttpHeaders({ Authorization: `Bearer ${user.token || ''}` });
  }

  // ── Recherche globale (N°2) ────────────────────────────────────────

  rechercherGlobal(q: string, limite = 5): Observable<Record<string, ResultatRecherche[]>> {
    return this.http.get<Record<string, ResultatRecherche[]>>(
      `${API}/search?q=${encodeURIComponent(q)}&limite=${limite}`,
      { headers: this.headers() }
    ).pipe(catchError(() => of({})));
  }

  autocomplete(q: string): Observable<ResultatRecherche[]> {
    return this.http.get<ResultatRecherche[]>(
      `${API}/autocomplete?q=${encodeURIComponent(q)}`,
      { headers: this.headers() }
    ).pipe(catchError(() => of([])));
  }

  // ── Montants en lettres (N°7) ────────────────────────────────────────

  montantEnLettres(montant: number, devise = 'TND', langue = 'fr'): Observable<{ montant: string; lettres: string }> {
    return this.http.get<{ montant: string; lettres: string }>(
      `${API}/montant-lettres?montant=${montant}&devise=${devise}&langue=${langue}`,
      { headers: this.headers() }
    ).pipe(catchError(() => of({ montant: montant.toString(), lettres: '' })));
  }

  montantComplet(montantHt: number, tauxTva: number, devise = 'TND', langue = 'fr'): Observable<MontantComplet> {
    return this.http.post<MontantComplet>(
      `${API}/montant-complet`,
      { montantHt, tauxTva, devise, langue },
      { headers: this.headers() }
    ).pipe(catchError(() => of({} as MontantComplet)));
  }

  // ── Dictionnaire / Correction (N°4) ─────────────────────────────────

  corrigerTexte(texte: string, langue = 'fr', mode = 'correction'): Observable<ResultatCorrection> {
    return this.http.post<ResultatCorrection>(
      `${API}/corriger`,
      { texte, langue, mode },
      { headers: this.headers() }
    ).pipe(catchError(() => of({ texteOriginal: texte, texteCorrected: texte, erreursTrouvees: [], explication: '', success: false })));
  }

  suggererFormulation(contexte: string, langue = 'fr', nbSuggestions = 3): Observable<{ suggestions: string[]; success: boolean }> {
    return this.http.post<{ suggestions: string[]; success: boolean }>(
      `${API}/suggerer`,
      { contexte, langue, nbSuggestions },
      { headers: this.headers() }
    ).pipe(catchError(() => of({ suggestions: [], success: false })));
  }

  /** Alias pour AiTextareaComponent — retour générique */
  suggererTexte(prompt: string): Observable<{ suggestion: string; texte: string }> {
    return this.http.post<{ suggestion: string; texte: string }>(
      `${API}/suggerer`,
      { contexte: prompt, langue: 'fr', nbSuggestions: 1 },
      { headers: this.headers() }
    ).pipe(catchError(() => of({ suggestion: '', texte: '' })));
  }

  // ── Validation dates (N°5) ───────────────────────────────────────────

  validerDate(valeur: string, format = 'dd/MM/yyyy'): Observable<ResultatDate> {
    return this.http.post<ResultatDate>(
      `${API}/valider-date`,
      { valeur, format },
      { headers: this.headers() }
    ).pipe(catchError(() => of({ valide: false, erreur: 'Erreur réseau' })));
  }

  // ── Validation formulaires (N°6) ─────────────────────────────────────

  validerEmail(email: string): Observable<{ email: string; valide: boolean }> {
    return this.http.get<{ email: string; valide: boolean }>(
      `${API}/valider-email?email=${encodeURIComponent(email)}`,
      { headers: this.headers() }
    ).pipe(catchError(() => of({ email, valide: false })));
  }

  validerTelephone(tel: string): Observable<{ telephone: string; valide: boolean }> {
    return this.http.get<{ telephone: string; valide: boolean }>(
      `${API}/valider-telephone?tel=${encodeURIComponent(tel)}`,
      { headers: this.headers() }
    ).pipe(catchError(() => of({ telephone: tel, valide: false })));
  }

  validerMatricule(matricule: string): Observable<{ matricule: string; valide: boolean }> {
    return this.http.get<{ matricule: string; valide: boolean }>(
      `${API}/valider-matricule?matricule=${encodeURIComponent(matricule)}`,
      { headers: this.headers() }
    ).pipe(catchError(() => of({ matricule, valide: false })));
  }

  // ── Helpers locaux (N°6 — validation synchrone côté client) ─────────

  /** Valide un email localement (sans appel réseau) */
  validerEmailLocal(email: string): boolean {
    return /^[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  /** Valide un téléphone localement */
  validerTelephoneLocal(tel: string): boolean {
    return /^\+?[0-9\s\-().]{7,20}$/.test(tel);
  }

  /** Valide une date au format dd/MM/yyyy localement */
  validerDateLocal(dateStr: string): boolean {
    if (!dateStr) return false;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    const [j, m, a] = parts.map(Number);
    if (!j || !m || !a || a < 1900 || a > 2100) return false;
    const d = new Date(a, m - 1, j);
    return d.getFullYear() === a && d.getMonth() === m - 1 && d.getDate() === j;
  }

  /** Formate un nombre en TND : 1234.500 → "1 234,500" */
  formaterTND(montant: number): string {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3, maximumFractionDigits: 3
    }).format(montant);
  }

  /** Formate un nombre en EUR : 1234.50 → "1 234,50 €" */
  formaterEUR(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(montant);
  }
}
