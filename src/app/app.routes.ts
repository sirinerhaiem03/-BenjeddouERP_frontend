import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { portailClientGuard } from './core/guards/portail-client.guard';
import { superadminGuard } from './core/guards/superadmin.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(c => c.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register-client/register-client.component').then(c => c.RegisterClientComponent)
  },
  {
    path: 'register-admin',
    redirectTo: 'register',
    pathMatch: 'full'
  },
  {
    path: 'abonnement',
    loadComponent: () => import('./features/abonnement/abonnement.component').then(c => c.AbonnementComponent)
  },
  {
    path: 'paiement/succes',
    loadComponent: () => import('./features/abonnement/paiement-succes.component').then(c => c.PaiementSuccesComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
  },
  {
    path: 'changer-mot-de-passe',
    loadComponent: () => import('./features/auth/changer-mot-de-passe/changer-mot-de-passe.component').then(c => c.ChangerMotDePasseComponent)
  },
  {
    path: 'trial-expire',
    loadComponent: () => import('./features/abonnement/trial-expire.component').then(c => c.TrialExpireComponent)
  },
  {
    path: 'signaler-connexion',
    loadComponent: () => import('./features/auth/signaler-connexion/signaler-connexion.component').then(c => c.SignalerConnexionComponent)
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent),
        canActivate: [permissionGuard],
        data: { module: 'dashboard' }
      },
      {
        path: 'acces-refuse',
        loadComponent: () => import('./features/acces-refuse/acces-refuse.component').then(c => c.AccesRefuseComponent)
      },
      {
        path: 'mon-profil',
        loadComponent: () => import('./features/mon-profil/mon-profil.component').then(c => c.MonProfilComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/stock/stock.component').then(c => c.StockComponent),
        canActivate: [permissionGuard],
        data: { module: 'stock' }
      },
      {
        path: 'commercial',
        loadComponent: () => import('./features/commercial/commercial.component').then(c => c.CommercialComponent),
        canActivate: [permissionGuard],
        data: { module: 'ventes' }
      },
      {
        path: 'admin-users',
        loadComponent: () => import('./features/admin-users/admin-users.component').then(c => c.AdminUsersComponent)
      },
      {
        path: 'roles-permissions',
        loadComponent: () => import('./features/roles-permissions/roles-permissions.component').then(c => c.RolesPermissionsComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/admin-clients/admin-clients.component').then(c => c.AdminClientsComponent)
      },
      {
        path: 'abonnements',
        loadComponent: () => import('./features/abonnement/admin-abonnements.component').then(c => c.AdminAbonnementsComponent)
      },
      {
        path: 'ocr',
        loadComponent: () => import('./features/ai-assistant/ocr-scanner/ocr-scanner.component').then(c => c.OcrScannerComponent)
      },
      {
        path: 'achats',
        loadComponent: () => import('./features/achats/achats.component').then(c => c.AchatsComponent),
        canActivate: [permissionGuard],
        data: { module: 'achats' }
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance.component').then(c => c.FinanceComponent),
        canActivate: [permissionGuard],
        data: { module: 'comptabilite' }
      },
      // ── Espace Client (visible uniquement pour le rôle CLIENT) ──────────
      {
        path: 'client-accueil',
        loadComponent: () => import('./features/portail-client/portail-accueil.component').then(c => c.PortailAccueilComponent)
      },
      {
        path: 'client-factures',
        loadComponent: () => import('./features/portail-client/portail-factures.component').then(c => c.PortailFacturesComponent)
      },
      {
        path: 'client-devis',
        loadComponent: () => import('./features/portail-client/portail-devis.component').then(c => c.PortailDevisComponent)
      },
      {
        path: 'client-commandes',
        loadComponent: () => import('./features/portail-client/portail-commandes.component').then(c => c.PortailCommandesComponent)
      },
      {
        path: 'client-profil',
        loadComponent: () => import('./features/portail-client/portail-profil.component').then(c => c.PortailProfilComponent)
      },
      {
        path: 'client-releve',
        loadComponent: () => import('./features/portail-client/portail-releve.component').then(c => c.PortailReleveComponent)
      },
      {
        path: 'client-demande-devis',
        loadComponent: () => import('./features/portail-client/portail-demande-devis.component').then(c => c.PortailDemandeDevisComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents.component').then(c => c.DocumentsComponent)
      },
      // ── Recherche Avancée (N°3) ────────────────────────────────────────
      {
        path: 'recherche-avancee',
        loadComponent: () => import('./features/recherche-avancee/recherche-avancee.component').then(c => c.RechercheAvanceeComponent)
      },
      {
        path: 'billing',
        loadComponent: () => import('./features/finance/finance.component').then(c => c.FinanceComponent)
      },
      {
        path: 'demo',
        loadComponent: () => import('./features/demo-fonctionnalites/demo-fonctionnalites.component').then(c => c.DemoFonctionnalitesComponent)
      },
      // ── Journal d'Audit & Sécurité ─────────────────────────────────────
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(c => c.AuditComponent)
      },
      // ── Moteur de Calcul ──────────────────────────────────────────────
      {
        path: 'moteur-calcul',
        loadComponent: () => import('./features/moteur-calcul/moteur-calcul.component').then(c => c.MoteurCalculComponent)
      },
      // -- SuperAdmin -- Gestion des Entreprises --
      {
        path: 'entreprises',
        loadComponent: () => import('./features/superadmin-entreprises/superadmin-entreprises.component').then(c => c.SuperadminEntreprisesComponent)
      },
      // -- Identite Visuelle de l'entreprise --
      {
        path: 'branding',
        loadComponent: () => import('./features/dashboard/enterprise-branding.component').then(c => c.EnterpriseBrandingComponent)
      },
      {
        path: 'db-management',
        loadComponent: () => import('./features/superadmin/sa-db-management/db-management.component').then(c => c.DbManagementComponent)
      }

    ]
  },

  {
    path: 'portail-client',
    loadComponent: () => import('./layout/portail-layout/portail-layout.component').then(c => c.PortailLayoutComponent),
    canActivate: [portailClientGuard],
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil',   loadComponent: () => import('./features/portail-client/portail-accueil.component').then(c => c.PortailAccueilComponent) },
      { path: 'factures',  loadComponent: () => import('./features/portail-client/portail-factures.component').then(c => c.PortailFacturesComponent) },
      { path: 'devis',     loadComponent: () => import('./features/portail-client/portail-devis.component').then(c => c.PortailDevisComponent) },
      { path: 'commandes', loadComponent: () => import('./features/portail-client/portail-commandes.component').then(c => c.PortailCommandesComponent) },
      { path: 'profil',    loadComponent: () => import('./features/portail-client/portail-profil.component').then(c => c.PortailProfilComponent) },
    ]
  },

  // ══════════════════════════════════════════════
  // ESPACE SUPERADMIN — Interface dédiée
  // ══════════════════════════════════════════════
  {
    path: 'superadmin',
    loadComponent: () => import('./layout/superadmin-layout/superadmin-layout.component').then(c => c.SuperadminLayoutComponent),
    canActivate: [superadminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/superadmin/superadmin-dashboard/superadmin-dashboard.component').then(c => c.SuperadminDashboardComponent)
      },
      {
        path: 'entreprises',
        loadComponent: () => import('./features/superadmin/sa-entreprises/sa-entreprises.component').then(c => c.SaEntreprisesComponent)
      },
      {
        path: 'utilisateurs',
        loadComponent: () => import('./features/superadmin/sa-utilisateurs/sa-utilisateurs.component').then(c => c.SaUtilisateursComponent)
      },
      {
        path: 'mon-profil',
        loadComponent: () => import('./features/mon-profil/mon-profil.component').then(c => c.MonProfilComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/superadmin/sa-audit/sa-audit.component').then(c => c.SaAuditComponent)
      },
      {
        path: 'configuration',
        loadComponent: () => import('./features/superadmin/sa-configuration/sa-configuration.component').then(c => c.SaConfigurationComponent)
      },
      {
        path: 'sessions',
        loadComponent: () => import('./features/superadmin/sa-sessions/sa-sessions.component').then(c => c.SaSessionsComponent)
      },
      {
        path: 'securite',
        loadComponent: () => import('./features/superadmin/sa-securite/sa-securite.component').then(c => c.SaSecuriteComponent)
      },
      {
        path: 'theming',
        loadComponent: () => import('./features/superadmin/sa-configuration/sa-theming.component').then(c => c.SaThemingComponent)
      },
      {
        path: 'taux',
        loadComponent: () => import('./features/superadmin/sa-taux/sa-taux.component').then(c => c.SaTauxComponent)
      },
      {
        path: 'db-management',
        loadComponent: () => import('./features/superadmin/sa-db-management/db-management.component').then(c => c.DbManagementComponent)
      }

    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];
