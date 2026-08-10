import {
  Component, Input, Output, EventEmitter, OnDestroy, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { UtilsService, ResultatRecherche } from '../../services/utils.service';

/**
 * Composant d'auto-complétion intelligente (N°1).
 * Se connecte au GlobalSearch et propose des suggestions depuis la BD.
 *
 * Usage:
 *   <app-smart-autocomplete
 *     [(ngModel)]="nomClient"
 *     label="Client"
 *     [types]="['CLIENT']"
 *     (itemSelected)="onClientSelect($event)"
 *   ></app-smart-autocomplete>
 */
@Component({
  selector: 'app-smart-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SmartAutocompleteComponent),
    multi: true
  }],
  template: `
<div class="sac-wrapper" [class.sac-open]="isOpen && suggestions.length > 0">
  <label class="sac-label" *ngIf="label">
    {{ label }}<span class="sac-req" *ngIf="required">*</span>
  </label>

  <div class="sac-input-wrap" [class.sac-focused]="isOpen">
    <span class="material-symbols-outlined sac-icon">{{ icon }}</span>
    <input
      type="text"
      class="sac-input"
      [placeholder]="placeholder"
      [(ngModel)]="valeur"
      (ngModelChange)="onSaisie($event)"
      (focus)="onFocus()"
      (blur)="onBlur()"
      [id]="inputId"
      autocomplete="off"
    />
    <div class="sac-loader" *ngIf="loading">
      <span class="material-symbols-outlined sac-spin">progress_activity</span>
    </div>
    <button class="sac-clear" *ngIf="valeur && !loading" (click)="clear()" type="button">
      <span class="material-symbols-outlined">close</span>
    </button>
  </div>

  <!-- Dropdown suggestions -->
  <div class="sac-dropdown" *ngIf="isOpen && suggestions.length > 0">
    <button
      type="button"
      class="sac-item"
      *ngFor="let item of suggestions; let i = index"
      [class.sac-item-active]="selectedIdx === i"
      (click)="selectionner(item)"
      (mouseenter)="selectedIdx = i"
    >
      <div class="sac-item-icon">
        <span class="material-symbols-outlined">{{ item.icone }}</span>
      </div>
      <div class="sac-item-body">
        <span class="sac-item-titre">{{ item.titre }}</span>
        <span class="sac-item-sub">{{ item.sousTitre }}</span>
      </div>
      <span class="sac-item-type">{{ item.type }}</span>
    </button>
  </div>
</div>
  `,
  styles: [`
.sac-wrapper { position: relative; }
.sac-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; margin-bottom: 5px; }
.sac-req { color: #ef4444; margin-left: 2px; }

.sac-input-wrap {
  display: flex; align-items: center; gap: 6px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 8px 10px; background: #fff; transition: all 0.2s;
}
.sac-focused { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }

.sac-icon { font-size: 18px; color: #94a3b8; flex-shrink: 0; }
.sac-input { flex: 1; border: none; outline: none; font-size: 0.85rem; color: #1e293b; background: transparent; }
.sac-input::placeholder { color: #cbd5e1; }

.sac-loader { display: flex; }
.sac-spin { font-size: 16px; color: #f97316; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.sac-clear { background: none; border: none; cursor: pointer; padding: 2px; color: #94a3b8; display: flex; }
.sac-clear:hover { color: #f97316; }
.sac-clear span { font-size: 16px; }

.sac-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 9998;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  animation: fadeIn 0.12s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; } }

.sac-item {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 9px 12px;
  background: none; border: none; cursor: pointer; text-align: left; transition: background 0.1s;
}
.sac-item:hover, .sac-item-active { background: #f8fafc; }
.sac-item-icon {
  width: 30px; height: 30px; border-radius: 7px;
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sac-item-icon span { color: #f97316; font-size: 15px; }
.sac-item-body { flex: 1; min-width: 0; }
.sac-item-titre { display: block; font-size: 0.78rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sac-item-sub { display: block; font-size: 0.66rem; color: #64748b; }
.sac-item-type { font-size: 0.58rem; font-weight: 700; background: #f1f5f9; color: #64748b; padding: 1px 6px; border-radius: 99px; white-space: nowrap; }
  `]
})
export class SmartAutocompleteComponent implements OnDestroy, ControlValueAccessor {

  @Input() label = '';
  @Input() placeholder = 'Commencez à taper...';
  @Input() icon = 'search';
  @Input() required = false;
  @Input() types: string[] = []; // Filtrer par type : ['CLIENT', 'FOURNISSEUR']
  @Input() inputId = 'sac-' + Math.random().toString(36).slice(2, 7);

  @Output() itemSelected = new EventEmitter<ResultatRecherche>();

  valeur = '';
  isOpen = false;
  loading = false;
  suggestions: ResultatRecherche[] = [];
  selectedIdx = -1;

  private query$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private onChange = (_: string) => {};
  private onTouched = () => {};

  constructor(private utilsService: UtilsService) {
    this.query$.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.loading = false; this.suggestions = []; return []; }
        this.loading = true;
        return this.utilsService.autocomplete(q);
      }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.loading = false;
      this.suggestions = this.types.length > 0
        ? res.filter(r => this.types.includes(r.type))
        : res;
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  writeValue(val: string): void { this.valeur = val || ''; }
  registerOnChange(fn: (_: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onSaisie(val: string): void {
    this.onChange(val);
    this.query$.next(val);
    this.isOpen = true;
  }

  onFocus(): void { this.isOpen = true; }
  onBlur(): void { this.onTouched(); setTimeout(() => { this.isOpen = false; }, 180); }

  selectionner(item: ResultatRecherche): void {
    this.valeur = item.titre;
    this.onChange(item.titre);
    this.itemSelected.emit(item);
    this.isOpen = false;
    this.suggestions = [];
  }

  clear(): void {
    this.valeur = '';
    this.onChange('');
    this.suggestions = [];
    this.isOpen = false;
  }
}
