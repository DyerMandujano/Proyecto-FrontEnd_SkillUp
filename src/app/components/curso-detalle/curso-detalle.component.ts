import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CursoService } from '../../services/curso.service';
import { SeccionService } from '../../services/seccion.service';
import { LeccionService } from '../../services/leccion.service';
import { Curso } from '../../models/curso.model';
import { Seccion } from '../../models/seccion.model';
import { Leccion } from '../../models/leccion.model';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { FormsModule } from '@angular/forms'; 
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';

@Component({
  selector: 'app-curso-detalle',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe, FormsModule], 
  templateUrl: './curso-detalle.component.html',
  styleUrls: ['./curso-detalle.component.css'],
})
export class CursoDetalleComponent implements OnInit {
  curso: Curso | null = null;
  secciones: Seccion[] = [];
  leccionesPorSeccion: { [key: number]: Leccion[] } = {};
  currentLesson: Leccion | null = null;
  currentSeccion: Seccion | null = null;
  cursoId!: number;
  cargando: boolean = true;
  error: string = '';
  isBrowser: boolean; 
  
  expandedSections: { [key: number]: boolean } = {};
  expandedResources: { [key: number]: boolean } = {};
  completedLessons: Set<number> = new Set();

  vistaActiva: 'video' | 'material' = 'video';
  materialSeleccionadoUrl: SafeResourceUrl | null = null;
  materialSeleccionadoRawUrl: string | null = null; 
  materialSeleccionadoNombre: string = '';
  tipoMaterialActual: 'pdf' | 'imagen' | 'word' | 'excel' | 'otro' = 'pdf';
  esPdf: boolean = false;
  cargandoMaterial: boolean = false;
  errorCargaMaterial: boolean = false;
  docxRenderError: boolean = false;

  // Variables para hojas Excel
  excelWorkbook: any = null;
  excelSheetNames: string[] = [];
  hojaExcelActiva: string = '';
  excelData: any[][] = [];

  pestanaActiva: string = 'descripcion';

  nuevaPregunta: string = '';
  nuevaNota: string = '';
  
