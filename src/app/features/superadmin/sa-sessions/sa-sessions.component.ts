import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface SessionActive {
  id: number;
  statut: string;
  adresseIp: string;
  typeAppareil: string;
  os: string;
  navigateur: string;
  resolution: string;
  langue: string;
  fuseauHoraire: string;
  pays: string;
  ville: string;
  dateConnexion: string;
  dateDeconnexion?: string;
  motifRevocation?: string;
  estSignale?: boolean;
  dateSignalement?: string;
  utilisateurId?: number;
  nomUtilisateur: string;
  email: string;
  role: string;
  entrepriseSchema: string;
  statutCompte?: string;
  appareilConnu?: boolean;      // true = appareil déjà vu pour cet utilisateur
  fingerprintCourt?: string;    // 8 premiers chars du hash SHA-256
  // ─ Nouveau : Type de réseau, Risque, Localisation complète ─
  typeReseau?: string;           // Wi-Fi / 4G / Ethernet / Inconnu
  niveauRisque?: number;         // Score 0–100
  connexionInhabituelle?: boolean; // true = alerte détectée
  region?: string;
  latitude?: number;
  longitude?: number;
  fournisseurInternet?: string;
}

interface StatsSession {
  sessionsActives: number;
  sessionsTerminees: number;
  sessionsRevoquees: number;
  totalConnexions: number;
  signalements: number;
}

@Component({
  selector: 'app-sa-sessions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './sa-sessions.component.html',
  styleUrls: ['./sa-sessions.component.css']
})
export class SaSessionsComponent implements OnInit, OnDestroy {
  loading = true;
  loadingHisto = false;
  loadingSignal = false;

  // Onglet actif
  ongletActif: 'actives' | 'historique' | 'signalements' = 'actives';

  sessions: SessionActive[] = [];
  sessionsFiltrees: SessionActive[] = [];
  historique: SessionActive[] = [];
  historiqueFiltres: SessionActive[] = [];
  signalements: SessionActive[] = [];

  stats: StatsSession = { sessionsActives: 0, sessionsTerminees: 0, sessionsRevoquees: 0, totalConnexions: 0, signalements: 0 };

  // Filtres sessions actives
  filtreRecherche = '';
  filtreAppareil = '';

  // Filtres historique
  filtreHistoRecherche = '';
  filtreHistoStatut = '';

  // Blocage IP
  ipABloquer = '';
  blocageEnCours = false;

  // Confirmation modale déconnexion
  sessionADeconnecter: SessionActive | null = null;
  motifDeconnexion = 'Déconnexion forcée par SuperAdmin';
  deconnexionEnCours = false;

  // Confirmation modale déverrouillage
  utilisateurADeverrouiller: SessionActive | null = null;
  deverrouillageEnCours = false;

  messageSucces = '';
  messageErreur = '';

  // Auto-rafraîchissement toutes les 30s
  private refreshInterval: any;

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  ngOnInit(): void {
    this.chargerTout();
    this.refreshInterval = setInterval(() => {
      if (this.ongletActif === 'actives') this.chargerTout();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  changerOnglet(onglet: 'actives' | 'historique' | 'signalements'): void {
    this.ongletActif = onglet;
    this.messageSucces = '';
    this.messageErreur = '';
    if (onglet === 'historique' && this.historique.length === 0) this.chargerHistorique();
    if (onglet === 'signalements' && this.signalements.length === 0) this.chargerSignalements();
  }

  chargerTout(): void {
    this.loading = true;
    this.messageSucces = '';
    this.messageErreur = '';

    this.http.get<SessionActive[]>(`${this.apiUrl}/superadmin/sessions`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => { this.sessions = data || []; this.appliquerFiltres(); this.loading = false; },
        error: () => {
          this.sessions = [
            { id: 1, statut: 'ACTIVE', adresseIp: '127.0.0.1', typeAppareil: 'PC', os: 'Windows 11',
              navigateur: 'Chrome 125', resolution: '1920x1080', langue: 'fr-TN', fuseauHoraire: 'Africa/Tunis',
              pays: 'Tunisie', ville: 'Tunis', dateConnexion: new Date().toISOString(),
              nomUtilisateur: 'admin', email: 'admin@demo.tn', role: 'ADMIN', entrepriseSchema: 'erp_ent_00001' }
          ];
          this.appliquerFiltres(); this.loading = false;
        }
      });

    this.http.get<StatsSession>(`${this.apiUrl}/superadmin/sessions/stats`, { headers: this.getHeaders() })
      .subscribe({
        next: (s) => this.stats = s,
        error: () => this.stats = { sessionsActives: 1, sessionsTerminees: 8, sessionsRevoquees: 2, totalConnexions: 11, signalements: 1 }
      });
  }

  chargerHistorique(): void {
    this.loadingHisto = true;
    this.http.get<SessionActive[]>(`${this.apiUrl}/superadmin/sessions/historique`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => { this.historique = data || []; this.appliquerFiltresHisto(); this.loadingHisto = false; },
        error: () => { this.historique = []; this.loadingHisto = false; }
      });
  }

  chargerSignalements(): void {
    this.loadingSignal = true;
    this.http.get<SessionActive[]>(`${this.apiUrl}/superadmin/sessions/signalements`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => { this.signalements = data || []; this.loadingSignal = false; },
        error: () => { this.signalements = []; this.loadingSignal = false; }
      });
  }

