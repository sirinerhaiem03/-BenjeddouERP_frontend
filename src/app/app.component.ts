import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeartbeatService } from './core/services/session-timeout.service';
import { ChatbotComponent } from './shared/chatbot/chatbot.component';
import { TrialBannerComponent } from './shared/components/trial-banner/trial-banner.component';
import { AuthService } from './core/services/auth.service';

import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotComponent, TrialBannerComponent],
  template: `
    <router-outlet></router-outlet>
    <app-chatbot></app-chatbot>
    <app-trial-banner></app-trial-banner>
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
