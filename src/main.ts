import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { jwtRefreshInterceptor } from './app/core/interceptors/jwt-refresh.interceptor';
import { importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ThemeService } from './app/core/services/theme.service';
import { LanguageService } from './app/core/services/language.service';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// Charge le theme depuis le backend avant le rendu de l'application
export function initTheme(themeService: ThemeService) {
  return () => themeService.loadAndApply().toPromise();
}

/**
 * Initialise la langue depuis localStorage avant le premier rendu.
 * Priorité : erp_lang (localStorage) → navigateur → 'fr'
 */
export function initLanguage(languageService: LanguageService) {
  return () => {
    languageService.init();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor, jwtRefreshInterceptor])
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'fr',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),
    // APP_INITIALIZER [1] : charge le thème AVANT le premier rendu
    {
      provide: APP_INITIALIZER,
      useFactory: initTheme,
      deps: [ThemeService],
      multi: true
    },
    // APP_INITIALIZER [2] : restaure la langue (FR/EN/AR) + RTL AVANT le premier rendu
    {
      provide: APP_INITIALIZER,
      useFactory: initLanguage,
      deps: [LanguageService],
      multi: true
    }
  ]
}).catch(err => console.error(err));
