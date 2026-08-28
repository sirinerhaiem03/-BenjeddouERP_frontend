import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

/**
 * AppPermissionDirective — Directive structurelle RBAC
 *
 * Masque un élément DOM si l'utilisateur n'a pas la permission requise.
 *
 * Usage : *appPermission="'action:module'"
 *
 * Exemples :
 *   <button *appPermission="'creer:ventes'">Nouveau devis</button>
 *   <button *appPermission="'supprimer:clients'">Supprimer</button>
 *   <button *appPermission="'modifier:stock'">Éditer</button>
 *   <button *appPermission="'exporter:factures'">Export PDF</button>
 *   <button *appPermission="'valider:ventes'">Valider</button>
 *
 * Si l'utilisateur est ADMIN ou SUPERADMIN, l'élément est toujours affiché.
 * Si le module n'a pas de config → mode permissif (élément affiché).
 */
@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class AppPermissionDirective implements OnInit {

  /** Format : 'action:module' — ex: 'creer:ventes', 'supprimer:clients' */
  @Input('appPermission') permissionKey!: string;

  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.applyPermission();
  }

  private applyPermission(): void {
    const canShow = this.evalPermission();

    if (canShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!canShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private evalPermission(): boolean {
    if (!this.permissionKey) return true;

    const parts = this.permissionKey.split(':');
    if (parts.length !== 2) {
      console.warn(`[AppPermissionDirective] Format invalide: "${this.permissionKey}". Attendu: "action:module"`);
      return true;
    }

    const [action, module] = parts;
    switch (action.toLowerCase().trim()) {
      case 'consulter': return this.permissionService.peutConsulter(module);
      case 'creer':     return this.permissionService.peutCreer(module);
      case 'modifier':  return this.permissionService.peutModifier(module);
      case 'supprimer': return this.permissionService.peutSupprimer(module);
      case 'valider':   return this.permissionService.peutValider(module);
      case 'exporter':  return this.permissionService.peutExporter(module);
      default:
        console.warn(`[AppPermissionDirective] Action inconnue: "${action}"`);
        return true;
    }
  }
}
