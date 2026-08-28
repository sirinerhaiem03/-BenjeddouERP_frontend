import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PublicHeaderComponent } from '../../../shared/components/public-header/public-header.component';

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

  // 0 = Choix Mode (Trial / Paiement), 1 = Infos & Statut, 2 = OTP, 3 = KYC, 4 = Confirmation
  currentStep = 0;
  loading = false;
  showPass = false;
  showPassConfirm = false;
  globalError = '';
  globalSuccess = '';

  // Mode d'inscription choisi au Step 0
  modeTrial: boolean | null = null; // true = Essai gratuit 30 connexions, false = Paiement direct

  // Formulaire d'inscription unifié et dynamique
  form = {
    statutJuridique: 'ENTREPRISE' as 'ENTREPRISE' | 'INDIVIDU',

    // Champs Entreprise
    societe: '',
    matriculeFiscal: '',
    secteur: 'Commerce & Distribution',
    tailleEntreprise: '1 à 9 employés (Micro-entreprise)',

    // Champs Individu
    cin: '',
    activite: '',

    // Responsable / Compte administrateur
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    nomUtilisateur: '',
    motDePasse: '',
    confirmMotDePasse: ''
  };

  errors: any = {};

  // Menus déroulants personnalisés modernes
  secteurDropdownOpen = false;
  tailleDropdownOpen = false;

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
    'Autre'
  ];

  taillesEntreprise = [
    '1 à 9 employés (Micro-entreprise)',
    '10 à 49 employés (Petite entreprise)',
    '50 à 249 employés (Moyenne entreprise)',
    '250 à 999 employés (Grande entreprise)',
    '1000+ employés (Très grande entreprise)'
  ];

  // CGU
  cguAcceptees = true;
  cguError = false;

  // Indicateur force mot de passe
  get passwordStrength(): { score: number; label: string; color: string } {
    const pwd = this.form.motDePasse;
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
    return { score, label: labels[score] || '', color: colors[score] || '' };
  }

  // OTP
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpEnvoye = false;
  otpError = '';
  otpShake = false;
  devOtpCode: string | null = null;
  resendCountdown = 0;
  private countdownTimer: any;

  get otpCode(): string {
    return this.otpDigits.join('');
  }

  // KYC adapté dynamiquement au statut
  kycDocumentsEntreprise: KycDocument[] = [
    { type: 'REGISTRE_COMMERCE', labelKey: 'REGISTER.KYC_DOC_RC', icone: '🏢', obligatoire: true, fichier: null },
    { type: 'PATENTE', labelKey: 'REGISTER.KYC_DOC_PATENTE', icone: '📜', obligatoire: true, fichier: null },
    { type: 'CNI_GERANT', labelKey: 'REGISTER.KYC_DOC_CNI_GERANT', icone: '🪪', obligatoire: true, fichier: null },
    { type: 'JUSTIFICATIF_SIEGE', labelKey: 'REGISTER.KYC_DOC_JUSTIF_SIEGE', icone: '📍', obligatoire: false, fichier: null }
  ];

  kycDocumentsIndividu: KycDocument[] = [
    { type: 'CNI', labelKey: 'REGISTER.KYC_DOC_CNI', icone: '🪪', obligatoire: true, fichier: null },
    { type: 'JUSTIFICATIF_DOMICILE', labelKey: 'REGISTER.KYC_DOC_JUSTIF_DOM', icone: '🏠', obligatoire: true, fichier: null },
    { type: 'ATTESTATION_ACTIVITE', labelKey: 'REGISTER.KYC_DOC_ATTESTATION', icone: '📄', obligatoire: false, fichier: null }
  ];

  get kycDocuments(): KycDocument[] {
    return this.form.statutJuridique === 'ENTREPRISE'
      ? this.kycDocumentsEntreprise
      : this.kycDocumentsIndividu;
  }

  // Disponibilité temps réel
  usernameChecking = false;
  usernameAvailable: boolean | null = null;
  emailAvailable: boolean | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private translate: TranslateService,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    const theme = prefs.themePreset || 'light';
    document.documentElement.setAttribute('data-theme-preset', theme);
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  // Fermer les dropdowns personnalisés lors d'un clic à l'extérieur
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.secteurDropdownOpen = false;
      this.tailleDropdownOpen = false;
    }
  }

  toggleSecteurDropdown(event: Event): void {
    event.stopPropagation();
    this.secteurDropdownOpen = !this.secteurDropdownOpen;
    this.tailleDropdownOpen = false;
  }

  toggleTailleDropdown(event: Event): void {
    event.stopPropagation();
    this.tailleDropdownOpen = !this.tailleDropdownOpen;
    this.secteurDropdownOpen = false;
  }

  selectSecteur(s: string, event: Event): void {
    event.stopPropagation();
    this.form.secteur = s;
    this.secteurDropdownOpen = false;
  }

  selectTaille(t: string, event: Event): void {
    event.stopPropagation();
    this.form.tailleEntreprise = t;
    this.tailleDropdownOpen = false;
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }

  // Vérification disponibilité
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
  // ÉTAPE 0 : Choix Mode Inscription (Trial vs Frais)
  // ══════════════════════════════════════════════════════════════
  choisirModeTrial(trial: boolean): void {
    this.modeTrial = trial;
    this.currentStep = 1;
    this.globalError = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  changerStatut(statut: 'ENTREPRISE' | 'INDIVIDU'): void {
    this.form.statutJuridique = statut;
    this.errors = {};
    this.globalError = '';
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 1 : Validation formulaire et Envoi OTP
  // ══════════════════════════════════════════════════════════════
  etape1Suivant(): void {
    this.errors = {};
    this.globalError = '';

    const missingFields: string[] = [];

    // Validation selon statut
    if (this.form.statutJuridique === 'ENTREPRISE') {
      if (!this.form.societe.trim()) { this.errors.societe = 'Raison sociale requise'; missingFields.push('Raison sociale'); }
      if (!this.form.matriculeFiscal.trim()) { this.errors.matriculeFiscal = 'Matricule fiscal / RC requis'; missingFields.push('Matricule Fiscal'); }
      if (!this.form.adresse.trim()) { this.errors.adresse = 'Adresse requise'; missingFields.push('Adresse du siège'); }
      if (!this.form.prenom.trim()) { this.errors.prenom = 'Prénom requis'; missingFields.push('Prénom du gérant'); }
      if (!this.form.nom.trim()) { this.errors.nom = 'Nom requis'; missingFields.push('Nom du gérant'); }
    } else {
      if (!this.form.prenom.trim()) { this.errors.prenom = 'Prénom requis'; missingFields.push('Prénom'); }
      if (!this.form.nom.trim()) { this.errors.nom = 'Nom requis'; missingFields.push('Nom'); }
      if (!this.form.cin.trim()) { this.errors.cin = 'N° CIN requis'; missingFields.push('N° CIN'); }
      if (!this.form.activite.trim()) { this.errors.activite = 'Activité requise'; missingFields.push('Activité / Métier'); }
      if (!this.form.adresse.trim()) { this.errors.adresse = 'Adresse requise'; missingFields.push('Adresse personnelle'); }
    }

    if (!this.form.telephone.trim()) { this.errors.telephone = 'Téléphone requis'; missingFields.push('Téléphone'); }
    if (!this.form.nomUtilisateur.trim()) { this.errors.nomUtilisateur = 'Identifiant requis'; missingFields.push('Nom d\'utilisateur'); }
    if (!this.form.email.trim()) { this.errors.email = 'Email requis'; missingFields.push('Email'); }
    if (!this.form.motDePasse) { this.errors.motDePasse = 'Mot de passe requis'; missingFields.push('Mot de passe'); }
    else if (this.form.motDePasse.length < 6) { this.errors.motDePasse = '6 caractères minimum'; missingFields.push('Mot de passe (min 6 car.)'); }
    if (this.form.motDePasse && this.form.motDePasse !== this.form.confirmMotDePasse) {
      this.errors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
      missingFields.push('Confirmation mot de passe');
    }

    // Validation CGU
    if (!this.cguAcceptees) {
      this.cguError = true;
      this.globalError = 'Veuillez cocher la case d\'acceptation des CGU pour continuer.';
      return;
    }
    this.cguError = false;

    // Si des champs obligatoires sont manquants, alerter clairement
    if (missingFields.length > 0) {
      this.globalError = 'Veuillez renseigner les champs obligatoires suivants : ' + missingFields.join(', ');
      // Faire défiler vers le premier champ en erreur
      setTimeout(() => {
        const premierErreur = document.querySelector('.form-input.input-error, .field-error');
        if (premierErreur) {
          premierErreur.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    this.loading = true;
    const displayName = this.form.statutJuridique === 'ENTREPRISE'
      ? (this.form.societe || this.form.prenom)
      : this.form.prenom;

    // Envoi OTP au backend
    this.http.post<any>(`${this.apiUrl}/otp/envoyer`, {
      email: this.form.email,
      prenom: displayName
    }).subscribe({
      next: () => {
        this.loading = false;
        this.otpEnvoye = true;
        this.currentStep = 2; // → Étape OTP
        this.otpDigits = ['', '', '', '', '', '']; // Toujours vide, l'utilisateur tape son code
        this.demarrerCountdown();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => document.getElementById('otp-0')?.focus(), 200);
      },
      error: (err: any) => {
        this.loading = false;
        this.globalError = err?.error?.message || err?.error || 'Erreur lors de l\'envoi du code OTP. Veuillez vérifier votre adresse email.';
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 2 : Vérification OTP & Création Compte
  // ══════════════════════════════════════════════════════════════
  etape2VerifierOtp(): void {
    this.otpError = '';
    this.otpShake = false;

    if (this.otpCode.length < 6) {
      this.otpError = 'Veuillez saisir le code complet à 6 chiffres.';
      return;
    }

    this.loading = true;

    this.http.post<any>(`${this.apiUrl}/otp/verifier`, {
      email: this.form.email,
      code: this.otpCode
    }).subscribe({
      next: () => {
        this.loading = false;
        this.inscrireCompte();
      },
      error: () => {
        // Si code dev match ou si offline
        if (this.devOtpCode && this.otpCode === this.devOtpCode) {
          this.loading = false;
          this.inscrireCompte();
        } else {
          this.loading = false;
          this.otpError = 'Code OTP incorrect ou expiré. Veuillez vérifier votre code.';
          this.otpShake = true;
          setTimeout(() => (this.otpShake = false), 600);
        }
      }
    });
  }

  private inscrireCompte(): void {
    const payload = {
      statutJuridique: this.form.statutJuridique,
      societe: this.form.statutJuridique === 'ENTREPRISE' ? this.form.societe : `${this.form.prenom} ${this.form.nom}`,
      matriculeFiscal: this.form.matriculeFiscal,
      secteur: this.form.secteur,
      tailleEntreprise: this.form.tailleEntreprise,
      cin: this.form.cin,
      activite: this.form.activite,
      prenom: this.form.prenom,
      nom: this.form.nom,
      telephone: this.form.telephone,
      email: this.form.email,
      adresse: this.form.adresse,
      nomUtilisateur: this.form.nomUtilisateur,
      motDePasse: this.form.motDePasse,
      modeTrial: this.modeTrial === true
    };

    this.loading = true;
    this.http.post<any>(`${this.apiUrl}/register`, payload).subscribe({
      next: () => {
        this.loading = false;
        if (this.modeTrial === true) {
          this.currentStep = 4; // Succès Trial immédiat
        } else {
          this.currentStep = 3; // KYC requis
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || err?.error || 'Erreur lors de la création du compte.';
        if (msg.toLowerCase().includes('utilisateur') || msg.toLowerCase().includes('username')) {
          this.errors.nomUtilisateur = msg;
          this.currentStep = 1;
          this.globalError = msg;
          this.usernameAvailable = false;
        } else if (msg.toLowerCase().includes('email')) {
          this.errors.email = msg;
          this.currentStep = 1;
          this.globalError = msg;
          this.emailAvailable = false;
        } else {
          this.otpError = '⚠️ ' + msg;
        }
      }
    });
  }

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
        this.otpEnvoye = true;
        this.otpDigits = ['', '', '', '', '', ''];
        this.demarrerCountdown();
        setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.otpError = err?.error?.message || err?.error || 'Erreur lors du renvoi du code OTP.';
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

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    if (val && /^[0-9]$/.test(val)) {
      this.otpDigits[index] = val;
      if (index < 5) {
        setTimeout(() => {
          const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
          if (next) { next.focus(); next.select(); }
        }, 0);
      }
    } else if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, i) => { this.otpDigits[i] = d; });
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.otpDigits[index]) {
        this.otpDigits[index] = '';
      } else if (index > 0) {
        event.preventDefault();
        this.otpDigits[index - 1] = '';
        setTimeout(() => {
          const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
          if (prev) { prev.value = ''; prev.focus(); }
        }, 0);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ÉTAPE 3 : Upload KYC
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

  retirerDoc(event: Event, doc: KycDocument): void {
    event.stopPropagation();
    doc.fichier = null;
  }

  etape3Soumettre(): void {
    this.globalError = '';
    const docsObligatoires = this.kycDocuments.filter(d => d.obligatoire && !d.fichier);
    if (docsObligatoires.length > 0) {
      this.globalError = 'Veuillez téléverser tous les justificatifs obligatoires.';
      return;
    }

    const docsAUploader = this.kycDocuments.filter(d => d.fichier !== null);
    if (docsAUploader.length === 0) {
      this.globalError = 'Veuillez déposer au moins un document justificatif.';
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
        next: () => {
          uploaded++;
          if (uploaded === docsAUploader.length) {
            this.loading = false;
            this.currentStep = 4;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
        error: () => {
          uploaded++;
          if (uploaded === docsAUploader.length) {
            this.loading = false;
            this.currentStep = 4;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });
    });
  }
}
