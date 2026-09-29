import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Seccion } from '../models/seccion.model';

@Injectable({
  providedIn: 'root'
})
export class SeccionService {

   private apiUrl = 'http://localhost:8888/api/secciones';

  constructor(private http: HttpClient) { }

  listarSeccionesPorCurso(idCurso: number): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.apiUrl}/curso/${idCurso}`);
  }

  listarSeccionesActivasPorCurso(idCurso: number): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.apiUrl}/cursoAC/${idCurso}`);
  }

  obtenerSeccionPorId(id: number): Observable<Seccion> {
    return this.http.get<Seccion>(`${this.apiUrl}/seccion/${id}`);
  }

  insertarSeccion(seccion: Seccion): Observable<string> {
    return this.http.post(`${this.apiUrl}`, seccion, { responseType: 'text' });
  }

  actualizarSeccion(id: number, seccion: Seccion): Observable<string> {
    return this.http.put(`${this.apiUrl}/seccion/${id}`, seccion, { responseType: 'text' });
  }

  eliminarSeccion(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/seccion/${id}`, { responseType: 'text' });
  }
}
