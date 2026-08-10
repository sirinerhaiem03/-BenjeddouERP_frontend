import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface Permission {
  consulter: boolean;
  creer: boolean;
  modifier: boolean;
  supprimer: boolean;
  valider: boolean;
  exporter: boolean;
}

export interface ModulePermission {
  module: string;
  label: string;
  icon: string;
  permissions: Permission;
}

export interface Role {
  id?: number;
  nom: string;
  description: string;
  couleur: string;
  icone: string;
  estSysteme: boolean;
  modulePermissions: ModulePermission[];
}

@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './roles-permissions.component.html',
  styleUrls: ['./roles-permissions.component.css']
})
export class RolesPermissionsComponent implements OnInit {

  activeTab: 'roles' | 'permissions' | 'attribution' = 'roles';

  // ── Données utilisateurs ─────────────────────────────────────
  users: any[] = [];
  loadingUsers = true;

  // ── Gestion des rôles ────────────────────────────────────────
  roles: Role[] = [];
  roleSelectionne: Role | null = null;
  showRoleModal = false;
  nouveauRole: Partial<Role> = {};
  modeEdition = false;

  successMsg = '';
  errorMsg   = '';

  // ── Modules disponibles (labels dynamiques via i18n) ───────────
  get MODULES(): { module: string; label: string; icon: string }[] {
    return [
      { module: 'dashboard',      label: this.translate.instant('ROLES.MODULES.DASHBOARD'),     icon: 'dashboard' },
      { module: 'ventes',         label: this.translate.instant('ROLES.MODULES.VENTES'),         icon: 'point_of_sale' },
      { module: 'factures',       label: this.translate.instant('ROLES.MODULES.FACTURES'),       icon: 'receipt_long' },
      { module: 'clients',        label: this.translate.instant('ROLES.MODULES.CLIENTS'),         icon: 'people' },
      { module: 'fournisseurs',   label: this.translate.instant('ROLES.MODULES.FOURNISSEURS'),   icon: 'local_shipping' },
      { module: 'achats',         label: this.translate.instant('ROLES.MODULES.ACHATS'),          icon: 'shopping_cart' },
      { module: 'stock',          label: this.translate.instant('ROLES.MODULES.STOCK'),           icon: 'inventory_2' },
      { module: 'comptabilite',   label: this.translate.instant('ROLES.MODULES.COMPTABILITE'),   icon: 'account_balance' },
      { module: 'tresorerie',     label: this.translate.instant('ROLES.MODULES.TRESORERIE'),     icon: 'account_balance_wallet' },
      { module: 'rapports',       label: this.translate.instant('ROLES.MODULES.RAPPORTS'),       icon: 'bar_chart' },
      { module: 'utilisateurs',   label: this.translate.instant('ROLES.MODULES.UTILISATEURS'),   icon: 'manage_accounts' },
      { module: 'parametres',     label: this.translate.instant('ROLES.MODULES.PARAMETRES'),     icon: 'settings' },
    ];
  }

  get PERMISSIONS_LABELS(): { key: keyof Permission; label: string; icon: string; color: string }[] {
    return [
      { key: 'consulter',  label: this.translate.instant('ROLES.PERMS.CONSULTER'),  icon: 'visibility',   color: '#3b82f6' },
      { key: 'creer',      label: this.translate.instant('ROLES.PERMS.CREER'),      icon: 'add_circle',   color: '#10b981' },
      { key: 'modifier',   label: this.translate.instant('ROLES.PERMS.MODIFIER'),   icon: 'edit',         color: '#f59e0b' },
      { key: 'supprimer',  label: this.translate.instant('ROLES.PERMS.SUPPRIMER'),  icon: 'delete',       color: '#ef4444' },
      { key: 'valider',    label: this.translate.instant('ROLES.PERMS.VALIDER'),    icon: 'check_circle', color: '#8b5cf6' },
      { key: 'exporter',   label: this.translate.instant('ROLES.PERMS.EXPORTER'),   icon: 'download',     color: '#06b6d4' },
    ];
  }

