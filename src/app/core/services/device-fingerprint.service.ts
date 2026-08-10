import { Injectable } from '@angular/core';

/**
 * DeviceFingerprintService
 * ─────────────────────────────────────────────────────────────────
 * Génère une empreinte numérique unique de l'appareil à partir de :
 *  - Attributs stables du navigateur (UA, platform, langue, timezone…)
 *  - Paramètres matériels (résolution, CPU, mémoire, couleurs)
 *  - Canvas fingerprint (rendu graphique unique par GPU/driver)
 *  - WebGL renderer (carte graphique)
 *  - Un identifiant stable persisté en localStorage (survit aux sessions)
 *
 * Résultat : hash SHA-256 (64 caractères hex) — reproductible sur le
 * même appareil, différent sur un autre.
 */
@Injectable({ providedIn: 'root' })
export class DeviceFingerprintService {

  // ── Clé localStorage pour l'identifiant stable de l'appareil ──
  private readonly DEVICE_ID_KEY = '_bj_did';

  // ── Clé localStorage pour le cache du fingerprint ──────────────
  private readonly FP_CACHE_KEY  = '_bj_fp';

  // ──────────────────────────────────────────────────────────────
  // Point d'entrée public : retourne le fingerprint (async SHA-256)
  // ──────────────────────────────────────────────────────────────
  async getFingerprint(): Promise<string> {
    try {
      // Cache court (30 min) pour éviter de recalculer à chaque fois
      const cached = this.getCachedFingerprint();
      if (cached) return cached;

      const raw = this.collectComponents();
      const hash = await this.sha256(raw);

      this.cacheFingerprint(hash);
      return hash;
    } catch {
      // Fallback : retourner l'ID stable seul si WebCrypto indisponible
      return this.getStableDeviceId();
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Collecte tous les composants de l'empreinte
  // ──────────────────────────────────────────────────────────────
  private collectComponents(): string {
    const components: string[] = [
      // 1. Identifiant stable persisté (UUID côté client)
      this.getStableDeviceId(),

      // 2. Navigateur & plateforme
      navigator.userAgent         || '',
      navigator.platform          || '',
      navigator.language          || '',
      navigator.languages?.join(',') || '',

      // 3. Fuseau horaire
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      new Date().getTimezoneOffset().toString(),

      // 4. Capacités matérielles
      (navigator.hardwareConcurrency ?? 0).toString(),
      ((navigator as any).deviceMemory   ?? 0).toString(),

      // 5. Écran
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      screen.availWidth?.toString() || '',
      (window.devicePixelRatio ?? 1).toString(),

      // 6. Capacités navigateur
      navigator.cookieEnabled ? '1' : '0',
      typeof indexedDB !== 'undefined' ? '1' : '0',
      typeof localStorage !== 'undefined' ? '1' : '0',
      'ontouchstart' in window ? 'touch' : 'mouse',

      // 7. Canvas fingerprint (rendu unique par GPU + driver)
      this.getCanvasFingerprint(),

      // 8. WebGL fingerprint (modèle carte graphique)
      this.getWebGLFingerprint(),
    ];

    return components.join('|||');
  }

  // ──────────────────────────────────────────────────────────────
  // Identifiant stable persisté en localStorage
  // Survit aux rechargements, mais pas à la suppression des données
  // ──────────────────────────────────────────────────────────────
  getStableDeviceId(): string {
    try {
      let id = localStorage.getItem(this.DEVICE_ID_KEY);
      if (!id) {
        id = crypto.randomUUID
            ? crypto.randomUUID()
            : this.generateUuidFallback();
        localStorage.setItem(this.DEVICE_ID_KEY, id);
      }
      return id;
    } catch {
      return 'no-storage';
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Canvas fingerprint : rendu d'un texte avec dégradé
  // Varie selon GPU, driver, OS et navigateur
  // ──────────────────────────────────────────────────────────────
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      canvas.width  = 240;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      // Fond dégradé
      const gradient = ctx.createLinearGradient(0, 0, 240, 0);
      gradient.addColorStop(0,   '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1,   '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 240, 60);

      // Texte principal
      ctx.font      = 'bold 16px Arial, sans-serif';
      ctx.fillStyle = '#e94560';
      ctx.fillText('BenjeddouERP 🔒', 8, 22);

      // Texte secondaire avec opacité
      ctx.font      = '11px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('Sécurité · Empreinte · ' + navigator.platform, 8, 42);

      // Formes géométriques (varient selon le rendu anti-aliasing)
      ctx.strokeStyle = 'rgba(233,69,96,0.6)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(215, 30, 18, 0, Math.PI * 2);
      ctx.stroke();

      return canvas.toDataURL().slice(-80); // Derniers 80 chars suffisent
    } catch {
      return 'canvas-error';
    }
  }

  // ──────────────────────────────────────────────────────────────
  // WebGL fingerprint : rendu 3D + infos carte graphique
  // ──────────────────────────────────────────────────────────────
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext
              || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) return 'no-webgl';

      const dbgInfo   = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer  = dbgInfo
          ? gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL) as string
          : gl.getParameter(gl.RENDERER) as string;
      const vendor    = dbgInfo
          ? gl.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL) as string
          : gl.getParameter(gl.VENDOR) as string;

      return `${vendor}|${renderer}`;
    } catch {
      return 'webgl-error';
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Hachage SHA-256 via WebCrypto API (natif, aucune dépendance)
  // ──────────────────────────────────────────────────────────────
  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data    = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ──────────────────────────────────────────────────────────────
  // Cache du fingerprint (30 minutes)
  // ──────────────────────────────────────────────────────────────
  private cacheFingerprint(hash: string): void {
    try {
      const entry = JSON.stringify({ hash, ts: Date.now() });
      sessionStorage.setItem(this.FP_CACHE_KEY, entry);
    } catch { /* ignore */ }
  }

  private getCachedFingerprint(): string | null {
    try {
      const raw = sessionStorage.getItem(this.FP_CACHE_KEY);
      if (!raw) return null;
      const { hash, ts } = JSON.parse(raw);
      const THIRTY_MIN = 30 * 60 * 1000;
      return (Date.now() - ts < THIRTY_MIN) ? hash : null;
    } catch {
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Fallback UUID si crypto.randomUUID indisponible
  // ──────────────────────────────────────────────────────────────
  private generateUuidFallback(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
