import {
  Component, Input, Output, EventEmitter, OnInit, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';

export interface DateValidation {
  valide: boolean;
  dateNormalisee?: string;
  affichageFr?: string;
  jourSemaine?: string;
  estPasse?: boolean;
  estFutur?: boolean;
  estAujourdHui?: boolean;
  erreur?: string;
}

/**
 * Composant calendrier intelligent et réutilisable.
 * - Validation automatique du format
 * - Détection des dates passées/futures
 * - Mini calendrier visuel
 * - Compatible Angular Reactive Forms (ControlValueAccessor)
 *
 * Usage:
 *   <app-smart-datepicker
 *     [(ngModel)]="maDate"
 *     label="Date de facture"
 *     [required]="true"
 *   ></app-smart-datepicker>
 */
@Component({
  selector: 'app-smart-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SmartDatepickerComponent),
    multi: true
  }],
  template: `
<div class="sdp-wrapper" [class.sdp-error]="validation && !validation.valide">
  <!-- Label -->
  <label class="sdp-label" *ngIf="label">
    {{ label }}
    <span class="sdp-required" *ngIf="required">*</span>
  </label>

  <!-- Champ de saisie -->
  <div class="sdp-input-wrap" [class.sdp-focused]="calendarOpen">
    <span class="material-symbols-outlined sdp-icon">calendar_month</span>
    <input
      type="text"
      class="sdp-input"
      [placeholder]="placeholder"
      [(ngModel)]="valeurAffichee"
      (ngModelChange)="onSaisie($event)"
      (focus)="calendarOpen = true"
      (blur)="onBlur()"
      [id]="inputId"
      autocomplete="off"
    />
    <span class="sdp-badge sdp-ok"  *ngIf="validation?.valide">
      <span class="material-symbols-outlined">check_circle</span>
    </span>
    <span class="sdp-badge sdp-err" *ngIf="validation && !validation.valide && valeurAffichee">
      <span class="material-symbols-outlined">error</span>
    </span>
    <button class="sdp-today-btn" type="button" (click)="selectionnerAujourdhui()" title="Aujourd'hui">
      <span class="material-symbols-outlined">today</span>
    </button>
  </div>

  <!-- Infos de validation -->
  <div class="sdp-info" *ngIf="validation?.valide">
    <span class="material-symbols-outlined">info</span>
    {{ validation!.jourSemaine }}
    <span class="sdp-tag sdp-past"   *ngIf="validation!.estPasse">Passé</span>
    <span class="sdp-tag sdp-today"  *ngIf="validation!.estAujourdHui">Aujourd'hui</span>
    <span class="sdp-tag sdp-future" *ngIf="validation!.estFutur">Futur</span>
  </div>
  <div class="sdp-error-msg" *ngIf="validation && !validation.valide && valeurAffichee">
    <span class="material-symbols-outlined">warning</span>
    {{ validation.erreur || 'Format invalide — attendu : ' + placeholder }}
  </div>

  <!-- Mini calendrier popup -->
  <div class="sdp-calendar" *ngIf="calendarOpen">
    <div class="sdp-cal-header">
      <button type="button" (click)="moisPrecedent()">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <span>{{ moisAffiche }} {{ anneeAffichee }}</span>
      <button type="button" (click)="moisSuivant()">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
    <div class="sdp-cal-days">
      <div class="sdp-day-head" *ngFor="let j of joursEntete">{{ j }}</div>
      <div class="sdp-day-pad" *ngFor="let p of padding"></div>
      <button
        type="button"
        class="sdp-day"
        *ngFor="let d of joursDuMois"
        [class.sdp-day-today]="estAujourdHui(d)"
        [class.sdp-day-sel]="estSelectionne(d)"
        [class.sdp-day-disabled]="estDesactive(d)"
        (click)="selectionnerJour(d)"
      >{{ d }}</button>
    </div>
    <div class="sdp-cal-footer">
      <button type="button" class="sdp-btn-aj" (click)="selectionnerAujourdhui()">Aujourd'hui</button>
      <button type="button" class="sdp-btn-cl" (click)="calendarOpen = false">Fermer</button>
    </div>
  </div>
</div>
  `,
  styles: [`
.sdp-wrapper { position: relative; font-family: 'Inter', sans-serif; }
.sdp-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; margin-bottom: 5px; }
.sdp-required { color: #ef4444; margin-left: 2px; }

.sdp-input-wrap {
  display: flex; align-items: center; gap: 6px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 8px 10px; background: #fff; transition: all 0.2s;
}
.sdp-focused { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
.sdp-error .sdp-input-wrap { border-color: #ef4444; }

.sdp-icon { font-size: 18px; color: #94a3b8; flex-shrink: 0; }
.sdp-input { flex: 1; border: none; outline: none; font-size: 0.85rem; color: #1e293b; background: transparent; min-width: 0; }
.sdp-input::placeholder { color: #cbd5e1; }

.sdp-badge { flex-shrink: 0; display: flex; }
.sdp-ok  span { color: #22c55e; font-size: 18px; }
.sdp-err span { color: #ef4444; font-size: 18px; }

.sdp-today-btn { background: none; border: none; cursor: pointer; padding: 2px; color: #94a3b8; display: flex; }
.sdp-today-btn:hover { color: #f97316; }
.sdp-today-btn span { font-size: 18px; }

.sdp-info { display: flex; align-items: center; gap: 5px; margin-top: 4px; font-size: 0.7rem; color: #64748b; }
.sdp-info span { font-size: 13px; }
.sdp-tag { padding: 1px 7px; border-radius: 99px; font-size: 0.6rem; font-weight: 700; }
.sdp-past   { background: #fee2e2; color: #b91c1c; }
.sdp-today  { background: #dcfce7; color: #15803d; }
.sdp-future { background: #dbeafe; color: #1d4ed8; }
.sdp-error-msg { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 0.7rem; color: #ef4444; }
.sdp-error-msg span { font-size: 14px; }

.sdp-calendar {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 9999;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.14); padding: 12px; min-width: 240px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.sdp-cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sdp-cal-header button { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; color: #374151; display: flex; }
.sdp-cal-header button:hover { background: #f1f5f9; color: #f97316; }
.sdp-cal-header span { font-size: 0.82rem; font-weight: 700; color: #0f172a; }
.sdp-cal-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.sdp-day-head { text-align: center; font-size: 0.6rem; font-weight: 700; color: #94a3b8; padding: 4px 0; }
.sdp-day-pad { aspect-ratio: 1; }
.sdp-day {
  aspect-ratio: 1; background: none; border: none; cursor: pointer; border-radius: 6px;
  font-size: 0.75rem; color: #374151; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.sdp-day:hover { background: #fff7ed; color: #f97316; }
.sdp-day-today { background: #f1f5f9; font-weight: 700; color: #0f172a; }
.sdp-day-sel { background: #f97316 !important; color: #fff !important; font-weight: 700; }
.sdp-day-disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
.sdp-cal-footer { display: flex; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
.sdp-btn-aj, .sdp-btn-cl { flex: 1; padding: 6px; border-radius: 7px; font-size: 0.72rem; font-weight: 600; cursor: pointer; border: none; }
.sdp-btn-aj { background: #f97316; color: #fff; }
.sdp-btn-aj:hover { background: #ea580c; }
.sdp-btn-cl { background: #f1f5f9; color: #64748b; }
.sdp-btn-cl:hover { background: #e2e8f0; }
  `]
})
export class SmartDatepickerComponent implements OnInit, ControlValueAccessor {

