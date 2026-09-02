import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sa-entreprises',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sa-entreprises.component.html',
  styleUrls: ['./sa-entreprises.component.css']
})
export class SaEntreprisesComponent implements OnInit {

  private apiUrl = environment.apiUrl;

  entreprises: any[] = [];
  loading = true;
  successMsg = '';
  errorMsg = '';
  searchTerm = '';

  showCreateModal = false;
  creating = false;
  showPw = false;

  form: any = {
    nomEntreprise: '',
    nomUtilisateur: '',
    email: '',
    motDePasse: '',
    prenom: '',
    nom: ''
  };
  errors: any = {};

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/entreprises`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const raw = res.entreprises || res || [];
        // Normaliser les champs du backend vers le frontend
        this.entreprises = raw.map((e: any) => ({
          ...e,
          nomEntreprise: e.nomEntreprise || e.nom,
          schema: e.schema || e.schemaName
        }));
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Erreur lors du chargement.';
        this.loading = false;
      }
    });
  }

  get filteredEntreprises(): any[] {
    if (!this.searchTerm.trim()) return this.entreprises;
    const q = this.searchTerm.toLowerCase();
    return this.entreprises.filter(e =>
      e.nomEntreprise?.toLowerCase().includes(q) ||
      e.schema?.toLowerCase().includes(q) ||
      e.adminUsername?.toLowerCase().includes(q)
    );
  }

  ouvrirCreation(): void {
    this.form = { nomEntreprise: '', nomUtilisateur: '', email: '', motDePasse: '', prenom: '', nom: '' };
    this.errors = {};
    this.showCreateModal = true;
  }

  validerForm(): boolean {
    this.errors = {};
    if (!this.form.nomEntreprise.trim()) this.errors.nomEntreprise = 'Requis';
    if (!this.form.nomUtilisateur.trim()) this.errors.nomUtilisateur = 'Requis';
    if (!this.form.email.trim()) this.errors.email = 'Requis';
    if (!this.form.motDePasse || this.form.motDePasse.length < 6) this.errors.motDePasse = 'Min. 6 caractères';
    return Object.keys(this.errors).length === 0;
  }

  creerEntreprise(): void {
    if (!this.validerForm()) return;
    this.creating = true;
    this.errorMsg = '';
    // L'endpoint backend est /creer-avec-admin
    this.http.post<any>(`${this.apiUrl}/entreprises/creer-avec-admin`, this.form, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.successMsg = `✅ Entreprise "${this.form.nomEntreprise}" créée avec succès !`;
        this.showCreateModal = false;
        this.creating = false;
        this.charger();
        setTimeout(() => this.successMsg = '', 5000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Erreur lors de la création.';
        this.creating = false;
      }
    });
  }

  suspendre(id: number): void {
    if (!confirm('Suspendre cette entreprise ?')) return;
    this.http.put(`${this.apiUrl}/entreprises/${id}/suspendre`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.successMsg = 'Entreprise suspendue.'; this.charger(); setTimeout(() => this.successMsg = '', 4000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Erreur suspension.'; }
    });
  }

  activer(id: number): void {
    // L'endpoint backend est /reactiver (pas /activer)
    this.http.put(`${this.apiUrl}/entreprises/${id}/reactiver`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.successMsg = 'Entreprise réactivée.'; this.charger(); setTimeout(() => this.successMsg = '', 4000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Erreur activation.'; }
    });
  }

  supprimer(id: number, nom: string): void {
    if (!confirm(`Supprimer définitivement l'entreprise "${nom}" et toutes ses données ?`)) return;
    this.http.delete(`${this.apiUrl}/entreprises/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => { this.successMsg = 'Entreprise supprimée.'; this.charger(); setTimeout(() => this.successMsg = '', 4000); },
      error: (err) => { this.errorMsg = err.error?.message || 'Erreur suppression.'; }
    });
  }
}
