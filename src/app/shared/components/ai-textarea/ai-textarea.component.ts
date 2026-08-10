import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';

/**
 * AiTextareaComponent
 * Un textarea enrichi avec le dictionnaire IA intégré directement :
 *  - Bouton "Corriger" : corrige les fautes d'orthographe
 *  - Bouton "Améliorer" : reformule le texte de façon professionnelle
 *  - Bouton "Suggérer" : génère une formulation à partir du contexte
 * Utilisable partout : [ngModel] ou formControlName
 *
 * Usage :
 *   <app-ai-textarea
 *     label="Description"
 *     placeholder="Décrivez le produit..."
 *     [rows]="4"
 *     formControlName="description"
 *   ></app-ai-textarea>
 */
@Component({
  selector: 'app-ai-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AiTextareaComponent),
    multi: true
  }],
  template: `
    <div class="ai-textarea-wrapper">

      <!-- Label + badge IA -->
      <div class="ai-label-row">
        <label class="ai-label">{{ label }}</label>
        <span class="ai-badge">
          <span class="ai-dot"></span>
          IA Intégrée
        </span>
      </div>

      <!-- Textarea -->
      <div class="ai-field-box" [class.ai-loading]="loading()">
        <textarea
          [rows]="rows"
          [placeholder]="placeholder"
          [(ngModel)]="innerValue"
          (ngModelChange)="onTextChange($event)"
          [disabled]="isDisabled"
          class="ai-textarea"
          #textareaRef
        ></textarea>

        <!-- Overlay spinner pendant traitement IA -->
        <div class="ai-processing-overlay" *ngIf="loading()">
          <span class="ai-spinner-icon material-symbols-outlined">autorenew</span>
          <span>{{ loadingMsg }}</span>
        </div>
      </div>

      <!-- Barre d'actions IA -->
      <div class="ai-toolbar">
        <div class="ai-toolbar-left">
          <button type="button" class="ai-btn ai-btn-fix"
            (click)="corriger()" [disabled]="loading() || !innerValue?.trim()">
            <span class="material-symbols-outlined">spellcheck</span>
            Corriger
          </button>
          <button type="button" class="ai-btn ai-btn-improve"
            (click)="ameliorer()" [disabled]="loading() || !innerValue?.trim()">
            <span class="material-symbols-outlined">auto_fix_high</span>
            Améliorer
          </button>
          <button type="button" class="ai-btn ai-btn-suggest"
            (click)="suggerer()" [disabled]="loading()">
            <span class="material-symbols-outlined">lightbulb</span>
            Suggérer
          </button>
        </div>
        <div class="ai-toolbar-right">
          <span class="ai-char-count" [class.ai-count-warn]="(innerValue?.length ?? 0) > (maxLength * 0.9)">
            {{ innerValue.length || 0 }}<span *ngIf="maxLength > 0"> / {{ maxLength }}</span>
          </span>
          <button type="button" class="ai-btn ai-btn-clear"
            *ngIf="(innerValue?.length ?? 0) > 0" (click)="vider()">
            <span class="material-symbols-outlined">clear</span>
          </button>
        </div>
      </div>

      <!-- Résultat IA avec diff avant/après -->
      <div class="ai-result-panel" *ngIf="iaResult">
        <div class="ai-result-header">
          <span class="material-symbols-outlined ai-result-icon">{{ iaResultIcon }}</span>
          <span class="ai-result-title">{{ iaResultTitle }}</span>
          <button type="button" class="ai-dismiss" (click)="iaResult = null">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="ai-result-body">{{ iaResult }}</div>
        <div class="ai-result-actions">
          <button type="button" class="ai-apply-btn" (click)="appliquerResultat()">
            <span class="material-symbols-outlined">check_circle</span>
            Appliquer ce texte
          </button>
          <button type="button" class="ai-dismiss-btn" (click)="iaResult = null">
            Ignorer
          </button>
        </div>
      </div>

      <!-- Erreur IA -->
      <div class="ai-error-panel" *ngIf="iaError">
        <span class="material-symbols-outlined">warning</span>
        {{ iaError }}
      </div>

    </div>
  `,
  styles: [`
    .ai-textarea-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .ai-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .ai-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #374151;
    }
    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1px solid #bbf7d0;
      color: #15803d;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 99px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .ai-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse-dot 1.4s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }

    .ai-field-box {
      position: relative;
      border-radius: 10px 10px 0 0;
    }
    .ai-textarea {
      width: 100%;
      border: 1.5px solid #e2e8f0;
      border-bottom: none;
      border-radius: 10px 10px 0 0;
      padding: 12px 14px;
      font-size: 0.83rem;
      font-family: 'Inter', sans-serif;
      line-height: 1.65;
      color: #1e293b;
      resize: vertical;
      outline: none;
      background: #fff;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .ai-textarea:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
    }
    .ai-textarea:disabled {
      background: #f8fafc;
      color: #94a3b8;
      cursor: not-allowed;
    }

    /* Overlay de traitement */
    .ai-processing-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(3px);
      border-radius: 10px 10px 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #7c3aed;
    }
    .ai-spinner-icon {
      font-size: 28px;
      color: #8b5cf6;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Barre d'outils */
    .ai-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f1f5f9;
      border: 1.5px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 10px 10px;
      padding: 6px 10px;
      gap: 6px;
    }
    .ai-toolbar-left { display: flex; gap: 5px; }
    .ai-toolbar-right { display: flex; align-items: center; gap: 6px; }

    .ai-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      border: none;
      font-size: 0.7rem;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .ai-btn .material-symbols-outlined { font-size: 14px; }
    .ai-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .ai-btn-fix {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .ai-btn-fix:hover:not(:disabled) { background: #fecaca; transform: translateY(-1px); }

    .ai-btn-improve {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .ai-btn-improve:hover:not(:disabled) { background: #bfdbfe; transform: translateY(-1px); }

    .ai-btn-suggest {
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }
    .ai-btn-suggest:hover:not(:disabled) { background: #ddd6fe; transform: translateY(-1px); }

    .ai-btn-clear {
      background: transparent;
      color: #94a3b8;
      border: 1px solid transparent;
      padding: 3px 6px;
    }
    .ai-btn-clear:hover { color: #ef4444; background: #fef2f2; border-color: #fecaca; }
    .ai-btn-clear .material-symbols-outlined { font-size: 14px; }

    .ai-char-count {
      font-size: 0.65rem;
      color: #94a3b8;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    .ai-count-warn { color: #f97316; }

    /* Panneau résultat */
    .ai-result-panel {
      margin-top: 8px;
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
      border: 1.5px solid #c4b5fd;
      border-radius: 10px;
      overflow: hidden;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .ai-result-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(139,92,246,0.1);
      border-bottom: 1px solid #ddd6fe;
    }
    .ai-result-icon {
      font-size: 16px;
      color: #7c3aed;
    }
    .ai-result-title {
      flex: 1;
      font-size: 0.72rem;
      font-weight: 800;
      color: #5b21b6;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .ai-dismiss {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      padding: 2px;
      border-radius: 4px;
    }
    .ai-dismiss:hover { color: #6b7280; background: rgba(0,0,0,0.05); }
    .ai-dismiss .material-symbols-outlined { font-size: 16px; }

    .ai-result-body {
      padding: 12px 14px;
      font-size: 0.8rem;
      color: #1e293b;
      line-height: 1.65;
      font-style: italic;
      white-space: pre-wrap;
    }
    .ai-result-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-top: 1px solid #ddd6fe;
    }
    .ai-apply-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      color: #fff;
      border: none;
      border-radius: 7px;
      padding: 5px 12px;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.12s, box-shadow 0.12s;
    }
    .ai-apply-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
    .ai-apply-btn .material-symbols-outlined { font-size: 14px; }

    .ai-dismiss-btn {
      background: transparent;
      border: 1px solid #ddd6fe;
      color: #7c3aed;
      border-radius: 7px;
      padding: 5px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
    }
    .ai-dismiss-btn:hover { background: #ede9fe; }

    /* Panneau erreur */
    .ai-error-panel {
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 0.75rem;
      color: #b91c1c;
      font-weight: 500;
    }
    .ai-error-panel .material-symbols-outlined { font-size: 15px; color: #ef4444; }
  `]
})
export class AiTextareaComponent implements ControlValueAccessor {
  @Input() label = 'Description';
  @Input() placeholder = 'Saisissez votre texte ici...';
  @Input() rows = 4;
  @Input() maxLength = 0;
  @Input() contexte = ''; // ex: "description de produit ERP", "notes de devis"

