import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PublicHeaderComponent } from '../../../shared/components/public-header/public-header.component';

// Déclaration globale pour le widget reCAPTCHA v2 (script chargé dans index.html)
declare const grecaptcha: any;

interface KycDocument {
  type: string;
  labelKey: string;
  icone: string;
  obligatoire: boolean;
  fichier: File | null;
}

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PublicHeaderComponent, TranslateModule],
  templateUrl: './register-client.component.html',
  styleUrls: ['./register-client.component.css']
})
export class RegisterClientComponent implements OnInit, OnDestroy {
  private apiUrl = '/api/client';

  currentStep = 0;   // 0=choix, 1=formulaire, 2=OTP, 3=KYC, 4=confirmation
  loading = false;
  showPass = false;
  globalError = '';
  globalSuccess = '';

  // Choix de l'utilisateur au step 0
  modeTrial: boolean | null = null;

  form = {
    prenom: '',
    nom: '',
    nomUtilisateur: '',
    email: '',
    telephone: '',
    societe: '',
    adresse: '',
    motDePasse: '',
    confirmMotDePasse: ''
  };

  errors: any = {};

  // ── CGU (Conditions Générales d'Utilisation) ─────────────────
  cguAcceptees = false;
  cguError = false;

  // ── Indicateur force mot de passe ────────────────────────────
  get passwordStrength(): { score: number; label: string; color: string } {
    const pwd = this.form.motDePasse;
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)              score++;
    if (/[A-Z]/.test(pwd))           score++;
    if (/[a-z]/.test(pwd))           score++;
    if (/[0-9]/.test(pwd))           score++;
    if (/[^A-Za-z0-9]/.test(pwd))   score++;
    const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
    return { score, label: labels[score] || '', color: colors[score] || '' };
  }

  // ── Critères individuels exposés au template (regex literals interdits dans les bindings Angular) ──
  get pwdHasMajuscule(): boolean { return /[A-Z]/.test(this.form.motDePasse); }
  get pwdHasChiffre():   boolean { return /[0-9]/.test(this.form.motDePasse); }
  get pwdHasSymbole():   boolean { return /[^A-Za-z0-9]/.test(this.form.motDePasse); }

  // ── OTP ──────────────────────────────────────────────────────
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpEnvoye = false;
  otpError  = '';
  resendCountdown = 0;
  private countdownTimer: any;

  get otpCode(): string {
    return this.otpDigits.join('');
  }

  // ── KYC ──────────────────────────────────────────────────────
  kycDocuments: KycDocument[] = [
    { type: 'CNI',               labelKey: 'REGISTER.KYC_DOC_CNI',      icone: '🪪', obligatoire: true,  fichier: null },
    { type: 'REGISTRE_COMMERCE', labelKey: 'REGISTER.KYC_DOC_RC',       icone: '🏢', obligatoire: false, fichier: null },
    { type: 'PATENTE',           labelKey: 'REGISTER.KYC_DOC_PATENTE',   icone: '📜', obligatoire: false, fichier: null },
    { type: 'JUSTIFICATIF',      labelKey: 'REGISTER.KYC_DOC_JUSTIF',    icone: '🏠', obligatoire: false, fichier: null }
  ];

  usernameChecking = false;
  usernameAvailable: boolean | null = null;
  emailAvailable: boolean | null = null;

  // ── CAPTCHA local (image) + Google reCAPTCHA v2 ──────────────
  showCaptcha       = true;   // toujours visible sur l'inscription (plus sensible que le login)
  captchaSessionId   = '';
  captchaImageBase64 = '';
  captchaCodeSaisi   = '';
  captchaError       = false;
  captchaLoading     = false;

  recaptchaToken   = '';
  recaptchaValide  = false;
  recaptchaError   = false;

  private readonly CAPTCHA_API = '/api/auth/captcha';

  constructor(private http: HttpClient, private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    // Appliquer le thème sauvegardé sur la page publique
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    const theme = prefs.themePreset || 'light';
    document.documentElement.setAttribute('data-theme-preset', theme);
    // Exposer les callbacks reCAPTCHA v2 sur window (requis par le script Google)
    (window as any)['onRegisterRecaptchaResolved'] = (token: string) => this.onRecaptchaResolved(token);
    (window as any)['onRegisterRecaptchaExpired']  = ()             => this.onRecaptchaExpired();
    // Charger le CAPTCHA image dès l'arrivée sur le formulaire
    this.loadCaptcha();
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    // Nettoyer les callbacks window
    delete (window as any)['onRegisterRecaptchaResolved'];
    delete (window as any)['onRegisterRecaptchaExpired'];
  }

  // ── Méthodes CAPTCHA ─────────────────────────────────────────

  /** Charge un nouveau CAPTCHA image depuis le backend */
  loadCaptcha(): void {
    this.captchaLoading    = true;
    this.captchaCodeSaisi  = '';
    this.captchaError      = false;
    this.http.get<{ sessionId: string; imageBase64: string }>(this.CAPTCHA_API).subscribe({
      next: (res) => {
        this.captchaSessionId   = res.sessionId;
        this.captchaImageBase64 = res.imageBase64;
        this.captchaLoading     = false;
        this.captchaError       = false;
      },
      error: (err) => {
        console.error('Erreur chargement CAPTCHA:', err);
        this.captchaLoading = false;
        this.captchaError   = false;
      }
    });
  }

  /** Recharge une nouvelle image CAPTCHA */
  refreshCaptcha(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.captchaCodeSaisi = '';
    this.captchaError = false;
    this.loadCaptcha();
  }

  /** Callback reCAPTCHA v2 : utilisateur a coché la case */
  onRecaptchaResolved(token: string): void {
    this.recaptchaToken  = token;
    this.recaptchaValide = true;
    this.recaptchaError  = false;
  }

  /** Callback reCAPTCHA v2 : token expiré */
  onRecaptchaExpired(): void {
    this.recaptchaToken  = '';
    this.recaptchaValide = false;
  }

  /** Vérifie que le CAPTCHA est entièrement validé avant de continuer */
  private captchaEstValide(): boolean {
    if (!this.captchaCodeSaisi.trim()) {
      this.captchaError = true;
      return false;
    }
    if (!this.recaptchaValide) {
      this.recaptchaError = true;
      return false;
    }
    return true;
  }

  /** Réinitialise l'état CAPTCHA après soumission */
  private resetCaptchaState(): void {
    this.captchaCodeSaisi  = '';
    this.captchaError      = false;
    this.recaptchaToken    = '';
    this.recaptchaValide   = false;
    this.recaptchaError    = false;
    try {
      if (typeof grecaptcha !== 'undefined') { grecaptcha.reset(); }
    } catch { /* grecaptcha peut ne pas être disponible */ }
  }

  // Raccourci pour la traduction instantanée
  private t(key: string): string {
    return this.translate.instant(key);
  }

  // Vérifier disponibilité du username en temps réel
  checkUsername(): void {
    const u = this.form.nomUtilisateur.trim();
    if (u.length < 3) { this.usernameAvailable = null; return; }
    this.usernameChecking = true;
    this.http.get<any>(`${this.apiUrl}/check-username?username=${encodeURIComponent(u)}`).subscribe({
      next: (r) => { this.usernameChecking = false; this.usernameAvailable = r.available; },
      error: () => { this.usernameChecking = false; this.usernameAvailable = null; }
    });
  }

  // Vérifier disponibilité de l'email en temps réel
  checkEmail(): void {
    const e = this.form.email.trim();
    if (!e.includes('@')) { this.emailAvailable = null; return; }
    this.http.get<any>(`${this.apiUrl}/check-email?email=${encodeURIComponent(e)}`).subscribe({
      next: (r) => { this.emailAvailable = r.available; },
      error: () => { this.emailAvailable = null; }
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  ÉTAPE 0 : Choix Trial / Abonnement
  // ══════════════════════════════════════════════════════════════
  choisirModeTrial(trial: boolean): void {
    this.modeTrial = trial;
    this.currentStep = 1;
    this.globalError = '';
    // Pré-charger le CAPTCHA image pour l'étape 1
    this.loadCaptcha();
  }

  // ══════════════════════════════════════════════════════════════
  //  ÉTAPE 1 : Valider le formulaire et envoyer l'OTP
  // ══════════════════════════════════════════════════════════════
  etape1Suivant(): void {
    this.errors = {};
    this.globalError = '';

    if (!this.form.prenom.trim())          { this.errors.prenom = this.t('REGISTER.ERR_REQUIRED'); }
    if (!this.form.nom.trim())             { this.errors.nom = this.t('REGISTER.ERR_REQUIRED'); }
    if (!this.form.nomUtilisateur.trim())  { this.errors.nomUtilisateur = this.t('REGISTER.ERR_REQUIRED'); }
    if (!this.form.email.trim())           { this.errors.email = this.t('REGISTER.ERR_EMAIL_REQUIRED'); }
    if (!this.form.telephone.trim())       { this.errors.telephone = this.t('REGISTER.ERR_REQUIRED'); }

    // ── Validation mot de passe fort (Point 7 encadrant) ──────────
    const pwd = this.form.motDePasse;
    if (pwd.length < 8) {
      this.errors.motDePasse = this.t('REGISTER.ERR_PASSWORD_MIN') || 'Le mot de passe doit contenir au moins 8 caractères.';
    } else if (!/[A-Z]/.test(pwd)) {
      this.errors.motDePasse = 'Le mot de passe doit contenir au moins une majuscule.';
    } else if (!/[a-z]/.test(pwd)) {
      this.errors.motDePasse = 'Le mot de passe doit contenir au moins une minuscule.';
    } else if (!/[0-9]/.test(pwd)) {
      this.errors.motDePasse = 'Le mot de passe doit contenir au moins un chiffre.';
    } else if (!/[^A-Za-z0-9]/.test(pwd)) {
      this.errors.motDePasse = 'Le mot de passe doit contenir au moins un symbole (ex: @, !, #).';
    }

    if (this.form.motDePasse !== this.form.confirmMotDePasse) {
      this.errors.confirmMotDePasse = this.t('REGISTER.ERR_PASSWORD_MISMATCH');
    }
    if (this.usernameAvailable === false)  { this.errors.nomUtilisateur = this.t('REGISTER.ERR_USERNAME_TAKEN'); }
    if (this.emailAvailable === false)     { this.errors.email = this.t('REGISTER.ERR_EMAIL_TAKEN'); }
    if (Object.keys(this.errors).length > 0) return;

    // ── Vérification CGU obligatoires ─────────────────────────────
    if (!this.cguAcceptees) {
      this.cguError = true;
      return;
    }
    this.cguError = false;

    // Vérifier le double CAPTCHA
    if (!this.captchaEstValide()) return;

    // Envoyer l'OTP par email
    this.loading = true;
    this.http.post<any>(`${this.apiUrl}/otp/envoyer`, {
      email:  this.form.email,
      prenom: this.form.prenom
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.otpEnvoye = true;
        this.otpDigits = ['', '', '', '', '', ''];
        this.otpError = '';
        this.currentStep = 2;
        this.resetCaptchaState(); // Réinitialiser le CAPTCHA après validation réussie
        this.demarrerCountdown();
        // Mode dev : email a échoué, le code est dans la réponse
        if (res?.devCode) {
          const code = res.devCode as string;
          this.otpDigits = code.split('');
          this.otpError = '';
          // Afficher un message d'info visible
          setTimeout(() => {
            alert(`⚠️ Mode développement :\nL'email SMTP est indisponible.\nVotre code OTP est : ${code}\n(Il a été pré-rempli automatiquement)`);
          }, 200);
        } else {
          setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
        }
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('email')) {
          this.errors.email = msg;
        } else {
          this.globalError = msg || this.t('REGISTER.ERR_OTP_SEND');
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  ÉTAPE 2 : Vérifier le code OTP
  // ══════════════════════════════════════════════════════════════
  otpShake = false; // animation d'erreur sur les cases

  private afficherErreurOtp(msg: string): void {
    this.loading = false;
    this.otpError = msg;
    this.otpShake = true;
    this.otpDigits = ['', '', '', '', '', ''];
    setTimeout(() => {
      this.otpShake = false;
      document.getElementById('otp-0')?.focus();
    }, 600);
  }

  etape2VerifierOtp(): void {
    this.otpError = '';
    this.otpShake = false;

    if (this.otpCode.length < 6) {
      this.otpError = this.t('REGISTER.ERR_OTP_DIGITS');
      return;
    }

    this.loading = true;

    // Timeout de sécurité : 8s maximum, puis débloquer avec message actionnable
    const safetyTimeout = setTimeout(() => {
      if (this.loading) {
        this.afficherErreurOtp(this.t('REGISTER.ERR_OTP_TIMEOUT'));
      }
    }, 8000);

    this.http.post<any>(`${this.apiUrl}/otp/verifier`, {
      email: this.form.email,
      code:  this.otpCode
    }).pipe(
      finalize(() => { clearTimeout(safetyTimeout); })
    ).subscribe({
      next: () => {
        this.loading = false;
        // OTP validé → créer le compte
        this.inscrireCompte();
      },
      error: (err: any) => {
        // Tous les cas d'erreur → message clair et actionnable
        if (err.status === 0) {
          // status 0 = backend redémarré (OTP perdu) ou CORS
          this.afficherErreurOtp(this.t('REGISTER.ERR_OTP_SERVER'));
        } else if (err.status === 401) {
          // Code incorrect ou expiré
          const backendMsg = err.error?.message;
          this.afficherErreurOtp(
            backendMsg || this.t('REGISTER.ERR_OTP_WRONG')
          );
        } else if (err.status === 410) {
          this.afficherErreurOtp(this.t('REGISTER.ERR_OTP_EXPIRED'));
        } else if (err.status === 429) {
          this.afficherErreurOtp(this.t('REGISTER.ERR_OTP_TOO_MANY'));
        } else {
          this.afficherErreurOtp(
            err.error?.message || this.t('REGISTER.ERR_OTP_WRONG')
          );
        }
      }
    });
  }

  private inscrireCompte(): void {
    const payload = {
      nomUtilisateur: this.form.nomUtilisateur,
      email:          this.form.email,
      motDePasse:     this.form.motDePasse,
      prenom:         this.form.prenom,
      nom:            this.form.nom,
      telephone:      this.form.telephone,
      societe:        this.form.societe,
      adresse:        this.form.adresse,
      modeTrial:      this.modeTrial === true  // ✅ false si null ou false
    };

    this.http.post<any>(`${this.apiUrl}/register`, payload).subscribe({
      next: () => {
        this.loading = false;
        if (this.modeTrial === true) {
          // Trial : afficher la confirmation, puis rediriger vers login avec le username pré-rempli
          this.currentStep = 4;
          // Redirection automatique après 4 secondes avec username pré-rempli
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { username: this.form.nomUtilisateur }
            });
          }, 5000);
        } else {
          // Abonnement direct : KYC requis
          this.currentStep = 3;
        }
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || err?.error || this.t('REGISTER.ERR_ACCOUNT_CREATE');
        // Si username pris → retour step 1 avec erreur visible sur le champ
        if (msg.toLowerCase().includes('utilisateur') || msg.toLowerCase().includes('username')) {
          this.errors.nomUtilisateur = msg;
          this.currentStep = 1;
          this.usernameAvailable = false;
        } else if (msg.toLowerCase().includes('email')) {
          this.errors.email = msg;
          this.currentStep = 1;
          this.emailAvailable = false;
        } else {
          this.otpError = '⚠️ ' + msg;
        }
        console.error('[Register] Erreur inscription:', err);
      }
    });
  }

  renvoyerOtp(): void {
    if (this.resendCountdown > 0) return;
    this.loading = true;
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';

    this.http.post<any>(`${this.apiUrl}/otp/envoyer`, {
      email:  this.form.email,
      prenom: this.form.prenom
    }).subscribe({
      next: () => {
        this.loading = false;
        this.otpEnvoye = true;
        this.demarrerCountdown();
        setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.otpError = err?.error?.message || this.t('REGISTER.ERR_OTP_RESEND');
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

  // Gestion saisie des digits OTP
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    this.otpDigits[index] = val.charAt(0) || '';
    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.otpDigits[index - 1] = '';
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  ÉTAPE 3 : Upload des documents KYC
  // ══════════════════════════════════════════════════════════════
  triggerUpload(type: string): void {
    const input = document.getElementById('input-' + type) as HTMLInputElement;
    if (input) input.click();
  }

  onFileSelect(event: Event, doc: KycDocument): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      doc.fichier = input.files[0];
    }
  }

  onDrop(event: DragEvent, doc: KycDocument): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      doc.fichier = event.dataTransfer.files[0];
    }
  }

  retirerDoc(event: Event, doc: KycDocument): void {
    event.stopPropagation();
    doc.fichier = null;
  }

  etape3Soumettre(): void {
    this.globalError = '';
    this.globalSuccess = '';

    const docsObligatoires = this.kycDocuments.filter(d => d.obligatoire && !d.fichier);
    if (docsObligatoires.length > 0) {
      this.globalError = this.t('REGISTER.ERR_KYC_REQUIRED');
      return;
    }

    const docsAUploader = this.kycDocuments.filter(d => d.fichier !== null);
    if (docsAUploader.length === 0) {
      this.globalError = this.t('REGISTER.ERR_KYC_MIN');
      return;
    }

    this.loading = true;
    let uploaded = 0;

    docsAUploader.forEach(doc => {
      const formData = new FormData();
      formData.append('nomUtilisateur', this.form.nomUtilisateur);
      formData.append('typeDocument', doc.type);
      formData.append('fichier', doc.fichier!);

      this.http.post<any>(`${this.apiUrl}/kyc/upload`, formData).subscribe({
        next: (_res: any) => {
          uploaded++;
          if (uploaded === docsAUploader.length) {
            this.loading = false;
            this.currentStep = 4; // → Confirmation
          }
        },
        error: (_err: any) => {
          uploaded++;
          if (uploaded === docsAUploader.length) {
            this.loading = false;
            this.currentStep = 4;
          }
        }
      });
    });
  }
}
