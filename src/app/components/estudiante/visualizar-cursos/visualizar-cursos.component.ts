import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CursoMatricula } from '../../../models/CursoMatricula';
import { CursoNoMatricula } from '../../../models/CursoNoMatricula';
import { Persona } from '../../../models/persona.model';
import { LoginResponse } from '../../../models/login-response.model';
import { SolicitudPagoResponse } from '../../../models/admin.models';

import { EstudianteService } from '../../../services/estudiante.service';
import { AuthService } from '../../../services/auth.service';
import { UsuarioService } from '../../../services/usuario.service';
import { CursoService } from '../../../services/curso.service';
import { SolicitudPagoService } from '../../../services/solicitud-pago.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-visualizar-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './visualizar-cursos.component.html',
  styleUrl: './visualizar-cursos.component.css'
})
export class VisualizarCursosComponent implements OnInit {

  idEstudiante!: number;
  cursos: CursoMatricula[] = [];
  cursosNoM: CursoNoMatricula[] = [];

  currentUser: LoginResponse | null = null;
  profileData: Persona | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  confirmUsername: string = '';
  configModal: any; 

  // Restricciones de cuenta por evaluación
  cuentaDeshabilitada: boolean = false;
  tieneSolicitudPendiente: boolean = false;
  solicitudes: SolicitudPagoResponse[] = [];
  ultimaSolicitud: SolicitudPagoResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private estudianteService: EstudianteService,
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private cursoService: CursoService,
    private solicitudPagoService: SolicitudPagoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  public get primerNombre(): string {
    if (this.currentUser && this.currentUser.nombreCompleto) {
      return this.currentUser.nombreCompleto.split(' ')[0];
    }
    return '...';
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.loadProfileData(this.currentUser.idPersona);

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idEstudiante = +id;
        
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('idEstudiante', this.idEstudiante.toString());
        }
        
        this.obtenerCursosPorEstudiante(this.idEstudiante);
        this.obtenerCursosSinMatricula(this.idEstudiante);
        this.verificarEstadoCuenta(this.idEstudiante);
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('configModal');
      if (modalElement) {
        this.configModal = new bootstrap.Modal(modalElement);
      }
    }
  }

  verificarEstadoCuenta(id: number): void {
    this.solicitudPagoService.listarPorEstudiante(id).subscribe({
      next: (data) => {
        this.solicitudes = data || [];
        if (this.solicitudes.length > 0) {
          this.ultimaSolicitud = this.solicitudes[0];
          this.tieneSolicitudPendiente = this.solicitudes.some(s => s.estado === 'Pendiente');
          if (this.tieneSolicitudPendiente) {
            this.cuentaDeshabilitada = true;
          }
        }
      },
      error: () => {}
    });
  }

  intentarVerCurso(idCurso: number): void {
    if (this.cuentaDeshabilitada) {
      Swal.fire({
        icon: 'warning',
        title: 'Acceso Restringido',
        text: 'Tu cuenta se encuentra deshabilitada o en proceso de reactivación. No puedes matricularte ni ver nuevos cursos hasta la aprobación del administrador.',
        confirmButtonColor: '#1565C0'
      });
      return;
    }
    this.router.navigate(['/curso', idCurso]);
  }

  obtenerCursosPorEstudiante(id: number): void {
    this.estudianteService.obtenerCursosMatricula(id).subscribe({
      next: (data) => { this.cursos = data; },
      error: (err) => { }
    });
  }

  obtenerCursosSinMatricula(id: number): void {
    this.cursoService.listarCursosSinMatriculaporEstu(id).subscribe({
      next: (data) => { this.cursosNoM = data; },
      error: (err) => { }
    });
  }

  irAMisCertificados(): void {
    let idEstudiante = 0;
    if (isPlatformBrowser(this.platformId)) {
       idEstudiante = Number(localStorage.getItem('idEstudiante'));
    }

    if (!idEstudiante) {
      return;
    }
    this.router.navigate(['/certificados/estudiante', idEstudiante]);
  }

  loadProfileData(idPersona: number): void {
    this.usuarioService.obtenerPerfil(idPersona).subscribe(
      (data: Persona) => { 
        this.profileData = data;
        if (this.profileData && this.profileData.fechaDeNacimiento) {
          this.profileData.fechaDeNacimiento = new Date(this.profileData.fechaDeNacimiento).toISOString().split('T')[0];
        }
        if (this.profileData && this.profileData.estado === 0) {
          this.cuentaDeshabilitada = true;
        }
      },
      (err: any) => { this.errorMessage = 'Error al cargar tu perfil.'; }
    );
  }

  onUpdateProfile(): void {
    if (!this.profileData) return;
    this.usuarioService.actualizarPerfil(this.profileData.idPersona, this.profileData).subscribe(
      (response: string) => { 
        this.successMessage = response; 
        this.errorMessage = null;
        if (this.configModal) this.configModal.hide(); 
        if(this.currentUser) {
            this.currentUser.nombreCompleto = `${this.profileData?.nombres} ${this.profileData?.apellidos}`;
            this.authService.saveSession(this.currentUser); 
        }
      },
      (err: any) => { 
        this.errorMessage = err.error?.message || 'Error al actualizar.';
        this.successMessage = null;
      }
    );
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
  
  onDeleteAccount(): void {
      if (this.confirmUsername !== this.currentUser?.username) {
          this.errorMessage = "El usuario no coincide.";
          return;
      }
  }

  obtenerUrlImagen(imagen: string | null | undefined): string {
    return this.cursoService.obtenerUrlImagen(imagen);
  }

  manejarErrorImagen(event: Event): void {
    this.cursoService.manejarErrorImagen(event);
  }
}