import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService } from './../../core/services/ai.service';
import { LanguageService, AppLang } from './../../core/services/language.service';

export interface ChatMessagePart {
  type: 'text' | 'link';
  content: string;
  url?: string;
}

export interface ChatMessage {
  text: string;
  parts?: ChatMessagePart[];
  sender: 'user' | 'ai';
  time: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  private aiService = inject(AiService);
  public langService = inject(LanguageService);
  private router = inject(Router);

  isOpen = false;
  isTyping = false;
  userInput = '';
  messages: ChatMessage[] = [];

  // Puces de questions suggérées par langue
  suggestedQuestions: { [key in AppLang]: { label: string; query: string }[] } = {
    fr: [
      { label: '🗄️ BDD & Export SQL', query: 'Comment exporter ou sauvegarder la base de données SQL ?' },
      { label: '🛡️ Journal d\'Audit', query: 'Comment consulter le journal d\'audit et la sécurité ?' },
      { label: '💰 Ventes & Factures', query: 'Donne-moi le résumé des ventes et des factures' },
      { label: '👥 Utilisateurs SaaS', query: 'Combien d\'utilisateurs actifs avons-nous dans le système ?' }
    ],
    en: [
      { label: '🗄️ DB & SQL Export', query: 'How to export or backup the SQL database?' },
      { label: '🛡️ Audit Logs', query: 'How to view audit logs and security events?' },
      { label: '💰 Sales & Revenue', query: 'Show me sales summary and paid invoices' },
      { label: '👥 Active Users', query: 'How many active users are in the system?' }
    ],
    ar: [
      { label: '🗄️ قواعد البيانات والتصدير', query: 'كيف يمكن تصدير أو استرجاع قاعدة البيانات SQL؟' },
      { label: '🛡️ سجل التدقيق والأمان', query: 'كيف يمكنني الاطلاع على سجل التدقيق والأنشطة؟' },
      { label: '💰 المبيعات والفواتير', query: 'أعطني ملخص المبيعات والفواتير المسددة' },
      { label: '👥 المستخدمون النشطون', query: 'كم عدد المستخدمين النشطين في النظام؟' }
    ]
  };

  ngOnInit() {
    this.reinitialiserMessageAccueil();
    this.aiService.isOpen$.subscribe(open => {
      this.isOpen = open;
      if (open) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  get currentLang(): AppLang {
    return this.langService.currentLang;
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  setLangue(lang: AppLang) {
    this.langService.setLanguage(lang);
    if (this.messages.length <= 1) {
      this.reinitialiserMessageAccueil();
    }
  }

  private reinitialiserMessageAccueil() {
    const lang = this.currentLang;
    let accueilText = '';

    if (lang === 'ar') {
      accueilText = "مرحباً بك! أنا **المساعد الذكي لنظام BENJEDDOU ERP** 🤖. يمكنني مساعدتك في متابعة المبيعات، إدارة قواعد البيانات، سجلات التدقيق والمستخدمين.";
    } else if (lang === 'en') {
      accueilText = "Hello! I am the **BENJEDDOU ERP AI Assistant** 🤖. I can help you with database management, audit logs, sales analytics, and user permissions.";
    } else {
      accueilText = "Bonjour ! Je suis l'**Assistant IA de BENJEDDOU ERP** 🤖. Je peux vous guider sur la gestion des bases de données, l'audit log, les ventes, les stocks et la facturation.";
    }

    this.messages = [{
      text: accueilText,
      parts: this.parseMarkdownLinks(accueilText),
      sender: 'ai',
      time: new Date()
    }];
  }

  toggleChat() {
    this.aiService.toggleChat();
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) {}
  }

  envoyerQuestionSuggeree(query: string) {
    this.userInput = query;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const messageText = this.userInput.trim();
    this.messages.push({
      text: messageText,
      parts: [{ type: 'text', content: messageText }],
      sender: 'user',
      time: new Date()
    });

    this.userInput = '';
    this.isTyping = true;
    this.scrollToBottom();

    const currentRoute = this.router.url;
    let currentRole = '';
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentRole = (payload.roles || []).join(',');
      }
    } catch {}

    this.aiService.chatWithAssistant(messageText, this.currentLang, currentRoute, currentRole).subscribe({
      next: (res) => {
        this.isTyping = false;
        const replyText = res.reply || '';
        this.messages.push({
          text: replyText,
          parts: this.parseMarkdownLinks(replyText),
          sender: 'ai',
          time: new Date()
        });
        this.scrollToBottom();
      },
      error: (err) => {
        this.isTyping = false;
        let errorMsg = "Désolé, une erreur est survenue lors de la communication avec le serveur IA.";
        if (this.currentLang === 'ar') errorMsg = "عذراً، حدث خطأ أثناء الاتصال بخادم الذكاء الاصطناعي.";
        if (this.currentLang === 'en') errorMsg = "Sorry, an error occurred while communicating with the AI server.";

        this.messages.push({
          text: errorMsg,
          parts: [{ type: 'text', content: errorMsg }],
          sender: 'ai',
          time: new Date()
        });
      }
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  parseMarkdownLinks(text: string): ChatMessagePart[] {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: ChatMessagePart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'link', content: match[1], url: match[2] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    return parts;
  }

  naviguerVers(url?: string) {
    if (url) {
      this.router.navigateByUrl(url);
    }
  }
}
