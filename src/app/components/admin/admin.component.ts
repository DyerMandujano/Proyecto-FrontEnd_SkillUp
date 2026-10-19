import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { ExportExcelService } from '../../services/export-excel.service';
import { SolicitudPagoResponse, UsuarioAdmin, MatriculaSeguimiento } from '../../models/admin.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  // Control de pestañas
  seccionActiva: 'dashboard' | 'pagos' | 'usuarios' | 'matriculas' = 'dashboard';

  // Datos de usuario administrador autenticado
  adminActual: any = null;

  // Estados de carga y mensajes
  cargando: boolean = false;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;

  // ==========================================
  // HU17: SOLICITUDES DE PAGO
  // ==========================================
  solicitudes: SolicitudPagoResponse[] = [];
  filtroEstadoPago: string = 'todos';
  solicitudSeleccionada: SolicitudPagoResponse | null = null;
  modalRechazoAbierto: boolean = false;
  motivoRechazo: string = '';
  errorRechazo: string | null = null;

  // Modal detalle completo de solicitud y comprobante
  modalDetalleAbierto: boolean = false;
  solicitudDetalle: SolicitudPagoResponse | null = null;

  // ==========================================
  // HU18: GESTIÓN DE USUARIOS
  // ==========================================
  usuarios: UsuarioAdmin[] = [];
  filtroRolUsuario: string = 'todos';
  busquedaUsuario: string = '';

  // ==========================================
  // HU19: SEGUIMIENTO DE MATRÍCULAS
  // ==========================================
  matriculas: MatriculaSeguimiento[] = [];
  busquedaMatricula: string = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private exportExcelService: ExportExcelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminActual = this.authService.getCurrentUser();
    this.cargarDatosDashboard();
  }

  cambiarSeccion(seccion: 'dashboard' | 'pagos' | 'usuarios' | 'matriculas'): void {
    this.seccionActiva = seccion;
    this.limpiarMensajes();

    if (seccion === 'dashboard') {
      this.cargarDatosDashboard();
    } else if (seccion === 'pagos') {
      this.cargarSolicitudes();
    } else if (seccion === 'usuarios') {
      this.cargarUsuarios();
    } else if (seccion === 'matriculas') {
      this.cargarMatriculas();
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  limpiarMensajes(): void {
    this.mensajeExito = null;
    this.mensajeError = null;
  }

  // ==========================================
  // DASHBOARD
  // ==========================================
  totalUsuarios: number = 0;
  totalEstudiantes: number = 0;
  totalDocentes: number = 0;
  pagosPendientes: number = 0;
  totalMatriculas: number = 0;

  cargarDatosDashboard(): void {
    this.cargando = true;
    this.adminService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.totalUsuarios = data.length;
        this.totalEstudiantes = data.filter(u => u.rol?.toLowerCase() === 'estudiante').length;
        this.totalDocentes = data.filter(u => u.rol?.toLowerCase() === 'docente').length;
      },
      error: () => {}
    });

    this.adminService.listarSolicitudesPago().subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.pagosPendientes = data.filter(s => s.estado?.toLowerCase() === 'pendiente').length;
      },
      error: () => {}
    });

    this.adminService.listarMatriculas().subscribe({
      next: (data) => {
        this.matriculas = data;
        this.totalMatriculas = data.length;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  // ==========================================
  // HU17: MÉTODOS DE PAGOS
  // ==========================================
  cargarSolicitudes(): void {
    this.cargando = true;
    this.adminService.listarSolicitudesPago(this.filtroEstadoPago).subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = 'Error al cargar solicitudes de pago';
        this.cargando = false;
      }
    });
  }

  aprobarSolicitud(s: SolicitudPagoResponse): void {
    if (!confirm(`¿Está seguro de APROBAR el pago del comprobante #${s.num_operacion}? La cuenta del estudiante será reactivada por 30 días.`)) {
      return;
    }
    this.cargando = true;
    this.adminService.aprobarSolicitudPago(s.id_solicitud).subscribe({
      next: () => {
        this.mensajeExito = `Solicitud #${s.num_operacion} aprobada con éxito. Cuenta reactivada por 30 días.`;
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.mensajeError = err.error || 'Error al aprobar solicitud';
        this.cargando = false;
      }
    });
  }

  abrirModalRechazo(s: SolicitudPagoResponse): void {
    this.solicitudSeleccionada = s;
    this.motivoRechazo = '';
    this.errorRechazo = null;
    this.modalRechazoAbierto = true;
  }

  cerrarModalRechazo(): void {
    this.modalRechazoAbierto = false;
    this.solicitudSeleccionada = null;
    this.motivoRechazo = '';
    this.errorRechazo = null;
  }

  confirmarRechazo(): void {
    if (!this.motivoRechazo || this.motivoRechazo.trim() === '') {
      this.errorRechazo = 'El motivo u observación de rechazo es obligatorio (HU17).';
      return;
    }
    if (!this.solicitudSeleccionada) return;

    this.cargando = true;
    this.adminService.rechazarSolicitudPago(this.solicitudSeleccionada.id_solicitud, this.motivoRechazo.trim()).subscribe({
      next: () => {
        this.mensajeExito = `Solicitud #${this.solicitudSeleccionada?.num_operacion} rechazada con observación registrada.`;
        this.cerrarModalRechazo();
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.errorRechazo = err.error || 'Error al rechazar solicitud';
        this.cargando = false;
      }
    });
  }

  abrirModalDetalle(s: SolicitudPagoResponse): void {
    this.solicitudDetalle = s;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle(): void {
    this.modalDetalleAbierto = false;
    this.solicitudDetalle = null;
  }

  obtenerUrlComprobante(ruta: string | undefined): string {
    if (!ruta) return '';
    if (ruta.startsWith('http')) return ruta;
    return `http://localhost:8888/${ruta}`;
  }

  esPdf(ruta: string | undefined): boolean {
    if (!ruta) return false;
    return ruta.toLowerCase().endsWith('.pdf');
  }

  // ==========================================
  // HU18: GESTIÓN DE USUARIOS
  // ==========================================
  cargarUsuarios(): void {
    this.cargando = true;
    this.adminService.listarUsuarios(this.filtroRolUsuario, this.busquedaUsuario).subscribe({
      next: (data) => {
        // Excluir cualquier cuenta con rol admin por seguridad en la vista
        this.usuarios = (data || []).filter(u => u.rol?.toLowerCase() !== 'admin');
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'Error al cargar usuarios';
        this.cargando = false;
      }
    });
  }

  cambiarEstado(u: UsuarioAdmin): void {
    const nuevoEstado = u.estado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'reactivar' : 'desactivar';

    if (!confirm(`¿Está seguro de ${accion} la cuenta de ${u.nombre_completo || u.username}?`)) {
      return;
    }

    this.cargando = true;
    this.adminService.cambiarEstadoUsuario(u.id_usuario, nuevoEstado).subscribe({
      next: (actualizado) => {
        u.estado = actualizado.estado;
        this.mensajeExito = `Cuenta de ${u.username} ${nuevoEstado === 1 ? 'reactivada' : 'desactivada'} exitosamente.`;
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = err.error || 'Error al cambiar estado de cuenta';
        this.cargando = false;
      }
    });
  }

  // ==========================================
  // HU19: SEGUIMIENTO DE MATRÍCULAS
  // ==========================================
  cargarMatriculas(): void {
    this.cargando = true;
    this.adminService.listarMatriculas(undefined, this.busquedaMatricula).subscribe({
      next: (data) => {
        this.matriculas = data;
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'Error al cargar seguimiento de matrículas';
        this.cargando = false;
      }
    });
  }

  exportarMatriculasExcel(): void {
    if (this.matriculas.length === 0) {
      alert('No hay registros de matrícula para exportar.');
      return;
    }

    const datosFormateados = this.matriculas.map(m => ({
      'ID Matrícula': m.id_matricula,
      'Estudiante': m.estudiante_nombre,
      'DNI': m.estudiante_dni,
      'Usuario': m.estudiante_username,
      'Curso': m.nombre_curso,
      'Fecha Matrícula': m.fecha_matricula,
      'Estado': m.estado_descripcion,
      'Progreso (%)': `${m.porcentaje_avance}%`
    }));

    this.exportExcelService.exportAsExcelFile(datosFormateados, `Reporte_Matriculas_SkillUp_${new Date().toISOString().slice(0, 10)}`);
  }
}
