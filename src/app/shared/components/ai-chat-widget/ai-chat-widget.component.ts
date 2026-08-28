import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  Input, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface Suggestion { icon: string; label: string; text: string; }
interface QuickSuggestion { label: string; text: string; }

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat-widget.component.html',
  styleUrls: ['./ai-chat-widget.component.css'],
  // OnPush : Angular ne déclenche le change detection QUE si une input change
  // ou si on appelle detectChanges() manuellement → évite la boucle infinie
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('inputArea') private inputArea!: ElementRef;
  @Input() userRole: string = '';

  isOpen = false;
  messages: ChatMessage[] = [];
  inputMessage = '';
  isTyping = false;
  inputFocused = false;
  currentLang = 'fr';
  unreadCount = 0;

  // ── Pré-calculées UNE SEULE FOIS — jamais recréées dans le template ──
  suggestions: Suggestion[] = [];
  quickSuggestions: QuickSuggestion[] = [];

  // Textes UI pré-calculés
  labelTitle = '';
  labelOnline = '';
  labelClear = '';
  labelPlaceholder = '';
  labelWelcome = '';
  labelWelcomeSub = '';
  labelDisclaimer = '';

  private messageCounter = 0;
  private subscription?: Subscription;

  private readonly LABELS: Record<string, Record<string, string>> = {
    fr: {
      title: 'Assistant IA', online: '● En ligne', clear: 'Effacer',
      placeholder: 'Posez votre question…',
      welcome: 'Bonjour ! Je suis votre Assistant IA',
      welcomeSub: 'Je peux vous aider avec tous les modules de BENJEDDOU ERP.',
      disclaimer: 'Assistant IA · BENJEDDOU ERP',
    },
    en: {
      title: 'AI Assistant', online: '● Online', clear: 'Clear',
      placeholder: 'Ask me anything…',
      welcome: 'Hello! I am your AI Assistant',
      welcomeSub: 'I can help you with all BENJEDDOU ERP modules.',
      disclaimer: 'AI Assistant · BENJEDDOU ERP',
    },
    ar: {
      title: 'المساعد الذكي', online: '● متصل', clear: 'مسح',
      placeholder: 'اكتب سؤالك هنا…',
      welcome: 'مرحباً! أنا مساعدك الذكي',
      welcomeSub: 'يمكنني مساعدتك في جميع وحدات نظام BENJEDDOU ERP.',
      disclaimer: 'المساعد الذكي · BENJEDDOU ERP',
    }
  };

  private readonly SUGGESTIONS: Record<string, Suggestion[]> = {
    fr: [
      { icon: '💰', label: 'Ventes & Factures', text: 'Statistiques de ventes et factures' },
      { icon: '📦', label: 'Stock', text: 'État du stock et alertes de rupture' },
      { icon: '👥', label: 'Utilisateurs', text: 'Gestion des utilisateurs et rôles' },
      { icon: '🗄️', label: 'Base de données', text: 'Comment exporter la base de données ?' },
      { icon: '🛡️', label: 'Audit & Sécurité', text: "Journal d'audit et sécurité système" },
      { icon: '🏢', label: 'Entreprises', text: 'Gestion des entreprises SaaS' },
    ],
    en: [
      { icon: '💰', label: 'Sales & Invoices', text: 'Sales and invoice statistics' },
      { icon: '📦', label: 'Inventory', text: 'Stock status and low stock alerts' },
      { icon: '👥', label: 'Users', text: 'User management and roles' },
      { icon: '🗄️', label: 'Database', text: 'How to export the database?' },
      { icon: '🛡️', label: 'Audit & Security', text: 'Audit log and system security' },
      { icon: '🏢', label: 'Companies', text: 'SaaS tenant management' },
    ],
    ar: [
      { icon: '💰', label: 'المبيعات', text: 'إحصائيات المبيعات والفواتير' },
      { icon: '📦', label: 'المخزون', text: 'حالة المخزون وتنبيهات النقص' },
      { icon: '👥', label: 'المستخدمون', text: 'إدارة المستخدمين والأدوار' },
      { icon: '🗄️', label: 'قاعدة البيانات', text: 'كيفية تصدير قاعدة البيانات؟' },
      { icon: '🛡️', label: 'الأمان', text: 'سجل التدقيق وأمان النظام' },
      { icon: '🏢', label: 'الشركات', text: 'إدارة الشركات SaaS' },
    ]
  };

  private readonly QUICK_SUGGESTIONS: Record<string, QuickSuggestion[]> = {
    fr: [
      { label: '📊 Tableau de bord', text: 'Résumé du tableau de bord' },
      { label: '📦 Stock', text: 'Alertes stock' },
      { label: '🗄️ Export BDD', text: 'Comment exporter la base de données ?' },
      { label: '💼 Comptabilité', text: 'État de la comptabilité' },
    ],
    en: [
      { label: '📊 Dashboard', text: 'Dashboard summary' },
      { label: '📦 Inventory', text: 'Stock alerts' },
      { label: '🗄️ DB Export', text: 'How to export the database?' },
      { label: '💼 Accounting', text: 'Accounting status' },
    ],
    ar: [
      { label: '📊 لوحة التحكم', text: 'ملخص لوحة التحكم' },
      { label: '📦 المخزون', text: 'تنبيهات المخزون' },
      { label: '🗄️ تصدير', text: 'كيفية تصدير قاعدة البيانات؟' },
      { label: '💼 المحاسبة', text: 'وضع المحاسبة' },
    ]
  };

  constructor(
    private aiService: AiService,
    private authService: AuthService,
    private langService: LanguageService,
    private translate: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Déterminer le rôle utilisateur si non fourni
    if (!this.userRole) {
      this.userRole = this.authService.currentUserValue?.role || '';
    }

    // 2. Initialiser la langue active
    this.currentLang = this.langService.currentLang || 'fr';
    this._rebuildStaticData();

    // 3. Écouter dynamiquement les changements de langue (depuis header, settings, etc.)
    this.subscription = this.translate.onLangChange.subscribe(event => {
      if (event.lang && ['fr', 'en', 'ar'].includes(event.lang)) {
        this.currentLang = event.lang;
        this._rebuildStaticData();
        this.cdr.markForCheck();
      }
    });

    // 4. Écouter l'état d'ouverture du chat
    const openSub = this.aiService.isOpen$.subscribe(open => {
      this.isOpen = open;
      if (open) {
        this.unreadCount = 0;
        setTimeout(() => this.inputArea?.nativeElement?.focus(), 200);
      }
      this.cdr.markForCheck();
    });
    this.subscription.add(openSub);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  /** Recalcule les données statiques quand la langue change — appelé UNE seule fois */
  private _rebuildStaticData() {
    const l = this.LABELS[this.currentLang] ?? this.LABELS['fr'];
    this.labelTitle       = l['title'];
    this.labelOnline      = l['online'];
    this.labelClear       = l['clear'];
    this.labelPlaceholder = l['placeholder'];
    this.labelWelcome     = l['welcome'];
    this.labelWelcomeSub  = l['welcomeSub'];
    this.labelDisclaimer  = l['disclaimer'];
    this.suggestions      = this.SUGGESTIONS[this.currentLang] ?? this.SUGGESTIONS['fr'];
    this.quickSuggestions = (this.QUICK_SUGGESTIONS[this.currentLang] ?? this.QUICK_SUGGESTIONS['fr']).slice(0, 4);
  }

  toggleChat() {
    this.aiService.toggleChat();
  }

  setLang(lang: string) {
    this.currentLang = lang;
    this.langService.setLanguage(lang as any);
    this._rebuildStaticData();
    this.cdr.markForCheck();
  }

  clearHistory() {
    this.messages = [];
    this.unreadCount = 0;
    this.cdr.markForCheck();
  }

  sendSuggestion(text: string) {
    this.inputMessage = text;
    this.sendMessage();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(event: Event) {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
  }

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.isTyping) return;

    this.messages = [...this.messages, {
      id: ++this.messageCounter, role: 'user', content: text, timestamp: new Date()
    }];
    this.inputMessage = '';
    if (this.inputArea) this.inputArea.nativeElement.style.height = 'auto';

    const loadingId = ++this.messageCounter;
    this.messages = [...this.messages, {
      id: loadingId, role: 'assistant', content: '', timestamp: new Date(), loading: true
    }];
    this.isTyping = true;
    this.cdr.markForCheck();
    this._scrollLater();

    const route = this.router.url || '';
    this.aiService.chatWithAssistant(text, this.currentLang, route, this.userRole).subscribe({
      next: (resp: any) => {
        const reply = resp?.reply ?? resp?.message ?? this.getFallback();
        this.messages = this.messages.map(m =>
          m.id === loadingId ? { ...m, content: reply, loading: false } : m
        );
        this.isTyping = false;
        if (!this.isOpen) this.unreadCount++;
        this.cdr.markForCheck();
        this._scrollLater();
      },
      error: () => {
        this.messages = this.messages.map(m =>
          m.id === loadingId ? { ...m, content: this.getFallback(), loading: false } : m
        );
        this.isTyping = false;
        this.cdr.markForCheck();
      }
    });
  }

  private _scrollLater() {
    setTimeout(() => {
      try {
        const el = this.messagesContainer?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      } catch {}
    }, 50);
  }

  private getFallback(): string {
    const f: Record<string, string> = {
      fr: '🤖 Je suis en ligne et prêt à vous aider. Posez-moi une question sur les modules de BENJEDDOU ERP.',
      en: '🤖 I am online and ready to help. Ask me anything about BENJEDDOU ERP modules.',
      ar: '🤖 أنا متصل وجاهز لمساعدتك.'
    };
    return f[this.currentLang] ?? f['fr'];
  }

  trackByMessage(_: number, m: ChatMessage) { return m.id; }
  trackBySuggestion(_: number, s: Suggestion)      { return s.text; }
  trackByQuick(_: number, s: QuickSuggestion)       { return s.text; }

  renderMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
        url.startsWith('/')
          ? `<a href="javascript:void(0)" style="color:#6366f1;text-decoration:underline;cursor:pointer;">${label}</a>`
          : `<a href="${url}" target="_blank" style="color:#6366f1;text-decoration:underline;">${label}</a>`
      )
      .replace(/^[•\-] (.*)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }
}