  @Output() textChange = new EventEmitter<string>();

  innerValue = '';
  isDisabled = false;
  loading = signal(false);
  loadingMsg = 'Traitement en cours...';
  iaResult: string | null = null;
  iaResultTitle = '';
  iaResultIcon = 'auto_fix_high';
  iaError: string | null = null;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private utilsService: UtilsService) {}

  // ─── ControlValueAccessor ───────────────────────────────
  writeValue(val: string): void { this.innerValue = val || ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled = disabled; }

  onTextChange(val: string): void {
    this.onChange(val);
    this.textChange.emit(val);
    this.onTouched();
    this.iaResult = null;
    this.iaError = null;
  }

  // ─── Bouton Corriger ────────────────────────────────────
  corriger(): void {
    if (!this.innerValue?.trim()) return;
    this.loading.set(true);
    this.loadingMsg = 'Correction en cours...';
    this.iaResult = null;
    this.iaError = null;
    this.iaResultTitle = 'Texte corrigé';
    this.iaResultIcon = 'spellcheck';

    this.utilsService.corrigerTexte(this.innerValue, 'fr', 'correction').subscribe({
      next: (res: any) => {
        this.iaResult = res?.texteCorrected || res?.texte_corrige || res?.texte || this.innerValue;
        this.loading.set(false);
      },
      error: () => {
        this.iaError = 'Service IA indisponible. Vérifiez la clé OpenAI dans application.properties.';
        this.loading.set(false);
      }
    });
  }

  // ─── Bouton Améliorer ───────────────────────────────────
  ameliorer(): void {
    if (!this.innerValue?.trim()) return;
    this.loading.set(true);
    this.loadingMsg = 'Reformulation en cours...';
    this.iaResult = null;
    this.iaError = null;
    this.iaResultTitle = 'Texte amélioré';
    this.iaResultIcon = 'auto_fix_high';

    this.utilsService.corrigerTexte(this.innerValue, 'fr', 'amelioration').subscribe({
      next: (res: any) => {
        this.iaResult = res?.texteCorrected || res?.texte_corrige || res?.texte || this.innerValue;
        this.loading.set(false);
      },
      error: () => {
        this.iaError = 'Service IA indisponible. Vérifiez la clé OpenAI dans application.properties.';
        this.loading.set(false);
      }
    });
  }

  // ─── Bouton Suggérer ────────────────────────────────────
  suggerer(): void {
    this.loading.set(true);
    this.loadingMsg = 'Génération de suggestion...';
    this.iaResult = null;
    this.iaError = null;
    this.iaResultTitle = 'Suggestion IA';
    this.iaResultIcon = 'lightbulb';

    const prompt = this.contexte
      ? `Génère une description professionnelle pour un(e) ${this.contexte} dans un logiciel ERP.`
      : `Génère un texte professionnel court et clair pour ce champ de formulaire ERP.`;

    this.utilsService.suggererTexte(prompt).subscribe({
      next: (res: any) => {
        this.iaResult = res?.suggestion || res?.texte || 'Aucune suggestion générée.';
        this.loading.set(false);
      },
      error: () => {
        this.iaError = 'Service IA indisponible. Vérifiez la clé OpenAI dans application.properties.';
        this.loading.set(false);
      }
    });
  }

  // ─── Appliquer le résultat ──────────────────────────────
  appliquerResultat(): void {
    if (!this.iaResult) return;
    this.innerValue = this.iaResult;
    this.onChange(this.innerValue);
    this.textChange.emit(this.innerValue);
    this.iaResult = null;
  }

  vider(): void {
    this.innerValue = '';
    this.onChange('');
    this.iaResult = null;
    this.iaError = null;
  }
}
