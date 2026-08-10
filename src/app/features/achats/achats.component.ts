import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ExportService } from '../../core/services/export.service';
Chart.register(...registerables);


@Component({
  selector: 'app-achats',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DecimalPipe, DatePipe, TranslateModule],
  templateUrl: './achats.component.html',
  styleUrls: ['./achats.component.css']
})
export class AchatsComponent implements OnInit, OnDestroy, AfterViewInit {


  activeTab: string = 'dashboard';

  // ── Data ──
  commandes: any[] = [];
  commandesFiltrees: any[] = [];
  receptions: any[] = [];
  receptionsFiltrees: any[] = [];
  fournisseurs: any[] = [];
  produits: any[] = [];
  entrepots: any[] = [];

  // ── KPIs ──
  kpis: any = {
    totalDepenses: 0,
    bonsEnAttente: 0,
    fournisseursActifs: 0,
    receptionsCeMois: 0,
    totalCommandes: 0,
    totalReceptions: 0
  };

  // ── Filtres ──
  commandeSearch: string = '';
  commandeStatutFilter: string = '';
  receptionSearch: string = '';

  // ── Modales ──
  showCommandeModal: boolean = false;
  showReceptionModal: boolean = false;
  showDeleteModal: boolean = false;
  showDetailModal: boolean = false;

  // ── Rôle utilisateur ──
  get isAdmin(): boolean {
    const stored = localStorage.getItem('currentUser');
    const user = stored ? JSON.parse(stored) : null;
    return user?.roles?.includes('ROLE_ADMIN') || user?.role === 'ADMIN';
  }

  selectedCommande: any = null;
  commandeDetail: any = null;

  // ── Formulaires ──
  commandeForm: any = {
    fournisseurId: null,
    notes: '',
    lignes: [{ produitId: null, designation: '', quantite: 1, prixUnitaire: 0 }]
  };

  receptionForm: any = {
    commandeAchatId: null,
    produitId: null,
    entrepotId: null,
    quantiteCommandee: 0,
    quantiteRecue: 0,
    statut: 'CONFORME',
    observations: ''
  };

  // ── État ──
  loading: boolean = false;
  isSubmitting: boolean = false;  // garde anti-double-clic
  successMsg: string = '';
  errorMsg: string = '';
  private msgTimer: any;

  private baseUrl = 'http://localhost:9090/api';

  // ── Chart.js instances ──
  private chartStatut: Chart | null = null;
  private chartFournisseur: Chart | null = null;

  constructor(private http: HttpClient, public router: Router, private exportService: ExportService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    // Les graphiques sont construits après chargement des données
  }

  ngOnDestroy(): void {
    if (this.msgTimer) clearTimeout(this.msgTimer);
    if (this.chartStatut)     { this.chartStatut.destroy();     this.chartStatut = null; }
    if (this.chartFournisseur){ this.chartFournisseur.destroy(); this.chartFournisseur = null; }
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
    this.loadCommandes();
    this.loadReceptions();
    this.loadFournisseurs();
    this.loadProduits();
    this.loadEntrepots();
  }

  loadKpis(): void {
    this.http.get<any>(`${this.baseUrl}/achats/kpis`, { headers: this.getHeaders() }).subscribe({
      next: k => this.kpis = k,
      error: () => {}
    });
  }

  loadCommandes(): void {
    this.http.get<any[]>(`${this.baseUrl}/achats/commandes`, { headers: this.getHeaders() }).subscribe({
      next: data => {
        this.commandes = data;
        this.filterCommandes();
        // Construire les graphiques après le chargement des données
        setTimeout(() => this.buildCharts(), 200);
      },
      error: () => {}
    });
  }

  loadReceptions(): void {
    this.http.get<any[]>(`${this.baseUrl}/achats/receptions`, { headers: this.getHeaders() }).subscribe({
      next: data => { this.receptions = data; this.filterReceptions(); },
      error: () => {}
    });
  }

  loadFournisseurs(): void {
    this.http.get<any[]>(`${this.baseUrl}/fournisseurs`, { headers: this.getHeaders() }).subscribe({
      next: data => this.fournisseurs = data,
      error: () => {}
    });
  }

  loadProduits(): void {
    this.http.get<any[]>(`${this.baseUrl}/produits`, { headers: this.getHeaders() }).subscribe({
      next: data => this.produits = data,
      error: () => {}
    });
  }

  loadEntrepots(): void {
    this.http.get<any[]>(`${this.baseUrl}/entrepots`, { headers: this.getHeaders() }).subscribe({
      next: data => this.entrepots = data,
      error: () => {}
    });
  }

