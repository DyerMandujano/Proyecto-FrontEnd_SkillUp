import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router'; 
import { CursoService } from '../../services/curso.service';
import { SeccionService } from '../../services/seccion.service';
import { LeccionService } from '../../services/leccion.service';
import { Curso } from '../../models/curso.model';
import { Seccion } from '../../models/seccion.model';
import { Leccion } from '../../models/leccion.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudianteService } from '../../services/estudiante.service';
import { MatriculaService } from '../../services/matricula.service';
import { ReseniaService, ReseniaCurso } from '../../services/resenia.service';

@Component({
  selector: 'app-curso-descripcion',
  templateUrl: './curso-descripcion.component.html',
  styleUrls: ['./curso-descripcion.component.css'],
  imports: [CommonModule, RouterLink, FormsModule]
})
export class CursoDescripcionComponent implements OnInit {
  curso: Curso | null = null;
  secciones: Seccion[] = [];
  leccionesPorSeccion: { [key: number]: Leccion[] } = {};
  cursoId!: number;
  cargando: boolean = true;
  error: string = '';
  idEstudiante: number | null = null;
  estaMatriculado: boolean = false;

  // Estado HU-20: Reseñas
  listaResenias: ReseniaCurso[] = [];
  calificacionSeleccionada: number = 0;
  comentarioResenia: string = '';
  enviandoResenia: boolean = false;
  mensajeExitoResenia: string | null = null;
  mensajeErrorResenia: string | null = null;
  promedioCalificacion: number = 5.0;
  totalResenias: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private cursoService: CursoService,
    private seccionService: SeccionService,
    private leccionService: LeccionService,
    private estudianteService: EstudianteService,
    private matriculaService: MatriculaService,
    private reseniaService: ReseniaService
  ) {}

  ngOnInit() {
    this.cursoId = +this.route.snapshot.paramMap.get('id')!;
    localStorage.setItem('cursoId', this.cursoId.toString());

    const idFromParams = this.route.snapshot.queryParamMap.get('estudianteId');
    const idFromStorage = localStorage.getItem('idEstudiante') || localStorage.getItem('idRolEspecifico');
    if (idFromParams) {
      this.idEstudiante = +idFromParams;
    } else if (idFromStorage) {
      this.idEstudiante = +idFromStorage;
    }

    if (this.idEstudiante) {
      this.verificarMatriculaActual();
    }
    
    this.cargarCurso();
    this.cargarResenias();
  }

  verificarMatriculaActual() {
    if (this.idEstudiante && this.cursoId) {
      this.matriculaService.verificarMatricula(this.idEstudiante, this.cursoId).subscribe({
        next: (matriculado) => {
          this.estaMatriculado = matriculado;
        },
        error: () => {
          this.estaMatriculado = false;
        }
      });
    }
  }

  cargarResenias() {
    this.reseniaService.listarResenias(this.cursoId).subscribe({
      next: (resenias) => {
        this.listaResenias = resenias || [];
        this.totalResenias = this.listaResenias.length;
        if (this.totalResenias > 0) {
          const suma = this.listaResenias.reduce((acc, curr) => acc + curr.calificacion, 0);
          this.promedioCalificacion = +(suma / this.totalResenias).toFixed(1);
        } else {
          this.promedioCalificacion = 5.0;
        }
      },
      error: () => {
        this.listaResenias = [];
      }
    });
  }

  seleccionarEstrellas(puntos: number) {
    this.calificacionSeleccionada = puntos;
    this.mensajeErrorResenia = null;
  }

  publicarResenia() {
    this.mensajeErrorResenia = null;
    this.mensajeExitoResenia = null;

    if (!this.idEstudiante) {
      this.mensajeErrorResenia = 'Debes iniciar sesión como estudiante para calificar este curso.';
      return;
    }

    if (!this.estaMatriculado) {
      this.mensajeErrorResenia = 'Solo los estudiantes matriculados en este curso pueden registrar una reseña.';
      return;
    }

    // Escenario 2: Validar calificación obligatoria de 1 a 5
    if (!this.calificacionSeleccionada || this.calificacionSeleccionada < 1 || this.calificacionSeleccionada > 5) {
      this.mensajeErrorResenia = 'Por favor selecciona una puntuación de 1 a 5 estrellas para tu reseña.';
      return;
    }

    if (!this.comentarioResenia || this.comentarioResenia.trim().length === 0) {
      this.mensajeErrorResenia = 'El comentario de la reseña no puede estar vacío.';
      return;
    }

    this.enviandoResenia = true;
    this.reseniaService.registrarResenia(this.cursoId, {
      idEstudiante: this.idEstudiante,
      calificacion: this.calificacionSeleccionada,
      comentario: this.comentarioResenia.trim()
    }).subscribe({
      next: (reseniaCreada) => {
        this.enviandoResenia = false;
        this.mensajeExitoResenia = '¡Tu reseña ha sido publicada con éxito!';
        this.comentarioResenia = '';
        this.calificacionSeleccionada = 0;
        this.cargarResenias();
      },
      error: (err) => {
        this.enviandoResenia = false;
        this.mensajeErrorResenia = err.error || err.error?.message || 'Error al publicar la reseña.';
      }
    });
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

  registrarMatricula(): void {
    const idEstudianteLS = localStorage.getItem('idEstudiante');
    const idCursoLS = localStorage.getItem('cursoId');

    if (!idEstudianteLS || !idCursoLS) {
      return;
    }

    const idEstudiante = +idEstudianteLS;
    const idCurso = +idCursoLS;

    this.matriculaService.insertarMatricula(idEstudiante, idCurso)
      .subscribe({
        next: (resp) => {
          this.router.navigate([`/curso/${idCurso}/lecciones`]);
        },
        error: (err) => {
        }
      });
  }

  cargarSecciones() {
    this.seccionService.listarSeccionesPorCurso(this.cursoId).subscribe({
      next: (secciones) => {
        this.secciones = secciones;
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
          this.leccionesPorSeccion[seccion.idSeccion] = lecciones;
          seccionesCargadas++;
          
          if (seccionesCargadas === this.secciones.length) {
            this.cargando = false;
          }
        },
        error: (error) => {
          seccionesCargadas++;
          if (seccionesCargadas === this.secciones.length) {
            this.cargando = false;
          }
        }
      });
    });
  }

  getLeccionesBySeccion(seccionId: number): Leccion[] {
    return this.leccionesPorSeccion[seccionId] || [];
  }

  imagenSeleccionada: string | null = null;

  seleccionarImagen(img: string): void {
    this.imagenSeleccionada = img;
  }

  obtenerUrlImagen(imagen: string | null | undefined): string {
    return this.cursoService.obtenerUrlImagen(imagen);
  }

  manejarErrorImagen(event: Event): void {
    this.cursoService.manejarErrorImagen(event);
  }
}