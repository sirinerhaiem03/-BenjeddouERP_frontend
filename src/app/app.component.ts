import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeartbeatService } from './core/services/session-timeout.service';
import { TrialBannerComponent } from './shared/components/trial-banner/trial-banner.component';
import { AiChatWidgetComponent } from './shared/components/ai-chat-widget/ai-chat-widget.component';
import { AuthService } from './core/services/auth.service';

import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AiChatWidgetComponent],
  template: `
    <router-outlet></router-outlet>
    <app-ai-chat-widget></app-ai-chat-widget>
  `
})
export class AppComponent implements OnInit {
  constructor(
    private heartbeatService: HeartbeatService,
    private authService: AuthService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Initialiser la langue enregistrée de l'utilisateur (FR, EN, AR)
    this.languageService.init();

    // Démarrer le heartbeat si l'utilisateur est déjà connecté (après refresh de page)
    if (this.authService.isLoggedIn()) {
      this.heartbeatService.start();
    }

    // S'abonner aux connexions futures
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.heartbeatService.start();
        const prefLang = user.languePreference || user.langue;
        if (prefLang && ['fr', 'en', 'ar'].includes(prefLang)) {
          this.languageService.setLanguage(prefLang as any);
        }
      } else {
        this.heartbeatService.stop();
      }
    });
  }
}
