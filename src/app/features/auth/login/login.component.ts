import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DeviceFingerprintService } from '../../../core/services/device-fingerprint.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { PublicHeaderComponent } from '../../../shared/components/public-header/public-header.component';

// Déclaration globale pour le widget reCAPTCHA v2 injecté via index.html
declare const grecaptcha: any;

const passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('motDePasse')?.value;
  const confirmPassword = control.get('confirmerMotDePasse')?.value;
  return password === confirmPassword ? null : { mismatch: true };
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule, RouterLink, PublicHeaderComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  resetForm: FormGroup;
  registerForm: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  sessionRevocationMsg = ''; // Message de déconnexion forcée (double connexion)
  sigToken = '';             // Token signalement reçu automatiquement via le 401
  trialMessage = '';         // Message d'avertissement mode trial
  trialCritique = false; // true si < 5 utilisations restantes

  // Rate Limiting — Compteur de temps
  rateLimited = false;          // true quand l'IP est bloquée
  countdownSeconds = 0;         // secondes restantes
  private countdownTimer: any;  // référence setInterval

  // View toggles
  forgotMode = false;
  registerMode = false;
  resetSuccess = false;

  // Show/Hide password toggles
  public showPassword = false;
  public showRegPassword = false;
  public showRegConfirmPassword = false;

  // Password strength properties
  public passwordStrength = { score: 0, label: '', color: '#e2e8f0', width: '0%' };

  // Custom Dropdowns State (register form uniquement)
  public regRoleDropdownOpen = false;

  // ── CAPTCHA image local (actif après 2 échecs) — généré par le backend ─
  failedAttempts   = 0;      // Compteur de tentatives échouées
  showCaptcha      = false;  // Afficher le bloc double CAPTCHA
  captchaSessionId   = '';   // sessionId UUID retourné par le backend
  captchaImageBase64 = '';   // Image PNG en base64 retournée par le backend
  captchaCodeSaisi   = '';   // Code alphanumérique tapé par l'utilisateur
  captchaError       = false; // true si code local incorrect
  captchaLoading     = false; // true pendant le chargement de l'image

  // ── Google reCAPTCHA v2 ──────────────────────────────────────
  recaptchaToken   = '';     // Token Google reCAPTCHA v2 (callback onRecaptchaResolved)
  recaptchaValide  = false;  // true une fois que l'utilisateur a coché la case
  recaptchaError   = false;  // true si la validation reCAPTCHA a échoué
  private recaptchaWidgetId: number | null = null; // ID du widget rendu

  /** URL de l'API CAPTCHA locale */
  private readonly CAPTCHA_API = '/api/auth/captcha';

  /**
   * Charge un nouveau CAPTCHA depuis le backend Spring Boot.
   * Récupère sessionId + imageBase64.
   */
  loadCaptcha(): void {
    this.captchaLoading = true;
    this.captchaCodeSaisi = '';
    this.captchaError = false;
    this.http.get<{ sessionId: string; imageBase64: string }>(this.CAPTCHA_API).subscribe({
      next: (res) => {
        this.captchaSessionId   = res.sessionId;
        this.captchaImageBase64 = res.imageBase64;
        this.captchaLoading     = false;
        this.captchaError       = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du CAPTCHA:', err);
        this.captchaLoading = false;
        this.captchaError   = false;
      }
    });
  }

  /** Recharge un nouveau CAPTCHA (bouton refresh) */
  refreshCaptcha(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.captchaCodeSaisi = '';
    this.captchaError = false;
    this.loadCaptcha();
  }

  /** Réinitialise l'état complet CAPTCHA (local + reCAPTCHA) après une connexion réussie */
  resetCaptchaState(): void {
    this.showCaptcha       = false;
    this.captchaSessionId   = '';
    this.captchaImageBase64 = '';
    this.captchaCodeSaisi   = '';
    this.captchaError       = false;
    this.failedAttempts     = 0;
    // Réinitialiser Google reCAPTCHA v2
    this.recaptchaToken     = '';
    this.recaptchaValide    = false;
    this.recaptchaError     = false;
    this.recaptchaWidgetId  = null;
  }

  /** Vérifie que l'utilisateur a saisi un code ET coché le reCAPTCHA avant de soumettre */
  captchaValide(): boolean {
    // Vérification du code image local
    if (this.showCaptcha && !this.captchaCodeSaisi.trim()) {
      this.captchaError = true;
      return false;
    }
    // Vérification Google reCAPTCHA v2
    if (this.showCaptcha && !this.recaptchaValide) {
      this.recaptchaError = true;
      return false;
    }
    return true;
  }

  /** Callback appelé par le widget reCAPTCHA quand l'utilisateur coche la case */
  onRecaptchaResolved(token: string): void {
    this.recaptchaToken  = token;
    this.recaptchaValide = true;
    this.recaptchaError  = false;
  }

  /** Callback appelé par reCAPTCHA quand le token expire (2 minutes) */
  onRecaptchaExpired(): void {
    this.recaptchaToken  = '';
    this.recaptchaValide = false;
  }

  /**
   * Force le rendu du widget Google reCAPTCHA v2 après que *ngIf
   * ait injecté le conteneur dans le DOM.
   * - Premier affichage  → grecaptcha.render()
   * - Réaffichage        → grecaptcha.reset()  (évite l’erreur "already rendered")
   *
   * IMPORTANT : Les callbacks grecaptcha s’exécutent HORS de la zone Angular.
   * On les enveloppe dans ngZone.run() pour forcer la détection de changement.
   */
  private renderRecaptcha(): void {
    this.recaptchaToken  = '';
    this.recaptchaError  = false;
    // NE PAS réinitialiser recaptchaValide ici : on attend que le reset visuel soit fait

    // 600ms : laisse Angular terminer le cycle *ngIf et injecter le div dans le DOM
    setTimeout(() => {
      if (typeof grecaptcha === 'undefined') {
        console.warn('grecaptcha non chargé');
        return;
      }

      grecaptcha.ready(() => {
        // ── Cas 1 : un widget existe déjà → on le réinitialise ──
        if (this.recaptchaWidgetId !== null) {
          try {
            grecaptcha.reset(this.recaptchaWidgetId);
            // Reset Angular state après le reset visuel
            this.ngZone.run(() => {
              this.recaptchaValide = false;
              this.recaptchaToken  = '';
            });
            console.log('🔄 reCAPTCHA reset, widgetId=', this.recaptchaWidgetId);
          } catch (e) {
            console.warn('grecaptcha.reset() erreur:', e);
            this.recaptchaWidgetId = null; // Forcer un nouveau rendu
          }
          return;
        }

        // ── Cas 2 : premier rendu ──
        const container = document.getElementById('login-recaptcha-container');
        if (!container) {
          console.warn('Conteneur #login-recaptcha-container introuvable');
          return;
        }

        container.innerHTML = '';

        try {
          this.recaptchaWidgetId = grecaptcha.render(container, {
            sitekey           : '6Les43MtAAAAAJjpo3ETNwh5kxVsL74oZuTd7maC',
            // ⚠️ Les callbacks grecaptcha s’exécutent hors NgZone → ngZone.run() obligatoire
            callback          : (token: string) => this.ngZone.run(() => this.onRecaptchaResolved(token)),
            'expired-callback': ()              => this.ngZone.run(() => this.onRecaptchaExpired()),
            theme             : 'light'
          });
          console.log('✅ reCAPTCHA widget rendu, id=', this.recaptchaWidgetId);
        } catch (e: any) {
          console.error('Erreur grecaptcha.render():', e);
        }
      });
    }, 600);
  }

  selectRegRole(role: string): void {
    this.registerForm.patchValue({ role });
    this.regRoleDropdownOpen = false;
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'commercial': return 'Commercial';
      case 'comptable': return 'Comptable (Financier)';
      case 'stock': return 'Gestionnaire de Stock';
      default: return 'Choisir un role';
    }
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private fingerprintService: DeviceFingerprintService,
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      identifiant: ['', Validators.required],
      motDePasse: ['', Validators.required],
      rememberMe: [false]
    });

    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.registerForm = this.fb.group({
      nomUtilisateur: ['', [Validators.required, Validators.minLength(3)]],
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['commercial', Validators.required],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmerMotDePasse: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    // Appliquer le thème sauvegardé sur la page publique
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    const theme = prefs.themePreset || 'light';
    document.documentElement.setAttribute('data-theme-preset', theme);

    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.loginForm.patchValue({
        identifiant: savedUsername,
        rememberMe: true
      });
    }

    // Afficher le message de déconnexion forcée (ex: session ouverte ailleurs)
    this.route.queryParams.subscribe(params => {
      if (params['reason']) {
        this.sessionRevocationMsg = decodeURIComponent(params['reason']);
      }
      if (params['sigToken']) {
        this.sigToken = params['sigToken'];
      }
      // Pre-remplissage depuis inscription (reduction des erreurs de saisie)
      if (params['username']) {
        this.loginForm.patchValue({ identifiant: decodeURIComponent(params['username']) });
        this.successMsg = 'Compte cree avec succes ! Saisissez votre mot de passe pour continuer.';
      }
    });

    // Subscribe to password changes for strength calculation
    this.registerForm.get('motDePasse')?.valueChanges.subscribe(pwd => {
      this.updatePasswordStrength(pwd);
    });

    // ── Exposer les callbacks reCAPTCHA dans le scope global (window) ──────
    // Le widget g-recaptcha appelle ces fonctions via data-callback / data-expired-callback.
    // On les expose en les liant au contexte (this) du composant Angular.
    (window as any)['onAngularRecaptchaResolved'] = (token: string) => this.onRecaptchaResolved(token);
    (window as any)['onAngularRecaptchaExpired']  = ()              => this.onRecaptchaExpired();
  }


  updatePasswordStrength(pwd: string): void {
    if (!pwd) {
      this.passwordStrength = { score: 0, label: '', color: '#e2e8f0', width: '0%' };
      return;
    }

    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) {
      this.passwordStrength = { score, label: 'Faible 🔴', color: '#ef4444', width: '33%' };
    } else if (score <= 4) {
      this.passwordStrength = { score, label: 'Moyen 🟡', color: '#eab308', width: '66%' };
    } else {
      this.passwordStrength = { score, label: 'Fort 🟢', color: '#22c55e', width: '100%' };
    }
  }

  /** Détecte le type d'appareil à partir du User-Agent */
  private detecterTypeAppareil(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/.test(ua)) return 'Tablette';
    if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/.test(ua)) return 'Mobile';
    return 'PC';
  }

  /** Détecte le système d'exploitation */
  private detecterOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Inconnu';
  }

  /** Détecte le navigateur et sa version */
  private detecterNavigateur(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Edge ' + (ua.match(/Edg\/([\d.]+)/)?.[1] ?? '');
    if (ua.includes('Chrome/')) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/)?.[1] ?? '');
    if (ua.includes('Firefox/')) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/)?.[1] ?? '');
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
    return 'Inconnu';
  }

  private detecterTypeReseau(): string {
    // API navigator.connection (Chrome/Android, pas toujours disponible)
    const conn = (navigator as any).connection
      || (navigator as any).mozConnection
      || (navigator as any).webkitConnection;
    if (!conn) return 'Inconnu';
    if (conn.type === 'wifi') return 'Wi-Fi';
    if (conn.type === 'ethernet') return 'Ethernet';
    if (conn.type === 'cellular') {
      const eff = conn.effectiveType;
      if (eff === '4g') return '4G/5G';
      if (eff === '3g') return '3G';
      if (eff === '2g') return '2G';
      return 'Mobile';
    }
    // Fallback sur effectiveType
    if (conn.effectiveType === '4g') return 'Haut d\u00e9bit';
    return conn.type || 'Inconnu';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    // Valider le CAPTCHA si actif
    if (this.showCaptcha && !this.captchaValide()) {
      return; // captchaValide() affiche l'erreur et génère nouvelle question
    }

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.trialMessage = '';

    // Timeout de sécurité : si tout plante, débloquer le formulaire après 15s
    const safetyTimeout = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.errorMsg = 'La connexion a pris trop de temps. Vérifiez votre réseau et réessayez.';
      }
    }, 15000);

    // Génération du fingerprint (async) puis envoi
    this.fingerprintService.getFingerprint()
      .then(fingerprint => {
        clearTimeout(safetyTimeout);
        this.envoyerConnexion(fingerprint);
      })
      .catch(() => {
        clearTimeout(safetyTimeout);
        // Fallback : utiliser uniquement l'ID stable
        try {
          this.envoyerConnexion(this.fingerprintService.getStableDeviceId());
        } catch {
          this.loading = false;
          this.errorMsg = 'Erreur réseau. Veuillez réessayer.';
        }
      });
  }

  private envoyerConnexion(deviceFingerprint: string): void {
    // Collecte des informations appareil côté client
    const infoAppareil = {
      typeAppareil: this.detecterTypeAppareil(),
      os: this.detecterOS(),
      navigateur: this.detecterNavigateur(),
      resolution: `${screen.width}x${screen.height}`,
      langue: navigator.language || 'fr',
      fuseauHoraire: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Tunis',
      deviceFingerprint, // Empreinte numérique SHA-256
      typeReseau: this.detecterTypeReseau()  // Wi-Fi / 4G / Ethernet
    };

    const credentials = {
      identifiant: this.loginForm.value.identifiant,
      motDePasse: this.loginForm.value.motDePasse,
      // Double CAPTCHA — envoyé au backend si le bloc est visible
      ...(this.showCaptcha && this.captchaSessionId ? {
        captchaSessionId: this.captchaSessionId,
        captchaCode: this.captchaCodeSaisi.trim().toUpperCase(),
        recaptchaToken: this.recaptchaToken
      } : {}),
      ...infoAppareil
    };

    this.authService.login(credentials).subscribe({
      next: (user) => {
        // Connexion réussie — réinitialiser l'état CAPTCHA
        this.resetCaptchaState();

        // Handle Remember Me
        if (this.loginForm.value.rememberMe) {
          localStorage.setItem('rememberedUsername', this.loginForm.value.identifiant);
        } else {
          localStorage.removeItem('rememberedUsername');
        }

        // Forcer l'affichage de la modale a chaque connexion
        sessionStorage.removeItem('trialModalShownAt');

        const userRoles: string[] = user.roles || [];

        // Helper : verifier le role (avec ou sans prefixe ROLE_)
        const hasRole = (role: string) =>
          userRoles.includes('ROLE_' + role) || userRoles.includes(role);

        // ── 1. Redirection SUPERADMIN
        if (hasRole('SUPERADMIN')) {
          this.router.navigate(['/superadmin/dashboard']);
          return;
        }

        // ── 2. Changement de mot de passe obligatoire
        if ((user as any).doitChangerMotDePasse === true) {
          this.router.navigate(['/changer-mot-de-passe']);
          return;
        }

        // ── 3. Redirection automatique selon le role
        if (hasRole('CLIENT')) {
          // Les clients atterrissent sur le dashboard home
          this.router.navigate(['/dashboard/home']);
        } else {
          // Admin, commercial, comptable, stock → dashboard interne
          this.router.navigate(['/dashboard']);
        }


        // ── Mode Trial : afficher bannière ────────────────────────
        if (user.modeTrial && user.utilisationsRestantes !== null && user.utilisationsRestantes !== undefined) {
          const restant = user.utilisationsRestantes;
          this.trialCritique = restant <= 5;
          this.trialMessage = restant > 0
            ? `⚠️ Mode essai — Il vous reste ${restant} visite${restant > 1 ? 's' : ''} avant le blocage de l'accès à la plateforme.`
            : `🚨 C'est votre dernière visite avant le blocage de l'accès à la plateforme ! Veuillez activer votre abonnement.`;
          localStorage.setItem('trialMessage', this.trialMessage);
          localStorage.setItem('trialCritique', String(this.trialCritique));
        } else {
          localStorage.removeItem('trialMessage');
          localStorage.removeItem('trialCritique');
        }

      },

      error: (err) => {
        // TOUJOURS réinitialiser le loading en premier
        this.loading = false;

        // Incrémenter le compteur de tentatives échouées (sauf si rate-limited)
        if (err.status !== 429 && err.status !== 0) {
          this.failedAttempts++;

          // Le backend joint le CAPTCHA dans la réponse après 2 échecs
          const body = err.error || {};
          if (body.captchaRequired || body.captchaSessionId) {
            this.showCaptcha        = true;
            this.captchaSessionId   = body.captchaSessionId   || '';
            this.captchaImageBase64 = body.captchaImageBase64 || '';
            this.captchaCodeSaisi   = '';
            this.captchaError       = false;
            // Forcer le rendu du widget reCAPTCHA (réinitialise aussi le token)
            this.renderRecaptcha();
          } else if (this.showCaptcha) {
            // CAPTCHA déjà affiché — recharger une nouvelle image et re-rendre le widget
            this.loadCaptcha();
            this.renderRecaptcha();
          }
        }

        // Vider le champ mot de passe pour permettre de réessayer immédiatement
        this.loginForm.patchValue({ motDePasse: '' });

        console.error(err);

        // HTTP 402 = trial expiré → rediriger vers page de blocage
        if (err.status === 402) {
          localStorage.setItem('trialExpire', 'true');
          this.router.navigate(['/trial-expire']);
          return;
        }

        // HTTP 0 = pas de réseau ou backend éteint
        if (err.status === 0) {
          this.errorMsg = '⚠️ Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
          return;
        }

        // HTTP 429 = Rate Limiting — démarrer le compteur de déblocage
        if (err.status === 429) {
          this.errorMsg = '';
          this.startCountdown(5 * 60); // 5 minutes
          return;
        }

        // HTTP 401 = mauvais mot de passe ou compte bloqué
        if (err.status === 401) {
          const backendMsg = err.error?.message;
          const tentatives = err.error?.tentativesRestantes;
          if (typeof backendMsg === 'string' && backendMsg.length > 0) {
            this.errorMsg = backendMsg;
          } else {
            this.errorMsg = 'Identifiant ou mot de passe incorrect. Vérifiez vos informations et réessayez.';
          }
          if (tentatives !== undefined && tentatives !== null) {
            this.errorMsg += ` (${tentatives} tentative${tentatives > 1 ? 's' : ''} restante${tentatives > 1 ? 's' : ''})`;
          }
          // ⚠️ NE PAS appeler renderRecaptcha() ici — déjà géré par le handler générique (lignes ~503-515)
          // Un double appel causait : render → reset immédiat → widget réinitialisé avant interaction utilisateur
          return;
        }

        // HTTP 403 = Compte en attente / refuse / verrouille
        if (err.status === 403) {
          const msg = err.error?.message || '';
          if (msg.includes('EN_ATTENTE') || msg.toLowerCase().includes('attente')) {
            this.errorMsg = 'Votre compte est en attente de validation par un administrateur. Vous serez notifie par email.';
          } else if (msg.includes('VERROUILLE') || msg.toLowerCase().includes('verrouille')) {
            this.errorMsg = 'Votre compte a ete verrouille. Contactez votre administrateur.';
          } else if (msg.toLowerCase().includes('refu')) {
            this.errorMsg = 'Votre compte a ete refuse. Contactez votre administrateur.';
          } else {
            this.errorMsg = msg || 'Acces refuse. Contactez votre administrateur.';
          }
          return;
        }

        // Autres erreurs
        const backendMsg = err.error?.message || err.error;
        if (typeof backendMsg === 'string' && backendMsg.length > 0) {
          this.errorMsg = backendMsg;
        } else {
          this.errorMsg = 'Une erreur est survenue. Veuillez reessayer.';
        }
      }
    });
  }

  // ── Compteur de temps (Rate Limiting) ────────────────────────────────
  startCountdown(seconds: number): void {
    this.rateLimited = true;
    this.countdownSeconds = seconds;
    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  stopCountdown(): void {
    clearInterval(this.countdownTimer);
    this.rateLimited = false;
    this.countdownSeconds = 0;
  }

  get countdownFormatted(): string {
    const m = Math.floor(this.countdownSeconds / 60);
    const s = this.countdownSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownTimer);
    // Nettoyer les callbacks reCAPTCHA du scope global
    delete (window as any)['onAngularRecaptchaResolved'];
    delete (window as any)['onAngularRecaptchaExpired'];
  }


  toggleForgotMode(state: boolean): void {
    this.forgotMode = state;
    this.registerMode = false;
    this.resetSuccess = false;
    this.errorMsg = '';
    this.successMsg = '';
    this.resetForm.reset();
  }

  toggleRegisterMode(state: boolean): void {
    this.registerMode = state;
    this.forgotMode = false;
    this.errorMsg = '';
    this.successMsg = '';
    this.registerForm.reset({ role: 'commercial' });
  }

  onResetSubmit(): void {
    if (this.resetForm.invalid) return;

    this.loading = true;
    this.errorMsg = '';

    this.authService.requestPasswordReset(this.resetForm.value.email).subscribe({
      next: () => {
        this.loading = false;
        this.resetSuccess = true;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.errorMsg = err.error?.message || "Erreur d'envoi. Veuillez vérifier la configuration de votre serveur de messagerie SMTP.";
      }
    });
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const payload = {
      nomUtilisateur: this.registerForm.value.nomUtilisateur,
      prenom: this.registerForm.value.prenom,
      nom: this.registerForm.value.nom,
      email: this.registerForm.value.email,
      roles: [this.registerForm.value.role],
      motDePasse: this.registerForm.value.motDePasse
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMsg = "Votre compte a été créé avec succès ! Connectez-vous maintenant.";
        this.loginForm.patchValue({ nomUtilisateur: payload.nomUtilisateur });
        this.toggleRegisterMode(false);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.errorMsg = err.error?.message || "Une erreur est survenue lors de l'inscription.";
      }
    });
  }
}
