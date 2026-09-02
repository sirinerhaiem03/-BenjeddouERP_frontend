import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-portail-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="portail-shell">

  <!-- ══ SIDEBAR ══ -->
  <aside class="portail-sidebar">
    <div class="sidebar-brand">
      <div class="brand-icon">⚡</div>
      <div class="brand-text">
        <div class="brand-name">BENJEDDOU</div>
        <div class="brand-sub">Espace Client</div>
      </div>
    </div>

    <div class="client-badge" *ngIf="clientNom">
      <div class="client-avatar">{{ clientInitials }}</div>
      <div class="client-info">
        <div class="client-name">{{ clientNom }}</div>
        <div class="client-role">Portail Client</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <a class="nav-item" routerLink="accueil" routerLinkActive="active">
        <span class="nav-icon">🏠</span>
        <span class="nav-label">Tableau de bord</span>
      </a>
      <a class="nav-item" routerLink="factures" routerLinkActive="active">
        <span class="nav-icon">🧾</span>
        <span class="nav-label">Mes Factures</span>
        <span class="nav-badge" *ngIf="nbFacturesImpayees > 0">{{ nbFacturesImpayees }}</span>
      </a>
      <a class="nav-item" routerLink="devis" routerLinkActive="active">
        <span class="nav-icon">📋</span>
        <span class="nav-label">Mes Devis</span>
        <span class="nav-badge nav-badge-blue" *ngIf="nbDevisEnAttente > 0">{{ nbDevisEnAttente }}</span>
      </a>
      <a class="nav-item" routerLink="commandes" routerLinkActive="active">
        <span class="nav-icon">📦</span>
        <span class="nav-label">Mes Commandes</span>
      </a>
      <a class="nav-item" routerLink="profil" routerLinkActive="active">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Mon Profil</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <button class="btn-logout" (click)="deconnecter()">
        <span>🚪</span> Se déconnecter
      </button>
    </div>
  </aside>

  <!-- ══ MAIN ══ -->
  <main class="portail-main">
    <div class="portail-topbar">
      <div class="topbar-title">{{ pageTitle }}</div>
      <div class="topbar-right">
        <div class="topbar-date">{{ aujourd_hui }}</div>
      </div>
    </div>
    <div class="portail-content">
      <router-outlet></router-outlet>
    </div>
  </main>

</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    .portail-shell {
      display: flex;
      height: 100vh;
      width: 100vw;
      background: #0f172a;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }

    /* ── SIDEBAR ── */
    .portail-sidebar {
      width: 240px;
      min-width: 240px;
      height: 100vh;
      background: linear-gradient(180deg, #0f172a 0%, #1e2d44 100%);
      border-right: 1px solid rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .brand-icon {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(249,115,22,0.35);
      flex-shrink: 0;
    }
    .brand-name { font-size: 0.85rem; font-weight: 800; color: white; letter-spacing: 0.04em; }
    .brand-sub  { font-size: 0.6rem; color: #f97316; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

    .client-badge {
      display: flex; align-items: center; gap: 10px;
      margin: 16px 14px 8px;
      padding: 12px 14px;
      background: rgba(249,115,22,0.08);
      border: 1px solid rgba(249,115,22,0.2);
      border-radius: 12px;
    }
    .client-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 800; color: white;
      flex-shrink: 0;
    }
    .client-name { font-size: 0.78rem; font-weight: 700; color: white; line-height: 1.2; }
    .client-role { font-size: 0.6rem; color: #f97316; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }

    /* ── NAV ── */
    .sidebar-nav {
      flex: 1;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      overflow-y: auto;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      text-decoration: none;
      color: #94a3b8;
      font-size: 0.82rem;
      font-weight: 500;
      transition: all 0.18s;
      cursor: pointer;
      position: relative;
    }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
    .nav-item.active { background: rgba(249,115,22,0.15); color: #f97316; font-weight: 700; }
    .nav-icon { font-size: 1rem; width: 22px; text-align: center; flex-shrink: 0; }
    .nav-label { flex: 1; }
    .nav-badge {
      background: #ef4444; color: white;
      font-size: 0.6rem; font-weight: 800;
      padding: 1px 7px; border-radius: 99px; min-width: 18px; text-align: center;
    }
    .nav-badge-blue { background: #3b82f6; }

    .sidebar-footer {
      padding: 16px 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .btn-logout {
      width: 100%;
      display: flex; align-items: center; gap: 8px; justify-content: center;
      padding: 10px 16px;
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      color: #f87171;
      font-size: 0.8rem; font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
    }
    .btn-logout:hover { background: rgba(239,68,68,0.2); color: #ef4444; }

    /* ── MAIN ── */
    .portail-main {
      flex: 1;
      display: flex; flex-direction: column;
      overflow: hidden;
      background: #f8fafc;
    }
    .portail-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 28px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .topbar-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .topbar-date  { font-size: 0.78rem; color: #64748b; }

    .portail-content {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
    }
  `]
})
export class PortailLayoutComponent implements OnInit {
  clientNom = '';
  clientInitials = '';
  nbFacturesImpayees = 0;
  nbDevisEnAttente = 0;
  pageTitle = 'Espace Client';
  aujourd_hui = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.clientNom = parsed.prenom
          ? `${parsed.prenom} ${parsed.nom || ''}`.trim()
          : parsed.nomUtilisateur || parsed.email || 'Client';
        this.clientInitials = this.clientNom.split(' ')
          .map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
      } catch {}
    }

    const now = new Date();
    this.aujourd_hui = now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Charger KPIs pour badges
    this.chargerKpis();
  }

  chargerKpis(): void {
    const raw = localStorage.getItem('currentUser');
    const token = raw ? JSON.parse(raw).token : null;
    if (!token) return;

    fetch(`${environment.apiUrl}/portail/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then((data: any) => {
      this.nbFacturesImpayees = data.kpis?.facturesImpayees || 0;
      this.nbDevisEnAttente   = data.kpis?.devisEnAttente   || 0;
    })
    .catch(() => {});
  }

  deconnecter(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
