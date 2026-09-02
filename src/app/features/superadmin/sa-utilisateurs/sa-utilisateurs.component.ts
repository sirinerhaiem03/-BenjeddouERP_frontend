import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sa-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sa-utilisateurs.component.html',
  styleUrls: ['./sa-utilisateurs.component.css']
})
export class SaUtilisateursComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  utilisateurs: any[] = [];
  loading = true;
  searchTerm = '';
  filterRole = '';
  filterStatut = '';
  successMsg = '';
  errorMsg = '';

  roles = ['SUPERADMIN', 'ADMIN', 'COMMERCIAL', 'COMPTABLE', 'STOCK', 'CLIENT', 'USER'];

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/superadmin/utilisateurs`, { headers: this.getHeaders() }).subscribe({
      next: (data) => { this.utilisateurs = data || []; this.loading = false; },
      error: () => { this.loading = false; this.errorMsg = 'Erreur chargement utilisateurs.'; }
    });
  }

  get filtered(): any[] {
    return this.utilisateurs.filter(u => {
      const q = this.searchTerm.toLowerCase();
      const matchSearch = !q || u.nomUtilisateur?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.nom?.toLowerCase().includes(q);
      const matchRole = !this.filterRole || u.role === this.filterRole;
      const matchStatut = !this.filterStatut || u.statutCompte === this.filterStatut || u.statut === this.filterStatut;
      return matchSearch && matchRole && matchStatut;
    });
  }

  toggleActif(u: any): void {
    const action = u.actif ? 'desactiver' : 'activer';
    this.http.put(`${this.apiUrl}/superadmin/utilisateurs/${u.id}/${action}`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { u.actif = !u.actif; this.successMsg = `Utilisateur ${action}é.`; setTimeout(() => this.successMsg = '', 4000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Erreur action.'; }
    });
  }

  getInitials(u: any): string {
    return ((u.prenom?.[0] || '') + (u.nom?.[0] || '')).toUpperCase() || u.nomUtilisateur?.[0]?.toUpperCase() || 'U';
  }

  getRoleBadge(role: string): string {
    const map: any = {
      'SUPERADMIN': 'sa-role-superadmin',
      'ADMIN': 'sa-role-admin',
      'COMMERCIAL': 'sa-role-commercial',
      'COMPTABLE': 'sa-role-comptable',
      'STOCK': 'sa-role-stock',
      'CLIENT': 'sa-role-client',
      'USER': 'sa-role-user'
    };
    return map[role] || '';
  }
}
