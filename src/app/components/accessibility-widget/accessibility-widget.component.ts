import { Component, HostListener, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityThemeService, AppTheme, FontScale, ThemeOption, FontScaleOption } from '../../services/accessibility-theme.service';
import { SpeechSynthesisService } from '../../services/speech-synthesis.service';

export type A11yTab = 'vision' | 'audicion' | 'lectura' | 'teclado';

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accessibility-widget.component.html',
  styleUrl: './accessibility-widget.component.css'
})
export class AccessibilityWidgetComponent {
  public readonly a11yService = inject(AccessibilityThemeService);
  public readonly speechService = inject(SpeechSynthesisService);

  public isOpen = false;
  public activeTab: A11yTab = 'vision';

  @ViewChild('toggleBtn') toggleBtnRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('panelRef') panelRef?: ElementRef<HTMLDivElement>;
  @ViewChild('closeBtn') closeBtnRef?: ElementRef<HTMLButtonElement>;

  public readonly themes: ThemeOption[] = this.a11yService.availableThemes;
  public readonly fontScales: FontScaleOption[] = this.a11yService.availableFontScales;

  /**
   * Atajos de teclado globales:
   * - Alt + A: Abrir/Cerrar panel de accesibilidad
   * - Alt + L: Leer o detener lectura en voz alta
   * - Escape: Cerrar el panel
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      this.togglePanel();
    } else if (event.altKey && (event.key === 'l' || event.key === 'L')) {
      event.preventDefault();
      this.toggleSpeechReading();
    } else if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.closePanel();
    }
  }

  public togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.closeBtnRef?.nativeElement.focus();
      }, 50);
    } else {
      this.toggleBtnRef?.nativeElement.focus();
    }
  }

  public closePanel(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.toggleBtnRef?.nativeElement.focus();
    }
  }

  public setTab(tab: A11yTab): void {
    this.activeTab = tab;
  }

  public onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closePanel();
    }
  }

  public selectTheme(themeId: AppTheme): void {
    this.a11yService.setTheme(themeId);
  }

  public selectFontScale(scale: FontScale): void {
    this.a11yService.setFontScale(scale);
  }

  public increaseFont(): void {
    this.a11yService.increaseFontScale();
  }

  public decreaseFont(): void {
    this.a11yService.decreaseFontScale();
  }

  public resetFont(): void {
    this.a11yService.resetFontScale();
  }

  public toggleUnderline(): void {
    this.a11yService.toggleUnderlineLinks();
  }

  public toggleLexend(): void {
    this.a11yService.toggleLexendFont();
  }

  public toggleReducedMotion(): void {
    this.a11yService.toggleReducedMotion();
  }

  public toggleSubtitles(): void {
    this.a11yService.toggleSubtitles();
  }

  public toggleTranscription(): void {
    this.a11yService.toggleTranscription();
  }

  public toggleFocusMode(): void {
    this.a11yService.toggleFocusMode();
  }

  public resetAllDefaults(): void {
    this.a11yService.resetAllToDefaults();
  }

  public toggleSpeechReading(): void {
    // Si ya está leyendo, lo detiene
    if (this.speechService.isSpeaking()) {
      this.speechService.stop();
      return;
    }

    // Obtener texto legible de la página o de un encabezado principal
    const mainHeading = document.querySelector('h1, h2, .section-title, .hero-title');
    const content = mainHeading ? (mainHeading as HTMLElement).innerText : document.title;
    this.speechService.speak(`SkillUp: ${content}. Plataforma de aprendizaje inclusiva y accesible.`);
  }

  public onThemeKeydown(event: KeyboardEvent, currentIndex: number): void {
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % this.themes.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + this.themes.length) % this.themes.length;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectTheme(this.themes[currentIndex].id);
      return;
    }

    if (nextIndex !== currentIndex) {
      const nextTheme = this.themes[nextIndex];
      this.selectTheme(nextTheme.id);
      const buttons = this.panelRef?.nativeElement.querySelectorAll<HTMLButtonElement>('.theme-btn');
      if (buttons && buttons[nextIndex]) {
        buttons[nextIndex].focus();
      }
    }
  }
}
