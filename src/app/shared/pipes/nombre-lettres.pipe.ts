import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe Angular — conversion montants en lettres côté client (sans appel réseau).
 * Usage : {{ 1234.750 | nombreLettres:'TND':'fr' }}
 * Retourne : "Mille deux-cent-trente-quatre dinars et sept-cent-cinquante millimes"
 */
@Pipe({ name: 'nombreLettres', standalone: true, pure: true })
export class NombreLettresPipe implements PipeTransform {

  transform(montant: number | string | null | undefined, devise = 'TND', langue = 'fr'): string {
    if (montant === null || montant === undefined || montant === '') return '';
    const val = typeof montant === 'string' ? parseFloat(montant) : montant;
    if (isNaN(val)) return '';
    return this.convertir(val, devise, langue);
  }

  private convertir(montant: number, devise: string, langue: string): string {
    const arrondi = Math.round(Math.abs(montant) * 1000) / 1000;
    const entier = Math.floor(arrondi);
    const decimalesBrutes = Math.round((arrondi - entier) * 1000);
    const isTroisdec = ['TND', 'MAD'].includes(devise.toUpperCase());
    const centimes = isTroisdec ? decimalesBrutes : Math.round(decimalesBrutes / 10);

    switch (langue.toLowerCase()) {
      case 'ar': return this.convertirAr(entier, centimes, devise, isTroisdec);
      case 'en': return this.convertirEn(entier, centimes, devise, isTroisdec);
      default:   return this.convertirFr(entier, centimes, devise, isTroisdec);
    }
  }

  // ── FRANÇAIS ──────────────────────────────────────────────────────────

  private unitesFr = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  private dizainesFr = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  private centiersFr(n: number): string {
    if (n === 0) return 'zéro';
    let r = '';
    if (n >= 1_000_000_000) { r += this.centiersFr(Math.floor(n / 1e9)) + (Math.floor(n / 1e9) === 1 ? ' milliard' : ' milliards'); n %= 1e9; if (n) r += ' '; }
    if (n >= 1_000_000)     { r += this.centiersFr(Math.floor(n / 1e6)) + (Math.floor(n / 1e6) === 1 ? ' million' : ' millions'); n %= 1e6; if (n) r += ' '; }
    if (n >= 1000)          { const m = Math.floor(n / 1000); r += (m === 1 ? 'mille' : this.centiersFr(m) + ' mille'); n %= 1000; if (n) r += ' '; }
    if (n >= 100)           { const c = Math.floor(n / 100); r += (c === 1 ? 'cent' : this.unitesFr[c] + ' cent'); n %= 100; if (n) r += ' '; else if (c > 1) r += 's'; }
    if (n > 0) {
      if (n < 20) { r += this.unitesFr[n]; }
      else {
        const d = Math.floor(n / 10), u = n % 10;
        if (d === 7 || d === 9) {
          r += this.dizainesFr[d] + (u === 1 ? '-et-' : '-') + this.unitesFr[n - d * 10 + 10];
        } else {
          r += this.dizainesFr[d];
          if (u) r += (u === 1 ? '-et-' : '-') + this.unitesFr[u];
          else if (d === 8) r += 's';
        }
      }
    }
    return r.trim();
  }

  private convertirFr(entier: number, centimes: number, devise: string, trois: boolean): string {
    const [sg, pl] = this.nomDeviseFr(devise);
    let r = this.capitaliser(this.centiersFr(entier)) + ' ' + (entier > 1 ? pl : sg);
    if (centimes > 0) {
      const u = trois ? (centimes > 1 ? 'millimes' : 'millime') : (centimes > 1 ? 'centimes' : 'centime');
      r += ' et ' + this.centiersFr(centimes) + ' ' + u;
    }
    return r;
  }

  private nomDeviseFr(d: string): [string, string] {
    switch (d.toUpperCase()) {
      case 'EUR': return ['euro', 'euros'];
      case 'USD': return ['dollar', 'dollars'];
      case 'MAD': return ['dirham', 'dirhams'];
      default:    return ['dinar', 'dinars'];
    }
  }

