import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Curso } from '../../../models/curso.model';
import { CursoService } from '../../../services/curso.service';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';

@Component({
  selector: 'app-registrar-curso',
  standalone: true,
  imports: [CommonModule, FormsModule, DocenteHeaderComponent],
  templateUrl: './registrar-curso.component.html',
  styleUrl: './registrar-curso.component.css'
})
export class RegistrarCursoComponent implements OnInit {
  idDocente!: number;
  nuevoCurso: Curso = {
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
    private cursoService: CursoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idDocente = Number(this.route.snapshot.paramMap.get('id'));
    this.nuevoCurso.idDocente = this.idDocente;
  }

  registrarCurso(): void {
    this.nuevoCurso.fechaPublicacion = new Date().toISOString().split('T')[0];

    this.cursoService.insertarCurso(this.nuevoCurso).subscribe({
      next: (mensaje) => {
        alert(mensaje);
        this.router.navigate(['/docente', this.idDocente]);
      },
      error: (err) => {
        alert('Error al registrar el curso.');
      }
    });
  }

  onFileSelected(event: any, tipo: number): void {
    const file: File = event.target.files[0];

    if (!file) {
        return;
    }

    const fileName = file.name;

    if (tipo === 1) {
      this.nuevoCurso.imagenCurso1 = fileName;
    } else {
      this.nuevoCurso.imagenCurso2 = fileName;
    }
  }
}
