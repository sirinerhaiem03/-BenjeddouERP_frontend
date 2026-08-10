import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.css']
})
export class SuperadminDashboardComponent implements OnInit {
  loading = true;

  stats = {
    totalEntreprises: 0,
    entreprisesActives: 0,
    entreprisesSuspendues: 0,
    totalUtilisateurs: 0,
    logsCritiques24h: 0,
    abonnementsActifs: 0
  };

  entreprisesRecentes: any[] = [];
  logsRecents: any[] = [];
  today = new Date();

  private apiUrl = 'http://localhost:9090/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  ngOnInit(): void {
    this.chargerTout();
  }

  chargerTout(): void {
    this.loading = true;

    // Charger stats globales et entreprises en parallèle
    forkJoin({
      stats: this.http.get<any>(`${this.apiUrl}/superadmin/stats`, { headers: this.getHeaders() }),
      entreprises: this.http.get<any[]>(`${this.apiUrl}/superadmin/entreprises`, { headers: this.getHeaders() }),
      audit: this.http.get<any>(`${this.apiUrl}/superadmin/audit`, { headers: this.getHeaders() })
    }).subscribe({
      next: ({ stats, entreprises, audit }) => {
        // Stats depuis l'endpoint dédié
        this.stats.totalEntreprises = stats.totalEntreprises || 0;
        this.stats.entreprisesActives = stats.entreprisesActives || 0;
        this.stats.entreprisesSuspendues = stats.entreprisesSuspendues || 0;
        this.stats.totalUtilisateurs = stats.totalUtilisateurs || 0;
        this.stats.logsCritiques24h = stats.logsCritiques24h || 0;

        // Entreprises récentes (5 dernières)
        this.entreprisesRecentes = (entreprises || []).slice(-5).reverse().map((e: any) => ({
          ...e,
          nomEntreprise: e.nomEntreprise || e.nom,
          schema: e.schema || e.schemaName
        }));

        // Logs récents
        this.logsRecents = (audit.content || []).slice(0, 5);
        this.loading = false;
      },
      error: () => {
        // Données de démo si l'API n'est pas prête
        this.stats = {
          totalEntreprises: 12,
          entreprisesActives: 9,
          entreprisesSuspendues: 3,
          totalUtilisateurs: 87,
          logsCritiques24h: 4,
          abonnementsActifs: 8
        };
        this.entreprisesRecentes = [
          { nomEntreprise: 'Tech Solutions SAS', statut: 'ACTIVE', dateCreation: new Date(), schema: 'erp_ent_00001' },
          { nomEntreprise: 'Commerce Plus SARL', statut: 'ACTIVE', dateCreation: new Date(), schema: 'erp_ent_00002' },
          { nomEntreprise: 'Import Export EURL', statut: 'SUSPENDUE', dateCreation: new Date(), schema: 'erp_ent_00003' },
        ];
        this.logsRecents = [
          { action: 'LOGIN_SUCCESS', nomUtilisateur: 'admin_tech', createdAt: new Date(), adresseIp: '127.0.0.1' },
          { action: 'UTILISATEUR_CREE', nomUtilisateur: 'superadmin', createdAt: new Date(), adresseIp: '127.0.0.1' },
          { action: 'LOGIN_ECHEC', nomUtilisateur: 'unknown', createdAt: new Date(), adresseIp: '192.168.1.1' },
        ];
        this.loading = false;
      }
    });
  }

  getLogClass(action: string): string {
    if (['LOGIN_SUCCESS', 'UTILISATEUR_CREE'].includes(action)) return 'sa-log-success';
    if (['LOGIN_ECHEC', 'RATE_LIMIT_BLOQUE', 'COMPTE_BLOQUE'].includes(action)) return 'sa-log-danger';
    if (['STATUT_MODIFIE', 'SESSION_REVOQUEE'].includes(action)) return 'sa-log-warning';
    return 'sa-log-info';
  }
}
