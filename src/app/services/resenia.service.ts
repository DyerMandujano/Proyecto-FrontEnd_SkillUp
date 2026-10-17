import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  private apiUrl = 'http://localhost:8888/api/cursos';

  constructor(private http: HttpClient) {}

  listarResenias(idCurso: number): Observable<ReseniaCurso[]> {
    return this.http.get<ReseniaCurso[]>(`${this.apiUrl}/${idCurso}/resenias`);
  }

  registrarResenia(idCurso: number, payload: RegistrarReseniaRequest): Observable<ReseniaCurso> {
    return this.http.post<ReseniaCurso>(`${this.apiUrl}/${idCurso}/resenias`, payload);
  }
}
