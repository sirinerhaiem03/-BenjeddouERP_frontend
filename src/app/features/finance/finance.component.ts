import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MoteurCalculComponent } from '../moteur-calcul/moteur-calcul.component';
import { ExportService } from '../../core/services/export.service';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionService } from '../../core/services/permission.service';
import { AppPermissionDirective } from '../../shared/directives/app-permission.directive';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DecimalPipe, DatePipe, MoteurCalculComponent, TranslateModule, AppPermissionDirective],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css']
})
export class FinanceComponent implements OnInit, OnDestroy {

  activeTab: string = 'dashboard';

  // ── KPIs ──
  kpis: any = {
    totalProduits: 0, totalCharges: 0, beneficeNet: 0,
    montantImpayes: 0, facturesEnAttente: 0,
    tvaCollectee: 0, tvaDeductible: 0, tvaAVerser: 0,
    totalFactures: 0
  };

  // ── Trésorerie ──
  tresorerieData: any = null;
  soldeCourant: number = 0;

  // ── Écritures comptables ──
  ecritures: any[] = [];
  ecrituresFiltrees: any[] = [];
  ecritureSearch: string = '';
  ecritureTypeFilter: string = '';

  // ── Déclaration TVA ──
  declarationTva: any = null;
  moisSelectionne: number = new Date().getMonth() + 1;
  anneeSelectionnee: number = new Date().getFullYear();

  // ── Compte de résultat ──
  compteResultat: any = null;

  // ── Modale écriture ──
  showEcritureModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedEcriture: any = null;
  ecritureForm: any = {
    libelle: '', typeEcriture: 'VENTE', sens: 'DEBIT',
    montant: 0, compteComptable: '', referencePiece: ''
  };

  // ── État ──
  loading: boolean = false;
  successMsg: string = '';
  errorMsg: string = '';
  private msgTimer: any;

