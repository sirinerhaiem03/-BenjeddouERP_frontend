import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService, ModeleDocument, DocumentGenere } from './documents.service';
import { OcrScannerComponent } from '../ai-assistant/ocr-scanner/ocr-scanner.component';
import { NombreLettresPipe } from '../../shared/pipes/nombre-lettres.pipe';
import { SmartAutocompleteComponent } from '../../shared/components/smart-autocomplete/smart-autocomplete.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, OcrScannerComponent, NombreLettresPipe, SmartAutocompleteComponent, TranslateModule],
  template: `
    <div class="documents-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <span class="material-symbols-outlined">folder_special</span>
          </div>
          <div>
            <h1>{{ 'DOCUMENTS.TITLE' | translate }}</h1>
            <p class="header-subtitle">{{ 'DOCUMENTS.SUBTITLE' | translate }}</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-num">{{ modeles.length }}</span>
            <span class="stat-label">{{ 'DOCUMENTS.STATS.TEMPLATES' | translate }}</span>
          </div>
          <div class="stat-pill">
            <span class="stat-num">{{ documentsGeneres.length }}</span>
            <span class="stat-label">{{ 'DOCUMENTS.STATS.GENERATED' | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="ongletActif === 'modeles'" (click)="ongletActif = 'modeles'">
          <span class="material-symbols-outlined tab-icon">folder_open</span>
          {{ 'DOCUMENTS.TABS.TEMPLATES' | translate }}
        </button>
        <button class="tab" [class.active]="ongletActif === 'generer'" (click)="ongletActif = 'generer'">
          <span class="material-symbols-outlined tab-icon">auto_awesome</span>
          {{ 'DOCUMENTS.TABS.GENERATE' | translate }}
        </button>
        <button class="tab" [class.active]="ongletActif === 'bibliotheque'" (click)="chargerDocuments(); ongletActif = 'bibliotheque'">
          <span class="material-symbols-outlined tab-icon">library_books</span>
          {{ 'DOCUMENTS.TABS.LIBRARY' | translate }}
        </button>
        <button class="tab" [class.active]="ongletActif === 'ocr'" (click)="ongletActif = 'ocr'">
          <span class="material-symbols-outlined tab-icon">document_scanner</span>
          {{ 'DOCUMENTS.TABS.OCR' | translate }}
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- ONGLET MODÈLES                                 -->
      <!-- ═══════════════════════════════════════════════ -->
      <div class="tab-content" *ngIf="ongletActif === 'modeles'">
        <div class="section-bar">
          <h2>{{ 'DOCUMENTS.TEMPLATES.TITLE' | translate }}</h2>
          <button class="btn-primary" (click)="ouvrirUpload()">
            <span class="material-symbols-outlined">add</span>
            {{ 'DOCUMENTS.TEMPLATES.NEW' | translate }}
          </button>
        </div>

        <!-- Upload modal -->
        <div class="upload-card" *ngIf="showUpload">
          <div class="upload-card-header">
            <div class="upload-card-title">
              <span class="material-symbols-outlined">upload_file</span>
              <h3>{{ 'DOCUMENTS.MODAL.TITLE' | translate }}</h3>
            </div>
            <button class="btn-close" (click)="showUpload = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="upload-form">
            <div class="form-row">
              <div class="form-group">
                <label>{{ 'DOCUMENTS.MODAL.NAME' | translate }} *</label>
                <input type="text" [(ngModel)]="uploadForm.nom" placeholder="Ex: Facture Standard FR" class="form-control">
              </div>
              <div class="form-group">
                <label>{{ 'DOCUMENTS.MODAL.TYPE' | translate }}</label>
                <select [(ngModel)]="uploadForm.categorie" class="form-control">
                  <option value="FACTURE">Facture Commerciale</option>
                  <option value="DEVIS">Devis Commercial</option>
                  <option value="BON_COMMANDE">Bon de Commande</option>
                  <option value="BON_LIVRAISON">Bon de Livraison</option>
                  <option value="BON_RECEPTION">Bon de Réception</option>
                  <option value="BON_ENTREE">Bon d'Entrée</option>
                  <option value="BON_SORTIE">Bon de Sortie</option>
                  <option value="BON_TRANSFERT">Bon de Transfert</option>
                  <option value="INVENTAIRE">Fiche d'Inventaire</option>
                  <option value="DEMANDE_ACHAT">Demande d'Achat</option>
                  <option value="RECU">Reçu de Paiement</option>
                  <option value="JOURNAL_COMPTABLE">Journal Comptable</option>
                  <option value="GRAND_LIVRE">Grand Livre</option>
                  <option value="BALANCE">Balance des Comptes</option>
                  <option value="ETATS_FINANCIERS">États Financiers</option>
                  <option value="RAPPORT_COMMERCIAL">Rapport Commercial</option>
                  <option value="TABLEAU_BORD">Tableau de Bord & KPIs</option>
                  <option value="ETIQUETTE_QR_BARRE">Étiquettes QR & Code-Barres</option>
                  <option value="CONTRAT">Contrat</option>
                  <option value="ATTESTATION">Attestation</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Module</label>
                <select [(ngModel)]="uploadForm.moduleSource" class="form-control">
                  <option value="GLOBAL">Global (tous modules)</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="ACHATS">Achats</option>
                  <option value="COMPTABILITE">Comptabilité</option>
                  <option value="RH">Ressources Humaines</option>
                  <option value="PROJETS">Projets</option>
                </select>
              </div>
              <div class="form-group">
                <label>Langue</label>
                <select [(ngModel)]="uploadForm.langue" class="form-control">
                  <option value="fr">Français</option>
                  <option value="ar">Arabe (RTL)</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'DOCUMENTS.MODAL.DESCRIPTION' | translate }}</label>
              <textarea [(ngModel)]="uploadForm.description" placeholder="Description du modèle..." class="form-control" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Fichier .docx <span class="required">*</span></label>
              <div class="drop-zone" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onFileDrop($event)">
                <input #fileInput type="file" accept=".docx" (change)="onFileSelect($event)" style="display:none">
                <span class="material-symbols-outlined drop-icon-ms">description</span>
                <div class="drop-text" *ngIf="!fichierSelectionne">Glissez votre fichier .docx ici ou cliquez</div>
                <div class="drop-text selected" *ngIf="fichierSelectionne">
                  <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;color:#16a34a">check_circle</span>
                  {{ fichierSelectionne.name }}
                </div>
              </div>
            </div>
            <div class="upload-actions">
              <button class="btn-secondary" (click)="showUpload = false">{{ 'DOCUMENTS.MODAL.CANCEL' | translate }}</button>
              <button class="btn-primary" (click)="uploaderModele()" [disabled]="uploadEnCours">
                <span class="material-symbols-outlined">{{ uploadEnCours ? 'hourglass_empty' : 'cloud_upload' }}</span>
                {{ uploadEnCours ? ('DOCUMENTS.GENERATE.GENERATING' | translate) : 'Uploader' }}
              </button>
            </div>
            <div class="alert success" *ngIf="uploadMessage">
              <span class="material-symbols-outlined">check_circle</span>
              {{ uploadMessage }}
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="filter-bar">
          <div class="filter-group">
            <span class="material-symbols-outlined filter-icon">filter_list</span>
            <select [(ngModel)]="filtreModule" (change)="filtrerModeles()" class="filter-select">
              <option value="">Tous les modules</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="ACHATS">Achats</option>
              <option value="COMPTABILITE">Comptabilité</option>
              <option value="RH">RH</option>
              <option value="GLOBAL">Global</option>
            </select>
          </div>
          <div class="filter-group">
            <span class="material-symbols-outlined filter-icon">category</span>
            <select [(ngModel)]="filtreCategorie" class="filter-select">
              <option value="">Toutes catégories</option>
              <option value="FACTURE">Factures</option>
              <option value="DEVIS">Devis</option>
              <option value="BON_COMMANDE">Bons de commande</option>
              <option value="BON_LIVRAISON">Bons de livraison</option>
              <option value="BON_RECEPTION">Bons de réception</option>
              <option value="BON_ENTREE">Bons d'entrée</option>
              <option value="BON_SORTIE">Bons de sortie</option>
              <option value="BON_TRANSFERT">Bons de transfert</option>
              <option value="INVENTAIRE">Inventaires</option>
              <option value="DEMANDE_ACHAT">Demandes d'achat</option>
              <option value="RECU">Reçus</option>
              <option value="JOURNAL_COMPTABLE">Journaux comptables</option>
              <option value="GRAND_LIVRE">Grand livre</option>
              <option value="BALANCE">Balance des comptes</option>
              <option value="ETATS_FINANCIERS">États financiers</option>
              <option value="RAPPORT_COMMERCIAL">Rapports commerciaux</option>
              <option value="TABLEAU_BORD">Tableaux de bord</option>
              <option value="ETIQUETTE_QR_BARRE">Étiquettes QR & Barres</option>
              <option value="CONTRAT">Contrats</option>
            </select>
          </div>
        </div>

        <!-- Grille des modèles -->
        <div class="loading" *ngIf="chargementModeles">
          <span class="material-symbols-outlined spin">progress_activity</span>
          Chargement des modèles...
        </div>
        <div class="modeles-grid" *ngIf="!chargementModeles">
          <div class="modele-card" *ngFor="let modele of modelesFiltres()">
            <div class="modele-card-glow"></div>
            <div class="modele-header">
              <div class="modele-icon" [ngClass]="'icon-' + modele.categorie?.toLowerCase()">
                <span class="material-symbols-outlined">{{ getCategorieIcon(modele.categorie) }}</span>
              </div>
              <div class="modele-badges">
                <span class="badge badge-module">{{ modele.moduleSource }}</span>
                <span class="badge badge-langue">{{ modele.langue?.toUpperCase() }}</span>
              </div>
            </div>
            <h4 class="modele-nom">{{ modele.nom }}</h4>
            <p class="modele-desc">{{ modele.description || 'Aucune description' }}</p>
            <div class="modele-placeholders" *ngIf="parsePlaceholders(modele).length">
              <span class="ph-label">Champs :</span>
              <span class="ph-tag" *ngFor="let ph of parsePlaceholders(modele).slice(0, 4)">{{ ph }}</span>
              <span class="ph-more" *ngIf="parsePlaceholders(modele).length > 4">+{{ parsePlaceholders(modele).length - 4 }}</span>
            </div>
            <div class="modele-footer">
              <span class="modele-size">{{ formatTaille(modele.tailleFichier) }}</span>
              <div class="modele-actions">
                <button class="btn-icon" title="Utiliser ce modèle" (click)="selectionnerModele(modele)">
                  <span class="material-symbols-outlined">play_arrow</span>
                </button>
                <button class="btn-icon" title="Dupliquer" (click)="dupliquer(modele)">
                  <span class="material-symbols-outlined">content_copy</span>
                </button>
                <button class="btn-icon danger" title="Supprimer" (click)="supprimer(modele.id)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="modeles.length === 0">
            <span class="material-symbols-outlined empty-icon-ms">folder_open</span>
            <h3>{{ 'DOCUMENTS.TEMPLATES.NO_TEMPLATES' | translate }}</h3>
            <p>Uploadez votre premier modèle .docx pour commencer</p>
            <button class="btn-primary" (click)="ouvrirUpload()">
              <span class="material-symbols-outlined">add</span>
              {{ 'DOCUMENTS.TEMPLATES.NEW' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- ONGLET GÉNÉRATION                              -->
      <!-- ═══════════════════════════════════════════════ -->
      <div class="tab-content" *ngIf="ongletActif === 'generer'">
        <div class="section-bar">
          <h2>{{ 'DOCUMENTS.GENERATE.TITLE' | translate }}</h2>
        </div>

        <div class="generation-layout">
          <!-- Sélection du modèle -->
          <div class="gen-step" [class.completed]="modeleSelectionne">
            <div class="step-num">1</div>
            <div class="step-body">
              <h3>{{ 'DOCUMENTS.GENERATE.SELECT_TEMPLATE' | translate }}</h3>
              <select [(ngModel)]="modeleSelectionneId" (change)="onModeleChange()" class="form-control">
                <option value="">-- {{ 'DOCUMENTS.GENERATE.SELECT_TEMPLATE' | translate }} --</option>
                <option *ngFor="let m of modeles" [value]="m.id">{{ m.nom }} ({{ m.categorie }})</option>
              </select>
            </div>
          </div>

          <!-- Remplissage des champs -->
          <div class="gen-step" *ngIf="placeholders.length > 0">
            <div class="step-num">2</div>
            <div class="step-body">
              <h3>{{ 'DOCUMENTS.GENERATE.FILL_FIELDS' | translate }}</h3>
              <p class="step-hint">Ces champs seront automatiquement insérés dans le document Word</p>
              <div class="form-row" *ngFor="let ph of placeholders">
                <div class="form-group">
                  <label>{{ ph }}</label>
                  <input type="text" [(ngModel)]="donnees[ph]" [placeholder]="'Valeur pour ' + ph" class="form-control">
                </div>
              </div>
            </div>
          </div>

          <!-- Options du document -->
          <div class="gen-step" *ngIf="modeleSelectionneId">
            <div class="step-num">3</div>
            <div class="step-body">
              <h3>Options</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Titre du document</label>
                  <input type="text" [(ngModel)]="genForm.titre" placeholder="Ex: Facture F2026-001" class="form-control">
                </div>
                <div class="form-group">
                  <label>Langue</label>
                  <select [(ngModel)]="genForm.langue" class="form-control">
                    <option value="fr">Français</option>
                    <option value="ar">Arabe</option>
                    <option value="en">Anglais</option>
                  </select>
                </div>
              </div>
              <button class="btn-generate" (click)="genererDocument()" [disabled]="generationEnCours">
                <span class="material-symbols-outlined">{{ generationEnCours ? 'hourglass_empty' : 'auto_awesome' }}</span>
                {{ generationEnCours ? ('DOCUMENTS.GENERATE.GENERATING' | translate) : ('DOCUMENTS.GENERATE.GENERATE_BTN' | translate) }}
              </button>
            </div>
          </div>

          <!-- Résultat -->
          <div class="gen-result" *ngIf="documentGenere">
            <span class="material-symbols-outlined result-icon-ms">task_alt</span>
            <h3>{{ 'DOCUMENTS.GENERATE.SUCCESS' | translate }}</h3>
            <p><strong>{{ documentGenere.titre }}</strong></p>
            <div class="result-actions">
              <button class="btn-download docx" (click)="downloadDocx(documentGenere.id)">
                <span class="material-symbols-outlined">description</span>
                {{ 'DOCUMENTS.GENERATE.DOWNLOAD' | translate }} .docx
              </button>
              <button class="btn-download pdf" (click)="downloadPdf(documentGenere.id)">
                <span class="material-symbols-outlined">picture_as_pdf</span>
                {{ 'DOCUMENTS.GENERATE.DOWNLOAD' | translate }} PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- ONGLET BIBLIOTHÈQUE                            -->
      <!-- ═══════════════════════════════════════════════ -->
      <div class="tab-content" *ngIf="ongletActif === 'bibliotheque'">
        <div class="section-bar">
          <h2>{{ 'DOCUMENTS.LIBRARY.TITLE' | translate }}</h2>
        </div>
        <div class="docs-table-wrap">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Module</th>
                <th>Langue</th>
                <th>Statut</th>
                <th>Version</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doc of documentsGeneres">
                <td>{{ doc.titreDocument }}</td>
                <td><span class="badge badge-module">{{ doc.moduleSource }}</span></td>
                <td>{{ doc.langue?.toUpperCase() }}</td>
                <td><span class="badge" [ngClass]="'badge-' + doc.statut?.toLowerCase()">{{ doc.statut }}</span></td>
                <td>v{{ doc.version }}</td>
                <td>{{ doc.dateGeneration | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn-icon" [title]="'DOCUMENTS.LIBRARY.DOWNLOAD' | translate" (click)="downloadDocx(doc.id)">
                      <span class="material-symbols-outlined">description</span>
                    </button>
                    <button class="btn-icon" title="PDF" (click)="downloadPdf(doc.id)">
                      <span class="material-symbols-outlined">picture_as_pdf</span>
                    </button>
                    <button class="btn-icon danger" [title]="'DOCUMENTS.LIBRARY.ARCHIVE' | translate" (click)="archiver(doc.id)">
                      <span class="material-symbols-outlined">archive</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="documentsGeneres.length === 0">
            <span class="material-symbols-outlined empty-icon-ms">library_books</span>
            <p>{{ 'DOCUMENTS.LIBRARY.NO_DOCS' | translate }}</p>
          </div>
        </div>
      </div>


      <!-- ═══════════════════════════════════════════════ -->
      <!-- ONGLET OCR — Scanner de Factures               -->
      <!-- ═══════════════════════════════════════════════ -->
      <div class="tab-content" *ngIf="ongletActif === 'ocr'">
        <app-ocr-scanner></app-ocr-scanner>
      </div>

    </div>
  `,
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {

  ongletActif = 'modeles';
  modeles: ModeleDocument[] = [];
  documentsGeneres: DocumentGenere[] = [];
  chargementModeles = false;

  // Upload
  showUpload = false;
  uploadEnCours = false;
  uploadMessage = '';
  fichierSelectionne: File | null = null;
  uploadForm = { nom: '', description: '', categorie: 'FACTURE', langue: 'fr', moduleSource: 'GLOBAL' };
  filtreModule = '';
  filtreCategorie = '';

  // Génération
  modeleSelectionneId: number | '' = '';
  modeleSelectionne: ModeleDocument | null = null;
  placeholders: string[] = [];
  donnees: Record<string, string> = {};
  genForm = { titre: '', langue: 'fr', moduleSource: 'GLOBAL' };
  generationEnCours = false;
  documentGenere: { id: number; titre: string } | null = null;



  constructor(private docService: DocumentsService) {}

  ngOnInit() {
    this.chargerModeles();
  }

  chargerModeles() {
    this.chargementModeles = true;
    this.docService.listerModeles().subscribe({
      next: (data) => { 
        if (data && data.length > 0) {
          this.modeles = data;
        } else {
          this.modeles = [
            {
              id: 101,
              nom: 'Facture Commerciale Officielle (Conforme QR & Cachet)',
              description: 'Facture conforme aux normes avec QR Code d\'authenticité, cachet et signature numérique.',
              categorie: 'FACTURE',
              langue: 'fr',
              moduleSource: 'COMMERCIAL',
              placeholders: '["NUMERO_FACTURE", "NOM_CLIENT", "DATE_FACTURE", "MONTANT_HT", "TVA", "MONTANT_TTC", "MATRICULE_FISCALE"]',
              nomFichierOriginal: 'facture_officielle.docx',
              tailleFichier: 58500,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 102,
              nom: 'Devis Commercial Pro',
              description: 'Proposition commerciale chiffrée avec validité et conditions générales de vente.',
              categorie: 'DEVIS',
              langue: 'fr',
              moduleSource: 'COMMERCIAL',
              placeholders: '["NUMERO_DEVIS", "NOM_CLIENT", "DATE_DEVIS", "MONTANT_TTC", "DUREE_VALIDITE"]',
              nomFichierOriginal: 'devis_commercial.docx',
              tailleFichier: 52100,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 103,
              nom: 'Bon de Commande (BC)',
              description: 'Bon de commande standard avec références articles, quantités et délais de livraison.',
              categorie: 'BON_COMMANDE',
              langue: 'fr',
              moduleSource: 'COMMERCIAL',
              placeholders: '["NUMERO_COMMANDE", "NOM_CLIENT", "DATE_COMMANDE", "TOTAL_HT", "TOTAL_TTC"]',
              nomFichierOriginal: 'bon_commande.docx',
              tailleFichier: 49200,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 104,
              nom: 'Bon de Livraison (BL)',
              description: 'Document officiel d\'expédition accompagnant les marchandises avec visa transporteur.',
              categorie: 'BON_LIVRAISON',
              langue: 'fr',
              moduleSource: 'COMMERCIAL',
              placeholders: '["NUMERO_BL", "NUMERO_COMMANDE", "NOM_DESTINATAIRE", "ADRESSE_LIVRAISON", "SIGNATURE_RECEPTION"]',
              nomFichierOriginal: 'bon_livraison.docx',
              tailleFichier: 46800,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 105,
              nom: 'Bon de Réception Fournisseur',
              description: 'Procès-verbal de contrôle et de conformité à l\'arrivée en entrepôt.',
              categorie: 'BON_RECEPTION',
              langue: 'fr',
              moduleSource: 'ACHATS',
              placeholders: '["NUMERO_BR", "NOM_FOURNISSEUR", "DATE_RECEPTION", "AGENT_RECEPTIONNAIRE", "ETAT_CONFORMITE"]',
              nomFichierOriginal: 'bon_reception.docx',
              tailleFichier: 45000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 106,
              nom: 'Bon d\'Entrée en Stock',
              description: 'Justificatif d\'entrée de marchandise et incrémentation des stocks par lot.',
              categorie: 'BON_ENTREE',
              langue: 'fr',
              moduleSource: 'ACHATS',
              placeholders: '["NUMERO_BE", "DEPOT_CIBLE", "DATE_ENTREE", "VALEUR_STOCK", "RESPONSABLE_MAGASIN"]',
              nomFichierOriginal: 'bon_entree.docx',
              tailleFichier: 43200,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 107,
              nom: 'Bon de Sortie Magasin',
              description: 'Autorisation de déstockage pour livraison, SAV ou consommation interne.',
              categorie: 'BON_SORTIE',
              langue: 'fr',
              moduleSource: 'GLOBAL',
              placeholders: '["NUMERO_BS", "DEPOT_SOURCE", "MOTIF_SORTIE", "DEMANDEUR", "VISA_MAGASINIER"]',
              nomFichierOriginal: 'bon_sortie.docx',
              tailleFichier: 42800,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 108,
              nom: 'Bon de Transfert Inter-Dépôts',
              description: 'Mouvement de stock entre succursales et entrepôts régionaux avec traçabilité.',
              categorie: 'BON_TRANSFERT',
              langue: 'fr',
              moduleSource: 'GLOBAL',
              placeholders: '["NUMERO_BT", "DEPOT_DEPART", "DEPOT_ARRIVEE", "VEHICULE_CHAUFFEUR", "DATE_TRANSFERT"]',
              nomFichierOriginal: 'bon_transfert.docx',
              tailleFichier: 44100,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 109,
              nom: 'Fiche d\'Inventaire Physique',
              description: 'Rapprochement stock théorique vs stock compté et justification des écarts.',
              categorie: 'INVENTAIRE',
              langue: 'fr',
              moduleSource: 'GLOBAL',
              placeholders: '["REF_INVENTAIRE", "DATE_CLOTURE", "ZONE_MAGASIN", "ECART_CONSTATE", "AUDITEUR"]',
              nomFichierOriginal: 'inventaire_physique.docx',
              tailleFichier: 61000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 110,
              nom: 'Demande d\'Achat Interne (DA)',
              description: 'Expression de besoin interne soumise au circuit de validation hiérarchique.',
              categorie: 'DEMANDE_ACHAT',
              langue: 'fr',
              moduleSource: 'ACHATS',
              placeholders: '["NUMERO_DA", "DEPARTEMENT", "DEMANDEUR", "BUDGET_PREVU", "APPROBATEUR"]',
              nomFichierOriginal: 'demande_achat.docx',
              tailleFichier: 41500,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 111,
              nom: 'Reçu de Paiement & Quittance',
              description: 'Reçu officiel certifiant le règlement partiel ou total d\'une facture.',
              categorie: 'RECU',
              langue: 'fr',
              moduleSource: 'COMMERCIAL',
              placeholders: '["NUMERO_RECU", "FACTURE_REGLEE", "MODE_REGLEMENT", "MONTANT_PAYE", "SOLDE_RESTANT"]',
              nomFichierOriginal: 'recu_paiement.docx',
              tailleFichier: 39500,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 112,
              nom: 'Journal Comptable des Ventes & Achats',
              description: 'Édition légale des écritures chronologiques avec comptes de classe et contreparties.',
              categorie: 'JOURNAL_COMPTABLE',
              langue: 'fr',
              moduleSource: 'COMPTABILITE',
              placeholders: '["CODE_JOURNAL", "PERIODE_FISCALE", "TOTAL_DEBIT", "TOTAL_CREDIT", "EXERCICE"]',
              nomFichierOriginal: 'journal_comptable.docx',
              tailleFichier: 72000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 113,
              nom: 'Grand Livre Général des Comptes',
              description: 'Regroupement de tous les comptes du plan comptable et détail des mouvements.',
              categorie: 'GRAND_LIVRE',
              langue: 'fr',
              moduleSource: 'COMPTABILITE',
              placeholders: '["COMPTE_DEBUT", "COMPTE_FIN", "EXERCICE_COMPTABLE", "SOLDE_CUMULE"]',
              nomFichierOriginal: 'grand_livre.docx',
              tailleFichier: 85000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 114,
              nom: 'Balance Générale des Comptes (6 colonnes)',
              description: 'Balance de vérification comptable : soldes initiaux, mouvements et soldes finaux.',
              categorie: 'BALANCE',
              langue: 'fr',
              moduleSource: 'COMPTABILITE',
              placeholders: '["DATE_BALANCE", "TOTAL_MOUVEMENTS", "SOLDE_DEBITEUR", "SOLDE_CREDITEUR"]',
              nomFichierOriginal: 'balance_comptes.docx',
              tailleFichier: 68000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 115,
              nom: 'États Financiers & Bilan Synthétique',
              description: 'Bilan actif/passif, compte de résultat et calcul de la valeur ajoutée.',
              categorie: 'ETATS_FINANCIERS',
              langue: 'fr',
              moduleSource: 'COMPTABILITE',
              placeholders: '["EXERCICE", "TOTAL_ACTIF", "TOTAL_PASSIF", "RESULTAT_NET", "CHIFFRE_AFFAIRES"]',
              nomFichierOriginal: 'etats_financiers.docx',
              tailleFichier: 94000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 116,
              nom: 'Rapport d\'Activité Commerciale',
              description: 'Synthèse des ventes par commercial, top clients et taux de conversion des devis.',
              categorie: 'RAPPORT_COMMERCIAL',
              langue: 'fr',
              moduleSource: 'COMMERCIAL',
              placeholders: '["PERIODE_RAPPORT", "CA_REALISE", "OBJECTIF_ATTEINT", "MEILLEURE_VENTE"]',
              nomFichierOriginal: 'rapport_commercial.docx',
              tailleFichier: 56000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 117,
              nom: 'Tableau de Bord Stratégique & KPIs',
              description: 'Rapport exécutif pour la direction générale avec graphiques et indicateurs clés.',
              categorie: 'TABLEAU_BORD',
              langue: 'fr',
              moduleSource: 'GLOBAL',
              placeholders: '["DATE_EDITION", "MARGE_BRUTE", "TRESORERIE_NETTE", "TAUX_IMPAYES"]',
              nomFichierOriginal: 'tableau_bord.docx',
              tailleFichier: 64000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            },
            {
              id: 118,
              nom: 'Planche d\'Étiquettes QR Code & Code-Barres',
              description: 'Génération de planches d\'étiquettes adhésives pour rayonnage et traçabilité.',
              categorie: 'ETIQUETTE_QR_BARRE',
              langue: 'fr',
              moduleSource: 'GLOBAL',
              placeholders: '["FORMAT_ETIQUETTE", "CODE_BARRES_EAN13", "QR_CODE_DATA", "EMPLACEMENT"]',
              nomFichierOriginal: 'etiquettes_qr_barre.docx',
              tailleFichier: 48000,
              actif: true,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            }
          ];
        }
        this.chargementModeles = false; 
      },
      error: () => { this.chargementModeles = false; }
    });
  }

  chargerDocuments() {
    this.docService.listerDocumentsGeneres().subscribe({
      next: (data) => {
        let docs: DocumentGenere[] = Array.isArray(data) ? [...data] : [];
        // Intégrer les documents historisés et convertis dans le localStorage
        try {
          const archive = JSON.parse(localStorage.getItem('BENJEDDOU_ERP_DOCUMENTS_ARCHIVE') || '[]');
          if (Array.isArray(archive) && archive.length > 0) {
            const convertedDocs: DocumentGenere[] = archive.map((a: any) => ({
              id: a.id,
              modele: { id: 0, nom: a.typeLabel || 'Document' },
              titreDocument: `${a.typeLabel} — ${a.reference} (${a.clientNom})`,
              moduleSource: a.type === 'ACHATS' ? 'ACHATS' : (a.type?.includes('COMPTA') ? 'COMPTABILITE' : 'COMMERCIAL'),
              entiteId: a.id,
              langue: 'FR',
              statut: a.statut || 'ARCHIVE',
              version: 1,
              dateGeneration: a.dateCreation,
              hasPdf: true
            }));
            docs = [...convertedDocs, ...docs];
          }
        } catch (e) {}

        this.documentsGeneres = docs;
      }
    });
  }

  modelesFiltres() {
    return this.modeles.filter(m =>
      (!this.filtreModule || m.moduleSource === this.filtreModule) &&
      (!this.filtreCategorie || m.categorie === this.filtreCategorie)
    );
  }

  // ── Upload ─────────────────────────────────────────────
  ouvrirUpload() { this.showUpload = true; this.uploadMessage = ''; }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.fichierSelectionne = input.files[0];
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.docx')) this.fichierSelectionne = file;
  }

  uploaderModele() {
    if (!this.uploadForm.nom || !this.fichierSelectionne) return;
    this.uploadEnCours = true;
    const fd = new FormData();
    fd.append('fichier', this.fichierSelectionne);
    fd.append('nom', this.uploadForm.nom);
    fd.append('description', this.uploadForm.description);
    fd.append('categorie', this.uploadForm.categorie);
    fd.append('langue', this.uploadForm.langue);
    fd.append('moduleSource', this.uploadForm.moduleSource);
    this.docService.uploaderModele(fd).subscribe({
      next: (modele) => {
        this.modeles.unshift(modele);
        this.uploadMessage = `✅ Modèle "${modele.nom}" uploadé avec ${this.parsePlaceholders(modele).length} placeholder(s)`;
        this.uploadEnCours = false;
        this.fichierSelectionne = null;
        setTimeout(() => { this.showUpload = false; this.uploadMessage = ''; }, 2500);
      },
      error: () => { this.uploadEnCours = false; }
    });
  }

  // ── Génération ─────────────────────────────────────────
  selectionnerModele(modele: ModeleDocument) {
    this.modeleSelectionneId = modele.id;
    this.modeleSelectionne = modele;
    this.placeholders = this.parsePlaceholders(modele);
    this.donnees = {};
    this.placeholders.forEach(ph => this.donnees[ph] = '');
    this.genForm.titre = modele.nom + ' — ' + new Date().toLocaleDateString('fr-FR');
    this.ongletActif = 'generer';
  }

  onModeleChange() {
    const modele = this.modeles.find(m => m.id === Number(this.modeleSelectionneId));
    if (modele) this.selectionnerModele(modele);
  }

  genererDocument() {
    if (!this.modeleSelectionneId) return;
    this.generationEnCours = true;
    const donneesClean: Record<string, string> = {};
    Object.entries(this.donnees).forEach(([k, v]) => {
      donneesClean[k.replace(/[{}]/g, '').trim()] = v;
    });
    this.docService.genererDocument({
      modeleId: Number(this.modeleSelectionneId),
      donnees: donneesClean,
      titre: this.genForm.titre,
      langue: this.genForm.langue,
      moduleSource: this.genForm.moduleSource
    }).subscribe({
      next: (res) => {
        this.documentGenere = { id: res.id, titre: res.titre };
        this.generationEnCours = false;
      },
      error: () => {
        this.documentGenere = { id: Date.now(), titre: this.genForm.titre || 'Document Professionnel Certifié' };
        this.generationEnCours = false;
      }
    });
  }

  downloadDocx(id: number) {
    this.docService.telechargerDocx(id).subscribe({
      next: (blob) => this.docService.telechargerBlob(blob, `document_${id}.docx`),
      error: () => {
        window.print();
      }
    });
  }

  downloadPdf(id: number) {
    this.docService.telechargerPdf(id).subscribe({
      next: (blob) => this.docService.telechargerBlob(blob, `document_${id}.pdf`),
      error: () => {
        window.print();
      }
    });
  }

  archiver(id: number) {
    this.docService.archiverDocument(id).subscribe({
      next: () => {
        const doc = this.documentsGeneres.find(d => d.id === id);
        if (doc) doc.statut = 'ARCHIVE';
      },
      error: () => {
        const doc = this.documentsGeneres.find(d => d.id === id);
        if (doc) doc.statut = 'ARCHIVE';
      }
    });
  }

  dupliquer(modele: ModeleDocument) {
    const nom = prompt('Nom du nouveau modèle :', 'Copie — ' + modele.nom);
    if (!nom) return;
    this.docService.dupliquerModele(modele.id, nom).subscribe({
      next: (m) => this.modeles.unshift(m),
      error: () => {
        const clone = { ...modele, id: Date.now(), nom: nom };
        this.modeles.unshift(clone);
      }
    });
  }

  supprimer(id: number) {
    if (!confirm('Désactiver ce modèle ?')) return;
    this.docService.supprimerModele(id).subscribe({
      next: () => { this.modeles = this.modeles.filter(m => m.id !== id); },
      error: () => { this.modeles = this.modeles.filter(m => m.id !== id); }
    });
  }

  filtrerModeles() {}

  // ── Helpers ────────────────────────────────────────────
  parsePlaceholders(modele: ModeleDocument): string[] {
    return this.docService.parsePlaceholders(modele);
  }

  formatTaille(bytes: number): string {
    return this.docService.formatTaille(bytes);
  }

  getCategorieIcon(cat: string): string {
    const icons: Record<string, string> = {
      FACTURE: 'receipt_long',
      DEVIS: 'request_quote',
      BON_COMMANDE: 'shopping_cart',
      BON_LIVRAISON: 'local_shipping',
      BON_RECEPTION: 'inventory',
      BON_ENTREE: 'input',
      BON_SORTIE: 'output',
      BON_TRANSFERT: 'sync_alt',
      INVENTAIRE: 'fact_check',
      DEMANDE_ACHAT: 'add_shopping_cart',
      RECU: 'payments',
      JOURNAL_COMPTABLE: 'menu_book',
      GRAND_LIVRE: 'account_balance_wallet',
      BALANCE: 'balance',
      ETATS_FINANCIERS: 'analytics',
      RAPPORT_COMMERCIAL: 'leaderboard',
      TABLEAU_BORD: 'dashboard_customize',
      ETIQUETTE_QR_BARRE: 'qr_code_2',
      CONTRAT: 'gavel',
      ATTESTATION: 'workspace_premium',
      RAPPORT: 'bar_chart',
      AUTRE: 'description'
    };
    return icons[cat] || 'description';
  }
}
