import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

type EtatPage = 'chargement' | 'succes' | 'deja_signale' | 'invalide' | 'erreur';

@Component({
  selector: 'app-signaler-connexion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './signaler-connexion.component.html',
  styleUrls: ['./signaler-connexion.component.css']
})
export class SignalerConnexionComponent implements OnInit {

  etat: EtatPage = 'chargement';
  messageServeur = '';
  erreurDebug = '';   // code HTTP exact pour diagnostic
  private apiUrl = 'http://localhost:9090/api';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.etat = 'invalide';
      return;
    }
    this.signalerConnexion(token);
  }

  private signalerConnexion(token: string): void {
    this.http.post<any>(
      `${this.apiUrl}/auth/signaler-connexion?token=${encodeURIComponent(token)}`,
      {}
    ).subscribe({
      next: (res) => {
        this.messageServeur = res.message || '';
        if (res.succes) {
          this.etat = this.messageServeur.includes('déjà') ? 'deja_signale' : 'succes';
        } else {
          this.etat = 'invalide';
        }
      },
      error: (err: HttpErrorResponse) => {
        const status  = err.status;
        const body    = JSON.stringify(err.error || {});
        this.erreurDebug = `Code HTTP: ${status} | Détails: ${body}`;
        console.error('[SIGNALEMENT] Erreur:', status, err.error);
        this.etat = 'erreur';
      }
    });
  }
}
