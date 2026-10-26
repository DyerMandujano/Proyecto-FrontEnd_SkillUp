import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    // 1. Verificar si el usuario ha iniciado sesión
    if (!this.authService.isLoggedIn()) {
      localStorage.setItem('redirectAfterLogin', state.url);
      this.router.navigate(['/login']);
      return false;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.rol) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = (currentUser.rol || '').toLowerCase().trim();

    // 2. Si es Administrador, tiene acceso irrestricto a cualquier ruta protegida del sistema
    if (userRole === 'admin') {
      return true;
    }

    // 3. Validar roles requeridos por la ruta (data.roles)
    const allowedRoles: string[] = route.data['roles'] || [];
    if (allowedRoles.length > 0) {
      const isAllowed = allowedRoles
        .map(r => r.toLowerCase().trim())
        .includes(userRole);

      if (!isAllowed) {
        // Redirigir al panel correspondiente según el rol del usuario
        this.redirigirSegunRol(userRole, currentUser.idRolEspecifico);
        return false;
      }
    }

    // 4. Validación de propiedad de identidad (Ownership):
    // Si la ruta pertenece a un rol específico con ID propio (ej: /docente/:id o /visualizar-cursos/:id),
    // verificar que el ID en la URL corresponda a su idRolEspecifico
    const paramId = route.paramMap.get('id');
    const isOwnerStrict = route.data['checkOwnership'] === true;

    if (isOwnerStrict && paramId && currentUser.idRolEspecifico) {
      if (+paramId !== +currentUser.idRolEspecifico) {
        this.redirigirSegunRol(userRole, currentUser.idRolEspecifico);
        return false;
      }
    }

    return true;
  }

  private redirigirSegunRol(rol: string, idRolEspecifico?: number | null): void {
    if (rol === 'docente' && idRolEspecifico) {
      this.router.navigate(['/docente', idRolEspecifico]);
    } else if (rol === 'estudiante' && idRolEspecifico) {
      this.router.navigate(['/visualizar-cursos', idRolEspecifico]);
    } else if (rol === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
