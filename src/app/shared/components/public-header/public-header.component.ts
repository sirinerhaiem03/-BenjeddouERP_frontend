import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';

type ThemePreset = 'light' | 'dark' | 'professional' | 'aqua';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  template: `
<header class="public-header">
  <div class="ph-inner">

    <!-- Logo -->
    <a routerLink="/" class="ph-logo">
      <span class="material-symbols-outlined ph-logo-icon">insights</span>
      <span class="ph-logo-text">BENJEDDOU <strong>ERP</strong></span>
    </a>

    <!-- Navigation centrale -->
    <nav class="ph-nav">
      <a routerLink="/"        class="ph-nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="material-symbols-outlined">home</span>Accueil
      </a>
      <a routerLink="/login"    class="ph-nav-link" routerLinkActive="active">
        <span class="material-symbols-outlined">login</span>Connexion
      </a>
      <a routerLink="/register" class="ph-nav-link ph-nav-cta" routerLinkActive="active">
        <span class="material-symbols-outlined">person_add</span>Inscription
      </a>
    </nav>

    <!-- Actions droite -->
    <div class="ph-actions">

      <!-- Thèmes -->
      <div class="ph-theme-group">
        <button *ngFor="let t of themes"
          class="ph-theme-btn"
          [class.active]="currentTheme === t.id"
          [title]="t.label"
          (click)="applyTheme(t.id)"
          [style.background]="currentTheme === t.id ? t.color : null">
          <span class="material-symbols-outlined">{{ t.icon }}</span>
        </button>
      </div>

      <!-- Langue -->
      <div class="ph-lang-wrap" (click)="langOpen=!langOpen" (clickOutside)="langOpen=false">
        <button class="ph-lang-btn">
          <span class="ph-flag">{{ currentLang === 'fr' ? '🇫🇷' : currentLang === 'en' ? '🇬🇧' : '🇸🇦' }}</span>
          <span class="material-symbols-outlined">expand_more</span>
        </button>
        <div class="ph-lang-menu" *ngIf="langOpen">
          <button (click)="setLang('fr')">🇫🇷 Français</button>
          <button (click)="setLang('en')">🇬🇧 English</button>
          <button (click)="setLang('ar')">🇸🇦 العربية</button>
        </div>
      </div>

    </div>
  </div>
</header>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host { display: block; }

    .public-header {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 1000;
      height: 60px;
      background: rgba(10, 14, 26, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      font-family: 'Inter', sans-serif;
    }

    .ph-inner {
      max-width: 1280px;
      margin: 0 auto;
      height: 100%;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 24px;
    }

    /* Logo */
    .ph-logo {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: #fff;
      font-size: 15px; font-weight: 600;
      flex-shrink: 0;
      letter-spacing: 0.3px;
    }
    .ph-logo-icon {
      font-size: 22px;
      color: var(--accent-color, #6366f1);
    }
    .ph-logo-text strong { color: var(--accent-color, #6366f1); }

    /* Nav */
    .ph-nav {
      display: flex; align-items: center; gap: 4px;
      flex: 1;
      justify-content: center;
    }
    .ph-nav-link {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px;
      text-decoration: none;
      color: rgba(255,255,255,0.7);
      font-size: 13.5px; font-weight: 500;
      transition: all .2s;
    }
    .ph-nav-link .material-symbols-outlined { font-size: 16px; }
    .ph-nav-link:hover, .ph-nav-link.active {
      color: #fff;
      background: rgba(255,255,255,0.08);
    }
    .ph-nav-cta {
      background: var(--accent-color, #6366f1) !important;
      color: #fff !important;
      font-weight: 600;
    }
    .ph-nav-cta:hover { opacity: 0.9; transform: translateY(-1px); }

    /* Actions */
    .ph-actions {
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }

    /* Theme buttons */
    .ph-theme-group {
      display: flex; gap: 4px;
    }
    .ph-theme-btn {
      width: 32px; height: 32px;
      border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.7);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all .2s;
      padding: 0;
    }
    .ph-theme-btn .material-symbols-outlined { font-size: 16px; }
    .ph-theme-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .ph-theme-btn.active { color: #fff; border-color: rgba(255,255,255,0.3); }

    /* Lang dropdown */
    .ph-lang-wrap { position: relative; }
    .ph-lang-btn {
      display: flex; align-items: center; gap: 4px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 6px 10px;
      color: #fff; cursor: pointer;
      font-size: 14px; transition: background .2s;
    }
    .ph-lang-btn:hover { background: rgba(255,255,255,0.12); }
    .ph-lang-btn .material-symbols-outlined { font-size: 16px; }
    .ph-lang-menu {
      position: absolute; top: calc(100% + 6px); right: 0;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; overflow: hidden;
      min-width: 140px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .ph-lang-menu button {
      display: block; width: 100%;
      padding: 10px 16px; text-align: left;
      background: none; border: none;
      color: rgba(255,255,255,0.85); cursor: pointer;
      font-size: 13px; transition: background .15s;
    }
    .ph-lang-menu button:hover { background: rgba(255,255,255,0.08); }

    @media (max-width: 640px) {
      .ph-nav-link span:not(.material-symbols-outlined) { display: none; }
      .ph-logo-text { display: none; }
      .ph-theme-group { display: none; }
    }
  `]
})
export class PublicHeaderComponent implements OnInit {

  currentTheme: ThemePreset = 'light';
  currentLang = 'fr';
  langOpen = false;

  themes = [
    { id: 'light' as ThemePreset,        label: 'Clair',         icon: 'light_mode',   color: '#f97316' },
    { id: 'dark' as ThemePreset,         label: 'Sombre',        icon: 'dark_mode',    color: '#6366f1' },
    { id: 'professional' as ThemePreset, label: 'Professionnel', icon: 'business',     color: '#c9a84c' },
    { id: 'aqua' as ThemePreset,         label: 'Aqua',          icon: 'water_drop',   color: '#06b6d4' },
  ];

  constructor(private langService: LanguageService) {}

  ngOnInit(): void {
    // Charger thème depuis localStorage (synchronisé avec le dashboard)
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    this.currentTheme = prefs.themePreset || 'light';
    this.currentLang  = this.langService.currentLang;
    this.applyTheme(this.currentTheme);
  }

  applyTheme(preset: ThemePreset): void {
    this.currentTheme = preset;
    document.documentElement.setAttribute('data-theme-preset', preset);

    // Couleurs correspondant aux presets
    const colors: Record<ThemePreset, { primary: string; accent: string }> = {
      light:        { primary: '#f97316', accent: '#f97316' },
      dark:         { primary: '#6366f1', accent: '#6366f1' },
      professional: { primary: '#c9a84c', accent: '#c9a84c' },
      aqua:         { primary: '#06b6d4', accent: '#06b6d4' },
    };
    const c = colors[preset];
    document.documentElement.style.setProperty('--accent-color', c.accent);
    document.documentElement.style.setProperty('--primary-color', c.primary);

    // Sauvegarder dans localStorage
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    prefs.themePreset = preset;
    localStorage.setItem('erp_user_prefs', JSON.stringify(prefs));
  }

  setLang(lang: string): void {
    this.currentLang = lang;
    this.langService.setLanguage(lang as any);
    this.langOpen = false;
  }
}
