import { Injectable, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export type AppTheme = 'light' | 'dark' | 'system' | 'colorblind';
export type ResolvedTheme = 'light' | 'dark' | 'colorblind';
export type FontScale = 0.85 | 1.0 | 1.25 | 1.50 | 1.75 | 2.0;

export interface ThemeOption {
  id: AppTheme;
  label: string;
  icon: string;
  description: string;
}

export interface FontScaleOption {
  scale: FontScale;
  percentage: number;
  label: string;
}

export interface AccessibilityPreferences {
  theme: AppTheme;
  fontScale: FontScale;
  underlineLinks: boolean;
  lexendFont: boolean;
  reducedMotion: boolean;
  subtitlesEnabled: boolean;
  transcriptionVisible: boolean;
  focusMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityThemeService {
  private readonly STORAGE_KEY_PREFS = 'skillup_a11y_pref';
  private readonly LEGACY_THEME_KEY = 'skillup_theme';
  private readonly LEGACY_FONT_KEY = 'skillup_font_scale';

  private readonly DEFAULT_THEME: AppTheme = 'system';
  private readonly DEFAULT_FONT_SCALE: FontScale = 1.0;

  public readonly availableThemes: ThemeOption[] = [
    {
      id: 'system',
      label: 'Tema del sistema',
      icon: 'bi-display',
      description: 'Detecta automáticamente la preferencia de tu dispositivo'
    },
    {
      id: 'light',
      label: 'Modo claro',
      icon: 'bi-sun-fill',
      description: 'Fondo claro con óptimo contraste para ambientes iluminados'
    },
    {
      id: 'dark',
      label: 'Modo oscuro',
      icon: 'bi-moon-stars-fill',
      description: 'Fondo oscuro para reducir el deslumbramiento y fatiga visual'
    },
    {
      id: 'colorblind',
      label: 'Alto contraste (Okabe-Ito)',
      icon: 'bi-eye-fill',
      description: 'Fondo #121212, amarillo #FFD700 y bordes cian #00E5FF (13.36:1, Okabe-Ito)'
    }
  ];

  public readonly availableFontScales: FontScaleOption[] = [
    { scale: 1.0, percentage: 100, label: '100% (Normal)' },
    { scale: 1.25, percentage: 125, label: '125%' },
    { scale: 1.50, percentage: 150, label: '150% (Grande)' },
    { scale: 1.75, percentage: 175, label: '175%' },
    { scale: 2.0, percentage: 200, label: '200% (Reflow)' }
  ];

  // Estado reactivo mediante Signals
  public readonly theme = signal<AppTheme>(this.DEFAULT_THEME);
  public readonly systemPrefersDark = signal<boolean>(true);
  public readonly fontScale = signal<FontScale>(this.DEFAULT_FONT_SCALE);

  // Toggles de accesibilidad funcional
  public readonly underlineLinks = signal<boolean>(false);
  public readonly lexendFont = signal<boolean>(false);
  public readonly reducedMotion = signal<boolean>(false);
  public readonly subtitlesEnabled = signal<boolean>(true);
  public readonly transcriptionVisible = signal<boolean>(true);
  public readonly focusMode = signal<boolean>(false);

  // Tema resuelto en pantalla
  public readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const currentTheme = this.theme();
    if (currentTheme === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return currentTheme;
  });

  public readonly fontScalePercentage = computed<number>(() => {
    return Math.round(this.fontScale() * 100);
  });

  private mediaQueryListener?: (e: MediaQueryListEvent) => void;
  private mediaQueryList?: MediaQueryList;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // 1. Escuchar esquema del sistema operativo
      if (typeof window !== 'undefined' && window.matchMedia) {
        this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemPrefersDark.set(this.mediaQueryList.matches);

        this.mediaQueryListener = (e: MediaQueryListEvent) => {
          this.systemPrefersDark.set(e.matches);
          if (this.theme() === 'system') {
            this.applyThemeToDOM('system', e.matches ? 'dark' : 'light');
          }
        };

        if (this.mediaQueryList.addEventListener) {
          this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
        } else if ((this.mediaQueryList as any).addListener) {
          (this.mediaQueryList as any).addListener(this.mediaQueryListener);
        }
      }

      // 2. Recuperar preferencias guardadas
      const savedJson = localStorage.getItem(this.STORAGE_KEY_PREFS);
      if (savedJson) {
        const prefs: Partial<AccessibilityPreferences> = JSON.parse(savedJson);
        if (prefs.theme && ['light', 'dark', 'system', 'colorblind'].includes(prefs.theme)) {
          this.theme.set(prefs.theme);
        }
        if (prefs.fontScale && [0.85, 1.0, 1.25, 1.50, 1.75, 2.0].includes(prefs.fontScale)) {
          this.fontScale.set(prefs.fontScale as FontScale);
        }
        if (typeof prefs.underlineLinks === 'boolean') this.underlineLinks.set(prefs.underlineLinks);
        if (typeof prefs.lexendFont === 'boolean') this.lexendFont.set(prefs.lexendFont);
        if (typeof prefs.reducedMotion === 'boolean') this.reducedMotion.set(prefs.reducedMotion);
        if (typeof prefs.subtitlesEnabled === 'boolean') this.subtitlesEnabled.set(prefs.subtitlesEnabled);
        if (typeof prefs.transcriptionVisible === 'boolean') this.transcriptionVisible.set(prefs.transcriptionVisible);
        if (typeof prefs.focusMode === 'boolean') this.focusMode.set(prefs.focusMode);
      } else {
        // Fallback a legacy keys
        const legacyTheme = localStorage.getItem(this.LEGACY_THEME_KEY) as AppTheme | null;
        if (legacyTheme && ['light', 'dark', 'system', 'colorblind'].includes(legacyTheme)) {
          this.theme.set(legacyTheme);
        }
        const legacyScale = parseFloat(localStorage.getItem(this.LEGACY_FONT_KEY) || '');
        if ([0.85, 1.0, 1.25, 1.50, 1.75, 2.0].includes(legacyScale)) {
          this.fontScale.set(legacyScale as FontScale);
        }
      }

      // 3. Aplicar al DOM
      this.applyAllToDOM();

    } catch (error) {
      console.warn('[AccessibilityThemeService] Error al inicializar preferencias:', error);
      this.applyAllToDOM();
    }
  }

  public setTheme(newTheme: AppTheme): void {
    this.theme.set(newTheme);
    this.applyThemeToDOM(newTheme, this.resolvedTheme());
    this.savePreferences();
  }

  public setFontScale(newScale: FontScale): void {
    this.fontScale.set(newScale);
    this.applyFontScaleToDOM(newScale);
    this.savePreferences();
  }

  public increaseFontScale(): void {
    const scales: FontScale[] = [1.0, 1.25, 1.50, 1.75, 2.0];
    const currentIndex = scales.indexOf(this.fontScale());
    if (currentIndex < scales.length - 1) {
      this.setFontScale(scales[currentIndex + 1]);
    }
  }

  public decreaseFontScale(): void {
    const scales: FontScale[] = [1.0, 1.25, 1.50, 1.75, 2.0];
    const currentIndex = scales.indexOf(this.fontScale());
    if (currentIndex > 0) {
      this.setFontScale(scales[currentIndex - 1]);
    }
  }

  public resetFontScale(): void {
    this.setFontScale(this.DEFAULT_FONT_SCALE);
  }

  public toggleUnderlineLinks(): void {
    this.underlineLinks.set(!this.underlineLinks());
    this.applyUnderlineLinksToDOM(this.underlineLinks());
    this.savePreferences();
  }

  public toggleLexendFont(): void {
    this.lexendFont.set(!this.lexendFont());
    this.applyLexendFontToDOM(this.lexendFont());
    this.savePreferences();
  }

  public toggleReducedMotion(): void {
    this.reducedMotion.set(!this.reducedMotion());
    this.applyReducedMotionToDOM(this.reducedMotion());
    this.savePreferences();
  }

  public toggleSubtitles(): void {
    this.subtitlesEnabled.set(!this.subtitlesEnabled());
    this.savePreferences();
  }

  public toggleTranscription(): void {
    this.transcriptionVisible.set(!this.transcriptionVisible());
    this.savePreferences();
  }

  public toggleFocusMode(): void {
    this.focusMode.set(!this.focusMode());
    this.applyFocusModeToDOM(this.focusMode());
    this.savePreferences();
  }

  public resetAllToDefaults(): void {
    this.theme.set(this.DEFAULT_THEME);
    this.fontScale.set(this.DEFAULT_FONT_SCALE);
    this.underlineLinks.set(false);
    this.lexendFont.set(false);
    this.reducedMotion.set(false);
    this.subtitlesEnabled.set(true);
    this.transcriptionVisible.set(true);
    this.focusMode.set(false);
    this.applyAllToDOM();
    this.savePreferences();
  }

  private applyAllToDOM(): void {
    this.applyThemeToDOM(this.theme(), this.resolvedTheme());
    this.applyFontScaleToDOM(this.fontScale());
    this.applyUnderlineLinksToDOM(this.underlineLinks());
    this.applyLexendFontToDOM(this.lexendFont());
    this.applyReducedMotionToDOM(this.reducedMotion());
    this.applyFocusModeToDOM(this.focusMode());
  }

  private applyThemeToDOM(theme: AppTheme, resolved: ResolvedTheme): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-resolved-theme', resolved);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
      document.body.setAttribute('data-resolved-theme', resolved);
    }
  }

  private applyFontScaleToDOM(scale: FontScale): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--sk-font-scale', scale.toString());
    document.documentElement.setAttribute('data-font-scale', scale.toString());
    document.documentElement.style.fontSize = `${16 * scale}px`;
  }

  private applyUnderlineLinksToDOM(active: boolean): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-underline-links', active ? 'true' : 'false');
  }

  private applyLexendFontToDOM(active: boolean): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-font-family', active ? 'lexend' : 'inter');
  }

  private applyReducedMotionToDOM(active: boolean): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-reduced-motion', active ? 'true' : 'false');
  }

  private applyFocusModeToDOM(active: boolean): void {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-focus-mode', active ? 'true' : 'false');
  }

  private savePreferences(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const prefs: AccessibilityPreferences = {
        theme: this.theme(),
        fontScale: this.fontScale(),
        underlineLinks: this.underlineLinks(),
        lexendFont: this.lexendFont(),
        reducedMotion: this.reducedMotion(),
        subtitlesEnabled: this.subtitlesEnabled(),
        transcriptionVisible: this.transcriptionVisible(),
        focusMode: this.focusMode()
      };

      localStorage.setItem(this.STORAGE_KEY_PREFS, JSON.stringify(prefs));
      // Compatibilidad con claves individuales
      localStorage.setItem(this.LEGACY_THEME_KEY, this.theme());
      localStorage.setItem(this.LEGACY_FONT_KEY, this.fontScale().toString());

      this.syncPreferencesWithBackendAsync(prefs);
    } catch (e) {
      console.warn('[AccessibilityThemeService] Error al guardar preferencias:', e);
    }
  }

  private syncPreferencesWithBackendAsync(prefs: AccessibilityPreferences): void {
    try {
      const token = localStorage.getItem('token');
      const currentUserStr = localStorage.getItem('currentUser');
      if (!token || !currentUserStr) return;

      const currentUser = JSON.parse(currentUserStr);
      const idUsuario = currentUser?.idUsuario;
      if (!idUsuario) return;

      this.http.patch(`${environment.apiUrl}/usuarios/${idUsuario}/preferencias-accesibilidad`, prefs)
        .pipe(catchError(() => of(null)))
        .subscribe();
    } catch {
      // Ignorar de forma no bloqueante
    }
  }
}