  // ══════════════════════════════════════════════════════════
  // NAVIGATION TABS
  // ══════════════════════════════════════════════════════════

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'commandes') this.loadCommandes();
    if (tab === 'receptions') this.loadReceptions();
    if (tab === 'dashboard') {
      this.loadKpis();
      this.loadCommandes(); // recharge et reconstruit les graphiques
    }
  }

  // ══════════════════════════════════════════════════════════
  // FILTRES
  // ══════════════════════════════════════════════════════════

  filterCommandes(): void {
    let list = [...this.commandes];
    if (this.commandeSearch) {
      const s = this.commandeSearch.toLowerCase();
      list = list.filter(c =>
        c.numeroCommande?.toLowerCase().includes(s) ||
        c.fournisseur?.nom?.toLowerCase().includes(s)
      );
    }
    if (this.commandeStatutFilter) {
      list = list.filter(c => c.statut === this.commandeStatutFilter);
    }
    this.commandesFiltrees = list;
  }

  filterReceptions(): void {
    let list = [...this.receptions];
    if (this.receptionSearch) {
      const s = this.receptionSearch.toLowerCase();
      list = list.filter(r =>
        r.numeroReception?.toLowerCase().includes(s) ||
        r.commandeAchat?.numeroCommande?.toLowerCase().includes(s)
      );
    }
    this.receptionsFiltrees = list;
  }

  // ══════════════════════════════════════════════════════════
  // BONS DE COMMANDE ACHAT
  // ══════════════════════════════════════════════════════════

  ouvrirNouvelleCommande(): void {
    this.commandeForm = {
      fournisseurId: null, notes: '',
      lignes: [{ produitId: null, designation: '', quantite: 1, prixUnitaire: 0 }]
    };
    this.showCommandeModal = true;
  }

  ajouterLigne(): void {
    this.commandeForm.lignes.push({ produitId: null, designation: '', quantite: 1, prixUnitaire: 0 });
  }

  supprimerLigne(i: number): void {
    if (this.commandeForm.lignes.length > 1) this.commandeForm.lignes.splice(i, 1);
  }

  onProduitChange(i: number): void {
    const pid = this.commandeForm.lignes[i].produitId;
    if (pid) {
      const prod = this.produits.find(p => p.id == pid);
      if (prod) {
        this.commandeForm.lignes[i].designation = prod.nom;
        this.commandeForm.lignes[i].prixUnitaire = prod.prixAchat || prod.prixUnitaire || 0;
      }
    }
  }

  calculerTotalLigne(ligne: any): number {
    return (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
  }

  calculerTotalCommande(): number {
    return this.commandeForm.lignes.reduce((sum: number, l: any) => sum + this.calculerTotalLigne(l), 0);
  }

  soumettreCommande(): void {
    if (this.isSubmitting) return;  // ← blocage immédiat
    if (!this.commandeForm.fournisseurId) {
      this.afficherErreur('Veuillez sélectionner un fournisseur.');
      return;
    }
    this.isSubmitting = true;
    this.loading = true;
    this.showCommandeModal = false;  // ← fermeture immédiate de la modale
    const payload = {
      fournisseurId: this.commandeForm.fournisseurId,
      notes: this.commandeForm.notes,
      lignes: this.commandeForm.lignes.map((l: any) => ({
        produitId: l.produitId || null,
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire
      }))
    };
    this.http.post<any>(`${this.baseUrl}/achats/commandes`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loading = false;
        this.isSubmitting = false;
        this.afficherSucces('Bon de commande créé avec succès !');
        this.loadCommandes();
        this.loadKpis();
      },
      error: err => {
        this.loading = false;
        this.isSubmitting = false;
        this.showCommandeModal = true;  // ré-ouvrir si erreur
        this.afficherErreur(this.extractErrMsg(err));
      }
    });
  }

  changerStatut(cmd: any, statut: string): void {
    this.http.put<any>(`${this.baseUrl}/achats/commandes/${cmd.id}/statut`, { statut }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.afficherSucces(`Statut mis à jour : ${statut}`); this.loadCommandes(); this.loadKpis(); },
      error: err => this.afficherErreur(this.extractErrMsg(err))
    });
  }

  // ──────────────────────────────────────────────────
  // P4 — GRAPHIQUES CHART.JS
  // ──────────────────────────────────────────────────

  buildCharts(): void {
    if (this.activeTab !== 'dashboard') return;

    // ── Graphique 1 : Donut statuts commandes ──
    const statuts = ['EN_ATTENTE','EN_VALIDATION','ENVOYEE','RECUE_PARTIELLE','RECUE_TOTALE','ANNULEE'];
    const counts  = statuts.map(s => this.commandes.filter(c => c.statut === s).length);
    const labels  = ['En attente','🔍 Validation','Envoyée','Reçue partielle','Reçue','Annulée'];
    const colors  = ['#f97316','#f59e0b','#3b82f6','#8b5cf6','#22c55e','#ef4444'];

    const canvS = document.getElementById('achatStatutChart') as HTMLCanvasElement;
    if (canvS) {
      if (this.chartStatut) { this.chartStatut.destroy(); }
      this.chartStatut = new Chart(canvS, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { font: { size: 11, family: 'Inter' }, padding: 14 } }
          }
        }
      });
    }

    // ── Graphique 2 : Barres horizontales top 5 fournisseurs ──
    const fournMap: {[nom:string]: number} = {};
    this.commandes.filter(c => c.statut !== 'ANNULEE').forEach(c => {
      const nom = c.fournisseur?.nom || 'Inconnu';
      fournMap[nom] = (fournMap[nom] || 0) + (c.montantTotal || 0);
    });
    const topFourn = Object.entries(fournMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5);
    const fLabels = topFourn.map(([nom]) => nom);
    const fVals   = topFourn.map(([, val]) => Number(val.toFixed(3)));

    const canvF = document.getElementById('achatFournisseurChart') as HTMLCanvasElement;
    if (canvF) {
      if (this.chartFournisseur) { this.chartFournisseur.destroy(); }
      this.chartFournisseur = new Chart(canvF, {
        type: 'bar',
        data: {
          labels: fLabels,
          datasets: [{
            label: 'Montant TND',
            data: fVals,
            backgroundColor: 'rgba(139,92,246,0.8)',
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
            y: { ticks: { font: { size: 11, family: 'Inter' } } }
          }
        }
      });
    }
  }

  // ── P3 : Workflow multi-niveaux ──────────────────────────
  soumettrePourValidation(cmd: any): void {
    this.changerStatut(cmd, 'EN_VALIDATION');
  }

  validerEtEnvoyer(cmd: any): void {
    if (!this.isAdmin) {
      this.afficherErreur('Seul un administrateur peut valider et envoyer une commande.');
      return;
    }
    this.changerStatut(cmd, 'ENVOYEE');
  }

  // ── P5 : Relance email fournisseur ───────────────────────
  relancerFournisseur(cmd: any): void {
    this.http.post<any>(`${this.baseUrl}/achats/commandes/${cmd.id}/relance-email`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => this.afficherSucces(`📧 ${res.message || 'Email de relance envoyé !'}` ),
      error: err => this.afficherErreur(this.extractErrMsg(err))
    });
  }

  ouvrirDetail(cmd: any): void {
    this.commandeDetail = cmd;
    this.showDetailModal = true;
  }

  confirmerSuppression(cmd: any): void {
    this.selectedCommande = cmd;
    this.showDeleteModal = true;
  }

  supprimerCommande(): void {
    if (!this.selectedCommande) return;
    this.http.delete<any>(`${this.baseUrl}/achats/commandes/${this.selectedCommande.id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.afficherSucces('Commande supprimée.');
        this.loadCommandes();
        this.loadKpis();
      },
      error: err => {
        this.showDeleteModal = false;
        this.afficherErreur(this.extractErrMsg(err));
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // RÉCEPTIONS
  // ══════════════════════════════════════════════════════════

  ouvrirNouvelleReception(cmd: any = null): void {
    this.receptionForm = {
      commandeAchatId: cmd?.id || null,
      produitId: null, entrepotId: null,
      quantiteCommandee: 0, quantiteRecue: 0,
      statut: 'CONFORME', observations: ''
    };
    if (cmd && cmd.lignes?.length > 0) {
      const premiereLigne = cmd.lignes[0];
      // Tenter plusieurs sources pour récupérer l'id du produit
      this.receptionForm.produitId =
        premiereLigne.produit?.id ||
        premiereLigne.produitId ||
        null;
      this.receptionForm.quantiteCommandee = premiereLigne.quantite || 0;
      this.receptionForm.quantiteRecue     = premiereLigne.quantite || 0;
    }
    this.showReceptionModal = true;
  }

  soumettreReception(): void {
    if (!this.receptionForm.commandeAchatId) {
      this.afficherErreur('Veuillez sélectionner une commande.');
      return;
    }
    this.loading = true;
    this.http.post<any>(`${this.baseUrl}/achats/receptions`, this.receptionForm, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.showReceptionModal = false;
        // Utiliser le message du serveur (indique si le stock a été mis à jour)
        const msg = res?.message || 'Réception enregistrée avec succès !';
        this.afficherSucces(msg);
        this.loadReceptions();
        this.loadCommandes();
        this.loadKpis();
      },
      error: err => {
        this.loading = false;
        this.afficherErreur(this.extractErrMsg(err));
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════════

  getStatutClass(statut: string): string {
    const map: any = {
      'EN_ATTENTE'     : 'statut-attente',
      'EN_VALIDATION'  : 'statut-validation',
      'ENVOYEE'        : 'statut-envoyee',
      'RECUE_PARTIELLE': 'statut-partielle',
      'RECUE_TOTALE'   : 'statut-recue',
      'ANNULEE'        : 'statut-annulee',
      'CONFORME'       : 'statut-recue',
      'NON_CONFORME'   : 'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: any = {
      'EN_ATTENTE'     : 'En attente',
      'EN_VALIDATION'  : '🔍 En validation',
      'ENVOYEE'        : 'Envoyée',
      'RECUE_PARTIELLE': 'Reçue partielle',
      'RECUE_TOTALE'   : 'Reçue',
      'ANNULEE'        : 'Annulée',
      'CONFORME'       : 'Conforme',
      'NON_CONFORME'   : 'Non conforme',
      'PARTIELLE'      : 'Partielle'
    };
    return map[statut] || statut;
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

  fermerToutesModales(): void {
    this.showCommandeModal = false;
    this.showReceptionModal = false;
    this.showDeleteModal = false;
    this.showDetailModal = false;
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

  private get _commandeCols(): string[] {
    return ['N°', 'Référence', 'Fournisseur', 'Date', 'Statut', 'Montant TTC (TND)', 'Notes'];
  }
  private get _commandeRows(): (string | number)[][] {
    return this.commandesFiltrees.map((c, i) => [
      i + 1,
      c.reference ?? '—',
      c.fournisseur?.nom ?? '—',
      c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '—',
      c.statut ?? '—',
      `${(c.montantTTC ?? 0).toFixed(3)} TND`,
      c.notes ?? '—'
    ]);
  }

  private get _receptionCols(): string[] {
    return ['N°', 'Produit', 'Entrepôt', 'Qé commandée', 'Qé reçue', 'Statut', 'Observations'];
  }
  private get _receptionRows(): (string | number)[][] {
    return this.receptionsFiltrees.map((r, i) => [
      i + 1,
      r.produitNom ?? '—',
      r.entrepotNom ?? '—',
      r.quantiteCommandee ?? 0,
      r.quantiteRecue ?? 0,
      r.statut ?? '—',
      r.observations ?? '—'
    ]);
  }

  exportCommandesCSV(): void {
    this.exportService.exportToCSV(this._commandeCols, this._commandeRows,
      `bons-achat-${new Date().toISOString().slice(0, 10)}`);
  }
  exportCommandesPDF(): void {
    this.exportService.exportTableToPDF(
      this._commandeCols, this._commandeRows,
      'Bons de Commande Achats — BENJEDDOU ERP',
      `bons-achat-${new Date().toISOString().slice(0, 10)}`,
      `${this.commandesFiltrees.length} commande(s) — ${new Date().getFullYear()}`
    );
  }
  exportCommandesWord(): void {
    this.exportService.exportTableToWord(
      this._commandeCols, this._commandeRows,
      'Bons de Commande Achats — BENJEDDOU ERP',
      `bons-achat-${new Date().toISOString().slice(0, 10)}`);
  }
  printCommandes(): void {
    this.exportService.printElement('commandes-table', 'Bons de Commande Achats — BENJEDDOU ERP');
  }

  exportReceptionsCSV(): void {
    this.exportService.exportToCSV(this._receptionCols, this._receptionRows,
      `receptions-${new Date().toISOString().slice(0, 10)}`);
  }
  exportReceptionsPDF(): void {
    this.exportService.exportTableToPDF(
      this._receptionCols, this._receptionRows,
      'Réceptions Fournisseurs — BENJEDDOU ERP',
      `receptions-${new Date().toISOString().slice(0, 10)}`,
      `${this.receptionsFiltrees.length} réception(s)`
    );
  }
  exportReceptionsWord(): void {
    this.exportService.exportTableToWord(
      this._receptionCols, this._receptionRows,
      'Réceptions Fournisseurs — BENJEDDOU ERP',
      `receptions-${new Date().toISOString().slice(0, 10)}`);
  }
  printReceptions(): void {
    this.exportService.printElement('receptions-table', 'Réceptions Fournisseurs — BENJEDDOU ERP');
  }
}
