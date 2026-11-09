import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Leccion } from '../../../models/leccion.model';
import { LeccionService } from '../../../services/leccion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';
import { SafeUrlPipe } from '../../../pipes/safe-url.pipe';

@Component({
  selector: 'app-actualizar-leccion',
  standalone: true,
  imports: [CommonModule, FormsModule, DocenteHeaderComponent, SafeUrlPipe],
  templateUrl: './actualizar-leccion.component.html',
  styleUrl: './actualizar-leccion.component.css'
})
export class ActualizarLeccionComponent implements OnInit {
  
  leccion: Leccion = {
    idLeccion: 0,
    idSeccion: 0,
    nombreLeccion: '',
    duracion: 0,
    ordenLeccion: 0,
    estado: 1,
    urlVideo: '',
    materiales: []
  };

  constructor(
    private leccionService: LeccionService, 
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.leccionService.obtenerLeccionPorId(Number(id)).subscribe({
        next: (data: Leccion) => {
          if (data) {
            this.leccion = data;
            if (!this.leccion.materiales) {
              this.leccion.materiales = [];
            } else {
              // Inicializar flags para cada material existente
              this.leccion.materiales.forEach(m => {
                m._urlOriginal = m.urlMaterial;
                m._cambiando = false;
              });
            }
          }
        },
        error: (err: any) => {}
      });
    }
  }

  seleccionarArchivo(event: any, index: number): void {
    const file = event.target.files[0];
    if (file && this.leccion.materiales) {
      const mat = this.leccion.materiales[index];
      if (!mat._urlOriginal && mat.urlMaterial) {
        mat._urlOriginal = mat.urlMaterial;
      }
      mat.archivoFisico = file;
      mat.urlMaterial = ''; // Backend identificará que debe guardar el archivo físico
      if (!mat.nombreArchivo || mat.nombreArchivo.trim() === '') {
        mat.nombreArchivo = file.name;
      }
      mat._cambiando = false;
    }
  }

  cambiarArchivo(index: number): void {
    if (this.leccion.materiales && this.leccion.materiales[index]) {
      this.leccion.materiales[index]._cambiando = true;
    }
  }

  cancelarCambio(index: number): void {
    if (this.leccion.materiales && this.leccion.materiales[index]) {
      const mat = this.leccion.materiales[index];
      mat.archivoFisico = undefined;
      if (mat._urlOriginal) {
        mat.urlMaterial = mat._urlOriginal;
      }
      mat._cambiando = false;
    }
  }

  obtenerNombreVisual(url: string | undefined): string {
    if (!url) return 'Archivo adjunto';
    const partes = url.replace(/\\/g, '/').split('/');
    const nombreCompleto = partes[partes.length - 1];
    return nombreCompleto.replace(/^\d+_/, '');
  }

  obtenerIcono(url: string | undefined): string {
    if (!url) return 'bi bi-file-earmark-text text-secondary';
    const u = url.toLowerCase();
    if (u.endsWith('.pdf')) return 'bi bi-file-earmark-pdf-fill text-danger';
    if (u.endsWith('.doc') || u.endsWith('.docx')) return 'bi bi-file-earmark-word-fill text-primary';
    if (u.endsWith('.xls') || u.endsWith('.xlsx') || u.endsWith('.csv')) return 'bi bi-file-earmark-excel-fill text-success';
    if (u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.gif') || u.endsWith('.webp')) return 'bi bi-file-earmark-image-fill text-warning';
    return 'bi bi-file-earmark-text-fill text-secondary';
  }

  obtenerUrlCompleta(url: string | undefined): string {
    if (!url) return '#';
    const normalizada = url.replace(/\\/g, '/');
    if (normalizada.startsWith('http')) return normalizada;
    if (normalizada.startsWith('/')) return normalizada;
    return `/${normalizada}`;
  }

  actualizarSeccion(): void {
    // Validar si hay filas sin archivo físico ni urlMaterial guardada
    if (this.leccion.materiales) {
      const vacios = this.leccion.materiales.filter(m => !m.archivoFisico && (!m.urlMaterial || m.urlMaterial.trim() === ''));
      if (vacios.length > 0) {
        alert('Hay materiales agregados que no tienen ningún archivo seleccionado. Por favor adjunta un archivo o elimina la fila.');
        return;
      }
    }

    this.leccionService.actualizarLeccion(this.leccion.idLeccion, this.leccion).subscribe({
      next: (res: any) => {
        alert('Lección y materiales actualizados correctamente');
        this.regresarALista(); 
      },
      error: (err: any) => {
        alert('Ocurrió un error al actualizar la lección');
      }
    });
  }

  cancelar(): void {
    this.regresarALista();
  }

  private regresarALista(): void {
    if (isPlatformBrowser(this.platformId)) {
      const idSeccionGuardado = localStorage.getItem('idSeccionActual');
      if (idSeccionGuardado && idSeccionGuardado !== '0') {
        this.router.navigate([`/leccion/seccion/${idSeccionGuardado}`]);
        return;
      }
    }
    this.router.navigate(['/']);
  }

  agregarMaterial(): void {
    if (!this.leccion.materiales) {
      this.leccion.materiales = [];
    }
    this.leccion.materiales.push({ 
      idMaterial: 0, 
      urlMaterial: '', 
      nombreArchivo: '', 
      _cambiando: true 
    });
  }

  quitarMaterial(index: number): void {
    if (this.leccion.materiales) {
      this.leccion.materiales.splice(index, 1);
    }
  }

  archivoSubtitulos?: File;

  onSubtitulosSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSubtitulos = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text && (!this.leccion.transcripcionTexto || this.leccion.transcripcionTexto.trim().length === 0)) {
          this.leccion.transcripcionTexto = text;
        }
      };
      reader.readAsText(file);
    }
  }

  autogenerarMarcasDeTiempo() {
    const titulo = this.leccion.nombreLeccion || 'Lección';
    const duracion = this.leccion.duracion && this.leccion.duracion > 0 ? this.leccion.duracion : 8;
    const duracionSegundos = duracion * 60;

    const milestones = [
      { pct: 0, text: `Bienvenida e introducción: ${titulo}` },
      { pct: 0.1, text: 'Objetivos de aprendizaje y conceptos fundamentales de la sesión' },
      { pct: 0.25, text: 'Demostración práctica: configuración del entorno y herramientas' },
      { pct: 0.5, text: 'Desarrollo guiado: análisis detallado y ejecución de casos' },
      { pct: 0.75, text: 'Puntos críticos de validación y control de calidad' },
      { pct: 0.9, text: 'Resumen ejecutivo, buenas prácticas y preparación para la autoevaluación' }
    ];

    const lines = milestones.map(m => {
      const sec = Math.floor(m.pct * duracionSegundos);
      const mins = Math.floor(sec / 60);
      const remSec = sec % 60;
      const fmt = (mins < 10 ? '0' : '') + mins + ':' + (remSec < 10 ? '0' : '') + remSec;
      return `[${fmt}] ${m.text}`;
    });

    this.leccion.transcripcionTexto = lines.join('\n');
  }

}
