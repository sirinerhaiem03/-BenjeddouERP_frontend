import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-changer-mot-de-passe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './changer-mot-de-passe.component.html',
  styleUrls: ['./changer-mot-de-passe.component.css']
})
export class ChangerMotDePasseComponent {
  ancienMdp     = '';
  nouveauMdp    = '';
  confirmerMdp  = '';

  showAncien    = false;
  showNouveau   = false;
  showConfirmer = false;

  loading   = false;
  errorMsg  = '';
  successMsg = '';

  // Password strength
  strength = { score: 0, label: '', color: '#e2e8f0', width: '0%' };

  get nomUtilisateur(): string {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.prenom || u.nomUtilisateur || 'Utilisateur';
    } catch { return 'Utilisateur'; }
  }

  constructor(private http: HttpClient, private router: Router) {}

  onNouveauMdpChange(): void {
    const pwd = this.nouveauMdp;
    if (!pwd) { this.strength = { score: 0, label: '', color: '#e2e8f0', width: '0%' }; return; }
    let s = 0;
    if (pwd.length >= 6)  s++;
    if (pwd.length >= 10) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    if (s <= 2) this.strength = { score: s, label: 'Faible', color: '#ef4444', width: '30%' };
    else if (s <= 3) this.strength = { score: s, label: 'Moyen', color: '#f59e0b', width: '60%' };
    else this.strength = { score: s, label: 'Fort', color: '#10b981', width: '100%' };
  }

  onSubmit(): void {
    this.errorMsg  = '';
    this.successMsg = '';

    if (!this.ancienMdp || !this.nouveauMdp || !this.confirmerMdp) {
      this.errorMsg = 'Tous les champs sont obligatoires.'; return;
    }
    if (this.nouveauMdp.length < 6) {
      this.errorMsg = 'Le nouveau mot de passe doit contenir au moins 6 caractères.'; return;
    }
    if (this.nouveauMdp !== this.confirmerMdp) {
      this.errorMsg = 'Les deux nouveaux mots de passe ne correspondent pas.'; return;
    }
    if (this.ancienMdp === this.nouveauMdp) {
      this.errorMsg = 'Le nouveau mot de passe doit être différent de l\'ancien.'; return;
    }

    this.loading = true;
    const token  = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const params  = new HttpParams()
      .set('ancienMotDePasse', this.ancienMdp)
      .set('nouveauMotDePasse', this.nouveauMdp);

    this.http.put('http://localhost:9090/api/auth/changer-mot-de-passe', null, { headers, params }).subscribe({
      next: (_res: any) => {
        this.loading = false;
        this.successMsg = '✅ Mot de passe changé avec succès ! Redirection vers le tableau de bord...';
        // Mettre à jour l'utilisateur local pour désactiver le flag
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.doitChangerMotDePasse = false;
          localStorage.setItem('user', JSON.stringify(user));
        } catch (_) {}
        setTimeout(() => this.router.navigate(['/dashboard']), 1800);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Erreur lors du changement de mot de passe.';
      }
    });
  }

  onLogout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
