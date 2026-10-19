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
    celular: '',
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
  usernameError: string | null = null;
  celularError: string | null = null;
  fechaNacimientoError: string | null = null;
  passwordMismatchError: string | null = null;
  generoError: string | null = null;
  rolError: string | null = null;

  nombreTouched: boolean = false;
  apellidoTouched: boolean = false;
  dniTouched: boolean = false;
  usernameTouched: boolean = false;
  celularTouched: boolean = false;
  passwordTouched: boolean = false;
  confirmarPasswordTouched: boolean = false;
  fechaNacimientoTouched: boolean = false;
  generoTouched: boolean = false;
  rolTouched: boolean = false;

  mostrarContrasenia: boolean = false;
  mostrarConfirmarContrasenia: boolean = false;
  mostrarLoginContrasenia: boolean = false;

  // Fecha máxima para asegurar edad mínima (12 años)
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
    hoy.setFullYear(hoy.getFullYear() - 12);
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

  soloNumeros(event: KeyboardEvent): boolean {
    if (['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) {
      return true;
    }
    const regex = /^[0-9]$/;
    if (!regex.test(event.key)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onNombreInput(): void {
    this.nombreTouched = true;
    this.validarNombre();
  }

  validarNombre(): void {
    const nom = this.registerData.nombres ? this.registerData.nombres.trim() : '';
    if (!nom) {
      this.nombreError = "Por favor, escribe tus nombres (este campo es obligatorio).";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(nom)) {
      this.nombreError = "Solo se permiten letras y espacios (sin números ni símbolos especiales).";
    } else if (nom.length < 2) {
      this.nombreError = "El nombre debe tener al menos 2 letras.";
    } else {
      this.nombreError = null;
    }
  }

  onApellidoInput(): void {
    this.apellidoTouched = true;
    this.validarApellido();
  }

  validarApellido(): void {
    const ape = this.registerData.apellidos ? this.registerData.apellidos.trim() : '';
    if (!ape) {
      this.apellidoError = "Por favor, escribe tus apellidos (este campo es obligatorio).";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(ape)) {
      this.apellidoError = "Solo se permiten letras y espacios (sin números ni símbolos especiales).";
    } else if (ape.length < 2) {
      this.apellidoError = "El apellido debe tener al menos 2 letras.";
    } else {
      this.apellidoError = null;
    }
  }

  onDniInput(): void {
    this.dniTouched = true;
    if (this.registerData.dni) {
      this.registerData.dni = this.registerData.dni.replace(/\D/g, '').slice(0, 8);
    }
    this.validarDni();
  }

  validarDni(): void {
    const dni = this.registerData.dni ? this.registerData.dni.trim() : '';
    if (!dni) {
      this.dniError = "El DNI es obligatorio para validar tu identidad.";
    } else if (dni.length !== 8) {
      this.dniError = `El DNI debe tener exactamente 8 dígitos numéricos (has escrito ${dni.length} de 8).`;
    } else {
      this.dniError = null;
    }
  }

  onCelularInput(): void {
    this.celularTouched = true;
    if (this.registerData.celular) {
      this.registerData.celular = this.registerData.celular.replace(/\D/g, '').slice(0, 9);
    }
    this.validarCelular();
  }

  validarCelular(): void {
    const cel = this.registerData.celular ? this.registerData.celular.trim() : '';
    if (!cel) {
      // Es opcional
      this.celularError = null;
    } else if (!cel.startsWith('9')) {
      this.celularError = "El número celular debe comenzar con el dígito 9 (Perú).";
    } else if (cel.length !== 9) {
      this.celularError = `El número celular debe tener exactamente 9 dígitos (has escrito ${cel.length} de 9).`;
    } else {
      this.celularError = null;
    }
  }

  onUsernameInput(): void {
    this.usernameTouched = true;
    this.validarUsername();
  }

  validarUsername(): void {
    const usr = this.registerData.username ? this.registerData.username.trim() : '';
    if (!usr) {
      this.usernameError = "Por favor ingresa un correo o nombre de usuario válido.";
    } else if (usr.length < 3) {
      this.usernameError = "El usuario o correo debe tener al menos 3 caracteres.";
    } else {
      this.usernameError = null;
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
    return edad >= 12;
  }

  onFechaNacimientoChange(): void {
    this.fechaNacimientoTouched = true;
    this.validarFechaNacimiento();
  }

  validarFechaNacimiento(): void {
    if (!this.registerData.fecha_nacimiento) {
      this.fechaNacimientoError = "Por favor selecciona tu fecha de nacimiento.";
    } else if (!this.esMayorDeEdad(this.registerData.fecha_nacimiento)) {
      this.fechaNacimientoError = "Debes tener al menos 12 años cumplidos para registrarte en SkillUp.";
    } else {
      this.fechaNacimientoError = null;
    }
  }

  onPasswordInput(): void {
    this.passwordTouched = true;
    if (this.registerData.confirmar_contrasenia) {
      this.validarConfirmarPassword();
    }
  }

  onConfirmarPasswordInput(): void {
    this.confirmarPasswordTouched = true;
    this.validarConfirmarPassword();
  }

  validarConfirmarPassword(): void {
    if (!this.registerData.confirmar_contrasenia) {
      this.passwordMismatchError = "Por favor confirma tu contraseña escribiéndola nuevamente.";
    } else if (this.registerData.contrasenia !== this.registerData.confirmar_contrasenia) {
      this.passwordMismatchError = "Las contraseñas no coinciden. Asegúrate de que sean idénticas.";
    } else {
      this.passwordMismatchError = null;
    }
  }

  validarGenero(): void {
    this.generoTouched = true;
    if (!this.registerData.genero) {
      this.generoError = "Por favor selecciona una opción de género.";
    } else {
      this.generoError = null;
    }
  }

  validarRol(): void {
    this.rolTouched = true;
    if (!this.registerData.rol) {
      this.rolError = "Por favor selecciona si ingresarás como Estudiante o Docente.";
    } else {
      this.rolError = null;
    }
  }

  toggleMostrarContrasenia(): void {
    this.mostrarContrasenia = !this.mostrarContrasenia;
  }

  toggleMostrarConfirmarContrasenia(): void {
    this.mostrarConfirmarContrasenia = !this.mostrarConfirmarContrasenia;
  }

  toggleMostrarLoginContrasenia(): void {
    this.mostrarLoginContrasenia = !this.mostrarLoginContrasenia;
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
        
        const rolNormalizado = response.rol?.toLowerCase().trim();
        if (rolNormalizado === 'docente') {
          this.router.navigate(['docente', response.idRolEspecifico]);
        } else if (rolNormalizado === 'estudiante') {
          this.router.navigate(['/visualizar-cursos', response.idRolEspecifico]);
        } else if (rolNormalizado === 'admin') {
          this.router.navigate(['/admin/dashboard']);
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
    this.nombreTouched = true;
    this.apellidoTouched = true;
    this.dniTouched = true;
    this.celularTouched = true;
    this.usernameTouched = true;
    this.passwordTouched = true;
    this.confirmarPasswordTouched = true;
    this.fechaNacimientoTouched = true;
    this.generoTouched = true;
    this.rolTouched = true;

    this.validarNombre();
    this.validarApellido();
    this.validarDni();
    this.validarCelular();
    this.validarUsername();
    this.validarFechaNacimiento();
    this.validarConfirmarPassword();
    this.validarGenero();
    this.validarRol();

    this.registroError = null;
    this.registroExitoso = null;

    if (!this.registerData.rol) {
      this.setRegistroError("Por favor, selecciona si eres Estudiante o Docente.");
      return;
    }

    if (this.nombreError) {
      this.setRegistroError(this.nombreError);
      return;
    }

    if (this.apellidoError) {
      this.setRegistroError(this.apellidoError);
      return;
    }

    if (this.dniError) {
      this.setRegistroError(this.dniError);
      return;
    }

    if (this.celularError) {
      this.setRegistroError(this.celularError);
      return;
    }

    if (this.usernameError) {
      this.setRegistroError(this.usernameError);
      return;
    }

    if (!this.registerData.dni || this.registerData.dni.trim().length !== 8) {
      this.setDniError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    if (!this.registerData.fecha_nacimiento || !this.esMayorDeEdad(this.registerData.fecha_nacimiento)) {
      this.fechaNacimientoError = "Debes tener al menos 12 años para registrarte.";
      this.setRegistroError("Debes tener al menos 12 años para registrarte.");
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
        genero: this.registerData.genero,
        celular: this.registerData.celular ? this.registerData.celular.trim() : null
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