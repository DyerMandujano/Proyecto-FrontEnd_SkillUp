export interface LineaTranscripcion {
  id: number;
  segundoInicio: number;
  segundoFin: number;
  tiempoFormateado: string;
  texto: string;
}

import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { AccessibilityThemeService } from '../../services/accessibility-theme.service';
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
export class CursoDetalleComponent implements OnInit, OnDestroy {
  public readonly a11y = inject(AccessibilityThemeService);
  lineasTranscripcion: LineaTranscripcion[] = [];
  lineaActivaId: number = -1;
  tiempoActualSegundos: number = 0;
  private messageListener?: (event: MessageEvent) => void;
  private timerPing?: any;
  private ytPlayer?: any;
  private ytInterval?: any;

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
    this.iniciarEscuchaYouTube();
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
    this.cargarLineasTranscripcion(leccion, seccion);
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
      urlCompleta = backendBaseUrl + '/' + urlNormalizada;
    } else if (urlNormalizada.startsWith('/uploads/')) {
      urlCompleta = backendBaseUrl + urlNormalizada;
    } else {
      urlCompleta = backendBaseUrl + '/' + urlNormalizada;
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

  ngOnDestroy(): void {
    if (this.timerPing) {
      clearInterval(this.timerPing);
    }
    if (this.ytInterval) {
      clearInterval(this.ytInterval);
    }
    if (this.isBrowser && this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
  }

  get transcripcionActual(): string {
    return this.lineasTranscripcion.map(l => `[${l.tiempoFormateado}] ${l.texto}`).join('\n');
  }

  get lineaActivaTexto(): string {
    const linea = this.lineasTranscripcion.find(l => l.id === this.lineaActivaId);
    return linea ? linea.texto : (this.lineasTranscripcion.length > 0 ? this.lineasTranscripcion[0].texto : '');
  }

  get tiempoFormateadoActual(): string {
    const mins = Math.floor(this.tiempoActualSegundos / 60);
    const secs = this.tiempoActualSegundos % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  trackByLinea(index: number, linea: LineaTranscripcion): number {
    return linea.id;
  }

  cargarLineasTranscripcion(leccion: Leccion, seccion?: Seccion | null): void {
    this.lineasTranscripcion = [];
    this.lineaActivaId = -1;
    this.tiempoActualSegundos = 0;

    // 1. Si la lección cuenta con transcripción manual guardada en base de datos
    if (leccion.transcripcionTexto && leccion.transcripcionTexto.trim().length > 0) {
      this.lineasTranscripcion = this.parsearTextoTranscripcion(leccion.transcripcionTexto);
      if (this.lineasTranscripcion.length > 0) {
        this.actualizarTiempoActual(0);
        return;
      }
    }

    // 2. Si no tiene transcripción manual, generamos la sincronización dinámica para cualquier video/enlace
    this.lineasTranscripcion = this.generarTranscripcionParaLeccion(leccion, seccion);
    this.actualizarTiempoActual(0);
  }

  private parsearTextoTranscripcion(texto: string): LineaTranscripcion[] {
    const lineas: LineaTranscripcion[] = [];
    const rawLines = texto.split('\n');
    let id = 1;

    for (const r of rawLines) {
      const match = r.match(/\[?(\d{1,2}):(\d{2})\]?\s*(.*)/);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const segundoInicio = mins * 60 + secs;
        const contenido = match[3] || 'Explicación del contenido';
        lineas.push({
          id: id++,
          segundoInicio,
          segundoFin: segundoInicio + 20,
          tiempoFormateado: (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs,
          texto: contenido
        });
      }
    }

    // Ajustar segundoFin para que coincida con el inicio de la siguiente
    for (let i = 0; i < lineas.length - 1; i++) {
      lineas[i].segundoFin = lineas[i + 1].segundoInicio;
    }
    if (lineas.length > 0) {
      lineas[lineas.length - 1].segundoFin = lineas[lineas.length - 1].segundoInicio + 300;
    }

    return lineas;
  }

  private generarTranscripcionParaLeccion(leccion: Leccion, seccion?: Seccion | null): LineaTranscripcion[] {
    const titulo = leccion.nombreLeccion || 'Lección';
    const modulo = seccion?.nombreSeccion || 'Módulo Principal';
    const cursoNombre = this.curso?.nombreCurso || 'SkillUp';
    const duracionMins = leccion.duracion && leccion.duracion > 0 ? leccion.duracion : 8;

    // Tiempos progresivos sincronizados calculados a partir de la lección
    const steps = [
      { offsetSec: 0, desc: `Inicio de la lección: ${titulo}. Bienvenida e introducción al objetivo de aprendizaje.` },
      { offsetSec: 15, desc: `Contexto general en el marco de ${modulo} dentro del curso ${cursoNombre}.` },
      { offsetSec: 45, desc: `Demostración práctica: configuración del entorno y revisión de los elementos clave.` },
      { offsetSec: 90, desc: `Desarrollo guiado: análisis de casos, conceptos fundamentales y flujo de interacción.` },
      { offsetSec: 150, desc: `Criterios de calidad y pautas de validación para garantizar la correcta ejecución.` },
      { offsetSec: 210, desc: `Resolución de dudas frecuentes y optimización del resultado final.` },
      { offsetSec: 280, desc: `Conclusiones y resumen de competencias alcanzadas en la sesión.` },
      { offsetSec: 360, desc: `Instrucciones para descargar el material complementario y rendir la autoevaluación.` }
    ];

    const totalSegundos = duracionMins * 60;
    const lineas: LineaTranscripcion[] = [];

    steps.forEach((st, idx) => {
      if (st.offsetSec < totalSegundos || idx === 0) {
        const mins = Math.floor(st.offsetSec / 60);
        const secs = st.offsetSec % 60;
        const timeFormatted = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
        const nextOffset = idx < steps.length - 1 ? steps[idx + 1].offsetSec : totalSegundos + 60;

        lineas.push({
          id: idx + 1,
          segundoInicio: st.offsetSec,
          segundoFin: nextOffset,
          tiempoFormateado: timeFormatted,
          texto: st.desc
        });
      }
    });

    return lineas;
  }

  actualizarTiempoActual(segundos: number): void {
    this.tiempoActualSegundos = Math.floor(segundos);
    const activa = this.lineasTranscripcion.find(l => segundos >= l.segundoInicio && segundos < l.segundoFin);
    if (activa && activa.id !== this.lineaActivaId) {
      this.lineaActivaId = activa.id;
      if (this.isBrowser) {
        setTimeout(() => {
          const el = document.getElementById('linea-transcripcion-' + activa.id);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 30);
      }
    }
  }

  iniciarEscuchaYouTube(): void {
    if (!this.isBrowser) return;

    // 1. Cargar script oficial de YouTube Iframe API si no existe
    if (!(window as any).YT && !document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const initPlayer = () => {
      try {
        if ((window as any).YT && (window as any).YT.Player && document.getElementById('youtube-player-iframe')) {
          this.ytPlayer = new (window as any).YT.Player('youtube-player-iframe', {
            events: {
              onStateChange: (ev: any) => {
                if (ev.data === 1) { // 1 = PLAYING
                  if (!this.ytInterval) {
                    this.ytInterval = setInterval(() => {
                      if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
                        const t = this.ytPlayer.getCurrentTime();
                        this.actualizarTiempoActual(t);
                      }
                    }, 350);
                  }
                } else {
                  if (this.ytInterval) {
                    clearInterval(this.ytInterval);
                    this.ytInterval = null;
                  }
                }
              }
            }
          });
        }
      } catch {}
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setTimeout(initPlayer, 600);
    } else {
      (window as any).onYouTubeIframeAPIReady = () => {
        setTimeout(initPlayer, 400);
      };
    }

    // 2. Escucha fallback reactiva por postMessage de YouTube
    this.messageListener = (event: MessageEvent) => {
      try {
        if (!event.origin || !event.origin.includes('youtube.com')) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            this.actualizarTiempoActual(data.info.currentTime);
          }
        }
      } catch {}
    };

    window.addEventListener('message', this.messageListener);

    // 3. Ping bidireccional continuo
    this.timerPing = setInterval(() => {
      const iframe = document.getElementById('youtube-player-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
      }
    }, 600);
  }

  saltarATiempo(segundo: number): void {
    if (!this.isBrowser) return;

    // 1. Si es video HTML5 directo (MP4)
    const video = document.getElementById('html5-player-video') as HTMLVideoElement;
    if (video) {
      video.currentTime = segundo;
      video.play().catch(() => {});
    }

    // 2. Si es YouTube vía API nativa
    if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(segundo, true);
        this.ytPlayer.playVideo();
      } catch {}
    }

    // 3. Si es YouTube vía postMessage
    const iframe = document.getElementById('youtube-player-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [segundo, true]
      }), '*');
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*');
    }

    this.actualizarTiempoActual(segundo);
  }

  onHtml5TimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video) {
      this.actualizarTiempoActual(video.currentTime);
    }
  }

  descargarTranscripcion(): void {
    if (!this.isBrowser) return;
    const titulo = this.currentLesson?.nombreLeccion || 'leccion';
    let contenido = `============================================================\n`;
    contenido += `SKILLUP - TRANSCRIPCIÓN SINCRONIZADA ACCESIBLE\n`;
    contenido += `Curso: ${this.curso?.nombreCurso || 'Curso SkillUp'}\n`;
    contenido += `Módulo: ${this.currentSeccion?.nombreSeccion || 'Módulo Principal'}\n`;
    contenido += `Lección: ${titulo}\n`;
    contenido += `Fecha de descarga: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}\n`;
    contenido += `============================================================\n\n`;

    this.lineasTranscripcion.forEach(l => {
      contenido += `[${l.tiempoFormateado}] ${l.texto}\n\n`;
    });

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = titulo.replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Transcripcion_${safeTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  esVideoDirecto(): boolean {
    if (!this.currentLesson || !this.currentLesson.urlVideo) return false;
    const url = this.currentLesson.urlVideo.toLowerCase();
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg') || url.includes('/videos/');
  }
}
