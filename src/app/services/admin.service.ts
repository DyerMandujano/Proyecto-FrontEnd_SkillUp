import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudPagoResponse, UsuarioAdmin, MatriculaSeguimiento } from '../models/admin.models';
import { RegistroRequest } from '../models/registro-request.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  private getAdminHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-User-Role': 'admin'
    });
  }

  // ==========================================
  // HU17: SOLICITUDES DE PAGO / MEMBRESÍA
  // ==========================================
  listarSolicitudesPago(estado: string = 'todos'): Observable<SolicitudPagoResponse[]> {
    const params = new HttpParams().set('estado', estado);
    return this.http.get<SolicitudPagoResponse[]>(`${this.apiUrl}/solicitudes-pago`, { params });
  }

  aprobarSolicitudPago(idSolicitud: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/solicitudes-pago/${idSolicitud}/aprobar`, {});
  }

  rechazarSolicitudPago(idSolicitud: number, observacion: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/solicitudes-pago/${idSolicitud}/rechazar`, { observacion });
  }

  // ==========================================
  // HU18: GESTIÓN DE CUENTAS DE USUARIOS
  // ==========================================
  listarUsuarios(rol: string = 'todos', buscar: string = ''): Observable<UsuarioAdmin[]> {
    let params = new HttpParams().set('rol', rol);
    if (buscar && buscar.trim() !== '') {
      params = params.set('buscar', buscar.trim());
    }
    return this.http.get<UsuarioAdmin[]>(`${this.apiUrl}/usuarios`, { params });
  }

  cambiarEstadoUsuario(idUsuario: number, nuevoEstado: number): Observable<UsuarioAdmin> {
    const params = new HttpParams().set('nuevoEstado', nuevoEstado.toString());
    return this.http.put<UsuarioAdmin>(`${this.apiUrl}/usuarios/${idUsuario}/estado`, {}, { params });
  }

  // ==========================================
  // CRUD ADMIN: CREAR USUARIO ADMIN
  // ==========================================
  crearAdmin(request: RegistroRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/crear-admin`, request, {
      headers: this.getAdminHeaders(),
      responseType: 'text'
    });
  }

  // ==========================================
  // HU19: SEGUIMIENTO DE INSCRIPCIONES
  // ==========================================
  listarMatriculas(idCurso?: number, buscar?: string): Observable<MatriculaSeguimiento[]> {
    let params = new HttpParams();
    if (idCurso && idCurso > 0) {
      params = params.set('idCurso', idCurso.toString());
    }
    if (buscar && buscar.trim() !== '') {
      params = params.set('buscar', buscar.trim());
    }
    return this.http.get<MatriculaSeguimiento[]>(`${this.apiUrl}/matriculas`, { params });
  }
}
