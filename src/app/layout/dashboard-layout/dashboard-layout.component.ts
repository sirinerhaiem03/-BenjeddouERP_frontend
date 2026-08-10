import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { StockService } from '../../core/services/stock.service';
import { LanguageService } from '../../core/services/language.service';
import { TrialBannerComponent } from '../../shared/trial-banner/trial-banner.component';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';
import { trigger, transition, style, animate } from '@angular/animations';

import { NotificationService, AppNotification } from '../../core/services/notification.service';

export type ThemePreset = 'light' | 'dark' | 'professional' | 'aqua';
export type LogoutPosition = 'both' | 'sidebar' | 'header';
export type SidebarPosition = 'left' | 'right';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, TrialBannerComponent, GlobalSearchComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css'],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(6px)' }))
      ])
    ])
  ]
})
export class DashboardLayoutComponent implements OnInit {
  user: any = null;
  sidebarOpen = true;
  langMenuOpen = false;
  userMenuOpen = false;
  notifMenuOpen = false;
  notifFilter: 'all' | 'stock' | 'commercial' | 'facture' = 'all';
  avatarPickerOpen = false;
  settingsPanelOpen = false;
  currentLang = 'fr';
  isDarkMode = false;

  // ── Prefs utilisateur ──────────────────────────────
  activeThemePreset: ThemePreset = 'light';
  logoutPosition: LogoutPosition = 'both';
  sidebarPosition: SidebarPosition = 'left';
  animationsEnabled = true;

  // ── Avatar ─────────────────────────────────────────
  selectedAvatar: string | null = null;  // URL base64 ou emoji avatar
  avatarMode: 'initials' | 'preset' | 'photo' = 'initials';

  // 12 avatars prédéfinis (emoji + couleur bg)
  presetAvatars = [
    { id: 'av1', emoji: '🧑‍💼', bg: '#6366f1' },
    { id: 'av2', emoji: '👩‍💻', bg: '#8b5cf6' },
    { id: 'av3', emoji: '🧑‍🔬', bg: '#06b6d4' },
    { id: 'av4', emoji: '👨‍🎨', bg: '#10b981' },
    { id: 'av5', emoji: '🦸', bg: '#f59e0b' },
    { id: 'av6', emoji: '🧑‍🚀', bg: '#ef4444' },
    { id: 'av7', emoji: '👩‍🏫', bg: '#ec4899' },
    { id: 'av8', emoji: '🧑‍⚕️', bg: '#14b8a6' },
    { id: 'av9', emoji: '👨‍🍳', bg: '#f97316' },
    { id: 'av10', emoji: '🦉', bg: '#0ea5e9' },
    { id: 'av11', emoji: '🐉', bg: '#a855f7' },
    { id: 'av12', emoji: '⚡', bg: '#22c55e' },
  ];
  selectedPresetId: string | null = null;

  // ── Stock alerts ───────────────────────────────────
  alertCount = 0;
  alertProducts: any[] = [];
  showToast = false;
  toastMessage = '';

  // ── Trial alerte ───────────────────────────────────
  showTrialLogoutModal = false;

  // ── User bottom menu (style ChatGPT) ─────────────────
  userBottomMenuOpen = false;

