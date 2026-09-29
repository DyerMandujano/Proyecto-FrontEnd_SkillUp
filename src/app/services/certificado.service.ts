import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Certificado } from '../models/certificado.model';

@Injectable({
  providedIn: 'root'
})
export class CertificadoService {
  private apiUrl = 'http://localhost:8888/api/certificados';

  constructor(private http: HttpClient) { }

  generarCertificado(idEstudiante: number, idCurso: number): Observable<Certificado> {
    const params = new HttpParams()
      .set('idEstudiante', idEstudiante)
      .set('idCurso', idCurso);

    return this.http.post<Certificado>(`${this.apiUrl}/generar`, null, { params });
  }
  listarCertificadosPorEstudiante(idEstudiante: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/estudiante/${idEstudiante}`);
  }
}