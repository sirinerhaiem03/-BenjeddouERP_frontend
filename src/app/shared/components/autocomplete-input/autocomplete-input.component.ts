import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

export interface AutocompleteSuggestion {
  value: string;
  label: string;
  sub?: string;
  icon?: string;
}

@Component({
  selector: 'app-autocomplete-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ac-wrapper" style="position:relative;">
      <input
        [type]="inputType"
        [placeholder]="placeholder"
        [(ngModel)]="inputValue"
        (ngModelChange)="onInputChange($event)"
        (keydown)="onKeyDown($event)"
        (focus)="onFocus()"
        [disabled]="disabled"
        [readonly]="readonly"
        [id]="inputId"
        [name]="inputName"
        autocomplete="off"
      />
      <!-- Dropdown suggestions -->
      <div class="autocomplete-dropdown" *ngIf="showDropdown && !readonly && !disabled">
        <div *ngIf="isLoading" class="autocomplete-empty">
          <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:6px">sync</span>
          Recherche...
        </div>
        <div *ngIf="!isLoading && suggestions.length === 0 && inputValue.length >= minChars" class="autocomplete-empty">
          Aucun résultat pour "{{ inputValue }}"
        </div>
        <div
          *ngFor="let s of suggestions; let i = index"
          class="autocomplete-item"
          [class.active]="i === activeIndex"
          (mousedown)="selectSuggestion(s)"
        >
          <span class="material-symbols-outlined ac-icon">{{ s.icon || defaultIcon }}</span>
          <span class="ac-label">{{ s.label }}</span>
          <span class="ac-sub" *ngIf="s.sub">{{ s.sub }}</span>
        </div>
      </div>
    </div>
  `
})
export class AutocompleteInputComponent implements OnInit, OnDestroy {
  @Input() type: 'clients' | 'produits' | 'fournisseurs' | 'categories' | 'libelles' | 'utilisateurs' = 'clients';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() inputType = 'text';
  @Input() inputId = '';
  @Input() inputName = '';
  @Input() minChars = 2;
  @Input() maxResults = 10;

  @Input() set value(v: string) {
    this.inputValue = v || '';
  }
  @Output() valueChange = new EventEmitter<string>();
  @Output() suggestionSelected = new EventEmitter<AutocompleteSuggestion>();

  inputValue = '';
  suggestions: AutocompleteSuggestion[] = [];
  showDropdown = false;
  isLoading = false;
  activeIndex = -1;

  private search$ = new Subject<string>();
  private apiBase = '/api/suggestions';

  get defaultIcon(): string {
    const icons: Record<string, string> = {
      clients: 'person',
      produits: 'inventory_2',
      fournisseurs: 'local_shipping',
      categories: 'category',
      libelles: 'label',
      utilisateurs: 'manage_accounts'
    };
    return icons[this.type] || 'search';
  }

  constructor(private http: HttpClient, private elRef: ElementRef) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(220),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < this.minChars) {
          this.suggestions = [];
          this.showDropdown = false;
          return of([]);
        }
        this.isLoading = true;
        return this.http.get<AutocompleteSuggestion[]>(
          `${this.apiBase}/${this.type}?q=${encodeURIComponent(q)}&max=${this.maxResults}`
        );
      })
    ).subscribe({
      next: (results) => {
        this.suggestions = results;
        this.isLoading = false;
        this.showDropdown = true;
        this.activeIndex = -1;
      },
      error: () => {
        this.isLoading = false;
        this.suggestions = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.search$.complete();
  }

  onInputChange(val: string): void {
    this.inputValue = val;
    this.valueChange.emit(val);
    this.search$.next(val);
  }

  onFocus(): void {
    if (this.inputValue.length >= this.minChars && this.suggestions.length > 0) {
      this.showDropdown = true;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showDropdown) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
    } else if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      this.selectSuggestion(this.suggestions[this.activeIndex]);
    } else if (event.key === 'Escape') {
      this.showDropdown = false;
    }
  }

  selectSuggestion(s: AutocompleteSuggestion): void {
    this.inputValue = s.value;
    this.valueChange.emit(s.value);
    this.suggestionSelected.emit(s);
    this.showDropdown = false;
    this.suggestions = [];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.showDropdown = false;
    }
  }
}
