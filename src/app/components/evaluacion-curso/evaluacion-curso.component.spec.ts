import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EvaluacionCursoComponent } from './evaluacion-curso.component';
import { SpeechSynthesisService } from '../../services/speech-synthesis.service';
import { PLATFORM_ID } from '@angular/core';

describe('EvaluacionCursoComponent', () => {
  let component: EvaluacionCursoComponent;
  let fixture: ComponentFixture<EvaluacionCursoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluacionCursoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        SpeechSynthesisService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluacionCursoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
