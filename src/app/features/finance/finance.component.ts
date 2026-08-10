import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MoteurCalculComponent } from '../moteur-calcul/moteur-calcul.component';
import { ExportService } from '../../core/services/export.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DecimalPipe, DatePipe, MoteurCalculComponent, TranslateModule],
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

  private baseUrl = 'http://localhost:9090/api';

  constructor(private http: HttpClient, private route: ActivatedRoute, private exportService: ExportService) {}


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

  // ── EXPORTS ──────────────────────────────────────────────────

  private get _ecritureCols(): string[] {
    return ['N°', 'Date', 'Libellé', 'Type', 'Sens', 'Montant (TND)', 'Compte', 'Référence'];
  }

  private get _ecritureRows(): (string | number)[][] {
    return this.ecrituresFiltrees.map((e, i) => [
      i + 1,
      e.dateEcriture ? new Date(e.dateEcriture).toLocaleDateString('fr-FR') : '—',
      e.libelle ?? '—',
      e.typeEcriture ?? '—',
      e.sens ?? '—',
      `${(e.montant ?? 0).toFixed(3)} TND`,
      e.compteComptable ?? '—',
      e.referencePiece ?? '—'
    ]);
  }

  exportEcrituresCSV(): void {
    this.exportService.exportToCSV(this._ecritureCols, this._ecritureRows,
      `ecritures-comptables-${new Date().toISOString().slice(0, 10)}`);
  }

  exportEcrituresPDF(): void {
    this.exportService.exportTableToPDF(
      this._ecritureCols, this._ecritureRows,
      'Pièces Comptables — BENJEDDOU ERP',
      `ecritures-comptables-${new Date().toISOString().slice(0, 10)}`,
      `${this.ecrituresFiltrees.length} écriture(s) — Exercice ${new Date().getFullYear()}`
    );
  }

  exportEcrituresWord(): void {
    this.exportService.exportTableToWord(
      this._ecritureCols, this._ecritureRows,
      'Pièces Comptables — BENJEDDOU ERP',
      `ecritures-comptables-${new Date().toISOString().slice(0, 10)}`
    );
  }

  printEcritures(): void {
    this.exportService.printElement('ecritures-table', 'Pièces Comptables — BENJEDDOU ERP');
  }
}

