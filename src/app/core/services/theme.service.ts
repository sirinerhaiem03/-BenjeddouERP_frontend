import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

const API_URL = 'http://localhost:9090/api/theme';

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: boolean;
  compactMode: boolean;
  logoText: string;
  iconSet: 'outlined' | 'rounded' | 'sharp';
  logoUrl: string;
  visibleModules: string;
  updatedBy?: string;
  updatedAt?: string;
}

const ICON_SET_URLS: Record<string, string> = {
  outlined: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
  rounded:  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
  sharp:    'https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
};

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#f97316',
  accentColor: '#a855f7',
  sidebarColor: '#0f172a',
  fontFamily: 'Inter, sans-serif',
  borderRadius: '12px',
  darkMode: false,       // ← Thème CLAIR par défaut (exigé par l'encadrant)
  compactMode: false,
  logoText: 'BENJEDDOU ERP',
  iconSet: 'outlined',
  logoUrl: '',
  visibleModules: '[]',
};

/**
 * ThemeService — Charge le theme depuis le backend et l'applique globalement via CSS Custom Properties.
 *
 * Utilisé par :
 * 1. APP_INITIALIZER (app.config.ts) → charge le theme au demarrage pour TOUS les utilisateurs
 * 2. SaThemingComponent → sauvegarde en BDD + applique live
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  private _currentTheme: ThemeConfig = { ...DEFAULT_THEME };

  constructor(private http: HttpClient) {
    // Application immédiate du thème sauvegardé (localStorage)
    // → Empêche le flash sombre au démarrage avant que HTTP ne réponde
    this.initFromLocalStorage();
  }

  /**
   * Lit le préférence de thème dans localStorage et l'applique immédiatement.
   * Appelé dans le constructeur pour éviter tout flash visuel (FOUC).
   */
  initFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem('erp_user_prefs');
      const prefs = raw ? JSON.parse(raw) : {};
      const preset: string = prefs.themePreset || 'light';

      // Appliquer l'attribut data-theme immédiatement
      const isDark = preset !== 'light';
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      document.documentElement.setAttribute('data-theme-preset', preset);

      // Mettre à jour le modèle interne
      this._currentTheme = { ...DEFAULT_THEME, darkMode: isDark };
    } catch {
      // Pas de localStorage ou parse error → thème clair par défaut
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.setAttribute('data-theme-preset', 'light');
    }
  }

  get currentTheme(): ThemeConfig {
    return this._currentTheme;
  }

  /**
   * Charge le theme depuis le backend et l'applique.
   * Appele par APP_INITIALIZER au demarrage.
   */
  loadAndApply(): Observable<ThemeConfig> {
    return this.http.get<ThemeConfig>(`${API_URL}/current`).pipe(
      tap(theme => {
        this._currentTheme = { ...DEFAULT_THEME, ...theme };
        this.applyCssVars(this._currentTheme);
        this.applyIconSet(this._currentTheme.iconSet);
        this.applyFontFamily(this._currentTheme.fontFamily);
      }),
      catchError(err => {
        // En cas d'erreur (backend eteint), utiliser le theme par defaut
        console.warn('[ThemeService] Backend indisponible, theme par defaut applique', err);
        this.applyCssVars(DEFAULT_THEME);
        return of(DEFAULT_THEME);
      })
    );
  }

  /**
   * Sauvegarde le theme en base de donnees (appel SuperAdmin).
   */
  saveTheme(theme: ThemeConfig): Observable<{success: boolean; message: string; theme: ThemeConfig}> {
    return this.http.post<{success: boolean; message: string; theme: ThemeConfig}>(
      `${API_URL}/save`, theme, { headers: this.buildHeaders() }
    ).pipe(
      tap(response => {
        if (response?.theme) {
          this._currentTheme = { ...response.theme };
          this.applyCssVars(this._currentTheme);
          this.applyIconSet(this._currentTheme.iconSet);
          this.applyFontFamily(this._currentTheme.fontFamily);
        }
      })
    );
  }

  /**
   * Reinitialise le theme par defaut en base.
   */
  resetTheme(): Observable<{success: boolean; message: string; theme: ThemeConfig}> {
    return this.http.post<{success: boolean; message: string; theme: ThemeConfig}>(
      `${API_URL}/reset`, {}, { headers: this.buildHeaders() }
    ).pipe(
      tap(response => {
        if (response?.theme) {
          this._currentTheme = { ...response.theme };
          this.applyCssVars(this._currentTheme);
          this.applyIconSet(this._currentTheme.iconSet);
          this.applyFontFamily(this._currentTheme.fontFamily);
        }
      })
    );
  }

  /**
   * Applique le theme localement (preview live sans sauvegarder en BDD).
   */
  applyLocalPreview(theme: ThemeConfig): void {
    this._currentTheme = { ...theme };
    this.applyCssVars(theme);
    this.applyIconSet(theme.iconSet);
    this.applyFontFamily(theme.fontFamily);
  }

  // ─── CSS Custom Properties ────────────────────────────────────────────────
  private applyCssVars(theme: ThemeConfig): void {
    const root = document.documentElement;

    // ── Variables supplementaires pour compatibilite (utilisees par ThemeService uniquement)
    root.style.setProperty('--color-primary',  theme.primaryColor);
    root.style.setProperty('--color-accent',   theme.accentColor);
    root.style.setProperty('--color-sidebar',  theme.sidebarColor);
    root.style.setProperty('--border-radius',  theme.borderRadius);

    // ── Variables REELLEMENT lues par styles.css et les composants existants
    // Sidebar background (dashboard-layout, superadmin-layout)
    root.style.setProperty('--bg-sidebar',    theme.sidebarColor);

    // Police globale
    root.style.setProperty('--font-primary',  theme.fontFamily);
    root.style.setProperty('--font-display',  theme.fontFamily);
    root.style.setProperty('--font-family',   theme.fontFamily);

    // Couleur primaire en format HSL (utilisee par hsl(--primary))
    const hsl = this.hexToHsl(theme.primaryColor);
    root.style.setProperty('--primary',       `${hsl.h}, ${hsl.s}%, ${hsl.l}%`);
    root.style.setProperty('--primary-hover', theme.primaryColor);

    // Couleur primaire en format RGB (utilisee par rgba(--primary-rgb, ...))
    const rgb = this.hexToRgb(theme.primaryColor);
    root.style.setProperty('--primary-rgb',   `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    // Couleur accent
    const hslAccent = this.hexToHsl(theme.accentColor);
    root.style.setProperty('--accent',        `${hslAccent.h}, ${hslAccent.s}%, ${hslAccent.l}%`);
    const rgbAccent = this.hexToRgb(theme.accentColor);
    root.style.setProperty('--accent-rgb',    `${rgbAccent.r}, ${rgbAccent.g}, ${rgbAccent.b}`);

    // Couleurs derivees pour les composants avec opacite
    root.style.setProperty('--color-primary-15', this.hexToRgba(theme.primaryColor, 0.15));
    root.style.setProperty('--color-primary-30', this.hexToRgba(theme.primaryColor, 0.30));
    root.style.setProperty('--color-accent-15',  this.hexToRgba(theme.accentColor,  0.15));

    // Couleurs sidebar actives (nav items selectionnes)
    root.style.setProperty('--sidebar-text-active', theme.primaryColor);
    root.style.setProperty('--sidebar-bg-active',   this.hexToRgba(theme.primaryColor, 0.10));
    root.style.setProperty('--primary-hover',        theme.primaryColor);

    // Boutons et liens uses sur toute l'appli
    root.style.setProperty('--btn-primary-bg',    theme.primaryColor);
    root.style.setProperty('--btn-primary-hover', this.hexToRgba(theme.primaryColor, 0.85));

    // Mode dark/light : changer l'attribut data-theme sur <html>
    if (theme.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Mode compact
    if (theme.compactMode) {
      root.style.setProperty('--spacing-base', '6px');
      document.body.classList.add('compact-mode');
    } else {
      root.style.setProperty('--spacing-base', '12px');
      document.body.classList.remove('compact-mode');
    }
  }

  // ─── Conversions couleur ──────────────────────────────────────────────────
  private hexToHsl(hex: string): {h: number; s: number; l: number} {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  private hexToRgb(hex: string): {r: number; g: number; b: number} {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  private hexToRgba(hex: string, alpha: number): string {
    const {r, g, b} = this.hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }


  // ─── Jeu d'icones ─────────────────────────────────────────────────────────
  private applyIconSet(iconSet: string): void {
    const set = iconSet || 'outlined';
    const url = ICON_SET_URLS[set] || ICON_SET_URLS['outlined'];

    // Supprimer l'ancien lien Material Symbols s'il existe
    const existing = document.querySelectorAll('link[data-material-icons]');
    existing.forEach(el => el.remove());

    // Injecter le nouveau
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-material-icons', set);
    document.head.appendChild(link);

    // Changer la classe CSS sur <body> pour que la font-face match
    document.body.classList.remove('icons-outlined', 'icons-rounded', 'icons-sharp');
    document.body.classList.add(`icons-${set}`);

    // Mettre a jour la variable CSS de la famille d'icones
    document.documentElement.style.setProperty('--icon-font', this.getIconFontName(set));
  }

  private getIconFontName(set: string): string {
    switch (set) {
      case 'rounded': return '"Material Symbols Rounded"';
      case 'sharp':   return '"Material Symbols Sharp"';
      default:        return '"Material Symbols Outlined"';
    }
  }

  // ─── Police principale ────────────────────────────────────────────────────
  private applyFontFamily(fontFamily: string): void {
    document.documentElement.style.setProperty('--font-family', fontFamily);
    document.body.style.fontFamily = fontFamily;
  }

  private getToken(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return user?.token || null;
    } catch { return null; }
  }

  /** Construit les headers HTTP avec le token JWT */
  private buildHeaders(): HttpHeaders {
    const token = this.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  /** Bascule mode sombre/clair (compatibilite ancienne API) */
  toggleTheme(): void {
    this._currentTheme.darkMode = !this._currentTheme.darkMode;
    this.applyCssVars(this._currentTheme);
  }

  /** Expose currentTheme$ comme Observable pour compatibilite */
  get isDark(): boolean {
    return this._currentTheme.darkMode ?? true;
  }

  /**
   * Applique un preset de theme (primaryColor, sidebarColor, darkMode)
   * sans sauvegarder en BDD — usage par le sélecteur de thème du dashboard.
   */
  applyPreset(partial: { primaryColor?: string; sidebarColor?: string; darkMode?: boolean }): void {
    this._currentTheme = {
      ...this._currentTheme,
      ...partial,
    };
    this.applyCssVars(this._currentTheme);
  }
}
