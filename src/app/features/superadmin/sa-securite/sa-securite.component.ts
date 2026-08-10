import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface BackupInfo {
  fichier: string;
  tailleMo: string;
  dateCreation: string;
  chiffree: boolean;
  algorithme: string;
}

interface SecuriteStatus {
  [key: string]: any;  // index signature — permet l'accès dynamique depuis le template
  authentification?: any;
  chiffrement?: any;
  sessions?: any;
  bruteForce?: any;
  headersHTTP?: any;
  auditLog?: any;
  rbac?: any;
  csrf?: any;
  chiffrementDonnees?: any;
  sauvegardes?: any;
}

@Component({
  selector: 'app-sa-securite',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sa-securite.component.html',
  styleUrls: ['./sa-securite.component.css']
})
export class SaSecuriteComponent implements OnInit {

  private apiUrl = 'http://localhost:9090/api/superadmin';

  // ── État des boutons ──────────────────────────────────────────────────
  loadingReset    = false;
  loadingBackup   = false;
  loadingStatus   = false;
  loadingListe    = false;
  loadingNettoyer = false;

  // ── Messages feedback ─────────────────────────────────────────────────
  msgReset:    { type: 'succes' | 'erreur'; texte: string } | null = null;
  msgBackup:   { type: 'succes' | 'erreur'; texte: string } | null = null;
  msgNettoyer: { type: 'succes' | 'erreur'; texte: string } | null = null;

  // ── Données ───────────────────────────────────────────────────────────
  securiteStatus: SecuriteStatus | null = null;
  derniereBackup: any = null;
  listeSauvegardes: BackupInfo[] = [];
  montrerListe = false;

  // ── Confirmation reset ────────────────────────────────────────────────
  showConfirmReset = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerStatutSecurite();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Statut de sécurité
  // ══════════════════════════════════════════════════════════════════════
  chargerStatutSecurite(): void {
    this.loadingStatus = true;
    this.http.get<any>(`${this.apiUrl}/securite/status`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.securiteStatus = res.securite;
          this.loadingStatus = false;
        },
        error: () => { this.loadingStatus = false; }
      });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Reset comptes démo
  // ══════════════════════════════════════════════════════════════════════
  demanderConfirmReset(): void {
    this.showConfirmReset = true;
    this.msgReset = null;
  }

  annulerReset(): void {
    this.showConfirmReset = false;
  }

  confirmerReset(): void {
    this.showConfirmReset = false;
    this.loadingReset = true;
    this.msgReset = null;

    this.http.post<any>(
      `${this.apiUrl}/reset-demo`,
      { confirmation: 'RESET_DEMO_CONFIRME' },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.loadingReset = false;
        this.msgReset = {
          type: 'succes',
          texte: `✅ ${res.message} — ${res.comptes?.length || 0} compte(s) traité(s).`
        };
        setTimeout(() => this.msgReset = null, 6000);
      },
      error: (err) => {
        this.loadingReset = false;
        this.msgReset = {
          type: 'erreur',
          texte: '❌ Erreur lors du reset : ' + (err.error?.message || err.message || 'Vérifiez que le backend est démarré.')
        };
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Sauvegarde manuelle
  // ══════════════════════════════════════════════════════════════════════
  declencherSauvegarde(): void {
    this.loadingBackup = true;
    this.msgBackup = null;

    this.http.post<any>(`${this.apiUrl}/backup/declencher`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.loadingBackup = false;
          this.derniereBackup = res;
          this.msgBackup = {
            type: 'succes',
            texte: `✅ Sauvegarde créée : ${res.fichier} (${res.tagilleKo || res.tailleMo} Ko) — Chiffrement : ${res.chiffrement}`
          };
          setTimeout(() => this.msgBackup = null, 8000);
          // Rafraîchir la liste
          if (this.montrerListe) this.chargerListeSauvegardes();
        },
        error: (err) => {
          this.loadingBackup = false;
          this.msgBackup = {
            type: 'erreur',
            texte: '❌ Erreur sauvegarde : ' + (err.error?.erreur || err.message || 'Vérifiez que le backend est démarré.')
          };
        }
      });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Liste des sauvegardes
  // ══════════════════════════════════════════════════════════════════════
  chargerListeSauvegardes(): void {
    this.loadingListe = true;
    this.montrerListe = true;

    this.http.get<any>(`${this.apiUrl}/backup/liste`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.listeSauvegardes = res.sauvegardes || [];
          this.loadingListe = false;
        },
        error: () => { this.loadingListe = false; }
      });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Nettoyer anciennes sauvegardes
  // ══════════════════════════════════════════════════════════════════════
  nettoyerSauvegardes(): void {
    this.loadingNettoyer = true;
    this.msgNettoyer = null;

    this.http.delete<any>(`${this.apiUrl}/backup/nettoyer`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.loadingNettoyer = false;
          this.msgNettoyer = { type: 'succes', texte: '✅ ' + res.message };
          if (this.montrerListe) this.chargerListeSauvegardes();
          setTimeout(() => this.msgNettoyer = null, 5000);
        },
        error: () => {
          this.loadingNettoyer = false;
          this.msgNettoyer = { type: 'erreur', texte: '❌ Erreur lors du nettoyage.' };
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatKey(key: string): string {
    const labels: Record<string, string> = {
      authentification: 'Authentification JWT',
      chiffrement: 'Chiffrement BCrypt',
      sessions: 'Gestion Sessions',
      bruteForce: 'Anti Brute Force',
      headersHTTP: 'Headers Sécurité HTTP',
      auditLog: 'Audit Log',
      rbac: 'RBAC (@PreAuthorize)',
      csrf: 'CSRF',
      chiffrementDonnees: 'Chiffrement Données',
      sauvegardes: 'Sauvegardes Auto',
      https: 'HTTPS'
    };
    return labels[key] || key;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('fr-FR');
    } catch { return dateStr; }
  }

  estDone(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'object' && value !== null) {
      const vals = Object.values(value);
      return vals.some(v => v === true || (typeof v === 'number' && v > 0));
    }
    const str = String(value);
    return !str.includes('TODO') && !str.includes('false');
  }
}
