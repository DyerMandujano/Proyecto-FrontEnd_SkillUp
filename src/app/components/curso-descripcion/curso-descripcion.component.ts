import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router'; 
import { CursoService } from '../../services/curso.service';
import { SeccionService } from '../../services/seccion.service';
import { LeccionService } from '../../services/leccion.service';
import { Curso } from '../../models/curso.model';
import { Seccion } from '../../models/seccion.model';
import { Leccion } from '../../models/leccion.model';
import { CommonModule } from '@angular/common';
import { EstudianteService } from '../../services/estudiante.service';
import { MatriculaService } from '../../services/matricula.service';

@Component({
  selector: 'app-curso-descripcion',
  templateUrl: './curso-descripcion.component.html',
  styleUrls: ['./curso-descripcion.component.css'],
  imports: [CommonModule, RouterLink]
})
export class CursoDescripcionComponent implements OnInit {
  curso: Curso | null = null;
  secciones: Seccion[] = [];
  leccionesPorSeccion: { [key: number]: Leccion[] } = {};
  cursoId!: number;
  cargando: boolean = true;
  error: string = '';
  idEstudiante!: number;
  estaMatriculado: boolean = false;

   constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private cursoService: CursoService,
    private seccionService: SeccionService,
    private leccionService: LeccionService,
    private estudianteService: EstudianteService,
    private matriculaService: MatriculaService
  ) {}

  ngOnInit() {
    this.cursoId = +this.route.snapshot.paramMap.get('id')!;
    localStorage.setItem('cursoId', this.cursoId.toString());

    const idFromParams = this.route.snapshot.queryParamMap.get('estudianteId');
    if (idFromParams) {
      this.idEstudiante = +idFromParams;
    }
    
    this.cargarCurso(); 
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
}