  moisOptions = [
    {val:1,label:'Janvier'},{val:2,label:'Février'},{val:3,label:'Mars'},
    {val:4,label:'Avril'},{val:5,label:'Mai'},{val:6,label:'Juin'},
    {val:7,label:'Juillet'},{val:8,label:'Août'},{val:9,label:'Septembre'},
    {val:10,label:'Octobre'},{val:11,label:'Novembre'},{val:12,label:'Décembre'}
  ];
  anneeOptions: number[] = [];

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private route: ActivatedRoute, private exportService: ExportService, public permissionService: PermissionService) {}


  ngOnInit(): void {
    // Lire le queryParam ?tab= pour navigation directe depuis la sidebar
    this.route.queryParams.subscribe(params => {
      if (params['tab']) this.activeTab = params['tab'];
    });
    const anneeActuelle = new Date().getFullYear();
    for (let a = anneeActuelle; a >= anneeActuelle - 5; a--) {
      this.anneeOptions.push(a);
    }
    this.loadAll();
  }

  ngOnDestroy(): void {
    if (this.msgTimer) clearTimeout(this.msgTimer);
  }

  private getHeaders(): HttpHeaders {
    const stored = localStorage.getItem('currentUser');
    const token = stored ? JSON.parse(stored)?.token : '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ══════════════════════════════════════════════════════════
  // CHARGEMENT
  // ══════════════════════════════════════════════════════════

  loadAll(): void {
    this.loadKpis();
    this.loadTresorerie();
    this.loadEcritures();
    this.loadDeclarationTva();
    this.loadCompteResultat();
  }

  private getPaidFactureKeys(): string[] {
    const raw = localStorage.getItem('paid_facture_keys');
    return raw ? JSON.parse(raw) : [];
  }

  private applyLocalPaidStatus(list: any[]): any[] {
    const paidKeys = this.getPaidFactureKeys();
    if (!paidKeys.length) return list;
    return list.map(f => {
      if (paidKeys.includes(String(f.id)) || paidKeys.includes(String(f.numeroFacture))) {
        return { ...f, statut: 'PAYEE' };
      }
      return f;
    });
  }

  loadKpis(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/finance/kpis`, { headers }).subscribe({
      next: k => {
        if (k && (k.totalProduits > 0 || k.montantImpayes > 0)) {
          this.kpis = k;
        } else {
          this.computeDynamicKpis();
        }
      },
      error: () => this.computeDynamicKpis()
    });
  }

  computeDynamicKpis(): void {
    const headers = this.getHeaders();
    this.http.get<any[]>(`${this.baseUrl}/factures`, { headers }).subscribe({
      next: dataFactures => {
        const raw = Array.isArray(dataFactures) ? dataFactures : [];
        const factures = this.applyLocalPaidStatus(raw);

        const totalProduits = factures
          .filter(f => f.statut === 'PAYEE')
          .reduce((s, f) => s + (f.montantTotal || 0), 0);

        const montantImpayes = factures
          .filter(f => f.statut === 'EN_ATTENTE' || f.statut === 'IMPAYEE' || f.statut === 'EN_RETARD')
          .reduce((s, f) => s + (f.montantTotal || 0), 0);

        const facturesEnAttente = factures
          .filter(f => f.statut === 'EN_ATTENTE' || f.statut === 'IMPAYEE' || f.statut === 'EN_RETARD').length;

        const tvaCollectee = factures
          .filter(f => f.statut === 'PAYEE')
          .reduce((s, f) => s + (f.montantTva || (f.montantTotal ? f.montantTotal * 0.19 / 1.19 : 0)), 0);

        // Charger les commandes d'achats fournisseurs pour calculer les Charges Totales et la TVA Déductible
        this.http.get<any[]>(`${this.baseUrl}/achats/commandes`, { headers }).subscribe({
          next: dataAchats => {
            const achats = Array.isArray(dataAchats) ? dataAchats : [];
            const totalCharges = achats.reduce((s, a) => s + (a.montantTotal || 0), 0);
            const tvaDeductible = totalCharges > 0 ? (totalCharges * 0.19 / 1.19) : 0;
            const beneficeNet = totalProduits - totalCharges;
            const tvaAVerser = Math.max(0, tvaCollectee - tvaDeductible);

            this.kpis = {
              totalProduits,
              totalCharges,
              beneficeNet,
              montantImpayes,
              facturesEnAttente,
              tvaCollectee,
              tvaDeductible,
              tvaAVerser,
              totalFactures: factures.length
            };
          },
          error: () => {
            const totalCharges = 0;
            const tvaDeductible = 0;
            const beneficeNet = totalProduits;
            const tvaAVerser = tvaCollectee;

            this.kpis = {
              totalProduits,
              totalCharges,
              beneficeNet,
              montantImpayes,
              facturesEnAttente,
              tvaCollectee,
              tvaDeductible,
              tvaAVerser,
              totalFactures: factures.length
            };
          }
        });
      },
      error: () => {}
    });
  }

  loadTresorerie(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/finance/tresorerie`, { headers }).subscribe({
      next: d => {
        if (d && d.soldeCourant > 0) {
          this.tresorerieData = d;
          this.soldeCourant = d.soldeCourant || 0;
        } else {
          this.computeDynamicTresorerie();
        }
      },
      error: () => this.computeDynamicTresorerie()
    });
  }

  computeDynamicTresorerie(): void {
    const headers = this.getHeaders();
    this.http.get<any[]>(`${this.baseUrl}/factures`, { headers }).subscribe({
      next: dataFactures => {
        const raw = Array.isArray(dataFactures) ? dataFactures : [];
        const factures = this.applyLocalPaidStatus(raw);
        const totalEncaissements = factures
          .filter(f => f.statut === 'PAYEE')
          .reduce((s, f) => s + (f.montantTotal || 0), 0);

        this.soldeCourant = totalEncaissements;
        this.tresorerieData = {
          soldeCourant: totalEncaissements,
          totalEncaissements: totalEncaissements,
          totalDecaissements: 0
        };
      },
      error: () => {}
    });
  }

  loadEcritures(): void {
    this.http.get<any[]>(`${this.baseUrl}/finance/ecritures`, { headers: this.getHeaders() }).subscribe({
      next: data => { this.ecritures = data; this.filterEcritures(); },
      error: () => {}
    });
  }

  loadDeclarationTva(): void {
    this.http.get<any>(`${this.baseUrl}/finance/declaration-tva?mois=${this.moisSelectionne}&annee=${this.anneeSelectionnee}`,
      { headers: this.getHeaders() }).subscribe({
      next: d => this.declarationTva = d, error: () => {}
    });
  }

  loadCompteResultat(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/finance/compte-resultat?annee=${this.anneeSelectionnee}`, { headers }).subscribe({
      next: d => {
        if (d && (d.produits > 0 || d.charges > 0)) {
          this.compteResultat = d;
        } else {
          this.computeDynamicCompteResultat();
        }
      },
      error: () => this.computeDynamicCompteResultat()
    });
  }

  computeDynamicCompteResultat(): void {
    const produits = this.kpis.totalProduits || 0;
    const charges = this.kpis.totalCharges || 0;
    const resultatNet = produits - charges;
    const positif = resultatNet >= 0;
    const tauxMarge = produits > 0 ? Math.round((resultatNet / produits) * 100) : 0;

    this.compteResultat = {
      annee: this.anneeSelectionnee,
      produits,
      charges,
      resultatNet,
      positif,
      tauxMarge
    };
  }

  // ══════════════════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════════════════

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'ecritures') this.loadEcritures();
    if (tab === 'tva') this.loadDeclarationTva();
    if (tab === 'resultat') this.loadCompteResultat();
    if (tab === 'tresorerie') this.loadTresorerie();
  }

  // ══════════════════════════════════════════════════════════
  // FILTRES ÉCRITURES
  // ══════════════════════════════════════════════════════════

  filterEcritures(): void {
    let list = [...this.ecritures];
    if (this.ecritureSearch) {
      const s = this.ecritureSearch.toLowerCase();
      list = list.filter(e => e.libelle?.toLowerCase().includes(s) || e.numeroEcriture?.toLowerCase().includes(s));
    }
    if (this.ecritureTypeFilter) {
      list = list.filter(e => e.typeEcriture === this.ecritureTypeFilter);
    }
    this.ecrituresFiltrees = list;
  }

  // ══════════════════════════════════════════════════════════
  // ÉCRITURES COMPTABLES
  // ══════════════════════════════════════════════════════════

  ouvrirNouvelleEcriture(): void {
    this.ecritureForm = {
      libelle: '', typeEcriture: 'VENTE', sens: 'DEBIT',
      montant: 0, compteComptable: '', referencePiece: ''
    };
    this.showEcritureModal = true;
  }

  soumettreEcriture(): void {
    if (!this.ecritureForm.libelle) {
      this.afficherErreur('Le libellé est obligatoire.');
      return;
    }
    this.loading = true;
    this.http.post<any>(`${this.baseUrl}/finance/ecritures`, this.ecritureForm, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loading = false;
        this.showEcritureModal = false;
        this.afficherSucces('Écriture enregistrée !');
        this.loadEcritures();
        this.loadKpis();
      },
      error: err => { this.loading = false; this.afficherErreur(this.extractErrMsg(err)); }
    });
  }

  validerEcriture(ec: any): void {
    this.http.put<any>(`${this.baseUrl}/finance/ecritures/${ec.id}/valider`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.afficherSucces('Écriture validée !'); this.loadEcritures(); },
      error: () => this.afficherErreur('Erreur lors de la validation.')
    });
  }

  confirmerSuppression(ec: any): void {
    this.selectedEcriture = ec;
    this.showDeleteModal = true;
  }

  supprimerEcriture(): void {
    if (!this.selectedEcriture) return;
    this.http.delete<any>(`${this.baseUrl}/finance/ecritures/${this.selectedEcriture.id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.afficherSucces('Écriture supprimée.');
        this.loadEcritures();
      },
      error: err => { this.showDeleteModal = false; this.afficherErreur(this.extractErrMsg(err)); }
    });
  }

  // ══════════════════════════════════════════════════════════
  // P2 — EXPORT DÉCLARATION TVA XML (DGI Tunisie)
  // ══════════════════════════════════════════════════════════

  exporterTvaXml(): void {
    const url = `${this.baseUrl}/finance/declaration-tva/export-xml?mois=${this.moisSelectionne}&annee=${this.anneeSelectionnee}`;
    this.http.get(url, {
      headers: this.getHeaders(),
      responseType: 'blob'   // ← récupérer le fichier binaire (XML)
    }).subscribe({
      next: (blob: Blob) => {
        // Créer un lien temporaire pour déclencher le téléchargement
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const moisStr = String(this.moisSelectionne).padStart(2, '0');
        a.download = `DeclarationTVA_${moisStr}_${this.anneeSelectionnee}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.afficherSucces(`✅ Fichier XML téléchargé : DeclarationTVA_${moisStr}_${this.anneeSelectionnee}.xml`);
      },
      error: err => this.afficherErreur('Erreur export XML : ' + this.extractErrMsg(err))
    });
  }


  // ══════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════════

  getSensClass(sens: string): string {
    return sens === 'CREDIT' ? 'sens-credit' : 'sens-debit';
  }

  getStatutEcritureClass(statut: string): string {
    return statut === 'VALIDE' ? 'statut-valide' : 'statut-brouillon';
  }

  getBeneficeClass(): string {
    return this.kpis.beneficeNet >= 0 ? 'positif' : 'negatif';
  }

  private afficherSucces(msg: string): void {
    this.successMsg = msg; this.errorMsg = '';
    if (this.msgTimer) clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.successMsg = '', 4000);
  }

  private afficherErreur(msg: string): void {
    this.errorMsg = msg; this.successMsg = '';
    if (this.msgTimer) clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => this.errorMsg = '', 5000);
  }

  private extractErrMsg(err: any): string {
    if (!err) return 'Erreur inconnue.';
    if (typeof err.error === 'string') return err.error;
    if (err.error?.message) return err.error.message;
    if (err.message) return err.message;
    if (err.status === 0) return 'Backend non accessible. Vérifiez que le serveur est démarré (port 9090).';
    if (err.status === 401) return 'Session expirée. Veuillez vous reconnecter.';
    if (err.status === 403) return 'Accès refusé. Droits insuffisants.';
    if (err.status === 404) return 'Ressource introuvable.';
    if (err.status >= 500) return 'Erreur serveur. Vérifiez les logs du backend.';
    return `Erreur ${err.status || ''}`;
  }

  // ── EXPORTS COMPTABLES ────────────────────────────────────

  private get _ecritureCols(): string[] {
    return ['N°', 'Date', 'Réf Pièce', 'Compte', 'Libellé', 'Débit (TND)', 'Crédit (TND)'];
  }

  private get _ecritureRows(): (string | number)[][] {
    return (this.ecrituresFiltrees ?? []).map((e: any, i: number) => {
      const isDebit = (e.sens === 'DEBIT' || e.sens === 'D' || e.typeEcriture === 'DEPENSE');
      const debitVal = isDebit ? (e.montant || 0) : 0;
      const creditVal = !isDebit ? (e.montant || 0) : 0;
      return [
        i + 1,
        e.dateEcriture ? new Date(e.dateEcriture).toLocaleDateString('fr-FR') : '—',
        e.referencePiece || '—',
        e.compteComptable || '532000',
        e.libelle || '—',
        debitVal ? debitVal.toFixed(3) : '0.000',
        creditVal ? creditVal.toFixed(3) : '0.000'
      ];
    });
  }

  exportEcrituresCSV(): void {
    this.exportService.exportToCSV(this._ecritureCols, this._ecritureRows, `journal-comptable-${new Date().toISOString().slice(0, 10)}`);
  }

  exportEcrituresPDF(): void {
    this.exportService.exportTableToPDF(this._ecritureCols, this._ecritureRows, 'Journal des Écritures Comptables — BENJEDDOU ERP', `journal-comptable-${new Date().toISOString().slice(0, 10)}`, `${this.ecrituresFiltrees.length} écriture(s)`);
  }

  exportEcrituresWord(): void {
    this.exportService.exportTableToWord(this._ecritureCols, this._ecritureRows, 'Journal des Écritures Comptables — BENJEDDOU ERP', `journal-comptable-${new Date().toISOString().slice(0, 10)}`);
  }

  exportEcrituresExcel(): void {
    this.exportService.exportTableToExcel(this._ecritureCols, this._ecritureRows, 'Journal des Écritures Comptables — BENJEDDOU ERP', `journal-comptable-${new Date().toISOString().slice(0, 10)}`);
  }

  printEcritures(): void {
    this.exportService.printElement('ecritures-table', 'Journal des Écritures Comptables — BENJEDDOU ERP');
  }

  // ══════════════════════════════════════════════════════════
  // DOCUMENTS FINANCIERS & COMPTABLES MULTILINGUES (FR / EN / AR)
  // ══════════════════════════════════════════════════════════
  finDocLangue: 'fr' | 'en' | 'ar' = 'fr';

  imprimerJournalComptable(langOverride?: string): void {


    const lang = (langOverride || this.finDocLangue || localStorage.getItem('erp_lang') || 'fr').toLowerCase();
    const isAr = lang === 'ar';
    const isEn = lang === 'en';
    const dir = isAr ? 'rtl' : 'ltr';

    const t = {
      title: isAr ? 'دفتر اليومية العامة وسجل القيود المحاسبية' : (isEn ? 'GENERAL ACCOUNTING JOURNAL & LEDGER' : 'JOURNAL GÉNÉRAL DES ÉCRITURES COMPTABLES'),
      subtitle: isAr ? 'نظام المحاسبة المالية وفق المعايير المحاسبية التونسية والدولية' : (isEn ? 'Financial Accounting Ledger System' : 'Système Comptable & Financier Conforme aux Normes'),
      period: isAr ? 'السنة المالية' : (isEn ? 'Fiscal Year' : 'Exercice Comptable'),
      datePrinted: isAr ? 'تاريخ التوليد' : (isEn ? 'Print Date' : 'Édité le'),
      colNum: '#',
      colDate: isAr ? 'التاريخ' : (isEn ? 'Date' : 'Date'),
      colRef: isAr ? 'مرجع السند' : (isEn ? 'Ref' : 'Réf Pièce'),
      colAccount: isAr ? 'رقم الحساب' : (isEn ? 'Account' : 'Compte'),
      colLabel: isAr ? 'البيان المحاسبي' : (isEn ? 'Description' : 'Libellé de l\'Écriture'),
      colDebit: isAr ? 'مدين (TND)' : (isEn ? 'Debit (TND)' : 'Débit (TND)'),
      colCredit: isAr ? 'دائن (TND)' : (isEn ? 'Credit (TND)' : 'Crédit (TND)'),
      totalDebit: isAr ? 'إجمالي المدين' : (isEn ? 'Total Debit' : 'Total Débit'),
      totalCredit: isAr ? 'إجمالي الدائن' : (isEn ? 'Total Credit' : 'Total Crédit'),
      balance: isAr ? 'الرصيد الصافي' : (isEn ? 'Net Balance' : 'Solde Comptable'),
      balanced: isAr ? '✓ اليومية متوازنة محاسبياً' : (isEn ? '✓ Journal is perfectly balanced' : '✓ Journal équilibré et conforme'),
      certified: isAr ? 'المصادقة وتأشيرة الخبير المحاسبي' : (isEn ? 'Accounting Audit & Certification' : 'Visa & Certification Expert-Comptable'),
      footer: isAr ? 'BENJEDDOU ERP — وثيقة محاسبية رسمية مشفرة' : (isEn ? 'BENJEDDOU ERP — Certified Accounting Ledger Document' : 'BENJEDDOU ERP — Document Comptable Officiel Certifié')
    };

    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-TN'));
    let totDebit = 0;
    let totCredit = 0;

    const rowsHtml = this.ecrituresFiltrees.map((e, idx) => {
      const isDebit = (e.sens === 'DEBIT' || e.sens === 'D' || e.typeEcriture === 'DEPENSE');
      const debitVal = isDebit ? (e.montant || 0) : 0;
      const creditVal = !isDebit ? (e.montant || 0) : 0;
      totDebit += debitVal;
      totCredit += creditVal;

      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${e.dateEcriture ? new Date(e.dateEcriture).toLocaleDateString(isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-TN')) : '—'}</td>
          <td><span style="font-family:monospace;">${e.referencePiece || '—'}</span></td>
          <td><strong>${e.compteComptable || '532000'}</strong></td>
          <td>${e.libelle || '—'}</td>
          <td style="text-align:right; font-weight:${debitVal ? 700 : 400};">${debitVal ? debitVal.toFixed(3) + ' TND' : '—'}</td>
          <td style="text-align:right; font-weight:${creditVal ? 700 : 400};">${creditVal ? creditVal.toFixed(3) + ' TND' : '—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${t.title}</title>
  <style>
    body { font-family: ${isAr ? "'Tahoma', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif"}; padding: 24px; color: #0f172a; direction: ${dir}; }
    .page { max-width: 900px; margin: auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 28px; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
    .brand h1 { color: #6366f1; font-size: 22pt; margin: 0; }
    .badge-jnl { background: #1e1b4b; color: #fff; padding: 10px 18px; border-radius: 8px; text-align: ${isAr ? 'left' : 'right'}; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
    th { background: #1e293b; color: #fff; padding: 8px 10px; text-align: ${isAr ? 'right' : 'left'}; font-size: 8.5pt; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    .totals-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; font-weight: 700; }
    .sig-zone { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .sig-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; min-height: 80px; text-align: ${isAr ? 'right' : 'left'}; }
    .footer { text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
    @media print { body { padding: 0; } .page { border: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <h1>BENJEDDOU ERP</h1>
        <p style="margin:4px 0; font-size:9pt; color:#64748b;">${t.subtitle}<br>123, Avenue Habib Bourguiba, Tunis</p>
      </div>
      <div class="badge-jnl">
        <h2 style="margin:0; font-size:13pt; color:#a5b4fc;">${t.title}</h2>
        <div style="font-size:9pt; margin-top:4px;">${t.period} : ${new Date().getFullYear()} | ${t.datePrinted} : ${dateStr}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:30px; text-align:center;">${t.colNum}</th>
          <th style="width:85px;">${t.colDate}</th>
          <th style="width:90px;">${t.colRef}</th>
          <th style="width:75px;">${t.colAccount}</th>
          <th>${t.colLabel}</th>
          <th style="width:110px; text-align:right;">${t.colDebit}</th>
          <th style="width:110px; text-align:right;">${t.colCredit}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding:20px;">Aucune écriture</td></tr>'}
      </tbody>
    </table>

    <div class="totals-bar">
      <div><span>${t.totalDebit} : </span><span style="color:#2563eb;">${totDebit.toFixed(3)} TND</span></div>
      <div><span>${t.totalCredit} : </span><span style="color:#16a34a;">${totCredit.toFixed(3)} TND</span></div>
      <div style="color:#059669;">${t.balanced}</div>
    </div>

    <div class="sig-zone">
      <div class="sig-box"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">Responsable Comptable</span></div>
      <div class="sig-box"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">${t.certified}</span></div>
    </div>

    <div class="footer">${t.footer} — ${dateStr}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=950,height=750');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  imprimerCompteResultat(langOverride?: string): void {
    if (!this.compteResultat) return;
    const lang = (langOverride || this.finDocLangue || localStorage.getItem('erp_lang') || 'fr').toLowerCase();
    const isAr = lang === 'ar';
    const isEn = lang === 'en';
    const dir = isAr ? 'rtl' : 'ltr';

    const cr = this.compteResultat;
    const t = {
      title: isAr ? 'جدول حسابات النتائج والقوائم المالية' : (isEn ? 'INCOME STATEMENT & FINANCIAL REPORT' : 'COMPTE DE RÉSULTAT & ÉTATS FINANCIERS'),
      fiscalYear: isAr ? 'السنة المالية' : (isEn ? 'Fiscal Year' : 'Exercice'),
      income: isAr ? 'إجمالي المداخيل والإيرادات' : (isEn ? 'Total Revenues / Operating Income' : 'PRODUITS D\'EXPLOITATION & REVENUS'),
      salesIncome: isAr ? 'مبيعات المنتجات والخدمات الفاتورة' : (isEn ? 'Sales of goods and services' : 'Chiffre d\'Affaires / Ventes de marchandises'),
      expenses: isAr ? 'إجمالي الأعباء والمصاريف' : (isEn ? 'Total Expenses / Operating Costs' : 'CHARGES D\'EXPLOITATION & ACHATS'),
      purchasesExpenses: isAr ? 'مشتريات البضائع والمصاريف التشغيلية' : (isEn ? 'Purchases and operational costs' : 'Achats consommés & Charges d\'exploitation'),
      netResult: isAr ? 'النتيجة الصافية للسنة المالية' : (isEn ? 'NET PROFIT / LOSS' : 'RÉSULTAT NET DE L\'EXERCICE'),
      marginRate: isAr ? 'نسبة هامش الربح' : (isEn ? 'Net Margin Rate' : 'Taux de Marge Nette'),
      statusPos: isAr ? 'ربح صافي إيجابي ✓' : (isEn ? 'Net Profit ✓' : 'Bénéfice Net Réalisé ✓'),
      statusNeg: isAr ? 'عجز مالي ⚠' : (isEn ? 'Net Loss ⚠' : 'Déficit / Perte Nette ⚠'),
      footer: isAr ? 'BENJEDDOU ERP — القوائم المالية الرسمية المعتمدة' : (isEn ? 'BENJEDDOU ERP — Certified Financial Statements' : 'BENJEDDOU ERP — États Financiers Certifiés')
    };

    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-TN'));

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${t.title} - ${cr.annee}</title>
  <style>
    body { font-family: ${isAr ? "'Tahoma', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif"}; padding: 24px; color: #0f172a; direction: ${dir}; }
    .page { max-width: 850px; margin: auto; border: 2px solid #059669; border-radius: 12px; padding: 28px; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 14px; margin-bottom: 20px; }
    .title h1 { color: #059669; font-size: 20pt; margin: 0; }
    .badge-yr { background: #064e3b; color: #fff; padding: 10px 18px; border-radius: 8px; text-align: center; }
    .table-cr { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table-cr th { background: #1e293b; color: #fff; padding: 10px 14px; text-align: ${isAr ? 'right' : 'left'}; }
    .table-cr td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
    .row-head { background: #f8fafc; font-weight: 800; color: #0f172a; }
    .res-box { background: ${cr.positif ? '#ecfdf5' : '#fef2f2'}; border: 2px solid ${cr.positif ? '#10b981' : '#ef4444'}; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .res-val { font-size: 18pt; font-weight: 800; color: ${cr.positif ? '#059669' : '#dc2626'}; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .sig-card { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; min-height: 85px; text-align: ${isAr ? 'right' : 'left'}; }
    .footer { text-align: center; font-size: 8pt; color: #94a3b8; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="title">
        <h1>BENJEDDOU ERP</h1>
        <p style="margin:2px 0; font-size:9pt; color:#64748b;">Direction Financière & Comptabilité<br>Tunisie</p>
      </div>
      <div class="badge-yr">
        <h2 style="margin:0; font-size:14pt; color:#a7f3d0;">${t.title}</h2>
        <span>${t.fiscalYear} ${cr.annee}</span>
      </div>
    </div>

    <table class="table-cr">
      <thead>
        <tr>
          <th>Éléments Comptables / Rubriques</th>
          <th style="width:160px; text-align:right;">Montant Net</th>
        </tr>
      </thead>
      <tbody>
        <tr class="row-head">
          <td>${t.income}</td>
          <td style="text-align:right; color:#059669;">+ ${(cr.produits || 0).toFixed(3)} TND</td>
        </tr>
        <tr>
          <td style="padding-left:24px;">• ${t.salesIncome}</td>
          <td style="text-align:right;">${(cr.produits || 0).toFixed(3)} TND</td>
        </tr>
        <tr class="row-head">
          <td>${t.expenses}</td>
          <td style="text-align:right; color:#dc2626;">- ${(cr.charges || 0).toFixed(3)} TND</td>
        </tr>
        <tr>
          <td style="padding-left:24px;">• ${t.purchasesExpenses}</td>
          <td style="text-align:right;">${(cr.charges || 0).toFixed(3)} TND</td>
        </tr>
      </tbody>
    </table>

    <div class="res-box">
      <div>
        <div style="font-size:12pt; font-weight:800;">${t.netResult}</div>
        <div style="font-size:9pt; color:#64748b; margin-top:2px;">${t.marginRate} : <strong>${cr.tauxMarge}%</strong> — ${cr.positif ? t.statusPos : t.statusNeg}</div>
      </div>
      <div class="res-val">${(cr.resultatNet || 0).toFixed(3)} TND</div>
    </div>

    <div class="sigs">
      <div class="sig-card"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">Directeur Financier (CFO)</span></div>
      <div class="sig-card"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">Commissaire aux Comptes / Direction</span></div>
    </div>

    <div class="footer">${t.footer} — ${dateStr}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=750');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  imprimerDeclarationTva(langOverride?: string): void {
    if (!this.declarationTva) return;
    const lang = (langOverride || this.finDocLangue || localStorage.getItem('erp_lang') || 'fr').toLowerCase();
    const isAr = lang === 'ar';
    const isEn = lang === 'en';
    const dir = isAr ? 'rtl' : 'ltr';

    const d = this.declarationTva;
    const t = {
      title: isAr ? 'التصريح الشهري بالأداء على القيمة المضافة (TVA 19%)' : (isEn ? 'MONTHLY VAT RETURN DECLARATION (19%)' : 'DÉCLARATION MENSUELLE DE TVA (19%)'),
      dgi: isAr ? 'الجمهورية التونسية — وزارة المالية — الإدارة العامة للجباية' : (isEn ? 'Republic of Tunisia — Ministry of Finance — Tax Authority' : 'République Tunisienne — Ministère des Finances — DGI'),
      period: isAr ? 'الفترة' : (isEn ? 'Period' : 'Période Fiscale'),
      collected: isAr ? 'الأداء على القيمة المضافة المجمّع من المبيعات' : (isEn ? 'Output VAT Collected on Sales' : 'TVA Collectée sur Ventes (19%)'),
      deductible: isAr ? 'الأداء القابل للخصم على المشتريات والمصاريف' : (isEn ? 'Input VAT Deductible on Purchases' : 'TVA Déductible sur Achats & Charges (19%)'),
      due: isAr ? 'صافي الأداء المستوجب للدفع للخزينة' : (isEn ? 'Net VAT Payable to State Treasury' : 'TVA Nette Due au Trésor Public'),
      credit: isAr ? 'فائض الأداء القابل للترحيل' : (isEn ? 'VAT Credit to be Carried Forward' : 'Crédit de TVA Reportable'),
      footer: isAr ? 'BENJEDDOU ERP — تصريح جبائي رسمي مطابق للمنظومة التونسية' : (isEn ? 'BENJEDDOU ERP — Official Tax Declaration Format' : 'BENJEDDOU ERP — Formulaire Fiscal Officiel DGI')
    };

    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-TN'));

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${t.title}</title>
  <style>
    body { font-family: ${isAr ? "'Tahoma', Arial, sans-serif" : "'Segoe UI', Arial, sans-serif"}; padding: 24px; color: #0f172a; direction: ${dir}; }
    .card { max-width: 850px; margin: auto; border: 2px solid #b45309; border-radius: 12px; padding: 28px; background: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #b45309; padding-bottom: 14px; margin-bottom: 20px; }
    .brand h2 { color: #b45309; margin: 0; font-size: 18pt; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; text-align: ${isAr ? 'right' : 'left'}; }
    .item label { font-size: 8.5pt; color: #64748b; font-weight: 700; display: block; }
    .item value { font-size: 13pt; font-weight: 800; color: #0f172a; }
    .highlight { background: #fffbeb; border-color: #fde68a; }
    .highlight value { color: #b45309; font-size: 16pt; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .sig-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; min-height: 80px; text-align: ${isAr ? 'right' : 'left'}; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <h2>BENJEDDOU ERP</h2>
        <p style="margin:2px 0; font-size:8.5pt; color:#64748b;">${t.dgi}<br>Matricule Fiscal : 1234567X</p>
      </div>
      <div style="background:#451a03; color:#fff; padding:8px 16px; border-radius:8px; text-align:center;">
        <h3 style="margin:0; font-size:12pt; color:#fde68a;">${t.title}</h3>
        <span>${t.period} : ${String(this.moisSelectionne).padStart(2, '0')}/${this.anneeSelectionnee}</span>
      </div>
    </div>

    <div class="grid">
      <div class="item"><label>${t.collected}</label><value style="color:#059669;">${(d.tvaCollectee || 0).toFixed(3)} TND</value></div>
      <div class="item"><label>${t.deductible}</label><value style="color:#2563eb;">${(d.tvaDeductible || 0).toFixed(3)} TND</value></div>
      <div class="item highlight" style="grid-column: span 2;">
        <label>${d.tvaNetteDue > 0 ? t.due : t.credit}</label>
        <value>${(d.tvaNetteDue > 0 ? d.tvaNetteDue : (d.creditTva || 0)).toFixed(3)} TND</value>
      </div>
    </div>

    <div class="sigs">
      <div class="sig-box"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">Cachet & Signature Entreprise</span></div>
      <div class="sig-box"><span style="font-size:8.5pt; font-weight:700; color:#64748b;">Quittance Recette des Finances</span></div>
    </div>

    <div style="text-align:center; font-size:8pt; color:#94a3b8; margin-top:20px;">${t.footer} — ${dateStr}</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=750');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  exportDeclarationTvaWord(): void {
    if (!this.declarationTva) return;
    const d = this.declarationTva;
    this.exportService.exportTableToWord(
      ['Poste Fiscal / Rubrique', 'Montant (TND)'],
      [
        ['TVA Collectée sur Ventes (19%)', (d.tvaCollectee || 0).toFixed(3)],
        ['TVA Déductible sur Achats & Charges (19%)', (d.tvaDeductible || 0).toFixed(3)],
        ['TVA Nette Due au Trésor Public', (d.tvaNetteDue || 0).toFixed(3)],
        ['Crédit de TVA Reportable', (d.creditTva || 0).toFixed(3)]
      ],
      `Déclaration Mensuelle de TVA — Période ${this.moisSelectionne}/${this.anneeSelectionnee}`,
      `declaration-tva-${this.moisSelectionne}-${this.anneeSelectionnee}`
    );
  }

  exportDeclarationTvaExcel(): void {
    if (!this.declarationTva) return;
    const d = this.declarationTva;
    this.exportService.exportTableToExcel(
      ['Poste Fiscal / Rubrique', 'Montant (TND)'],
      [
        ['TVA Collectée sur Ventes (19%)', (d.tvaCollectee || 0).toFixed(3)],
        ['TVA Déductible sur Achats & Charges (19%)', (d.tvaDeductible || 0).toFixed(3)],
        ['TVA Nette Due au Trésor Public', (d.tvaNetteDue || 0).toFixed(3)],
        ['Crédit de TVA Reportable', (d.creditTva || 0).toFixed(3)]
      ],
      `Déclaration Mensuelle de TVA — Période ${this.moisSelectionne}/${this.anneeSelectionnee}`,
      `declaration-tva-${this.moisSelectionne}-${this.anneeSelectionnee}`
    );
  }

  exportCompteResultatWord(): void {
    if (!this.compteResultat) return;
    const cr = this.compteResultat;
    this.exportService.exportTableToWord(
      ['Rubrique Financière / Poste de Gestion', 'Montant (TND)'],
      [
        ['Chiffre d\'Affaires / Produits d\'exploitation', (cr.produits || 0).toFixed(3)],
        ['Achats consommés & Charges d\'exploitation', (cr.charges || 0).toFixed(3)],
        ['Résultat Net de l\'Exercice', (cr.resultatNet || 0).toFixed(3)]
      ],
      `Compte de Résultat & États Financiers — Exercice ${cr.annee || new Date().getFullYear()}`,
      `compte-resultat-${cr.annee || new Date().getFullYear()}`
    );
  }

  exportCompteResultatExcel(): void {
    if (!this.compteResultat) return;
    const cr = this.compteResultat;
    this.exportService.exportTableToExcel(
      ['Rubrique Financière / Poste de Gestion', 'Montant (TND)'],
      [
        ['Chiffre d\'Affaires / Produits d\'exploitation', (cr.produits || 0).toFixed(3)],
        ['Achats consommés & Charges d\'exploitation', (cr.charges || 0).toFixed(3)],
        ['Résultat Net de l\'Exercice', (cr.resultatNet || 0).toFixed(3)]
      ],
      `Compte de Résultat & États Financiers — Exercice ${cr.annee || new Date().getFullYear()}`,
      `compte-resultat-${cr.annee || new Date().getFullYear()}`
    );
  }
}


