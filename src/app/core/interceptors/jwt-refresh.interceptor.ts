import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * JWT Refresh Interceptor (functional style) — J3 Sécurité (P4)
 *
 * Intercepte toutes les requêtes HTTP :
 * 1. Ajoute Bearer token automatiquement
 * 2. Si 401 → tente refresh silencieux via /api/auth/refresh
 * 3. Si SESSION_INVALIDEE → logout immédiat (double connexion)
 * 4. Si refresh OK → relance la requête originale
 * 5. Si refresh échoue → logout + redirect /login
 */

// État partagé pour le mécanisme de refresh (éviter race conditions)
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// URLs à ne PAS intercepter pour le refresh (éviter boucles infinies)
const EXCLUDED_URLS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password'
];

export const jwtRefreshInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ignorer les URLs exclues
  const isExcluded = EXCLUDED_URLS.some(url => req.url.includes(url));
  if (isExcluded) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const code = error.error?.code || error.error?.message;

        // SESSION_INVALIDEE = double connexion → logout immédiat
        if (code === 'SESSION_EXPIRED' || code === 'SESSION_INVALIDEE') {
          authService.logout();
          // Récupérer le signalementToken s'il est présent dans la réponse
          const sigToken = error.error?.signalementToken || '';
          const queryParams: any = {
            reason: encodeURIComponent('Votre session a été ouverte sur un autre appareil.')
          };
          if (sigToken) {
            queryParams['sigToken'] = sigToken;
          }
          router.navigate(['/login'], { queryParams });
          return throwError(() => error);
        }

        // Token expiré → tenter refresh
        return handleTokenRefresh(req, next, authService, router);
      }

      if (error.status === 402) {
        router.navigate(['/abonnement']);
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};

function handleTokenRefresh(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newToken = response.accessToken;
        refreshTokenSubject.next(newToken);
        // Relancer la requête originale avec le nouveau token
        return next(request.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        }));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        // Refresh échoué → logout forcé
        authService.logout();
        router.navigate(['/login'], {
          queryParams: {
            reason: encodeURIComponent('Votre session a expiré. Veuillez vous reconnecter.')
          }
        });
        return throwError(() => refreshError);
      })
    );
  } else {
    // Un refresh est déjà en cours → attendre qu'il se termine
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })))
    );
  }
}
