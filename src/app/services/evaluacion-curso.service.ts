import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EvaluacionCurso, EvaluacionEstado, EvaluacionResultado } from '../models/evaluacionCurso';
import { Evaluacion } from '../models/evaluacion';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionCursoService {

  private apiUrl = 'http://localhost:8888/api/evaluacion';
  private apiUrl2 = 'http://localhost:8888/api/evaluaciones';

  constructor(private http: HttpClient) { }

  listarEvaluacion(idSeccion: number): Observable<EvaluacionCurso[]> {
    return this.http.get<EvaluacionCurso[]>(`${this.apiUrl}/seccion/${idSeccion}`);
  }

  listarTituloEvaluacion(idSeccion: number): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.apiUrl2}/seccion/${idSeccion}`);
  }

  obtenerEstadoEvaluacion(idSeccion: number, idEstudiante: number): Observable<EvaluacionEstado> {
    return this.http.get<EvaluacionEstado>(`${this.apiUrl}/seccion/${idSeccion}/estado?idEstudiante=${idEstudiante}`);
  }

  enviarEvaluacion(idSeccion: number, data: { idEstudiante: number; idCurso?: number; respuestas: { idPregunta: number; idOpPregunta: number }[] }): Observable<EvaluacionResultado> {
    return this.http.post<EvaluacionResultado>(`${this.apiUrl}/seccion/${idSeccion}/enviar`, data);
  }

}