  // ── ANGLAIS ───────────────────────────────────────────────────────────

  private unitesEn = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  private dizainesEn = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  private centiersEn(n: number): string {
    if (n === 0) return 'zero';
    let r = '';
    if (n >= 1e9)  { r += this.centiersEn(Math.floor(n / 1e9)) + ' billion'; n %= 1e9; if (n) r += ' '; }
    if (n >= 1e6)  { r += this.centiersEn(Math.floor(n / 1e6)) + ' million'; n %= 1e6; if (n) r += ' '; }
    if (n >= 1000) { r += this.centiersEn(Math.floor(n / 1000)) + ' thousand'; n %= 1000; if (n) r += ' '; }
    if (n >= 100)  { r += this.unitesEn[Math.floor(n / 100)] + ' hundred'; n %= 100; if (n) r += ' '; }
    if (n > 0) {
      if (n < 20) r += this.unitesEn[n];
      else { r += this.dizainesEn[Math.floor(n / 10)]; if (n % 10) r += '-' + this.unitesEn[n % 10]; }
    }
    return r.trim();
  }

  private convertirEn(entier: number, centimes: number, devise: string, trois: boolean): string {
    const [sg, pl] = this.nomDeviseEn(devise);
    let r = this.capitaliser(this.centiersEn(entier)) + ' ' + (entier > 1 ? pl : sg);
    if (centimes > 0) {
      const u = trois ? 'millimes' : (centimes > 1 ? 'cents' : 'cent');
      r += ' and ' + this.centiersEn(centimes) + ' ' + u;
    }
    return r;
  }

  private nomDeviseEn(d: string): [string, string] {
    switch (d.toUpperCase()) {
      case 'EUR': return ['euro', 'euros'];
      case 'USD': return ['dollar', 'dollars'];
      case 'MAD': return ['dirham', 'dirhams'];
      default:    return ['dinar', 'dinars'];
    }
  }

  // ── ARABE ─────────────────────────────────────────────────────────────

  private unitesAr = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
    'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
    'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  private dizainesAr = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  private centainesAr = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];

  private centiersAr(n: number): string {
    if (n === 0) return 'صفر';
    let r = '';
    if (n >= 1e9)  { r += this.centiersAr(Math.floor(n / 1e9)) + ' مليار'; n %= 1e9; if (n) r += ' و'; }
    if (n >= 1e6)  { r += this.centiersAr(Math.floor(n / 1e6)) + ' مليون'; n %= 1e6; if (n) r += ' و'; }
    if (n >= 1000) {
      const m = Math.floor(n / 1000);
      if (m === 1) r += 'ألف'; else if (m === 2) r += 'ألفان';
      else if (m <= 10) r += this.unitesAr[m] + ' آلاف';
      else r += this.centiersAr(m) + ' ألف';
      n %= 1000; if (n) r += ' و';
    }
    if (n >= 100) { r += this.centainesAr[Math.floor(n / 100)]; n %= 100; if (n) r += ' و'; }
    if (n > 0) {
      if (n < 20) r += this.unitesAr[n];
      else {
        const u = n % 10;
        if (u) r += this.unitesAr[u] + ' و';
        r += this.dizainesAr[Math.floor(n / 10)];
      }
    }
    return r.trim();
  }

  private convertirAr(entier: number, centimes: number, devise: string, trois: boolean): string {
    const [sg, pl] = this.nomDeviseAr(devise);
    let r = this.centiersAr(entier) + ' ' + (entier > 1 ? pl : sg);
    if (centimes > 0) {
      const u = trois ? 'مليم' : 'سنتيم';
      r += ' و' + this.centiersAr(centimes) + ' ' + u;
    }
    return r;
  }

  private nomDeviseAr(d: string): [string, string] {
    switch (d.toUpperCase()) {
      case 'EUR': return ['يورو', 'يورو'];
      case 'USD': return ['دولار', 'دولارات'];
      case 'MAD': return ['درهم', 'دراهم'];
      default:    return ['دينار', 'دنانير'];
    }
  }

  private capitaliser(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
}
