import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { SolicitudPagoService } from '../../services/solicitud-pago.service';
import { SolicitudPagoResponse } from '../../models/admin.models';
import { LoginResponse } from '../../models/login-response.model';

@Component({
  selector: 'app-estado-solicitud',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './estado-solicitud.component.html',
  styleUrl: './estado-solicitud.component.css'
})
export class EstadoSolicitudComponent implements OnInit {

  currentUser: LoginResponse | null = null;
  idEstudiante: number = 0;
  solicitudes: SolicitudPagoResponse[] = [];
  cargando: boolean = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private solicitudPagoService: SolicitudPagoService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentUser.rol === 'estudiante') {
      this.idEstudiante = this.currentUser.idRolEspecifico || 0;
    }

    if (!this.idEstudiante && isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('idEstudiante');
      if (stored) {
        this.idEstudiante = Number(stored);
      }
    }

    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    if (!this.idEstudiante) {
      this.cargando = false;
      this.error = 'No se encontró el ID del estudiante.';
      return;
    }

    this.cargando = true;
    this.error = null;

    this.solicitudPagoService.listarPorEstudiante(this.idEstudiante).subscribe({
      next: (data) => {
        this.solicitudes = data || [];
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = 'Error al cargar las solicitudes. Por favor reintenta.';
      }
    });
  }

  get cantidadPendientes(): number {
    return this.solicitudes.filter(s => s.estado === 'Pendiente').length;
  }

  get cantidadAprobadas(): number {
    return this.solicitudes.filter(s => s.estado === 'Aprobado').length;
  }

  get cantidadRechazadas(): number {
    return this.solicitudes.filter(s => s.estado === 'Rechazado').length;
  }

  obtenerUrlComprobante(ruta: string | undefined): string {
    if (!ruta) return '';
    if (ruta.startsWith('http')) return ruta;
    // Si viene como 'uploads/archivo.jpg'
    return `http://localhost:8888/${ruta}`;
  }

  volver(): void {
    if (this.idEstudiante) {
      this.router.navigate(['/visualizar-cursos', this.idEstudiante]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
