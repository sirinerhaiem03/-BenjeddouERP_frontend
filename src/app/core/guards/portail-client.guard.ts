import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const portailClientGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const raw = localStorage.getItem('currentUser');
  if (!raw) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const user = JSON.parse(raw);
    const roles: string[] = user.roles || [];

    // Accepter CLIENT avec ou sans prefixe ROLE_
    const isClient = roles.includes('ROLE_CLIENT') || roles.includes('CLIENT');
    if (isClient) {
      return true;
    }

    // Non-client connecte -> rediriger vers son espace
    const isSuperAdmin = roles.includes('ROLE_SUPERADMIN') || roles.includes('SUPERADMIN');
    if (isSuperAdmin) {
      router.navigate(['/superadmin/dashboard']);
    } else {
      router.navigate(['/dashboard']);
    }
    return false;

  } catch (e) {
    console.warn('[portailClientGuard] Erreur parsing user:', e);
  }

  router.navigate(['/login']);
  return false;
};
