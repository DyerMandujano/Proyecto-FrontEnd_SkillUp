import { Component, OnInit } from '@angular/core';
import { Leccion } from '../../../models/leccion.model';
import { ActivatedRoute, Router } from '@angular/router';
import { LeccionService } from '../../../services/leccion.service';
import { CommonModule, Location } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { DocenteHeaderComponent } from '../../docente-header/docente-header.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-registrar-leccion',
  standalone: true,
  imports: [CommonModule, FormsModule, DocenteHeaderComponent],
  templateUrl: './registrar-leccion.component.html',
  styleUrl: './registrar-leccion.component.css'
})
export class RegistrarLeccionComponent implements OnInit {

  idSeccion!: number;
  videoUrlSegura: SafeResourceUrl | null = null;

  nuevaLeccion: Leccion = {
    idLeccion: 0,
    idSeccion: 0,
    nombreLeccion: '',
    duracion: 0,
    ordenLeccion: 0,
    estado: 1,
    urlVideo: '',
    materiales: []
  }

  constructor(
    private route: ActivatedRoute,
    private leccionService: LeccionService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private location: Location 
  ) {}

  ngOnInit(): void {
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));
    this.nuevaLeccion.idSeccion = this.idSeccion;
  }

  agregarMaterial() {
    this.nuevaLeccion.materiales.push({ urlMaterial: '', nombreArchivo: '' });
  }

  quitarMaterial(index: number) {
    this.nuevaLeccion.materiales.splice(index, 1);
  }

  onFileSelected(event: any, index: number) {
    const file: File = event.target.files[0];
    if (file) {
      this.nuevaLeccion.materiales[index].archivoFisico = file;
      
      if (!this.nuevaLeccion.materiales[index].nombreArchivo) {
        this.nuevaLeccion.materiales[index].nombreArchivo = file.name;
      }
    }
  }

  registrarSeccion() {
    this.leccionService.insertarLeccion(this.nuevaLeccion, this.archivoSubtitulos).subscribe({
      next: (mensaje) => {
        alert('Leccion creada correctamente');
        const idSeccionGuardado = localStorage.getItem('idSeccionActual') || this.idSeccion;
        this.router.navigate([`/leccion/seccion/${idSeccionGuardado}`]);
      },
      error: (err) => {
        alert('Error al registrar la leccion.');
      }
    });
  }

  cancelar() {
    this.location.back();
  }

  actualizarVistaPreviaVideo() {
    if (!this.nuevaLeccion.urlVideo) {
      this.videoUrlSegura = null;
      return;
    }

    const videoId = this.extraerVideoId(this.nuevaLeccion.urlVideo);
    
    if (videoId) {
      const urlEmbed = `https://www.youtube.com/embed/${videoId}`;
      this.videoUrlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(urlEmbed);
    } else {
      this.videoUrlSegura = null; 
    }
  }

  extraerVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  archivoSubtitulos?: File;

  onSubtitulosSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSubtitulos = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text && (!this.nuevaLeccion.transcripcionTexto || this.nuevaLeccion.transcripcionTexto.trim().length === 0)) {
          this.nuevaLeccion.transcripcionTexto = text;
        }
      };
      reader.readAsText(file);
    }
  }

  autogenerarMarcasDeTiempo() {
    const titulo = this.nuevaLeccion.nombreLeccion || 'Lección';
    const duracion = this.nuevaLeccion.duracion && this.nuevaLeccion.duracion > 0 ? this.nuevaLeccion.duracion : 8;
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

    this.nuevaLeccion.transcripcionTexto = lines.join('\n');
  }

}
