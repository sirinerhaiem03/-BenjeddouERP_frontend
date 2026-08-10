import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sa-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sa-audit.component.html',
  styleUrls: ['./sa-audit.component.css']
})
export class SaAuditComponent implements OnInit {
  private apiUrl = 'http://localhost:9090/api';

  logs: any[] = [];
  loading = true;
  searchTerm = '';
  filterAction = '';

  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;

  stats: any = { totalLogs: 0, logsCritiques: 0 };

  // Actions de l'enum AuditLog.ActionAudit côté backend
  actions = [
    'LOGIN_SUCCESS', 'LOGIN_ECHEC', 'LOGOUT', 'TOKEN_REFRESH', 'RATE_LIMIT_BLOQUE',
    'UTILISATEUR_CREE', 'UTILISATEUR_MODIFIE', 'UTILISATEUR_SUPPRIME',
    'ROLE_MODIFIE', 'STATUT_MODIFIE', 'TRIAL_RESET', 'MOT_DE_PASSE_CHANGE',
    'CALCUL_TAUX_UNIQUE', 'CALCUL_TAUX_VARIABLE', 'CALCUL_SUPPRIME',
    'DOCUMENT_EXPORTE', 'DOCUMENT_SUPPRIME', 'MODELE_CREE', 'MODELE_MODIFIE',
    'PERIODE_TAUX_CREE', 'PERIODE_TAUX_MODIFIEE', 'PERIODE_TAUX_SUPPRIMEE',
    'SESSION_REVOQUEE', 'COMPTE_BLOQUE'
  ];

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  ngOnInit(): void {
    this.charger();
    this.chargerStats();
  }

  charger(): void {
    this.loading = true;
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('size', this.pageSize.toString());

    if (this.searchTerm.trim()) params = params.set('q', this.searchTerm);
    if (this.filterAction) params = params.set('action', this.filterAction);

    this.http.get<any>(`${this.apiUrl}/audit/logs`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.logs = res.content || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.currentPage = res.currentPage || 0;
        this.loading = false;
      },
      error: () => {
        // Données démo si API non disponible
        this.logs = [
          { id: 1, action: 'LOGIN_SUCCESS', nomUtilisateur: 'superadmin', details: 'Connexion réussie', createdAt: new Date(), adresseIp: '127.0.0.1', resultat: 'SUCCES' },
          { id: 2, action: 'UTILISATEUR_CREE', nomUtilisateur: 'superadmin', details: 'Entreprise "Tech Corp" créée', createdAt: new Date(), adresseIp: '127.0.0.1', resultat: 'SUCCES' },
          { id: 3, action: 'LOGIN_ECHEC', nomUtilisateur: 'unknown', details: 'Tentative de connexion échouée', createdAt: new Date(), adresseIp: '192.168.1.1', resultat: 'ECHEC' },
          { id: 4, action: 'COMPTE_BLOQUE', nomUtilisateur: 'admin_xyz', details: 'Compte bloqué après 5 tentatives', createdAt: new Date(), adresseIp: '10.0.0.5', resultat: 'BLOQUE' },
        ];
        this.totalElements = this.logs.length;
        this.loading = false;
      }
    });
  }

  chargerStats(): void {
    this.http.get<any>(`${this.apiUrl}/audit/stats`, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.stats = res; },
      error: () => {}
    });
  }

  rechercherFiltrer(): void {
    this.currentPage = 0;
    this.charger();
  }

  goPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.currentPage = p;
    this.charger();
  }

  get filtered(): any[] {
    // Le filtrage est côté serveur, on retourne juste les logs reçus
    return this.logs;
  }

  getActionClass(action: string): string {
    if (['LOGIN_SUCCESS', 'UTILISATEUR_CREE', 'MODELE_CREE'].includes(action)) return 'sa-log-entry sa-log-success';
    if (['LOGIN_ECHEC', 'RATE_LIMIT_BLOQUE', 'COMPTE_BLOQUE'].includes(action)) return 'sa-log-entry sa-log-danger';
    if (['STATUT_MODIFIE', 'SESSION_REVOQUEE', 'UTILISATEUR_SUPPRIME', 'DOCUMENT_SUPPRIME'].includes(action)) return 'sa-log-entry sa-log-warning';
    return 'sa-log-entry sa-log-info';
  }

  getActionIcon(action: string): string {
    const icons: any = {
      'LOGIN_SUCCESS': 'login', 'LOGIN_ECHEC': 'no_encryption', 'LOGOUT': 'logout',
      'TOKEN_REFRESH': 'refresh', 'RATE_LIMIT_BLOQUE': 'block',
      'UTILISATEUR_CREE': 'person_add', 'UTILISATEUR_MODIFIE': 'manage_accounts',
      'UTILISATEUR_SUPPRIME': 'person_remove', 'ROLE_MODIFIE': 'admin_panel_settings',
      'STATUT_MODIFIE': 'toggle_on', 'TRIAL_RESET': 'restart_alt', 'MOT_DE_PASSE_CHANGE': 'key',
      'CALCUL_TAUX_UNIQUE': 'calculate', 'CALCUL_TAUX_VARIABLE': 'percent', 'CALCUL_SUPPRIME': 'delete',
      'DOCUMENT_EXPORTE': 'file_download', 'DOCUMENT_SUPPRIME': 'delete_forever',
      'MODELE_CREE': 'add_box', 'MODELE_MODIFIE': 'edit_document',
      'SESSION_REVOQUEE': 'logout', 'COMPTE_BLOQUE': 'lock'
    };
    return icons[action] || 'info';
  }

  getResultatClass(resultat: string): string {
    if (resultat === 'SUCCES') return 'sa-resultat-succes';
    if (resultat === 'ECHEC') return 'sa-resultat-echec';
    if (resultat === 'BLOQUE') return 'sa-resultat-bloque';
    return '';
  }
}
