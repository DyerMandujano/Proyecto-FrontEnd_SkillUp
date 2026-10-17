import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { PLATFORM_ID } from '@angular/core';

describe('AdminGuard (Pruebas Unitarias de Seguridad)', () => {
  let guard: AdminGuard;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    guard = TestBed.inject(AdminGuard);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('CP-SEC-01: Debe permitir el acceso si el usuario tiene rol "admin"', () => {
    localStorage.setItem('currentUser', JSON.stringify({
      username: 'admin',
      rol: 'admin'
    }));

    const puedeActivar = guard.canActivate();
    expect(puedeActivar).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('CP-SEC-02: Debe bloquear el acceso y redirigir a /login si el usuario es "estudiante"', () => {
    localStorage.setItem('currentUser', JSON.stringify({
      username: 'estudiante1',
      rol: 'estudiante'
    }));

    const puedeActivar = guard.canActivate();
    expect(puedeActivar).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('CP-SEC-03: Debe bloquear el acceso y redirigir a /login si no hay usuario en sesión', () => {
    const puedeActivar = guard.canActivate();
    expect(puedeActivar).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
