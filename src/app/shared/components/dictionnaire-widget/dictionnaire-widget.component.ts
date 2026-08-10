import {
  Component, Input, Output, EventEmitter, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UtilsService, ResultatCorrection } from '../../services/utils.service';

/**
 * Widget dictionnaire intelligent (N°4).
 * Bouton "Corriger / Améliorer" intégrable dans n'importe quel textarea.
 * Se connecte au DictionnaireService via OpenAI.
 *
 * Usage:
 *   <app-dictionnaire-widget
 *     [(ngModel)]="texte"
 *     label="Description"
 *     langue="fr"
 *     [rows]="4"
 *   ></app-dictionnaire-widget>
 */
@Component({
  selector: 'app-dictionnaire-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DictionnaireWidgetComponent),
    multi: true
  }],
  template: `
<div class="dw-wrapper">
  <div class="dw-label-row" *ngIf="label">
    <label class="dw-label">{{ label }}</label>
    <div class="dw-actions">
      <button type="button" class="dw-btn dw-btn-fix" [disabled]="loading || !texte" (click)="corriger()">
        <span class="material-symbols-outlined" [class.spin]="loading && mode==='correction'">
          {{ loading && mode==='correction' ? 'progress_activity' : 'spellcheck' }}
        </span>
        Corriger
      </button>
      <button type="button" class="dw-btn dw-btn-improve" [disabled]="loading || !texte" (click)="ameliorer()">
        <span class="material-symbols-outlined" [class.spin]="loading && mode==='amelioration'">
          {{ loading && mode==='amelioration' ? 'progress_activity' : 'auto_awesome' }}
        </span>
        Améliorer
      </button>
      <div class="dw-lang-select">
        <select [(ngModel)]="langue" class="dw-lang">
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>
      </div>
    </div>
  </div>

  <textarea
    class="dw-textarea"
    [rows]="rows"
    [placeholder]="placeholder"
    [(ngModel)]="texte"
    (ngModelChange)="onSaisie($event)"
    [id]="textareaId"
  ></textarea>

  <!-- Résultat de la correction -->
  <div class="dw-result" *ngIf="resultat">
    <div class="dw-result-header">
      <div class="dw-result-title">
        <span class="material-symbols-outlined">
          {{ resultat.erreursTrouvees.length ? 'warning' : 'check_circle' }}
        </span>
        {{ resultat.erreursTrouvees.length
          ? resultat.erreursTrouvees.length + ' correction(s) détectée(s)'
          : 'Texte impeccable' }}
      </div>
      <div class="dw-score" *ngIf="resultat.scoreQualite">
        Qualité : <strong>{{ resultat.scoreQualite }}/100</strong>
      </div>
    </div>

    <div class="dw-result-text" *ngIf="resultat.texteCorrected !== texte">
      <div class="dw-result-label">Texte corrigé :</div>
      <p>{{ resultat.texteCorrected }}</p>
    </div>

    <ul class="dw-errors" *ngIf="resultat.erreursTrouvees?.length">
      <li *ngFor="let err of resultat.erreursTrouvees">{{ err }}</li>
    </ul>

    <div class="dw-result-actions">
      <button type="button" class="dw-btn dw-btn-accept" (click)="accepter()" *ngIf="resultat.texteCorrected !== texte">
        <span class="material-symbols-outlined">check</span> Accepter
      </button>
      <button type="button" class="dw-btn dw-btn-discard" (click)="ignorer()">
        <span class="material-symbols-outlined">close</span> Ignorer
      </button>
    </div>
  </div>

  <!-- Suggestions de formulation -->
  <div class="dw-suggestions" *ngIf="suggestions.length > 0">
    <div class="dw-sugg-title">Suggestions de formulation :</div>
    <button
      type="button"
      class="dw-sugg-item"
      *ngFor="let s of suggestions"
      (click)="utiliserSuggestion(s)"
    >
      <span class="material-symbols-outlined">lightbulb</span>
      {{ s }}
    </button>
  </div>
</div>
  `,
  styles: [`
.dw-wrapper { display: flex; flex-direction: column; gap: 6px; font-family: 'Inter', sans-serif; }

.dw-label-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.dw-label { font-size: 0.75rem; font-weight: 700; color: #374151; }
.dw-actions { display: flex; align-items: center; gap: 6px; }

.dw-btn {
  display: flex; align-items: center; gap: 4px; border: none; cursor: pointer;
  border-radius: 7px; font-size: 0.7rem; font-weight: 600; padding: 4px 10px;
  transition: all 0.15s; font-family: 'Inter', sans-serif;
}
.dw-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dw-btn span { font-size: 14px; }
.dw-btn-fix      { background: #eff6ff; color: #1d4ed8; }
.dw-btn-fix:hover:not(:disabled)     { background: #dbeafe; }
.dw-btn-improve  { background: #f5f3ff; color: #7c3aed; }
.dw-btn-improve:hover:not(:disabled) { background: #ede9fe; }
.dw-btn-accept   { background: #dcfce7; color: #15803d; }
.dw-btn-accept:hover { background: #bbf7d0; }
.dw-btn-discard  { background: #f1f5f9; color: #64748b; }
.dw-btn-discard:hover { background: #e2e8f0; }

.dw-lang-select { display: flex; }
.dw-lang { border: 1px solid #e2e8f0; border-radius: 6px; padding: 3px 6px; font-size: 0.7rem; color: #374151; background: #fff; cursor: pointer; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.dw-textarea {
  width: 100%; resize: vertical; border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 10px 12px; font-size: 0.82rem; color: #1e293b; font-family: 'Inter', sans-serif;
  outline: none; transition: border-color 0.2s; line-height: 1.6; box-sizing: border-box;
}
.dw-textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }

.dw-result {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 12px 14px; animation: slideIn 0.2s ease;
}
@keyframes slideIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; } }
.dw-result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.dw-result-title { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: #0f172a; }
.dw-result-title span { font-size: 16px; color: #f97316; }
.dw-score { font-size: 0.72rem; color: #64748b; }
.dw-result-label { font-size: 0.68rem; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
.dw-result-text p { font-size: 0.78rem; color: #1e293b; line-height: 1.55; background: #fff; padding: 8px 10px; border-radius: 7px; border: 1px solid #e2e8f0; }
.dw-errors { list-style: none; padding: 0; margin: 6px 0; }
.dw-errors li { font-size: 0.72rem; color: #92400e; padding: 3px 0 3px 14px; position: relative; }
.dw-errors li::before { content: '✓'; position: absolute; left: 0; color: #f97316; }
.dw-result-actions { display: flex; gap: 6px; margin-top: 8px; }

.dw-suggestions { display: flex; flex-direction: column; gap: 4px; }
.dw-sugg-title { font-size: 0.68rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.dw-sugg-item {
  display: flex; align-items: center; gap: 6px; padding: 7px 10px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 0.76rem; color: #374151; cursor: pointer; text-align: left;
  transition: all 0.15s; font-family: 'Inter', sans-serif;
}
.dw-sugg-item:hover { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.dw-sugg-item span { font-size: 15px; color: #f97316; flex-shrink: 0; }
  `]
})
export class DictionnaireWidgetComponent implements ControlValueAccessor {

