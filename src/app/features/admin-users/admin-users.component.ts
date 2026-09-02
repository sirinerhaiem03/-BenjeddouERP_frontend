import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { ExportService } from '../../core/services/export.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/admin`;

  users: any[] = [];
  loading = true;
  successMsg = '';
  errorMsg = '';

  // Modal historique connexions
  showHistorique = false;
  historiqueUser: any = null;
  connexions: any[] = [];
  historiqueLoading = false;

  // Modal trial config
  showTrialModal = false;
  trialUser: any = null;
  trialNbMax = 30;

  // Modal créer utilisateur
  showCreateModal = false;
  creatingUser    = false;
  showPassword    = false;
  newUser: any    = {};
  createErrors: any = {};

  constructor(private http: HttpClient, private exportService: ExportService) {}

  ngOnInit(): void {
    this.chargerUtilisateurs();
  }

  chargerUtilisateurs(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/users`).subscribe({
      next: (data: any[]) => {
        this.users = data;
        this.loading = false;
      },
      error: (_err: any) => {
        this.errorMsg = 'Erreur lors du chargement des utilisateurs.';
        this.loading = false;
      }
    });
  }

  changerStatut(user: any, statut: string): void {
    const params = new HttpParams().set('statut', statut);
    this.http.put(`${this.apiUrl}/users/${user.id}/statut`, null, { params }).subscribe({
      next: (_res: any) => {
        user.statutCompte = statut;
        this.showSuccess(`Statut de ${user.nomUtilisateur} → ${statut}`);
      },
      error: (_err: any) => this.showError('Erreur lors du changement de statut.')
    });
  }

  // ── Trial Modal ────────────────────────────────────────────────
  ouvrirTrialModal(user: any): void {
    this.trialUser = user;
    this.trialNbMax = user.nbUtilisationsMax || 30;
    this.showTrialModal = true;
  }

  activerTrial(): void {
    if (!this.trialUser) return;
    const params = new HttpParams()
      .set('activer', 'true')
      .set('nbMax', String(this.trialNbMax));
    this.http.put(`${this.apiUrl}/users/${this.trialUser.id}/trial`, null, { params }).subscribe({
      next: (_res: any) => {
        this.trialUser.modeTrial = true;
        this.trialUser.nbUtilisations = 0;
        this.trialUser.nbUtilisationsMax = this.trialNbMax;
        this.trialUser.utilisationsRestantes = this.trialNbMax;
        this.showTrialModal = false;
        this.showSuccess(`Mode trial activé pour ${this.trialUser.nomUtilisateur} (${this.trialNbMax} utilisations).`);
      },
      error: (_err: any) => this.showError('Erreur activation trial.')
    });
  }

  desactiverTrial(user: any): void {
    const params = new HttpParams().set('activer', 'false');
    this.http.put(`${this.apiUrl}/users/${user.id}/trial`, null, { params }).subscribe({
      next: (_res: any) => {
        user.modeTrial = false;
        this.showSuccess(`Mode trial désactivé pour ${user.nomUtilisateur}.`);
      },
      error: (_err: any) => this.showError('Erreur désactivation trial.')
    });
  }

  resetCompteur(user: any): void {
    this.http.put(`${this.apiUrl}/users/${user.id}/trial/reset`, null).subscribe({
      next: (_res: any) => {
        user.nbUtilisations = 0;
        user.utilisationsRestantes = user.nbUtilisationsMax;
        this.showSuccess(`Compteur remis à 0 pour ${user.nomUtilisateur}.`);
      },
      error: (_err: any) => this.showError('Erreur reset compteur.')
    });
  }

  // ── Créer un utilisateur ───────────────────────────────────────
  ouvrirCreerUser(): void {
    this.newUser = { prenom: '', nom: '', nomUtilisateur: '', email: '', motDePasse: '', role: 'COMMERCIAL' };
    this.createErrors = {};
    this.showPassword = false;
    this.showCreateModal = true;
  }

  creerUtilisateur(): void {
    this.createErrors = {};
    let valid = true;
    if (!this.newUser.nomUtilisateur?.trim()) {
      this.createErrors.nomUtilisateur = 'Le nom d\'utilisateur est obligatoire.';
      valid = false;
    }
    if (!this.newUser.email?.trim() || !this.newUser.email.includes('@')) {
      this.createErrors.email = 'Adresse email invalide.';
      valid = false;
    }
    if (!this.newUser.motDePasse || this.newUser.motDePasse.length < 6) {
      this.createErrors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères.';
      valid = false;
    }
    if (!valid) return;

    this.creatingUser = true;
    this.http.post(`${this.apiUrl}/users`, this.newUser).subscribe({
      next: (_res: any) => {
        this.creatingUser = false;
        this.showCreateModal = false;
        this.showSuccess(`Compte créé : ${this.newUser.nomUtilisateur} (${this.newUser.role})`);
        this.chargerUtilisateurs();
      },
      error: (err: any) => {
        this.creatingUser = false;
        this.showError(err?.error?.message || 'Erreur lors de la création du compte.');
      }
    });
  }

  // ── Supprimer un utilisateur ───────────────────────────────────
  supprimerUser(user: any): void {
    if (user.role === 'ADMIN') {
      this.showError('Impossible de supprimer un compte Administrateur.');
      return;
    }
    if (!confirm(`Supprimer le compte "${user.nomUtilisateur}" ?\nCette action est irréversible.`)) return;

    this.http.delete(`${this.apiUrl}/users/${user.id}`, { responseType: 'json' }).subscribe({
      next: (_res: any) => {
        // Mise à jour locale immédiate
        this.users = this.users.filter((u: any) => u.id !== user.id);
        this.showSuccess(`Compte "${user.nomUtilisateur}" supprimé avec succès.`);
      },
      error: (err: any) => {
        // Afficher le message précis du backend
        const msg = err?.error?.message || err?.message || 'Erreur lors de la suppression. Vérifiez que le backend est démarré.';
        this.showError(msg);
        // Recharger la liste pour être sûr de l'état réel
        this.chargerUtilisateurs();
      }
    });
  }


  // ── Historique connexions ──────────────────────────────────────
  voirHistorique(user: any): void {
    this.historiqueUser = user;
    this.showHistorique = true;
    this.historiqueLoading = true;
    this.connexions = [];
    this.http.get<any[]>(`${this.apiUrl}/users/${user.id}/connexions`).subscribe({
      next: (data: any[]) => {
        this.connexions = data;
        this.historiqueLoading = false;
      },
      error: (_err: any) => {
        this.historiqueLoading = false;
        this.showError("Erreur lors du chargement de l'historique.");
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'ACTIF':      return 'badge-actif';
      case 'VALIDE':     return 'badge-valide';
      case 'EN_ATTENTE': return 'badge-attente';
      case 'REFUSE':     return 'badge-refuse';
      default:           return 'badge-attente';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'ACTIF':      return '✅ Actif';
      case 'VALIDE':     return '🔵 Validé';
      case 'EN_ATTENTE': return '⏳ En attente';
      case 'REFUSE':     return '❌ Refusé';
      default:           return statut;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR') + ' à ' +
           d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  parseBrowser(ua: string): string {
    if (!ua || ua === 'inconnu') return '🌐 Inconnu';
    // Détecter le navigateur depuis le User-Agent
    if (ua.includes('Edg/') || ua.includes('Edge/'))      return '🔵 Microsoft Edge';
    if (ua.includes('OPR/') || ua.includes('Opera/'))      return '🔴 Opera';
    if (ua.includes('YaBrowser/'))                         return '🟡 Yandex Browser';
    if (ua.includes('Chrome/') && !ua.includes('Chromium')) return '🟢 Google Chrome';
    if (ua.includes('Chromium/'))                          return '🔵 Chromium';
    if (ua.includes('Firefox/'))                           return '🦊 Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return '🧭 Safari';
    if (ua.includes('MSIE') || ua.includes('Trident/'))    return '🔵 Internet Explorer';
    return '🌐 Navigateur inconnu';
  }

  parseOS(ua: string): string {
    if (!ua || ua === 'inconnu') return '';
    if (ua.includes('Windows NT 10'))  return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';
    if (ua.includes('Mac OS X'))       return 'macOS';
    if (ua.includes('Linux'))          return 'Linux';
    if (ua.includes('Android'))        return 'Android';
    if (ua.includes('iPhone'))         return 'iPhone';
    return '';
  }

  getTrialPercent(user: any): number {
    if (!user.nbUtilisationsMax) return 0;
    return Math.round((user.nbUtilisations / user.nbUtilisationsMax) * 100);
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    this.errorMsg = '';
    setTimeout(() => this.successMsg = '', 4000);
  }

  private showError(msg: string): void {
    this.errorMsg = msg;
    this.successMsg = '';
    setTimeout(() => this.errorMsg = '', 4000);
  }

  // ── EXPORTS ──────────────────────────────────
  private get _userCols(): string[] {
    return ['N°', 'Prénom', 'Nom', 'Email', 'Rôle', 'Mode Trial', 'Actif'];
  }
  private get _userRows(): (string|number)[][] {
    return this.users.map((u, i) => [
      i+1,
      u.prenom ?? '—',
      u.nom ?? '—',
      u.email ?? '—',
      (u.roles ?? []).join(', ') || '—',
      u.modeTrial ? 'Oui' : 'Non',
      u.actif !== false ? 'Oui' : 'Non'
    ]);
  }
  exportUsersCSV():  void { this.exportService.exportToCSV(this._userCols, this._userRows, `utilisateurs-${new Date().toISOString().slice(0,10)}`); }
  exportUsersPDF():  void { this.exportService.exportTableToPDF(this._userCols, this._userRows, 'Utilisateurs — BENJEDDOU ERP', `utilisateurs-${new Date().toISOString().slice(0,10)}`, `${this.users.length} utilisateur(s)`); }
  exportUsersWord(): void { this.exportService.exportTableToWord(this._userCols, this._userRows, 'Utilisateurs — BENJEDDOU ERP', `utilisateurs-${new Date().toISOString().slice(0,10)}`); }
  printUsers():      void { this.exportService.printElement('users-table', 'Utilisateurs — BENJEDDOU ERP'); }
}
