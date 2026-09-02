import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiUrl}/documents`;

export interface ModeleDocument {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  langue: string;
  moduleSource: string;
  placeholders: string; // JSON string
  nomFichierOriginal: string;
  tailleFichier: number;
  actif: boolean;
  dateCreation: string;
  dateModification: string;
}

export interface DocumentGenere {
  id: number;
  modele?: { id: number; nom: string };
  titreDocument: string;
  moduleSource: string;
  entiteId?: number;
  langue: string;
  statut: 'GENERE' | 'SIGNE' | 'ARCHIVE' | string;
  version: number;
  dateGeneration: string;
  hasPdf?: boolean;
}

export interface OcrResultat {
  texte: string;
  methode: string;
  nomFichier: string;
  tailleFichier: number;
  langue: string;
}

export interface VersionDocument {
  id: number;
  numeroVersion: number;
  commentaire: string;
  dateCreation: string;
  modifiePar?: { id: number; nomUtilisateur: string };
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const token = user.token || user.accessToken || localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // ── Modèles ─────────────────────────────────────────────────────────
  listerModeles(module?: string): Observable<ModeleDocument[]> {
    const params = module ? `?module=${module}` : '';
    return this.http.get<ModeleDocument[]>(`${API_URL}/modeles${params}`, { headers: this.getHeaders() });
  }

  uploaderModele(formData: FormData): Observable<ModeleDocument> {
    return this.http.post<ModeleDocument>(`${API_URL}/modeles/upload`, formData, { headers: this.getHeaders() });
  }

  getPlaceholders(modeleId: number): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/modeles/${modeleId}/placeholders`, { headers: this.getHeaders() });
  }

  supprimerModele(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/modeles/${id}`, { headers: this.getHeaders() });
  }

  dupliquerModele(id: number, nom: string): Observable<ModeleDocument> {
    return this.http.post<ModeleDocument>(`${API_URL}/modeles/${id}/dupliquer`, { nom }, { headers: this.getHeaders() });
  }

  // ── Génération ───────────────────────────────────────────────────────
  genererDocument(payload: {
    modeleId: number;
    donnees: Record<string, string>;
    titre: string;
    moduleSource?: string;
    entiteId?: number;
    langue?: string;
  }): Observable<any> {
    return this.http.post(`${API_URL}/generer`, payload, { headers: this.getHeaders() });
  }

  listerDocumentsGeneres(): Observable<DocumentGenere[]> {
    return this.http.get<DocumentGenere[]>(`${API_URL}/generes`, { headers: this.getHeaders() });
  }

  documentsParEntite(module: string, entiteId: number): Observable<DocumentGenere[]> {
    return this.http.get<DocumentGenere[]>(`${API_URL}/generes/entite/${module}/${entiteId}`, { headers: this.getHeaders() });
  }

  telechargerDocx(id: number): Observable<Blob> {
    return this.http.get(`${API_URL}/generes/${id}/docx`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  telechargerPdf(id: number): Observable<Blob> {
    return this.http.get(`${API_URL}/generes/${id}/pdf`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  archiverDocument(id: number): Observable<any> {
    return this.http.put(`${API_URL}/generes/${id}/archiver`, {}, { headers: this.getHeaders() });
  }

  // ── OCR ──────────────────────────────────────────────────────────────
  ocrImage(fichier: File, langue = 'fr'): Observable<OcrResultat> {
    const fd = new FormData();
    fd.append('fichier', fichier);
    fd.append('langue', langue);
    return this.http.post<OcrResultat>(`${API_URL}/ocr/image`, fd, { headers: this.getHeaders() });
  }

  ocrPdf(fichier: File, langue = 'fr'): Observable<OcrResultat> {
    const fd = new FormData();
    fd.append('fichier', fichier);
    fd.append('langue', langue);
    return this.http.post<OcrResultat>(`${API_URL}/ocr/pdf`, fd, { headers: this.getHeaders() });
  }

  imageVersDocx(fichier: File, langue = 'fr'): Observable<Blob> {
    const fd = new FormData();
    fd.append('fichier', fichier);
    fd.append('langue', langue);
    return this.http.post(`${API_URL}/ocr/image-vers-docx`, fd, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  convertirDocumentVersWordComplet(fichier: File, langue = 'fr', preserverTableaux = true, preserverImages = true): Observable<Blob> {
    const fd = new FormData();
    fd.append('fichier', fichier);
    fd.append('langue', langue);
    fd.append('preserverTableaux', String(preserverTableaux));
    fd.append('preserverImages', String(preserverImages));
    return this.http.post(`${API_URL}/convertir-vers-word`, fd, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  // ── Versions ─────────────────────────────────────────────────────────
  listerVersions(documentId: number): Observable<VersionDocument[]> {
    return this.http.get<VersionDocument[]>(`${API_URL}/generes/${documentId}/versions`, { headers: this.getHeaders() });
  }

  sauvegarderVersion(documentId: number, commentaire: string): Observable<VersionDocument> {
    return this.http.post<VersionDocument>(
      `${API_URL}/generes/${documentId}/versions/sauvegarder`,
      { commentaire },
      { headers: this.getHeaders() }
    );
  }

  restaurerVersion(versionId: number): Observable<any> {
    return this.http.post(`${API_URL}/versions/${versionId}/restaurer`, {}, { headers: this.getHeaders() });
  }

  // ── Utilitaires ──────────────────────────────────────────────────────
  /** Déclenche le téléchargement d'un blob dans le navigateur */
  telechargerBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /** Parse les placeholders JSON depuis un modèle */
  parsePlaceholders(modele: ModeleDocument): string[] {
    try {
      return JSON.parse(modele.placeholders || '[]');
    } catch {
      return [];
    }
  }

  /** Formatte la taille d'un fichier en ko/Mo */
  formatTaille(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko';
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo';
  }
}
