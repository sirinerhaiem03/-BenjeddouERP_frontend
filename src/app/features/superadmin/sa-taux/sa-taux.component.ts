import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

export interface PeriodeTaux {
  id: number;
  dateDebut: string;
  dateFin: string;
  taux: number;
  libelle: string;
  actif: boolean;
  dateCreation: string;
  dateModification: string;
}

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sa-taux',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sa-taux.component.html',
  styleUrls: ['./sa-taux.component.css']
})
export class SaTauxComponent implements OnInit {

  private apiUrl = 'http://localhost:9090/api/periodes-taux';

  // ── Données ──
  periodes: PeriodeTaux[] = [];
  periodesFiltrees: PeriodeTaux[] = [];
  loading = true;
  searchTerm = '';
  filtreStatut = 'tous';

  // ── Alertes ──
  successMsg = '';
  errorMsg = '';

  // ── Stats ──
  get totalPeriodes() { return this.periodes.length; }
  get totalActives()  { return this.periodes.filter(p => p.actif).length; }
  get totalInactives(){ return this.periodes.filter(p => !p.actif).length; }
  get tauxMoyen()     {
    const actives = this.periodes.filter(p => p.actif);
    if (!actives.length) return 0;
    return actives.reduce((s, p) => s + Number(p.taux), 0) / actives.length;
  }

  // ── Modal Créer/Modifier ──
  showModal = false;
  modeEdition = false;
  saving = false;
  periodeEnEdition: PeriodeTaux | null = null;

  form: any = {
    libelle: '',
    dateDebut: '',
    dateFin: '',
    taux: '',
    actif: true
  };
  formErrors: any = {};

