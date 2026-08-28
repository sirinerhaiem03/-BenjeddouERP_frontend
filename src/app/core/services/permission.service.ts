import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

const PERMISSIONS_URL = 'http://localhost:9090/api/user/permissions';
const LOCAL_ROLES_KEY  = 'benjeddou_roles_permissions'; // clé du localStorage

export interface ModulePermsMap {
  consulter: boolean;
  creer: boolean;
  modifier: boolean;
  supprimer: boolean;
  valider: boolean;
  exporter: boolean;
}

/**
 * PermissionService — RBAC Enforcement
 *
 * Stratégie de chargement (par ordre de priorité) :
 * 1. localStorage → lecture instantanée de la matrice sauvegardée par l'admin
 * 2. Backend HTTP → fallback si localStorage vide
 *
 * ADMIN/SUPERADMIN : accès total (bypass complet).
 * Rôle sans config : mode permissif (rien n'est bloqué).
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permsParModule = new Map<string, ModulePermsMap>();
  private chargement$ = new BehaviorSubject<boolean>(false);
  private chargementEnCours: Observable<boolean> | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  /** Charge les permissions — localStorage en priorité, backend en fallback. */
  charger(): Observable<boolean> {
    if (this.chargementEnCours) return this.chargementEnCours;

    // Toujours relire depuis localStorage (immédiat, pas de cache stale)
    // Si l'admin a modifié les permissions, elles sont reflétées au prochain chargement
    if (this.chargerDepuisLocalStorage()) {
      this.chargement$.next(true);
      return of(true);
    }

    // ── Priorité 2 : Backend HTTP (fallback) ─────────────────────────────
    console.log('[PermissionService] localStorage vide → appel backend:', PERMISSIONS_URL);
    this.chargementEnCours = this.http.get<any>(PERMISSIONS_URL).pipe(
      tap(data => {
        console.log('[PermissionService] 📥 Réponse backend:', JSON.stringify(data));
        this.appliquerPermissionsDepuisBackend(data);
        console.log('[PermissionService] 🗂️ Modules chargés:', [...this.permsParModule.keys()]);
      }),
      map(() => { this.chargement$.next(true); return true; }),
      catchError(err => {
        console.error('[PermissionService] ❌ Erreur backend', err?.status, err?.message);
        console.warn('[PermissionService] ⚠️ Mode permissif activé');
        this.chargement$.next(true);
        return of(true);
      })
    );
    return this.chargementEnCours;
  }

  peutConsulter(module: string): boolean { return this.verifier(module, 'consulter'); }
  peutCreer(module: string): boolean     { return this.verifier(module, 'creer'); }
  peutModifier(module: string): boolean  { return this.verifier(module, 'modifier'); }
  peutSupprimer(module: string): boolean { return this.verifier(module, 'supprimer'); }
  peutValider(module: string): boolean   { return this.verifier(module, 'valider'); }
  peutExporter(module: string): boolean  { return this.verifier(module, 'exporter'); }

  /** Vide le cache (appeler à la déconnexion). */
  vider(): void {
    console.log('[PermissionService] 🗑️ Cache vidé');
    this.permsParModule.clear();
    this.chargement$.next(false);
    this.chargementEnCours = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Méthodes privées
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Tente de lire la matrice depuis localStorage.
   * Retourne true si la config du rôle courant a été trouvée et appliquée.
   */
  private chargerDepuisLocalStorage(): boolean {
    try {
      const raw = localStorage.getItem(LOCAL_ROLES_KEY);
      if (!raw) {
        console.log('[PermissionService] localStorage vide — pas de matrice trouvée');
        return false;
      }

      const roles: any[] = JSON.parse(raw);
      if (!Array.isArray(roles) || roles.length === 0) {
        console.log('[PermissionService] localStorage: matrice vide');
        return false;
      }

      // Obtenir le rôle de l'utilisateur connecté (ex: "ROLE_COMMERCIAL")
      const userRoles = this.authService.getUserRoles();
      const springRole = userRoles[0] || '';
      // Supprimer le préfixe ROLE_ : "ROLE_COMMERCIAL" → "COMMERCIAL"
      const roleName = springRole.startsWith('ROLE_') ? springRole.substring(5) : springRole;

      if (!roleName) {
        console.warn('[PermissionService] Rôle utilisateur introuvable');
        return false;
      }

      // ADMIN et SUPERADMIN ont accès total → pas besoin de lire les perms
      if (roleName === 'ADMIN' || roleName === 'SUPERADMIN') {
        console.log('[PermissionService] ADMIN/SUPERADMIN → accès total');
        return true; // permsParModule reste vide → verifier() retourne true par bypass
      }

      // Chercher la config du rôle (insensible à la casse)
      const roleConfig = roles.find((r: any) =>
        typeof r.nom === 'string' && r.nom.toUpperCase() === roleName.toUpperCase()
      );

      if (!roleConfig) {
        console.warn(`[PermissionService] Rôle "${roleName}" non trouvé dans localStorage (${roles.length} rôles: ${roles.map((r: any) => r.nom).join(', ')})`);
        return false;
      }

      const modulePerms: any[] = roleConfig.modulePermissions || [];
      this.permsParModule.clear();
      for (const mp of modulePerms) {
        if (mp.module && mp.permissions) {
          this.permsParModule.set(mp.module, {
            consulter: !!mp.permissions.consulter,
            creer:     !!mp.permissions.creer,
            modifier:  !!mp.permissions.modifier,
            supprimer: !!mp.permissions.supprimer,
            valider:   !!mp.permissions.valider,
            exporter:  !!mp.permissions.exporter,
          });
        }
      }

      console.log(`[PermissionService] ✅ localStorage: rôle "${roleName}" → ${this.permsParModule.size} modules chargés`);
      console.log('[PermissionService] Modules:', [...this.permsParModule.keys()]);

      // Log rapide des modules refusés pour le debug
      this.permsParModule.forEach((perms, module) => {
        if (!perms.consulter) {
          console.warn(`[PermissionService] 🚫 Module "${module}": consulter=false (caché dans la sidebar)`);
        }
      });

      return true;
    } catch (e) {
      console.error('[PermissionService] Erreur lecture localStorage:', e);
      return false;
    }
  }

  private verifier(module: string, permission: keyof ModulePermsMap): boolean {
    // ADMIN et SUPERADMIN ont toujours accès total
    if (this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_SUPERADMIN')) {
      return true;
    }
    const perms = this.permsParModule.get(module);
    if (!perms) {
      // Pas de config pour ce module → mode permissif (accès autorisé)
      return true;
    }
    const result = !!perms[permission];
    if (!result) {
      console.warn(`[PermissionService] 🚫 Accès refusé: module="${module}" permission="${permission}"`);
    }
    return result;
  }

  /** Applique les permissions reçues depuis le backend (format: {role, modulePermissions:[...]}). */
  private appliquerPermissionsDepuisBackend(data: any): void {
    this.permsParModule.clear();
    const modulePerms: any[] = data?.modulePermissions || [];

    if (modulePerms.length === 0) {
      console.warn('[PermissionService] Backend: aucun module → mode permissif');
      return;
    }

    for (const mp of modulePerms) {
      if (mp.module && mp.permissions) {
        this.permsParModule.set(mp.module, {
          consulter: !!mp.permissions.consulter,
          creer:     !!mp.permissions.creer,
          modifier:  !!mp.permissions.modifier,
          supprimer: !!mp.permissions.supprimer,
          valider:   !!mp.permissions.valider,
          exporter:  !!mp.permissions.exporter,
        });
      }
    }
  }
}
