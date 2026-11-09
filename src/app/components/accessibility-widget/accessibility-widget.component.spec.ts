import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccessibilityWidgetComponent } from './accessibility-widget.component';
import { AccessibilityThemeService } from '../../services/accessibility-theme.service';
import { SpeechSynthesisService } from '../../services/speech-synthesis.service';
import { PLATFORM_ID } from '@angular/core';

describe('AccessibilityWidgetComponent', () => {
  let component: AccessibilityWidgetComponent;
  let fixture: ComponentFixture<AccessibilityWidgetComponent>;
  let a11yService: AccessibilityThemeService;
  let speechService: SpeechSynthesisService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessibilityWidgetComponent],
      providers: [
        AccessibilityThemeService,
        SpeechSynthesisService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccessibilityWidgetComponent);
    component = fixture.componentInstance;
    a11yService = TestBed.inject(AccessibilityThemeService);
    speechService = TestBed.inject(SpeechSynthesisService);
    fixture.detectChanges();
  });

  it('debe crearse exitosamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe alternar el panel con togglePanel()', () => {
    expect(component.isOpen).toBeFalse();
    component.togglePanel();
    expect(component.isOpen).toBeTrue();
    component.closePanel();
    expect(component.isOpen).toBeFalse();
  });

  it('debe cambiar de pestaña activa', () => {
    expect(component.activeTab).toBe('vision');
    component.setTab('audicion');
    expect(component.activeTab).toBe('audicion');
    component.setTab('lectura');
    expect(component.activeTab).toBe('lectura');
    component.setTab('teclado');
    expect(component.activeTab).toBe('teclado');
  });

  it('debe responder al atajo Alt + A alternando el panel', () => {
    expect(component.isOpen).toBeFalse();
    const event = new KeyboardEvent('keydown', { key: 'a', altKey: true });
    component.handleKeyboardShortcut(event);
    expect(component.isOpen).toBeTrue();
  });

  it('debe alternar lectura de voz alta con toggleSpeechReading()', () => {
    spyOn(speechService, 'speak');
    spyOn(speechService, 'stop');

    component.toggleSpeechReading();
    expect(speechService.speak).toHaveBeenCalled();
  });
});
