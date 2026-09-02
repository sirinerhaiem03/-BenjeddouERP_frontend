import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sa-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sa-configuration.component.html',
  styleUrls: ['./sa-configuration.component.css']
})
export class SaConfigurationComponent {
  config = {
    modeMaintenance: false,
    maxEntreprises: 100,
    trialDureeJours: 30,
    smtpFrom: 'noreply@benjeddou.com',
    urlFrontend: 'http://localhost:4200',
    urlBackend: environment.backendUrl
  };

  saved = false;

  sauvegarder(): void {
    // Simulation sauvegarde
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }
}
