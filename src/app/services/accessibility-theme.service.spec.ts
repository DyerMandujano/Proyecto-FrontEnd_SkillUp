import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccessibilityThemeService } from './accessibility-theme.service';
import { PLATFORM_ID } from '@angular/core';

describe('AccessibilityThemeService', () => {
  let service: AccessibilityThemeService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AccessibilityThemeService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(AccessibilityThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crearse exitosamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe inicializar con tema "system" por defecto si no hay storage', () => {
    expect(service.theme()).toBe('system');
  });

  it('debe cambiar de tema y persistir en localStorage con clave JSON y claves individuales', () => {
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('skillup_theme')).toBe('dark');
    expect(localStorage.getItem('skillup_a11y_pref')).toContain('"theme":"dark"');

    service.setTheme('colorblind');
    expect(service.theme()).toBe('colorblind');
    expect(localStorage.getItem('skillup_theme')).toBe('colorblind');
  });

  it('debe cambiar y ajustar el factor de escala de fuente hasta 200%', () => {
    service.setFontScale(1.50);
    expect(service.fontScale()).toBe(1.50);
    expect(service.fontScalePercentage()).toBe(150);

    service.setFontScale(2.0);
    expect(service.fontScale()).toBe(2.0);
    expect(service.fontScalePercentage()).toBe(200);

    service.resetFontScale();
    expect(service.fontScale()).toBe(1.0);
  });

  it('debe alternar los toggles de accesibilidad: Lexend, subrayado, movimiento y foco', () => {
    expect(service.lexendFont()).toBeFalse();
    service.toggleLexendFont();
    expect(service.lexendFont()).toBeTrue();

    expect(service.underlineLinks()).toBeFalse();
    service.toggleUnderlineLinks();
    expect(service.underlineLinks()).toBeTrue();

    expect(service.reducedMotion()).toBeFalse();
    service.toggleReducedMotion();
    expect(service.reducedMotion()).toBeTrue();
  });
});
