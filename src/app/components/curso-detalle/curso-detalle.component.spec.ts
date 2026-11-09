import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CursoDetalleComponent } from './curso-detalle.component';
import { AccessibilityThemeService } from '../../services/accessibility-theme.service';
import { PLATFORM_ID } from '@angular/core';

describe('CursoDetalleComponent', () => {
  let component: CursoDetalleComponent;
  let fixture: ComponentFixture<CursoDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CursoDetalleComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AccessibilityThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CursoDetalleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
