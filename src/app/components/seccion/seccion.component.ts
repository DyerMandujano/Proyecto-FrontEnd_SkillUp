import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeccionService } from '../../services/seccion.service';
import { Seccion } from '../../models/seccion.model';
import { CommonModule } from '@angular/common';
import { DocenteHeaderComponent } from '../docente-header/docente-header.component';

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

  constructor(
    private route: ActivatedRoute,
    private seccionService: SeccionService,
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
    if (this.idDocente) {
      this.router.navigate([`/docente/${this.idDocente}`]);
    } else {
      alert('No se pudo determinar el docente. Intenta ingresar nuevamente desde el panel principal.');
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