  // ── Modal Suppression ──
  showDeleteModal = false;
  periodeASupprimer: PeriodeTaux | null = null;
  suppression = false;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.authService.getToken() });
  }

  ngOnInit(): void {
    this.charger();
  }

  // ── LECTURE ──────────────────────────────────────────────────────────────

  charger(): void {
    this.loading = true;
    this.errorMsg = '';
    this.http.get<PeriodeTaux[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.periodes = data;
        this.appliquerFiltres();
        this.loading = false;
      },
      error: (err) => {
        console.error('[SaTaux] Erreur GET periodes-taux:', err);
        const status = err.status || 0;
        if (status === 0) {
          this.errorMsg = '❌ Serveur injoignable — le backend (port 9090) ne répond pas. Vérifiez que Spring Boot est démarré.';
        } else if (status === 401) {
          this.errorMsg = '❌ Session expirée (401) — veuillez vous reconnecter en tant que SuperAdmin.';
        } else if (status === 403) {
          this.errorMsg = '❌ Accès refusé (403) — vous devez être connecté avec le rôle SUPERADMIN.';
        } else if (status === 404) {
          this.errorMsg = '❌ Endpoint introuvable (404) — vérifiez que /api/periodes-taux existe dans le backend.';
        } else if (status === 500) {
          const msg = err.error?.message || err.message || '';
          this.errorMsg = `❌ Erreur serveur (500) — ${msg || 'vérifiez les logs Spring Boot.'}` ;
        } else {
          this.errorMsg = `❌ Erreur HTTP ${status} — ${err.error?.message || err.message || 'Vérifiez la console navigateur.'}`;
        }
        this.loading = false;
      }
    });
  }

  appliquerFiltres(): void {
    let resultat = [...this.periodes];

    if (this.searchTerm.trim()) {
      const terme = this.searchTerm.toLowerCase();
      resultat = resultat.filter(p =>
        p.libelle?.toLowerCase().includes(terme) ||
        p.dateDebut.includes(terme) ||
        p.dateFin.includes(terme) ||
        p.taux.toString().includes(terme)
      );
    }

    if (this.filtreStatut === 'actives') {
      resultat = resultat.filter(p => p.actif);
    } else if (this.filtreStatut === 'inactives') {
      resultat = resultat.filter(p => !p.actif);
    }

    this.periodesFiltrees = resultat;
  }

  // ── UTILITAIRES ──────────────────────────────────────────────────────────

  calculerDuree(dateDebut: string, dateFin: string): number {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDatetime(dt: string): string {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  estExpire(dateFin: string): boolean {
    return new Date(dateFin) < new Date();
  }

  estEnCours(dateDebut: string, dateFin: string): boolean {
    const now = new Date();
    return new Date(dateDebut) <= now && new Date(dateFin) >= now;
  }

  clearMessages(): void {
    this.successMsg = '';
    this.errorMsg = '';
  }

  // ── CRÉATION ─────────────────────────────────────────────────────────────

  ouvrirModalCreer(): void {
    this.modeEdition = false;
    this.periodeEnEdition = null;
    this.form = { libelle: '', dateDebut: '', dateFin: '', taux: '', actif: true };
    this.formErrors = {};
    this.showModal = true;
    this.clearMessages();
  }

  ouvrirModalEditer(p: PeriodeTaux): void {
    this.modeEdition = true;
    this.periodeEnEdition = p;
    this.form = {
      libelle: p.libelle || '',
      dateDebut: p.dateDebut,
      dateFin: p.dateFin,
      taux: p.taux,
      actif: p.actif
    };
    this.formErrors = {};
    this.showModal = true;
    this.clearMessages();
  }

  fermerModal(): void {
    this.showModal = false;
    this.formErrors = {};
  }

  validerForm(): boolean {
    this.formErrors = {};
    if (!this.form.libelle?.trim()) this.formErrors.libelle = 'Libellé obligatoire';
    if (!this.form.dateDebut) this.formErrors.dateDebut = 'Date de début obligatoire';
    if (!this.form.dateFin)   this.formErrors.dateFin   = 'Date de fin obligatoire';
    if (this.form.dateDebut && this.form.dateFin && this.form.dateFin < this.form.dateDebut)
      this.formErrors.dateFin = 'La date de fin doit être après la date de début';
    if (!this.form.taux && this.form.taux !== 0) this.formErrors.taux = 'Taux obligatoire';
    if (this.form.taux !== '' && (Number(this.form.taux) < 0 || Number(this.form.taux) > 999))
      this.formErrors.taux = 'Taux doit être entre 0 et 999';
    return Object.keys(this.formErrors).length === 0;
  }

  enregistrer(): void {
    if (!this.validerForm()) return;
    this.saving = true;
    const body = {
      libelle: this.form.libelle.trim(),
      dateDebut: this.form.dateDebut,
      dateFin: this.form.dateFin,
      taux: this.form.taux,
      actif: this.form.actif
    };

    const req = this.modeEdition
      ? this.http.put<any>(`${this.apiUrl}/${this.periodeEnEdition!.id}`, body, { headers: this.getHeaders() })
      : this.http.post<any>(this.apiUrl, body, { headers: this.getHeaders() });

    req.subscribe({
      next: (res) => {
        if (res.success === false) {
          this.errorMsg = res.message || 'Erreur lors de l\'enregistrement';
        } else {
          this.successMsg = this.modeEdition ? '✓ Période mise à jour avec succès' : '✓ Période créée avec succès';
          this.fermerModal();
          this.charger();
          setTimeout(() => this.successMsg = '', 4000);
        }
        this.saving = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Erreur serveur';
        this.saving = false;
      }
    });
  }

  // ── TOGGLE ACTIF/INACTIF ─────────────────────────────────────────────────

  toggleActif(p: PeriodeTaux): void {
    this.http.patch<any>(`${this.apiUrl}/${p.id}/toggle`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        p.actif = res.actif;
        this.appliquerFiltres();
        this.successMsg = res.actif ? '✓ Période activée' : '✓ Période désactivée';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.errorMsg = 'Impossible de changer le statut'; }
    });
  }

  // ── SUPPRESSION ──────────────────────────────────────────────────────────

  ouvrirModalSupprimer(p: PeriodeTaux): void {
    this.periodeASupprimer = p;
    this.showDeleteModal = true;
    this.clearMessages();
  }

  fermerModalSupprimer(): void {
    this.showDeleteModal = false;
    this.periodeASupprimer = null;
  }

  confirmerSuppression(): void {
    if (!this.periodeASupprimer) return;
    this.suppression = true;
    this.http.delete<any>(`${this.apiUrl}/${this.periodeASupprimer.id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.successMsg = '✓ Période supprimée';
        this.fermerModalSupprimer();
        this.charger();
        this.suppression = false;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: () => {
        this.errorMsg = 'Impossible de supprimer cette période';
        this.suppression = false;
      }
    });
  }
}
