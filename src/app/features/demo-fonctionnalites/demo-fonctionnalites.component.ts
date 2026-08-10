import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NombreLettresPipe } from '../../shared/pipes/nombre-lettres.pipe';
import { SmartDatepickerComponent } from '../../shared/components/smart-datepicker/smart-datepicker.component';
import { SmartAutocompleteComponent } from '../../shared/components/smart-autocomplete/smart-autocomplete.component';
import { DictionnaireWidgetComponent } from '../../shared/components/dictionnaire-widget/dictionnaire-widget.component';
import { UtilsService, ResultatRecherche } from '../../shared/services/utils.service';
import { FormValidatorService } from '../../shared/services/form-validator.service';

@Component({
  selector: 'app-demo-fonctionnalites',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NombreLettresPipe,
    SmartDatepickerComponent,
    SmartAutocompleteComponent,
    DictionnaireWidgetComponent
  ],
  template: `
<div class="demo-page">

  <!-- ── HEADER ─────────────────────────────────────────────────────── -->
  <div class="demo-header">
    <div class="demo-header-left">
      <span class="material-symbols-outlined">science</span>
      <div>
        <h1>Page de Démonstration</h1>
        <p>Testez toutes les nouvelles fonctionnalités transversales</p>
      </div>
    </div>
    <div class="demo-chips">
      <span class="chip chip-green">7 fonctionnalités</span>
      <span class="chip chip-blue">Backend + Frontend</span>
    </div>
  </div>

  <!-- ── NAVIGATION FONCTIONNALITÉS ─────────────────────────────────── -->
  <div class="demo-nav">
    <button *ngFor="let s of sections" class="demo-nav-btn"
      [class.active]="sectionActive === s.id" (click)="sectionActive = s.id">
      <span class="material-symbols-outlined">{{ s.icone }}</span>
      {{ s.label }}
    </button>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════ -->
  <!-- N°7 — MONTANTS EN LETTRES                                         -->
  <!-- ══════════════════════════════════════════════════════════════════ -->
  <div class="demo-section" *ngIf="sectionActive === 'lettres'">
    <div class="section-title">
      <span class="material-symbols-outlined">format_list_numbered</span>
      N°7 — Conversion Montants en Lettres
    </div>

    <div class="demo-card">
      <div class="form-row">
        <div class="form-group">
          <label>Montant</label>
          <input type="number" [(ngModel)]="montant" step="0.001" placeholder="ex: 1500.750" />
        </div>
        <div class="form-group">
          <label>Devise</label>
          <select [(ngModel)]="devise">
            <option value="TND">TND — Dinar Tunisien</option>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Dollar</option>
            <option value="MAD">MAD — Dirham Marocain</option>
          </select>
        </div>
        <div class="form-group">
          <label>Langue</label>
          <select [(ngModel)]="langueLettres">
            <option value="fr">Français</option>
            <option value="ar">Arabe</option>
            <option value="en">Anglais</option>
          </select>
        </div>
      </div>

      <div class="result-box" *ngIf="montant">
        <div class="result-label">Résultat du pipe Angular :</div>
        <div class="result-value lettres-fr" *ngIf="langueLettres !== 'ar'">
          {{ montant | nombreLettres:devise:langueLettres }}
        </div>
        <div class="result-value lettres-ar" *ngIf="langueLettres === 'ar'" dir="rtl">
          {{ montant | nombreLettres:devise:langueLettres }}
        </div>
      </div>

      <!-- Calcul HT + TVA + TTC -->
      <div class="tva-demo" *ngIf="montant">
        <div class="tva-title">
          <span class="material-symbols-outlined">calculate</span>
          Calcul HT + TVA + TTC
        </div>
        <div class="tva-row">
          <span>TVA :</span>
          <select [(ngModel)]="tauxTva" style="padding:4px 8px;border-radius:6px;border:1px solid #e2e8f0;">
            <option [value]="7">7%</option>
            <option [value]="13">13%</option>
            <option [value]="19" selected>19%</option>
          </select>
        </div>
        <div class="tva-grid">
          <div class="tva-item">
            <span class="tva-label">HT</span>
            <span class="tva-amount">{{ montant | number:'1.3-3' }}</span>
            <span class="tva-lettres" *ngIf="langueLettres !== 'ar'">{{ montant | nombreLettres:devise:langueLettres }}</span>
            <span class="tva-lettres" dir="rtl" *ngIf="langueLettres === 'ar'">{{ montant | nombreLettres:devise:langueLettres }}</span>
          </div>
          <div class="tva-item">
            <span class="tva-label">TVA ({{ tauxTva }}%)</span>
            <span class="tva-amount">{{ montant * tauxTva / 100 | number:'1.3-3' }}</span>
            <span class="tva-lettres" *ngIf="langueLettres !== 'ar'">{{ montant * tauxTva / 100 | nombreLettres:devise:langueLettres }}</span>
            <span class="tva-lettres" dir="rtl" *ngIf="langueLettres === 'ar'">{{ montant * tauxTva / 100 | nombreLettres:devise:langueLettres }}</span>
          </div>
          <div class="tva-item tva-ttc">
            <span class="tva-label">TTC</span>
            <span class="tva-amount">{{ montant * (1 + tauxTva / 100) | number:'1.3-3' }}</span>
            <span class="tva-lettres" *ngIf="langueLettres !== 'ar'">{{ montant * (1 + tauxTva / 100) | nombreLettres:devise:langueLettres }}</span>
            <span class="tva-lettres" dir="rtl" *ngIf="langueLettres === 'ar'">{{ montant * (1 + tauxTva / 100) | nombreLettres:devise:langueLettres }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════ -->
  <!-- N°2 — RECHERCHE GLOBALE                                           -->
  <!-- ══════════════════════════════════════════════════════════════════ -->
  <div class="demo-section" *ngIf="sectionActive === 'search'">
    <div class="section-title">
      <span class="material-symbols-outlined">search</span>
      N°2 — Moteur de Recherche Global
    </div>
    <div class="demo-card">
      <div class="info-box">
        <span class="material-symbols-outlined">tips_and_updates</span>
        <div>
          <strong>La barre de recherche est dans le header en haut de page.</strong><br>
          Appuyez sur <kbd>Ctrl+K</kbd> pour l'activer depuis n'importe quelle page,
          ou cliquez directement sur la barre de recherche.
        </div>
      </div>
      <div class="steps-list">
        <div class="step"><span class="step-n">1</span> Appuyez sur <kbd>Ctrl+K</kbd></div>
        <div class="step"><span class="step-n">2</span> Tapez un nom de client, email ou référence produit</div>
        <div class="step"><span class="step-n">3</span> Naviguez avec les flèches ↑↓, validez avec Entrée</div>
        <div class="step"><span class="step-n">4</span> Cliquez sur un résultat pour aller au module</div>
        <div class="step"><span class="step-n">5</span> Cliquez "Voir tous" pour aller à la Recherche Avancée</div>
      </div>

      <!-- Test auto-complétion N°1 -->
      <div class="sub-title">N°1 — Auto-complétion intelligente</div>
      <app-smart-autocomplete
        label="Chercher un client ou fournisseur"
        placeholder="Tapez un nom, email, téléphone..."
        icon="person_search"
        [types]="['CLIENT', 'FOURNISSEUR']"
        (itemSelected)="onClientSelectionne($event)"
      ></app-smart-autocomplete>

      <div class="result-box" *ngIf="clientSelectionne">
        <div class="result-label">Entité sélectionnée :</div>
        <div class="selected-item">
          <span class="material-symbols-outlined">{{ clientSelectionne.icone }}</span>
          <div>
            <strong>{{ clientSelectionne.titre }}</strong>
            <span>{{ clientSelectionne.sousTitre }}</span>
            <span class="badge">{{ clientSelectionne.type }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════ -->
  <!-- N°5 — CALENDRIER INTELLIGENT                                      -->
  <!-- ══════════════════════════════════════════════════════════════════ -->
  <div class="demo-section" *ngIf="sectionActive === 'date'">
    <div class="section-title">
      <span class="material-symbols-outlined">calendar_month</span>
      N°5 — Calendrier Intelligent
    </div>
    <div class="demo-card">
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <app-smart-datepicker
            label="Date de facture"
            placeholder="dd/MM/yyyy"
            [required]="true"
            [(ngModel)]="dateFacture"
            (dateChange)="onDateChange('facture', $event)"
            (validationChange)="onDateValidation($event)"
          ></app-smart-datepicker>
        </div>
        <div class="form-group" style="flex:1">
          <app-smart-datepicker
            label="Date d'échéance"
            placeholder="dd/MM/yyyy"
            [(ngModel)]="dateEcheance"
            (dateChange)="onDateChange('echeance', $event)"
          ></app-smart-datepicker>
        </div>
        <div class="form-group" style="flex:1">
          <app-smart-datepicker
            label="Date de livraison"
            placeholder="dd/MM/yyyy"
            [(ngModel)]="dateLivraison"
          ></app-smart-datepicker>
        </div>
      </div>

      <div class="result-box" *ngIf="dateFacture">
        <div class="result-label">Valeurs ISO (format BD) :</div>
        <div class="date-values">
          <span *ngIf="dateFacture"><strong>Facture :</strong> {{ dateFacture }}</span>
          <span *ngIf="dateEcheance"><strong>Échéance :</strong> {{ dateEcheance }}</span>
          <span *ngIf="dateLivraison"><strong>Livraison :</strong> {{ dateLivraison }}</span>
        </div>
      </div>

      <div class="info-box info-tip">
        <span class="material-symbols-outlined">info</span>
        <div>
          Tapez directement <strong>09/07/2026</strong> ou cliquez l'icône 📅 pour le mini-calendrier.
          Le bouton <strong>"Aujourd'hui"</strong> sélectionne la date du jour automatiquement.
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════ -->
  <!-- N°6 — VALIDATION FORMULAIRES                                      -->
  <!-- ══════════════════════════════════════════════════════════════════ -->
  <div class="demo-section" *ngIf="sectionActive === 'validation'">
    <div class="section-title">
      <span class="material-symbols-outlined">fact_check</span>
      N°6 — Contrôles Automatiques des Formulaires
    </div>
    <div class="demo-card">
      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <div class="input-valid-wrap">
            <input type="email" [(ngModel)]="testEmail"
              [class.input-ok]="testEmail && emailValide(testEmail)"
              [class.input-err]="testEmail && !emailValide(testEmail)"
              placeholder="ex: contact@societe.tn" />
            <span class="material-symbols-outlined v-icon ok" *ngIf="testEmail && emailValide(testEmail)">check_circle</span>
            <span class="material-symbols-outlined v-icon err" *ngIf="testEmail && !emailValide(testEmail)">cancel</span>
          </div>
          <div class="v-msg err" *ngIf="testEmail && !emailValide(testEmail)">Format email invalide</div>
        </div>

        <div class="form-group">
          <label>Téléphone</label>
          <div class="input-valid-wrap">
            <input type="tel" [(ngModel)]="testTel"
              [class.input-ok]="testTel && telValide(testTel)"
              [class.input-err]="testTel && !telValide(testTel)"
              placeholder="ex: +21622123456" />
            <span class="material-symbols-outlined v-icon ok" *ngIf="testTel && telValide(testTel)">check_circle</span>
            <span class="material-symbols-outlined v-icon err" *ngIf="testTel && !telValide(testTel)">cancel</span>
          </div>
        </div>

        <div class="form-group">
          <label>Matricule fiscal</label>
          <div class="input-valid-wrap">
            <input type="text" [(ngModel)]="testMatricule"
              [class.input-ok]="testMatricule && matriculeValide(testMatricule)"
              [class.input-err]="testMatricule && !matriculeValide(testMatricule)"
              placeholder="ex: 1234567ABC" />
            <span class="material-symbols-outlined v-icon ok" *ngIf="testMatricule && matriculeValide(testMatricule)">check_circle</span>
            <span class="material-symbols-outlined v-icon err" *ngIf="testMatricule && !matriculeValide(testMatricule)">cancel</span>
          </div>
        </div>
      </div>

      <!-- Contrôle cohérence facture -->
      <div class="sub-title">Contrôle de cohérence — Facture</div>
      <div class="form-row">
        <div class="form-group">
          <label>Montant HT</label>
          <input type="number" [(ngModel)]="factHt" step="0.001" placeholder="ex: 1000.000" />
        </div>
        <div class="form-group">
          <label>TVA (%)</label>
          <input type="number" [(ngModel)]="factTva" placeholder="ex: 19" />
        </div>
        <div class="form-group">
          <label>Montant TTC</label>
          <input type="number" [(ngModel)]="factTtc" step="0.001" placeholder="ex: 1190.000" />
        </div>
      </div>
      <button class="btn-check" (click)="verifierFacture()">
        <span class="material-symbols-outlined">verified</span>
        Vérifier la cohérence
      </button>

      <div class="check-result ok" *ngIf="checkResult && checkResult.valide">
        <span class="material-symbols-outlined">check_circle</span>
        Facture cohérente — tous les montants sont corrects
      </div>
      <div class="check-result err" *ngIf="checkResult && !checkResult.valide">
        <span class="material-symbols-outlined">error</span>
        <div>
          <strong>{{ checkResult.erreurs.length }} erreur(s) détectée(s) :</strong>
          <ul><li *ngFor="let e of checkResult.erreurs">{{ e }}</li></ul>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════ -->
  <!-- N°4 — DICTIONNAIRE INTELLIGENT                                    -->
  <!-- ══════════════════════════════════════════════════════════════════ -->
  <div class="demo-section" *ngIf="sectionActive === 'dict'">
    <div class="section-title">
      <span class="material-symbols-outlined">auto_awesome</span>
      N°4 — Dictionnaire Intelligent (IA)
    </div>
    <div class="demo-card">
      <div class="info-box info-tip">
        <span class="material-symbols-outlined">tips_and_updates</span>
        <div>
          Cliquez <strong>"Corriger"</strong> pour corriger les fautes d'orthographe,
          ou <strong>"Améliorer"</strong> pour rendre le texte plus professionnel.
          Nécessite une connexion internet (OpenAI).
        </div>
      </div>

      <app-dictionnaire-widget
        label="Description du document / Objet de la facture"
        [rows]="5"
        langue="fr"
        placeholder="Saisissez votre texte ici... (ex: 'je vodrais commander des produis pour la livraison')"
        [(ngModel)]="texteDict"
      ></app-dictionnaire-widget>

      <div class="result-box" *ngIf="texteDict" style="margin-top:12px">
        <div class="result-label">Texte actuel :</div>
        <p style="font-size:0.82rem;color:#374151;line-height:1.6">{{ texteDict }}</p>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.demo-page { padding: 24px; font-family: 'Inter', sans-serif; max-width: 1100px; margin: 0 auto; }

/* Header */
.demo-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.demo-header-left { display: flex; align-items: center; gap: 16px; }
.demo-header-left span.material-symbols-outlined { font-size: 2.5rem; color: #f97316; }
h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
.demo-header-left p { font-size: 0.8rem; color: #64748b; margin: 3px 0 0; }
.demo-chips { display: flex; gap: 6px; }
.chip { padding: 4px 12px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
.chip-green { background: #dcfce7; color: #15803d; }
.chip-blue  { background: #dbeafe; color: #1d4ed8; }

/* Navigation */
.demo-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.demo-nav-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff;
  font-size: 0.75rem; font-weight: 600; color: #64748b; cursor: pointer;
  transition: all 0.15s; font-family: 'Inter', sans-serif;
}
.demo-nav-btn span { font-size: 16px; }
.demo-nav-btn:hover { border-color: #f97316; color: #f97316; }
.demo-nav-btn.active { border-color: #f97316; background: #fff7ed; color: #c2410c; }

/* Section */
.section-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 1rem; font-weight: 800; color: #0f172a;
  margin-bottom: 16px;
}
.section-title span { color: #f97316; font-size: 22px; }
.sub-title { font-size: 0.8rem; font-weight: 700; color: #374151; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }

/* Card */
.demo-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; }

/* Forms */
.form-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
.form-group { display: flex; flex-direction: column; gap: 5px; min-width: 200px; flex: 1; }
label { font-size: 0.75rem; font-weight: 700; color: #374151; }
input, select {
  border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 12px;
  font-size: 0.85rem; color: #1e293b; outline: none; font-family: 'Inter', sans-serif;
  transition: border-color 0.2s;
}
input:focus, select:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
.input-ok { border-color: #22c55e !important; }
.input-err { border-color: #ef4444 !important; }

/* Input avec icône de validation */
.input-valid-wrap { position: relative; display: flex; align-items: center; }
.input-valid-wrap input { width: 100%; padding-right: 36px; }
.v-icon { position: absolute; right: 10px; font-size: 18px; }
.v-icon.ok { color: #22c55e; }
.v-icon.err { color: #ef4444; }
.v-msg { font-size: 0.68rem; margin-top: 2px; }
.v-msg.err { color: #ef4444; }

/* Result box */
.result-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-top: 16px; }
.result-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 8px; }
.result-value { font-size: 0.92rem; font-weight: 600; color: #0f172a; line-height: 1.6; }
.lettres-fr { font-style: italic; color: #0f172a; }
.lettres-ar { font-family: 'Amiri', serif; font-size: 1.05rem; color: #0f172a; text-align: right; }

/* TVA demo */
.tva-demo { margin-top: 20px; background: #f8fafc; border-radius: 12px; padding: 16px; }
.tva-title { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; color: #374151; margin-bottom: 12px; }
.tva-title span { font-size: 18px; color: #f97316; }
.tva-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.8rem; color: #374151; }
.tva-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.tva-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.tva-ttc { border-color: #f97316; background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.tva-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; }
.tva-amount { font-size: 1rem; font-weight: 800; color: #0f172a; }
.tva-lettres { font-size: 0.68rem; color: #64748b; font-style: italic; line-height: 1.4; }

/* Selected item */
.selected-item { display: flex; align-items: center; gap: 10px; }
.selected-item .material-symbols-outlined { font-size: 28px; color: #f97316; }
.selected-item strong { display: block; font-size: 0.85rem; color: #0f172a; }
.selected-item span { font-size: 0.72rem; color: #64748b; margin-right: 6px; }
.badge { background: #f1f5f9; color: #64748b; padding: 1px 7px; border-radius: 99px; font-size: 0.62rem; font-weight: 700; }

/* Date values */
.date-values { display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: #374151; }
.date-values span { display: flex; gap: 8px; }
.date-values strong { color: #64748b; min-width: 80px; }

/* Info box */
.info-box {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; margin-bottom: 16px;
  font-size: 0.78rem; color: #374151; line-height: 1.6;
}
.info-box span { font-size: 20px; color: #22c55e; flex-shrink: 0; margin-top: 1px; }
.info-tip { background: #fffbeb; border-color: #fde68a; }
.info-tip span { color: #f59e0b; }

/* Steps */
.steps-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.step { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; color: #374151; }
.step-n { min-width: 22px; height: 22px; background: #f97316; color: #fff; border-radius: 50%; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
kbd { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 6px; font-size: 0.72rem; font-family: monospace; }

/* Button */
.btn-check {
  display: flex; align-items: center; gap: 6px; padding: 9px 18px;
  background: #0f172a; color: #fff; border: none; border-radius: 10px;
  font-size: 0.78rem; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif;
  transition: all 0.15s; margin-top: 12px;
}
.btn-check:hover { background: #1e293b; }
.btn-check span { font-size: 16px; }

/* Check result */
.check-result { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 10px; margin-top: 12px; font-size: 0.8rem; }
.check-result span.material-symbols-outlined { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.check-result.ok { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.check-result.ok span { color: #15803d; }
.check-result.err { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
.check-result.err span { color: #b91c1c; }
.check-result ul { margin: 4px 0 0; padding-left: 16px; }
.check-result li { font-size: 0.75rem; margin-bottom: 2px; }
  `]
})
export class DemoFonctionnalitesComponent {

