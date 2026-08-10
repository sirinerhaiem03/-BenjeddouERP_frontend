import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="profil-page">

  <!-- Header -->
  <div class="profil-header">
    <button class="back-btn" (click)="router.navigate(['/dashboard/home'])">
      <span class="material-symbols-outlined">arrow_back</span>
      Retour
    </button>
    <h1 class="profil-title">
      <span class="material-symbols-outlined">manage_accounts</span>
      Mon Profil
    </h1>
  </div>

  <!-- Toast notification -->
  <div class="profil-toast" [class.show]="toastVisible" [class.error]="toastError">
    <span class="material-symbols-outlined">{{ toastError ? 'error' : 'check_circle' }}</span>
    {{ toastMsg }}
  </div>

  <div class="profil-grid">

    <!-- ── COLONNE GAUCHE : Avatar ── -->
    <div class="profil-card avatar-card">
      <h2 class="card-title">
        <span class="material-symbols-outlined">face</span>
        Avatar &amp; Photo
      </h2>

      <!-- Avatar affiché -->
      <div class="avatar-preview" [class.avatar-photo]="avatarMode==='photo'" [class.avatar-initials]="avatarMode!=='photo'">
        <img *ngIf="avatarMode==='photo' && selectedAvatar" [src]="selectedAvatar" alt="Avatar" />
        <span *ngIf="avatarMode!=='photo'">{{ getInitials() }}</span>
      </div>

      <!-- Upload photo -->
      <div class="avatar-section">
        <p class="section-label">Photo de profil</p>
        <label class="upload-btn">
          <span class="material-symbols-outlined">upload</span>
          Choisir une photo
          <input type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display:none" />
        </label>
        <button *ngIf="avatarMode==='photo'" class="btn-ghost" (click)="resetAvatar()">
          <span class="material-symbols-outlined">delete</span>
          Supprimer la photo
        </button>
      </div>

      <!-- Avatars prédéfinis -->
      <div class="avatar-section">
        <p class="section-label">Avatars prédéfinis</p>
        <div class="preset-grid">
          <button *ngFor="let av of presetAvatars"
            class="preset-avatar"
            [class.selected]="selectedPresetId === av.id"
            [style.background]="av.bg"
            (click)="selectPreset(av)">
            {{ av.emoji }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── COLONNE DROITE ── -->
    <div class="profil-right">

      <!-- Informations personnelles -->
      <div class="profil-card">
        <h2 class="card-title">
          <span class="material-symbols-outlined">person</span>
          Informations personnelles
        </h2>

        <div class="form-grid">
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" [(ngModel)]="editData.prenom" placeholder="Votre prénom" class="form-input" />
          </div>
          <div class="form-group">
            <label>Nom</label>
            <input type="text" [(ngModel)]="editData.nom" placeholder="Votre nom" class="form-input" />
          </div>
          <div class="form-group full">
            <label>Email</label>
            <input type="email" [(ngModel)]="editData.email" placeholder="Votre email" class="form-input" disabled />
            <small class="hint">L'email ne peut pas être modifié</small>
          </div>
          <div class="form-group full">
            <label>Téléphone</label>
            <input type="text" [(ngModel)]="editData.telephone" placeholder="+216 XX XXX XXX" class="form-input" />
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-primary" (click)="saveInfos()" [disabled]="savingInfos">
            <span class="material-symbols-outlined">save</span>
            {{ savingInfos ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>

      <!-- Changer mot de passe -->
      <div class="profil-card">
        <h2 class="card-title">
          <span class="material-symbols-outlined">lock</span>
          Changer le mot de passe
        </h2>

        <div class="form-grid">
          <div class="form-group full">
            <label>Mot de passe actuel</label>
            <div class="input-eye">
              <input [type]="showOld ? 'text' : 'password'" [(ngModel)]="pwd.ancien" placeholder="••••••••" class="form-input" />
              <button class="eye-btn" (click)="showOld=!showOld" type="button">
                <span class="material-symbols-outlined">{{ showOld ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <div class="input-eye">
              <input [type]="showNew ? 'text' : 'password'" [(ngModel)]="pwd.nouveau" placeholder="••••••••" class="form-input" />
              <button class="eye-btn" (click)="showNew=!showNew" type="button">
                <span class="material-symbols-outlined">{{ showNew ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <div class="input-eye">
              <input [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="pwd.confirmer" placeholder="••••••••" class="form-input" />
              <button class="eye-btn" (click)="showConfirm=!showConfirm" type="button">
                <span class="material-symbols-outlined">{{ showConfirm ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Barre de force -->
        <div class="strength-bar" *ngIf="pwd.nouveau">
          <div class="strength-fill" [style.width]="pwdStrength.pct + '%'" [class]="pwdStrength.cls"></div>
        </div>
        <p class="strength-label" *ngIf="pwd.nouveau" [class]="pwdStrength.cls">{{ pwdStrength.label }}</p>

        <div class="card-actions">
          <button class="btn-primary" (click)="changePassword()" [disabled]="savingPwd || !pwd.ancien || !pwd.nouveau || !pwd.confirmer">
            <span class="material-symbols-outlined">key</span>
            {{ savingPwd ? 'Modification...' : 'Modifier le mot de passe' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

    :host { display: block; font-family: 'Inter', sans-serif; }

    .profil-page {
      min-height: 100vh;
      padding: 28px 32px;
      background: var(--bg-main, #0f172a);
      color: var(--text-primary, #f1f5f9);
    }

    /* Header */
    .profil-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .back-btn {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text-primary, #f1f5f9);
      padding: 8px 14px; border-radius: 8px;
      cursor: pointer; font-size: 13px;
      transition: background .2s;
    }
    .back-btn:hover { background: rgba(255,255,255,0.12); }
    .profil-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 22px; font-weight: 700;
      margin: 0; color: var(--text-primary, #f1f5f9);
    }

    /* Toast */
    .profil-toast {
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: #10b981; color: #fff;
      padding: 12px 20px; border-radius: 10px;
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; font-weight: 500;
      opacity: 0; transform: translateX(100px);
      transition: all .35s cubic-bezier(.34,1.56,.64,1);
      pointer-events: none;
    }
    .profil-toast.show { opacity: 1; transform: translateX(0); }
    .profil-toast.error { background: #ef4444; }

    /* Grid layout */
    .profil-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      max-width: 1000px;
    }
    .profil-right { display: flex; flex-direction: column; gap: 24px; }

    /* Cards */
    .profil-card {
      background: var(--sidebar-bg, rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 24px;
    }
    .card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600;
      margin: 0 0 20px;
      color: var(--accent, #6366f1);
    }

    /* Avatar card */
    .avatar-card { text-align: center; }
    .avatar-preview {
      width: 96px; height: 96px;
      border-radius: 50%; margin: 0 auto 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      overflow: hidden;
      border: 3px solid rgba(99,102,241,.5);
    }
    .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }

    .avatar-section { margin-bottom: 20px; text-align: left; }
    .section-label { font-size: 12px; font-weight: 600; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }

    .upload-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent, #6366f1); color: #fff;
      padding: 8px 14px; border-radius: 8px;
      cursor: pointer; font-size: 13px; font-weight: 500;
      transition: opacity .2s; border: none;
    }
    .upload-btn:hover { opacity: .85; }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: 1px solid rgba(239,68,68,.4);
      color: #f87171; padding: 7px 12px; border-radius: 8px;
      cursor: pointer; font-size: 12px; margin-top: 8px;
      transition: background .2s;
    }
    .btn-ghost:hover { background: rgba(239,68,68,.1); }

    .preset-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .preset-avatar {
      width: 44px; height: 44px; border-radius: 10px;
      font-size: 22px; cursor: pointer; border: 2px solid transparent;
      transition: all .2s; display: flex; align-items: center; justify-content: center;
    }
    .preset-avatar:hover { transform: scale(1.1); }
    .preset-avatar.selected { border-color: var(--accent, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,.3); }

    /* Form */
    .form-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; font-weight: 600; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: .5px; }
    .form-input {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 10px 14px;
      color: var(--text-primary, #f1f5f9);
      font-size: 14px; outline: none; transition: border .2s;
    }
    .form-input:focus { border-color: var(--accent, #6366f1); }
    .form-input:disabled { opacity: .5; cursor: not-allowed; }
    .hint { font-size: 11px; color: var(--text-muted, #64748b); margin-top: 2px; }

    /* Password eye toggle */
    .input-eye { position: relative; }
    .input-eye .form-input { width: 100%; box-sizing: border-box; padding-right: 42px; }
    .eye-btn {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--text-muted, #94a3b8); display: flex; align-items: center;
    }

    /* Strength bar */
    .strength-bar {
      height: 4px; background: rgba(255,255,255,0.1);
      border-radius: 4px; margin: 12px 0 4px; overflow: hidden;
    }
    .strength-fill { height: 100%; border-radius: 4px; transition: width .4s, background .4s; }
    .strength-fill.weak { background: #ef4444; }
    .strength-fill.medium { background: #f59e0b; }
    .strength-fill.strong { background: #10b981; }
    .strength-label { font-size: 12px; font-weight: 500; margin: 0 0 12px; }
    .strength-label.weak { color: #ef4444; }
    .strength-label.medium { color: #f59e0b; }
    .strength-label.strong { color: #10b981; }

    /* Actions */
    .card-actions { margin-top: 20px; display: flex; justify-content: flex-end; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--accent, #6366f1), #8b5cf6);
      color: #fff; border: none; border-radius: 10px;
      padding: 10px 22px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity .2s, transform .15s;
    }
    .btn-primary:hover { opacity: .9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }

    @media (max-width: 720px) {
      .profil-grid { grid-template-columns: 1fr; }
      .profil-page { padding: 16px; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MonProfilComponent implements OnInit {

  user: any = null;
  editData = { prenom: '', nom: '', email: '', telephone: '' };
  pwd = { ancien: '', nouveau: '', confirmer: '' };
  savingInfos = false;
  savingPwd = false;

  avatarMode: 'initials' | 'photo' | 'preset' = 'initials';
  selectedAvatar: string | null = null;
  selectedPresetId: string | null = null;

  showOld = false;
  showNew = false;
  showConfirm = false;

  toastMsg = '';
  toastError = false;
  toastVisible = false;

  presetAvatars = [
    { id: 'p1', emoji: '👨‍💼', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { id: 'p2', emoji: '👩‍💼', bg: 'linear-gradient(135deg,#ec4899,#f472b6)' },
    { id: 'p3', emoji: '🧑‍💻', bg: 'linear-gradient(135deg,#06b6d4,#22d3ee)' },
    { id: 'p4', emoji: '👨‍🔧', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { id: 'p5', emoji: '🦊', bg: 'linear-gradient(135deg,#f97316,#fb923c)' },
    { id: 'p6', emoji: '🐺', bg: 'linear-gradient(135deg,#64748b,#94a3b8)' },
    { id: 'p7', emoji: '🦅', bg: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' },
    { id: 'p8', emoji: '🌟', bg: 'linear-gradient(135deg,#c9a84c,#f0c060)' },
  ];

  constructor(
    public router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    if (this.user) {
      this.editData = {
        prenom: this.user.prenom || '',
        nom: this.user.nom || '',
        email: this.user.email || '',
        telephone: this.user.telephone || ''
      };
    }
    // Charger avatar depuis localStorage
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    this.avatarMode = prefs.avatarMode || 'initials';
    this.selectedAvatar = prefs.avatarUrl || null;
    this.selectedPresetId = prefs.selectedPresetId || null;
  }

  getInitials(): string {
    if (!this.user) return 'U';
    if (this.avatarMode === 'preset' && this.selectedPresetId) {
      const av = this.presetAvatars.find(a => a.id === this.selectedPresetId);
      return av ? av.emoji : 'U';
    }
    const p = (this.editData.prenom || this.user?.prenom || '').charAt(0).toUpperCase();
    const n = (this.editData.nom || this.user?.nom || '').charAt(0).toUpperCase();
    return (p + n) || 'U';
  }

  // ── Avatar ──────────────────────────────────────────
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedAvatar = e.target?.result as string;
      this.avatarMode = 'photo';
      this.selectedPresetId = null;
      this.saveAvatarPrefs();
      this.showToast('Photo de profil mise à jour !');
    };
    reader.readAsDataURL(file);
  }

  selectPreset(av: any): void {
    this.selectedPresetId = av.id;
    this.avatarMode = 'preset';
    this.selectedAvatar = null;
    this.saveAvatarPrefs();
    this.showToast('Avatar mis à jour !');
  }

  resetAvatar(): void {
    this.avatarMode = 'initials';
    this.selectedAvatar = null;
    this.selectedPresetId = null;
    this.saveAvatarPrefs();
    this.showToast('Avatar réinitialisé.');
  }

  saveAvatarPrefs(): void {
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    prefs.avatarMode = this.avatarMode;
    prefs.avatarUrl = this.selectedAvatar;
    prefs.selectedPresetId = this.selectedPresetId;
    localStorage.setItem('erp_user_prefs', JSON.stringify(prefs));
  }

  // ── Informations personnelles ────────────────────────
  saveInfos(): void {
    if (!this.editData.prenom?.trim() || !this.editData.nom?.trim()) {
      this.showToast('Prénom et nom sont obligatoires.', true);
      return;
    }
    this.savingInfos = true;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.put('/api/utilisateurs/mon-profil', {
      prenom: this.editData.prenom.trim(),
      nom: this.editData.nom.trim(),
      telephone: this.editData.telephone?.trim() || null
    }, { headers }).subscribe({
      next: () => {
        this.savingInfos = false;
        // Mettre à jour le user local
        const u = this.authService.currentUserValue;
        if (u) {
          u.prenom = this.editData.prenom;
          u.nom = this.editData.nom;
        }
        this.showToast('Informations mises à jour avec succès !');
      },
      error: () => {
        this.savingInfos = false;
        // Mise à jour locale même sans backend
        const u = this.authService.currentUserValue;
        if (u) { u.prenom = this.editData.prenom; u.nom = this.editData.nom; }
        this.showToast('Informations enregistrées localement.');
      }
    });
  }

  // ── Mot de passe ─────────────────────────────────────
  get pwdStrength(): { pct: number; cls: string; label: string } {
    const p = this.pwd.nouveau;
    if (!p) return { pct: 0, cls: '', label: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { pct: 25, cls: 'weak', label: 'Faible' };
    if (score === 2) return { pct: 50, cls: 'medium', label: 'Moyen' };
    return { pct: 100, cls: 'strong', label: 'Fort' };
  }

  changePassword(): void {
    if (this.pwd.nouveau !== this.pwd.confirmer) {
      this.showToast('Les mots de passe ne correspondent pas.', true);
      return;
    }
    if (this.pwd.nouveau.length < 6) {
      this.showToast('Le mot de passe doit contenir au moins 6 caractères.', true);
      return;
    }
    this.savingPwd = true;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.post('/api/utilisateurs/changer-mot-de-passe', {
      ancienMotDePasse: this.pwd.ancien,
      nouveauMotDePasse: this.pwd.nouveau
    }, { headers }).subscribe({
      next: () => {
        this.savingPwd = false;
        this.pwd = { ancien: '', nouveau: '', confirmer: '' };
        this.showToast('Mot de passe modifié avec succès !');
      },
      error: (err) => {
        this.savingPwd = false;
        const msg = err?.error?.message || 'Mot de passe actuel incorrect.';
        this.showToast(msg, true);
      }
    });
  }

  // ── Toast ─────────────────────────────────────────────
  showToast(msg: string, error = false): void {
    this.toastMsg = msg;
    this.toastError = error;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}
