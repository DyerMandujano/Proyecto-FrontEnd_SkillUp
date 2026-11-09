import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeccionService } from '../../services/seccion.service';
import { CursoService } from '../../services/curso.service';
import { DocenteDashboardService } from '../../services/docente-dashboard.service';
import { Seccion } from '../../models/seccion.model';
import { CommonModule } from '@angular/common';
import { DocenteHeaderComponent } from '../docente-header/docente-header.component';

interface CursoRendimiento {
  nombreCurso: string;
  calificacion: number;
  totalEstudiantes: number;
  visualizaciones: number;
  porcentaje: number;
}

interface ActividadReciente {
  estudiante: string;
  accion: string;
  curso: string;
  tiempo: string;
}

@Component({
  selector: 'app-seccion',
  imports: [CommonModule, DocenteHeaderComponent],
  templateUrl: './seccion.component.html',
  styleUrl: './seccion.component.css'
})
export class SeccionComponent implements OnInit {

  idCurso!: number;
  idDocente!: number;

  secciones: Seccion[] = [];

  // Métricas reales
  totalEstudiantes: number = 0;
  calificacionPromedio: number = 0.0;
  certificadosEmitidos: number = 0;
  visualizacionesTotales: number = 0;
  cursosRendimiento: CursoRendimiento[] = [];
  actividadesRecientes: ActividadReciente[] = [];

  constructor(
    private route: ActivatedRoute,
    private seccionService: SeccionService,
    private cursoService: CursoService,
    private dashboardService: DocenteDashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idCurso = Number(this.route.snapshot.paramMap.get('id'));

    const storedDocenteId = localStorage.getItem('idDocente');
    if (storedDocenteId) {
      this.idDocente = Number(storedDocenteId);
    }
    
    this.seccionService.listarSeccionesPorCurso(this.idCurso)
      .subscribe(data => (this.secciones = data));

    if (this.idDocente) {
      this.cargarMetricasReales();
    }
  }

  cargarMetricasReales(): void {
    // 1. Cargar cursos reales del docente
    this.cursoService.listarCursosPorDocente(this.idDocente).subscribe({
      next: (cursos) => {
        if (!cursos || cursos.length === 0) {
          this.totalEstudiantes = 0;
          this.cursosRendimiento = [];
          return;
        }

        // 2. Cargar ranking de estudiantes por curso
        this.dashboardService.getRankingCursos(this.idDocente).subscribe({
          next: (ranking) => {
            const rankingNorm = this.normalizarRanking(ranking);
            let sumEstudiantes = 0;

            this.cursosRendimiento = cursos.map(curso => {
              const r = rankingNorm.find(item => item.nombreCurso?.toLowerCase() === curso.nombreCurso?.toLowerCase());
              const cantEstudiantes = r ? Number(r.totalEstudiantes) || 0 : 0;
              sumEstudiantes += cantEstudiantes;
              return {
                nombreCurso: curso.nombreCurso,
                calificacion: 0.0,
                totalEstudiantes: cantEstudiantes,
                visualizaciones: 0,
                porcentaje: cantEstudiantes > 0 ? Math.min(100, Math.round((cantEstudiantes / (sumEstudiantes || 1)) * 100)) : 0
              };
            });

            this.totalEstudiantes = sumEstudiantes;
          },
          error: () => {
            this.totalEstudiantes = 0;
            this.cursosRendimiento = cursos.map(c => ({
              nombreCurso: c.nombreCurso,
              calificacion: 0.0,
              totalEstudiantes: 0,
              visualizaciones: 0,
              porcentaje: 0
            }));
          }
        });

        // 3. Cargar certificados emitidos
        this.dashboardService.getCertificadosPorCurso(this.idDocente).subscribe({
          next: (certificados) => {
            if (Array.isArray(certificados) && certificados.length > 0) {
              this.certificadosEmitidos = certificados.reduce((acc, curr) => {
                const cant = Array.isArray(curr) ? (Number(curr[1]) || 0) : (Number(curr.cantidad) || 0);
                return acc + cant;
              }, 0);
            } else {
              this.certificadosEmitidos = 0;
            }
          },
          error: () => {
            this.certificadosEmitidos = 0;
          }
        });
      },
      error: () => {
        this.totalEstudiantes = 0;
        this.certificadosEmitidos = 0;
        this.cursosRendimiento = [];
      }
    });
  }

  private normalizarRanking(data: any[]): any[] {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item: any) => {
      if (Array.isArray(item)) {
        return { nombreCurso: item[0], totalEstudiantes: item[1] };
      }
      return item;
    });
  }

  navegarRegistrarSeccion(): void {
    this.router.navigate([`/curso/${this.idCurso}/registrar-seccion`]);
  }

  navegarActualizarSeccion(idSeccion: number): void {
    this.router.navigate(['/actualizar-seccion', idSeccion]);
  }

  navegarLeccion(idSeccion: number) {
    localStorage.setItem('idCursoActual', this.idCurso.toString());
    this.router.navigate(['/leccion/seccion', idSeccion]);
  }

  volverAlPanelDeCursos(): void {
    const id = this.idDocente || Number(localStorage.getItem('idDocente'));
    if (id) {
      this.router.navigate([`/docente/${id}`]);
    } else {
      this.router.navigate(['/']);
    }
  }
  
  eliminarSeccion(idSeccion: number): void {
    if (confirm('Estas seguro de eliminar esta seccion?')) {
      this.seccionService.eliminarSeccion(idSeccion).subscribe({
        next: (respuesta) => {
          this.seccionService.listarSeccionesPorCurso(this.idCurso)
              .subscribe(data => this.secciones = data);
        },
        error: (err) => {
          alert('No se pudo eliminar seccion');
        }
      });
    }
  }

}