  // Navigation
  sectionActive = 'lettres';
  sections = [
    { id: 'lettres',    label: 'N°7 — Montants en Lettres', icone: 'format_list_numbered' },
    { id: 'search',     label: 'N°1 & 2 — Recherche',       icone: 'search' },
    { id: 'date',       label: 'N°5 — Calendrier',          icone: 'calendar_month' },
    { id: 'validation', label: 'N°6 — Validation',          icone: 'fact_check' },
    { id: 'dict',       label: 'N°4 — Dictionnaire IA',     icone: 'auto_awesome' },
  ];

  // N°7
  montant = 1500.750;
  devise = 'TND';
  langueLettres = 'fr';
  tauxTva = 19;

  // N°1 & 2
  clientSelectionne: ResultatRecherche | null = null;

  // N°5
  dateFacture = '';
  dateEcheance = '';
  dateLivraison = '';

  // N°6
  testEmail = '';
  testTel = '';
  testMatricule = '';
  factHt = 1000;
  factTva = 19;
  factTtc = 1190;
  checkResult: { valide: boolean; erreurs: string[]; avertissements: string[] } | null = null;

  // N°4
  texteDict = '';

  constructor(
    private utilsService: UtilsService,
    private formValidator: FormValidatorService
  ) {}

  // Callbacks
  onClientSelectionne(item: ResultatRecherche): void {
    this.clientSelectionne = item;
  }

  onDateChange(type: string, iso: string): void {
    console.log(`Date ${type} changée : ${iso}`);
  }

  onDateValidation(v: any): void {
    console.log('Validation date :', v);
  }

  // Validation locale
  emailValide(e: string): boolean { return this.utilsService.validerEmailLocal(e); }
  telValide(t: string): boolean   { return this.utilsService.validerTelephoneLocal(t); }
  matriculeValide(m: string): boolean { return /^[0-9]{7}[A-Za-z]{1,3}(\/[A-Z]\/[0-9]{3})?$/.test(m); }

  verifierFacture(): void {
    this.checkResult = this.formValidator.verifierCoherenceFacture({
      montantHt: this.factHt,
      tauxTva: this.factTva,
      montantTtc: this.factTtc
    });
  }
}
