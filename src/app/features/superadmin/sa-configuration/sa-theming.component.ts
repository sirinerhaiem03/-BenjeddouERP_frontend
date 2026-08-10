import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService, ThemeConfig } from '../../../core/services/theme.service';

@Component({
  selector: 'app-sa-theming',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="theming-root">

  <!-- Header -->
  <div class="theming-header">
    <div class="th-left">
      <div class="th-icon">
        <span class="material-symbols-outlined">palette</span>
      </div>
      <div>
        <h1>{{ 'SUPERADMIN.THEMING.TITLE' | translate }}</h1>
        <p>{{ 'SUPERADMIN.THEMING.SUBTITLE' | translate }}</p>
      </div>
    </div>
    <div class="th-actions">
      <button class="btn-reset" (click)="resetDefaults()" [disabled]="saving">
        <span class="material-symbols-outlined">restart_alt</span>
        {{ 'SUPERADMIN.THEMING.RESET_BTN' | translate }}
      </button>
      <button class="btn-save" (click)="saveTheme()" [disabled]="saving">
        <span class="material-symbols-outlined">{{ saving ? 'hourglass_empty' : 'cloud_upload' }}</span>
        {{ saving ? ('SUPERADMIN.THEMING.SAVING' | translate) : ('SUPERADMIN.THEMING.SAVE_BTN' | translate) }}
      </button>
    </div>
  </div>

  <!-- Banners -->
  <div class="save-banner success" *ngIf="saveSuccess">
    <span class="material-symbols-outlined">check_circle</span>
    {{ 'SUPERADMIN.THEMING.SAVE_SUCCESS' | translate }}
  </div>
  <div class="save-banner error" *ngIf="saveError">
    <span class="material-symbols-outlined">error</span>
    {{ saveError }}
  </div>

  <!-- Info BDD -->
  <div class="info-bdd">
    <span class="material-symbols-outlined">storage</span>
    {{ 'SUPERADMIN.THEMING.INFO_BDD' | translate }}
  </div>

  <div class="theming-layout">

    <!-- ── LEFT : Controls ──────────────────────────────────────── -->
    <div class="controls-panel">

      <!-- Section Couleurs -->
      <div class="ctrl-section">
        <div class="ctrl-section-title">
          <span class="material-symbols-outlined">color_lens</span>
          {{ 'SUPERADMIN.THEMING.SECT_COLORS' | translate }}
        </div>

        <div class="ctrl-row">
          <label class="ctrl-label">{{ 'SUPERADMIN.THEMING.PRIMARY_COLOR' | translate }}</label>
          <div class="color-pick-row">
            <input type="color" [(ngModel)]="theme.primaryColor" (ngModelChange)="applyPreview()" class="color-input" />
            <div class="color-presets">
              <button *ngFor="let c of presetColors" class="color-preset" [style.background]="c"
                [class.active]="theme.primaryColor===c" (click)="setPrimary(c)"></button>
            </div>
            <span class="color-hex">{{ theme.primaryColor }}</span>
          </div>
        </div>

        <div class="ctrl-row">
          <label class="ctrl-label">{{ 'SUPERADMIN.THEMING.ACCENT_COLOR' | translate }}</label>
          <div class="color-pick-row">
            <input type="color" [(ngModel)]="theme.accentColor" (ngModelChange)="applyPreview()" class="color-input" />
            <div class="color-presets">
              <button *ngFor="let c of accentColors" class="color-preset" [style.background]="c"
                [class.active]="theme.accentColor===c" (click)="setAccent(c)"></button>
            </div>
            <span class="color-hex">{{ theme.accentColor }}</span>
          </div>
        </div>

        <div class="ctrl-row">
          <label class="ctrl-label">{{ 'SUPERADMIN.THEMING.SIDEBAR_COLOR' | translate }}</label>
          <div class="color-pick-row">
            <input type="color" [(ngModel)]="theme.sidebarColor" (ngModelChange)="applyPreview()" class="color-input" />
            <div class="color-presets">
              <button *ngFor="let c of sidebarColors" class="color-preset" [style.background]="c"
                [class.active]="theme.sidebarColor===c" (click)="setSidebar(c)"></button>
            </div>
            <span class="color-hex">{{ theme.sidebarColor }}</span>
          </div>
        </div>
      </div>

      <!-- Section Icones -->
      <div class="ctrl-section">
        <div class="ctrl-section-title">
          <span class="material-symbols-outlined">interests</span>
          {{ 'SUPERADMIN.THEMING.SECT_ICONS' | translate }}
        </div>
        <div class="icon-sets">
          <button *ngFor="let s of iconSets" class="icon-set-btn"
            [class.active]="theme.iconSet === s.value"
            (click)="setIconSet($any(s.value))">
            <div class="icon-demo" [style.fontFamily]="s.fontFamily">
              <span>favorite</span>
              <span>home</span>
              <span>settings</span>
            </div>
            <div class="icon-set-name">{{ s.label }}</div>
            <div class="icon-set-desc">{{ s.desc }}</div>
          </button>
        </div>
      </div>

      <!-- Section Typographie -->
      <div class="ctrl-section">
        <div class="ctrl-section-title">
          <span class="material-symbols-outlined">font_download</span>
          {{ 'SUPERADMIN.THEMING.SECT_TYPO' | translate }}
        </div>
        <div class="ctrl-row">
          <label class="ctrl-label">{{ 'SUPERADMIN.THEMING.FONT_PRIMARY' | translate }}</label>
          <div class="font-grid">
            <button *ngFor="let f of fonts" class="font-btn"
              [class.active]="theme.fontFamily===f.value"
              [style.fontFamily]="f.value"
              (click)="setFont(f.value)">
              {{ f.label }}
            </button>
          </div>
        </div>
        <div class="ctrl-row">
          <label class="ctrl-label">{{ 'SUPERADMIN.THEMING.RADIUS' | translate }}</label>
          <div class="radius-grid">
            <button *ngFor="let r of radiusOptions" class="radius-btn"
              [class.active]="theme.borderRadius===r.value"
              (click)="setRadius(r.value)">
              <div class="radius-preview" [style.borderRadius]="r.value"></div>
              <span>{{ r.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Section Interface -->
      <div class="ctrl-section">
        <div class="ctrl-section-title">
          <span class="material-symbols-outlined">dashboard_customize</span>
          {{ 'SUPERADMIN.THEMING.SECT_UI' | translate }}
        </div>
        <div class="ctrl-row">
          <div class="toggle-row">
            <div>
              <div class="toggle-label">{{ 'SUPERADMIN.THEMING.DARK_MODE' | translate }}</div>
              <div class="toggle-desc">{{ 'SUPERADMIN.THEMING.DARK_DESC' | translate }}</div>
            </div>
            <div class="toggle-switch" [class.on]="theme.darkMode" (click)="theme.darkMode=!theme.darkMode; applyPreview()">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
        <div class="ctrl-row">
          <div class="toggle-row">
            <div>
              <div class="toggle-label">{{ 'SUPERADMIN.THEMING.COMPACT_MODE' | translate }}</div>
              <div class="toggle-desc">{{ 'SUPERADMIN.THEMING.COMPACT_DESC' | translate }}</div>
            </div>
            <div class="toggle-switch" [class.on]="theme.compactMode" (click)="theme.compactMode=!theme.compactMode; applyPreview()">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Logo -->
      <div class="ctrl-section">
        <div class="ctrl-section-title">
          <span class="material-symbols-outlined">image</span>
          {{ 'SUPERADMIN.THEMING.SECT_LOGO' | translate }}
        </div>
        <div class="ctrl-row">
          <label class="ctrl-label">{{ 'SUPERADMIN.THEMING.PLATFORM_NAME' | translate }}</label>
          <input type="text" class="ctrl-input" [(ngModel)]="theme.logoText" (ngModelChange)="applyPreview()"
            placeholder="Ex: BENJEDDOU ERP" />
        </div>
        <div class="ctrl-row">
          <label class="ctrl-label">{{ 'SUPERADMIN.THEMING.UPLOAD_LOGO' | translate }}</label>
          <!-- Utiliser label natif pour declencher l'input file de facon fiable -->
          <label class="upload-zone" for="logoFileInput">
            <input id="logoFileInput" type="file" accept="image/*"
              style="display:none" (change)="onLogoUpload($event)" />
            <span class="material-symbols-outlined upload-icon">upload_file</span>
            <div class="upload-text">{{ 'SUPERADMIN.THEMING.CLICK_TO_UPLOAD' | translate }}</div>
            <div class="upload-hint">{{ 'SUPERADMIN.THEMING.UPLOAD_HINT' | translate }}</div>
          </label>
          <!-- Preview du logo actuel -->
          <div *ngIf="theme.logoUrl" class="logo-preview-wrap">
            <img [src]="theme.logoUrl" alt="Logo" class="logo-preview-img" />
            <button class="logo-remove-btn" (click)="theme.logoUrl=''; applyPreview()" type="button">
              <span class="material-symbols-outlined">close</span>
              {{ 'SUPERADMIN.THEMING.DELETE_LOGO' | translate }}
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ── RIGHT : Preview ───────────────────────────────────────── -->
    <div class="preview-panel">
      <div class="preview-label">
        <span class="material-symbols-outlined">visibility</span>
        {{ 'SUPERADMIN.THEMING.LIVE_PREVIEW' | translate }}
      </div>

      <div class="preview-app" [style.fontFamily]="theme.fontFamily">
        <div class="prev-sidebar" [style.background]="theme.sidebarColor">
          <div class="prev-brand">
            <div class="prev-logo-dot" [style.background]="theme.primaryColor"></div>
            <span class="prev-brand-name">{{ theme.logoText }}</span>
          </div>
          <div class="prev-nav">
            <div class="prev-nav-item active" [style.background]="theme.primaryColor + '22'" [style.borderColor]="theme.primaryColor">
              <span class="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </div>
            <div class="prev-nav-item">
              <span class="material-symbols-outlined">payments</span>
              <span>Finance</span>
            </div>
            <div class="prev-nav-item">
              <span class="material-symbols-outlined">inventory_2</span>
              <span>Stock</span>
            </div>
          </div>
        </div>
        <div class="prev-main">
          <div class="prev-topbar">
            <span class="prev-page-title">Tableau de bord</span>
            <div class="prev-avatar" [style.background]="'linear-gradient(135deg,' + theme.primaryColor + ',' + theme.accentColor + ')'"></div>
          </div>
          <div class="prev-kpis">
            <div class="prev-kpi" [style.borderRadius]="theme.borderRadius" *ngFor="let k of previewKpis"
              [style.borderColor]="k.color + '30'">
              <div class="pk-icon" [style.background]="k.color + '15'" [style.borderRadius]="'calc(' + theme.borderRadius + ' - 4px)'">
                <span class="material-symbols-outlined" [style.color]="k.color">{{ k.icon }}</span>
              </div>
              <div class="pk-val" [style.color]="k.color">{{ k.val }}</div>
              <div class="pk-label">{{ k.label }}</div>
            </div>
          </div>
          <div class="prev-btn"
            [style.background]="'linear-gradient(135deg,' + theme.primaryColor + ',' + theme.accentColor + ')'"
            [style.borderRadius]="'calc(' + theme.borderRadius + ' / 2)'">
            Nouvelle facturation
          </div>
        </div>
      </div>

      <!-- Variables actives -->
      <div class="theme-vars-summary">
        <div class="vars-title">{{ 'SUPERADMIN.THEMING.ACTIVE_CONFIG' | translate }}</div>
        <div class="vars-list">
          <div class="var-item">
            <div class="var-dot" [style.background]="theme.primaryColor"></div>
            <code>--primary: {{ theme.primaryColor }}</code>
          </div>
          <div class="var-item">
            <div class="var-dot" [style.background]="theme.accentColor"></div>
            <code>--accent: {{ theme.accentColor }}</code>
          </div>
          <div class="var-item">
            <div class="var-dot" [style.background]="theme.sidebarColor" style="border:1px solid rgba(255,255,255,.15)"></div>
            <code>--sidebar: {{ theme.sidebarColor }}</code>
          </div>
          <div class="var-item">
            <span class="material-symbols-outlined" style="font-size:14px;color:#f97316">interests</span>
            <code>icones: {{ theme.iconSet }}</code>
          </div>
          <div class="var-item" *ngIf="lastSaved">
            <span class="material-symbols-outlined" style="font-size:14px;color:#22c55e">schedule</span>
            <code>sauvegarde: {{ lastSaved }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .theming-root {
      padding: 24px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── HEADER ── */
    .theming-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
      padding: 20px 24px;
      background: var(--sa-card-bg, #ffffff);
      border: 1px solid var(--sa-border, #e2e8f0);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }
    .th-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .th-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.15));
      border: 1px solid rgba(124, 58, 237, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
    }
    .th-icon .material-symbols-outlined {
      color: #7c3aed;
      font-size: 26px;
    }
    .theming-header h1 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--sa-text-primary, #0f172a);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .theming-header p {
      font-size: .85rem;
      color: var(--sa-text-secondary, #64748b);
      margin: 4px 0 0;
    }
    .th-actions {
      display: flex;
      gap: 12px;
    }

    .btn-reset {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: var(--sa-btn-sec-bg, #f1f5f9);
      border: 1px solid var(--sa-border, #cbd5e1);
      border-radius: 10px;
      color: var(--sa-text-primary, #334155);
      font-size: .85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s ease;
      font-family: inherit;
    }
    .btn-reset:hover:not(:disabled) {
      background: #e2e8f0;
      color: #0f172a;
      transform: translateY(-1px);
    }
    .btn-reset:disabled { opacity: .5; cursor: not-allowed; }

    .btn-save {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      border: none;
      border-radius: 10px;
      color: #ffffff;
      font-size: .85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s ease;
      font-family: inherit;
      box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
    }
    .btn-save:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(124, 58, 237, 0.45);
    }
    .btn-save:disabled { opacity: .7; cursor: not-allowed; }
    .btn-save .material-symbols-outlined, .btn-reset .material-symbols-outlined { font-size: 18px; }

    /* ── BANNERS ── */
    .save-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: .88rem;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .save-banner.success {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #15803d;
    }
    .save-banner.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #b91c1c;
    }

    .info-bdd {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      font-size: .84rem;
      color: var(--sa-text-secondary, #475569);
      margin-bottom: 24px;
    }
    .info-bdd .material-symbols-outlined { font-size: 20px; color: #6366f1; flex-shrink: 0; }
    .info-bdd strong { color: var(--sa-text-primary, #0f172a); font-weight: 700; }

    /* ── LAYOUT GRID ── */
    .theming-layout {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 28px;
      align-items: start;
    }
    .controls-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── SECTIONS ── */
    .ctrl-section {
      background: var(--sa-card-bg, #ffffff);
      border: 1px solid var(--sa-border, #e2e8f0);
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
      transition: border-color .2s;
    }
    .ctrl-section:hover {
      border-color: rgba(124, 58, 237, 0.25);
    }
    .ctrl-section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: .82rem;
      font-weight: 800;
      color: var(--sa-text-primary, #1e293b);
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--sa-border, #f1f5f9);
    }
    .ctrl-section-title .material-symbols-outlined { font-size: 18px; color: #7c3aed; }

    .ctrl-row { margin-bottom: 18px; }
    .ctrl-row:last-child { margin-bottom: 0; }
    .ctrl-label { display: block; font-size: .83rem; font-weight: 700; color: var(--sa-text-primary, #334155); margin-bottom: 8px; }

    /* Colors pickers */
    .color-pick-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .color-input {
      width: 44px;
      height: 44px;
      padding: 3px;
      border: 2px solid var(--sa-border, #cbd5e1);
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;
      transition: transform .2s;
    }
    .color-input:hover { transform: scale(1.08); }
    .color-presets { display: flex; gap: 8px; flex-wrap: wrap; }
    .color-preset {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all .2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    .color-preset.active, .color-preset:hover {
      transform: scale(1.25);
      border-color: #ffffff;
      box-shadow: 0 0 0 2px #7c3aed;
    }
    .color-hex {
      font-size: .8rem;
      font-weight: 700;
      color: #7c3aed;
      font-family: 'Fira Code', 'Courier New', monospace;
      background: rgba(124, 58, 237, 0.08);
      padding: 4px 10px;
      border-radius: 6px;
    }

    /* Icon sets */
    .icon-sets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .icon-set-btn {
      padding: 16px 12px;
      background: var(--sa-btn-sec-bg, #f8fafc);
      border: 2px solid var(--sa-border, #e2e8f0);
      border-radius: 12px;
      cursor: pointer;
      transition: all .2s ease;
      font-family: inherit;
      text-align: center;
    }
    .icon-set-btn.active {
      border-color: #7c3aed;
      background: rgba(124, 58, 237, 0.08);
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.15);
    }
    .icon-set-btn:hover:not(.active) {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }
    .icon-demo {
      display: flex;
      justify-content: center;
      gap: 8px;
      font-size: 22px;
      color: var(--sa-text-secondary, #64748b);
      margin-bottom: 8px;
      font-family: inherit;
    }
    .icon-set-btn.active .icon-demo { color: #7c3aed; }
    .icon-set-name { font-size: .82rem; font-weight: 800; color: var(--sa-text-primary, #0f172a); }
    .icon-set-desc { font-size: .72rem; color: var(--sa-text-secondary, #64748b); margin-top: 4px; }

    /* Typography & Buttons */
    .font-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .font-btn {
      padding: 8px 16px;
      background: var(--sa-btn-sec-bg, #f8fafc);
      border: 2px solid var(--sa-border, #e2e8f0);
      border-radius: 10px;
      color: var(--sa-text-primary, #334155);
      font-size: .85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s ease;
      font-family: inherit;
    }
    .font-btn.active {
      border-color: #7c3aed;
      background: rgba(124, 58, 237, 0.08);
      color: #7c3aed;
      font-weight: 800;
    }

    .radius-grid { display: flex; gap: 12px; flex-wrap: wrap; }
    .radius-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--sa-btn-sec-bg, #f8fafc);
      border: 2px solid var(--sa-border, #e2e8f0);
      border-radius: 10px;
      color: var(--sa-text-primary, #334155);
      font-size: .78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s ease;
      font-family: inherit;
      min-width: 75px;
    }
    .radius-btn.active {
      border-color: #7c3aed;
      background: rgba(124, 58, 237, 0.08);
      color: #7c3aed;
    }
    .radius-preview {
      width: 32px;
      height: 22px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
    }

    /* Toggles */
    .toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .toggle-label { font-size: .88rem; font-weight: 700; color: var(--sa-text-primary, #0f172a); }
    .toggle-desc { font-size: .78rem; color: var(--sa-text-secondary, #64748b); margin-top: 2px; }
    .toggle-switch {
      width: 48px;
      height: 26px;
      background: #cbd5e1;
      border-radius: 100px;
      cursor: pointer;
      transition: background .3s;
      position: relative;
      flex-shrink: 0;
    }
    .toggle-switch.on { background: #7c3aed; }
    .toggle-knob {
      position: absolute;
      left: 3px;
      top: 3px;
      width: 20px;
      height: 20px;
      background: #ffffff;
      border-radius: 50%;
      transition: transform .3s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    .toggle-switch.on .toggle-knob { transform: translateX(22px); }

    /* Inputs & Upload */
    .ctrl-input {
      width: 100%;
      padding: 11px 14px;
      background: var(--sa-input-bg, #ffffff);
      border: 1px solid var(--sa-border, #cbd5e1);
      border-radius: 10px;
      color: var(--sa-text-primary, #0f172a);
      font-size: .9rem;
      font-family: inherit;
      transition: border-color .2s;
      box-sizing: border-box;
    }
    .ctrl-input:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }

    .upload-zone {
      border: 2px dashed rgba(124, 58, 237, 0.3);
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all .2s ease;
      display: block;
      background: rgba(124, 58, 237, 0.02);
    }
    .upload-zone:hover { border-color: #7c3aed; background: rgba(124, 58, 237, 0.06); }
    .upload-icon { font-size: 32px; color: #7c3aed; display: block; margin-bottom: 8px; }
    .upload-text { font-size: .88rem; font-weight: 700; color: var(--sa-text-primary, #0f172a); }
    .upload-hint { font-size: .78rem; color: var(--sa-text-secondary, #64748b); margin-top: 4px; }
    .logo-preview-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 14px;
      padding: 12px 16px;
      background: var(--sa-btn-sec-bg, #f8fafc);
      border: 1px solid var(--sa-border, #e2e8f0);
      border-radius: 12px;
    }
    .logo-preview-img { height: 48px; width: auto; max-width: 140px; object-fit: contain; border-radius: 6px; }
    .logo-remove-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      color: #ef4444;
      font-size: .78rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all .2s;
    }
    .logo-remove-btn:hover { background: rgba(239, 68, 68, 0.2); }

    /* ── PREVIEW PANEL ── */
    .preview-panel { position: sticky; top: 90px; }
    .preview-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: .82rem;
      font-weight: 800;
      color: var(--sa-text-primary, #0f172a);
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-bottom: 14px;
    }
    .preview-label .material-symbols-outlined { font-size: 18px; color: #7c3aed; }
    .preview-app {
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      height: 380px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
      transition: font-family .3s;
    }
    .prev-sidebar {
      width: 140px;
      flex-shrink: 0;
      padding: 16px 12px;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: background .3s;
    }
    .prev-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 8px;
    }
    .prev-logo-dot { width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; }
    .prev-brand-name { font-size: .62rem; font-weight: 800; color: #ffffff; }
    .prev-nav { display: flex; flex-direction: column; gap: 6px; }
    .prev-nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid transparent;
      font-size: .65rem;
      color: #94a3b8;
      transition: all .2s;
    }
    .prev-nav-item.active { color: #ffffff; font-weight: 700; }
    .prev-nav-item .material-symbols-outlined { font-size: 15px; }
    .prev-main { flex: 1; padding: 16px; overflow: hidden; background: rgba(255,255,255,0.01); }
    .prev-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .prev-page-title { font-size: .75rem; font-weight: 800; color: #ffffff; }
    .prev-avatar { width: 24px; height: 24px; border-radius: 50%; }
    .prev-kpis { display: flex; gap: 8px; margin-bottom: 14px; }
    .prev-kpi {
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid transparent;
      background: rgba(255, 255, 255, 0.04);
      transition: all .3s;
    }
    .pk-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
    .pk-icon .material-symbols-outlined { font-size: 12px; }
    .pk-val { font-size: .75rem; font-weight: 900; }
    .pk-label { font-size: .55rem; color: #94a3b8; }
    .prev-btn {
      display: inline-block;
      padding: 8px 16px;
      color: #ffffff;
      font-size: .68rem;
      font-weight: 800;
      transition: all .3s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .theme-vars-summary {
      margin-top: 20px;
      background: var(--sa-card-bg, #ffffff);
      border: 1px solid var(--sa-border, #e2e8f0);
      border-radius: 14px;
      padding: 16px 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
    }
    .vars-title {
      font-size: .78rem;
      font-weight: 800;
      color: var(--sa-text-primary, #0f172a);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: .06em;
    }
    .vars-list { display: flex; flex-direction: column; gap: 10px; }
    .var-item { display: flex; align-items: center; gap: 12px; }
    .var-dot { width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    .var-item code { font-size: .8rem; color: var(--sa-text-secondary, #475569); font-family: 'Fira Code', 'Courier New', monospace; font-weight: 600; }

    @media (max-width: 1100px) {
      .theming-layout { grid-template-columns: 1fr; }
      .preview-panel { position: static; }
    }
  `]
})
export class SaThemingComponent implements OnInit {

  theme: ThemeConfig;
  saving = false;
  saveSuccess = false;
  saveError = '';
  lastSaved = '';

  presetColors = ['#f97316', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#06b6d4', '#eab308'];
  accentColors  = ['#a855f7', '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
  sidebarColors = ['#080e1a', '#0f172a', '#0a0f1e', '#111827', '#1a0a2e', '#0a1a0f', '#1a0a0a', '#0a1020'];

  fonts = [
    { label: 'Inter',    value: 'Inter, sans-serif' },
    { label: 'Roboto',   value: 'Roboto, sans-serif' },
    { label: 'Outfit',   value: 'Outfit, sans-serif' },
    { label: 'DM Sans',  value: 'DM Sans, sans-serif' },
    { label: 'Manrope',  value: 'Manrope, sans-serif' },
  ];

  radiusOptions = [
    { label: 'Carre',   value: '4px' },
    { label: 'Arrondi', value: '10px' },
    { label: 'Fluide',  value: '16px' },
    { label: 'Pilule',  value: '24px' },
  ];

  iconSets = [
    { label: 'Outlined', value: 'outlined', desc: 'Moderne & leger', fontFamily: '"Material Symbols Outlined"' },
    { label: 'Rounded',  value: 'rounded',  desc: 'Doux & amical',   fontFamily: '"Material Symbols Rounded"' },
    { label: 'Sharp',    value: 'sharp',    desc: 'Technique & net', fontFamily: '"Material Symbols Sharp"' },
  ];

  previewKpis = [
    { icon: 'payments',    val: '148K', label: 'Revenus',  color: '#f97316' },
    { icon: 'group',       val: '342',  label: 'Clients',  color: '#22c55e' },
    { icon: 'trending_up', val: '98%',  label: 'KPI',      color: '#3b82f6' },
  ];

  constructor(private themeService: ThemeService) {
    // Copie du theme actuel (charge depuis BDD via APP_INITIALIZER)
    this.theme = { ...this.themeService.currentTheme };
  }

  ngOnInit() {
    this.theme = { ...this.themeService.currentTheme };
    if (this.theme.updatedAt) {
      this.lastSaved = new Date(this.theme.updatedAt).toLocaleString('fr-FR');
    }
  }

  applyPreview() {
    this.themeService.applyLocalPreview(this.theme);
  }

  saveTheme() {
    this.saving = true;
    this.saveError = '';
    this.saveSuccess = false;

    this.themeService.saveTheme(this.theme).subscribe({
      next: (response) => {
        this.saving = false;
        this.saveSuccess = true;
        this.lastSaved = new Date().toLocaleString('fr-FR');
        if (response?.theme) {
          this.theme = { ...this.theme, ...response.theme };
        }
        setTimeout(() => this.saveSuccess = false, 4000);
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.message || 'Erreur de sauvegarde. Verifiez que le backend est demarre.';
        setTimeout(() => this.saveError = '', 5000);
      }
    });
  }

  resetDefaults() {
    this.saving = true;
    this.themeService.resetTheme().subscribe({
      next: (response) => {
        this.saving = false;
        if (response?.theme) {
          this.theme = { ...response.theme };
        }
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Erreur lors de la reinitialisation.';
        setTimeout(() => this.saveError = '', 4000);
      }
    });
  }

  setPrimary(c: string) { this.theme.primaryColor = c; this.applyPreview(); }
  setAccent(c: string)  { this.theme.accentColor  = c; this.applyPreview(); }
  setSidebar(c: string) { this.theme.sidebarColor = c; this.applyPreview(); }
  setFont(f: string)    { this.theme.fontFamily   = f; this.applyPreview(); }
  setRadius(r: string)  { this.theme.borderRadius = r; this.applyPreview(); }

  setIconSet(s: 'outlined' | 'rounded' | 'sharp') {
    this.theme.iconSet = s;
    this.applyPreview();
  }

  onLogoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.saveError = 'Le fichier est trop grand (max 2MB).';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.theme.logoUrl = e.target?.result as string;
      this.applyPreview();
    };
    reader.readAsDataURL(file);
  }
}
