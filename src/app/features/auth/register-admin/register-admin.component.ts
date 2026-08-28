import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

declare const grecaptcha: any;

@Component({
  selector: 'app-register-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './register-admin.component.html',
  styleUrls: ['./register-admin.component.css']
})
export class RegisterAdminComponent implements OnInit, OnDestroy {
  private apiUrl = '/api/inscription-admin'; // TOUS les endpoints admin : OTP, check, register

  // 1=Identité Admin, 2=Entreprise, 3=OTP, 4=Confirmation
  currentStep = 1;
  loading = false;
  showPass = false;
  showPassConfirm = false;
  globalError = '';
  globalSuccess = '';

  // Résultat de l'inscription (retourné par l'API)
  inscriptionResult: { nomUtilisateur: string; societe: string; schemaName: string } | null = null;

  form = {
    // Étape 1 — Identité
    prenom: '',
    nom: '',
    nomUtilisateur: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmMotDePasse: '',
    // Étape 2 — Entreprise
    societe: '',
    adresse: '',
    secteur: '',
    tailleEntreprise: '',
  };

  errors: any = {};

  secteurs = [
    'Commerce & Distribution',
    'Services & Conseil',
    'Industrie & Production',
    'BTP & Construction',
    'Transport & Logistique',
    'Santé & Médical',
    'Éducation & Formation',
    'Agriculture & Agroalimentaire',
    'Informatique & Technologie',
    'Finance & Assurance',
    'Immobilier',
    'Hôtellerie & Restauration',
    'Autre',
  ];

  taillesEntreprise = [
    '1 à 9 employés (Micro-entreprise)',
    '10 à 49 employés (Petite entreprise)',
    '50 à 249 employés (Moyenne entreprise)',
    '250 à 999 employés (Grande entreprise)',
    '1000+ employés (Très grande entreprise)',
  ];

  // Vérification disponibilité
  usernameChecking = false;
  usernameAvailable: boolean | null = null;
  emailAvailable: boolean | null = null;

  // OTP
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpError = '';
  otpShake = false;
  resendCountdown = 0;
  private countdownTimer: any;

  // CGU
  cguAcceptees = false;
  cguError = false;

