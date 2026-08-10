import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'fr' | 'en' | 'ar';

/**
 * LanguageService — Service centralisé de gestion de la langue
 *
 * Responsabilités :
 *  ✅ Chargement depuis localStorage au démarrage
 *  ✅ Application RTL/LTR sur <html> selon la langue
 *  ✅ Persistance dans localStorage (clé : erp_lang)
 *  ✅ Synchronisation avec ngx-translate
 *  ✅ Méthode centralisée appelable depuis tous les composants/layouts
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly STORAGE_KEY = 'erp_lang';

  /** Langues disponibles avec leur métadonnées d'affichage */
  readonly availableLanguages = [
    { code: 'fr' as AppLang, label: 'Français',  flag: '🇫🇷', dir: 'ltr' },
    { code: 'en' as AppLang, label: 'English',   flag: '🇬🇧', dir: 'ltr' },
    { code: 'ar' as AppLang, label: 'العربية',   flag: '🇸🇦', dir: 'rtl' },
  ];

  constructor(private translate: TranslateService) {}

  /**
   * Initialise la langue au démarrage de l'application.
   * Priorité : localStorage → langue du navigateur → 'fr' par défaut
   */
  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as AppLang | null;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userLang = currentUser.languePreference || currentUser.langue;
    const browserLang = this.translate.getBrowserLang() as AppLang;

    const lang: AppLang =
      saved && this.isSupported(saved) ? saved :
      userLang && this.isSupported(userLang) ? userLang :
      this.isSupported(browserLang)    ? browserLang :
      'fr';

    this.applyLanguage(lang, true);
  }

  /**
   * Change la langue active, applique le RTL si nécessaire et persiste.
   */
  setLanguage(lang: AppLang): void {
    this.applyLanguage(lang, true);
  }

  /** Langue actuellement active */
  get currentLang(): AppLang {
    return (this.translate.currentLang || 'fr') as AppLang;
  }

  /** true si la langue courante est RTL (Arabe) */
  get isRTL(): boolean {
    return this.currentLang === 'ar';
  }

  /** Métadonnées de la langue courante */
  get currentLangMeta() {
    return this.availableLanguages.find(l => l.code === this.currentLang)
      ?? this.availableLanguages[0];
  }

  // ─────────────────────────────────────────────────────────────
  // Méthodes privées
  // ─────────────────────────────────────────────────────────────

  private applyLanguage(lang: AppLang, persist: boolean): void {
    this.translate.use(lang);

    // Appliquer la direction RTL/LTR sur l'élément racine
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);

    // Ajouter/retirer la classe CSS rtl sur le body pour les styles spécifiques
    if (lang === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }

    if (persist) {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }
  }

  private isSupported(lang: string): lang is AppLang {
    return ['fr', 'en', 'ar'].includes(lang);
  }

  private registerSuperadminFallback(): void {
    const frSuperadmin = {
      SUPERADMIN: {
        HEADER_TITLE: "Espace Administration Plateforme",
        SUPER_ADMIN_ROLE: "Super Administrateur",
        SECTION_PLATFORM: "GESTION PLATEFORME",
        SECTION_SECURITY: "SÉCURITÉ & MONITORING",
        SECTION_SETTINGS: "PARAMÉTRAGE",
        SECTION_APPEARANCE: "APPARENCE",
        NAV_GLOBAL_VIEW: "Vue Globale",
        NAV_ENTERPRISES: "Entreprises",
        NAV_ALL_USERS: "Tous les Utilisateurs",
        NAV_AUDIT_LOG: "Journal d'Audit",
        NAV_ACTIVE_SESSIONS: "Sessions Actives",
        NAV_CONFIGURATION: "Configuration",
        NAV_SECURITY_BACKUP: "Sécurité & Backup",
        NAV_RATES_PERIODS: "Taux & Périodes",
        NAV_CUSTOMIZATION: "Personnalisation",
        NAV_LOGOUT: "Déconnexion",
        DASHBOARD: {
          TITLE: "Vue Globale Plateforme",
          SUBTITLE: "Supervision en temps réel de toutes les entreprises",
          TOTAL_ENTERPRISES: "Total Entreprises",
          ACTIVE_ENTERPRISES: "Entreprises Actives",
          SUSPENDED: "Suspendues",
          TOTAL_USERS: "Utilisateurs Totaux",
          SECURITY_ALERTS: "Alertes Sécurité (24h)",
          RECENT_ENTERPRISES: "Entreprises Récentes",
          VIEW_ALL: "Tout voir",
          TH_ENTERPRISE: "ENTREPRISE",
          TH_SCHEMA: "SCHÉMA",
          TH_STATUS: "STATUT",
          RECENT_ACTIVITY: "Activité Récente",
          PLATFORM_INFO: "Informations Plateforme",
          ERP_VERSION: "Version ERP",
          ARCHITECTURE: "Architecture",
          DATABASE: "Base de données",
          BACKEND: "Backend",
          FRONTEND: "Frontend",
          SYSTEM_STATUS: "Statut Système",
          ONLINE: "En ligne",
          ENV_SAAS: "SaaS Multi-Tenant"
        },
        ENTREPRISES: {
          TITLE: "Gestion des Entreprises",
          SUBTITLE: "entreprise(s) enregistrée(s) sur la plateforme",
          NEW_BTN: "Nouvelle Entreprise",
          SEARCH_PH: "Rechercher une entreprise, un schéma, un admin...",
          TH_NUM: "#",
          TH_ENT: "Entreprise",
          TH_SCHEMA: "Schéma BDD",
          TH_ADMIN: "Admin",
          TH_STATUS: "Statut",
          TH_DATE: "Date Création",
          TH_ACTIONS: "Actions"
        },
        USERS: {
          TITLE: "Tous les Utilisateurs",
          SUBTITLE: "utilisateur(s) sur la plateforme",
          SEARCH_PH: "Rechercher nom, email, identifiant...",
          ALL_ROLES: "Tous les rôles",
          ALL_STATUS: "Tous les statuts",
          TH_USER: "Utilisateur",
          TH_EMAIL: "Email",
          TH_ROLE: "Rôle",
          TH_ENT: "Entreprise",
          TH_STATUS: "Statut",
          TH_ACTIONS: "Actions"
        },
        AUDIT: {
          TITLE: "Journal d'Audit Global",
          SUBTITLE: "événement(s) enregistré(s) au total",
          REFRESH: "Actualiser",
          TOTAL_LOGS: "logs total",
          CRITICAL_LOGS: "critiques (24h)",
          SEARCH_PH: "Rechercher utilisateur, IP, détails...",
          ALL_ACTIONS: "Toutes les actions",
          FILTER_BTN: "Filtrer"
        },
        SESSIONS: {
          TITLE: "Supervision des Sessions & Sécurité",
          SUBTITLE: "Gérez toutes les connexions en temps réel · Historique · Signalements · Blocage IP",
          REFRESH: "Actualiser",
          ACTIVE_SESSIONS: "Sessions Actives",
          ENDED: "Terminées",
          REVOKED: "Révoquées",
          ALERTS: "Signalements",
          TOTAL_CONN: "Total Connexions",
          TAB_ACTIVE: "Sessions Actives",
          TAB_HISTORY: "Historique Complet",
          TAB_ALERTS: "Signalements"
        },
        CONFIG: {
          TITLE: "Configuration Plateforme",
          SUBTITLE: "Paramètres globaux de la plateforme BENJEDDOU ERP",
          SAVED_MSG: "Configuration sauvegardée avec succès !",
          GENERAL_SETTINGS: "Paramètres Généraux",
          MAINTENANCE_MODE: "Mode Maintenance",
          MAINTENANCE_DESC: "Bloquer l'accès à toutes les entreprises",
          MAX_ENT: "Maximum d'entreprises",
          MAX_ENT_DESC: "Limite du nombre d'entreprises sur la plateforme",
          TRIAL_DAYS: "Durée du Trial (jours)",
          TRIAL_DAYS_DESC: "Nombre de jours d'essai gratuit",
          EMAIL_CONFIG: "Configuration Email",
          SENDER_EMAIL: "Adresse expéditeur",
          PLATFORM_URLS: "URLs de la Plateforme",
          FRONTEND_URL: "URL Frontend",
          BACKEND_URL: "URL Backend API",
          SYSTEM_INFO: "Informations Système",
          SAVE_BTN: "Sauvegarder la Configuration"
        },
        TAUX: {
          TITLE: "Gestion des Taux & Périodes",
          SUBTITLE: "Base de référence centralisée — partagée avec tous les tenants SaaS",
          REFRESH: "Actualiser",
          NEW_PERIOD: "Nouvelle Période",
          TOTAL_PERIODS: "Total Périodes",
          ACTIVE: "Actives",
          INACTIVE: "Inactives",
          AVG_RATE: "Taux Moyen (actives)",
          SEARCH_PH: "Rechercher par libellé, date, taux…",
          TABLE_HEADER: "Périodes de Taux",
          RESULTS: "résultat(s)"
        },
        SECURITE: {
          TITLE: "Sécurité & Backup Plateforme",
          SUBTITLE: "Gestion de la sécurité, sauvegardes et comptes démo — BENJEDDOU ERP SaaS",
          REFRESH: "Actualiser",
          DEMO_TITLE: "Reset Comptes Démo",
          DEMO_DESC: "Réinitialise tous les mots de passe des comptes de démonstration à leurs valeurs documentées.",
          TH_USER: "Utilisateur",
          TH_PWD: "Mot de passe",
          TH_ROLE: "Rôle",
          CONFIRM_MSG: "Cette action va réinitialiser les mots de passe de tous les comptes démo. Confirmer ?",
          CANCEL: "Annuler",
          CONFIRM_BTN: "Confirmer le Reset",
          RESET_BTN: "Réinitialiser les Comptes Démo",
          RESETTING: "Réinitialisation...",
          BACKUP_TITLE: "Sauvegardes Sécurisées",
          BACKUP_DESC: "Sauvegardes automatiques chaque nuit à 02h00. Chiffrées avec AES-256-GCM, compressées GZIP, rétention 30 jours.",
          DAILY_2AM: "Quotidienne à 02h00",
          ROTATION_30D: "Rotation 30 jours",
          BACKUP_BTN: "Déclencher une Sauvegarde",
          BACKUP_IN_PROGRESS: "Sauvegarde en cours...",
          VIEW_BACKUPS: "Voir les Sauvegardes",
          CLEAN_30D: "Nettoyer > 30j",
          LAST_BACKUP: "Dernière sauvegarde créée",
          AVAILABLE_BACKUPS: "Sauvegardes disponibles",
          NO_BACKUPS: "Aucune sauvegarde trouvée. Déclenchez une première sauvegarde ci-dessus.",
          ENCRYPT_TITLE: "Chiffrement des Données Sensibles",
          ENCRYPT_DESC: "Les données personnelles sont chiffrées automatiquement avant stockage en base de données.",
          ENCRYPTED: "Chiffré",
          HASHED: "Hashé",
          SIGNED: "Signé"
        },
        THEMING: {
          TITLE: "Personnalisation Visuelle",
          SUBTITLE: "Définissez l'identité visuelle de BENJEDDOU ERP — appliquée à tous les utilisateurs",
          RESET_BTN: "Réinitialiser",
          SAVE_BTN: "Sauvegarder en BDD",
          SAVING: "Sauvegarde...",
          SAVE_SUCCESS: "Thème sauvegardé en BDD ! Tous les utilisateurs verront le nouveau thème.",
          INFO_BDD: "Les modifications sont sauvegardées en BDD MySQL et s'appliquent à tous les utilisateurs au prochain chargement.",
          SECT_COLORS: "Couleurs",
          PRIMARY_COLOR: "Couleur principale",
          ACCENT_COLOR: "Couleur accentuation",
          SIDEBAR_COLOR: "Couleur sidebar",
          SECT_ICONS: "Jeu d'icônes",
          SECT_TYPO: "Typographie",
          FONT_PRIMARY: "Police principale",
          RADIUS: "Rayon des coins",
          SECT_UI: "Interface",
          DARK_MODE: "Mode sombre",
          DARK_DESC: "Fond de couleur foncée",
          COMPACT_MODE: "Mode compact",
          COMPACT_DESC: "Réduit les espacements",
          SECT_LOGO: "Logo & Identité",
          PLATFORM_NAME: "Nom de la plateforme",
          UPLOAD_LOGO: "Logo (upload)",
          CLICK_TO_UPLOAD: "Cliquer pour télécharger",
          UPLOAD_HINT: "PNG, SVG, JPG recommandé · Max 2MB",
          DELETE_LOGO: "Supprimer",
          LIVE_PREVIEW: "Aperçu en temps réel",
          ACTIVE_CONFIG: "Configuration active (BDD)"
        }
      }
    };

    const enSuperadmin = {
      SUPERADMIN: {
        HEADER_TITLE: "Platform Administration Workspace",
        SUPER_ADMIN_ROLE: "Super Administrator",
        SECTION_PLATFORM: "PLATFORM MANAGEMENT",
        SECTION_SECURITY: "SECURITY & MONITORING",
        SECTION_SETTINGS: "SETTINGS",
        SECTION_APPEARANCE: "APPEARANCE",
        NAV_GLOBAL_VIEW: "Global Overview",
        NAV_ENTERPRISES: "Enterprises",
        NAV_ALL_USERS: "All Users",
        NAV_AUDIT_LOG: "Audit Log",
        NAV_ACTIVE_SESSIONS: "Active Sessions",
        NAV_CONFIGURATION: "Configuration",
        NAV_SECURITY_BACKUP: "Security & Backup",
        NAV_RATES_PERIODS: "Rates & Periods",
        NAV_CUSTOMIZATION: "Customization",
        NAV_LOGOUT: "Logout",
        DASHBOARD: {
          TITLE: "Platform Global View",
          SUBTITLE: "Real-time supervision of all enterprises",
          TOTAL_ENTERPRISES: "Total Enterprises",
          ACTIVE_ENTERPRISES: "Active Enterprises",
          SUSPENDED: "Suspended",
          TOTAL_USERS: "Total Users",
          SECURITY_ALERTS: "Security Alerts (24h)",
          RECENT_ENTERPRISES: "Recent Enterprises",
          VIEW_ALL: "View All",
          TH_ENTERPRISE: "ENTERPRISE",
          TH_SCHEMA: "SCHEMA",
          TH_STATUS: "STATUS",
          RECENT_ACTIVITY: "Recent Activity",
          PLATFORM_INFO: "Platform Information",
          ERP_VERSION: "ERP Version",
          ARCHITECTURE: "Architecture",
          DATABASE: "Database",
          BACKEND: "Backend",
          FRONTEND: "Frontend",
          SYSTEM_STATUS: "System Status",
          ONLINE: "Online",
          ENV_SAAS: "Multi-Tenant SaaS"
        },
        ENTREPRISES: {
          TITLE: "Enterprise Management",
          SUBTITLE: "registered enterprise(s) on the platform",
          NEW_BTN: "New Enterprise",
          SEARCH_PH: "Search enterprise, schema, admin...",
          TH_NUM: "#",
          TH_ENT: "Enterprise",
          TH_SCHEMA: "DB Schema",
          TH_ADMIN: "Admin",
          TH_STATUS: "Status",
          TH_DATE: "Creation Date",
          TH_ACTIONS: "Actions"
        },
        USERS: {
          TITLE: "All Users",
          SUBTITLE: "user(s) on the platform",
          SEARCH_PH: "Search name, email, username...",
          ALL_ROLES: "All roles",
          ALL_STATUS: "All status",
          TH_USER: "User",
          TH_EMAIL: "Email",
          TH_ROLE: "Role",
          TH_ENT: "Enterprise",
          TH_STATUS: "Status",
          TH_ACTIONS: "Actions"
        },
        AUDIT: {
          TITLE: "Global Audit Log",
          SUBTITLE: "total recorded event(s)",
          REFRESH: "Refresh",
          TOTAL_LOGS: "total logs",
          CRITICAL_LOGS: "critical (24h)",
          SEARCH_PH: "Search user, IP, details...",
          ALL_ACTIONS: "All actions",
          FILTER_BTN: "Filter"
        },
        SESSIONS: {
          TITLE: "Sessions & Security Supervision",
          SUBTITLE: "Manage all real-time connections · History · Alerts · IP Blocking",
          REFRESH: "Refresh",
          ACTIVE_SESSIONS: "Active Sessions",
          ENDED: "Ended",
          REVOKED: "Revoked",
          ALERTS: "Alerts",
          TOTAL_CONN: "Total Connections",
          TAB_ACTIVE: "Active Sessions",
          TAB_HISTORY: "Full History",
          TAB_ALERTS: "Alerts"
        },
        CONFIG: {
          TITLE: "Platform Configuration",
          SUBTITLE: "Global settings for the BENJEDDOU ERP platform",
          SAVED_MSG: "Configuration saved successfully!",
          GENERAL_SETTINGS: "General Settings",
          MAINTENANCE_MODE: "Maintenance Mode",
          MAINTENANCE_DESC: "Block access to all enterprises",
          MAX_ENT: "Maximum enterprises",
          MAX_ENT_DESC: "Limit of enterprises on the platform",
          TRIAL_DAYS: "Trial duration (days)",
          TRIAL_DAYS_DESC: "Number of free trial days",
          EMAIL_CONFIG: "Email Configuration",
          SENDER_EMAIL: "Sender address",
          PLATFORM_URLS: "Platform URLs",
          FRONTEND_URL: "Frontend URL",
          BACKEND_URL: "Backend API URL",
          SYSTEM_INFO: "System Information",
          SAVE_BTN: "Save Configuration"
        },
        TAUX: {
          TITLE: "Rates & Periods Management",
          SUBTITLE: "Centralized reference base — shared with all SaaS tenants",
          REFRESH: "Refresh",
          NEW_PERIOD: "New Period",
          TOTAL_PERIODS: "Total Periods",
          ACTIVE: "Active",
          INACTIVE: "Inactive",
          AVG_RATE: "Average Rate (active)",
          SEARCH_PH: "Search by label, date, rate…",
          TABLE_HEADER: "Rate Periods",
          RESULTS: "result(s)"
        },
        SECURITE: {
          TITLE: "Platform Security & Backup",
          SUBTITLE: "Security management, backups and demo accounts — BENJEDDOU ERP SaaS",
          REFRESH: "Refresh",
          DEMO_TITLE: "Reset Demo Accounts",
          DEMO_DESC: "Resets all demo account passwords to their documented values.",
          TH_USER: "User",
          TH_PWD: "Password",
          TH_ROLE: "Role",
          CONFIRM_MSG: "This action will reset the passwords of all demo accounts. Confirm?",
          CANCEL: "Cancel",
          CONFIRM_BTN: "Confirm Reset",
          RESET_BTN: "Reset Demo Accounts",
          RESETTING: "Resetting...",
          BACKUP_TITLE: "Secured Backups",
          BACKUP_DESC: "Automatic backups every night at 02:00. Encrypted with AES-256-GCM, GZIP compressed, 30 days retention.",
          DAILY_2AM: "Daily at 02:00",
          ROTATION_30D: "30 days rotation",
          BACKUP_BTN: "Trigger Backup",
          BACKUP_IN_PROGRESS: "Backup in progress...",
          VIEW_BACKUPS: "View Backups",
          CLEAN_30D: "Clean > 30d",
          LAST_BACKUP: "Last backup created",
          AVAILABLE_BACKUPS: "Available backups",
          NO_BACKUPS: "No backup found. Trigger a first backup above.",
          ENCRYPT_TITLE: "Sensitive Data Encryption",
          ENCRYPT_DESC: "Personal data is automatically encrypted before database storage.",
          ENCRYPTED: "Encrypted",
          HASHED: "Hashed",
          SIGNED: "Signed"
        },
        THEMING: {
          TITLE: "Visual Customization",
          SUBTITLE: "Set visual identity for BENJEDDOU ERP — applied to all users",
          RESET_BTN: "Reset",
          SAVE_BTN: "Save to DB",
          SAVING: "Saving...",
          SAVE_SUCCESS: "Theme saved to DB! All users will see the new theme.",
          INFO_BDD: "Changes are saved in MySQL DB and apply to all users on next load.",
          SECT_COLORS: "Colors",
          PRIMARY_COLOR: "Primary color",
          ACCENT_COLOR: "Accent color",
          SIDEBAR_COLOR: "Sidebar color",
          SECT_ICONS: "Icon Set",
          SECT_TYPO: "Typography",
          FONT_PRIMARY: "Primary font",
          RADIUS: "Corner Radius",
          SECT_UI: "Interface",
          DARK_MODE: "Dark Mode",
          DARK_DESC: "Dark background",
          COMPACT_MODE: "Compact Mode",
          COMPACT_DESC: "Reduce spacing",
          SECT_LOGO: "Logo & Identity",
          PLATFORM_NAME: "Platform name",
          UPLOAD_LOGO: "Logo (upload)",
          CLICK_TO_UPLOAD: "Click to upload",
          UPLOAD_HINT: "PNG, SVG, JPG recommended · Max 2MB",
          DELETE_LOGO: "Remove",
          LIVE_PREVIEW: "Live Preview",
          ACTIVE_CONFIG: "Active Configuration (DB)"
        }
      }
    };

    const arSuperadmin = {
      SUPERADMIN: {
        HEADER_TITLE: "فضاء إدارة المنصة",
        SUPER_ADMIN_ROLE: "المسؤول الأعلى (Super Admin)",
        SECTION_PLATFORM: "إدارة المنصة",
        SECTION_SECURITY: "الأمان والمراقبة",
        SECTION_SETTINGS: "الإعدادات",
        SECTION_APPEARANCE: "المظهر",
        NAV_GLOBAL_VIEW: "نظرة عامة",
        NAV_ENTERPRISES: "المؤسسات / الشركات",
        NAV_ALL_USERS: "كافة المستخدمين",
        NAV_AUDIT_LOG: "سجل التدقيق والأمان",
        NAV_ACTIVE_SESSIONS: "الجلسات النشطة",
        NAV_CONFIGURATION: "التكوين والإعدادات",
        NAV_SECURITY_BACKUP: "الأمان والنسخ الاحتياطي",
        NAV_RATES_PERIODS: "النسب والفتريات",
        NAV_CUSTOMIZATION: "التخصيص البصري",
        NAV_LOGOUT: "تسجيل الخروج",
        DASHBOARD: {
          TITLE: "نظرة عامة على المنصة",
          SUBTITLE: "مراقبة فورية ومباشرة لكافة المؤسسات والشركات",
          TOTAL_ENTERPRISES: "إجمالي المؤسسات",
          ACTIVE_ENTERPRISES: "المؤسسات النشطة",
          SUSPENDED: "المؤسسات المعطلة",
          TOTAL_USERS: "مجموع المستخدمين",
          SECURITY_ALERTS: "تنبيهات الأمان (24 ساعة)",
          RECENT_ENTERPRISES: "المؤسسات الحديثة",
          VIEW_ALL: "عرض الكل",
          TH_ENTERPRISE: "المؤسسة",
          TH_SCHEMA: "المخطط (Schema)",
          TH_STATUS: "الحالة",
          RECENT_ACTIVITY: "النشاط الحديث",
          PLATFORM_INFO: "معلومات المنصة",
          ERP_VERSION: "إصدار ERP",
          ARCHITECTURE: "البنية الهندسية",
          DATABASE: "قاعدة البيانات",
          BACKEND: "الخلفية (Backend)",
          FRONTEND: "الواجهة (Frontend)",
          SYSTEM_STATUS: "حالة النظام",
          ONLINE: "متصل ومتاح",
          ENV_SAAS: "SaaS متعدد المؤسسات"
        },
        ENTREPRISES: {
          TITLE: "إدارة المؤسسات والشركات",
          SUBTITLE: "مؤسسة مسجلة في المنصة",
          NEW_BTN: "مؤسسة جديدة",
          SEARCH_PH: "البحث عن مؤسسة، مخطط، مسؤول...",
          TH_NUM: "#",
          TH_ENT: "المؤسسة",
          TH_SCHEMA: "مخطط قاعدة البيانات",
          TH_ADMIN: "المسؤول",
          TH_STATUS: "الحالة",
          TH_DATE: "تاريخ الإنشاء",
          TH_ACTIONS: "الإجراءات"
        },
        USERS: {
          TITLE: "كافة المستخدمين",
          SUBTITLE: "مستخدمين في المنصة",
          SEARCH_PH: "البحث بالاسم، البريد الإلكتروني، المعرف...",
          ALL_ROLES: "جميع الأدوار",
          ALL_STATUS: "جميع الحالات",
          TH_USER: "المستخدم",
          TH_EMAIL: "البريد الإلكتروني",
          TH_ROLE: "الدور",
          TH_ENT: "المؤسسة",
          TH_STATUS: "الحالة",
          TH_ACTIONS: "الإجراءات"
        },
        AUDIT: {
          TITLE: "سجل التدقيق والأمان العام",
          SUBTITLE: "إجمالي الأحداث والعمليات المسجلة",
          REFRESH: "تحديث",
          TOTAL_LOGS: "إجمالي السجلات",
          CRITICAL_LOGS: "حرجة (24 ساعة)",
          SEARCH_PH: "البحث بالمستخدم، IP، التفاصيل...",
          ALL_ACTIONS: "جميع الإجراءات",
          FILTER_BTN: "تصفية"
        },
        SESSIONS: {
          TITLE: "مراقبة الجلسات والأمان",
          SUBTITLE: "إدارة كافة الاتصالات الفورية · السجل · التنبيهات · حظر IP",
          REFRESH: "تحديث",
          ACTIVE_SESSIONS: "الجلسات النشطة",
          ENDED: "منتهية",
          REVOKED: "ملغاة / ملغاة الحظر",
          ALERTS: "التنبيهات",
          TOTAL_CONN: "إجمالي الاتصالات",
          TAB_ACTIVE: "الجلسات النشطة",
          TAB_HISTORY: "السجل الكامل",
          TAB_ALERTS: "التنبيهات"
        },
        CONFIG: {
          TITLE: "تكوين وإعدادات المنصة",
          SUBTITLE: "الإعدادات العامة لمنصة BENJEDDOU ERP",
          SAVED_MSG: "تم حفظ التكوين بنجاح!",
          GENERAL_SETTINGS: "الإعدادات العامة",
          MAINTENANCE_MODE: "وضع الصيانة",
          MAINTENANCE_DESC: "حظر الوصول لجميع المؤسسات",
          MAX_ENT: "الحد الأقصى للمؤسسات",
          MAX_ENT_DESC: "الحد الأقصى لعدد المؤسسات في المنصة",
          TRIAL_DAYS: "مدة التجربة (أيام)",
          TRIAL_DAYS_DESC: "عدد أيام التجربة المجانية",
          EMAIL_CONFIG: "تكوين البريد الإلكتروني",
          SENDER_EMAIL: "عنوان المرسل",
          PLATFORM_URLS: "روابط المنصة",
          FRONTEND_URL: "رابط الواجهة الأمامية",
          BACKEND_URL: "رابط API الخلفية",
          SYSTEM_INFO: "معلومات النظام",
          SAVE_BTN: "حفظ التكوين"
        },
        TAUX: {
          TITLE: "إدارة النسب والفتريات",
          SUBTITLE: "قاعدة مرجعية مركزية — مشتركة مع كافة المؤسسات",
          REFRESH: "تحديث",
          NEW_PERIOD: "فترة جديدة",
          TOTAL_PERIODS: "إجمالي الفتريات",
          ACTIVE: "نشطة",
          INACTIVE: "غير نشطة",
          AVG_RATE: "متوسط النسبة (النشطة)",
          SEARCH_PH: "البحث بالاسم، التاريخ، النسبة...",
          TABLE_HEADER: "فتريات النسب",
          RESULTS: "نتيجة"
        },
        SECURITE: {
          TITLE: "الأمان والنسخ الاحتياطي للمنصة",
          SUBTITLE: "إدارة الأمان والنسخ الاحتياطي والحسابات التجريبية — BENJEDDOU ERP SaaS",
          REFRESH: "تحديث",
          DEMO_TITLE: "إعادة ضبط الحسابات التجريبية",
          DEMO_DESC: "إعادة ضبط جميع كلمات المرور للحسابات التجريبية إلى قيمها الموثقة.",
          TH_USER: "المستخدم",
          TH_PWD: "كلمة المرور",
          TH_ROLE: "الدور",
          CONFIRM_MSG: "سيتم إعادة ضبط كلمات المرور لجميع الحسابات التجريبية. هل تؤكد الإجراء؟",
          CANCEL: "إلغاء",
          CONFIRM_BTN: "تأكيد إعادة الضبط",
          RESET_BTN: "إعادة ضبط الحسابات التجريبية",
          RESETTING: "جاري إعادة الضبط...",
          BACKUP_TITLE: "النسخ الاحتياطي الآمن",
          BACKUP_DESC: "نسخ احتياطي تلقائي كل ليلة عند الساعة 02:00 صباحاً. مشفر بـ AES-256-GCM ومضغوط بـ GZIP، مع احتفاظ لمدة 30 يوماً.",
          DAILY_2AM: "يومي عند 02:00 صباحاً",
          ROTATION_30D: "تدوير لمدة 30 يوماً",
          BACKUP_BTN: "بدء نسخ احتياطي الآن",
          BACKUP_IN_PROGRESS: "جاري النسخ الاحتياطي...",
          VIEW_BACKUPS: "عرض النسخ الاحتياطية",
          CLEAN_30D: "تنظيف > 30 يوماً",
          LAST_BACKUP: "آخر نسخة احتياطية تم إنشاؤها",
          AVAILABLE_BACKUPS: "النسخ الاحتياطية المتاحة",
          NO_BACKUPS: "لم يتم العثور على أي نسخة احتياطية. قم ببدء نسخة احتياطية جديدة أعلاه.",
          ENCRYPT_TITLE: "تشفير البيانات الحساسة",
          ENCRYPT_DESC: "تتم تشفير البيانات الشخصية تلقائياً قبل تخزينها في قاعدة البيانات.",
          ENCRYPTED: "مشفر",
          HASHED: "مُجزء (Hash)",
          SIGNED: "مُوقع"
        },
        THEMING: {
          TITLE: "التخصيص البصري للمنصة",
          SUBTITLE: "حدد الهوية البصرية لـ BENJEDDOU ERP — المطبقة على كافة المستخدمين",
          RESET_BTN: "إعادة ضبط",
          SAVE_BTN: "حفظ في قاعدة البيانات",
          SAVING: "جاري الحفظ...",
          SAVE_SUCCESS: "تم حفظ المظهر في قاعدة البيانات! سيشاهد جميع المستخدمين المظهر الجديد.",
          INFO_BDD: "يتم حفظ التغييرات في قاعدة بيانات MySQL وتطبيقها على جميع المستخدمين عند التحميل القادم.",
          SECT_COLORS: "الألوان الرئيسية",
          PRIMARY_COLOR: "اللون الرئيسي",
          ACCENT_COLOR: "لون التمييز",
          SIDEBAR_COLOR: "لون الشريط الجانبي",
          SECT_ICONS: "مجموعة الأيقونات",
          SECT_TYPO: "الخطوط والتنسيق",
          FONT_PRIMARY: "الخط الرئيسي",
          RADIUS: "انحناء الزوايا",
          SECT_UI: "الواجهة",
          DARK_MODE: "الوضع الداكن",
          DARK_DESC: "خلفية ذات لون داكن",
          COMPACT_MODE: "الوضع المدمج",
          COMPACT_DESC: "تقليل المسافات البينية",
          SECT_LOGO: "الشعار والهوية",
          PLATFORM_NAME: "اسم المنصة",
          UPLOAD_LOGO: "الشعار (رفع)",
          CLICK_TO_UPLOAD: "انقر للرفع",
          UPLOAD_HINT: "يُنصح بـ PNG, SVG, JPG · أقصى حد 2 ميغابايت",
          DELETE_LOGO: "حذف الشعار",
          LIVE_PREVIEW: "معاينة فورية",
          ACTIVE_CONFIG: "التكوين النشط (قاعدة البيانات)"
        }
      }
    };

    this.translate.setTranslation('fr', frSuperadmin, true);
    this.translate.setTranslation('en', enSuperadmin, true);
    this.translate.setTranslation('ar', arSuperadmin, true);
  }
}