  readonly COULEURS = [
    '#f97316','#3b82f6','#10b981','#8b5cf6','#ef4444',
    '#f59e0b','#06b6d4','#ec4899','#84cc16','#6366f1'
  ];

  readonly ICONES = [
    'person','manage_accounts','storefront','inventory_2','receipt_long',
    'account_balance','local_shipping','shopping_cart','bar_chart','settings',
    'shield','star','verified_user','work','groups'
  ];

  constructor(private http: HttpClient, private translate: TranslateService) {}

  ngOnInit(): void {
    this.initRolesParDefaut();
    this.chargerRolesEtPermissions();
    this.chargerUtilisateurs();
  }

  chargerRolesEtPermissions(): void {
    const savedLocal = localStorage.getItem('benjeddou_roles_permissions');
    if (savedLocal) {
      try { this.roles = JSON.parse(savedLocal); this.roleSelectionne = this.roles[0] || null; } catch (e) {}
    }
    this.http.get<any>('/api/admin/roles-permissions').subscribe({
      next: (res) => {
        if (res && res.roles && Array.isArray(res.roles) && res.roles.length > 0) {
          this.roles = res.roles;
          this.roleSelectionne = this.roles[0] || null;
          localStorage.setItem('benjeddou_roles_permissions', JSON.stringify(this.roles));
        }
      },
      error: () => {}
    });
  }

