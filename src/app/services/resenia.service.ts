import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReseniaCurso {
  idReseniaCurso?: number;
  idCurso: number;
  idEstudiante: number;
  nombreEstudiante?: string;
  calificacion: number;
  comentario: string;
  fechaResenia?: string;
  estado?: number;
}

export interface RegistrarReseniaRequest {
  idEstudiante: number;
  calificacion: number;
  comentario: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReseniaService {

  private apiUrl = `${environment.apiUrl}/cursos`;

  constructor(private http: HttpClient) {}

  listarResenias(idCurso: number): Observable<ReseniaCurso[]> {
    return this.http.get<ReseniaCurso[]>(`${this.apiUrl}/${idCurso}/resenias`);
  }

  registrarResenia(idCurso: number, payload: RegistrarReseniaRequest): Observable<ReseniaCurso> {
    return this.http.post<ReseniaCurso>(`${this.apiUrl}/${idCurso}/resenias`, payload);
  }
}
