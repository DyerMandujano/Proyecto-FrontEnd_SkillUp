import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estudiante } from '../models/estudiante.model'; 
import { CursoMatricula } from '../models/CursoMatricula';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {

  private apiUrl = '/api/estudiantes';
  private apiUrl2 = '/api/cursos/matricula/estudiante';

  constructor(private http: HttpClient) { }

  listarEstudiantes(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(this.apiUrl);
  }

  obtenerEstudiante(id: number): Observable<Estudiante> {
    const url = `${this.apiUrl}/${id}`; 
    return this.http.get<Estudiante>(url);
  }

  obtenerCursosMatricula(id:number):Observable<CursoMatricula[]>
  {
    return this.http.get<CursoMatricula[]>(`${this.apiUrl2}/${id}`);
  }
}