  @Input() label = '';
  @Input() placeholder = 'Saisissez votre texte ici...';
  @Input() langue = 'fr';
  @Input() rows = 4;
  @Input() textareaId = 'dw-' + Math.random().toString(36).slice(2, 7);
  @Output() texteChange = new EventEmitter<string>();

  texte = '';
  loading = false;
  mode = '';
  resultat: ResultatCorrection | null = null;
  suggestions: string[] = [];

  private onChange = (_: string) => {};
  private onTouched = () => {};

  constructor(private utilsService: UtilsService) {}

  writeValue(val: string): void { this.texte = val || ''; }
  registerOnChange(fn: (_: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onSaisie(val: string): void { this.onChange(val); this.texteChange.emit(val); }

  corriger(): void {
    if (!this.texte) return;
    this.loading = true; this.mode = 'correction'; this.resultat = null;
    this.utilsService.corrigerTexte(this.texte, this.langue, 'correction').subscribe(r => {
      this.loading = false; this.resultat = r;
    });
  }

  ameliorer(): void {
    if (!this.texte) return;
    this.loading = true; this.mode = 'amelioration'; this.resultat = null;
    this.utilsService.corrigerTexte(this.texte, this.langue, 'amelioration').subscribe(r => {
      this.loading = false; this.resultat = r;
    });
  }

  accepter(): void {
    if (this.resultat?.texteCorrected) {
      this.texte = this.resultat.texteCorrected;
      this.onChange(this.texte);
      this.texteChange.emit(this.texte);
    }
    this.resultat = null;
  }

  ignorer(): void { this.resultat = null; this.suggestions = []; }

  utiliserSuggestion(s: string): void {
    this.texte = s;
    this.onChange(s);
    this.texteChange.emit(s);
    this.suggestions = [];
  }
}
