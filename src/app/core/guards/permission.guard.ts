import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

/**
 * permissionGuard — RBAC Enforcement Guard
 *
 * Vérifie si l'utilisateur courant a la permission "consulter" sur le module
 * défini dans `route.data['module']`. Si non → redirige vers /dashboard/acces-refuse.
 *
 * ADMIN et SUPERADMIN contournent toujours cette vérification.
 * Si aucun module n'est défini dans data → accès autorisé.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const authService     = inject(AuthService);
  const permService     = inject(PermissionService);
  const router          = inject(Router);

  // ADMIN et SUPERADMIN ont accès total — ne pas vérifier les permissions
  if (authService.hasRole('ROLE_ADMIN') || authService.hasRole('ROLE_SUPERADMIN')) {
    return true;
  }

  const module = route.data?.['module'] as string | undefined;
  if (!module) return true; // Pas de module défini → accès libre

  // Charger les permissions (no-op si déjà chargées), puis vérifier
  return permService.charger().pipe(
    map(() => {
      if (permService.peutConsulter(module)) {
        return true;
      }
      // Accès refusé → redirection vers la page d'erreur avec info du module bloqué
      return router.createUrlTree(['/dashboard/acces-refuse'], {
        queryParams: { module }
      });
    })
  );
};
