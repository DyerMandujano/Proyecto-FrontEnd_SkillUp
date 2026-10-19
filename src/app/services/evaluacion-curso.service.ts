import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EvaluacionCurso } from '../models/evaluacionCurso';
import { Evaluacion } from '../models/evaluacion';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionCursoService {

  private apiUrl = `${environment.apiUrl}/evaluacion`;
  private apiUrl2 = `${environment.apiUrl}/evaluaciones`;

  constructor(private http: HttpClient) { }

  listarEvaluacion(idSeccion: number): Observable<EvaluacionCurso[]> {
    return this.http.get<EvaluacionCurso[]>(`${this.apiUrl}/seccion/${idSeccion}`);
  }

  listarTituloEvaluacion(idSeccion: number): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.apiUrl2}/seccion/${idSeccion}`);
  }

}