  preguntasForo: { autor: string, texto: string, fecha: Date }[] = [];
  misNotas: { texto: string, fecha: Date }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService,
    private seccionService: SeccionService,
    private leccionService: LeccionService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer 
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); 
  }

  ngOnInit() {
    this.cursoId = +this.route.snapshot.paramMap.get('id')!;
    
    if (this.isBrowser && this.cursoId) {
      localStorage.setItem('cursoId', this.cursoId.toString());
    }

    this.cargarCurso();
  }

  cambiarPestana(pestana: string): void {
    this.pestanaActiva = pestana;
  }

  cargarCurso() {
    this.cargando = true;
    this.cursoService.obtenerCursoPorId(this.cursoId).subscribe({
      next: (curso) => {
        this.curso = curso;
        this.cargarSecciones();
      },
      error: (error) => {
        this.error = 'Error al cargar el curso';
        this.cargando = false;
      }
    });
  }

  regresarCursos(): void {
    if (!this.isBrowser) return;
    const idEstudianteLS = localStorage.getItem('idEstudiante');
    if (!idEstudianteLS) return;

    const idEstudiante = +idEstudianteLS;
    localStorage.removeItem('cursoId');
    this.router.navigate([`/visualizar-cursos/${idEstudiante}`]);
  }

  cargarSecciones() {
    this.seccionService.listarSeccionesActivasPorCurso(this.cursoId).subscribe({
      next: (secciones) => {
        this.secciones = secciones.sort((a, b) => a.ordenSeccion - b.ordenSeccion);
        this.cargarLeccionesPorSeccion();
      },
      error: (error) => {
        this.cargando = false;
      }
    });
  }

  cargarLeccionesPorSeccion() {
    let seccionesCargadas = 0;
    if (this.secciones.length === 0) {
      this.cargando = false;
      return;
    }

    this.secciones.forEach(seccion => {
      this.leccionService.listarLeccionesPorSeccion(seccion.idSeccion).subscribe({
        next: (lecciones) => {
          this.leccionesPorSeccion[seccion.idSeccion] = lecciones.sort((a, b) => a.ordenLeccion - b.ordenLeccion);
          seccionesCargadas++;
          if (seccion.ordenSeccion === 1) this.expandedSections[seccion.idSeccion] = true;
          if (seccion.ordenSeccion === 1 && lecciones.length > 0 && !this.currentLesson) {
            this.seleccionarLeccion(lecciones[0], seccion);
          }
          if (seccionesCargadas === this.secciones.length) this.cargando = false;
        },
        error: (error) => {
          seccionesCargadas++;
          if (seccionesCargadas === this.secciones.length) this.cargando = false;
        }
      });
    });
  }

  seleccionarLeccion(leccion: Leccion, seccion: Seccion): void {
    this.currentLesson = leccion;
    this.currentSeccion = seccion;
    this.volverAlVideo();
    if (!this.completedLessons.has(leccion.idLeccion)) {
      this.completedLessons.add(leccion.idLeccion);
    }
  }

  esUltimaLeccion(): boolean {
    if (!this.currentLesson || !this.secciones || !this.leccionesPorSeccion) return false;
    const ultimaSeccion = this.secciones[this.secciones.length - 1];
    const leccionesUltimaSeccion = this.leccionesPorSeccion[ultimaSeccion.idSeccion];
    if (!leccionesUltimaSeccion || leccionesUltimaSeccion.length === 0) return false;
    return this.currentLesson.idLeccion === leccionesUltimaSeccion[leccionesUltimaSeccion.length - 1].idLeccion;
  }

  toggleSection(sectionId: number): void {
    this.expandedSections[sectionId] = !this.expandedSections[sectionId];
  }

  toggleResources(lessonId: number): void {
    this.expandedResources[lessonId] = !this.expandedResources[lessonId];
  }

  isSectionExpanded(sectionId: number): boolean {
    return this.expandedSections[sectionId];
  }

  areResourcesExpanded(lessonId: number): boolean {
    return this.expandedResources[lessonId];
  }

  getProgressPercentage(): number {
    const totalLessons = Object.values(this.leccionesPorSeccion).reduce((total, lecciones) => total + lecciones.length, 0);
    return totalLessons > 0 ? (this.completedLessons.size / totalLessons) * 100 : 0;
  }

  getProgressText(): string {
    const totalLessons = Object.values(this.leccionesPorSeccion).reduce((total, lecciones) => total + lecciones.length, 0);
    return `${this.completedLessons.size} de ${totalLessons} lecciones completadas`;
  }

  siguienteLeccion(): void {
    if (this.currentLesson && this.currentSeccion) {
      const currentSeccionLecciones = this.leccionesPorSeccion[this.currentSeccion.idSeccion];
      const currentIndex = currentSeccionLecciones.findIndex(l => l.idLeccion === this.currentLesson!.idLeccion);
      if (currentIndex < currentSeccionLecciones.length - 1) {
        this.seleccionarLeccion(currentSeccionLecciones[currentIndex + 1], this.currentSeccion);
      } else {
        const currentSeccionIndex = this.secciones.findIndex(s => s.idSeccion === this.currentSeccion!.idSeccion);
        if (currentSeccionIndex < this.secciones.length - 1) {
          const nextSeccion = this.secciones[currentSeccionIndex + 1];
          const nextSeccionLecciones = this.leccionesPorSeccion[nextSeccion.idSeccion];
          if (nextSeccionLecciones && nextSeccionLecciones.length > 0) {
            this.seleccionarLeccion(nextSeccionLecciones[0], nextSeccion);
            this.expandedSections[nextSeccion.idSeccion] = true;
          }
        }
      }
    }
  }

  anteriorLeccion(): void {
    if (this.currentLesson && this.currentSeccion) {
      const currentSeccionLecciones = this.leccionesPorSeccion[this.currentSeccion.idSeccion];
      const currentIndex = currentSeccionLecciones.findIndex(l => l.idLeccion === this.currentLesson!.idLeccion);
      if (currentIndex > 0) {
        this.seleccionarLeccion(currentSeccionLecciones[currentIndex - 1], this.currentSeccion);
      } else {
        const currentSeccionIndex = this.secciones.findIndex(s => s.idSeccion === this.currentSeccion!.idSeccion);
        if (currentSeccionIndex > 0) {
          const prevSeccion = this.secciones[currentSeccionIndex - 1];
          const prevSeccionLecciones = this.leccionesPorSeccion[prevSeccion.idSeccion];
          if (prevSeccionLecciones && prevSeccionLecciones.length > 0) {
            this.seleccionarLeccion(prevSeccionLecciones[prevSeccionLecciones.length - 1], prevSeccion);
            this.expandedSections[prevSeccion.idSeccion] = true;
          }
        }
      }
    }
  }

  getLeccionesBySeccion(seccionId: number): Leccion[] {
    return this.leccionesPorSeccion[seccionId] || [];
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.completedLessons.has(lessonId);
  }

  irAEvaluacion(): void {
    if (!this.currentSeccion) return;
    this.router.navigate(['/evaluacion/seccion', this.currentSeccion.idSeccion]);
  }

  getIconoMaterial(url: string | undefined): string {
    if (!url) return 'bi-file-earmark-text text-secondary';
    const u = url.split('?')[0].toLowerCase();
    if (u.endsWith('.pdf')) return 'bi-file-earmark-pdf-fill text-danger';
    if (u.endsWith('.doc') || u.endsWith('.docx')) return 'bi-file-earmark-word-fill text-primary';
    if (u.endsWith('.xls') || u.endsWith('.xlsx') || u.endsWith('.csv')) return 'bi-file-earmark-excel-fill text-success';
    if (u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.gif') || u.endsWith('.webp') || u.endsWith('.svg')) return 'bi-file-earmark-image-fill text-warning';
    return 'bi-file-earmark-text-fill text-secondary';
  }

  extraerNombreDeUrl(url: string): string {
    if (!url) return 'Recurso de aprendizaje';
    const partes = url.replace(/\\/g, '/').split('/');
    const nombre = partes[partes.length - 1];
    try {
      return decodeURIComponent(nombre.replace(/^\d+_/, ''));
    } catch (e) {
      return nombre.replace(/^\d+_/, '');
    }
  }

  verMaterialEnPantalla(urlRuta: string | undefined, nombreArchivo?: string): void {
    if (!urlRuta) {
      this.materialSeleccionadoUrl = null;
      this.materialSeleccionadoRawUrl = null; 
      this.esPdf = false;
      return;
    }
    const urlNormalizada = urlRuta.replace(/\\/g, '/');
    const urlMinuscula = urlNormalizada.toLowerCase();

let urlCompleta = '';
    const backendBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    if (urlNormalizada.startsWith('http')) {
      urlCompleta = urlNormalizada;
    } else if (urlNormalizada.startsWith('uploads/')) {
      urlCompleta = ${backendBaseUrl}/;
    } else if (urlNormalizada.startsWith('/uploads/')) {
      urlCompleta = ${backendBaseUrl};
    } else {
      urlCompleta = ${backendBaseUrl}/;
    }

    this.materialSeleccionadoRawUrl = urlCompleta;
    this.materialSeleccionadoNombre = nombreArchivo || this.extraerNombreDeUrl(urlCompleta);
    
    // Resetear estados de visualización previa
    this.cargandoMaterial = true;
    this.errorCargaMaterial = false;
    this.docxRenderError = false;
    this.excelData = [];
    this.excelSheetNames = [];
    this.hojaExcelActiva = '';
    this.materialSeleccionadoUrl = null;

    if (urlMinuscula.endsWith('.pdf')) {
      this.tipoMaterialActual = 'pdf';
      this.esPdf = true;
      this.materialSeleccionadoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlCompleta);
      this.cargandoMaterial = false;
    } else if (urlMinuscula.endsWith('.png') || urlMinuscula.endsWith('.jpg') || urlMinuscula.endsWith('.jpeg') || 
               urlMinuscula.endsWith('.gif') || urlMinuscula.endsWith('.webp') || urlMinuscula.endsWith('.svg')) {
      this.tipoMaterialActual = 'imagen';
      this.esPdf = false;
      this.materialSeleccionadoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlCompleta);
      this.cargandoMaterial = false;
    } else if (urlMinuscula.endsWith('.xlsx') || urlMinuscula.endsWith('.xls') || urlMinuscula.endsWith('.csv')) {
      this.tipoMaterialActual = 'excel';
      this.esPdf = false;
      this.cargarExcel(urlCompleta);
    } else if (urlMinuscula.endsWith('.docx') || urlMinuscula.endsWith('.doc')) {
      this.tipoMaterialActual = 'word';
      this.esPdf = false;
      if (urlMinuscula.endsWith('.docx')) {
        this.cargarDocx(urlCompleta);
      } else {
        // Archivos .doc binarios antiguos (Word 97-2003): no son XML zipeado, se muestra tarjeta de descarga directa
        this.cargandoMaterial = false;
        this.docxRenderError = true;
      }
    } else {
      this.tipoMaterialActual = 'otro';
      this.esPdf = false;
      this.cargandoMaterial = false;
    }

    this.vistaActiva = 'material'; 
  }

  cargarExcel(url: string): void {
    if (!this.isBrowser) {
      this.cargandoMaterial = false;
      return;
    }
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Error al descargar el archivo Excel');
        return res.arrayBuffer();
      })
      .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        this.excelWorkbook = workbook;
        this.excelSheetNames = workbook.SheetNames || [];
        if (this.excelSheetNames.length > 0) {
          this.seleccionarHojaExcel(this.excelSheetNames[0]);
        }
        this.cargandoMaterial = false;
      })
      .catch(err => {
        console.error('Error al procesar hoja Excel:', err);
        this.errorCargaMaterial = true;
        this.cargandoMaterial = false;
      });
  }

  seleccionarHojaExcel(sheetName: string): void {
    this.hojaExcelActiva = sheetName;
    if (!this.excelWorkbook) return;
    const sheet = this.excelWorkbook.Sheets[sheetName];
    if (sheet) {
      this.excelData = (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]) || [];
    } else {
      this.excelData = [];
    }
  }

  cargarDocx(url: string): void {
    if (!this.isBrowser) {
      this.cargandoMaterial = false;
      return;
    }
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Error al descargar el documento Word');
        return res.arrayBuffer();
      })
      .then(buffer => {
        this.cargandoMaterial = false;
        setTimeout(() => {
          const container = document.getElementById('docxViewerContainer');
          if (container) {
            container.innerHTML = '';
            renderAsync(buffer, container, undefined, {
              className: 'docx-rendered',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false
            }).catch(err => {
              console.warn('Fallo renderizado DOCX nativo, mostrando tarjeta de descarga:', err);
              this.docxRenderError = true;
            });
          } else {
            this.docxRenderError = true;
          }
        }, 100);
      })
      .catch(err => {
        console.error('Error cargando documento Word:', err);
        this.errorCargaMaterial = true;
        this.cargandoMaterial = false;
      });
  }

  volverAlVideo(): void {
    this.vistaActiva = 'video';
    this.materialSeleccionadoUrl = null;
    this.materialSeleccionadoRawUrl = null;
    this.materialSeleccionadoNombre = '';
    this.esPdf = false; 
    this.excelData = [];
    this.excelSheetNames = [];
  }

  descargarMaterial(): void {
    if (this.materialSeleccionadoRawUrl) {
      const url = this.materialSeleccionadoRawUrl;
      const partesUrl = url.split('/');
      let nombreDescarga = this.materialSeleccionadoNombre || (partesUrl.length > 0 ? partesUrl[partesUrl.length - 1] : 'recurso-aprendizaje');
      
      const lastDotIndex = url.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        const extensionOriginal = url.substring(lastDotIndex).split('?')[0];
        if (extensionOriginal && !nombreDescarga.toLowerCase().endsWith(extensionOriginal.toLowerCase())) {
          nombreDescarga += extensionOriginal;
        }
      }

      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('Error al descargar');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = nombreDescarga;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.download = nombreDescarga;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    }
  }

  enviarPregunta(): void {
    if (this.nuevaPregunta.trim().length > 0) {
      this.preguntasForo.unshift({
        autor: 'Tú (Estudiante)', 
        texto: this.nuevaPregunta,
        fecha: new Date()
      });
      this.nuevaPregunta = '';
    }
  }

  guardarNota(): void {
    if (this.nuevaNota.trim().length > 0) {
      this.misNotas.unshift({
        texto: this.nuevaNota,
        fecha: new Date()
      });
      this.nuevaNota = '';
    }
  }
}