import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiUrl}/auth/`;

/**
 * HeartbeatService — J3 Sécurité (P5)
 *
 * Remplace le SessionTimeoutService par un vrai ping serveur toutes les 5 minutes.
 * Vérifie côté serveur :
 * - La validité de la session (session unique — pas de double connexion)
 * - L'expiration de la période d'essai (par date)
 *
 * En cas de problème détecté → logout automatique + redirect + toast d'alerte.
 *
 * Stratégie de tolérance : 2 pings ratés consécutifs avant de déconnecter
 * (évite les faux positifs sur coupures réseau temporaires).
 */
@Injectable({
  providedIn: 'root'
})
export class HeartbeatService implements OnDestroy {

  private intervalId: any;
  private readonly PING_INTERVAL_MS = 30 * 1000; // 30 secondes (détection rapide double-connexion)
  private consecutiveErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 2;

  // Message d'alerte affiché lors de la déconnexion forcée
  lastForceLogoutReason: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private http: HttpClient
  ) {}

  /**
   * Démarre le heartbeat — à appeler après une connexion réussie.
   */
  start(): void {
    this.stop(); // Éviter les doublons
    this.consecutiveErrors = 0;

    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.ngZone.run(() => this.ping());
      }, this.PING_INTERVAL_MS);
    });

    console.log('[Heartbeat] Démarré — ping toutes les 30 secondes');
    // Ping immédiat au démarrage (ne pas attendre 30s)
    setTimeout(() => this.ping(), 2000);
  }

  /**
   * Arrête le heartbeat — à appeler lors du logout.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  /**
   * Envoie un ping au serveur et traite la réponse.
   */
  private ping(): void {
    if (!this.authService.isLoggedIn()) {
      this.stop();
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post<any>(API_URL + 'heartbeat', {}, { headers }).subscribe({
      next: (response) => {
        this.consecutiveErrors = 0; // Réinitialiser le compteur d'erreurs

        if (response.status === 'TRIAL_EXPIRED') {
          this.forceLogout('Votre période d\'essai a expiré. Veuillez souscrire à un abonnement.', '/abonnement');
        }
        // Mettre à jour les jours restants dans le localStorage si disponible
        else if (response.joursTrialRestants !== undefined) {
          const user = this.authService.currentUserValue;
          if (user) {
            const updated = { ...user, joursTrialRestants: response.joursTrialRestants };
            localStorage.setItem('currentUser', JSON.stringify(updated));
          }
        }
      },
      error: (err) => {
        this.consecutiveErrors++;

        if (err.status === 401) {
          // Vérifier tous les champs possibles (code, status, message)
          const code = err.error?.code || err.error?.status || err.error?.message || '';
          console.warn('[Heartbeat] 401 reçu — code:', code, '| raw:', err.error);

          if (
            code === 'SESSION_INVALIDEE' ||
            code === 'SESSION_EXPIRED' ||
            code === 'SESSION_EXPIREE' ||
            code === 'COMPTE_SUSPENDU'
          ) {
            // Session invalidée → déconnecter immédiatement (pas de tolérance)
            const reason = err.error?.message ||
              'Votre compte a été connecté depuis un autre appareil. Cette session a été fermée automatiquement.';
            console.warn('[Heartbeat] 🔴 Session révoquée — déconnexion forcée:', reason);
            this.forceLogout(reason, '/login');
            return;
          }

          // Token expiré (JWT) → l'interceptor JWT s'en occupera, ne pas déconnecter
          this.consecutiveErrors = 0;
          return;
        }

        if (err.status === 402) {
          this.forceLogout('Votre période d\'essai a expiré.', '/abonnement');
          return;
        }

        // Erreur réseau → tolérance sur MAX_CONSECUTIVE_ERRORS pings
        if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
          console.warn('[Heartbeat] Trop d\'erreurs consécutives — vérifiez votre connexion.');
          // Ne pas déconnecter — juste avertir
          this.consecutiveErrors = 0;
        }
      }
    });
  }

  /**
   * Force la déconnexion avec un message d'alerte.
   */
  private forceLogout(reason: string, redirectTo: string = '/login'): void {
    this.stop();
    this.lastForceLogoutReason = reason;
    this.authService.logout();
    this.ngZone.run(() => {
      this.router.navigate([redirectTo], {
        queryParams: { reason: encodeURIComponent(reason) }
      });
    });
  }
}
