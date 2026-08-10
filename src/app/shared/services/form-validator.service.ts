import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ValidationResult {
  valide: boolean;
  erreurs: string[];
  avertissements: string[];
}

/**
 * Service centralisé de validation des formulaires (N°6).
 * Fournit :
 *  - Validators Angular réutilisables
 *  - Validation sémantique (email, téléphone, matricule, IBAN...)
 *  - Contrôle de complétude avant enregistrement
 *  - Vérification de cohérence (date fin > date début, etc.)
 */
@Injectable({ providedIn: 'root' })
export class FormValidatorService {

  // ═══════════════════════════════════════════════════════════════════
  //  VALIDATORS ANGULAR (utilisables dans Reactive Forms)
  // ═══════════════════════════════════════════════════════════════════

  /** Validation email stricte */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valide = /^[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/.test(control.value);
      return valide ? null : { emailInvalide: { message: 'Adresse email invalide' } };
    };
  }

  /** Validation téléphone (TN/international) */
  static telephone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valide = /^\+?[0-9\s\-().]{7,20}$/.test(control.value);
      return valide ? null : { telInvalide: { message: 'Numéro de téléphone invalide' } };
    };
  }

  /** Validation matricule fiscal tunisien */
  static matriculeFiscal(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valide = /^[0-9]{7}[A-Za-z]{1,3}(\/[A-Z]\/[0-9]{3})?$/.test(control.value);
      return valide ? null : { matriculeInvalide: { message: 'Matricule fiscal invalide (ex: 1234567ABC)' } };
    };
  }

  /** Validation date au format dd/MM/yyyy */
  static date(format = 'dd/MM/yyyy'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const ok = FormValidatorService.validerDateStr(control.value);
      return ok ? null : { dateInvalide: { message: `Format de date invalide — attendu : ${format}` } };
    };
  }

  /** La date doit être dans le futur */
  static dateFuture(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      try {
        const d = new Date(control.value);
        const auj = new Date(); auj.setHours(0, 0, 0, 0);
        return d >= auj ? null : { datePasse: { message: 'La date doit être dans le futur' } };
      } catch { return { dateInvalide: true }; }
    };
  }

  /** Validation montant positif */
  static montantPositif(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === '') return null;
      const val = parseFloat(control.value);
      if (isNaN(val)) return { montantInvalide: { message: 'Montant invalide' } };
      return val >= 0 ? null : { montantNegatif: { message: 'Le montant doit être positif' } };
    };
  }

  /** Validation que date fin > date début */
  static dateFinApresDebut(champDebut: string, champFin: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const debut = group.get(champDebut)?.value;
      const fin   = group.get(champFin)?.value;
      if (!debut || !fin) return null;
      return new Date(fin) > new Date(debut)
        ? null
        : { dateFinAvantDebut: { message: 'La date de fin doit être après la date de début' } };
    };
  }

  /** Validation IBAN */
  static iban(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const iban = control.value.replace(/\s/g, '').toUpperCase();
      if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
        return { ibanInvalide: { message: 'IBAN invalide' } };
      }
      // Vérification modulo 97
      const rearranged = iban.slice(4) + iban.slice(0, 4);
      const numeric = rearranged.split('').map((c: string) => isNaN(+c) ? (c.charCodeAt(0) - 55).toString() : c).join('');
      let remainder = 0;
      for (const chunk of numeric.match(/.{1,9}/g) || []) {
        remainder = parseInt(String(remainder) + chunk, 10) % 97;
      }
      return remainder === 1 ? null : { ibanInvalide: { message: 'IBAN invalide (checksum incorrect)' } };
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CONTRÔLE DE COMPLÉTUDE (N°6 — avant enregistrement)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Vérifie que tous les champs obligatoires sont remplis.
   * @param donnees    Objet à contrôler
   * @param champsReq  Liste des champs obligatoires
   */
  verifierComplete(
    donnees: Record<string, unknown>,
    champsReq: string[]
  ): ValidationResult {
    const erreurs: string[] = [];
    const avertissements: string[] = [];

    champsReq.forEach(champ => {
      const val = donnees[champ];
      if (val === null || val === undefined || val === '') {
        erreurs.push(`Le champ "${champ}" est obligatoire`);
      }
    });

    return { valide: erreurs.length === 0, erreurs, avertissements };
  }

  /**
   * Contrôle de cohérence d'une facture.
   */
  verifierCoherenceFacture(facture: {
    montantHt?: number;
    tauxTva?: number;
    montantTtc?: number;
    dateFacture?: string;
    dateEcheance?: string;
  }): ValidationResult {
    const erreurs: string[] = [];
    const avertissements: string[] = [];

    if (facture.montantHt !== undefined && facture.tauxTva !== undefined && facture.montantTtc !== undefined) {
      const ttcCalcule = facture.montantHt * (1 + facture.tauxTva / 100);
      if (Math.abs(ttcCalcule - facture.montantTtc) > 0.01) {
        erreurs.push(`Incohérence : HT (${facture.montantHt}) × (1 + TVA ${facture.tauxTva}%) ≠ TTC (${facture.montantTtc})`);
      }
    }

    if (facture.montantHt !== undefined && facture.montantHt < 0) {
      erreurs.push('Le montant HT ne peut pas être négatif');
    }

    if (facture.dateFacture && facture.dateEcheance) {
      if (new Date(facture.dateEcheance) <= new Date(facture.dateFacture)) {
        avertissements.push("La date d'échéance est avant ou égale à la date de facture");
      }
    }

    return { valide: erreurs.length === 0, erreurs, avertissements };
  }

  /**
   * Contrôle de cohérence d'un devis.
   */
  verifierCoherenceDevis(devis: {
    lignes?: Array<{ quantite?: number; prixUnitaire?: number; total?: number }>;
    totalHt?: number;
  }): ValidationResult {
    const erreurs: string[] = [];
    const avertissements: string[] = [];

    if (devis.lignes) {
      let totalCalc = 0;
      devis.lignes.forEach((ligne, i) => {
        if ((ligne.quantite ?? 0) <= 0) erreurs.push(`Ligne ${i + 1} : quantité invalide`);
        if ((ligne.prixUnitaire ?? 0) < 0) erreurs.push(`Ligne ${i + 1} : prix unitaire négatif`);
        totalCalc += (ligne.quantite ?? 0) * (ligne.prixUnitaire ?? 0);
      });
      if (devis.totalHt !== undefined && Math.abs(totalCalc - devis.totalHt) > 0.01) {
        erreurs.push(`Le total calculé (${totalCalc.toFixed(3)}) ne correspond pas au total affiché (${devis.totalHt})`);
      }
    }

    return { valide: erreurs.length === 0, erreurs, avertissements };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  HELPERS STATIQUES
  // ═══════════════════════════════════════════════════════════════════

  /** Retourne le message d'erreur d'un contrôle Angular Forms */
  static getMessage(control: AbstractControl | null): string {
    if (!control || !control.errors || !control.touched) return '';
    const firstError = Object.values(control.errors)[0];
    return typeof firstError === 'object' && firstError.message
      ? firstError.message
      : 'Valeur invalide';
  }

  /** Applique la classe CSS d'état sur un champ */
  static classeEtat(control: AbstractControl | null): string {
    if (!control || !control.touched) return '';
    return control.valid ? 'input-valid' : 'input-error';
  }

  private static validerDateStr(s: string): boolean {
    const parts = s.split('/');
    if (parts.length !== 3) return false;
    const [j, m, a] = parts.map(Number);
    if (!j || !m || !a || a < 1900 || a > 2100) return false;
    const d = new Date(a, m - 1, j);
    return d.getFullYear() === a && d.getMonth() === m - 1 && d.getDate() === j;
  }
}