  @Input() label = '';
  @Input() placeholder = 'dd/MM/yyyy';
  @Input() required = false;
  @Input() minDate?: string;
  @Input() maxDate?: string;
  @Input() inputId = 'sdp-' + Math.random().toString(36).slice(2, 7);

  @Output() dateChange = new EventEmitter<string>();
  @Output() validationChange = new EventEmitter<DateValidation | undefined>();

  valeurAffichee = '';
  calendarOpen = false;
  validation: DateValidation | null = null;

  joursEntete = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
  moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  joursDuMois: number[] = [];
  padding: null[] = [];

  get moisAffiche() { return this.moisNoms[this.currentMonth]; }
  get anneeAffichee() { return this.currentYear; }

  private onChange = (_: string) => {};
  private onTouched = () => {};

  constructor(private utilsService: UtilsService) {}

  ngOnInit(): void { this.genererCalendrier(); }

  writeValue(val: string): void { this.valeurAffichee = val || ''; }
  registerOnChange(fn: (_: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onSaisie(valeur: string): void {
    this.valeurAffichee = valeur;
    if (valeur.length === 10) {
      this.validerDate(valeur);
    } else {
      this.validation = null;
    }
  }

  onBlur(): void {
    this.onTouched();
    setTimeout(() => { this.calendarOpen = false; }, 150);
    if (this.valeurAffichee) this.validerDate(this.valeurAffichee);
  }

  private validerDate(valeur: string): void {
    const ok = this.utilsService.validerDateLocal(valeur);
    if (ok) {
      const parts = valeur.split('/');
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      const auj = new Date(); auj.setHours(0, 0, 0, 0);
      const iso = d.toISOString().split('T')[0];
      this.validation = {
        valide: true,
        affichageFr: valeur,
        dateNormalisee: iso,
        jourSemaine: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
        estPasse: d < auj,
        estFutur: d > auj,
        estAujourdHui: d.getTime() === auj.getTime()
      };
      this.onChange(iso);
      this.dateChange.emit(iso);
    } else {
      this.validation = { valide: false, erreur: 'Format invalide — attendu : ' + this.placeholder };
    }
    this.validationChange.emit(this.validation ?? undefined);
  }

  selectionnerAujourdhui(): void {
    const auj = new Date();
    const j = String(auj.getDate()).padStart(2, '0');
    const m = String(auj.getMonth() + 1).padStart(2, '0');
    const a = auj.getFullYear();
    this.valeurAffichee = `${j}/${m}/${a}`;
    this.currentMonth = auj.getMonth();
    this.currentYear = auj.getFullYear();
    this.genererCalendrier();
    this.validerDate(this.valeurAffichee);
    this.calendarOpen = false;
  }

  selectionnerJour(jour: number): void {
    const j = String(jour).padStart(2, '0');
    const m = String(this.currentMonth + 1).padStart(2, '0');
    this.valeurAffichee = `${j}/${m}/${this.currentYear}`;
    this.validerDate(this.valeurAffichee);
    this.calendarOpen = false;
  }

  moisPrecedent(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.genererCalendrier();
  }

  moisSuivant(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.genererCalendrier();
  }

  genererCalendrier(): void {
    const premier = new Date(this.currentYear, this.currentMonth, 1);
    const jourSemainePremier = (premier.getDay() + 6) % 7;
    const nbJours = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    this.padding = Array(jourSemainePremier).fill(null);
    this.joursDuMois = Array.from({ length: nbJours }, (_, i) => i + 1);
  }

  estAujourdHui(jour: number): boolean {
    const auj = new Date();
    return jour === auj.getDate() && this.currentMonth === auj.getMonth() && this.currentYear === auj.getFullYear();
  }

  estSelectionne(jour: number): boolean {
    if (!this.validation?.valide || !this.validation.dateNormalisee) return false;
    const [a, m, j] = this.validation.dateNormalisee.split('-').map(Number);
    return jour === j && this.currentMonth === m - 1 && this.currentYear === a;
  }

  estDesactive(jour: number): boolean {
    const d = new Date(this.currentYear, this.currentMonth, jour);
    if (this.minDate && d < new Date(this.minDate)) return true;
    if (this.maxDate && d > new Date(this.maxDate)) return true;
    return false;
  }
}
