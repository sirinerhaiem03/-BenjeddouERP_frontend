import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-superadmin-entreprises',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-entreprises.component.html',
  styleUrls: ['./superadmin-entreprises.component.css']
})
export class SuperadminEntreprisesComponent implements OnInit {

  private apiUrl = `${environment.apiUrl}/entreprises`;

  entreprises: any[]     = [];
  adminsMap: any         = {};   // { adminId: 'nomUtilisateur' }
  loading                = true;
  successMsg             = '';
  errorMsg               = '';

  showCreateModal        = false;
  creating               = false;
  showPw                 = false;

  form: any = {
    nomEntreprise  : '',
    nomUtilisateur : '',
    email          : '',
    motDePasse     : '',
    prenom         : '',
    nom            : ''
  };
  errors: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.charger();
  }

  // ─── Chargement ────────────────────────────────────────────────────
  charger(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}`).subscribe({
      next: (res) => {
        this.entreprises = res.entreprises || [];
        this.chargerAdmins();
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Erreur lors du chargement des entreprises.';
        this.loading = false;
      }
    });
  }

  chargerAdmins(): void {
    // Pour afficher le nom de l'admin dans le tableau
    this.http.get<any[]>(`${environment.apiUrl}/admin/users`).subscribe({
      next: (users) => {
        users.forEach(u => this.adminsMap[u.id] = u.nomUtilisateur);
      },
      error: () => {}
    });
  }

  // ─── Comptage par statut ───────────────────────────────────────────
  compterParStatut(statut: string): number {
    return this.entreprises.filter(e => e.statut === statut).length;
  }

  // ─── Modal ────────────────────────────────────────────────────────
  ouvrirCreer(): void {
    this.form = { nomEntreprise: '', nomUtilisateur: '', email: '', motDePasse: '', prenom: '', nom: '' };
    this.errors = {};
    this.errorMsg = '';
    this.successMsg = '';
    this.showCreateModal = true;
  }

  fermerModal(): void {
    if (!this.creating) this.showCreateModal = false;
  }

  // ─── Créer entreprise + admin ──────────────────────────────────────
  creerEntrepriseAvecAdmin(): void {
    this.errors = {};

    // Validation locale
    if (!this.form.nomEntreprise?.trim())  this.errors.nomEntreprise  = 'Nom de l\'entreprise obligatoire';
    if (!this.form.nomUtilisateur?.trim()) this.errors.nomUtilisateur = 'Nom d\'utilisateur obligatoire';
    if (!this.form.email?.trim())          this.errors.email          = 'Email obligatoire';
    if (!this.form.motDePasse || this.form.motDePasse.length < 6)
                                           this.errors.motDePasse     = 'Mot de passe min. 6 caractères';
    if (!this.form.prenom?.trim())         this.errors.prenom         = 'Prénom obligatoire';
    if (!this.form.nom?.trim())            this.errors.nom            = 'Nom obligatoire';

    if (Object.keys(this.errors).length > 0) return;

    this.creating = true;

    this.http.post<any>(`${this.apiUrl}/creer-avec-admin`, this.form).subscribe({
      next: (res) => {
        this.creating = false;
        this.showCreateModal = false;
        this.successMsg = `✅ Entreprise "${res.entreprise?.nom}" créée ! Admin: ${res.admin?.nomUtilisateur} → Base: ${res.entreprise?.schemaName}`;
        this.charger();
        setTimeout(() => this.successMsg = '', 8000);
      },
      error: (err) => {
        this.creating = false;
        this.errorMsg = err.error?.message || 'Erreur lors de la création de l\'entreprise.';
        setTimeout(() => this.errorMsg = '', 6000);
      }
    });
  }

  // ─── Suspendre ────────────────────────────────────────────────────
  suspendre(e: any): void {
    if (!confirm(`Suspendre "${e.nom}" ? L'admin ne pourra plus se connecter.`)) return;
    this.http.put(`${this.apiUrl}/${e.id}/suspendre`, {}).subscribe({
      next: () => {
        e.statut = 'SUSPENDUE';
        this.successMsg = `Entreprise "${e.nom}" suspendue.`;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: () => this.showError('Erreur lors de la suspension.')
    });
  }

  // ─── Réactiver ────────────────────────────────────────────────────
  reactiver(e: any): void {
    this.http.put(`${this.apiUrl}/${e.id}/reactiver`, {}).subscribe({
      next: () => {
        e.statut = 'ACTIVE';
        this.successMsg = `Entreprise "${e.nom}" réactivée.`;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: () => this.showError('Erreur lors de la réactivation.')
    });
  }

  showError(msg: string): void {
    this.errorMsg = msg;
    setTimeout(() => this.errorMsg = '', 5000);
  }
}
