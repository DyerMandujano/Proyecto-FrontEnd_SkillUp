import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CursoService } from '../../services/curso.service';
import { Curso } from '../../models/curso.model';

interface CursoDestacado {
  idCurso: number;
  nombreCurso: string;
  categoria: string;
  descripcion: string;
  nivel: string;
  duracionMin: number;
  estudiantes: number;
  rating: number;
  imagen: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  menuAbierto: boolean = false;
  textoBusqueda: string = '';
  cursosDestacados: CursoDestacado[] = [];
  cargandoCursos: boolean = true;

  // Cursos de respaldo destacados en caso de que el backend no tenga cursos cargados
  cursosDefault: CursoDestacado[] = [
    {
      idCurso: 1,
      nombreCurso: 'Java Spring Boot Avanzado',
      categoria: 'Desarrollo Backend',
      descripcion: 'Domina Spring Data JPA, Microservicios, Security JWT y procedimientos almacenados para aplicaciones empresariales.',
      nivel: 'Avanzado',
      duracionMin: 240,
      estudiantes: 1850,
      rating: 4.9,
      imagen: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'
    },
    {
      idCurso: 2,
      nombreCurso: 'Angular Moderno & TypeScript',
      categoria: 'Desarrollo Frontend',
      descripcion: 'Aprende Standalone Components, Signals, RxJS, arquitectura escalable y consumo de APIs REST profesionales.',
      nivel: 'Intermedio',
      duracionMin: 210,
      estudiantes: 1420,
      rating: 4.8,
      imagen: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
    },
    {
      idCurso: 3,
      nombreCurso: 'SQL Server & Procedimientos Almacenados',
      categoria: 'Bases de Datos',
      descripcion: 'Optimización de consultas SQL, triggers, procedimientos almacenados transaccionales y modelado relacional robusto.',
      nivel: 'Intermedio',
      duracionMin: 180,
      estudiantes: 1120,
      rating: 4.9,
      imagen: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80'
    },
    {
      idCurso: 4,
      nombreCurso: 'Docker & Despliegue de Microservicios',
      categoria: 'DevOps & Cloud',
      descripcion: 'Contenedores Docker, Docker Compose, redes, volúmenes y despliegue continuo de servicios en la nube.',
      nivel: 'Todos los niveles',
      duracionMin: 160,
      estudiantes: 950,
      rating: 4.7,
      imagen: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80'
    }
  ];

  constructor(
    private cursoService: CursoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCursos();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  buscarCursos(): void {
    const el = document.getElementById('cursos-destacados');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  cargarCursos(): void {
    this.cargandoCursos = true;
    this.cursoService.listarCursos().subscribe({
      next: (data: Curso[]) => {
        if (data && data.length > 0) {
          // Adaptar los cursos del backend a la vista destacada
          this.cursosDestacados = data.slice(0, 4).map((c, index) => {
            const fallback = this.cursosDefault[index % this.cursosDefault.length];
            return {
              idCurso: c.idCurso,
              nombreCurso: c.nombreCurso || fallback.nombreCurso,
              categoria: this.obtenerNombreCategoria(c.idCategoria),
              descripcion: c.resumen || c.descripcion || fallback.descripcion,
              nivel: c.nivel || fallback.nivel,
              duracionMin: c.duracionMin || fallback.duracionMin,
              estudiantes: fallback.estudiantes,
              rating: fallback.rating,
              imagen: c.imagenCurso1 || fallback.imagen
            };
          });
        } else {
          this.cursosDestacados = this.cursosDefault;
        }
        this.cargandoCursos = false;
      },
      error: () => {
        // En caso de que el backend no responda, mostrar los cursos por defecto para no romper el diseño
        this.cursosDestacados = this.cursosDefault;
        this.cargandoCursos = false;
      }
    });
  }

  obtenerNombreCategoria(idCat: number): string {
    switch (idCat) {
      case 1: return 'Desarrollo Backend';
      case 2: return 'Desarrollo Frontend';
      case 3: return 'Bases de Datos';
      case 4: return 'DevOps & Cloud';
      default: return 'Tecnología & Software';
    }
  }

  onImageError(event: Event, fallbackSrc: string): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = fallbackSrc;
    }
  }
}
