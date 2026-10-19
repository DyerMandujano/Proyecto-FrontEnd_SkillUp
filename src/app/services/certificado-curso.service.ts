import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CertificadoCurso } from '../models/certificadoEstudiante';
import { CertificadoDocente } from '../models/certificadoDocente';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CertificadoCursoService {

   private baseUrl = `${environment.apiUrl}/certificados`;

  constructor(private http: HttpClient) { }

    listarCertificadosPorEstudiante(idEstudiante: number): Observable<CertificadoCurso[]> {
    return this.http.get<CertificadoCurso[]>(`${this.baseUrl}/estudiante/${idEstudiante}`);
  }

  listarCertificadosPorDocente(idDocente: number): Observable<CertificadoDocente[]> {
    return this.http.get<CertificadoDocente[]>(`${this.baseUrl}/docente/${idDocente}`);
  }

}