  toggleUserBottomMenu(): void {
    this.userBottomMenuOpen = !this.userBottomMenuOpen;
    // Fermer les autres menus ouverts
    if (this.userBottomMenuOpen) {
      this.userMenuOpen = false;
      this.langMenuOpen = false;
    }
  }

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private translate: TranslateService,
    private langService: LanguageService,
    private router: Router,
    private stockService: StockService,
    public notificationService: NotificationService
  ) {
    this.currentLang = this.langService.currentLang;
  }

  toggleNotifMenu(): void {
    this.notifMenuOpen = !this.notifMenuOpen;
    if (this.notifMenuOpen) {
      this.userMenuOpen = false;
      this.langMenuOpen = false;
      this.userBottomMenuOpen = false;
    }
  }

  get filteredNotifications(): AppNotification[] {
    const list = this.notificationService['notificationsSubject'].value;
    if (this.notifFilter === 'all') return list;
    return list.filter((n: AppNotification) => n.type === this.notifFilter);
  }

  onNotifClick(notif: AppNotification): void {
    this.notifMenuOpen = false;
    this.notificationService.navigateTo(notif);
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.isDarkMode = this.themeService.isDark;

    // Charger prefs depuis localStorage
    this.loadUserPrefs();

    // Appliquer thème preset
    this.applyThemePreset(this.activeThemePreset);

    // Calculer les props dérivées UNE SEULE FOIS (pas de getters dans le template)
    this.refreshAvatarDisplay();
    this._computeRoleFlags();

    // Stock alerts
    const roles = this.authService.getUserRoles();
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_STOCK') || roles.includes('ROLE_COMMERCIAL')) {
      this.loadStockAlerts();
    }
  }

  /** Calcule les flags de rôle une seule fois au lieu d'utiliser des getters */
  private _computeRoleFlags(): void {
    const roles = this.authService.getUserRoles();
    const rolesInternes = ['ROLE_ADMIN', 'ROLE_SUPERADMIN', 'ROLE_STOCK', 'ROLE_COMMERCIAL', 'ROLE_COMPTABLE'];
    this.isStockRole = roles.includes('ROLE_STOCK') && !roles.includes('ROLE_ADMIN');
    this.isClientRole = roles.includes('ROLE_CLIENT') || roles.includes('CLIENT');
    this.isTrialUser = !!(this.user?.modeTrial) && !roles.some(r => rolesInternes.includes(r));
    const msg = localStorage.getItem('trialMessage');
    if (msg) {
      const match = msg.match(/(\d+) utilisation/);
      this.trialRestant = match ? parseInt(match[1]) : 0;
    }
    this.showLogoutInSidebar = this.logoutPosition === 'sidebar' || this.logoutPosition === 'both';
    this.showLogoutInHeader = this.logoutPosition === 'header' || this.logoutPosition === 'both';
  }

  // ──────────────────────────────────────────────────────────────
  //  PREFS
  // ──────────────────────────────────────────────────────────────
  loadUserPrefs(): void {
    const prefs = localStorage.getItem('erp_user_prefs');
    if (prefs) {
      const p = JSON.parse(prefs);
      this.activeThemePreset = p.themePreset || 'light';
      this.logoutPosition = p.logoutPosition || 'both';
      this.sidebarPosition = p.sidebarPosition || 'left';
      this.animationsEnabled = p.animationsEnabled !== false;
      this.selectedAvatar = p.avatarUrl || null;
      this.avatarMode = p.avatarMode || 'initials';
      this.selectedPresetId = p.selectedPresetId || null;
    }
  }

  saveUserPrefs(): void {
    const prefs = {
      themePreset: this.activeThemePreset,
      logoutPosition: this.logoutPosition,
      sidebarPosition: this.sidebarPosition,
      animationsEnabled: this.animationsEnabled,
      avatarUrl: this.selectedAvatar,
      avatarMode: this.avatarMode,
      selectedPresetId: this.selectedPresetId,
    };
    localStorage.setItem('erp_user_prefs', JSON.stringify(prefs));
  }

  // ──────────────────────────────────────────────────────────────
  //  THEMES PRESETS (propriété constante — PAS de getter)
  // ──────────────────────────────────────────────────────────────
  readonly themePresets: { id: ThemePreset; label: string; icon: string; primaryColor: string; sidebarColor: string; accentColor: string }[] = [
    { id: 'light', label: 'Clair', icon: 'light_mode', primaryColor: '#f97316', sidebarColor: '#0f172a', accentColor: '#f97316' },
    { id: 'dark', label: 'Sombre', icon: 'dark_mode', primaryColor: '#6366f1', sidebarColor: '#1e1b4b', accentColor: '#818cf8' },
    { id: 'professional', label: 'Professionnel', icon: 'business', primaryColor: '#c9a84c', sidebarColor: '#0d1b2a', accentColor: '#c9a84c' },
    { id: 'aqua', label: 'Aqua Océan', icon: 'water_drop', primaryColor: '#06b6d4', sidebarColor: '#0a3d3a', accentColor: '#10b981' },
  ];


  applyThemePreset(preset: ThemePreset): void {
    const p = this.themePresets.find(t => t.id === preset);
    if (!p) return;
    this.activeThemePreset = preset;
    document.documentElement.setAttribute('data-theme-preset', preset);

    // 'light' = mode clair, tous les autres = mode sombre
    const isDark = preset !== 'light';

    this.themeService.applyPreset({
      primaryColor: p.primaryColor,
      sidebarColor: p.sidebarColor,
      darkMode: isDark,
    });
    this.isDarkMode = isDark;
    this.saveUserPrefs();
  }

  // ──────────────────────────────────────────────────────────────
  //  AVATAR
  // ──────────────────────────────────────────────────────────────
  // avatarDisplay — propriété simple mise à jour manuellement
  avatarDisplay: { type: 'initials' | 'emoji' | 'photo'; value: string; bg?: string } = { type: 'initials', value: 'U' };

  private refreshAvatarDisplay(): void {
    if (this.avatarMode === 'photo' && this.selectedAvatar) {
      this.avatarDisplay = { type: 'photo', value: this.selectedAvatar };
    } else if (this.avatarMode === 'preset' && this.selectedPresetId) {
      const av = this.presetAvatars.find(a => a.id === this.selectedPresetId);
      this.avatarDisplay = av ? { type: 'emoji', value: av.emoji, bg: av.bg } : { type: 'initials', value: this.getUserInitials() };
    } else {
      this.avatarDisplay = { type: 'initials', value: this.getUserInitials() };
    }
  }

  getUserInitials(): string {
    if (!this.user) return 'U';
    const p = this.user.prenom?.charAt(0) || '';
    const n = this.user.nom?.charAt(0) || '';
    return (p + n).toUpperCase() || 'U';
  }

  selectPresetAvatar(av: any): void {
    this.selectedPresetId = av.id;
    this.avatarMode = 'preset';
    this.selectedAvatar = null;
    this.avatarPickerOpen = false;
    this.refreshAvatarDisplay();
    this.saveUserPrefs();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedAvatar = e.target?.result as string;
      this.avatarMode = 'photo';
      this.selectedPresetId = null;
      this.avatarPickerOpen = false;
      this.refreshAvatarDisplay();
      this.saveUserPrefs();
    };
    reader.readAsDataURL(file);
  }

  resetAvatar(): void {
    this.selectedAvatar = null;
    this.avatarMode = 'initials';
    this.selectedPresetId = null;
    this.refreshAvatarDisplay();
    this.saveUserPrefs();
  }

  // ──────────────────────────────────────────────────────────────
  //  EXPORT / IMPORT
  // ──────────────────────────────────────────────────────────────
  exportData(): void {
    const data = {
      exportDate: new Date().toISOString(),
      utilisateur: {
        nom: this.user?.nom,
        prenom: this.user?.prenom,
        email: this.user?.email,
        roles: this.user?.roles,
      },
      preferences: JSON.parse(localStorage.getItem('erp_user_prefs') || '{}'),
      theme: this.themeService.currentTheme,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benjeddou-erp-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.userMenuOpen = false;
  }

  importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.preferences) {
          localStorage.setItem('erp_user_prefs', JSON.stringify(data.preferences));
          this.loadUserPrefs();
          this.applyThemePreset(this.activeThemePreset);
        }
        alert('✅ Données importées avec succès !');
      } catch {
        alert('❌ Fichier invalide.');
      }
    };
    reader.readAsText(file);
  }

  // ──────────────────────────────────────────────────────────────
  //  LOGOUT avec alerte Trial
  // ──────────────────────────────────────────────────────────────
  onLogout(): void {
    // RÈGLE 1 : jamais de modal pour les rôles internes — vérification DIRECTE
    const isAdminOrInternal = this.hasRole('ROLE_ADMIN')
      || this.hasRole('ROLE_SUPERADMIN')
      || this.hasRole('ROLE_STOCK')
      || this.hasRole('ROLE_COMMERCIAL')
      || this.hasRole('ROLE_COMPTABLE');

    if (isAdminOrInternal) {
      // Rôle interne → déconnexion directe, AUCUNE modal
      this.doLogout();
      return;
    }

    // RÈGLE 2 : afficher la modal UNIQUEMENT pour les clients trial avec < 5 connexions restantes
    const restant = this.trialRestant;
    if (this.isTrialUser && restant > 0 && restant < 5) {
      this.showTrialLogoutModal = true;
      this.userMenuOpen = false;
      return;
    }

    this.doLogout();
  }

  doLogout(): void {
    this.showTrialLogoutModal = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  logoutAndExport(): void {
    this.exportData();
    setTimeout(() => this.doLogout(), 800);
  }

  // ──────────────────────────────────────────────────────────────
  //  SIDEBAR & NAVIGATION
  // ──────────────────────────────────────────────────────────────
  openGroups: Record<string, boolean> = {};

  toggleGroup(group: string): void {
    this.openGroups[group] = !this.openGroups[group];
  }

  isGroupOpen(group: string): boolean {
    return !!this.openGroups[group];
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // ──────────────────────────────────────────────────────────────
  //  MENUS HEADER
  // ──────────────────────────────────────────────────────────────
  toggleLangMenu(): void {
    this.langMenuOpen = !this.langMenuOpen;
    this.userMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    this.langMenuOpen = false;
    this.avatarPickerOpen = false;
  }

  toggleAvatarPicker(): void {
    this.avatarPickerOpen = !this.avatarPickerOpen;
  }

  toggleSettingsPanel(): void {
    this.settingsPanelOpen = !this.settingsPanelOpen;
    this.userMenuOpen = false;
  }

  switchLanguage(lang: string): void {
    this.langService.setLanguage(lang as any);
    this.currentLang = lang;
    this.langMenuOpen = false;
    this.settingsPanelOpen = false;
    // Auto RTL pour arabe
    if (lang === 'ar') {
      this.sidebarPosition = 'right';
    } else if (this.sidebarPosition === 'right') {
      this.sidebarPosition = 'left';
    }
    this.saveUserPrefs();
  }

  // ──────────────────────────────────────────────────────────────
  //  PARAMÈTRES
  // ──────────────────────────────────────────────────────────────
  setLogoutPosition(pos: LogoutPosition): void {
    this.logoutPosition = pos;
    this.saveUserPrefs();
  }

  setSidebarPosition(pos: SidebarPosition): void {
    this.sidebarPosition = pos;
    this.saveUserPrefs();
  }

  toggleAnimations(): void {
    this.animationsEnabled = !this.animationsEnabled;
    document.documentElement.classList.toggle('no-animations', !this.animationsEnabled);
    this.saveUserPrefs();
  }

  // ──────────────────────────────────────────────────────────────
  //  COMPUTED PROPS
  // ──────────────────────────────────────────────────────────────
  // Propriétés de rôle — calculées une fois au ngOnInit
  showLogoutInSidebar = true;
  showLogoutInHeader = true;
  isTrialUser = false;
  trialRestant = 0;
  isStockRole = false;
  isClientRole = false;

  // ─ Méthodes utilitaires rôle ───────────────────────────────────
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  getRoleLabel(): string {
    if (!this.user || !this.user.roles || this.user.roles.length === 0) return 'Utilisateur';
    const primaryRole = this.user.roles[0];
    switch (primaryRole) {
      case 'ROLE_ADMIN': return 'Administrateur';
      case 'ROLE_COMMERCIAL': return 'Commercial';
      case 'ROLE_COMPTABLE': return 'Financier / Comptable';
      case 'ROLE_STOCK': return 'Gestionnaire Stock';
      case 'ROLE_CLIENT': return 'Client ERP';
      case 'CLIENT': return 'Client ERP';
      default: return 'Utilisateur';
    }
  }

  getRoleBadgeClass(): string {
    if (!this.user?.roles?.length) return 'role-badge-default';
    switch (this.user.roles[0]) {
      case 'ROLE_ADMIN': return 'role-badge-admin';
      case 'ROLE_COMMERCIAL': return 'role-badge-commercial';
      case 'ROLE_COMPTABLE': return 'role-badge-finance';
      case 'ROLE_STOCK': return 'role-badge-stock';
      case 'ROLE_CLIENT': return 'role-badge-client';
      default: return 'role-badge-default';
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  STOCK ALERTS
  // ──────────────────────────────────────────────────────────────
  loadStockAlerts(): void {
    this.stockService.getProductAlerts().subscribe({
      next: (alerts) => {
        this.alertProducts = alerts;
        this.alertCount = alerts.length;
        if (this.alertCount > 0) {
          this.toastMessage = `⚠️ ${this.alertCount} produit${this.alertCount > 1 ? 's' : ''} en rupture ou seuil critique !`;
          this.showToast = true;
          setTimeout(() => { this.showToast = false; }, 6000);
        }
      },
      error: () => { }
    });
  }

  dismissToast(): void { this.showToast = false; }

  navigateToProfil(): void {
    this.userBottomMenuOpen = false;
    this.router.navigate(['/dashboard/mon-profil']);
  }

  showCentreAide(): void {
    this.userBottomMenuOpen = false;
    this.toastMessage = '❓ Centre d\'aide — Contactez votre administrateur ou consultez la documentation.';
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 5000);
  }

  goToAbonnement(): void { this.router.navigate(['/abonnement']); }

  // Fermer les menus si clic extérieur
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper') && !target.closest('.user-profile-trigger')) {
      this.userMenuOpen = false;
      this.langMenuOpen = false;
    }
    if (!target.closest('.avatar-picker-panel') && !target.closest('[data-avatar-trigger]')) {
      this.avatarPickerOpen = false;
    }
    if (!target.closest('.settings-panel') && !target.closest('[data-settings-trigger]')) {
      this.settingsPanelOpen = false;
    }
    // Fermer le menu utilisateur bas si clic en dehors
    if (!target.closest('.sidebar-user-card') && !target.closest('.user-bottom-menu')) {
      this.userBottomMenuOpen = false;
    }
  }
}
