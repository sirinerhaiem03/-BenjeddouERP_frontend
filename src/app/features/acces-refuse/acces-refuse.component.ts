import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const MODULE_LABELS: Record<string, string> = {
  dashboard:    'Tableau de Bord',
  ventes:       'Gestion Commerciale',
  stock:        'Stock & Inventaire',
  achats:       'Achats',
  comptabilite: 'Finance & Comptabilité',
  utilisateurs: 'Administration des Utilisateurs',
  parametres:   'Paramètres & Audit',
  documents:    'Gestion Documentaire',
};

@Component({
  selector: 'app-acces-refuse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acces-refuse.component.html',
  styleUrls: ['./acces-refuse.component.css'],
})
export class AccesRefuseComponent implements OnInit {
  moduleLabel  = 'ce module';
  roleLabel    = 'votre rôle';
  nomUtilisateur = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const module = this.route.snapshot.queryParamMap.get('module') || '';
    this.moduleLabel = MODULE_LABELS[module] || module || 'ce module';

    const user = this.authService.getCurrentUser();
    this.nomUtilisateur = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : 'Utilisateur';

    const roles: string[] = user?.roles || [];
    const r = roles[0] || '';
    const labels: Record<string, string> = {
      ROLE_COMMERCIAL: 'Commercial',
      ROLE_COMPTABLE:  'Comptable',
      ROLE_STOCK:      'Gestionnaire Stock',
      ROLE_ACHAT:      'Responsable Achats',
      ROLE_CLIENT:     'Client',
    };
    this.roleLabel = labels[r] || r.replace('ROLE_', '') || 'votre rôle';
  }

  retourAccueil(): void {
    this.router.navigate(['/dashboard/home']);
  }
}
