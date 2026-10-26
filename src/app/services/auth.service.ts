import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { RegistroRequest } from '../models/registro-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private BASE_URL = '/api/auth';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE_URL}/login`, credentials);
  }

  register(userData: RegistroRequest): Observable<any> {
    return this.http.post(`${this.BASE_URL}/registrar`, userData, { responseType: 'text' });
  }

  saveSession(response: LoginResponse): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem('token', response.token);

    const userData = {
      idUsuario: response.idUsuario,
      username: response.username,
      nombreCompleto: response.nombreCompleto,
      rol: response.rol,
      idRolEspecifico: response.idRolEspecifico,
      idPersona: response.idPersona
    };

    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (response.idRolEspecifico) {
      localStorage.setItem('idRolEspecifico', response.idRolEspecifico.toString());
      if (response.rol && response.rol.toLowerCase() === 'estudiante') {
        localStorage.setItem('idEstudiante', response.idRolEspecifico.toString());
      } else if (response.rol && response.rol.toLowerCase() === 'docente') {
        localStorage.setItem('idDocente', response.idRolEspecifico.toString());
      }
    }
  }

  getCurrentUser(): LoginResponse | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('idEstudiante');
    localStorage.removeItem('idDocente');
    localStorage.removeItem('idRolEspecifico');
    localStorage.removeItem('redirectAfterLogin');
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    return !!localStorage.getItem('token') &&
           !!localStorage.getItem('currentUser');
  }

  // HU-22: Recuperación de contraseña
  verificarIdentificador(identificador: string): Observable<{ mensaje: string; username?: string }> {
    return this.http.post<{ mensaje: string; username?: string }>(
      `${this.BASE_URL}/recuperar-password/verificar`,
      { identificador }
    );
  }

  restablecerPassword(datos: { identificador: string; nuevaContrasenia: string; confirmarContrasenia: string }): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.BASE_URL}/recuperar-password/cambiar`,
      datos
    );
  }
}
