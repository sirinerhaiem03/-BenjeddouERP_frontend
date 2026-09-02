import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
const API_URL = `${environment.apiUrl}/api/auth/`;

/**
 * AuthService — J3 Sécurité
 * Gestion séparée de l'access token (mémoire) et du refresh token (localStorage).
 * L'access token n'est JAMAIS stocké en localStorage pour éviter les attaques XSS.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  // Access token en mémoire uniquement (sécurité XSS)
  private _accessToken: string | null = null;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    this.currentUserSubject = new BehaviorSubject<any>(parsed);
    this.currentUser = this.currentUserSubject.asObservable();

    // Restaurer l'access token depuis le user stocké (token est dans currentUser.token)
    if (parsed?.token) {
      this._accessToken = parsed.token;
    }
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(API_URL + 'login', credentials).pipe(
      map(user => {
        if (user && user.token) {
          // Stocker l'access token en mémoire
          this._accessToken = user.token;
          // Stocker le user complet (avec refreshToken) dans localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
        return user;
      })
    );
  }

  logout(): void {
    // Notifier le serveur (révocation du refresh token)
    const token = this.getToken();
    if (token) {
      this.http.post(API_URL + 'logout', {}, {
        headers: { Authorization: 'Bearer ' + token }
      }).subscribe({ error: () => { } }); // Silencieux
    }
    this._accessToken = null;
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('trialModalShownAt');
    this.currentUserSubject.next(null);
  }

  /**
   * Rafraîchit l'access token en utilisant le refresh token stocké.
   * Appelé automatiquement par le JWT Interceptor si on reçoit un 401.
   */
  refreshAccessToken(): Observable<any> {
    const user = this.currentUserValue;
    const refreshToken = user?.refreshToken;

    if (!refreshToken) {
      this.logout();
      throw new Error('Aucun refresh token disponible');
    }

    return this.http.post<any>(API_URL + 'refresh', { refreshToken }).pipe(
      tap(response => {
        if (response?.accessToken) {
          this._accessToken = response.accessToken;
          // Mettre à jour le localStorage avec le nouvel access token
          const updatedUser = {
            ...this.currentUserValue,
            token: response.accessToken
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }

  getToken(): string | null {
    // Priorité : token en mémoire, sinon token du localStorage
    if (this._accessToken) return this._accessToken;
    const user = this.currentUserValue;
    return user ? user.token : null;
  }

  getRefreshToken(): string | null {
    return this.currentUserValue?.refreshToken || null;
  }

  getUserRoles(): string[] {
    const user = this.currentUserValue;
    return user ? user.roles : [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  getCurrentUser(): any {
    return this.currentUserValue;
  }

  isTrialActive(): boolean {
    const user = this.currentUserValue;
    if (!user?.modeTrial) return false;
    if (!user?.trialExpiresAt) return true;
    return new Date(user.trialExpiresAt) > new Date();
  }

  getJoursTrialRestants(): number {
    const user = this.currentUserValue;
    if (!user?.trialExpiresAt) return 0;
    const diff = new Date(user.trialExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(API_URL + 'forgot-password?email=' + encodeURIComponent(email), {});
  }

  resetPassword(token: string, motDePasse: string): Observable<any> {
    return this.http.post<any>(API_URL + `reset-password?token=${encodeURIComponent(token)}&motDePasse=${encodeURIComponent(motDePasse)}`, {});
  }

  register(user: any): Observable<any> {
    return this.http.post<any>(API_URL + 'register', user);
  }
}
