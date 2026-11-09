import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { Persona } from '../../models/persona.model';
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

  // ==========================================
  // CONFIGURACIÓN DE PERFIL ADMIN
  // ==========================================
  modalConfiguracionAbierto: boolean = false;
  pestanaPerfilActiva: 'perfil' | 'password' | 'danger' = 'perfil';
  profileData: Persona | null = null;
  maxFechaNacimiento: string = '';
  minFechaNacimiento: string = '1900-01-01';
  fechaNacimientoError: string | null = null;
  fechaNacimientoTouched: boolean = false;
  nombresError: string | null = null;
  apellidosError: string | null = null;
  guardandoPerfil: boolean = false;

  nuevaPassword: string = '';
  confirmarNuevaPassword: string = '';
  mostrarNuevaPassword: boolean = false;
  mostrarConfirmarPassword: boolean = false;
  guardandoPassword: boolean = false;
  passwordSuccess: string | null = null;
  passwordError: string | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private exportExcelService: ExportExcelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.calcularMaxFechaNacimiento();
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

  rechazarDesdeDetalle(): void {
    if (!this.solicitudDetalle) return;
    const s = this.solicitudDetalle;
    this.cerrarModalDetalle();
    this.abrirModalRechazo(s);
  }

  aprobarDesdeDetalle(): void {
    if (!this.solicitudDetalle) return;
    const s = this.solicitudDetalle;
    this.cerrarModalDetalle();
    this.aprobarSolicitud(s);
  }

  obtenerUrlComprobante(ruta: string | undefined): string {
    if (!ruta) return '';
    if (ruta.startsWith('http')) return ruta;
    return ruta.startsWith('/') ? ruta : `/${ruta}`;
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

  // ==========================================
  // MÉTODOS DE CONFIGURACIÓN DE PERFIL ADMIN
  // ==========================================
  abrirModalConfiguracion(): void {
    this.modalConfiguracionAbierto = true;
    this.pestanaPerfilActiva = 'perfil';
    this.limpiarMensajes();
    this.passwordError = null;
    this.passwordSuccess = null;
    if (this.adminActual?.idPersona) {
      this.loadProfileData(this.adminActual.idPersona);
    }
  }

  cerrarModalConfiguracion(): void {
    this.modalConfiguracionAbierto = false;
  }

  calcularMaxFechaNacimiento(): void {
    const hoy = new Date();
    const anioMax = hoy.getFullYear() - 12;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.maxFechaNacimiento = `${anioMax}-${mes}-${dia}`;
  }

  esMayorDeEdad(fechaStr: string | undefined | null): boolean {
    if (!fechaStr) return false;
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return false;
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const cumple = new Date(anio, mes, dia);
    const hoy = new Date();
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return edad >= 12;
  }

  validarFechaNacimiento(): boolean {
    const fecha = this.profileData?.fechaDeNacimiento;
    if (!fecha) {
      this.fechaNacimientoError = 'Por favor selecciona tu fecha de nacimiento.';
      return false;
    }
    const partes = fecha.split('-');
    if (partes.length === 3 && parseInt(partes[0], 10) < 1900) {
      this.fechaNacimientoError = 'La fecha de nacimiento no puede ser anterior a 1900.';
      return false;
    }
    if (!this.esMayorDeEdad(fecha)) {
      this.fechaNacimientoError = 'Debes tener al menos 12 años cumplidos para estar registrado en SkillUp.';
      return false;
    }
    this.fechaNacimientoError = null;
    return true;
  }

  onFechaNacimientoChange(): void {
    this.fechaNacimientoTouched = true;
    this.validarFechaNacimiento();
  }

  validarNombres(): boolean {
    const nom = (this.profileData?.nombres || '').trim();
    if (!nom) {
      this.nombresError = 'Por favor ingresa tus nombres.';
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(nom)) {
      this.nombresError = 'Solo se permiten letras y espacios en nombres.';
      return false;
    }
    if (nom.length < 2) {
      this.nombresError = 'El nombre debe tener al menos 2 letras.';
      return false;
    }
    this.nombresError = null;
    return true;
  }

  validarApellidos(): boolean {
    const ape = (this.profileData?.apellidos || '').trim();
    if (!ape) {
      this.apellidosError = 'Por favor ingresa tus apellidos.';
      return false;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(ape)) {
      this.apellidosError = 'Solo se permiten letras y espacios en apellidos.';
      return false;
    }
    if (ape.length < 2) {
      this.apellidosError = 'El apellido debe tener al menos 2 letras.';
      return false;
    }
    this.apellidosError = null;
    return true;
  }

  get passValidations() {
    const p = this.nuevaPassword || '';
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
      match: !!p && p === this.confirmarNuevaPassword
    };
  }

  get isPasswordCambioValida(): boolean {
    const v = this.passValidations;
    return v.minLength && v.hasUpper && v.hasLower && v.hasNumber && v.hasSpecial && v.match;
  }

  validarPasswordCambio(): void {
    this.passwordError = null;
    this.passwordSuccess = null;
  }

  onCambiarPassword(): void {
    if (!this.isPasswordCambioValida || !this.adminActual) return;
    this.guardandoPassword = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    this.authService.restablecerPassword({
      identificador: this.adminActual.username,
      nuevaContrasenia: this.nuevaPassword,
      confirmarContrasenia: this.confirmarNuevaPassword
    }).subscribe({
      next: (res) => {
        this.guardandoPassword = false;
        this.passwordSuccess = res.mensaje || 'Contraseña actualizada con éxito.';
        this.nuevaPassword = '';
        this.confirmarNuevaPassword = '';
      },
      error: (err) => {
        this.guardandoPassword = false;
        this.passwordError = err.error?.mensaje || 'Error al actualizar la contraseña.';
      }
    });
  }

  loadProfileData(idPersona: number): void {
    this.usuarioService.obtenerPerfil(idPersona).subscribe({
      next: (data: Persona) => {
        this.profileData = data;
        const rawFecha = (data as any).fecha_nacimiento || data.fechaDeNacimiento;
        if (rawFecha) {
          if (typeof rawFecha === 'string') {
            this.profileData.fechaDeNacimiento = rawFecha.split('T')[0];
          } else {
            const d = new Date(rawFecha);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            this.profileData.fechaDeNacimiento = `${y}-${m}-${day}`;
          }
          (this.profileData as any).fecha_nacimiento = this.profileData.fechaDeNacimiento;
        }
        this.validarFechaNacimiento();
      },
      error: () => {
        this.mensajeError = 'Error al cargar los datos del perfil de administrador.';
      }
    });
  }

  onUpdateProfile(): void {
    if (!this.profileData || !this.adminActual) return;
    this.limpiarMensajes();

    const valNom = this.validarNombres();
    const valApe = this.validarApellidos();
    const valFec = this.validarFechaNacimiento();

    if (!valNom || !valApe || !valFec) {
      this.mensajeError = 'Por favor corrige los campos marcados en rojo antes de guardar.';
      return;
    }

    if (!this.profileData.genero) {
      this.mensajeError = 'Por favor selecciona un género.';
      return;
    }

    this.guardandoPerfil = true;
    const datosActualizados: Persona = {
      ...this.profileData,
      nombres: this.profileData.nombres.trim(),
      apellidos: this.profileData.apellidos.trim(),
      fechaDeNacimiento: this.profileData.fechaDeNacimiento,
      fecha_nacimiento: this.profileData.fechaDeNacimiento
    };

    this.usuarioService.actualizarPerfil(this.profileData.idPersona, datosActualizados).subscribe({
      next: (response: string) => {
        this.guardandoPerfil = false;
        this.mensajeExito = response || 'Perfil actualizado correctamente.';
        this.cerrarModalConfiguracion();
        this.adminActual.nombreCompleto = `${datosActualizados.nombres} ${datosActualizados.apellidos}`;
        this.authService.saveSession(this.adminActual);
      },
      error: (err: any) => {
        this.guardandoPerfil = false;
        this.mensajeError = err.error?.message || (typeof err.error === 'string' ? err.error : 'Error al actualizar el perfil.');
      }
    });
  }
}
