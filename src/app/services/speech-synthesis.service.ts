import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SpeechSynthesisService {
  public readonly isSpeaking = signal<boolean>(false);
  public readonly isPaused = signal<boolean>(false);
  public readonly isSupported = signal<boolean>(false);

  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isSupported.set(true);
    }
  }

  /**
   * Lee en voz alta un texto dado en español.
   */
  public speak(text: string, lang = 'es-ES'): void {
    if (!this.synth || !text.trim()) return;

    // Detener cualquier lectura previa
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Buscar una voz en español si está disponible
    const voices = this.synth.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('Spanish'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking.set(true);
      this.isPaused.set(false);
    };

    utterance.onend = () => {
      this.isSpeaking.set(false);
      this.isPaused.set(false);
      this.currentUtterance = null;
    };

    utterance.onerror = (e) => {
      console.warn('[SpeechSynthesisService] Error en síntesis de voz:', e);
      this.isSpeaking.set(false);
      this.isPaused.set(false);
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Pausa la lectura actual.
   */
  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPaused.set(true);
    }
  }

  /**
   * Reanuda la lectura pausada.
   */
  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.isPaused.set(false);
    }
  }

  /**
   * Detiene por completo la lectura en curso.
   */
  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking.set(false);
      this.isPaused.set(false);
      this.currentUtterance = null;
    }
  }

  /**
   * Alterna entre hablar y detener.
   */
  public toggleSpeak(text: string): void {
    if (this.isSpeaking()) {
      this.stop();
    } else {
      this.speak(text);
    }
  }
}
