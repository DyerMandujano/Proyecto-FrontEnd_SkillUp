import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        try {
          const user = JSON.parse(currentUserStr);
          if (user && user.rol && user.rol.toLowerCase().trim() === 'admin') {
            return true;
          }
        } catch (e) {
          // Error parseando JSON
        }
      }
    }

    this.router.navigate(['/login']);
    return false;
  }
}
