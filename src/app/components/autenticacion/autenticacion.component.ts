import { Component, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core'; 
import { isPlatformBrowser, CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/login-request.model';
import { RegistroRequest } from '../../models/registro-request.model';

@Component({
  selector: 'app-autenticacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './autenticacion.component.html',
  styleUrls: ['./autenticacion.component.css']
})
export class AutenticacionComponent implements AfterViewInit, OnDestroy {

  loginData: LoginRequest = {
    username: '',
    contrasenia: ''
  };
  registerData = {
    nombres: '',
    apellidos: '',
    dni: '',
    username: '',
    contrasenia: '',
    confirmar_contrasenia: '',
    fecha_nacimiento: '',
    genero: '',
    rol: '',
    nivel_educativo: '',
    especialidad: '',
    grado_academico: ''
  };

  loginError: string | null = null;
  registroExitoso: string | null = null;
  registroError: string | null = null;
  dniError: string | null = null;
  nombreError: string | null = null;
  apellidoError: string | null = null;
  fechaNacimientoError: string | null = null;
  passwordMismatchError: string | null = null;

  mostrarContrasenia: boolean = false;
  mostrarConfirmarContrasenia: boolean = false;

  // Fecha máxima para asegurar mayoría de edad (18 años)
  maxFechaNacimiento: string = '';

  private dniErrorTimeout: any = null;
  private registroErrorTimeout: any = null;
  private registroExitosoTimeout: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - 18);
    this.maxFechaNacimiento = hoy.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    if (this.dniErrorTimeout) clearTimeout(this.dniErrorTimeout);
    if (this.registroErrorTimeout) clearTimeout(this.registroErrorTimeout);
    if (this.registroExitosoTimeout) clearTimeout(this.registroExitosoTimeout);
  }

  setDniError(mensaje: string): void {
    this.dniError = mensaje;
    if (this.dniErrorTimeout) clearTimeout(this.dniErrorTimeout);
    this.dniErrorTimeout = setTimeout(() => {
      this.dniError = null;
    }, 5000);
  }

  setRegistroError(mensaje: string): void {
    this.registroError = mensaje;
    if (this.registroErrorTimeout) clearTimeout(this.registroErrorTimeout);
    this.registroErrorTimeout = setTimeout(() => {
      this.registroError = null;
    }, 5000);
  }

  setRegistroExitoso(mensaje: string): void {
    this.registroExitoso = mensaje;
    if (this.registroExitosoTimeout) clearTimeout(this.registroExitosoTimeout);
    this.registroExitosoTimeout = setTimeout(() => {
      this.registroExitoso = null;
    }, 5000);
  }

  // Prevenir que el usuario teclee números o caracteres especiales en nombres y apellidos
  soloLetras(event: KeyboardEvent): boolean {
    if (['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      return true;
    }
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/;
    if (!regex.test(event.key)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onNombreInput(): void {
    if (this.registerData.nombres && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(this.registerData.nombres)) {
      this.nombreError = "El nombre solo debe contener letras.";
    } else {
      this.nombreError = null;
    }
  }

  onApellidoInput(): void {
    if (this.registerData.apellidos && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(this.registerData.apellidos)) {
      this.apellidoError = "El apellido solo debe contener letras.";
    } else {
      this.apellidoError = null;
    }
  }

  esMayorDeEdad(fechaStr: string): boolean {
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
    return edad >= 18;
  }

  onFechaNacimientoChange(): void {
    if (!this.registerData.fecha_nacimiento) {
      this.fechaNacimientoError = null;
      return;
    }
    if (!this.esMayorDeEdad(this.registerData.fecha_nacimiento)) {
      this.fechaNacimientoError = "Debes ser mayor de 18 años para registrarte.";
    } else {
      this.fechaNacimientoError = null;
    }
  }

  onDniInput(): void {
    if (this.dniError) {
      this.dniError = null;
      if (this.dniErrorTimeout) clearTimeout(this.dniErrorTimeout);
    }
  }

  onPasswordInput(): void {
    if (this.registerData.confirmar_contrasenia) {
      if (this.registerData.contrasenia !== this.registerData.confirmar_contrasenia) {
        this.passwordMismatchError = "Las contraseñas no coinciden.";
      } else {
        this.passwordMismatchError = null;
      }
    } else {
      this.passwordMismatchError = null;
    }
  }

  toggleMostrarContrasenia(): void {
    this.mostrarContrasenia = !this.mostrarContrasenia;
  }

  toggleMostrarConfirmarContrasenia(): void {
    this.mostrarConfirmarContrasenia = !this.mostrarConfirmarContrasenia;
  }

  get passwordValidations() {
    const pwd = this.registerData.contrasenia || '';
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)
    };
  }

  get isPasswordValid(): boolean {
    const v = this.passwordValidations;
    return v.minLength && v.hasUpper && v.hasLower && v.hasNumber && v.hasSpecial;
  }

  onLoginSubmit() {
    this.loginError = null; 
    
    this.authService.login(this.loginData).subscribe(
      response => {
        console.log('Login exitoso!', response);
        this.authService.saveSession(response);
        
        if (response.rol === 'docente') {
          this.router.navigate(['docente', response.idRolEspecifico]);
        } else if (response.rol === 'estudiante') {
          this.router.navigate(['/visualizar-cursos', response.idRolEspecifico]);
        } else {
          this.router.navigate(['/']);
        }
      },
      error => {
        console.error('Error en el login:', error);
        if (typeof error.error === 'string') {
          this.loginError = error.error;
        } else if (error.error?.message) {
          this.loginError = error.error.message;
        } else {
          this.loginError = 'Credenciales incorrectas';
        }
      }
    );
  }

  onRegisterSubmit() {
    this.dniError = null;
    this.registroError = null;
    this.registroExitoso = null;
    this.passwordMismatchError = null;
    this.nombreError = null;
    this.apellidoError = null;
    this.fechaNacimientoError = null;

    if (!this.registerData.rol) {
      this.setRegistroError("Por favor, selecciona un rol (Estudiante o Docente).");
      return;
    }

    if (!this.registerData.nombres || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(this.registerData.nombres.trim())) {
      this.nombreError = "El nombre solo debe contener letras.";
      this.setRegistroError("El nombre solo debe contener letras.");
      return;
    }

    if (!this.registerData.apellidos || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(this.registerData.apellidos.trim())) {
      this.apellidoError = "El apellido solo debe contener letras.";
      this.setRegistroError("El apellido solo debe contener letras.");
      return;
    }

    if (!this.registerData.dni || this.registerData.dni.trim().length !== 8) {
      this.setDniError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    if (!this.registerData.fecha_nacimiento || !this.esMayorDeEdad(this.registerData.fecha_nacimiento)) {
      this.fechaNacimientoError = "Debes ser mayor de 18 años para registrarte.";
      this.setRegistroError("Debes ser mayor de 18 años para registrarte.");
      return;
    }

    if (!this.isPasswordValid) {
      this.setRegistroError("La contraseña debe cumplir con todos los requisitos de seguridad.");
      return;
    }

    if (this.registerData.contrasenia !== this.registerData.confirmar_contrasenia) {
      this.passwordMismatchError = "Las contraseñas no coinciden.";
      this.setRegistroError("Las contraseñas no coinciden. Por favor, verifícalas.");
      return;
    }

    const payload: RegistroRequest = {
      persona: {
        nombres: this.registerData.nombres.trim(),
        apellidos: this.registerData.apellidos.trim(),
        dni: this.registerData.dni.trim(),
        fecha_nacimiento: this.registerData.fecha_nacimiento,
        genero: this.registerData.genero
      },
      usuario: {
        username: this.registerData.username.trim(),
        contrasenia: this.registerData.contrasenia,
        rol: this.registerData.rol
      },
      estudiante: this.registerData.rol === 'estudiante' ? {
        nivel_educativo: this.registerData.nivel_educativo
      } : null,
      docente: this.registerData.rol === 'docente' ? {
        especialidad: this.registerData.especialidad,
        grado_academico: this.registerData.grado_academico
      } : null
    };

    this.authService.register(payload).subscribe(
      response => {
        console.log('Registro exitoso!', response);
        this.setRegistroExitoso('¡Cuenta creada! Por favor, inicia sesión.');
        document.getElementById('botonInicioSesion')?.click();
      },
      error => {
        console.error('Error en el registro:', error);
        let mensaje = 'Error al crear la cuenta. Verifique los datos.';
        if (typeof error.error === 'string') {
          mensaje = error.error;
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }

        // Si el error está relacionado con el DNI, mostrarlo directamente debajo del campo DNI
        if (mensaje.toLowerCase().includes('dni')) {
          this.setDniError(mensaje);
        } else {
          this.setRegistroError(mensaje);
        }
      }
    );
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const botonRegistro = document.getElementById('botonRegistro');
      const botonInicioSesion = document.getElementById('botonInicioSesion');
      const contenedorPrincipal = document.getElementById('contenedorPrincipal');
      
      botonRegistro?.addEventListener('click', () => {
        contenedorPrincipal?.classList.add('panel-derecho-activo');
      });
      
      botonInicioSesion?.addEventListener('click', () => {
        contenedorPrincipal?.classList.remove('panel-derecho-activo');
      });
      
      if (window.location.hash === '#registro') {
        contenedorPrincipal?.classList.add('panel-derecho-activo');
      }

      const rolEstudianteRadio = document.getElementById('rolEstudiante') as HTMLInputElement;
      const rolDocenteRadio = document.getElementById('rolDocente') as HTMLInputElement;
      
      const toggleRoleFields = () => {
        const camposEstudianteDiv = document.getElementById('camposEstudiante');
        const camposDocenteDiv = document.getElementById('camposDocente');
        
        if (rolEstudianteRadio.checked) {
          camposEstudianteDiv!.style.display = 'block';
          camposDocenteDiv!.style.display = 'none';
          this.registerData.rol = 'estudiante';
        } else if (rolDocenteRadio.checked) {
          camposEstudianteDiv!.style.display = 'none';
          camposDocenteDiv!.style.display = 'block';
          this.registerData.rol = 'docente';
        }
      };

      rolEstudianteRadio?.addEventListener('change', toggleRoleFields);
      rolDocenteRadio?.addEventListener('change', toggleRoleFields);
    }
  }

}