  // Force mot de passe
  get passwordStrength(): { score: number; label: string; color: string } {
    const pwd = this.form.motDePasse;
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)            score++;
    if (/[A-Z]/.test(pwd))         score++;
    if (/[a-z]/.test(pwd))         score++;
    if (/[0-9]/.test(pwd))         score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
    return { score, label: labels[score] || '', color: colors[score] || '' };
  }

  get pwdHasMajuscule(): boolean { return /[A-Z]/.test(this.form.motDePasse); }
  get pwdHasChiffre():   boolean { return /[0-9]/.test(this.form.motDePasse); }
  get pwdHasSymbole():   boolean { return /[^A-Za-z0-9]/.test(this.form.motDePasse); }
  get pwdLongueur():     boolean { return this.form.motDePasse.length >= 8; }

  get otpCode(): string { return this.otpDigits.join(''); }

  constructor(private http: HttpClient, private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    document.documentElement.setAttribute('data-theme-preset', prefs.themePreset || 'light');
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  private t(key: string): string {
    return this.translate.instant(key) || key;
  }

  // ══════════════════════════════════════════════════════════════
  //  VÉRIFICATION DISPONIBILITÉ
  // ══════════════════════════════════════════════════════════════
  checkUsername(): void {
    const u = this.form.nomUtilisateur.trim();
    if (u.length < 3) { this.usernameAvailable = null; return; }
    this.usernameChecking = true;
    this.http.get<any>(`${this.apiUrl}/check-username?username=${encodeURIComponent(u)}`).subscribe({
      next: (r) => { this.usernameChecking = false; this.usernameAvailable = r.available; },
      error: () => { this.usernameChecking = false; this.usernameAvailable = null; }
    });
  }

  checkEmail(): void {
    const e = this.form.email.trim();
    if (!e.includes('@')) { this.emailAvailable = null; return; }
    this.http.get<any>(`${this.apiUrl}/check-email?email=${encodeURIComponent(e)}`).subscribe({
      next: (r) => { this.emailAvailable = r.available; },
      error: () => { this.emailAvailable = null; }
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  ÉTAPE 1 → 2 : Validation identité admin
  // ══════════════════════════════════════════════════════════════
  etape1Suivant(): void {
    this.errors = {};
    this.globalError = '';

    if (!this.form.prenom.trim())         this.errors.prenom = 'Champ obligatoire';
    if (!this.form.nom.trim())            this.errors.nom = 'Champ obligatoire';
    if (!this.form.nomUtilisateur.trim()) this.errors.nomUtilisateur = 'Champ obligatoire';
    if (!this.form.email.trim())          this.errors.email = 'Email obligatoire';
    if (!this.form.telephone.trim())      this.errors.telephone = 'Champ obligatoire';

    const pwd = this.form.motDePasse;
    if (pwd.length < 8) {
      this.errors.motDePasse = 'Au moins 8 caractères requis.';
    } else if (!/[A-Z]/.test(pwd)) {
      this.errors.motDePasse = 'Au moins une majuscule requise.';
    } else if (!/[a-z]/.test(pwd)) {
      this.errors.motDePasse = 'Au moins une minuscule requise.';
    } else if (!/[0-9]/.test(pwd)) {
      this.errors.motDePasse = 'Au moins un chiffre requis.';
    } else if (!/[^A-Za-z0-9]/.test(pwd)) {
      this.errors.motDePasse = 'Au moins un symbole requis (ex: @, !, #).';
    }

    if (this.form.motDePasse !== this.form.confirmMotDePasse) {
      this.errors.confirmMotDePasse = 'Les mots de passe ne correspondent pas.';
    }
    if (this.usernameAvailable === false) this.errors.nomUtilisateur = 'Ce nom d\'utilisateur est déjà pris.';
    if (this.emailAvailable === false)    this.errors.email = 'Cet email est déjà utilisé.';

    if (Object.keys(this.errors).length > 0) return;
    this.currentStep = 2;
    window.scrollTo(0, 0);
  }

  // ══════════════════════════════════════════════════════════════
  //  ÉTAPE 2 → OTP : Validation entreprise + envoi OTP
  // ══════════════════════════════════════════════════════════════
  etape2Suivant(): void {
    this.errors = {};
    this.globalError = '';

    if (!this.form.societe.trim())   this.errors.societe = 'Le nom de l\'entreprise est obligatoire.';
    if (!this.form.secteur)          this.errors.secteur = 'Veuillez sélectionner un secteur.';

    if (!this.cguAcceptees) {
      this.cguError = true;
      return;
    }
    this.cguError = false;

    if (Object.keys(this.errors).length > 0) return;

    // Envoyer l'OTP — avec timeout de sécurité 10s
    this.loading = true;
    const safetyTimeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.globalError = '⚠️ Le serveur ne répond pas. Vérifiez que le backend est démarré puis réessayez.';
      }
    }, 30000);

    this.http.post<any>(`${this.apiUrl}/otp/envoyer`, {
      email:  this.form.email,
      prenom: this.form.prenom
    }).pipe(finalize(() => clearTimeout(safetyTimeout))).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.otpDigits = ['', '', '', '', '', ''];
        this.otpError = '';
        this.currentStep = 3;
        this.demarrerCountdown();
        window.scrollTo(0, 0);
        // L'email OTP est envoyé en async — rediriger vers les logs si SMTP indisponible
        setTimeout(() => document.getElementById('otp-admin-0')?.focus(), 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.globalError = err?.error?.message || 'Erreur lors de l\'envoi du code OTP.';
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  ÉTAPE 3 : Vérification OTP
  // ══════════════════════════════════════════════════════════════
  private afficherErreurOtp(msg: string): void {
    this.loading = false;
    this.otpError = msg;
    this.otpShake = true;
    this.otpDigits = ['', '', '', '', '', ''];
    setTimeout(() => {
      this.otpShake = false;
      document.getElementById('otp-admin-0')?.focus();
    }, 600);
  }

  etape3VerifierOtp(): void {
    this.otpError = '';
    if (this.otpCode.length < 6) {
      this.otpError = 'Veuillez saisir les 6 chiffres du code.';
      return;
    }
    this.loading = true;
    const safetyTimeout = setTimeout(() => {
      if (this.loading) this.afficherErreurOtp('Délai dépassé. Veuillez réessayer.');
    }, 10000);

    this.http.post<any>(`${this.apiUrl}/otp/verifier`, {
      email: this.form.email,
      code:  this.otpCode
    }).pipe(finalize(() => clearTimeout(safetyTimeout))).subscribe({
      next: () => {
        this.loading = false;
        this.inscrireAdmin();
      },
      error: (err: any) => {
        const msg = err?.error?.message;
        if (err.status === 0) {
          this.afficherErreurOtp('Serveur inaccessible. Vérifiez votre connexion.');
        } else if (err.status === 401) {
          this.afficherErreurOtp(msg || 'Code OTP incorrect ou expiré.');
        } else {
          this.afficherErreurOtp(msg || 'Code OTP incorrect.');
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  INSCRIPTION FINALE
  // ══════════════════════════════════════════════════════════════
  private inscrireAdmin(): void {
    this.loading = true;
    const payload = {
      nomUtilisateur:   this.form.nomUtilisateur,
      email:            this.form.email,
      motDePasse:       this.form.motDePasse,
      prenom:           this.form.prenom,
      nom:              this.form.nom,
      telephone:        this.form.telephone,
      societe:          this.form.societe,
      adresse:          this.form.adresse,
      secteur:          this.form.secteur,
      tailleEntreprise: this.form.tailleEntreprise
    };

    // Timeout de sécurité 20s — la création de base tenant peut prendre quelques secondes
    const safetyTimeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.globalError = '⚠️ Le serveur ne répond pas. Vérifiez que le backend est redémarré avec le nouveau contrôleur AdminInscriptionController.';
      }
    }, 20000);

    this.http.post<any>(`${this.apiUrl}/register`, payload)
      .pipe(finalize(() => clearTimeout(safetyTimeout)))
      .subscribe({
      next: (res: any) => {
        this.loading = false;
        this.inscriptionResult = {
          nomUtilisateur: res.nomUtilisateur,
          societe:        res.societe,
          schemaName:     res.schemaName
        };
        this.currentStep = 4;
        window.scrollTo(0, 0);
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || 'Erreur lors de la création de votre espace.';
        if (err.status === 0) {
          this.globalError = '⚠️ Serveur inaccessible. Le backend doit être redémarré pour activer la création de compte admin.';
        } else if (err.status === 404) {
          this.globalError = '⚠️ Endpoint introuvable. Redémarrez le backend Spring Boot pour charger AdminInscriptionController.';
        } else if (err.status === 403 || err.status === 401) {
          this.globalError = '⚠️ Accès refusé. Le backend doit être redémarré pour mettre à jour la configuration de sécurité.';
        } else if (msg.toLowerCase().includes('utilisateur') || msg.toLowerCase().includes('username')) {
          this.errors.nomUtilisateur = msg;
          this.currentStep = 1;
        } else if (msg.toLowerCase().includes('email')) {
          this.errors.email = msg;
          this.currentStep = 1;
        } else if (msg.toLowerCase().includes('entreprise') || msg.toLowerCase().includes('societe')) {
          this.errors.societe = msg;
          this.currentStep = 2;
        } else {
          this.globalError = '⚠️ ' + msg;
        }
      }
    });
  }

  // OTP helpers
  renvoyerOtp(): void {
    if (this.resendCountdown > 0) return;
    this.loading = true;
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';
    this.http.post<any>(`${this.apiUrl}/otp/envoyer`, {
      email: this.form.email,
      prenom: this.form.prenom
    }).subscribe({
      next: () => {
        this.loading = false;
        this.demarrerCountdown();
        setTimeout(() => document.getElementById('otp-admin-0')?.focus(), 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.otpError = err?.error?.message || 'Erreur lors du renvoi.';
      }
    });
  }

  private demarrerCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.resendCountdown = 60;
    this.countdownTimer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) clearInterval(this.countdownTimer);
    }, 1000);
  }

  // Verrou anti double-traitement
  private _otpProcessing = false;

  onOtpInput(event: Event, index: number): void {
    if (this._otpProcessing) return; // Bloquer les appels récursifs

    const input  = event.target as HTMLInputElement;
    // InputEvent.data = UNIQUEMENT le caractère nouvellement tapé
    // (indépendant de l'ancienne valeur de la case)
    const data   = (event as InputEvent).data;

    // Cas : suppression ou caractère non-chiffre
    if (!data || !/^[0-9]$/.test(data)) {
      this._otpProcessing = true;
      input.value = this.otpDigits[index] || ''; // Restaurer
      this._otpProcessing = false;
      return;
    }

    // Écrire UNE SEULE fois le bon chiffre
    this._otpProcessing = true;
    input.value = data;
    this.otpDigits[index] = data;
    this._otpProcessing = false;

    if (index < 5) {
      // Déférer le focus après la fin de l'événement en cours
      setTimeout(() => {
        const next = document.getElementById(`otp-admin-${index + 1}`) as HTMLInputElement;
        if (next) {
          next.focus();
          next.select();
        }
      }, 0);
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.otpDigits[index]) {
        // Effacer la case actuelle
        this.otpDigits[index] = '';
        const input = event.target as HTMLInputElement;
        input.value = '';
      } else if (index > 0) {
        // Case vide : revenir à la précédente
        event.preventDefault();
        this.otpDigits[index - 1] = '';
        setTimeout(() => {
          const prev = document.getElementById(`otp-admin-${index - 1}`) as HTMLInputElement;
          if (prev) { prev.value = ''; prev.focus(); }
        }, 0);
      }
    }
  }

  retourLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { username: this.form.nomUtilisateur }
    });
  }

  retourEtape(etape: number): void {
    this.globalError = '';
    this.errors = {};
    this.currentStep = etape;
    window.scrollTo(0, 0);
  }
}
