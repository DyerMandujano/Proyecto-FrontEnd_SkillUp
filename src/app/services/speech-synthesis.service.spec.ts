import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SpeechSynthesisService } from './speech-synthesis.service';

describe('SpeechSynthesisService', () => {
  let service: SpeechSynthesisService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SpeechSynthesisService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(SpeechSynthesisService);
  });

  it('debe crearse exitosamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe inicializar con isSpeaking en false', () => {
    expect(service.isSpeaking()).toBeFalse();
  });

  it('debe detener la lectura con stop()', () => {
    service.stop();
    expect(service.isSpeaking()).toBeFalse();
  });
});
