import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Matricula } from '../models/matricula';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatriculaService {

  private apiUrl = `${environment.apiUrl}/matriculas`;
  constructor(private http: HttpClient) { }

  insertarMatricula(idEstudiante: number, idCurso: number): Observable<string> {
    const params = new HttpParams()
      .set('idEstudiante', idEstudiante)
      .set('idCurso', idCurso);

    return this.http.post(`${this.apiUrl}/insertar`, null, {
      params,
      responseType: 'text'
    });
  }

  verificarMatricula(idEstudiante: number, idCurso: number): Observable<boolean> {
    const params = new HttpParams()
      .set('idEstudiante', idEstudiante)
      .set('idCurso', idCurso);

    return this.http.get<boolean>(`${this.apiUrl}/verificar`, { params });
  }
}