  appliquerFiltres(): void {
    let result = [...this.sessions];
    if (this.filtreRecherche) {
      const q = this.filtreRecherche.toLowerCase();
      result = result.filter(s =>
        (s.nomUtilisateur || '').toLowerCase().includes(q) ||
        (s.adresseIp || '').includes(q) ||
        (s.entrepriseSchema || '').toLowerCase().includes(q) ||
        (s.pays || '').toLowerCase().includes(q)
      );
    }
    if (this.filtreAppareil) result = result.filter(s => s.typeAppareil === this.filtreAppareil);
    this.sessionsFiltrees = result;
  }

  appliquerFiltresHisto(): void {
    let result = [...this.historique];
    if (this.filtreHistoRecherche) {
      const q = this.filtreHistoRecherche.toLowerCase();
      result = result.filter(s =>
        (s.nomUtilisateur || '').toLowerCase().includes(q) ||
        (s.adresseIp || '').includes(q)
      );
    }
    if (this.filtreHistoStatut) result = result.filter(s => s.statut === this.filtreHistoStatut);
    this.historiqueFiltres = result;
  }

  // ── Actions modales ──────────────────────────────────────────────
  ouvrirModaleDeconnexion(session: SessionActive): void {
    this.sessionADeconnecter = session;
    this.motifDeconnexion = 'Déconnexion forcée par SuperAdmin';
    this.messageSucces = ''; this.messageErreur = '';
  }

  fermerModale(): void {
    this.sessionADeconnecter = null;
    this.utilisateurADeverrouiller = null;
    this.deconnexionEnCours = false;
    this.deverrouillageEnCours = false;
  }

  confirmerDeconnexion(): void {
    if (!this.sessionADeconnecter) return;
    this.deconnexionEnCours = true;
    this.http.post<any>(
      `${this.apiUrl}/superadmin/sessions/${this.sessionADeconnecter.id}/deconnecter`,
      { motif: this.motifDeconnexion },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.messageSucces = `✅ Session de ${this.sessionADeconnecter!.nomUtilisateur} révoquée avec succès.`;
        this.fermerModale();
        setTimeout(() => this.chargerTout(), 500);
      },
      error: (err) => { this.messageErreur = err.error?.message || 'Erreur lors de la révocation.'; this.deconnexionEnCours = false; }
    });
  }

  ouvrirModaleDeverrouillage(s: SessionActive): void {
    this.utilisateurADeverrouiller = s;
    this.messageSucces = ''; this.messageErreur = '';
  }

  confirmerDeverrouillage(): void {
    if (!this.utilisateurADeverrouiller?.utilisateurId) return;
    this.deverrouillageEnCours = true;
    this.http.post<any>(
      `${this.apiUrl}/superadmin/utilisateurs/${this.utilisateurADeverrouiller.utilisateurId}/deverrouiller`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.messageSucces = `✅ Compte de ${this.utilisateurADeverrouiller!.nomUtilisateur} déverrouillé.`;
        this.fermerModale();
        this.chargerSignalements();
        this.chargerTout();
      },
      error: (err) => { this.messageErreur = err.error?.message || 'Erreur.'; this.deverrouillageEnCours = false; }
    });
  }

  bloquerIP(): void {
    if (!this.ipABloquer.trim()) return;
    this.blocageEnCours = true;
    this.http.post<any>(
      `${this.apiUrl}/superadmin/sessions/bloquer-ip`,
      { ip: this.ipABloquer.trim() },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.messageSucces = `✅ ${res.message}`;
        this.ipABloquer = '';
        this.blocageEnCours = false;
        this.chargerTout();
      },
      error: (err) => { this.messageErreur = err.error?.error || 'Erreur blocage IP.'; this.blocageEnCours = false; }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getAppareilIcon(type: string): string {
    if (type === 'Mobile') return 'smartphone';
    if (type === 'Tablette') return 'tablet';
    return 'computer';
  }

  getRoleClass(role: string): string {
    if (role === 'ADMIN') return 'badge-admin';
    if (role === 'COMMERCIAL') return 'badge-commercial';
    if (role === 'COMPTABLE') return 'badge-comptable';
    if (role === 'STOCK') return 'badge-stock';
    return 'badge-default';
  }

  getStatutClass(statut: string): string {
    if (statut === 'ACTIVE') return 'statut-active';
    if (statut === 'REVOQUEE') return 'statut-revoquee';
    if (statut === 'TERMINEE') return 'statut-terminee';
    return 'statut-default';
  }

  dureeSession(dateConnexion: string): string {
    const diff = Date.now() - new Date(dateConnexion).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60}min`;
  }

  getNetworkIcon(type: string | undefined): string {
    if (!type) return 'device_hub';
    if (type === 'Wi-Fi') return 'wifi';
    if (type.includes('4G') || type.includes('5G')) return 'signal_cellular_4_bar';
    if (type === 'Ethernet') return 'settings_ethernet';
    return 'device_hub';
  }
}
