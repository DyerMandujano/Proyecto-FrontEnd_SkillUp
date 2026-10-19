import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudPagoResponse } from '../models/admin.models';

@Injectable({
  providedIn: 'root'
})
export class SolicitudPagoService {

  private apiUrl = 'http://localhost:8888/api/solicitudes-pago';

  constructor(private http: HttpClient) { }

  enviarSolicitud(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/subir`, formData);
  }

  listarPorEstudiante(idEstudiante: number): Observable<SolicitudPagoResponse[]> {
    return this.http.get<SolicitudPagoResponse[]>(`${this.apiUrl}/estudiante/${idEstudiante}`);
  }
}
