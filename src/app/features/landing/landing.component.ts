import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService, AppLang } from '../../core/services/language.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="lp-root" [class.lp-light]="currentLandingTheme === 'light'">

  <!-- ══ NAVBAR ══════════════════════════════════════════════════════ -->
  <nav class="lp-nav" [class.scrolled]="scrolled">
    <div class="lp-nav-inner">
      <div class="lp-brand" routerLink="/">
        <div class="lp-logo-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" [attr.fill]="themeService.currentTheme.primaryColor"/>
            <path d="M2 17l10 5 10-5" [attr.stroke]="themeService.currentTheme.primaryColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M2 12l10 5 10-5" [attr.stroke]="themeService.currentTheme.primaryColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
          </svg>
        </div>
        <span class="lp-brand-name">BENJEDDOU <span>ERP</span></span>
      </div>

      <div class="lp-nav-links">
        <a href="#features" (click)="smoothScroll($event,'features')">{{ t('navFeatures') }}</a>
        <a href="#modules" (click)="smoothScroll($event,'modules')">{{ t('navModules') }}</a>
        <a href="#pricing" (click)="smoothScroll($event,'pricing')">{{ t('navPricing') }}</a>
        <a href="#faq" (click)="smoothScroll($event,'faq')">{{ t('navFaq') }}</a>
        <a href="#contact" (click)="smoothScroll($event,'contact')">{{ t('navContact') }}</a>
      </div>

      <div class="lp-nav-actions">
        <!-- Sélecteur de langue -->
        <div class="lp-lang-dropdown">
          <button type="button" class="lp-lang-btn" (click)="langDropdownOpen = !langDropdownOpen">
            <span>{{ languageService.currentLangMeta.flag }} {{ languageService.currentLangMeta.label }}</span>
            <span class="material-symbols-outlined" style="font-size: 1.1rem;">expand_more</span>
          </button>
          <div class="lp-lang-menu" *ngIf="langDropdownOpen">
            <button type="button" *ngFor="let l of languageService.availableLanguages"
                    class="lp-lang-option"
                    [class.active]="languageService.currentLang === l.code"
                    (click)="changeLang(l.code)">
              <span>{{ l.flag }} {{ l.label }}</span>
            </button>
          </div>
        </div>

        <!-- Sélecteur thème rapide -->
        <div class="lp-theme-btns">
          <button *ngFor="let t of landingThemes"
                  class="lp-theme-dot"
                  [class.active]="currentLandingTheme===t.id"
                  [title]="t.label"
                  (click)="applyLandingTheme(t.id)"
                  [style.--dot-color]="t.color">
            <span class="dot-label">{{t.label}}</span>
          </button>
        </div>
        <button class="nav-btn-ghost" routerLink="/login">{{ t('login') }}</button>
        <button class="nav-btn-primary" routerLink="/register">
          {{ t('freeTrial') }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <button class="lp-burger" (click)="menuOpen=!menuOpen" [class.open]="menuOpen" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Mobile menu -->
    <div class="lp-mobile-menu" [class.open]="menuOpen">
      <a href="#features" (click)="menuOpen=false;smoothScroll($event,'features')">{{ t('navFeatures') }}</a>
      <a href="#modules" (click)="menuOpen=false;smoothScroll($event,'modules')">{{ t('navModules') }}</a>
      <a href="#pricing" (click)="menuOpen=false;smoothScroll($event,'pricing')">{{ t('navPricing') }}</a>
      <a href="#faq" (click)="menuOpen=false;smoothScroll($event,'faq')">{{ t('navFaq') }}</a>
      <div class="mobile-menu-btns">
        <button class="nav-btn-ghost w-full" routerLink="/login">{{ t('login') }}</button>
        <button class="nav-btn-primary w-full" routerLink="/register">{{ t('freeTrial') }}</button>
      </div>
    </div>
  </nav>

  <!-- ══ HERO ════════════════════════════════════════════════════════ -->
  <section class="lp-hero">
    <div class="hero-bg-grid"></div>
    <div class="hero-orb hero-orb-1"></div>
    <div class="hero-orb hero-orb-2"></div>
    <div class="hero-orb hero-orb-3"></div>

    <div class="hero-inner">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>{{ t('heroBadge') }}</span>
          <span class="badge-sep">·</span>
          <span class="badge-new">v2.0</span>
        </div>

        <h1 class="hero-title">
          {{ t('heroTitle1') }}<br>
          <span class="hero-gradient-text">{{ t('heroTitle2') }}</span><br>
          {{ t('heroTitle3') }}
        </h1>

        <p class="hero-desc">
          {{ t('heroDesc') }}
        </p>

        <div class="hero-ctas">
          <button class="cta-primary" routerLink="/register">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            {{ t('startFree') }}
          </button>
          <button class="cta-secondary" (click)="openDemoModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {{ t('watchDemo') }}
          </button>
        </div>

        <div class="hero-trust">
          <div class="trust-item" *ngFor="let itemKey of ['trust1', 'trust2', 'trust3', 'trust4']">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            <span>{{ t(itemKey) }}</span>
          </div>
        </div>
      </div>

      <!-- Dashboard Preview -->
      <div class="hero-preview">
        <div class="preview-frame">
          <div class="preview-header">
            <div class="ph-dots"><span></span><span></span><span></span></div>
            <div class="ph-url">benjeddou-erp.app</div>
            <div class="ph-actions"><span></span><span></span></div>
          </div>
          <div class="preview-body">
            <!-- Sidebar mini -->
            <div class="pb-sidebar">
              <div class="pbs-logo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f97316"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
              </div>
              <div class="pbs-items">
                <div class="pbs-item active"></div>
                <div class="pbs-item"></div>
                <div class="pbs-item"></div>
                <div class="pbs-item"></div>
                <div class="pbs-item"></div>
                <div class="pbs-item"></div>
              </div>
            </div>
            <!-- Content -->
            <div class="pb-content">
              <div class="pbc-topbar">
                <div class="pbc-title">Tableau de bord</div>
                <div class="pbc-actions">
                  <div class="pbc-avatar"></div>
                </div>
              </div>
              <!-- KPI Row -->
              <div class="pbc-kpis">
                <div class="pbc-kpi" *ngFor="let k of previewKpis" [style.borderColor]="k.color">
                  <div class="kpi-icon" [style.background]="k.bg">
                    <div class="kpi-dot" [style.background]="k.color"></div>
                  </div>
                  <div class="kpi-val" [style.color]="k.color">{{k.val}}</div>
                  <div class="kpi-label">{{k.label}}</div>
                </div>
              </div>
              <!-- Chart placeholder -->
              <div class="pbc-chart">
                <div class="chart-bars">
                  <div class="chart-bar" *ngFor="let b of chartBars" [style.height.%]="b" [style.opacity]="0.3 + b/200"></div>
                </div>
                <div class="chart-line"></div>
              </div>
              <!-- Table -->
              <div class="pbc-table">
                <div class="pt-row header"><span>Client</span><span>Montant</span><span>Statut</span></div>
                <div class="pt-row" *ngFor="let r of previewRows">
                  <span>{{r.name}}</span>
                  <span>{{r.amount}}</span>
                  <span class="pt-badge" [class]="r.status">{{r.label}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Floating badges -->
        <div class="float-card fc-1">
          <div class="fc-icon">📈</div>
          <div>
            <div class="fc-val">+24.5%</div>
            <div class="fc-label">Chiffre d'affaires</div>
          </div>
        </div>
        <div class="float-card fc-2">
          <div class="fc-icon">🔒</div>
          <div>
            <div class="fc-val">100%</div>
            <div class="fc-label">Donnees securisees</div>
          </div>
        </div>
        <div class="float-card fc-3">
          <div class="fc-icon">⚡</div>
          <div>
            <div class="fc-val">99.9%</div>
            <div class="fc-label">Disponibilite</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="hero-stats-row">
      <div class="hero-stat" *ngFor="let s of getHeroStats">
        <div class="hs-val">{{s.val}}</div>
        <div class="hs-label">{{s.label}}</div>
      </div>
    </div>
  </section>

  <!-- ══ TRUST BAR ═══════════════════════════════════════════════════ -->
  <section class="lp-trust-bar">
    <p class="trust-bar-label">{{ t('trustBarLabel') }}</p>
    <div class="trust-logos-track">
      <div class="trust-logos">
        <span *ngFor="let c of clients" class="trust-client">{{ c }}</span>
        <!-- Duplicate for infinite scroll -->
        <span *ngFor="let c of clients" class="trust-client">{{ c }}</span>
      </div>
    </div>
  </section>

  <!-- ══ FEATURES ════════════════════════════════════════════════════ -->
  <section class="lp-section" id="features">
    <div class="section-inner">
      <div class="section-header reveal">
        <div class="section-pill">{{ t('navFeatures') }}</div>
        <h2 class="section-title">{{ t('featuresTitle') }}</h2>
        <p class="section-desc">
          {{ t('featuresDesc') }}
        </p>
      </div>

      <div class="features-grid">
        <div class="feat-card reveal" *ngFor="let f of getFeatures; let i = index" [style.animationDelay]="(i*0.08)+'s'">
          <div class="feat-icon-wrap" [class]="'feat-icon-'+f.color">
            <span class="material-symbols-outlined">{{f.icon}}</span>
          </div>
          <h3 class="feat-name">{{f.name}}</h3>
          <p class="feat-desc">{{f.desc}}</p>
          <div class="feat-tags">
            <span class="feat-tag" *ngFor="let t of f.tags">{{t}}</span>
          </div>
          <div class="feat-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══ MODULES SHOWCASE ════════════════════════════════════════════ -->
  <section class="lp-section lp-modules" id="modules">
    <div class="section-inner">
      <div class="section-header reveal">
        <div class="section-pill">{{ t('navModules') }}</div>
        <h2 class="section-title">{{ t('modulesTitle') }}</h2>
        <p class="section-desc">{{ t('modulesDesc') }}</p>
      </div>

      <div class="modules-layout">
        <!-- Tabs -->
        <div class="module-tabs">
          <button class="mod-tab" *ngFor="let m of getModules"
            [class.active]="activeModule===m.id"
            (click)="activeModule=m.id">
            <div class="mod-tab-icon" [class]="'mod-icon-'+m.color">
              <span class="material-symbols-outlined">{{m.icon}}</span>
            </div>
            <div class="mod-tab-text">
              <div class="mod-tab-name">{{m.name}}</div>
              <div class="mod-tab-desc">{{m.shortDesc}}</div>
            </div>
            <svg class="mod-tab-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <!-- Detail panel -->
        <div class="module-detail" *ngFor="let m of getModules" [class.active]="activeModule===m.id">
          <div class="mod-detail-header">
            <div class="mod-detail-icon" [class]="'mod-icon-'+m.color">
              <span class="material-symbols-outlined">{{m.icon}}</span>
            </div>
            <div>
              <h3 class="mod-detail-name">{{m.name}}</h3>
              <p class="mod-detail-short">{{m.shortDesc}}</p>
            </div>
          </div>
          <p class="mod-detail-desc">{{m.fullDesc}}</p>
          <ul class="mod-features-list">
            <li *ngFor="let feat of m.features">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(249,115,22,0.12)"/><path d="M8 12l3 3 5-5" stroke="#f97316" stroke-width="2" stroke-linecap="round"/></svg>
              {{feat}}
            </li>
          </ul>
          <button class="mod-cta" routerLink="/register">
            {{ t('tryModuleFree') }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- ══ SECURITY HIGHLIGHT ══════════════════════════════════════════ -->
  <section class="lp-section lp-security">
    <div class="section-inner">
      <div class="security-grid">
        <div class="security-left reveal">
          <div class="section-pill">{{ t('securityPill') }}</div>
          <h2 class="section-title" style="text-align:left;margin:16px 0">
            {{ t('securityTitle1') }}<br><span class="hero-gradient-text">{{ t('securityTitle2') }}</span> {{ t('securityTitle3') }}
          </h2>
          <p class="section-desc" style="text-align:left;margin-bottom:32px">
            {{ t('securityDesc') }}
          </p>
          <div class="security-features">
            <div class="sec-feat" *ngFor="let s of getSecurityFeatures">
              <div class="sec-feat-icon">
                <span class="material-symbols-outlined">{{s.icon}}</span>
              </div>
              <div>
                <div class="sec-feat-name">{{s.name}}</div>
                <div class="sec-feat-desc">{{s.desc}}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="security-right reveal">
          <div class="sec-visual">
            <div class="sec-shield">
              <svg viewBox="0 0 120 140" fill="none">
                <path d="M60 10 L110 30 L110 70 C110 100 85 128 60 138 C35 128 10 100 10 70 L10 30 Z" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.25)" stroke-width="2"/>
                <path d="M60 25 L100 42 L100 72 C100 96 80 118 60 128 C40 118 20 96 20 72 L20 42 Z" fill="rgba(249,115,22,0.05)" stroke="rgba(249,115,22,0.15)" stroke-width="1.5"/>
                <path d="M44 68l12 12 20-20" stroke="#f97316" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="sec-badge sb-1">JWT + Refresh Token</div>
            <div class="sec-badge sb-2">RBAC Permissions</div>
            <div class="sec-badge sb-3">Multi-tenant DB</div>
            <div class="sec-badge sb-4">Audit complet</div>
            <div class="sec-badge sb-5">Rate Limiting</div>
            <div class="sec-badge sb-6">Session unique</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══ PRICING ═════════════════════════════════════════════════════ -->
  <section class="lp-section" id="pricing">
    <div class="section-inner">
      <div class="section-header reveal">
        <div class="section-pill">{{ t('pricingPill') }}</div>
        <h2 class="section-title">{{ t('pricingTitle') }}</h2>
        <p class="section-desc">{{ t('pricingDesc') }}</p>
      </div>

      <div class="pricing-grid">
        <div class="price-card reveal" *ngFor="let p of getPlans; let i=index"
          [class.popular]="p.popular"
          [style.animationDelay]="(i*0.1)+'s'">
          <div class="popular-badge" *ngIf="p.popular">⭐ Le plus populaire</div>
          <div class="price-icon" [class]="'price-icon-'+p.color">
            <span class="material-symbols-outlined">{{p.icon}}</span>
          </div>
          <div class="price-name">{{p.name}}</div>
          <div class="price-amount">
            <span class="price-val">{{p.price}}</span>
            <span class="price-period">{{p.period}}</span>
          </div>
          <p class="price-desc">{{p.desc}}</p>
          <div class="price-sep"></div>
          <ul class="price-features">
            <li *ngFor="let feat of p.features">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#22c55e"><path d="M20 6L9 17l-5-5"/></svg>
              {{feat}}
            </li>
          </ul>
          <button class="price-cta" [class.price-cta-popular]="p.popular" routerLink="/register">
            {{p.cta}}
          </button>
        </div>
      </div>

      <p class="pricing-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        {{ t('pricingNote') }}
      </p>
    </div>
  </section>

  <!-- ══ TESTIMONIALS ════════════════════════════════════════════════ -->
  <section class="lp-section lp-testi">
    <div class="section-inner">
      <div class="section-header reveal">
        <div class="section-pill">{{ t('testimonialsPill') }}</div>
        <h2 class="section-title">{{ t('testimonialsTitle') }}</h2>
      </div>

      <div class="testi-grid">
        <div class="testi-card reveal" *ngFor="let t of getTestimonials; let i=index" [style.animationDelay]="(i*0.1)+'s'">
          <div class="testi-stars">
            <svg *ngFor="let s of [1,2,3,4,5]" width="14" height="14" viewBox="0 0 24 24" fill="#f97316"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <p class="testi-text">"{{t.text}}"</p>
          <div class="testi-author">
            <div class="testi-avatar">{{t.initials}}</div>
            <div>
              <div class="testi-name">{{t.name}}</div>
              <div class="testi-role">{{t.role}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══ FAQ ═════════════════════════════════════════════════════════ -->
  <section class="lp-section" id="faq">
    <div class="section-inner">
      <div class="section-header reveal">
        <div class="section-pill">{{ t('faqPill') }}</div>
        <h2 class="section-title">{{ t('faqTitle') }}</h2>
        <p class="section-desc">{{ t('faqDesc') }}</p>
      </div>

      <div class="faq-list">
        <div class="faq-item reveal" *ngFor="let q of getFaqs; let i=index" [class.open]="openFaq===i" (click)="openFaq=openFaq===i?-1:i">
          <div class="faq-q">
            <span>{{q.q}}</span>
            <svg class="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="faq-a">{{q.a}}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ══ CTA FINAL ═══════════════════════════════════════════════════ -->
  <section class="lp-cta" id="contact">
    <div class="cta-orb"></div>
    <div class="cta-inner reveal">
      <div class="cta-icon-box">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#f97316"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <h2 class="cta-title">{{ t('ctaTitle') }}</h2>
      <p class="cta-subtitle">
        {{ t('ctaSubtitle') }}
      </p>
      <div class="cta-btns">
        <button class="cta-primary" routerLink="/register">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          {{ t('createFreeAccount') }}
        </button>
        <button class="cta-secondary cta-secondary-light" routerLink="/login">
          {{ t('login') }}
        </button>
      </div>
      <div class="cta-assurances">
        <span>✓ {{ t('trust1') }}</span>
        <span>✓ {{ t('trust2') }}</span>
        <span>✓ {{ t('trust3') }}</span>
        <span>✓ {{ t('trust4') }}</span>
      </div>
    </div>
  </section>

  <!-- ══ FOOTER ══════════════════════════════════════════════════════ -->
  <footer class="lp-footer">
    <div class="footer-inner">
      <div class="footer-brand-col">
        <div class="lp-brand" style="margin-bottom:14px">
          <div class="lp-logo-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f97316"/>
              <path d="M2 17l10 5 10-5" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="lp-brand-name">BENJEDDOU <span>ERP</span></span>
        </div>
        <p class="footer-tagline">{{ t('footerTagline') }}</p>
        <div class="footer-socials">
          <a class="social-link" href="#" title="LinkedIn">in</a>
          <a class="social-link" href="#" title="Twitter">𝕏</a>
          <a class="social-link" href="#" title="GitHub">⌥</a>
        </div>
      </div>

      <div class="footer-links-grid">
        <div class="footer-col">
          <div class="footer-col-title">{{ t('productCol') }}</div>
          <a href="#features" (click)="smoothScroll($event,'features')">{{ t('navFeatures') }}</a>
          <a href="#modules" (click)="smoothScroll($event,'modules')">{{ t('navModules') }}</a>
          <a href="#pricing" (click)="smoothScroll($event,'pricing')">{{ t('navPricing') }}</a>
          <a routerLink="/register">{{ t('freeTrial') }}</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">{{ t('modulesCol') }}</div>
          <span>Finance & Facturation</span>
          <span>Gestion des Stocks</span>
          <span>Module Commercial</span>
          <span>Moteur de Calcul</span>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">{{ t('securityCol') }}</div>
          <span>Chiffrement des données</span>
          <span>RBAC & Permissions</span>
          <span>Audit & Logs</span>
          <span>Multi-tenant</span>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">{{ t('supportCol') }}</div>
          <span>Documentation</span>
          <a href="#faq" (click)="smoothScroll($event,'faq')">FAQ</a>
          <span>Contact</span>
          <a routerLink="/login">{{ t('login') }}</a>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>{{ t('allRightsReserved') }}</span>
      <div class="footer-bar-links">
        <span>Confidentialité</span>
        <span>CGU</span>
        <span>Cookies</span>
      </div>
    </div>
  </footer>

  <!-- ══ DEMO VIDEO MODAL ═══════════════════════════════════════════════ -->
  <div class="demo-overlay" *ngIf="demoModalOpen" (click)="onOverlayClick($event)">
    <div class="demo-modal">

      <!-- Header -->
      <div class="demo-modal-header">
        <div class="demo-modal-title">
          <div class="demo-modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M10 8l6 4-6 4V8z" fill="white" stroke="none"/>
            </svg>
          </div>
          <div>
            <h2>Démonstrations BENJEDDOU ERP</h2>
            <p>Découvrez les fonctionnalités clés de la plateforme · {{ demoVideos.length }} vidéos disponibles</p>
          </div>
        </div>
        <button class="demo-close-btn" (click)="closeDemoModal()" title="Fermer (Échap)">✕</button>
      </div>

      <!-- Body: Player + Playlist -->
      <div class="demo-modal-body">

        <!-- Left: Video Player -->
        <div class="demo-player-side">
          <div class="demo-video-wrapper">

            <!-- ══ LECTEUR VIDÉO RÉEL (MP4 local) ══ -->
            <div class="demo-real-player" *ngIf="currentDemo.videoFile">
              <video
                class="demo-real-video"
                [src]="'assets/videos/' + currentDemo.videoFile"
                controls
                autoplay
                [muted]="false"
                preload="auto"
                (ended)="nextDemo()"
              >
                Votre navigateur ne supporte pas la balise video.
              </video>
              <div class="demo-video-overlay-badge">
                <span class="demo-live-dot"></span>
                Démo réelle · {{ currentDemo.title }}
              </div>
            </div>

            <!-- ══ ÉCRAN ANIMÉ HAUTE FIDÉLITÉ (Réplique exacte de l'ERP réel) ══ -->
            <div class="demo-screen-live" *ngIf="!currentDemo.videoFile">

              <!-- En-tête réel de l'application ERP -->
              <div class="ds-real-header">
                <div class="ds-rh-left">
                  <div class="ds-rh-brand">BENJEDDOU <span>ERP</span></div>
                  <div class="ds-rh-search">
                    <span class="material-symbols-outlined" style="font-size: 14px;">search</span>
                    <span>Rechercher partout... (clients, produits, utilisateurs)</span>
                    <span class="ds-rh-kbd">CTRL K</span>
                  </div>
                </div>
                <div class="ds-rh-right">
                  <span class="ds-rh-icon" title="Notifications">🔔</span>
                  <span class="ds-rh-lang">🇫🇷 FR</span>
                  <div class="ds-rh-user">
                    <div class="ds-rh-avatar">K</div>
                    <div class="ds-rh-uinfo">
                      <span class="ds-rh-uname">Karim Belhadj</span>
                      <span class="ds-rh-urole">Admin ERP</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Corps principal : Sidebar + Vue du module -->
              <div class="ds-body-app">
                <!-- Sidebar applicative réelle -->
                <div class="ds-app-sidebar">
                  <div class="ds-sb-lbl">NAVIGATION</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===0" (click)="selectDemo(0)"><span class="material-symbols-outlined">dashboard</span> Tableau de Bord</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===1" (click)="selectDemo(1)"><span class="material-symbols-outlined">calculate</span> Moteur de Calcul</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===2" (click)="selectDemo(2)"><span class="material-symbols-outlined">payments</span> Finance & Facturation</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===3" (click)="selectDemo(3)"><span class="material-symbols-outlined">inventory_2</span> Gestion des Stocks</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===4" (click)="selectDemo(4)"><span class="material-symbols-outlined">shopping_bag</span> Module Commercial</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===5" (click)="selectDemo(5)"><span class="material-symbols-outlined">account_circle</span> Portail Client</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===6" (click)="selectDemo(6)"><span class="material-symbols-outlined">lock</span> Sécurité & Audit</div>
                  <div class="ds-sb-item" [class.active]="activeDemo===7" (click)="selectDemo(7)"><span class="material-symbols-outlined">admin_panel_settings</span> Super Admin SaaS</div>
                </div>

                <!-- Zone de travail du module actif -->
                <div class="ds-app-workspace">

                  <!-- 0: Tableau de Bord & Présentation ERP -->
                  <div class="ds-screen" *ngIf="activeDemo === 0">
                    <div class="ds-banner-welcome">
                      <div class="ds-bw-avatar">AB</div>
                      <div>
                        <h3>Bienvenue sur BENJEDDOU ERP !</h3>
                        <p>Plateforme SaaS Multi-Tenant intégrée · Vue d'ensemble en temps réel</p>
                      </div>
                    </div>
                    <div class="ds-kpis">
                      <div class="ds-kpi" style="--kc:#3b82f6"><b>53,410.050 TND</b><small>Chiffre d'affaires total</small><em>↑ +24.5% ce mois</em></div>
                      <div class="ds-kpi" style="--kc:#22c55e"><b>9 Commandes</b><small>Ce mois-ci</small><em>✓ Validées</em></div>
                      <div class="ds-kpi" style="--kc:#ef4444"><b>7 Factures</b><small>En attente de paiement</small><em>⚠ Relances actives</em></div>
                      <div class="ds-kpi" style="--kc:#a855f7"><b>80% Conversion</b><small>Taux de réussite devis</small><em>↑ Performance haute</em></div>
                    </div>
                    <div class="ds-chart-wrap">
                      <div class="ds-chart-lbl">Revenus & Trésorerie par Mois (TND)</div>
                      <div class="ds-bars">
                        <div class="ds-bar" style="--h:45%"><span>Jan</span></div>
                        <div class="ds-bar" style="--h:62%"><span>Fév</span></div>
                        <div class="ds-bar" style="--h:55%"><span>Mar</span></div>
                        <div class="ds-bar" style="--h:78%"><span>Avr</span></div>
                        <div class="ds-bar" style="--h:68%"><span>Mai</span></div>
                        <div class="ds-bar" style="--h:90%"><span>Jun</span></div>
                        <div class="ds-bar" style="--h:85%"><span>Jul</span></div>
                      </div>
                    </div>
                  </div>

                  <!-- 1: Moteur de Calcul Réel (FORMULAIRE & RÉSULTAT EN PREMIER PLAN) -->
                  <div class="ds-screen" *ngIf="activeDemo === 1">
                    <div class="ds-mod-topbanner" style="background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%); padding: 8px 14px; margin-bottom: 6px;">
                      <div class="ds-mtb-left">
                        <div class="ds-mtb-icon" style="width:32px;height:32px;font-size:18px;">🏛️</div>
                        <div>
                          <h3 style="color:#fff;margin:0;font-size:13px;font-weight:800;">Finance Module — Calculation Engine</h3>
                          <p style="color:#93c5fd;margin:0;font-size:9.5px;">Universal Formula: Result = Amount × (Rate / 100) × (Days / 365)</p>
                        </div>
                      </div>
                      <div class="ds-mtb-kpis">
                        <span class="ds-mtb-kpi" style="background:rgba(249,115,22,0.2);color:#fb923c;font-size:10px;padding:3px 8px;">CALCULATION BASE: <b>365 days (fixed)</b></span>
                      </div>
                    </div>
                    <div class="ds-subnav-tabs" style="margin-bottom:6px;padding-bottom:4px;">
                      <span class="ds-snt">Dashboard</span>
                      <span class="ds-snt">Treasury</span>
                      <span class="ds-snt">Accounting Entries</span>
                      <span class="ds-snt">VAT Declaration</span>
                      <span class="ds-snt">Financial Statement</span>
                      <span class="ds-snt active" style="border-bottom:2px solid #f97316;color:#f97316;font-weight:800;">Calculation Engine</span>
                    </div>

                    <!-- FORMULAIRE ET RÉSULTAT AUTOMATIQUE EN PREMIER PLAN 100% VISIBLES -->
                    <div class="ds-calc-grid-split" style="flex:1;margin-top:2px;">
                      <div class="ds-calc-form-card" style="background:#111c35 !important;border:1px solid rgba(255,255,255,0.12) !important;border-radius:10px;padding:14px;">
                        <h4 style="color:#f8fafc;font-size:13px;font-weight:800;margin:0 0 10px;">📊 Parameter Input (Single rate for the entire period)</h4>
                        <div class="ds-form-row"><label style="color:#94a3b8;font-size:10px;font-weight:600;">Base amount (TND) *</label><input type="text" value="25 000,000 TND" readonly style="background:rgba(0,0,0,0.4);color:#f8fafc;font-weight:700;"></div>
                        <div class="ds-form-row-2col">
                          <div><label style="color:#94a3b8;font-size:10px;font-weight:600;">Start date *</label><input type="text" value="01/01/2024" readonly style="background:rgba(0,0,0,0.4);color:#f8fafc;font-weight:700;"></div>
                          <div><label style="color:#94a3b8;font-size:10px;font-weight:600;">End date *</label><input type="text" value="31/12/2024" readonly style="background:rgba(0,0,0,0.4);color:#f8fafc;font-weight:700;"></div>
                        </div>
                        <div class="ds-form-row"><label style="color:#94a3b8;font-size:10px;font-weight:600;">Annual rate (%) *</label><input type="text" value="8.75 %" readonly style="background:rgba(0,0,0,0.4);color:#f8fafc;font-weight:700;"></div>
                        <div class="ds-form-row"><label style="color:#94a3b8;font-size:10px;font-weight:600;">Label / Free description</label><input type="text" value="Ex: Bank Loan Interest Q1 2024" readonly style="background:rgba(0,0,0,0.4);color:#cbd5e1;"></div>
                        <div class="ds-form-btns" style="display:flex;gap:8px;margin-top:12px;">
                          <button class="ds-btn-sec" style="padding:6px 14px;">↺ Reset</button>
                          <button class="ds-btn-pri" style="background:linear-gradient(135deg, #f97316, #ea580c);color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(249,115,22,0.4);">🧮 Calculate & Save</button>
                        </div>
                      </div>
                      <div class="ds-calc-result-card" style="background:#111c35 !important;border:1px solid rgba(255,255,255,0.12) !important;border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
                        <div>
                          <h4 style="color:#f8fafc;font-size:13px;font-weight:800;margin:0 0 10px;">📈 Automatic Result (Calculated instantly)</h4>
                          <div class="ds-res-box" style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);padding:14px;border-radius:10px;margin-bottom:12px;">
                            <div style="font-size:10.5px;color:#cbd5e1;font-weight:600;">Total Interest Amount:</div>
                            <div style="font-size:24px;font-weight:800;color:#f97316;margin:6px 0;">2,187.500 TND</div>
                            <div style="font-size:11px;color:#22c55e;font-weight:700;">Total Amount Cumulated: <b>27,187.500 TND</b></div>
                          </div>
                        </div>
                        <div style="background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.12);padding:12px;border-radius:8px;text-align:center;">
                          <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">📄 Formats d'exportation disponibles :</div>
                          <div style="display:flex;gap:8px;justify-content:center;">
                            <span style="background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;">📄 Export PDF Détaillé</span>
                            <span style="background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;">📝 Export Word (.docx)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 2: Commercial & Ebills (RÉPLIQUE EXACTE DE LA CAPTURE 2) -->
                  <div class="ds-screen" *ngIf="activeDemo === 2">
                    <div class="ds-mod-topbanner" style="background: linear-gradient(135deg, #4c1d95 0%, #312e81 100%);">
                      <div class="ds-mtb-left">
                        <div class="ds-mtb-icon">🧾</div>
                        <div>
                          <h3 style="color:#fff;margin:0;font-size:14px;font-weight:800;">Ebills</h3>
                          <p style="color:#c4b5fd;margin:0;font-size:10px;">Invoice generation and tracking</p>
                        </div>
                      </div>
                      <div class="ds-mtb-kpis">
                        <span class="ds-mtb-kpi" style="background:rgba(255,255,255,0.1);color:#fff;">REVENUE: <b>53,410.050 TND</b></span>
                        <span class="ds-mtb-kpi" style="background:rgba(59,130,246,0.2);color:#60a5fa;">ORDERS THIS MONTH: <b>9</b></span>
                        <span class="ds-mtb-kpi" style="background:rgba(239,68,68,0.25);color:#fca5a5;">UNPAID INVOICES: <b>7</b></span>
                        <span class="ds-mtb-kpi" style="background:rgba(34,197,94,0.2);color:#4ade80;">CONVERSION: <b>80%</b></span>
                      </div>
                    </div>
                    <div class="ds-subnav-tabs">
                      <span class="ds-snt">Clients</span>
                      <span class="ds-snt">Suppliers</span>
                      <span class="ds-snt">Orders</span>
                      <span class="ds-snt active" style="border-bottom:2px solid #a855f7;color:#c084fc;font-weight:800;">Invoices</span>
                      <span class="ds-snt">Quotes</span>
                      <span class="ds-snt">Promotions</span>
                      <span class="ds-snt">Dashboard</span>
                    </div>

                    <div class="ds-alert-red-banner">
                      ⚠️ 2 invoice(s) overdue ! Due date passed — consider sending a reminder.
                    </div>

                    <div class="ds-table">
                      <div class="ds-thead"><span>INVOICE #</span><span>CLIENT</span><span>ISSUE DATE</span><span>DUE DATE</span><span>EXCL. TAX</span><span>VAT 19%</span><span>INCL. TAX</span><span>STATUS</span><span>ACTIONS</span></div>
                      <div class="ds-trow ani" style="--d:0.1s"><span>FAC-202500001-120D81</span><span>Medina Group</span><span>05/08/2025</span><span>03/09/2025</span><span>8,500.000 TND</span><span>1,615.000 TND</span><span>10,115.000 TND</span><span class="bwait">⏳ En attente</span><span>👁️ 📄 ✉️</span></div>
                      <div class="ds-trow ani" style="--d:0.2s"><span>FAC-202500002-ONC0Fi</span><span>Medina Group</span><span>05/08/2025</span><span>03/09/2025</span><span>950.000 TND</span><span>180.500 TND</span><span>1,130.500 TND</span><span class="bpaid">✓ Payée</span><span>👁️ 📄 ✉️</span></div>
                      <div class="ds-trow ani" style="--d:0.3s"><span>FAC-202500003-GZ7F6S</span><span>Medina Group</span><span>05/08/2025</span><span>04/09/2025</span><span>890.000 TND</span><span>169.100 TND</span><span>1,059.100 TND</span><span class="bwait">⏳ En attente</span><span>👁️ 📄 ✉️</span></div>
                      <div class="ds-trow ani" style="--d:0.4s"><span>FAC-2025-001</span><span>Alpha Invest SARL</span><span>15/04/2026</span><span>15/05/2026</span><span>5,042.017 TND</span><span>957.983 TND</span><span>6,000.000 TND</span><span class="blate">⚠ EN RETARD</span><span>👁️ 📄 ✉️</span></div>
                    </div>
                  </div>

                  <!-- 3: Stocks & Inventory (RÉPLIQUE EXACTE DE LA CAPTURE 3 - TABLEAU EN PREMIER PLAN) -->
                  <div class="ds-screen" *ngIf="activeDemo === 3">
                    <div class="ds-mod-topbanner" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 8px 14px; margin-bottom: 6px;">
                      <div class="ds-mtb-left">
                        <div class="ds-mtb-icon" style="width:32px;height:32px;font-size:18px;">📦</div>
                        <div>
                          <h3 style="color:#fff;margin:0;font-size:13px;font-weight:800;">Product Catalogue</h3>
                          <p style="color:#94a3b8;margin:0;font-size:9.5px;">View, add and manage all your products, references and stock levels in real-time</p>
                        </div>
                      </div>
                      <div class="ds-mtb-kpis">
                        <span class="ds-mtb-kpi" style="background:rgba(59,130,246,0.2);color:#60a5fa;font-size:10px;padding:3px 8px;"><b>16 Products</b> · 1 in alert</span>
                      </div>
                    </div>
                    <div class="ds-subnav-tabs" style="margin-bottom:6px;padding-bottom:4px;">
                      <span class="ds-snt active" style="border-bottom:2px solid #38bdf8;color:#38bdf8;font-weight:800;">Products</span>
                      <span class="ds-snt">Warehouses</span>
                      <span class="ds-snt">Movements</span>
                      <span class="ds-snt">Inventories</span>
                    </div>

                    <!-- Synthèse Santé du Stock ultra compacte -->
                    <div class="ds-split-charts-row" style="display:flex;gap:10px;margin:4px 0 8px;">
                      <div class="ds-sc-card" style="flex:1;background:#111c35 !important;border:1px solid rgba(255,255,255,0.12) !important;border-radius:8px;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-size:10.5px;font-weight:800;color:#f8fafc !important;">🍩 Santé du Stock:</span>
                        <span style="color:#38bdf8;font-weight:700;font-size:10.5px;">🟢 Stock Optimal (85%) · 🔴 Alerte (15%)</span>
                      </div>
                      <div class="ds-sc-card" style="flex:1;background:#111c35 !important;border:1px solid rgba(255,255,255,0.12) !important;border-radius:8px;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-size:10.5px;font-weight:800;color:#f8fafc !important;">📊 Valeur Totale:</span>
                        <span style="color:#f97316;font-weight:800;font-size:10.5px;">142,850.000 TND</span>
                      </div>
                    </div>

                    <!-- TABLEAU DES PRODUITS EN PREMIER PLAN ET 100% VISIBLE -->
                    <div class="ds-table" style="flex:1;margin-top:2px;">
                      <div class="ds-thead"><span>REFERENCE</span><span>NAME</span><span>CATEGORY</span><span>PURCHASE PRICE</span><span>SALE PRICE</span><span>TOTAL QTY</span><span>MIN THRESHOLD</span><span>ACTIONS</span></div>
                      <div class="ds-trow ani" style="--d:0.05s"><span>CISCO-SW-2960</span><span>Switch Cisco Catalyst 2960</span><span>Réseau</span><span>2,100.000 TND</span><span>2,550.000 TND</span><span>18</span><span class="bpaid">Optimal stock</span><span>✏️ 🗑️</span></div>
                      <div class="ds-trow ani" style="--d:0.1s"><span>CISCO-RT-5505</span><span>Routeur Cisco ASA 5505</span><span>Réseau</span><span>2,400.000 TND</span><span>3,200.000 TND</span><span>8</span><span class="bpaid">Optimal stock</span><span>✏️ 🗑️</span></div>
                      <div class="ds-trow ani" style="--d:0.15s"><span>DELL-SRV-R330</span><span>Serveur Dell PowerEdge R330</span><span>Serveurs</span><span>6,500.000 TND</span><span>8,500.000 TND</span><span>5</span><span class="bpaid">Optimal stock</span><span>✏️ 🗑️</span></div>
                      <div class="ds-trow ani" style="--d:0.2s"><span>HP-SRV-DL380</span><span>Serveur HP ProLiant DL380</span><span>Serveurs</span><span>9,500.000 TND</span><span>12,500.000 TND</span><span>3</span><span class="bpaid">Optimal stock</span><span>✏️ 🗑️</span></div>
                      <div class="ds-trow ani" style="--d:0.25s"><span>SYN-NAS-DS923</span><span>NAS Synology DS923+</span><span>Stockage</span><span>1,550.000 TND</span><span>2,100.000 TND</span><span>10</span><span class="bpaid">Optimal stock</span><span>✏️ 🗑️</span></div>
                    </div>
                  </div>

                  <!-- 4: Vendor / Purchases (RÉPLIQUE EXACTE DE LA CAPTURE 4) -->
                  <div class="ds-screen" *ngIf="activeDemo === 4">
                    <div class="ds-mod-topbanner" style="background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);">
                      <div class="ds-mtb-left">
                        <div class="ds-mtb-icon">🤝</div>
                        <div>
                          <h3 style="color:#fff;margin:0;font-size:14px;font-weight:800;">Vendor Management</h3>
                          <p style="color:#6ee7b7;margin:0;font-size:10px;">Manage your suppliers and partners</p>
                        </div>
                      </div>
                      <div class="ds-mtb-kpis">
                        <span class="ds-mtb-kpi" style="background:rgba(255,255,255,0.1);color:#fff;">REVENUE: <b>49,602.050 TND</b></span>
                        <span class="ds-mtb-kpi" style="background:rgba(34,197,94,0.2);color:#4ade80;">ORDERS THIS MONTH: <b>9</b></span>
                        <span class="ds-mtb-kpi" style="background:rgba(239,68,68,0.25);color:#fca5a5;">UNPAID INVOICES: <b>8</b></span>
                      </div>
                    </div>
                    <div class="ds-subnav-tabs">
                      <span class="ds-snt">Clients</span>
                      <span class="ds-snt active" style="border-bottom:2px solid #22c55e;color:#4ade80;font-weight:800;">Suppliers</span>
                      <span class="ds-snt">Orders</span>
                      <span class="ds-snt">Invoices</span>
                      <span class="ds-snt">Quotes</span>
                      <span class="ds-snt">Promotions</span>
                      <span class="ds-snt">Dashboard</span>
                    </div>

                    <div class="ds-table" style="margin-top:10px;">
                      <div class="ds-thead"><span>NAME</span><span>EMAIL</span><span>PHONE</span><span>TAX ID</span><span>ADDRESS</span><span>ACTIONS</span></div>
                      <div class="ds-trow ani" style="--d:0.1s"><span>Cisco Systems Tunisia</span><span>sales.tn&#64;cisco.com</span><span>+216 71 770 000</span><span>MF-CISCO-001</span><span>Immeuble Bayrem, Charguia I, Tunis</span><span>✏️ 🗑️</span></div>
                      <div class="ds-trow ani" style="--d:0.2s"><span>Netgear Maghreb</span><span>maghreb&#64;netgear.com</span><span>+216 71 800 500</span><span>FR-NETGEAR-02</span><span>Ariana Technopole, Ariana, Tunisie</span><span>✏️ 🗑️</span></div>
                      <div class="ds-trow ani" style="--d:0.3s"><span>Legrand Tunisia</span><span>contact.tunisie&#64;legrand.com</span><span>+216 71 180 500</span><span>TN-LEGRAND-03</span><span>Zone Industrielle, Charguia I, Tunis</span><span>✏️ 🗑️</span></div>
                      <div class="ds-trow ani" style="--d:0.4s"><span>Dell Technologies TN</span><span>tunisie&#64;dell.com</span><span>+216 71 900 400</span><span>US-DELL-TN-01</span><span>Rue du Lac Malaren, Berges du Lac, Tunis</span><span>✏️ 🗑️</span></div>
                    </div>
                  </div>

                  <!-- 5: Portail Client Réel -->
                  <div class="ds-screen" *ngIf="activeDemo === 5">
                    <div class="ds-banner-welcome" style="background: linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(236,72,153,0.05) 100%); border-color: rgba(236,72,153,0.2);">
                      <div class="ds-bw-avatar" style="background: #ec4899;">K</div>
                      <div>
                        <h3>Portail Client Privé — Karim Belhadj</h3>
                        <p>Espace dédié : consultation des factures, devis et commandes en ligne</p>
                      </div>
                    </div>
                    <div class="ds-kpis">
                      <div class="ds-kpi" style="--kc:#ec4899"><b>14 500,00 DT</b><small>Solde restant à régler</small></div>
                      <div class="ds-kpi" style="--kc:#22c55e"><b>42 000,00 DT</b><small>Total réglé</small></div>
                      <div class="ds-kpi" style="--kc:#3b82f6"><b>8 Documents</b><small>Factures & Devis</small></div>
                    </div>
                    <div class="ds-table">
                      <div class="ds-trow ani" style="--d:0.2s"><span>📄 Facture FAC-2025-0042.pdf</span><span class="bpaid">📥 Télécharger PDF</span></div>
                      <div class="ds-trow ani" style="--d:0.3s"><span>📄 Devis Validé DEVIS-2025-0018.pdf</span><span class="bpaid">📥 Télécharger PDF</span></div>
                    </div>
                  </div>

                  <!-- 6: Sécurité & Audit Réel -->
                  <div class="ds-screen" *ngIf="activeDemo === 6">
                    <div class="ds-ptitle-bar">
                      <div>
                        <h3>Journal d'Audit & Sécurité des Accès</h3>
                        <p>Traçabilité intégrale des connexions, modifications et tentatives</p>
                      </div>
                    </div>
                    <div class="ds-table">
                      <div class="ds-thead"><span>Utilisateur</span><span>Adresse IP</span><span>Horodatage</span><span>Action Effectuée</span><span>Résultat</span></div>
                      <div class="ds-trow ani" style="--d:0.1s"><span>admin&#64;benjeddou.com</span><span>192.168.1.10</span><span>05/08/2026 13:22</span><span>AUTHENTICATION_LOGIN</span><span class="bpaid">✓ Succès (JWT Token)</span></div>
                      <div class="ds-trow ani" style="--d:0.2s"><span>karim&#64;alpha.com</span><span>41.230.12.45</span><span>05/08/2026 12:58</span><span>EXPORT_DEVIS_PDF</span><span class="bpaid">✓ Autorisé (RBAC)</span></div>
                      <div class="ds-trow ani" style="--d:0.3s"><span>ip_inconnue</span><span>185.12.99.14</span><span>05/08/2026 12:01</span><span>LOGIN_ATTEMPT_FAILED</span><span class="blate">⛔ Bloqué (Rate Limit)</span></div>
                    </div>
                  </div>

                  <!-- 7: Super Admin SaaS Réel -->
                  <div class="ds-screen" *ngIf="activeDemo === 7">
                    <div class="ds-ptitle-bar">
                      <div>
                        <h3>Console Super Admin SaaS Multi-Tenant</h3>
                        <p>Gestion des bases de données entreprises et contrôle des fiches d'essai</p>
                      </div>
                      <button class="ds-cbtn ds-cbtn-primary">💾 Sauvegarde Globale BDD</button>
                    </div>
                    <div class="ds-table">
                      <div class="ds-thead"><span>Société / Entreprise</span><span>Schéma BDD</span><span>Consommation Connexions</span><span>Statut Base</span></div>
                      <div class="ds-trow ani" style="--d:0.1s"><span>Alpha Invest SA</span><span>erp_ent_00001</span><span>18 / 30 connexions</span><span class="bpaid">● Isolée & Active</span></div>
                      <div class="ds-trow ani" style="--d:0.2s"><span>Delta Corp SARL</span><span>erp_ent_00002</span><span>30 / 30 connexions</span><span class="blate">⚠ Essai Expiré</span></div>
                      <div class="ds-trow ani" style="--d:0.3s"><span>Medina Group</span><span>erp_ent_00003</span><span>5 / 30 connexions</span><span class="bpaid">● Isolée & Active</span></div>
                    </div>
                  </div>

                </div><!-- end ds-app-workspace -->
              </div><!-- end ds-body-app -->
            </div><!-- end demo-screen-live -->
          </div>

          <!-- Info vidéo courante -->
          <div class="demo-video-info">
            <p class="demo-video-title">{{ currentDemo.title }}</p>
            <p class="demo-video-desc">{{ currentDemo.desc }}</p>
            <div class="demo-video-meta">
              <span class="demo-meta-chip">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {{ currentDemo.duration }}
              </span>
              <span class="demo-meta-chip">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                {{ currentDemo.category }}
              </span>
              <span class="demo-meta-chip" style="color:#22c55e;border-color:rgba(34,197,94,0.2)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#22c55e"><circle cx="12" cy="12" r="10"/></svg>
                HD 1080p
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Playlist (masqué si 1 seule vidéo) -->
        <div class="demo-playlist-side" *ngIf="demoVideos.length > 1">
          <div class="demo-playlist-header">
            <p class="demo-playlist-title">Catalogue des démos</p>
            <p class="demo-playlist-count">{{ activeDemo + 1 }} / {{ demoVideos.length }} — {{ currentDemo.category }}</p>
          </div>
          <div class="demo-playlist-list">
            <div class="demo-playlist-item"
                 *ngFor="let video of demoVideos; let i = index"
                 [class.active]="activeDemo === i"
                 (click)="selectDemo(i)">
              <div class="demo-item-num">{{ i + 1 }}</div>
              <div class="demo-item-thumb" [style.background]="video.bg">
                {{ video.emoji }}
                <div class="demo-item-play-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <div class="demo-item-info">
                <p class="demo-item-title">{{ video.title }}</p>
                <p class="demo-item-duration">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {{ video.duration }} · {{ video.category }}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div><!-- end body -->

      <!-- Footer: Navigation + CTA -->
      <div class="demo-modal-footer">
        <!-- Navigation (masquée si 1 seule vidéo) -->
        <div class="demo-footer-nav" *ngIf="demoVideos.length > 1">
          <button class="demo-nav-btn" (click)="prevDemo()" [disabled]="activeDemo === 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            Précédent
          </button>
          <button class="demo-nav-btn" (click)="nextDemo()" [disabled]="activeDemo === demoVideos.length - 1">
            Suivant
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <!-- Indicateur de progression -->
        <div class="demo-progress-dots">
          <div class="demo-dot"
               *ngFor="let v of demoVideos; let i = index"
               [class.active]="activeDemo === i"
               (click)="selectDemo(i)">
          </div>
        </div>

        <!-- CTA -->
        <a routerLink="/register" class="demo-cta-btn" (click)="closeDemoModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Essai gratuit – 30 connexions
        </a>
      </div>

    </div>
  </div>
  <!-- ══ FIN DEMO MODAL ══════════════════════════════════════════════════ -->

</div>
  `,
  styles: [`
    /* ─── Variables dynamiques : mises a jour par ThemeService via CSS custom properties ─── */
    :root {
      --lp-primary:     var(--color-primary, #f97316);
      --lp-primary-hsl: var(--primary, 24, 95%, 53%);
      --lp-primary-rgb: var(--primary-rgb, 249, 115, 22);
      --lp-accent:      var(--color-accent, #a855f7);
      --lp-sidebar:     var(--color-sidebar, #080e1a);
      --lp-radius:      var(--border-radius, 12px);
      --lp-font:        var(--font-primary, 'Inter', system-ui, sans-serif);
    }

    /* ─────────────────────────────────────────────────────────────────
       IMPORTS & BASE
    ───────────────────────────────────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .lp-root {
      font-family: var(--lp-font);
      background: #080e1a;
      color: #cbd5e1;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ─────────────────────────────────────────────────────────────────
       NAVBAR
    ───────────────────────────────────────────────────────────────── */
    .lp-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 1000;
      padding: 0 28px;
      transition: all .3s ease;
      border-bottom: 1px solid transparent;
    }
    .lp-nav.scrolled {
      background: rgba(8, 14, 26, 0.85);
      backdrop-filter: blur(20px);
      border-color: rgba(255,255,255,0.06);
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    }
    .lp-nav-inner {
      max-width: 1240px;
      margin: 0 auto;
      height: 68px;
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .lp-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
    }
    .lp-logo-box {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, rgba(var(--lp-primary-rgb), .2), rgba(var(--lp-primary-rgb), .05));
      border: 1px solid rgba(var(--lp-primary-rgb), .3);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px rgba(var(--lp-primary-rgb), .15);
    }
    .lp-brand-name {
      font-size: .95rem;
      font-weight: 800;
      color: #f1f5f9;
      letter-spacing: .06em;
    }
    .lp-brand-name span { color: var(--lp-primary); }

    .lp-nav-links {
      display: flex;
      gap: 4px;
      flex: 1;
    }
    .lp-nav-links a {
      padding: 6px 14px;
      font-size: .85rem;
      color: #94a3b8;
      font-weight: 500;
      text-decoration: none;
      border-radius: 8px;
      transition: all .2s;
    }
    .lp-nav-links a:hover { color: #f1f5f9; background: rgba(255,255,255,.05); }

    .lp-nav-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }

    /* ─── Theme swatches ─── */
    .lp-theme-btns {
      display: flex;
      gap: 6px;
      align-items: center;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 4px 8px;
    }
    .lp-theme-dot {
      position: relative;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid transparent;
      background: var(--dot-color, #6366f1);
      cursor: pointer;
      transition: all .25s cubic-bezier(.4,0,.2,1);
      padding: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,.3);
    }
    .lp-theme-dot:hover {
      transform: scale(1.25);
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
    }
    .lp-theme-dot.active {
      border-color: #fff;
      transform: scale(1.2);
      box-shadow: 0 0 0 3px rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,.4);
    }
    /* Tooltip on hover */
    .dot-label {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) scale(0.8);
      background: rgba(15,23,42,0.95);
      color: #f1f5f9;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: all .2s;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .dot-label::after {
      content: '';
      position: absolute;
      top: 100%; left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: rgba(15,23,42,0.95);
    }
    .lp-theme-dot:hover .dot-label {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }

    .nav-btn-ghost {
      padding: 7px 16px;
      background: transparent;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 9px;
      color: #94a3b8;
      font-size: .84rem;
      font-weight: 500;
      cursor: pointer;
      transition: all .2s;
      font-family: inherit;
    }
    .nav-btn-ghost:hover { border-color: rgba(var(--lp-primary-rgb), .4); color: var(--lp-primary); }

    .nav-btn-primary {
      padding: 7px 18px;
      background: linear-gradient(135deg, var(--lp-primary), #ea580c);
      border: none;
      border-radius: 9px;
      color: #fff;
      font-size: .84rem;
      font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      transition: all .2s;
      box-shadow: 0 4px 16px rgba(var(--lp-primary-rgb), .3);
      font-family: inherit;
    }
    .nav-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(var(--lp-primary-rgb), .4); }

    .lp-burger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      margin-left: auto;
    }
    .lp-burger span {
      display: block; width: 22px; height: 2px;
      background: #94a3b8;
      border-radius: 2px;
      transition: all .3s;
    }
    .lp-burger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .lp-burger.open span:nth-child(2) { opacity: 0; }
    .lp-burger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

    .lp-mobile-menu {
      max-height: 0;
      overflow: hidden;
      transition: max-height .4s ease;
      background: rgba(8,14,26,.98);
      border-top: 1px solid rgba(255,255,255,.06);
    }
    .lp-mobile-menu.open { max-height: 400px; }
    .lp-mobile-menu a, .lp-mobile-menu span {
      display: block;
      padding: 14px 24px;
      color: #94a3b8;
      text-decoration: none;
      font-size: .9rem;
      border-bottom: 1px solid rgba(255,255,255,.04);
    }
    .mobile-menu-btns {
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .w-full { width: 100%; justify-content: center; }

    /* ─────────────────────────────────────────────────────────────────
       HERO
    ───────────────────────────────────────────────────────────────── */
    .lp-hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 28px 60px;
      position: relative;
      overflow: hidden;
    }

    .hero-bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(249,115,22,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(249,115,22,.04) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 20%, black 30%, transparent 100%);
    }

    .hero-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .hero-orb-1 {
      width: 700px; height: 700px;
      background: radial-gradient(circle, rgba(249,115,22,.12) 0%, transparent 70%);
      top: -200px; left: 50%; transform: translateX(-50%);
    }
    .hero-orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(99,102,241,.1) 0%, transparent 70%);
      top: 200px; left: -100px;
    }
    .hero-orb-3 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(var(--lp-accent), .08) 0%, transparent 70%);
      top: 100px; right: -50px;
    }

    .hero-inner {
      max-width: 1240px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 64px;
      position: relative;
      z-index: 1;
    }

    .hero-content { flex: 1; min-width: 0; }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(var(--lp-primary-rgb), .08);
      border: 1px solid rgba(var(--lp-primary-rgb), .2);
      border-radius: 100px;
      font-size: .78rem;
      color: var(--lp-primary);
      font-weight: 600;
      margin-bottom: 28px;
      animation: fadeUp .6s ease both;
    }
    .badge-dot {
      width: 6px; height: 6px;
      background: #f97316;
      border-radius: 50%;
      box-shadow: 0 0 8px #f97316;
      animation: pulse 2s infinite;
    }
    .badge-sep { opacity: .4; }
    .badge-new {
      background: linear-gradient(135deg, #f97316, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 800;
    }

    .hero-title {
      font-size: clamp(2.4rem, 5vw, 4rem);
      font-weight: 900;
      line-height: 1.08;
      letter-spacing: -.04em;
      color: #f1f5f9;
      margin: 0 0 20px;
      animation: fadeUp .6s .1s ease both;
    }
    .hero-gradient-text {
      background: linear-gradient(135deg, #f97316 0%, #fb923c 40%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-desc {
      font-size: 1.05rem;
      color: #64748b;
      line-height: 1.7;
      max-width: 500px;
      margin: 0 0 32px;
      animation: fadeUp .6s .2s ease both;
    }

    .hero-ctas {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 28px;
      animation: fadeUp .6s .3s ease both;
    }

    .cta-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 13px 26px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-size: .95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all .25s;
      box-shadow: 0 8px 32px rgba(249,115,22,.4);
      font-family: inherit;
    }
    .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(var(--lp-primary-rgb), .5); }

    .cta-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 13px 24px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px;
      color: #94a3b8;
      font-size: .95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .25s;
      font-family: inherit;
    }
    .cta-secondary:hover { border-color: rgba(var(--lp-primary-rgb), .3); color: #f1f5f9; background: rgba(255,255,255,.07); }

    .hero-trust {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      animation: fadeUp .6s .4s ease both;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: .8rem;
      color: #475569;
    }

    /* Preview panel */
    .hero-preview {
      flex: 1;
      min-width: 0;
      max-width: 560px;
      position: relative;
      animation: fadeUp .8s .2s ease both;
    }
    .preview-frame {
      background: #0f1a2e;
      border: 1px solid rgba(249,115,22,.15);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
    }
    .preview-header {
      background: #0a1020;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .ph-dots { display: flex; gap: 5px; }
    .ph-dots span {
      width: 9px; height: 9px; border-radius: 50%;
      background: rgba(255,255,255,.15);
    }
    .ph-dots span:first-child { background: #ef4444; }
    .ph-dots span:nth-child(2) { background: #eab308; }
    .ph-dots span:nth-child(3) { background: #22c55e; }
    .ph-url {
      flex: 1;
      text-align: center;
      font-size: .7rem;
      color: #334155;
      background: rgba(255,255,255,.04);
      border-radius: 6px;
      padding: 3px 12px;
    }
    .ph-actions { display: flex; gap: 4px; }
    .ph-actions span { width: 16px; height: 16px; background: rgba(255,255,255,.06); border-radius: 4px; }

    .preview-body {
      display: flex;
      height: 260px;
    }
    .pb-sidebar {
      width: 44px;
      background: #080e1a;
      border-right: 1px solid rgba(255,255,255,.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 12px;
    }
    .pbs-logo {
      width: 28px; height: 28px;
      background: rgba(249,115,22,.12);
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .pbs-items { display: flex; flex-direction: column; gap: 6px; }
    .pbs-item {
      width: 24px; height: 5px;
      background: rgba(255,255,255,.08);
      border-radius: 3px;
    }
    .pbs-item.active { background: rgba(249,115,22,.5); }

    .pb-content { flex: 1; padding: 12px 14px; overflow: hidden; }
    .pbc-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .pbc-title { font-size: .72rem; font-weight: 700; color: #e2e8f0; }
    .pbc-avatar {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #a855f7);
    }

    .pbc-kpis { display: flex; gap: 6px; margin-bottom: 10px; }
    .pbc-kpi {
      flex: 1;
      padding: 6px 8px;
      border-radius: 7px;
      border: 1px solid transparent;
      background: rgba(255,255,255,.03);
    }
    .kpi-icon {
      width: 16px; height: 16px;
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .kpi-dot { width: 6px; height: 6px; border-radius: 50%; }
    .kpi-val { font-size: .68rem; font-weight: 800; }
    .kpi-label { font-size: .55rem; color: #334155; }

    .pbc-chart {
      height: 50px;
      background: rgba(255,255,255,.02);
      border-radius: 7px;
      margin-bottom: 8px;
      display: flex;
      align-items: flex-end;
      padding: 6px 8px;
      gap: 3px;
      overflow: hidden;
      position: relative;
    }
    .chart-bars { display: flex; align-items: flex-end; gap: 3px; flex: 1; height: 100%; }
    .chart-bar {
      flex: 1;
      background: linear-gradient(to top, rgba(249,115,22,.7), rgba(249,115,22,.2));
      border-radius: 2px 2px 0 0;
      min-height: 4px;
      transition: height .5s ease;
    }
    .chart-line {
      position: absolute;
      bottom: 16px; left: 8px; right: 8px;
      height: 1px;
      background: rgba(249,115,22,.2);
    }

    .pbc-table { font-size: .6rem; }
    .pt-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      border-bottom: 1px solid rgba(255,255,255,.04);
      color: #475569;
    }
    .pt-row.header { color: #1e293b; font-weight: 700; font-size: .55rem; text-transform: uppercase; }
    .pt-badge { padding: 1px 5px; border-radius: 4px; font-size: .55rem; font-weight: 600; }
    .pt-badge.paid { background: rgba(34,197,94,.12); color: #22c55e; }
    .pt-badge.pending { background: rgba(234,179,8,.12); color: #eab308; }

    /* Floating cards */
    .float-card {
      position: absolute;
      background: rgba(15,26,46,.95);
      border: 1px solid rgba(249,115,22,.2);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }
    .fc-icon { font-size: 1.4rem; }
    .fc-val { font-size: .82rem; font-weight: 800; color: #f1f5f9; }
    .fc-label { font-size: .65rem; color: #334155; }
    .fc-1 { bottom: 20px; left: -30px; animation: float1 4s ease-in-out infinite; }
    .fc-2 { top: 30px; right: -20px; animation: float2 5s ease-in-out infinite; }
    .fc-3 { bottom: 80px; right: -25px; animation: float3 4.5s ease-in-out infinite; }

    /* Stats row */
    .hero-stats-row {
      display: flex;
      gap: 48px;
      justify-content: center;
      margin-top: 64px;
      padding: 28px 0;
      border-top: 1px solid rgba(255,255,255,.05);
      border-bottom: 1px solid rgba(255,255,255,.05);
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 1240px;
      animation: fadeUp .6s .5s ease both;
    }
    .hero-stat { text-align: center; }
    .hs-val {
      font-size: 2.2rem;
      font-weight: 900;
      color: #f1f5f9;
      background: linear-gradient(135deg, var(--lp-primary), #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -.04em;
    }
    .hs-label { font-size: .8rem; color: #334155; margin-top: 4px; }

    /* ─────────────────────────────────────────────────────────────────
       TRUST BAR
    ───────────────────────────────────────────────────────────────── */
    .lp-trust-bar {
      padding: 40px 28px;
      border-bottom: 1px solid rgba(255,255,255,.05);
      overflow: hidden;
    }
    .trust-bar-label {
      text-align: center;
      font-size: .75rem;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: .1em;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .trust-logos-track { overflow: hidden; }
    .trust-logos {
      display: flex;
      gap: 48px;
      animation: scrollLogos 20s linear infinite;
      width: max-content;
    }
    .trust-client {
      font-size: .85rem;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      letter-spacing: .04em;
    }

    /* ─────────────────────────────────────────────────────────────────
       SECTIONS COMMON
    ───────────────────────────────────────────────────────────────── */
    .lp-section {
      padding: 96px 28px;
    }
    .section-inner {
      max-width: 1240px;
      margin: 0 auto;
    }
    .section-header {
      text-align: center;
      margin-bottom: 56px;
    }
    .section-pill {
      display: inline-block;
      padding: 5px 14px;
      background: rgba(249,115,22,.1);
      border: 1px solid rgba(249,115,22,.2);
      border-radius: 100px;
      font-size: .72rem;
      font-weight: 700;
      color: #fb923c;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: clamp(1.8rem, 3.5vw, 2.6rem);
      font-weight: 900;
      color: #f1f5f9;
      letter-spacing: -.04em;
      line-height: 1.15;
      margin: 0 0 16px;
    }
    .section-desc {
      font-size: .95rem;
      color: #334155;
      max-width: 560px;
      margin: 0 auto;
      line-height: 1.7;
    }

    /* Reveal animation */
    .reveal {
      opacity: 1 !important;
      transform: translateY(0) !important;
      transition: opacity .4s ease, transform .4s ease;
    }
    .reveal.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    /* ─────────────────────────────────────────────────────────────────
       FEATURES GRID
    ───────────────────────────────────────────────────────────────── */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .feat-card {
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 16px;
      padding: 28px;
      transition: all .3s ease;
      cursor: default;
      position: relative;
      overflow: hidden;
    }
    .feat-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(249,115,22,.04), transparent);
      opacity: 0;
      transition: opacity .3s;
    }
    .feat-card:hover { border-color: rgba(249,115,22,.2); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,.3); }
    .feat-card:hover::before { opacity: 1; }

    .feat-icon-wrap {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
    }
    .feat-icon-wrap .material-symbols-outlined { font-size: 22px; }
    .feat-icon-orange { background: rgba(249,115,22,.12); border: 1px solid rgba(249,115,22,.2); }
    .feat-icon-orange .material-symbols-outlined { color: #f97316; }
    .feat-icon-blue { background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.2); }
    .feat-icon-blue .material-symbols-outlined { color: #3b82f6; }
    .feat-icon-green { background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.2); }
    .feat-icon-green .material-symbols-outlined { color: #22c55e; }
    .feat-icon-purple { background: rgba(168,85,247,.12); border: 1px solid rgba(168,85,247,.2); }
    .feat-icon-purple .material-symbols-outlined { color: #a855f7; }
    .feat-icon-pink { background: rgba(236,72,153,.12); border: 1px solid rgba(236,72,153,.2); }
    .feat-icon-pink .material-symbols-outlined { color: #ec4899; }
    .feat-icon-yellow { background: rgba(234,179,8,.12); border: 1px solid rgba(234,179,8,.2); }
    .feat-icon-yellow .material-symbols-outlined { color: #eab308; }

    .feat-name { font-size: 1rem; font-weight: 700; color: #e2e8f0; margin: 0 0 8px; }
    .feat-desc { font-size: .83rem; color: #334155; line-height: 1.6; margin: 0 0 14px; }
    .feat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
    .feat-tag {
      padding: 2px 9px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 100px;
      font-size: .68rem;
      color: #475569;
      font-weight: 600;
    }
    .feat-arrow {
      color: #1e293b;
      transition: all .2s;
    }
    .feat-card:hover .feat-arrow { color: #f97316; transform: translateX(4px); }

    /* ─────────────────────────────────────────────────────────────────
       MODULES
    ───────────────────────────────────────────────────────────────── */
    .lp-modules {
      background: linear-gradient(180deg, transparent, rgba(249,115,22,.02), transparent);
    }
    .modules-layout {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 24px;
      align-items: start;
    }
    .module-tabs { display: flex; flex-direction: column; gap: 8px; }
    .mod-tab {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.05);
      border-radius: 12px;
      cursor: pointer;
      transition: all .2s;
      text-align: left;
      font-family: inherit;
    }
    .mod-tab:hover { border-color: rgba(249,115,22,.15); background: rgba(249,115,22,.03); }
    .mod-tab.active {
      border-color: rgba(249,115,22,.3);
      background: rgba(249,115,22,.06);
    }
    .mod-tab-icon {
      width: 38px; height: 38px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .mod-tab-icon .material-symbols-outlined { font-size: 18px; }
    .mod-icon-orange { background: rgba(249,115,22,.12); }
    .mod-icon-orange .material-symbols-outlined { color: #f97316; }
    .mod-icon-blue { background: rgba(59,130,246,.12); }
    .mod-icon-blue .material-symbols-outlined { color: #3b82f6; }
    .mod-icon-green { background: rgba(34,197,94,.12); }
    .mod-icon-green .material-symbols-outlined { color: #22c55e; }
    .mod-icon-purple { background: rgba(168,85,247,.12); }
    .mod-icon-purple .material-symbols-outlined { color: #a855f7; }
    .mod-tab-text { flex: 1; min-width: 0; }
    .mod-tab-name { font-size: .85rem; font-weight: 700; color: #e2e8f0; }
    .mod-tab-desc { font-size: .73rem; color: #334155; margin-top: 2px; }
    .mod-tab-arrow { color: #1e293b; transition: all .2s; flex-shrink: 0; }
    .mod-tab.active .mod-tab-arrow { color: #f97316; transform: translateX(2px); }

    .module-detail {
      display: none;
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(249,115,22,.15);
      border-radius: 16px;
      padding: 32px;
      animation: fadeUp .3s ease;
    }
    .module-detail.active { display: block; }

    .mod-detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .mod-detail-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .mod-detail-icon .material-symbols-outlined { font-size: 24px; }
    .mod-detail-name { font-size: 1.2rem; font-weight: 800; color: #f1f5f9; }
    .mod-detail-short { font-size: .8rem; color: #334155; margin-top: 3px; }
    .mod-detail-desc { font-size: .88rem; color: #475569; line-height: 1.7; margin-bottom: 24px; }

    .mod-features-list { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 12px; }
    .mod-features-list li {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: .87rem;
      color: #94a3b8;
    }
    .mod-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: .85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s;
      font-family: inherit;
      box-shadow: 0 4px 16px rgba(249,115,22,.3);
    }
    .mod-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(249,115,22,.4); }

    /* ─────────────────────────────────────────────────────────────────
       SECURITY
    ───────────────────────────────────────────────────────────────── */
    .lp-security { background: rgba(249,115,22,.015); }
    .security-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
    }
    .security-features { display: flex; flex-direction: column; gap: 16px; }
    .sec-feat {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .sec-feat-icon {
      width: 38px; height: 38px;
      flex-shrink: 0;
      border-radius: 10px;
      background: rgba(249,115,22,.1);
      border: 1px solid rgba(249,115,22,.15);
      display: flex; align-items: center; justify-content: center;
    }
    .sec-feat-icon .material-symbols-outlined { font-size: 18px; color: #f97316; }
    .sec-feat-name { font-size: .9rem; font-weight: 700; color: #e2e8f0; margin-bottom: 2px; }
    .sec-feat-desc { font-size: .8rem; color: #334155; line-height: 1.5; }

    .security-right { display: flex; justify-content: center; }
    .sec-visual {
      position: relative;
      width: 340px; height: 340px;
      display: flex; align-items: center; justify-content: center;
    }
    .sec-shield { width: 140px; height: 140px; }
    .sec-badge {
      position: absolute;
      padding: 6px 12px;
      background: rgba(15,26,46,.95);
      border: 1px solid rgba(249,115,22,.2);
      border-radius: 100px;
      font-size: .7rem;
      font-weight: 700;
      color: #94a3b8;
      white-space: nowrap;
    }
    .sb-1 { top: 30px; left: 10px; animation: float1 4s ease-in-out infinite; }
    .sb-2 { top: 10px; right: 30px; animation: float2 5s ease-in-out infinite; }
    .sb-3 { top: 50%; right: -10px; animation: float3 4.5s ease-in-out infinite; }
    .sb-4 { bottom: 30px; right: 20px; animation: float1 5.5s ease-in-out infinite; }
    .sb-5 { bottom: 10px; left: 30px; animation: float2 4s ease-in-out infinite; }
    .sb-6 { top: 50%; left: -10px; animation: float3 5s ease-in-out infinite; }

    /* ─────────────────────────────────────────────────────────────────
       PRICING
    ───────────────────────────────────────────────────────────────── */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      align-items: start;
    }
    .price-card {
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 20px;
      padding: 32px 28px;
      position: relative;
      transition: all .3s ease;
    }
    .price-card:hover { transform: translateY(-6px); border-color: rgba(249,115,22,.2); box-shadow: 0 20px 60px rgba(0,0,0,.3); }
    .price-card.popular {
      border-color: rgba(249,115,22,.35);
      background: rgba(249,115,22,.04);
      box-shadow: 0 0 0 1px rgba(249,115,22,.15), 0 16px 48px rgba(249,115,22,.1);
    }
    .popular-badge {
      position: absolute;
      top: -12px; left: 50%; transform: translateX(-50%);
      padding: 4px 14px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 100px;
      font-size: .72rem;
      font-weight: 800;
      color: #fff;
      white-space: nowrap;
    }
    .price-icon {
      width: 48px; height: 48px;
      border-radius: 13px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .price-icon .material-symbols-outlined { font-size: 22px; }
    .price-icon-green { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.2); }
    .price-icon-green .material-symbols-outlined { color: #22c55e; }
    .price-icon-orange { background: rgba(249,115,22,.1); border: 1px solid rgba(249,115,22,.2); }
    .price-icon-orange .material-symbols-outlined { color: #f97316; }
    .price-icon-purple { background: rgba(168,85,247,.1); border: 1px solid rgba(168,85,247,.2); }
    .price-icon-purple .material-symbols-outlined { color: #a855f7; }

    .price-name { font-size: .9rem; font-weight: 700; color: #94a3b8; margin-bottom: 10px; }
    .price-amount { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
    .price-val { font-size: 2rem; font-weight: 900; color: #f1f5f9; letter-spacing: -.04em; }
    .price-period { font-size: .82rem; color: #334155; }
    .price-desc { font-size: .8rem; color: #334155; margin-bottom: 20px; line-height: 1.5; }
    .price-sep { height: 1px; background: rgba(255,255,255,.06); margin-bottom: 20px; }
    .price-features { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 10px; }
    .price-features li { display: flex; align-items: center; gap: 9px; font-size: .83rem; color: #64748b; }

    .price-cta {
      width: 100%;
      padding: 12px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 11px;
      color: #94a3b8;
      font-size: .87rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s;
      font-family: inherit;
    }
    .price-cta:hover { border-color: rgba(249,115,22,.3); color: #f1f5f9; }
    .price-cta-popular {
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-color: transparent;
      color: #fff;
      box-shadow: 0 6px 20px rgba(249,115,22,.35);
    }
    .price-cta-popular:hover { box-shadow: 0 10px 30px rgba(249,115,22,.5); color: #fff; }

    .pricing-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 32px;
      font-size: .78rem;
      color: #1e293b;
    }

    /* ─────────────────────────────────────────────────────────────────
       TESTIMONIALS
    ───────────────────────────────────────────────────────────────── */
    .lp-testi { background: linear-gradient(180deg, transparent, rgba(249,115,22,.015), transparent); }
    .testi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .testi-card {
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 16px;
      padding: 28px;
      transition: all .3s;
    }
    .testi-card:hover { transform: translateY(-4px); border-color: rgba(249,115,22,.15); }
    .testi-stars { display: flex; gap: 3px; margin-bottom: 14px; }
    .testi-text { font-size: .87rem; color: #64748b; line-height: 1.7; margin-bottom: 20px; font-style: italic; }
    .testi-author { display: flex; align-items: center; gap: 12px; }
    .testi-avatar {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #a855f7);
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 800; color: #fff;
      flex-shrink: 0;
    }
    .testi-name { font-size: .85rem; font-weight: 700; color: #e2e8f0; }
    .testi-role { font-size: .7rem; color: #1e293b; margin-top: 2px; }

    /* ─────────────────────────────────────────────────────────────────
       FAQ
    ───────────────────────────────────────────────────────────────── */
    .faq-list { max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
    .faq-item {
      background: rgba(255,255,255,.02);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: border-color .2s;
    }
    .faq-item.open { border-color: rgba(249,115,22,.2); }
    .faq-item:hover { border-color: rgba(249,115,22,.15); }
    .faq-q {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 18px 22px;
      font-size: .9rem;
      font-weight: 600;
      color: #e2e8f0;
    }
    .faq-chevron { transition: transform .3s ease; flex-shrink: 0; color: #334155; }
    .faq-item.open .faq-chevron { transform: rotate(180deg); color: #f97316; }
    .faq-a {
      max-height: 0;
      overflow: hidden;
      font-size: .85rem;
      color: #475569;
      line-height: 1.7;
      padding: 0 22px;
      transition: max-height .4s ease, padding .3s ease;
    }
    .faq-item.open .faq-a { max-height: 300px; padding: 0 22px 18px; }

    /* ─────────────────────────────────────────────────────────────────
       CTA FINAL
    ───────────────────────────────────────────────────────────────── */
    .lp-cta {
      padding: 100px 28px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cta-orb {
      position: absolute;
      width: 800px; height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(249,115,22,.08) 0%, transparent 65%);
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      pointer-events: none;
    }
    .cta-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
    .cta-icon-box {
      width: 72px; height: 72px;
      margin: 0 auto 28px;
      border-radius: 20px;
      background: rgba(249,115,22,.1);
      border: 1px solid rgba(249,115,22,.25);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 40px rgba(249,115,22,.2);
    }
    .cta-title {
      font-size: clamp(1.8rem, 3.5vw, 2.8rem);
      font-weight: 900;
      color: #f1f5f9;
      letter-spacing: -.04em;
      margin: 0 0 16px;
    }
    .cta-subtitle { font-size: .95rem; color: #334155; line-height: 1.7; margin-bottom: 36px; }
    .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
    .cta-secondary-light {
      background: rgba(255,255,255,.07);
      border-color: rgba(255,255,255,.12);
    }
    .cta-assurances {
      display: flex;
      gap: 24px;
      justify-content: center;
      flex-wrap: wrap;
      font-size: .78rem;
      color: #1e293b;
    }

    /* ─────────────────────────────────────────────────────────────────
       FOOTER
    ───────────────────────────────────────────────────────────────── */
    .lp-footer {
      padding: 56px 28px 24px;
      border-top: 1px solid rgba(255,255,255,.05);
    }
    .footer-inner {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      gap: 48px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }
    .footer-brand-col { flex: 2; min-width: 200px; }
    .footer-tagline { font-size: .82rem; color: #1e293b; line-height: 1.65; max-width: 260px; margin-bottom: 20px; }
    .footer-socials { display: flex; gap: 8px; }
    .social-link {
      width: 32px; height: 32px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      text-decoration: none;
      color: #475569;
      font-size: .8rem;
      font-weight: 700;
      transition: all .2s;
    }
    .social-link:hover { border-color: rgba(249,115,22,.3); color: #f97316; }
    .footer-links-grid { display: flex; gap: 48px; flex: 3; flex-wrap: wrap; }
    .footer-col { display: flex; flex-direction: column; gap: 10px; min-width: 110px; }
    .footer-col-title { font-size: .68rem; font-weight: 800; color: #f1f5f9; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; }
    .footer-col a, .footer-col span { font-size: .82rem; color: #1e293b; text-decoration: none; transition: color .2s; cursor: pointer; }
    .footer-col a:hover, .footer-col span:hover { color: #475569; }
    .footer-bar {
      max-width: 1240px;
      margin: 0 auto;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,.04);
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: .73rem;
      color: #1e293b;
    }
    .footer-bar-links { display: flex; gap: 20px; }
    .footer-bar-links span { cursor: pointer; transition: color .2s; }
    .footer-bar-links span:hover { color: #475569; }

    /* ─────────────────────────────────────────────────────────────────
       ANIMATIONS
    ───────────────────────────────────────────────────────────────── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 6px #f97316; }
      50%       { box-shadow: 0 0 14px #f97316, 0 0 24px rgba(249,115,22,.4); }
    }
    @keyframes float1 {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-8px); }
    }
    @keyframes float2 {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-12px); }
    }
    @keyframes float3 {
      0%, 100% { transform: translateY(-4px); }
      50%       { transform: translateY(4px); }
    }
    @keyframes scrollLogos {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    /* ─────────────────────────────────────────────────────────────────
       RESPONSIVE
    ───────────────────────────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .modules-layout { grid-template-columns: 1fr; }
      .module-tabs { flex-direction: row; flex-wrap: wrap; }
      .mod-tab { flex: 1; min-width: 160px; }
      .security-grid { grid-template-columns: 1fr; gap: 40px; }
      .security-right { display: none; }
    }
    @media (max-width: 768px) {
      .lp-nav-links, .lp-nav-actions { display: none; }
      .lp-burger { display: flex; }
      .hero-inner { flex-direction: column; text-align: center; padding-top: 80px; gap: 40px; }
      .hero-preview { max-width: 100%; }
      .float-card { display: none; }
      .hero-trust { justify-content: center; }
      .hero-stats-row { gap: 24px; flex-wrap: wrap; }
      .features-grid { grid-template-columns: 1fr; }
      .pricing-grid { grid-template-columns: 1fr; }
      .testi-grid { grid-template-columns: 1fr; }
      .footer-inner { flex-direction: column; gap: 32px; }
    }
    @media (max-width: 480px) {
      .lp-section { padding: 64px 20px; }
      .hero-ctas { flex-direction: column; }
      .cta-btns { flex-direction: column; align-items: center; }
    }
    /* ═══════════════════════════════════════════════════════════════════
       THÈME CLAIR — Classe .lp-light appliquée dynamiquement
       Surcharge toutes les couleurs sombres du thème par défaut
    ═══════════════════════════════════════════════════════════════════ */
    .lp-light {
      background: #f1f5f9 !important;
      color: #0f172a !important;
    }

    /* Navbar */
    .lp-light .lp-nav.scrolled {
      background: rgba(255, 255, 255, 0.96) !important;
      border-color: rgba(0,0,0,0.08) !important;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06) !important;
    }
    .lp-light .lp-brand-name { color: #0f172a !important; }
    .lp-light .lp-nav-links a { color: #475569 !important; }
    .lp-light .lp-nav-links a:hover { color: #0f172a !important; background: rgba(0,0,0,0.04) !important; }
    .lp-light .nav-btn-ghost {
      border-color: rgba(0,0,0,0.12) !important;
      color: #475569 !important;
    }
    .lp-light .nav-btn-ghost:hover { border-color: var(--lp-primary) !important; color: var(--lp-primary) !important; }
    /* Bouton "Essai gratuit" — forcer orange + texte blanc en thème clair */
    .lp-light .nav-btn-primary {
      background: linear-gradient(135deg, #f97316, #ea580c) !important;
      color: #ffffff !important;
      border: none !important;
      box-shadow: 0 4px 16px rgba(249,115,22,.35) !important;
    }
    .lp-light .nav-btn-primary svg { stroke: #ffffff !important; }
    .lp-light .nav-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(249,115,22,.5) !important;
    }
    .lp-light .lp-theme-btns {
      background: rgba(0,0,0,0.04) !important;
      border-color: rgba(0,0,0,0.08) !important;
    }
    .lp-light .lp-burger span { background: #475569 !important; }
    .lp-light .lp-mobile-menu { background: rgba(255,255,255,0.98) !important; border-color: rgba(0,0,0,0.08) !important; }
    .lp-light .lp-mobile-menu a, .lp-light .lp-mobile-menu span { color: #475569 !important; border-color: rgba(0,0,0,0.06) !important; }

    /* Hero */
    .lp-light .lp-hero { background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); }
    .lp-light .hero-bg-grid {
      background-image:
        linear-gradient(rgba(249,115,22,.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(249,115,22,.06) 1px, transparent 1px) !important;
    }
    .lp-light .hero-badge { background: rgba(249,115,22,.08) !important; border-color: rgba(249,115,22,.2) !important; color: #c2410c !important; }
    .lp-light .hero-title { color: #0f172a !important; }
    .lp-light .hero-sub { color: #475569 !important; }
    .lp-light .btn-outline-hero { color: #475569 !important; border-color: rgba(0,0,0,0.15) !important; }
    .lp-light .btn-outline-hero:hover { background: rgba(0,0,0,0.04) !important; border-color: #94a3b8 !important; }
    .lp-light .hero-trust-item { color: #64748b !important; }
    .lp-light .hero-stat-val { color: #0f172a !important; }
    .lp-light .hero-stat-label { color: #64748b !important; }

    /* Hero preview card */
    .lp-light .hero-preview {
      background: linear-gradient(135deg, rgba(249,115,22,.06), rgba(168,85,247,.04)) !important;
      border-color: rgba(0,0,0,0.08) !important;
    }
    .lp-light .preview-topbar { background: rgba(0,0,0,0.04) !important; border-color: rgba(0,0,0,0.06) !important; }
    .lp-light .preview-title { color: #475569 !important; }
    .lp-light .preview-kpi-item { background: rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.06) !important; }
    .lp-light .preview-kpi-label { color: #64748b !important; }
    .lp-light .preview-kpi-val { color: #0f172a !important; }
    .lp-light .preview-row { border-color: rgba(0,0,0,0.05) !important; }
    .lp-light .preview-name { color: #334155 !important; }
    .lp-light .preview-amount { color: #0f172a !important; }
    .lp-light .preview-table-area { background: rgba(0,0,0,0.02) !important; border-color: rgba(0,0,0,0.06) !important; }
    .lp-light .float-card { background: rgba(255,255,255,0.95) !important; border-color: rgba(0,0,0,0.08) !important; color: #334155 !important; box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }

    /* Sections communes */
    .lp-light .section-eyebrow { color: var(--lp-primary) !important; }
    .lp-light .section-title { color: #0f172a !important; }
    .lp-light .section-sub { color: #64748b !important; }

    /* Features */
    .lp-light .lp-features { background: #ffffff !important; }
    .lp-light .feat-card {
      background: #ffffff !important;
      border-color: rgba(0,0,0,0.07) !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04) !important;
    }
    .lp-light .feat-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08) !important; border-color: rgba(249,115,22,.2) !important; }
    .lp-light .feat-name { color: #0f172a !important; }
    .lp-light .feat-desc { color: #64748b !important; }
    .lp-light .feat-tag { background: rgba(0,0,0,0.05) !important; color: #475569 !important; }

    /* Clients logos */
    .lp-light .lp-clients { background: #f8fafc !important; border-color: rgba(0,0,0,0.06) !important; }
    .lp-light .client-name { color: #94a3b8 !important; }
    .lp-light .client-name:hover { color: #475569 !important; }

    /* Modules */
    .lp-light .lp-modules { background: #f1f5f9 !important; }
    .lp-light .mod-tab {
      background: rgba(255,255,255,0.6) !important;
      border-color: rgba(0,0,0,0.08) !important;
      color: #475569 !important;
    }
    .lp-light .mod-tab:hover { background: rgba(255,255,255,0.9) !important; color: #0f172a !important; }
    .lp-light .mod-tab.active { background: #ffffff !important; color: var(--lp-primary) !important; box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important; }
    .lp-light .mod-tab-name { color: inherit !important; }
    .lp-light .mod-content { background: #ffffff !important; border-color: rgba(0,0,0,0.08) !important; }
    .lp-light .mod-desc { color: #475569 !important; }
    .lp-light .mod-feat-item { color: #334155 !important; }
    .lp-light .mod-feat-item::before { color: var(--lp-primary) !important; }

    /* Security */
    .lp-light .lp-security { background: #ffffff !important; }
    .lp-light .sec-item {
      background: rgba(0,0,0,0.02) !important;
      border-color: rgba(0,0,0,0.07) !important;
    }
    .lp-light .sec-item:hover { background: rgba(249,115,22,.04) !important; border-color: rgba(249,115,22,.15) !important; }
    .lp-light .sec-name { color: #0f172a !important; }
    .lp-light .sec-desc { color: #64748b !important; }
    .lp-light .sec-visual { background: rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.06) !important; }

    /* Pricing */
    .lp-light .lp-pricing { background: #f8fafc !important; }
    .lp-light .price-card {
      background: #ffffff !important;
      border-color: rgba(0,0,0,0.08) !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04) !important;
    }
    .lp-light .price-card.popular { box-shadow: 0 8px 32px rgba(249,115,22,.15) !important; }
    .lp-light .price-name { color: #0f172a !important; }
    .lp-light .price-desc { color: #64748b !important; }
    .lp-light .price-val { color: #0f172a !important; }
    .lp-light .price-period { color: #64748b !important; }
    .lp-light .price-feat-item { color: #475569 !important; }
    .lp-light .price-cta { background: rgba(0,0,0,0.05) !important; color: #475569 !important; border-color: transparent !important; }
    .lp-light .price-cta:hover { background: rgba(0,0,0,0.08) !important; }
    .lp-light .pricing-note { color: #64748b !important; }

    /* Testimonials */
    .lp-light .lp-testi { background: #f1f5f9 !important; }
    .lp-light .testi-card {
      background: #ffffff !important;
      border-color: rgba(0,0,0,0.07) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
    }
    .lp-light .testi-text { color: #334155 !important; }
    .lp-light .testi-name { color: #0f172a !important; }
    .lp-light .testi-role { color: #64748b !important; }

    /* FAQ */
    .lp-light .lp-faq { background: #ffffff !important; }
    .lp-light .faq-item {
      background: #f8fafc !important;
      border-color: rgba(0,0,0,0.07) !important;
    }
    .lp-light .faq-item:hover { border-color: rgba(249,115,22,.2) !important; background: #fff7ed !important; }
    .lp-light .faq-q { color: #0f172a !important; }
    .lp-light .faq-a { color: #475569 !important; }
    .lp-light .faq-icon { color: #94a3b8 !important; }

    /* CTA Banner */
    .lp-light .lp-cta { background: linear-gradient(135deg, #fff7ed, #fef3c7) !important; }
    .lp-light .cta-title { color: #0f172a !important; }
    .lp-light .cta-sub { color: #475569 !important; }
    .lp-light .btn-outline-cta { color: #475569 !important; border-color: rgba(0,0,0,0.15) !important; }

    /* Contact */
    .lp-light .lp-contact { background: #f1f5f9 !important; }
    .lp-light .contact-card {
      background: #ffffff !important;
      border-color: rgba(0,0,0,0.08) !important;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06) !important;
    }
    .lp-light .form-group label { color: #374151 !important; }
    .lp-light .form-group input,
    .lp-light .form-group select,
    .lp-light .form-group textarea {
      background: #f8fafc !important;
      border-color: #d1d5db !important;
      color: #0f172a !important;
    }
    .lp-light .form-group input::placeholder,
    .lp-light .form-group textarea::placeholder { color: #9ca3af !important; }
    .lp-light .form-group input:focus,
    .lp-light .form-group select:focus,
    .lp-light .form-group textarea:focus {
      border-color: var(--lp-primary) !important;
      background: #ffffff !important;
    }
    .lp-light .contact-info-item { color: #475569 !important; }

    /* Footer */
    .lp-light .lp-footer { background: #1e293b !important; } /* garde sombre — standard pour les footers */
    .lp-light .footer-bar { color: #64748b !important; }

    /* ═══════════════════════════════════════════════════════════════════
       DEMO MODAL
    ═══════════════════════════════════════════════════════════════════ */
    .demo-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: overlayIn 0.25s ease;
    }
    @keyframes overlayIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .demo-modal {
      width: 95vw;
      max-width: 1260px;
      height: 85vh;
      max-height: 840px;
      background: #0f1629;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.25);
      animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.94) translateY(20px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .demo-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 28px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
      background: linear-gradient(90deg, rgba(13,159,170,0.12) 0%, rgba(99,102,241,0.06) 50%, rgba(249,115,22,0.08) 100%);
      position: relative;
    }
    .demo-modal-header::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, rgba(13,159,170,0.4), rgba(249,115,22,0.4), transparent);
    }
    .demo-modal-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .demo-modal-icon {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #0d9faa, #0a7080);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 18px rgba(13,159,170,0.5);
    }
    .demo-modal-icon svg { width: 22px; height: 22px; }
    .demo-modal-title h2 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .demo-modal-title p {
      font-size: 0.74rem;
      color: #94a3b8;
      margin: 3px 0 0;
    }
    .demo-close-btn {
      width: 38px; height: 38px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      color: #94a3b8;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      font-size: 1.1rem;
      font-weight: 300;
      line-height: 1;
    }
    .demo-close-btn:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; transform: scale(1.05); }
    .demo-modal-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
    /* Video Player Side */
    .demo-player-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #060d1a;
      min-width: 0;
    }
    .demo-video-wrapper {
      position: relative;
      width: 100%;
      flex: 1;
      height: 100%;
      min-height: 0;
      background: #02060f;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .demo-video-frame {
      width: 100%; height: 100%;
      border: none;
      display: block;
    }
    .demo-video-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: linear-gradient(135deg, #060d1a 0%, #0d1b35 100%);
    }
    .demo-play-btn {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 0 12px rgba(249,115,22,0.12), 0 8px 32px rgba(249,115,22,0.4);
      transition: all 0.3s;
      animation: pulseDemoBtn 2.5s ease-in-out infinite;
    }
    @keyframes pulseDemoBtn {
      0%, 100% { box-shadow: 0 0 0 12px rgba(249,115,22,0.12), 0 8px 32px rgba(249,115,22,0.4); }
      50%       { box-shadow: 0 0 0 20px rgba(249,115,22,0.06), 0 8px 48px rgba(249,115,22,0.6); }
    }
    .demo-play-btn:hover { transform: scale(1.08); }
    .demo-play-btn svg { margin-left: 4px; }
    .demo-video-label {
      font-size: 0.9rem;
      color: #94a3b8;
      font-weight: 500;
      text-align: center;
      max-width: 280px;
    }
    .demo-video-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(249,115,22,0.12);
      border: 1px solid rgba(249,115,22,0.25);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 0.72rem;
      color: #fb923c;
      font-weight: 600;
    }
    /* Decorative screen elements in placeholder */
    .demo-screen-mockup {
      position: absolute;
      inset: 0;
      overflow: hidden;
      opacity: 0.12;
    }
    /* ═════════════════════════════════════════════════════════════════════
       LECTEUR VIDÉO RÉEL (fichiers MP4 locaux)
    ═════════════════════════════════════════════════════════════════════ */
    .demo-real-player {
      width: 100%; height: 100%;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .demo-real-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .demo-video-overlay-badge {
      position: absolute;
      bottom: 12px;
      left: 12px;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 11px;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    .demo-live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #22c55e;
      animation: livePulse 1.2s ease-in-out infinite;
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }

    /* ═════════════════════════════════════════════════════════════════════
       DÉMO SCREENS ANIMÉS — ERP interactif
    ═════════════════════════════════════════════════════════════════════ */
    .demo-screen-mockup::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 40px;
      background: rgba(99,102,241,0.4);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .demo-mockup-line {
      position: absolute;
      height: 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.3);
    }
    .demo-video-info {
      padding: 16px 22px;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
      background: linear-gradient(to right, rgba(13,159,170,0.04), transparent);
    }
    .demo-video-title {
      font-size: 1rem;
      font-weight: 800;
      color: #f1f5f9;
      margin: 0 0 5px;
      letter-spacing: -0.01em;
    }
    .demo-video-desc {
      font-size: 0.78rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.55;
    }
    .demo-video-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    }
    .demo-meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.68rem;
      font-weight: 600;
      color: #94a3b8;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 4px 10px;
      letter-spacing: 0.02em;
    }
    /* Playlist Side */
    .demo-playlist-side {
      width: 300px;
      flex-shrink: 0;
      border-left: 1px solid rgba(255,255,255,0.07);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #0a1220;
    }
    .demo-playlist-header {
      padding: 16px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }
    .demo-playlist-title {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0 0 3px;
    }
    .demo-playlist-count {
      font-size: 0.68rem;
      color: #64748b;
      font-weight: 500;
    }
    .demo-playlist-list {
      overflow-y: auto;
      flex: 1;
      padding: 8px;
    }
    .demo-playlist-list::-webkit-scrollbar { width: 4px; }
    .demo-playlist-list::-webkit-scrollbar-track { background: transparent; }
    .demo-playlist-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    .demo-playlist-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 10px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.22s;
      border: 1px solid transparent;
      margin-bottom: 6px;
    }
    .demo-playlist-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
    .demo-playlist-item.active {
      background: rgba(249,115,22,0.08);
      border-color: rgba(249,115,22,0.2);
    }
    .demo-item-thumb {
      width: 56px; height: 36px;
      border-radius: 7px;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      position: relative;
      overflow: hidden;
    }
    .demo-item-play-icon {
      position: absolute;
      inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.35);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .demo-playlist-item:hover .demo-item-play-icon,
    .demo-playlist-item.active .demo-item-play-icon { opacity: 1; }
    .demo-item-info { flex: 1; min-width: 0; }
    .demo-item-title {
      font-size: 0.79rem;
      font-weight: 700;
      color: #cbd5e1;
      margin: 0 0 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .demo-playlist-item.active .demo-item-title { color: #fb923c; }
    .demo-item-duration {
      font-size: 0.66rem;
      color: #64748b;
    }
    .demo-item-num {
      font-size: 0.65rem;
      color: #64748b;
      font-weight: 700;
      width: 18px;
      text-align: center;
    }
    .demo-playlist-item.active .demo-item-num { color: #f97316; }
    .demo-modal-footer {
      padding: 14px 24px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      background: rgba(0,0,0,0.2);
    }
    .demo-footer-nav {
      display: flex;
      gap: 8px;
    }
    .demo-nav-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .demo-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: #f1f5f9; }
    .demo-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .demo-cta-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 20px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(249,115,22,0.35);
    }
    .demo-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(249,115,22,0.5); }
    .demo-progress-dots {
      display: flex;
      gap: 5px;
      align-items: center;
    }
    .demo-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: all 0.25s; cursor: pointer; }
    .demo-dot.active { background: #f97316; width: 20px; border-radius: 3px; }
    /* Responsive */
    @media (max-width: 768px) {
      .demo-modal { max-width: 100%; border-radius: 16px; }
      .demo-modal-body { flex-direction: column; }
      .demo-playlist-side { width: 100%; height: 180px; border-left: none; border-top: 1px solid rgba(255,255,255,0.07); }
      .demo-playlist-list { display: flex; flex-direction: row; gap: 8px; padding: 8px; overflow-x: auto; overflow-y: hidden; }
      .demo-playlist-item { min-width: 160px; flex-direction: column; align-items: flex-start; }
    }

    /* ═══════════════════════════════════════════════════════════════════
       DÉMO SCREENS ANIMÉS — ERP interactif Haute Fidélité
    ═══════════════════════════════════════════════════════════════════ */
    .demo-screen-live {
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
      background: #0b1324;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 11px;
      overflow: hidden;
    }
    .ds-body-app {
      display: flex;
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      background: #0b1324;
      overflow: hidden;
    }
    .ds-screen {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-width: 0;
      animation: fadeUp 0.3s ease;
    }
    /* Sidebar ERP */
    .ds-sidebar {
      width: 100px; flex-shrink: 0;
      background: #0a1628;
      border-right: 1px solid rgba(255,255,255,0.06);
      padding: 8px 0;
      display: flex; flex-direction: column; gap: 2px;
    }
    .dsn {
      padding: 6px 10px;
      color: #475569;
      font-size: 9.5px;
      border-radius: 6px;
      margin: 0 4px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .dsn.active {
      background: rgba(249,115,22,0.12);
      color: #fb923c;
      border-left: 2px solid #f97316;
    }
    /* Zone contenu principale */
    .ds-main {
      flex: 1;
      padding: 10px 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ds-ptitle {
      font-size: 12px;
      font-weight: 700;
      color: #e2e8f0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding-bottom: 6px;
      flex-shrink: 0;
    }
    /* KPIs */
    .ds-kpis { display: flex; gap: 6px; flex-shrink: 0; }
    .ds-kpi {
      flex: 1;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-top: 2px solid var(--kc, #f97316);
      border-radius: 6px;
      padding: 6px 8px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .ds-kpi b { font-size: 11px; font-weight: 800; color: var(--kc, #f97316); }
    .ds-kpi small { font-size: 8px; color: #475569; }
    .ds-kpi em { font-size: 8px; color: #22c55e; font-style: normal; }
    /* Graphique en barres */
    .ds-chart-wrap { flex: 1; display: flex; flex-direction: column; gap: 4px; min-height: 0; }
    .ds-chart-lbl { font-size: 8px; color: #475569; }
    .ds-bars {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      flex: 1;
      padding-bottom: 12px;
      position: relative;
    }
    .ds-bars::before {
      content: '';
      position: absolute;
      bottom: 12px; left: 0; right: 0;
      height: 1px;
      background: rgba(255,255,255,0.06);
    }
    .ds-bar {
      flex: 1;
      height: var(--h, 50%);
      background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
      border-radius: 3px 3px 0 0;
      position: relative;
      animation: barGrow 0.6s ease backwards;
    }
    .ds-bar:nth-child(1) { animation-delay: 0.05s; }
    .ds-bar:nth-child(2) { animation-delay: 0.1s; }
    .ds-bar:nth-child(3) { animation-delay: 0.15s; }
    .ds-bar:nth-child(4) { animation-delay: 0.2s; }
    .ds-bar:nth-child(5) { animation-delay: 0.25s; }
    .ds-bar:nth-child(6) { animation-delay: 0.3s; }
    .ds-bar:nth-child(7) { animation-delay: 0.35s; }
    .ds-bar span {
      position: absolute;
      bottom: -11px;
      left: 50%; transform: translateX(-50%);
      font-size: 7px; color: #475569;
      white-space: nowrap;
    }
    @keyframes barGrow {
      from { height: 0; }
      to   { height: var(--h, 50%); }
    }
    /* Tableaux */
    .ds-table { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
    .ds-thead {
      display: flex; gap: 4px;
      padding: 4px 6px;
      background: rgba(255,255,255,0.04);
      border-radius: 4px;
      font-size: 8px; font-weight: 700; color: #475569;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .ds-thead span, .ds-trow span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ds-trow {
      display: flex; gap: 4px;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 9px; color: #94a3b8;
      border: 1px solid transparent;
      transition: background 0.2s;
    }
    .ds-trow:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); }
    .ds-total { background: rgba(249,115,22,0.06) !important; border-color: rgba(249,115,22,0.15) !important; color: #fb923c !important; font-weight: 700; }
    .ani { animation: rowSlide 0.4s ease var(--d, 0s) backwards; }
    @keyframes rowSlide {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    /* Badges statut */
    .bpaid { background: rgba(34,197,94,0.12); color: #22c55e; border-radius: 3px; padding: 1px 5px; font-size: 8px; font-weight: 600; white-space: nowrap; }
    .bwait { background: rgba(251,191,36,0.12); color: #fbbf24; border-radius: 3px; padding: 1px 5px; font-size: 8px; font-weight: 600; white-space: nowrap; }
    .blate { background: rgba(239,68,68,0.12); color: #ef4444; border-radius: 3px; padding: 1px 5px; font-size: 8px; font-weight: 600; white-space: nowrap; }
    /* CSS pour les Répliques Exactes des 4 Captures Client */
    .ds-mod-topbanner { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 12px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
    .ds-mtb-left { display: flex; align-items: center; gap: 12px; }
    .ds-mtb-icon { font-size: 22px; width: 40px; height: 40px; background: rgba(255,255,255,0.12); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .ds-mtb-kpis { display: flex; align-items: center; gap: 8px; }
    .ds-mtb-kpi { font-size: 10.5px; padding: 4px 10px; border-radius: 6px; font-weight: 600; border: 1px solid rgba(255,255,255,0.12); }

    .ds-subnav-tabs { display: flex; gap: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 12px; }
    .ds-snt { font-size: 11.5px; color: #94a3b8; font-weight: 600; cursor: pointer; padding-bottom: 4px; transition: color 0.2s; }
    .ds-snt:hover { color: #f8fafc; }

    .ds-calc-hero-card { background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.09); border-radius: 12px; padding: 14px 18px; margin-bottom: 12px; }
    .ds-pill-orange { font-size: 9.5px; font-weight: 800; color: #f97316; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); border-radius: 12px; padding: 2px 10px; display: inline-block; letter-spacing: 0.05em; }
    .ds-cmg-chip { font-size: 10px; color: #cbd5e1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 4px 10px; }

    .ds-calc-grid-split { display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; margin-top: 10px; }
    .ds-calc-form-card, .ds-calc-result-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; }
    .ds-form-row { margin-bottom: 10px; }
    .ds-form-row label { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px; font-weight: 600; }
    .ds-form-row input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 6px 10px; color: #f8fafc; font-size: 11px; font-weight: 700; }
    .ds-form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .ds-form-row-2col label { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 4px; font-weight: 600; }
    .ds-form-row-2col input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 6px 10px; color: #f8fafc; font-size: 11px; font-weight: 700; }
    .ds-btn-sec { background: rgba(255,255,255,0.08); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; }

    .ds-alert-red-banner { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 10px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 700; margin-bottom: 12px; }

    /* Interface Réelle ERP Simulée dans la Démo — High-Fidelity & Ultra Premium */
    .ds-real-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 13px; flex-shrink: 0; }
    .ds-rh-left { display: flex; align-items: center; gap: 16px; }
    .ds-rh-brand { font-weight: 800; color: #f8fafc; font-size: 14px; letter-spacing: -0.02em; }
    .ds-rh-brand span { color: #f97316; }
    .ds-rh-search { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 6px 12px; color: #94a3b8; font-size: 11px; }
    .ds-rh-kbd { background: rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 4px; font-size: 9px; color: #cbd5e1; font-weight: 700; }
    .ds-rh-right { display: flex; align-items: center; gap: 12px; }
    .ds-rh-icon { cursor: pointer; font-size: 14px; }
    .ds-rh-lang { background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; color: #f1f5f9; font-size: 11px; font-weight: 700; }
    .ds-rh-user { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.12); }
    .ds-rh-avatar { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
    .ds-rh-uinfo { display: flex; flex-direction: column; line-height: 1.2; }
    .ds-rh-uname { font-size: 11px; color: #f8fafc; font-weight: 700; }
    .ds-rh-urole { font-size: 9px; color: #f97316; font-weight: 600; }

    .ds-body-app { display: flex; flex: 1; min-height: 0; background: #0b1324; overflow: hidden; }
    .ds-app-sidebar { width: 180px; background: #090e1a; border-right: 1px solid rgba(255,255,255,0.08); padding: 12px 6px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
    .ds-sb-lbl { font-size: 9px; font-weight: 800; color: #64748b; letter-spacing: 0.08em; padding: 4px 10px; margin-bottom: 4px; }
    .ds-sb-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .ds-sb-item:hover { background: rgba(255,255,255,0.06); color: #f8fafc; }
    .ds-sb-item.active { background: linear-gradient(90deg, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.08) 100%); color: #fb923c; font-weight: 800; border-left: 3px solid #f97316; box-shadow: 0 2px 10px rgba(249,115,22,0.15); }
    .ds-sb-item span { font-size: 16px; }

    .ds-app-workspace { flex: 1; padding: 16px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
    .ds-banner-welcome { background: linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.04) 100%); border: 1px solid rgba(249,115,22,0.3); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .ds-bw-avatar { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(249,115,22,0.4); }
    .ds-banner-welcome h3 { font-size: 15px; font-weight: 800; color: #f8fafc; margin: 0 0 4px 0; }
    .ds-banner-welcome p { font-size: 11px; color: #cbd5e1; margin: 0; }

    .ds-ptitle-bar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .ds-ptitle-bar h3 { font-size: 15px; font-weight: 800; color: #f8fafc; margin: 0 0 3px 0; }
    .ds-ptitle-bar p { font-size: 11px; color: #94a3b8; margin: 0; }
    .ds-cbtn-primary { background: linear-gradient(135deg, #f97316, #ea580c) !important; color: #ffffff !important; border-color: #ea580c !important; font-weight: 800 !important; box-shadow: 0 4px 14px rgba(249,115,22,0.35) !important; }

    .ds-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; flex-shrink: 0; }
    .ds-kpi { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-top: 3px solid var(--kc, #f97316); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .ds-kpi b { font-size: 15px; font-weight: 800; color: var(--kc, #f97316); }
    .ds-kpi small { font-size: 10px; color: #94a3b8; font-weight: 600; }
    .ds-kpi em { font-size: 10px; color: #22c55e; font-style: normal; font-weight: 700; }

    .ds-table { display: flex; flex-direction: column; gap: 4px; overflow: hidden; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 6px; }
    .ds-thead { display: flex; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.06); border-radius: 6px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .ds-trow { display: flex; gap: 8px; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #cbd5e1; border: 1px solid transparent; transition: all 0.15s; }
    .ds-trow:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }

    .bpaid { background: rgba(34,197,94,0.18); color: #22c55e; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(34,197,94,0.3); }
    .bwait { background: rgba(251,191,36,0.18); color: #fbbf24; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(251,191,36,0.3); }
    .blate { background: rgba(239,68,68,0.18); color: #ef4444; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(239,68,68,0.3); }

    .ds-real-footer { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #090e1a; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; flex-shrink: 0; }
    .ds-rf-badge { display: flex; align-items: center; gap: 8px; color: #22c55e; font-weight: 700; }
    .ds-rf-cat { color: #94a3b8; font-weight: 500; }
    /* Sélecteur de langue */
    .lp-lang-dropdown { position: relative; display: inline-block; margin-right: 10px; z-index: 1100; }
    .lp-lang-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: #f8fafc !important; border: 1.5px solid #cbd5e1 !important; border-radius: 20px; color: #0f172a !important; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .lp-lang-btn:hover { background: #f1f5f9 !important; border-color: #f97316 !important; color: #f97316 !important; }
    .lp-lang-menu { position: absolute; top: calc(100% + 6px); right: 0; min-width: 140px; background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important; z-index: 2000; padding: 6px; display: flex; flex-direction: column; gap: 4px; }
    .lp-lang-option { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: transparent; border: none; border-radius: 6px; color: #334155 !important; font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; width: 100%; transition: background 0.15s; }
    .lp-lang-option:hover { background: #f1f5f9 !important; color: #0f172a !important; }
    .lp-lang-option.active { background: rgba(249,115,22,0.12) !important; color: #ea580c !important; font-weight: 700; }
  `]
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  scrolled = false;
  menuOpen = false;
  langDropdownOpen = false;
  activeModule = 'calcul';
  openFaq = -1;

  // ── Demo Modal ─────────────────────────────────────────────────
  demoModalOpen = false;
  activeDemo = 0;
  isPlaying = false;

  constructor(
    public themeService: ThemeService,
    public languageService: LanguageService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  translations: Record<string, Record<string, string>> = {
    fr: {
      navFeatures: 'Fonctionnalités',
      navModules: 'Modules',
      navPricing: 'Tarifs',
      navFaq: 'FAQ',
      navContact: 'Contact',
      login: 'Se connecter',
      freeTrial: 'Essai gratuit',
      heroBadge: 'Plateforme SaaS · Nouvelle génération',
      heroTitle1: "L'ERP qui",
      heroTitle2: 'transforme',
      heroTitle3: 'votre entreprise',
      heroDesc: "Finances, stocks, facturation, calculs d'intérêts — tout centralisé en une seule plateforme moderne, sécurisée et scalable. Prise en main en moins d'une heure.",
      startFree: 'Démarrer gratuitement',
      watchDemo: 'Voir la démo',
      trust1: '30 connexions offertes',
      trust2: 'Sans carte bancaire',
      trust3: 'Données sécurisées',
      trust4: 'Support inclus',
      trustBarLabel: 'Ils font confiance à BENJEDDOU ERP',
      featuresTitle: 'Tout ce dont votre entreprise a besoin',
      featuresDesc: 'Une suite ERP complète, moderne et sécurisée. Chaque module est conçu pour maximiser votre productivité.',
      modulesTitle: 'Un module pour chaque besoin métier',
      modulesDesc: 'Des outils spécialisés par domaine, parfaitement intégrés entre eux.',
      tryModuleFree: 'Essayer ce module gratuitement',
      securityPill: 'Sécurité',
      securityTitle1: 'Vos données sont',
      securityTitle2: 'protégées',
      securityTitle3: 'au maximum',
      securityDesc: 'Architecture sécurisée de bout en bout. Chaque entreprise dispose de sa propre base de données isolée (multi-tenant).',
      pricingPill: 'Tarifs',
      pricingTitle: 'Choisissez votre plan',
      pricingDesc: 'Commencez gratuitement, évoluez selon vos besoins. Sans engagement.',
      pricingNote: 'Aucune carte bancaire requise pour l\'essai · Données sécurisées · Annulation facile',
      testimonialsPill: 'Témoignages',
      testimonialsTitle: 'Ils témoignent de leur expérience',
      faqPill: 'FAQ',
      faqTitle: 'Questions fréquentes',
      faqDesc: 'Tout ce que vous devez savoir avant de commencer.',
      ctaTitle: 'Prêt à transformer votre gestion ?',
      ctaSubtitle: 'Rejoignez les entreprises qui font confiance à BENJEDDOU ERP. Lancez-vous en moins de 2 minutes, gratuitement.',
      createFreeAccount: 'Créer mon compte gratuit',
      footerTagline: 'La plateforme ERP SaaS nouvelle génération pour les entreprises tunisiennes et internationales.',
      productCol: 'Produit',
      modulesCol: 'Modules',
      securityCol: 'Sécurité',
      supportCol: 'Support',
      allRightsReserved: '© 2026 BENJEDDOU ERP — Tous droits réservés'
    },
    en: {
      navFeatures: 'Features',
      navModules: 'Modules',
      navPricing: 'Pricing',
      navFaq: 'FAQ',
      navContact: 'Contact',
      login: 'Sign in',
      freeTrial: 'Free Trial',
      heroBadge: 'SaaS Platform · Next Generation',
      heroTitle1: 'The ERP that',
      heroTitle2: 'transforms',
      heroTitle3: 'your business',
      heroDesc: 'Finances, inventory, invoicing, interest calculation — all centralized in a single modern, secure, and scalable platform. Get started in under an hour.',
      startFree: 'Get Started for Free',
      watchDemo: 'Watch Demo',
      trust1: '30 free logins included',
      trust2: 'No credit card needed',
      trust3: 'Secured data',
      trust4: 'Support included',
      trustBarLabel: 'They trust BENJEDDOU ERP',
      featuresTitle: 'Everything your business needs',
      featuresDesc: 'A complete, modern and secure ERP suite. Each module is designed to maximize your productivity.',
      modulesTitle: 'A module for every business need',
      modulesDesc: 'Specialized domain tools, perfectly integrated together.',
      tryModuleFree: 'Try this module for free',
      securityPill: 'Security',
      securityTitle1: 'Your data is',
      securityTitle2: 'fully protected',
      securityTitle3: 'at all times',
      securityDesc: 'End-to-end secure architecture. Each company has its own isolated database (multi-tenant).',
      pricingPill: 'Pricing',
      pricingTitle: 'Choose your plan',
      pricingDesc: 'Start for free, scale as you grow. No commitment required.',
      pricingNote: 'No credit card required for trial · Secured data · Easy cancellation',
      testimonialsPill: 'Testimonials',
      testimonialsTitle: 'What our clients say about us',
      faqPill: 'FAQ',
      faqTitle: 'Frequently Asked Questions',
      faqDesc: 'Everything you need to know before getting started.',
      ctaTitle: 'Ready to transform your management?',
      ctaSubtitle: 'Join companies that trust BENJEDDOU ERP. Get started in under 2 minutes, for free.',
      createFreeAccount: 'Create my free account',
      footerTagline: 'Next generation SaaS ERP platform for Tunisian and international businesses.',
      productCol: 'Product',
      modulesCol: 'Modules',
      securityCol: 'Security',
      supportCol: 'Support',
      allRightsReserved: '© 2026 BENJEDDOU ERP — All rights reserved'
    },
    ar: {
      navFeatures: 'المميزات',
      navModules: 'الموديولات',
      navPricing: 'الأسعار',
      navFaq: 'الأسئلة الشائعة',
      navContact: 'الاتصال',
      login: 'تسجيل الدخول',
      freeTrial: 'تجربة مجانية',
      heroBadge: 'منصة SaaS · الجيل الجديد',
      heroTitle1: 'نظام ERP الذي',
      heroTitle2: 'يطوّر ويحوّل',
      heroTitle3: 'مؤسستك وإدارتك',
      heroDesc: 'المالية، المخزون، الفوترة، حسابات الفوائد — كل ذلك في منصة واحدة حديثة وآمنة وقابلة للتوسع. بدء العمل في أقل من ساعة.',
      startFree: 'ابدأ مجاناً الآن',
      watchDemo: 'مشاهدة العرض التوضيحي',
      trust1: '30 دخول مجاني شامل',
      trust2: 'بدون بطاقة ائتمان',
      trust3: 'بيانات آمنة ومشفرة',
      trust4: 'الدعم الفني شامل',
      trustBarLabel: 'شركات يثقون في BENJEDDOU ERP',
      featuresTitle: 'كل ما تحتاجه مؤسستك للنجاح',
      featuresDesc: 'مجموعة ERP متكاملة، حديثة وآمنة. تم تصميم كل موديول لزيادة إنتاجيتك وسهولة عملك.',
      modulesTitle: 'موديول مخصص لكل احتياج في عملك',
      modulesDesc: 'أدوات متخصصة لكل مجال، متكاملة تماماً فيما بينها.',
      tryModuleFree: 'تجربة هذا الموديول مجاناً',
      securityPill: 'الأمان وحماية البيانات',
      securityTitle1: 'بياناتك ومعلوماتك',
      securityTitle2: 'محمية ومؤمنة',
      securityTitle3: 'بأعلى المستويات',
      securityDesc: 'بنية تكنولوجية مشفرة من البداية للنهاية. تمتلك كل شركة قاعدة بيانات خاصة بها ومعزولة تماماً.',
      pricingPill: 'الأسعار والباقات',
      pricingTitle: 'اختر الباقة المناسبة لك',
      pricingDesc: 'ابدأ مجاناً، وتطور حسب احتياجاتك بدون أي التزامات.',
      pricingNote: 'لا يلزم وجود بطاقة ائتمان للتجربة · بيانات آمنة ومشفرة · إلغاء سهل',
      testimonialsPill: 'آراء العملاء',
      testimonialsTitle: 'ماذا يقول عملاؤنا عن تجربتهم',
      faqPill: 'الأسئلة الشائعة',
      faqTitle: 'الأسئلة الشائعة والإجابات',
      faqDesc: 'كل ما تحتاج لمعرفته قبل البدء.',
      ctaTitle: 'هل أنت جاهز لتطوير وإدارة مؤسستك؟',
      ctaSubtitle: 'انضم إلى الشركات التي تضع ثقتها في BENJEDDOU ERP. ابدأ في أقل من دقيقتين مجاناً.',
      createFreeAccount: 'إنشاء حسابي المجاني الآن',
      footerTagline: 'منصة ERP SaaS الجيل الجديد للمؤسسات التونسية والدولية.',
      productCol: 'المنتج',
      modulesCol: 'الموديولات',
      securityCol: 'الأمان',
      supportCol: 'الدعم الفني',
      allRightsReserved: '© 2026 BENJEDDOU ERP — جميع الحقوق محفوظة'
    }
  };

  t(key: string): string {
    const lang = this.languageService.currentLang || 'fr';
    return this.translations[lang]?.[key] || this.translations['fr']?.[key] || key;
  }

  changeLang(lang: AppLang): void {
    this.languageService.setLanguage(lang);
    this.langDropdownOpen = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('visible');
        this.observer?.observe(el);
      });
    }, 50);
  }

  // Catalogue complet des 8 démonstrations vidéo ERP
  demoVideos = [
    {
      id: 0,
      title: 'Présentation Générale ERP SaaS',
      desc: 'Vue d\'ensemble de la plateforme SaaS multi-tenant : tableau de bord, KPIs et navigation intuitive.',
      emoji: '🚀',
      color: '#f97316',
      bg: 'rgba(249,115,22,0.12)',
      duration: '~1 min 30',
      category: 'Vue globale',
      youtubeId: 'QODLTaE-RAI',
      videoFile: ''
    },
    {
      id: 1,
      title: 'Moteur de Calcul & Taux Multi-Périodes',
      desc: 'Calculs d\'intérêts automatisés à taux fixe ou variable, tableau dynamique éditable et exports PDF/Word.',
      emoji: '🧮',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      duration: '~1 min 15',
      category: 'Moteur Calcul',
      youtubeId: 'QODLTaE-RAI',
      videoFile: ''
    },
    {
      id: 2,
      title: 'Finance, Facturation & Relances',
      desc: 'Gestion complète du cycle financier : devis, facturation, suivi des règlements et relances automatiques.',
      emoji: '💳',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      duration: '~1 min 20',
      category: 'Finance',
      youtubeId: 'QODLTaE-RAI',
      videoFile: ''
    },
    {
      id: 3,
      title: 'Gestion des Stocks & Multi-Entrepôts',
      desc: 'Suivi des mouvements de stocks en temps réel, alerte de seuil critique et gestion multi-entrepôts.',
      emoji: '📦',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      duration: '~1 min',
      category: 'Stocks',
      youtubeId: 'QODLTaE-RAI',
      videoFile: ''
    },
    {
      id: 4,
      title: 'Module Commercial & CRM Ventes',
      desc: 'Pipeline commercial, devis automatiques, commandes clients et suivi du cycle de vente.',
      emoji: '🤝',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      duration: '~1 min 10',
      category: 'Commercial',
      youtubeId: 'QODLTaE-RAI',
      videoFile: ''
    },
    {
      id: 5,
      title: 'Portail Client Self-Service',
      desc: 'Espace dédié aux clients : consultation des factures, devis, commandes et demandes de devis en ligne.',
      emoji: '🏢',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
      duration: '~1 min',
      category: 'Portail',
      youtubeId: 'QODLTaE-RAI',
      videoFile: 'demo-portail-client.mp4'
    },
    {
      id: 6,
      title: 'Sécurité, RBAC & Audit des Logs',
      desc: 'Authentification JWT, rôles granulaires, traçabilité des accès et protection anti-brute force.',
      emoji: '🔐',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      duration: '~1 min',
      category: 'Sécurité',
      youtubeId: 'QODLTaE-RAI',
      videoFile: ''
    },
    {
      id: 7,
      title: 'Administration SaaS Multi-Tenant',
      desc: 'Gestion des entreprises clientes, isolation des bases de données et statistiques globales.',
      emoji: '⚡',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
      duration: '~1 min 25',
      category: 'Admin SaaS',
      youtubeId: 'QODLTaE-RAI',
      videoFile: ''
    }
  ];


  get currentDemo() {
    return this.demoVideos[this.activeDemo];
  }

  openDemoModal(): void {
    this.demoModalOpen = true;
    this.activeDemo = 0;
    this.isPlaying = false;
    document.body.style.overflow = 'hidden';
  }

  closeDemoModal(): void {
    this.demoModalOpen = false;
    this.isPlaying = false;
    document.body.style.overflow = '';
  }

  selectDemo(index: number): void {
    this.activeDemo = index;
    this.isPlaying = false;
  }

  prevDemo(): void {
    if (this.activeDemo > 0) { this.activeDemo--; this.isPlaying = false; }
  }

  nextDemo(): void {
    if (this.activeDemo < this.demoVideos.length - 1) { this.activeDemo++; this.isPlaying = false; }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('demo-overlay')) {
      this.closeDemoModal();
    }
  }

  get getHeroStats() {
    const lang = this.languageService.currentLang;
    if (lang === 'en') {
      return [
        { val: '10+', label: 'Integrated ERP modules' },
        { val: '30',  label: 'Free trial logins' },
        { val: '100%', label: 'Company isolated data' },
        { val: '99.9%', label: 'Guaranteed uptime' },
      ];
    }
    if (lang === 'ar') {
      return [
        { val: '+10', label: 'موديولات ERP متكاملة' },
        { val: '30',  label: 'جلسات دخول مجانية' },
        { val: '100%', label: 'عزل تام لبيانات الشركات' },
        { val: '99.9%', label: 'جاهزية وضمان التشغيل' },
      ];
    }
    return this.heroStats;
  }

  get getFeatures() {
    const lang = this.languageService.currentLang;
    if (lang === 'en') {
      return [
        { color: 'orange', icon: 'calculate',      name: 'Calculation Engine',      desc: 'Single or multi-period interest calculation. Dynamic editable table, professional PDF/Word exports.', tags: ['PDF/Word', 'Multi-period', 'History'] },
        { color: 'blue',   icon: 'payments',        name: 'Finance & Invoicing',     desc: 'Invoices, quotes, payment tracking. Financial dashboard with real-time KPIs.', tags: ['Invoicing', 'Quotes', 'KPIs'] },
        { color: 'green',  icon: 'inventory_2',     name: 'Inventory Management',    desc: 'Real-time inventory, automatic alerts, multi-warehouse management. Zero stockouts.', tags: ['Real-time', 'Alerts', 'Multi-warehouse'] },
        { color: 'purple', icon: 'shopping_bag',    name: 'Commercial Module',       desc: 'Sales pipeline, customer orders, automatic quotes. Complete commercial cycle tracking.', tags: ['Pipeline', 'Orders', 'CRM'] },
        { color: 'pink',   icon: 'account_circle',  name: 'Client Portal',           desc: 'Dedicated self-service space: online invoices, quotes, orders, statements and documents.', tags: ['Self-service', 'KYC', 'Documents'] },
        { color: 'yellow', icon: 'lock',            name: 'Security & Access',       desc: 'JWT, Refresh Token, granular roles & permissions, single session, connection audit.', tags: ['JWT', 'Roles', 'Audit'] },
      ];
    }
    if (lang === 'ar') {
      return [
        { color: 'orange', icon: 'calculate',      name: 'موتور الحسابات والفوائد',  desc: 'حساب الفوائد بنسبة واحدة أو متعدد الفترات. جدول ديناميكي قابل للتعديل وتصدير PDF/Word.', tags: ['PDF/Word', 'متعدد الفترات', 'السجل'] },
        { color: 'blue',   icon: 'payments',        name: 'المالية والفوترة',        desc: 'الفواتير، العروض، متابعة الدفعات. لوحة تحكم مالية مع مؤشرات أداء فورية.', tags: ['الفوترة', 'العروض', 'مؤشرات'] },
        { color: 'green',  icon: 'inventory_2',     name: 'إدارة المخزون والسلع',     desc: 'مخزون لحظي في الوقت الفعلي، تنبيهات آلية، إدارة المستودعات المتعددة.', tags: ['وقت فعلي', 'تنبيهات', 'مستودعات'] },
        { color: 'purple', icon: 'shopping_bag',    name: 'الموديول التجاري والمبيعات', desc: 'مسار المبيعات، طلبات العملاء، عروض الأسعار التلقائية. متابعة الدورة التجارية.', tags: ['مسار المبيعات', 'الطلبات', 'CRM'] },
        { color: 'pink',   icon: 'account_circle',  name: 'بوابة العملاء الذاتية',   desc: 'مساحة خدمة ذاتية مخصصة للعملاء: الفواتير، العروض، الطلبات والوثائق.', tags: ['خدمة ذاتية', 'KYC', 'وثائق'] },
        { color: 'yellow', icon: 'lock',            name: 'الأمان وحماية البيانات', desc: 'تشفير JWT، صلاحيات وأدوار دقيقة، جلسات آمنة، وسجل تدقيق شامل.', tags: ['JWT', 'أدوار', 'تدقيق'] },
      ];
    }
    return this.features;
  }

  get getModules() {
    const lang = this.languageService.currentLang;
    if (lang === 'en') {
      return [
        { id: 'calcul',  color: 'orange', icon: 'calculate',          name: 'Calculation Engine',       shortDesc: 'Single & multi-period rates', fullDesc: 'Advanced calculation engine for single or variable interest rates. Centralized reference base, dynamic editable table with real-time recalculation.', features: ['Single or multi-period calculation', 'Dynamic editable table (rates + days)', 'Detailed & Simplified PDF Export', 'Detailed & Simplified Word Export', 'Complete history with unique reference'] },
        { id: 'finance', color: 'blue',   icon: 'payments',           name: 'Finance & Accounting',     shortDesc: 'Invoicing, quotes, treasury', fullDesc: 'Manage your entire financial cycle: from quote creation to invoicing, payment tracking and automated accounting reporting.', features: ['PDF invoice creation and sending', 'Payment tracking & reminders', 'Real-time financial dashboard', 'Accounting & analytical export'] },
        { id: 'stock',   color: 'green',  icon: 'inventory_2',        name: 'Inventory Management',     shortDesc: 'Real-time stock & alerts', fullDesc: 'Real-time inventory with automatic alerts. Multi-warehouse management and complete stock movement history.', features: ['Real-time inventory tracking', 'Automatic critical threshold alerts', 'Multi-warehouse management', 'Stock movement history'] },
        { id: 'admin',   color: 'purple', icon: 'admin_panel_settings', name: 'Administration',        shortDesc: 'Users, roles, permissions', fullDesc: 'Complete administrator dashboard. Manage users, their roles, trial periods and consult platform statistics.', features: ['User & role management', 'Trial period control (30 logins)', 'Connection history & audit', 'Platform statistics & KPIs'] },
      ];
    }
    if (lang === 'ar') {
      return [
        { id: 'calcul',  color: 'orange', icon: 'calculate',          name: 'موتور الحسابات والفوائد', shortDesc: 'نسبة ثابتة أو متعدد الفترات', fullDesc: 'محرك حساب متقدم للفوائد بنسبة واحدة أو متغيرة. قاعدة مرجعية مركزية وجدول ديناميكي مع إعادة حساب فورية.', features: ['حساب بنسبة واحدة أو متعدد الفترات', 'جدول ديناميكي قابل للتعديل (النسبة + الأيام)', 'تصدير PDF تفصيلي ومبسط', 'تصدير Word تفصيلي ومبسط', 'سجل كامل مرقم برقم مرجعي فريد'] },
        { id: 'finance', color: 'blue',   icon: 'payments',           name: 'المالية والمحاسبة',       shortDesc: 'الفوترة، العروض، الخزينة', fullDesc: 'إدارة كامل الدورة المالية: من إنشاء العروض إلى الفوترة ومتابعة المقبوضات والتقارير المحاسبية.', features: ['إصدار وإرسال فواتير PDF', 'متابعة الدفعات والتذكيرات', 'لوحة تحكم مالية في الوقت الفعلي', 'تصدير محاسبي وتحليلي'] },
        { id: 'stock',   color: 'green',  icon: 'inventory_2',        name: 'إدارة المخازن والسلع',    shortDesc: 'مخزون لحظي وتنبيهات فورية', fullDesc: 'جرد المخزون في الوقت الفعلي مع تنبيهات تلقائية. إدارة مستودعات متعددة وسجل حركة المخزون.', features: ['متابعة الجرد في الوقت الفعلي', 'تنبيهات تلقائية للحد الحرج', 'إدارة مستودعات متعددة', 'سجل حركة المخزون'] },
        { id: 'admin',   color: 'purple', icon: 'admin_panel_settings', name: 'الإدارة والنظام',        shortDesc: 'المستخدمون، الأدوار، الصلاحيات', fullDesc: 'لوحة تحكم رئيسية شاملة. إدارة المستخدمين وأدوارهم وفترات التجربة والإحصائيات.', features: ['إدارة المستخدمين والأدوار', 'مراقبة فترة التجربة (30 دخول)', 'سجل التدقيق والدخول', 'مؤشرات وأداء المنصة'] },
      ];
    }
    return this.modules;
  }

  heroStats = [
    { val: '10+', label: 'Modules ERP integres' },
    { val: '30',  label: 'Connexions d\'essai offertes' },
    { val: '100%', label: 'Donnees isolees par entreprise' },
    { val: '99.9%', label: 'Disponibilite garantie' },
  ];

  clients = ['Alpha Invest', 'Delta Corp', 'Medina Group', 'Sfax Trading', 'Carthage SA', 'Nord Finance', 'Tunis Capital', 'Sahel Pro'];

  previewKpis = [
    { val: '148K', label: 'Revenus', color: '#f97316', bg: 'rgba(249,115,22,.1)' },
    { val: '342', label: 'Clients', color: '#22c55e', bg: 'rgba(34,197,94,.1)' },
    { val: '98%', label: 'Paiements', color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
  ];
  chartBars = [40, 55, 48, 72, 58, 85, 65, 92, 70, 95, 78, 100];
  previewRows = [
    { name: 'Alpha Invest', amount: '14 500 DT', status: 'paid', label: 'Paye' },
    { name: 'Delta Corp', amount: '8 200 DT', status: 'pending', label: 'En attente' },
    { name: 'Medina Group', amount: '22 000 DT', status: 'paid', label: 'Paye' },
  ];

  features = [
    { color: 'orange', icon: 'calculate',      name: 'Moteur de Calcul',        desc: 'Calcul d\'interets a taux unique ou multi-periodes. Tableau dynamique editable, exports PDF/Word professionnels.', tags: ['PDF/Word', 'Multi-periodes', 'Historique'] },
    { color: 'blue',   icon: 'payments',        name: 'Finance & Facturation',   desc: 'Factures, devis, suivi des paiements. Dashboard financier avec KPIs en temps reel.', tags: ['Facturation', 'Devis', 'KPIs'] },
    { color: 'green',  icon: 'inventory_2',     name: 'Gestion des Stocks',      desc: 'Inventaire en temps reel, alertes automatiques, gestion multi-entrepots. Zero rupture de stock.', tags: ['Temps reel', 'Alertes', 'Multi-entrepots'] },
    { color: 'purple', icon: 'shopping_bag',    name: 'Module Commercial',       desc: 'Pipeline de ventes, commandes clients, devis automatiques. Suivi complet du cycle commercial.', tags: ['Pipeline', 'Commandes', 'CRM'] },
    { color: 'pink',   icon: 'account_circle',  name: 'Portail Client',          desc: 'Espace self-service dedie : factures, devis, commandes, releves et documents en ligne.', tags: ['Self-service', 'KYC', 'Documents'] },
    { color: 'yellow', icon: 'lock',            name: 'Securite & Acces',        desc: 'JWT, Refresh Token, roles et permissions granulaires, session unique, audit des connexions.', tags: ['JWT', 'Roles', 'Audit'] },
  ];

  modules = [
    { id: 'calcul',  color: 'orange', icon: 'calculate',          name: 'Moteur de Calcul',       shortDesc: 'Taux unique & multi-periodes', fullDesc: 'Moteur de calcul avance pour les interets a taux unique ou variables. Base de reference centralisee, tableau dynamique editable avec recalcul temps reel.', features: ['Calcul a taux unique ou multi-periodes', 'Tableau dynamique editable (taux + jours)', 'Export PDF Detaille et Simplifie', 'Export Word Detaille et Simplifie', 'Historique complet avec reference unique'] },
    { id: 'finance', color: 'blue',   icon: 'payments',           name: 'Finance & Comptabilite', shortDesc: 'Facturation, devis, tresorerie', fullDesc: 'Gerez l\'integralite de votre cycle financier : creation de devis a la facturation, suivi des paiements et reporting comptable automatise.', features: ['Creation et envoi de factures PDF', 'Suivi des paiements et relances', 'Dashboard financier en temps reel', 'Export comptable et analytique'] },
    { id: 'stock',   color: 'green',  icon: 'inventory_2',        name: 'Gestion des Stocks',     shortDesc: 'Inventaire & alertes temps reel', fullDesc: 'Inventaire en temps reel avec alertes automatiques. Gestion multi-entrepots et historique complet des mouvements de stock.', features: ['Suivi inventaire en temps reel', 'Alertes seuil critique automatiques', 'Gestion multi-entrepots', 'Historique des mouvements de stock'] },
    { id: 'admin',   color: 'purple', icon: 'admin_panel_settings', name: 'Administration',        shortDesc: 'Utilisateurs, roles, permissions', fullDesc: 'Tableau de bord administrateur complet. Gerez les utilisateurs, leurs roles, les periodes d\'essai et consultez les statistiques.', features: ['Gestion des utilisateurs et roles', 'Controle periode d\'essai (30 connexions)', 'Historique et audit des connexions', 'Statistiques et KPIs plateforme'] },
  ];

  get getSecurityFeatures() {
    const lang = this.languageService.currentLang;
    if (lang === 'en') {
      return [
        { icon: 'verified_user',   name: 'JWT + Refresh Token',    desc: 'Stateless authentication with secure tokens and automatic rotation.' },
        { icon: 'manage_accounts', name: 'Granular RBAC',          desc: 'Role-based access control with fine-grained per-module permissions.' },
        { icon: 'storage',         name: 'Isolated Multi-tenant',   desc: 'Each company benefits from a strictly isolated database.' },
        { icon: 'history',         name: 'Complete Audit & Logs',   desc: 'Full traceability of all actions: logins, edits, exports.' },
        { icon: 'lock_clock',      name: 'Rate Limiting',           desc: 'Brute force attack protection with automatic blocking.' },
      ];
    }
    if (lang === 'ar') {
      return [
        { icon: 'verified_user',   name: 'تشفير JWT + Token التحديث', desc: 'مصادقة آمنة باستخدام رموز مشفرة وتدوير تلقائي.' },
        { icon: 'manage_accounts', name: 'صلاحيات RBAC الدقيقة',      desc: 'التحكم في الوصول بناءً على الأدوار مع صلاحيات مخصصة لكل موديول.' },
        { icon: 'storage',         name: 'قواعد بيانات معزولة',     desc: 'تتمتع كل شركة بقاعدة بيانات خاصة بها ومعزولة بشكل تام.' },
        { icon: 'history',         name: 'سجلات تدقيق كاملة',       desc: 'تتبع شامل لجميع الإجراءات: تسجيل الدخول، والتعديل، والتصدير.' },
        { icon: 'lock_clock',      name: 'حماية Rate Limiting',     desc: 'حماية ضد هجمات القوة القاطعة مع حظر تلقائي.' },
      ];
    }
    return this.securityFeatures;
  }

  get getPlans() {
    const lang = this.languageService.currentLang;
    if (lang === 'en') {
      return [
        { color: 'green',  icon: 'shield',   name: 'Free Trial',   price: 'Free',   period: '',        popular: false, desc: '30 logins to discover the full platform', cta: 'Start Trial', features: ['Full access to all modules', '30 logins included', 'PDF & Word Export', 'Full Calculation Engine', 'Email support'] },
        { color: 'orange', icon: 'bolt',     name: 'Professional', price: '149 TND', period: '/ month', popular: true,  desc: 'For growing SMEs', cta: 'Start Now', features: ['Unlimited logins', 'All ERP modules', 'Unlimited users', 'Advanced PDF/Word/Excel exports', '24/7 priority support', 'Automatic backups'] },
        { color: 'purple', icon: 'business', name: 'Enterprise',   price: 'Custom quote', period: '', popular: false, desc: 'For multi-site large organizations', cta: 'Contact Us', features: ['Everything in Professional', 'Dedicated hosting', 'Full customization', 'Custom integration', 'Guaranteed SLA', 'Team training included'] },
      ];
    }
    if (lang === 'ar') {
      return [
        { color: 'green',  icon: 'shield',   name: 'تجربة مجانية',   price: 'مجاناً',   period: '',        popular: false, desc: '30 دخول لاكتشاف كافة مزايا المنصة', cta: 'بدء التجربة', features: ['وصول كامل لجميع الموديولات', '30 دخول شامل', 'تصدير PDF و Word', 'موتور الحسابات الكامل', 'دعم عبر البريد الإلكتروني'] },
        { color: 'orange', icon: 'bolt',     name: 'الباقة الاحترافية', price: '149 د.ت', period: '/ شهرياً', popular: true,  desc: 'للمؤسسات والشركات المتنامية', cta: 'البدء الآن', features: ['دخول غير محدود', 'جميع موديولات ERP', 'مستخدمون بلا حدود', 'تصدير متقدم PDF/Word/Excel', 'دعم أولوية 24/7', 'نسخ احتياطي تلقائي'] },
        { color: 'purple', icon: 'business', name: 'باقة المؤسسات', price: 'حسب الطلب', period: '', popular: false, desc: 'للمؤسسات الكبرى متعددة الفروع', cta: 'اتصل بنا', features: ['كل مزايا الباقة الاحترافية', 'استضافة مخصصة', 'تخصيص كامل', 'ربط مخصص', 'ضمان SLA', 'تدريب الفريق شامل'] },
      ];
    }
    return this.plans;
  }

  get getTestimonials() {
    const lang = this.languageService.currentLang;
    if (lang === 'en') {
      return [
        { text: 'The calculation engine transformed our financial management. PDF exports are professional and onboarding was immediate.', name: 'Karim Mansouri', role: 'CFO, Alpha Invest', initials: 'KM' },
        { text: 'Modern and intuitive interface. Our team was operational in a single day. Support is excellent and responsive.', name: 'Sonia Trabelsi', role: 'Chief Accountant, Delta Corp', initials: 'ST' },
        { text: 'Automatic inventory alerts eliminated all our stockouts. An indispensable tool for our business.', name: 'Ahmed Ben Salah', role: 'Manager, Medina Group', initials: 'AB' },
      ];
    }
    if (lang === 'ar') {
      return [
        { text: 'محرك الحسابات غير طريقة إدارتنا المالية بالكامل. تصديرات PDF احترافية والبدء كان فورياً.', name: 'كريم المنصوري', role: 'المدير المالي، ألفا إستثمار', initials: 'كم' },
        { text: 'واجهة حديثة وسهلة الاستخدام. فريقنا بدأ العمل في يوم واحد. الدعم ممتاز وسريع.', name: 'سنية الطرابلسي', role: 'رئيسة المحاسبة، دلتا كورب', initials: 'سط' },
        { text: 'التنبيهات التلقائية للمخزون قضت تماماً على نفاذ الكميات. أداة لا غنى عنها في نشاطنا.', name: 'أحمد بن صالح', role: 'المدير العام، مجموعة المدينة', initials: 'أب' },
      ];
    }
    return this.testimonials;
  }

  get getFaqs() {
    const lang = this.languageService.currentLang;
    if (lang === 'en') {
      return [
        { q: 'How does the free trial work?', a: 'The free trial gives you access to the entire platform for 30 logins with no feature restriction. No credit card required.' },
        { q: 'Is my data secure?', a: 'Absolutely. Each company has its own completely isolated database (multi-tenant architecture). Your data is never shared with other companies.' },
        { q: 'Can I change my plan anytime?', a: 'Yes, you can upgrade to a higher plan at any time. The transition is instant and your data is fully preserved.' },
        { q: 'What support is included?', a: 'The free trial includes email support. The Professional plan includes 24/7 priority support with a guaranteed response time of under 4 hours.' },
        { q: 'Is there a mobile app?', a: 'The platform is fully responsive and optimized for all devices (PC, tablet, smartphone). A native mobile app is under active development.' },
        { q: 'Can I import my existing data?', a: 'Yes, we provide CSV/Excel import tools for customers, products, and financial histories. Our team can also assist you with migration.' },
      ];
    }
    if (lang === 'ar') {
      return [
        { q: 'كيف تعمل التجربة المجانية؟', a: 'تمنحك التجربة المجانية إمكانية الوصول الكامل إلى المنصة لـ 30 دخول بدون أي قيود على الميزات. لا يلزم وجود بطاقة ائتمان.' },
        { q: 'هل بياناتي في أمان؟', a: 'بالتأكيد. تمتلك كل شركة قاعدة بيانات خاصة بها ومعزولة تماماً (بنية Multi-Tenant). لا يتم مشاركة بياناتك أبداً.' },
        { q: 'هل يمكنني تغيير الباقة في أي وقت؟', a: 'نعم، يمكنك الترقية إلى باقة أعلى في أي وقت. الانتداب فوري وبياناتك محفوظة تماماً.' },
        { q: 'ما نوع الدعم الشامل؟', a: 'تتضمن التجربة المجانية الدعم عبر البريد. وتتضمن الباقة الاحترافية الدعم بالأولوية 24/7 مع وقت استجابة مضمون أقل من 4 ساعات.' },
        { q: 'هل يوجد تطبيق للهاتف؟', a: 'المنصة متوافقة تماماً ومحسّنة لجميع الأجهزة (كمبيوتر، تابلت، هاتف). كما أن هناك تطبيقا مجانياً يتم تطويره.' },
        { q: 'هل يمكنني استيراد بياناتي الحالية؟', a: 'نعم، نوفر أدوات استيراد CSV/Excel للعملاء والمنتجات والسجلات المالية. ويمكن لفريقنا مساعدتك في النقل.' },
      ];
    }
    return this.faqs;
  }

  securityFeatures = [
    { icon: 'verified_user',   name: 'JWT + Refresh Token',    desc: 'Authentification stateless avec tokens securises et rotation automatique.' },
    { icon: 'manage_accounts', name: 'RBAC Granulaire',         desc: 'Controle d\'acces base sur les roles avec permissions fines par module.' },
    { icon: 'storage',         name: 'Multi-tenant Isole',      desc: 'Chaque entreprise dispose d\'une base de donnees strictly isolee.' },
    { icon: 'history',         name: 'Audit & Logs Complets',   desc: 'Traçabilite complete de toutes les actions : connexions, modifications, exports.' },
    { icon: 'lock_clock',      name: 'Rate Limiting',           desc: 'Protection contre les attaques par force brute avec blocage automatique.' },
  ];

  plans = [
    { color: 'green',  icon: 'shield',   name: 'Essai Gratuit',   price: 'Gratuit',   period: '',        popular: false, desc: '30 connexions pour decouvrir toute la plateforme', cta: 'Demarrer l\'essai',    features: ['Acces complet a tous les modules', '30 connexions incluses', 'Export PDF et Word', 'Moteur de calcul complet', 'Support par email'] },
    { color: 'orange', icon: 'bolt',     name: 'Professionnel',   price: '149 DT',    period: '/ mois',  popular: true,  desc: 'Pour les PME en pleine croissance', cta: 'Commencer maintenant', features: ['Connexions illimitees', 'Tous les modules ERP', 'Utilisateurs illimites', 'Exports avances PDF/Word/Excel', 'Support prioritaire 24/7', 'Sauvegardes automatiques'] },
    { color: 'purple', icon: 'business', name: 'Entreprise',      price: 'Sur devis', period: '',        popular: false, desc: 'Pour les grandes organisations multi-sites', cta: 'Nous contacter',       features: ['Tout du plan Professionnel', 'Hebergement dedie', 'Personnalisation complete', 'Integration sur mesure', 'SLA garanti', 'Formation equipe incluse'] },
  ];

  testimonials = [
    { text: 'Le moteur de calcul a transforme notre gestion financiere. Les exports PDF sont professionnels et la prise en main est immediate.', name: 'Karim Mansouri', role: 'Directeur Financier, Alpha Invest', initials: 'KM' },
    { text: 'Interface moderne et intuitive. Notre equipe etait operationnelle en une journee. Le support est excellent et reactif.', name: 'Sonia Trabelsi', role: 'Responsable Comptabilite, Delta Corp', initials: 'ST' },
    { text: 'Les alertes stock automatiques ont elimine toutes nos ruptures de stock. Un outil indispensable pour notre activite.', name: 'Ahmed Ben Salah', role: 'Gerant, Medina Group', initials: 'AB' },
  ];

  faqs = [
    { q: 'Comment fonctionne l\'essai gratuit ?', a: 'L\'essai gratuit vous donne acces a l\'integralite de la plateforme pendant 30 connexions, sans limitation de fonctionnalites. Aucune carte bancaire n\'est requise.' },
    { q: 'Mes donnees sont-elles en securite ?', a: 'Absolument. Chaque entreprise dispose de sa propre base de donnees totalement isolee (architecture multi-tenant). Vos donnees ne sont jamais partagees avec d\'autres entreprises.' },
    { q: 'Puis-je changer de plan a tout moment ?', a: 'Oui, vous pouvez passer a un plan superieur a tout moment. La transition est immediate et vos donnees sont entierement preservees.' },
    { q: 'Quel support est inclus ?', a: 'L\'essai gratuit inclut un support par email. Le plan Professionnel inclut un support prioritaire 24/7 avec temps de reponse garanti en moins de 4 heures.' },
    { q: 'Y a-t-il une application mobile ?', a: 'La plateforme est entierement responsive et optimisee pour tous les appareils (PC, tablette, smartphone). Une application mobile native est en cours de developpement.' },
    { q: 'Puis-je importer mes donnees existantes ?', a: 'Oui, nous proposons des outils d\'import CSV/Excel pour les clients, produits et historiques financiers. Notre equipe peut aussi vous accompagner dans la migration.' },
  ];

  private onScroll = () => { this.scrolled = window.scrollY > 40; };
  private observer: IntersectionObserver | null = null;

  // ── Thèmes sur la page publique ────────────────────────────────
  currentLandingTheme = 'light';   // ← Thème CLAIR par défaut (conformité encadrant)
  landingThemes = [
    { id: 'light',        label: 'Clair',        color: '#f97316' },
    { id: 'dark',         label: 'Sombre',       color: '#6366f1' },
    { id: 'professional', label: 'Professionnel', color: '#c9a84c' },
    { id: 'aqua',         label: 'Aqua',         color: '#06b6d4' },
  ];

  applyLandingTheme(preset: string): void {
    this.currentLandingTheme = preset;
    document.documentElement.setAttribute('data-theme-preset', preset);
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    prefs.themePreset = preset;
    localStorage.setItem('erp_user_prefs', JSON.stringify(prefs));
  }

  ngOnInit() {
    // ═ Exécuter les listeners hors zone Angular pour éviter le gel ═
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('keydown', this.onKeyDown);
    });
    // Appliquer le thème sauvegardé
    const prefs = JSON.parse(localStorage.getItem('erp_user_prefs') || '{}');
    this.currentLandingTheme = prefs.themePreset || 'light';
    this.applyLandingTheme(this.currentLandingTheme);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.demoModalOpen) {
      this.ngZone.run(() => this.closeDemoModal());
    }
  };

  ngAfterViewInit() {
    // Scroll reveal — hors zone Angular
    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      document.querySelectorAll('.reveal').forEach(el => this.observer?.observe(el));
    });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('keydown', this.onKeyDown);
    this.observer?.disconnect();
    document.body.style.overflow = '';
  }

  smoothScroll(event: Event, id: string): void {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
