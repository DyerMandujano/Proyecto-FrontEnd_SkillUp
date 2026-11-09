import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Persona } from '../../models/persona.model';
import { LoginResponse } from '../../models/login-response.model';

import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { UsuarioService } from '../../services/usuario.service';

declare var bootstrap: any; 

@Component({
  selector: 'app-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './estudiante.component.html',
  styleUrls: ['./estudiante.component.css']
})
export class EstudianteComponent implements OnInit {

  currentUser: LoginResponse | null = null;
  profileData: Persona | null = null;
  
  successMessage: string | null = null;
  errorMessage: string | null = null;

  confirmUsername: string = '';
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
  eliminandoCuenta: boolean = false;
  configModal: any; 

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private adminService: AdminService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  public get primerNombre(): string {
    if (this.currentUser && this.currentUser.nombreCompleto) {
      return this.currentUser.nombreCompleto.split(' ')[0];
    }
    return '...';
  }

  ngOnInit(): void {
    this.calcularMaxFechaNacimiento();
    this.currentUser = this.authService.getCurrentUser(); 

    if (this.currentUser) {
      this.loadProfileData(this.currentUser.idPersona);
    } else {
      this.authService.logout();
      this.router.navigate(['/login']);
    }

    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('configModal');
      if (modalElement) {
        this.configModal = new bootstrap.Modal(modalElement);
      }
    }
  }
  
  irAMisCertificados(): void {
    const idEstudiante = Number(localStorage.getItem('idEstudiante'));

    if (!idEstudiante) {
      return;
    }

    this.router.navigate(['/certificados/estudiante', idEstudiante]);
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
    if (!this.isPasswordCambioValida || !this.currentUser) return;
    this.guardandoPassword = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    this.authService.restablecerPassword({
      identificador: this.currentUser.username,
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
      error: (err: any) => { 
        this.errorMessage = 'Error al cargar los datos de tu perfil.';
      }
    });
  }

  onUpdateProfile(): void {
    if (!this.profileData) return;
    this.errorMessage = null;
    this.successMessage = null;

    const valNom = this.validarNombres();
    const valApe = this.validarApellidos();
    const valFec = this.validarFechaNacimiento();

    if (!valNom || !valApe || !valFec) {
      this.errorMessage = 'Por favor corrige los campos marcados en rojo antes de guardar.';
      return;
    }

    if (!this.profileData.genero) {
      this.errorMessage = 'Por favor selecciona un género.';
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
        this.successMessage = response || 'Perfil actualizado correctamente.'; 
        this.errorMessage = null;
        if (this.configModal) {
          this.configModal.hide(); 
        }

        if (this.currentUser) {
          this.currentUser.nombreCompleto = `${datosActualizados.nombres} ${datosActualizados.apellidos}`;
          this.authService.saveSession(this.currentUser); 
        }
      },
      error: (err: any) => { 
        this.guardandoPerfil = false;
        this.errorMessage = err.error?.message || (typeof err.error === 'string' ? err.error : 'Error al actualizar el perfil.');
        this.successMessage = null;
      }
    });
  }

  onDeleteAccount(): void {
    if (!this.currentUser) return;
    if (this.confirmUsername !== this.currentUser.username) {
      this.errorMessage = "El nombre de usuario no coincide.";
      return;
    }
    this.eliminandoCuenta = true;
    this.adminService.cambiarEstadoUsuario(this.currentUser.idUsuario, 0).subscribe({
      next: () => {
        this.eliminandoCuenta = false;
        alert('Tu cuenta de estudiante ha sido dada de baja exitosamente.');
        this.onLogout();
      },
      error: (err) => {
        this.eliminandoCuenta = false;
        this.errorMessage = err.error?.message || 'Error al procesar la baja de la cuenta.';
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
