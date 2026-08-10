import {
  Component, OnInit, OnDestroy, ElementRef, HostListener, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { UtilsService, ResultatRecherche } from '../../services/utils.service';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="gs-wrapper" [class.gs-open]="isOpen">
  <!-- Barre de recherche -->
  <div class="gs-bar">
    <span class="material-symbols-outlined gs-icon">search</span>
    <input
      #searchInput
      type="text"
      class="gs-input"
      placeholder="Rechercher partout... (clients, produits, utilisateurs)"
      [(ngModel)]="query"
      (ngModelChange)="onQueryChange($event)"
      (focus)="onFocus()"
      autocomplete="off"
      id="global-search-input"
    />
    <div class="gs-loader" *ngIf="loading">
      <span class="material-symbols-outlined spin">progress_activity</span>
    </div>
    <button class="gs-clear" *ngIf="query" (click)="clear()">
      <span class="material-symbols-outlined">close</span>
    </button>
    <kbd class="gs-shortcut" *ngIf="!query && !isOpen">Ctrl+K</kbd>
  </div>

  <!-- Panneau de résultats -->
  <div class="gs-dropdown" *ngIf="isOpen && (resultats.length > 0 || (query.length >= 2 && !loading))">

    <ng-container *ngIf="resultats.length > 0">
      <div class="gs-group" *ngFor="let groupe of resultatsGroupes">
        <div class="gs-group-label">{{ groupe.label }}</div>
        <button
          class="gs-item"
          *ngFor="let item of groupe.items; let i = index"
          [class.gs-item-active]="selectedIndex === getGlobalIndex(groupe, i)"
          (click)="naviguer(item)"
          (mouseenter)="selectedIndex = getGlobalIndex(groupe, i)"
        >
          <div class="gs-item-icon">
            <span class="material-symbols-outlined">{{ item.icone }}</span>
          </div>
          <div class="gs-item-content">
            <span class="gs-item-titre" [innerHTML]="highlight(item.titre)"></span>
            <span class="gs-item-sub">{{ item.sousTitre }}</span>
          </div>
          <div class="gs-item-badge">{{ typeBadge(item.type) }}</div>
          <span class="material-symbols-outlined gs-item-arrow">arrow_forward</span>
        </button>
      </div>

      <div class="gs-footer" (click)="voirTous()">
        <span class="material-symbols-outlined">manage_search</span>
        Voir tous les résultats pour "<strong>{{ query }}</strong>"
      </div>
    </ng-container>

    <div class="gs-empty" *ngIf="resultats.length === 0 && query.length >= 2 && !loading">
      <span class="material-symbols-outlined">search_off</span>
      <p>Aucun résultat pour "<strong>{{ query }}</strong>"</p>
      <span>Vérifiez l'orthographe ou essayez un autre terme</span>
    </div>

    <div class="gs-hints" *ngIf="query.length < 2">
      <span class="material-symbols-outlined">tips_and_updates</span>
      Tapez au moins 2 caractères pour lancer la recherche
    </div>
  </div>
</div>
  `,
  styles: [`
.gs-wrapper { position: relative; flex: 1; max-width: 520px; }

.gs-bar {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; padding: 7px 12px;
  transition: all 0.2s;
}
.gs-bar:focus-within {
  background: rgba(255,255,255,0.1);
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
}

.gs-icon { color: #64748b; font-size: 18px; flex-shrink: 0; }
.gs-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--text-primary, #1e293b); font-size: 0.85rem; font-family: 'Inter', sans-serif;
}
.gs-input::placeholder { color: #94a3b8; }

.gs-loader .spin { color: #f97316; font-size: 16px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.gs-clear {
  background: none; border: none; cursor: pointer; padding: 2px;
  color: #94a3b8; display: flex; align-items: center;
}
.gs-clear:hover { color: #f97316; }
.gs-clear span { font-size: 16px; }

.gs-shortcut {
  background: rgba(100,116,139,0.15); color: #64748b;
  border: 1px solid rgba(100,116,139,0.25); border-radius: 4px;
  font-size: 0.6rem; padding: 2px 6px; font-family: monospace; white-space: nowrap;
}

.gs-dropdown {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15); z-index: 9999;
  max-height: 440px; overflow-y: auto;
  animation: fadeSlide 0.15s ease;
}
@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.gs-group-label {
  font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.08em; color: #94a3b8;
  padding: 10px 14px 4px;
}

.gs-item {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; background: none; border: none; cursor: pointer;
  text-align: left; transition: background 0.15s;
}
.gs-item:hover, .gs-item-active { background: #f8fafc; }
.gs-item-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.gs-item-icon span { color: #f97316; font-size: 16px; }
.gs-item-content { flex: 1; min-width: 0; }
.gs-item-titre { display: block; font-size: 0.8rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gs-item-titre ::ng-deep mark { background: #fef3c7; color: #92400e; padding: 0 2px; border-radius: 2px; }
.gs-item-sub { display: block; font-size: 0.68rem; color: #64748b; }
.gs-item-badge {
  font-size: 0.58rem; font-weight: 700; background: #f1f5f9;
  color: #64748b; padding: 2px 7px; border-radius: 99px; white-space: nowrap; flex-shrink: 0;
}
.gs-item-arrow { font-size: 14px; color: #cbd5e1; opacity: 0; transition: opacity 0.15s; }
.gs-item:hover .gs-item-arrow, .gs-item-active .gs-item-arrow { opacity: 1; color: #f97316; }

.gs-footer {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  font-size: 0.75rem; color: #64748b; border-top: 1px solid #f1f5f9;
  cursor: pointer; transition: background 0.15s;
}
.gs-footer:hover { background: #f8fafc; color: #f97316; }
.gs-footer span { font-size: 16px; }

.gs-empty, .gs-hints {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 28px 20px; gap: 8px; text-align: center;
  color: #94a3b8; font-size: 0.78rem;
}
.gs-empty span, .gs-hints span { font-size: 32px; color: #cbd5e1; }
.gs-empty p { color: #475569; font-size: 0.82rem; }
  `]
})
export class GlobalSearchComponent implements OnInit, OnDestroy {

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  query = '';
  isOpen = false;
  loading = false;
  resultats: ResultatRecherche[] = [];
  resultatsGroupes: { label: string; items: ResultatRecherche[] }[] = [];
  selectedIndex = -1;

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private utilsService: UtilsService,
    private router: Router,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q: string) => {
        if (q.length < 2) {
          this.loading = false;
          this.resultats = [];
          this.resultatsGroupes = [];
          return of([] as ResultatRecherche[]);
        }
        this.loading = true;
        return this.utilsService.autocomplete(q);
      }),
      takeUntil(this.destroy$)
    ).subscribe((resultats: ResultatRecherche[]) => {
      this.loading = false;
      this.resultats = resultats;
      this.grouper(resultats);
      this.selectedIndex = -1;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(q: string): void {
    this.search$.next(q);
    this.isOpen = true;
  }

  onFocus(): void {
    this.isOpen = true;
  }

  clear(): void {
    this.query = '';
    this.resultats = [];
    this.resultatsGroupes = [];
    this.isOpen = false;
    this.searchInput?.nativeElement.focus();
  }

  naviguer(item: ResultatRecherche): void {
    this.clear();
    this.router.navigate(['/dashboard', item.route]);
  }

  voirTous(): void {
    this.router.navigate(['/dashboard', 'recherche-avancee'], { queryParams: { q: this.query } });
    this.clear();
  }

  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (e.key === 'ArrowDown') {
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.resultats.length - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
      e.preventDefault();
    } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
      this.naviguer(this.resultats[this.selectedIndex]);
    } else if (e.key === 'Escape') {
      this.isOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.searchInput?.nativeElement.focus();
      this.isOpen = true;
    }
  }

  grouper(items: ResultatRecherche[]): void {
    const map = new Map<string, ResultatRecherche[]>();
    const labels: Record<string, string> = {
      UTILISATEUR: 'Utilisateurs', CLIENT: 'Clients',
      FOURNISSEUR: 'Fournisseurs', PRODUIT: 'Produits'
    };
    items.forEach(item => {
      const label = labels[item.type] || item.type;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    });
    this.resultatsGroupes = Array.from(map.entries()).map(([label, its]) => ({ label, items: its }));
  }

  getGlobalIndex(groupe: { label: string; items: ResultatRecherche[] }, localIndex: number): number {
    let offset = 0;
    for (const g of this.resultatsGroupes) {
      if (g.label === groupe.label) break;
      offset += g.items.length;
    }
    return offset + localIndex;
  }

  highlight(text: string): string {
    if (!this.query || !text) return text;
    const re = new RegExp(`(${this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  typeBadge(type: string): string {
    const map: Record<string, string> = {
      UTILISATEUR: 'Utilisateur', CLIENT: 'Client',
      FOURNISSEUR: 'Fournisseur', PRODUIT: 'Produit'
    };
    return map[type] || type;
  }
}
