import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Curso } from '../models/curso.model';
import { DocenteC } from '../models/docenteC.model';
import { CursoNoMatricula } from '../models/CursoNoMatricula';

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private apiUrl = '/api/docentes';
  
  private apiUrl2 = '/api/cursos/docente';

  private apiUrl3 = '/api/cursos';
  private apiUrl4 = '/api/cursos/no-matricula';

  constructor(private http: HttpClient) {}
 
    listarCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl3);
  }

  listarCursosSinMatriculaporEstu(id: number): Observable<CursoNoMatricula[]> {
    return this.http.get<CursoNoMatricula[]>(`${this.apiUrl4}/${id}`);
  }

  listarDocentes(): Observable<DocenteC[]> {
    return this.http.get<DocenteC[]>(this.apiUrl);
  }

  listarCursosPorDocente(idDocente: number): Observable<Curso[]> {
  return this.http.get<Curso[]>(`${this.apiUrl2}/${idDocente}`);
  }

  obtenerCursoPorId(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl3}/${id}`);
  }

  insertarCurso(curso: Curso): Observable<string> {
    return this.http.post(this.apiUrl3, curso, { responseType: 'text' });
  }

  actualizarCurso(id: number, curso: Curso): Observable<string> {
    return this.http.put(`${this.apiUrl3}/${id}`, curso, { responseType: 'text' });
  }

  eliminarCurso(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl3}/${id}`, { responseType: 'text' });
  }

  subirImagen(file: File): Observable<{ fileName: string; url: string }> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<{ fileName: string; url: string }>(`${this.apiUrl3}/upload`, formData);
  }

  obtenerUrlImagen(imagen: string | null | undefined): string {
    if (!imagen || !imagen.trim()) {
      return '/img/curso/curso.png';
    }
    const img = imagen.trim();
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    if (img.startsWith('/uploads/') || img.startsWith('/img/')) {
      return img;
    }
    if (img.startsWith('uploads/')) {
      return `/${img}`;
    }
    if (img.startsWith('img/')) {
      return `/${img}`;
    }

    const imagenesEstaticas = [
      'alb.jpg', 'albaneria.jpg', 'albaneria2.jpg', 'bannerestudiante.jpg',
      'carpbasica.jpg', 'carpbasica2.jpg', 'carpinteria.jpg', 'curso.png',
      'elec.jpg', 'electricidad.jpg', 'electricidad2.jpg', 'electricidaddome.jpg',
      'encerado.jpg', 'gasfiteria.jpg', 'herreria.jpg', 'mantautos.jpg',
      'mantautos2.jpg', 'pint.jpg', 'reptuberias.jpg', 'reptuberias2.jpg',
      'servicio-de-albanileria.jpg', 'sold.jpg', 'updcurso.jpg'
    ];

    if (imagenesEstaticas.includes(img.toLowerCase())) {
      return `/img/curso/${img}`;
    }

    return `/uploads/${img}`;
  }

  manejarErrorImagen(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (!imgElement) return;

    if (imgElement.src.includes('/uploads/')) {
      const filename = imgElement.src.substring(imgElement.src.lastIndexOf('/') + 1);
      imgElement.src = `/img/curso/${filename}`;
    } else if (!imgElement.src.includes('/img/curso/curso.png')) {
      imgElement.src = '/img/curso/curso.png';
    }
  }
}