  sauvegarderMatrice(): void {
    localStorage.setItem('benjeddou_roles_permissions', JSON.stringify(this.roles));
    this.http.put('/api/admin/roles-permissions', this.roles).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('ROLES.MATRIX.SAVED'));
      },
      error: () => {
        this.showSuccess(this.translate.instant('ROLES.MATRIX.SAVED'));
      }
    });
  }

  // ── Attribution des rôles aux utilisateurs ───────────────────
  chargerUtilisateurs(): void {
    this.http.get<any[]>('/api/admin/users').subscribe({
      next: data => { this.users = data; this.loadingUsers = false; },
      error: () => { this.loadingUsers = false; }
    });
  }

  changerRoleUtilisateur(user: any, role: string): void {
    this.http.put(`/api/admin/users/${user.id}/role`, null,
      { params: new HttpParams().set('role', role) }
    ).subscribe({
      next: () => {
        user.role = role;
        this.showSuccess(`${user.nomUtilisateur} → ${role}`);
      },
      error: () => this.showError(this.translate.instant('ROLES.ERRORS.ROLE_CHANGE'))
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  getRoleParNom(nom: string): Role | undefined {
    return this.roles.find(r => r.nom === nom);
  }

  getPermCount(mp: ModulePermission): number {
    return Object.values(mp.permissions).filter(Boolean).length;
  }

  showSuccess(msg: string): void {
    this.successMsg = msg; this.errorMsg = '';
    setTimeout(() => this.successMsg = '', 4000);
  }
  showError(msg: string): void {
    this.errorMsg = msg; this.successMsg = '';
    setTimeout(() => this.errorMsg = '', 5000);
  }

  initRolesParDefaut(): void {
    this.roles = [
      this.creerRoleComplet(
        'ADMIN',
        this.translate.instant('ROLES.SYSTEM_ROLES.ADMIN_NAME'),
        this.translate.instant('ROLES.SYSTEM_ROLES.ADMIN_DESC'),
        '#f97316', 'shield', true, true
      ),
      this.creerRoleCommercial(),
      this.creerRoleComptable(),
      this.creerRoleMagasinier(),
      this.creerRoleAchats(),
    ];
    this.roleSelectionne = this.roles[0];
  }

  private creerRoleComplet(nom: string, label: string, desc: string, couleur: string, icone: string, estSysteme: boolean, toutAcces: boolean): Role {
    return {
      id: Math.random(),
      nom,
      description: desc,
      couleur,
      icone,
      estSysteme,
      modulePermissions: this.MODULES.map(m => ({
        module: m.module,
        label: m.label,
        icon: m.icon,
        permissions: { consulter: toutAcces, creer: toutAcces, modifier: toutAcces, supprimer: toutAcces, valider: toutAcces, exporter: toutAcces }
      }))
    };
  }

  private creerRoleCommercial(): Role {
    const permsParModule: Record<string, Partial<Permission>> = {
      dashboard:    { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      ventes:       { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: true,  exporter: true },
      factures:     { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: false, exporter: true },
      clients:      { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: false, exporter: true },
      fournisseurs: { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      achats:       { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      stock:        { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      comptabilite: { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      tresorerie:   { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      rapports:     { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      utilisateurs: { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      parametres:   { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
    };
    return this.buildRoleFromMap(
      'COMMERCIAL',
      this.translate.instant('ROLES.SYSTEM_ROLES.COMMERCIAL_NAME'),
      this.translate.instant('ROLES.SYSTEM_ROLES.COMMERCIAL_DESC'),
      '#3b82f6', 'storefront', true, permsParModule
    );
  }

  private creerRoleComptable(): Role {
    const permsParModule: Record<string, Partial<Permission>> = {
      dashboard:    { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      ventes:       { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      factures:     { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: true,  exporter: true },
      clients:      { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      fournisseurs: { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      achats:       { consulter: true, creer: false, modifier: false, supprimer: false, valider: true,  exporter: true },
      stock:        { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      comptabilite: { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: true,  exporter: true },
      tresorerie:   { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: true,  exporter: true },
      rapports:     { consulter: true, creer: true,  modifier: false, supprimer: false, valider: false, exporter: true },
      utilisateurs: { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      parametres:   { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
    };
    return this.buildRoleFromMap(
      'COMPTABLE',
      this.translate.instant('ROLES.SYSTEM_ROLES.COMPTABLE_NAME'),
      this.translate.instant('ROLES.SYSTEM_ROLES.COMPTABLE_DESC'),
      '#f59e0b', 'account_balance', true, permsParModule
    );
  }

  private creerRoleMagasinier(): Role {
    const permsParModule: Record<string, Partial<Permission>> = {
      dashboard:    { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      ventes:       { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      factures:     { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      clients:      { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      fournisseurs: { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      achats:       { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      stock:        { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: true,  exporter: true },
      comptabilite: { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      tresorerie:   { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      rapports:     { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      utilisateurs: { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      parametres:   { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
    };
    return this.buildRoleFromMap(
      'STOCK',
      this.translate.instant('ROLES.SYSTEM_ROLES.STOCK_NAME'),
      this.translate.instant('ROLES.SYSTEM_ROLES.STOCK_DESC'),
      '#10b981', 'inventory_2', true, permsParModule
    );
  }

  private creerRoleAchats(): Role {
    const permsParModule: Record<string, Partial<Permission>> = {
      dashboard:    { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      ventes:       { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      factures:     { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      clients:      { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      fournisseurs: { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: false, exporter: true },
      achats:       { consulter: true, creer: true,  modifier: true,  supprimer: false, valider: true,  exporter: true },
      stock:        { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      comptabilite: { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      tresorerie:   { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      rapports:     { consulter: true, creer: false, modifier: false, supprimer: false, valider: false, exporter: true },
      utilisateurs: { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
      parametres:   { consulter: false,creer: false, modifier: false, supprimer: false, valider: false, exporter: false },
    };
    return this.buildRoleFromMap(
      'ACHATS',
      this.translate.instant('ROLES.SYSTEM_ROLES.ACHATS_NAME'),
      this.translate.instant('ROLES.SYSTEM_ROLES.ACHATS_DESC'),
      '#8b5cf6', 'shopping_cart', true, permsParModule
    );
  }

  private buildRoleFromMap(nom: string, label: string, desc: string, couleur: string, icone: string, estSysteme: boolean, permsMap: Record<string, Partial<Permission>>): Role {
    return {
      id: Math.random(),
      nom,
      description: desc,
      couleur,
      icone,
      estSysteme,
      modulePermissions: this.MODULES.map(m => {
        const p = permsMap[m.module] || {};
        return {
          module: m.module, label: m.label, icon: m.icon,
          permissions: {
            consulter:  p.consulter  ?? false,
            creer:      p.creer      ?? false,
            modifier:   p.modifier   ?? false,
            supprimer:  p.supprimer  ?? false,
            valider:    p.valider    ?? false,
            exporter:   p.exporter   ?? false,
          }
        };
      })
    };
  }

  // ── CRUD Rôles ───────────────────────────────────────────────
  selectionnerRole(role: Role): void {
    this.roleSelectionne = role;
  }

  ouvrirCreerRole(): void {
    this.modeEdition = false;
    this.nouveauRole = {
      nom: '',
      description: '',
      couleur: '#3b82f6',
      icone: 'person',
      estSysteme: false,
      modulePermissions: this.MODULES.map(m => ({
        module: m.module, label: m.label, icon: m.icon,
        permissions: { consulter: false, creer: false, modifier: false, supprimer: false, valider: false, exporter: false }
      }))
    };
    this.showRoleModal = true;
  }

  ouvrirEditerRole(role: Role): void {
    this.modeEdition = true;
    this.nouveauRole = JSON.parse(JSON.stringify(role));
    this.showRoleModal = true;
  }

  sauvegarderRole(): void {
    if (!this.nouveauRole.nom?.trim()) {
      this.showError(this.translate.instant('ROLES.MODAL.NAME') + ' ' + this.translate.instant('COMMON.REQUIRED'));
      return;
    }
    if (this.modeEdition) {
      const idx = this.roles.findIndex(r => r.id === (this.nouveauRole as Role).id);
      if (idx >= 0) this.roles[idx] = this.nouveauRole as Role;
      this.showSuccess(this.translate.instant('ROLES.MSG.ROLE_UPDATED', { nom: this.nouveauRole.nom }));
    } else {
      const newRole: Role = { ...this.nouveauRole as Role, id: Math.random() };
      this.roles.push(newRole);
      this.roleSelectionne = newRole;
      this.showSuccess(this.translate.instant('ROLES.MSG.ROLE_CREATED', { nom: newRole.nom }));
    }
    this.sauvegarderMatrice();
    this.showRoleModal = false;
  }

  supprimerRole(role: Role): void {
    if (role.estSysteme) {
      this.showError(this.translate.instant('ROLES.CARDS.DELETE_SYSTEM_TIP'));
      return;
    }
    this.roles = this.roles.filter(r => r.id !== role.id);
    if (this.roleSelectionne?.id === role.id) {
      this.roleSelectionne = this.roles[0] || null;
    }
    this.sauvegarderMatrice();
    this.showSuccess(this.translate.instant('ROLES.MSG.ROLE_DELETED', { nom: role.nom }));
  }

  // ── Gestion des permissions dans la matrice ──────────────────
  toggleToutModule(mp: ModulePermission, activer: boolean): void {
    mp.permissions.consulter = activer;
    mp.permissions.creer     = activer;
    mp.permissions.modifier  = activer;
    mp.permissions.supprimer = activer;
    mp.permissions.valider   = activer;
    mp.permissions.exporter  = activer;
  }

  toggleToutePermission(key: keyof Permission, activer: boolean): void {
    if (!this.roleSelectionne) return;
    this.roleSelectionne.modulePermissions.forEach(mp => {
      mp.permissions[key] = activer;
    });
  }

  compterPermissions(role: Role): number {
    return role.modulePermissions.reduce((total, mp) =>
      total + Object.values(mp.permissions).filter(Boolean).length, 0
    );
  }

  totalPermissions(): number {
    return this.MODULES.length * 6;
  }

  toutModuleActif(mp: ModulePermission): boolean {
    return Object.values(mp.permissions).every(Boolean);
  }
}
