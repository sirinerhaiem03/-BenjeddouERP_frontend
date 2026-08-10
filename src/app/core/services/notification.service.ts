import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StockService } from './stock.service';
import { CommercialService } from './commercial.service';
import { Router } from '@angular/router';

export interface AppNotification {
  id: string;
  type: 'stock' | 'commercial' | 'facture' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  icon: string;
  severity: 'danger' | 'warning' | 'info' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();

  constructor(
    private stockService: StockService,
    private commercialService: CommercialService,
    private router: Router
  ) {
    this.refreshNotifications();
    // Rafraîchissement automatique toutes les 30 secondes
    setInterval(() => this.refreshNotifications(), 30000);
  }

  /**
   * Recharge les notifications système réelles (Stock critique, Devis, Factures impayées)
   */
  public refreshNotifications(): void {
    const list: AppNotification[] = [];

    // 1. Alertes Stock (Produits en rupture ou stock bas)
    this.stockService.getProducts().subscribe({
      next: (products) => {
        (products || []).forEach(p => {
          const qty = p.quantiteStock ?? p.stockActuel ?? 0;
          const min = p.seuilStockMin ?? 5;

          if (qty === 0) {
            list.push({
              id: `stock-empty-${p.id}`,
              type: 'stock',
              title: 'Rupture de Stock Critique !',
              message: `Le produit "${p.nom}" (${p.reference}) est totalement épuisé (0 en stock).`,
              timestamp: new Date(),
              read: false,
              link: `/dashboard/products?tab=products&search=${encodeURIComponent(p.reference || p.nom)}`,
              icon: 'cancel',
              severity: 'danger'
            });
          } else if (qty <= min) {
            list.push({
              id: `stock-low-${p.id}`,
              type: 'stock',
              title: 'Alerte Stock Seuil Min',
              message: `Stock faible pour "${p.nom}" : ${qty} restant(s) (Seuil: ${min}).`,
              timestamp: new Date(),
              read: false,
              link: `/dashboard/products?tab=products&search=${encodeURIComponent(p.reference || p.nom)}`,
              icon: 'warning',
              severity: 'warning'
            });
          }
        });
        this.appendCommercialNotifications(list);
      },
      error: () => {
        this.appendCommercialNotifications(list);
      }
    });
  }

  private appendCommercialNotifications(currentList: AppNotification[]): void {
    // 2. Alertes Factures (Factures impayées / en retard)
    this.commercialService.getFactures().subscribe({
      next: (factures) => {
        const today = new Date();
        (factures || []).forEach(f => {
          if (f.statut === 'IMPAYEE' || f.statut === 'EN_ATTENTE') {
            const echeance = f.dateEcheance ? new Date(f.dateEcheance) : null;
            if (echeance && echeance < today) {
              currentList.push({
                id: `facture-retard-${f.id}`,
                type: 'facture',
                title: 'Facture en Retard de Paiement',
                message: `La facture ${f.numeroFacture} (${f.montantTotal} TND) de ${f.commande?.client?.nom || 'Client'} a dépassé l'échéance.`,
                timestamp: new Date(f.dateEcheance),
                read: false,
                link: `/dashboard/commercial?tab=factures&search=${encodeURIComponent(f.numeroFacture || '')}`,
                icon: 'notification_important',
                severity: 'danger'
              });
            }
          }
        });
        this.appendDevisNotifications(currentList);
      },
      error: () => {
        this.appendDevisNotifications(currentList);
      }
    });
  }

  private appendDevisNotifications(currentList: AppNotification[]): void {
    // 3. Demandes de Devis Client récentes
    this.commercialService.getDevis().subscribe({
      next: (devis) => {
        (devis || []).forEach(d => {
          if (d.statut === 'DEMANDE_CLIENT') {
            currentList.push({
              id: `devis-demande-${d.id}`,
              type: 'commercial',
              title: 'Nouvelle Demande Client Reçue 📩',
              message: `Demande de devis "${d.objet || d.reference}" soumise par ${d.client?.nom || 'un client'}.`,
              timestamp: new Date(d.dateDevis || Date.now()),
              read: false,
              link: `/dashboard/commercial?tab=devis&search=${encodeURIComponent(d.reference || d.objet || '')}`,
              icon: 'mark_email_unread',
              severity: 'info'
            });
          }
        });

        // 4. Notification bienvenue / système
        if (currentList.length === 0) {
          currentList.push({
            id: 'sys-welcome',
            type: 'system',
            title: 'Système Opérationnel',
            message: 'Tous les stocks, devis et factures sont conformes.',
            timestamp: new Date(),
            read: true,
            icon: 'check_circle',
            severity: 'success'
          });
        }

        // Mettre à jour le Subject (garder l'état lu/non lu de localStorage si présent)
        const savedReadIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
        const updated = currentList.map(n => ({
          ...n,
          read: savedReadIds.includes(n.id) ? true : n.read
        }));

        this.notificationsSubject.next(updated);
      },
      error: () => {
        this.notificationsSubject.next(currentList);
      }
    });
  }

  /**
   * Retourne le nombre de notifications non lues
   */
  public getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  /**
   * Marque une notification comme lue
   */
  public markAsRead(id: string): void {
    const savedReadIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
    if (!savedReadIds.includes(id)) {
      savedReadIds.push(id);
      localStorage.setItem('readNotificationIds', JSON.stringify(savedReadIds));
    }

    const current = this.notificationsSubject.value.map(n => n.id === id ? { ...n, read: true } : n);
    this.notificationsSubject.next(current);
  }

  /**
   * Marque toutes les notifications comme lues
   */
  public markAllAsRead(): void {
    const allIds = this.notificationsSubject.value.map(n => n.id);
    localStorage.setItem('readNotificationIds', JSON.stringify(allIds));

    const current = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(current);
  }

  /**
   * Efface toutes les notifications
   */
  public clearAll(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Navigue vers la page liée à la notification
   */
  public navigateTo(notification: AppNotification): void {
    this.markAsRead(notification.id);
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }
}
