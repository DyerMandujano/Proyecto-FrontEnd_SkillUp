import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Curso } from '../../../models/curso.model';
import { CursoService } from '../../../services/curso.service';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';

@Component({
  selector: 'app-actualizar-curso',
  standalone: true,
  imports: [CommonModule, FormsModule, DocenteHeaderComponent],
  templateUrl: './actualizar-curso.component.html',
  styleUrl: './actualizar-curso.component.css'
})
export class ActualizarCursoComponent implements OnInit {
  idCurso!: number;
  curso: Curso = {
    idCurso: 0,
    idDocente: 0,
    idCategoria: 0,
    nombreCurso: '',
    descripcion: '',
    resumen: '',
    nivel: '',
    duracionMin: 0,
    fechaPublicacion: '',
    imagenCurso1: '',
    imagenCurso2: '',
    estado: 1
  };

  categorias = [
    { id: 1, nombre: 'Gasfiteria' },
    { id: 2, nombre: 'Construccion' },
    { id: 3, nombre: 'Electricidad' },
    { id: 4, nombre: 'Carpinteria' },
    { id: 5, nombre: 'Soldadura' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService
  ) {}

  ngOnInit(): void {
    this.idCurso = Number(this.route.snapshot.paramMap.get('id'));
    this.cursoService.obtenerCursoPorId(this.idCurso).subscribe({
      next: (data) => {
        this.curso = data;
      },
      error: (err) => {
        alert('No se pudo cargar la informacion del curso.');
      }
    });
  }

  ingresarDocente(idDocente: number): void {
    this.router.navigate(['/docente', idDocente]);
  }

  actualizarCurso(): void {
    this.cursoService.actualizarCurso(this.idCurso, this.curso).subscribe({
      next: (mensaje) => {
        alert(mensaje);
        this.router.navigate(['/docente', this.curso.idDocente]);
      },
      error: (err) => {
        alert('Error al actualizar el curso');
      }
    });
  }
}
