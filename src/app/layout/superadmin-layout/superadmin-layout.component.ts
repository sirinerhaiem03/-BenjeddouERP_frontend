import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';

import { AiService } from '../../core/services/ai.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-superadmin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  templateUrl: './superadmin-layout.component.html',
  styleUrls: ['./superadmin-layout.component.css']
})
export class SuperadminLayoutComponent implements OnInit {
  sidebarOpen = true;
  currentUser: any;
  currentTime = new Date();
  isDarkMode = true; // SuperAdmin commence en sombre par défaut
  currentLang = 'fr';
  langMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    public langService: LanguageService,
    public aiService: AiService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr');
    const lang = this.langService.currentLang || 'fr';
    this.translate.use(lang);
    this.currentLang = lang;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    setInterval(() => this.currentTime = new Date(), 60000);

    // Lire le thème sauvegardé
    try {
      const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
      const preset: string = prefs.themePreset || 'light';
      this.isDarkMode = preset !== 'light';
      this._applyTheme(preset);
    } catch { this._applyTheme('light'); }
  }

  /** Bascule clair ↔ sombre */
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const preset = this.isDarkMode ? 'dark' : 'light';
    this._applyTheme(preset);
    // Persister la préférence
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    prefs.themePreset = preset;
    localStorage.setItem('erp_user_prefs', JSON.stringify(prefs));
  }

  private _applyTheme(preset: string): void {
    if (preset !== 'light') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.documentElement.setAttribute('data-theme-preset', preset);
  }

  /** Couleur de sidebar selon le mode */
  get sidebarBg(): string {
    return this.isDarkMode
      ? 'linear-gradient(180deg, #13072e 0%, #1a0a3d 50%, #0d0520 100%)'
      : 'linear-gradient(180deg, #faf8ff 0%, #f5f0ff 60%, #ede9fe 100%)';
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth < 992) this.sidebarOpen = false;
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  toggleLangMenu(): void { this.langMenuOpen = !this.langMenuOpen; }

  switchLanguage(lang: 'fr' | 'en' | 'ar'): void {
    this.currentLang = lang;
    this.langService.setLanguage(lang);
    this.langMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userName(): string {
    return this.currentUser?.prenom + ' ' + this.currentUser?.nom || 'Super Admin';
  }

  get userInitial(): string {
    return (this.currentUser?.prenom?.[0] || 'S').toUpperCase();
  }
}
