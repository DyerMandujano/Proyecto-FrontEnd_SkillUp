import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core'; 
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
export class AutenticacionComponent implements AfterViewInit {

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

  mostrarContraseniaLogin: boolean = false;
  mostrarContraseniaReg: boolean = false;

  // Estado HU-22: Recuperación de contraseña
  modalRecuperarAbierto: boolean = false;
  pasoRecuperar: number = 1; // 1: Identificación (DNI o Usuario), 2: Nueva Contraseña, 3: Éxito
  identificadorRecuperar: string = '';
  usuarioEncontrado: string = '';
  nuevaContraseniaRecuperar: string = '';
  confirmarContraseniaRecuperar: string = '';
  mostrarNuevaClave: boolean = false;
  mostrarConfirmarClave: boolean = false;
  errorRecuperar: string | null = null;
  exitoRecuperar: string | null = null;
  cargandoRecuperar: boolean = false;

  fechaMaximaNacimiento: string = (() => {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - 12);
    return hoy.toISOString().split('T')[0];
  })();

  fechaMinimaNacimiento: string = (() => {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - 100);
    return hoy.toISOString().split('T')[0];
  })();

  toggleMostrarContraseniaLogin(): void {
    this.mostrarContraseniaLogin = !this.mostrarContraseniaLogin;
  }

  toggleMostrarContraseniaReg(): void {
    this.mostrarContraseniaReg = !this.mostrarContraseniaReg;
  }

  abrirModalRecuperar(): void {
    this.modalRecuperarAbierto = true;
    this.pasoRecuperar = 1;
    this.identificadorRecuperar = '';
    this.usuarioEncontrado = '';
    this.nuevaContraseniaRecuperar = '';
    this.confirmarContraseniaRecuperar = '';
    this.errorRecuperar = null;
    this.exitoRecuperar = null;
    this.mostrarNuevaClave = false;
    this.mostrarConfirmarClave = false;
    this.cargandoRecuperar = false;
  }

  cerrarModalRecuperar(): void {
    this.modalRecuperarAbierto = false;
  }

  toggleMostrarNuevaClave(): void {
    this.mostrarNuevaClave = !this.mostrarNuevaClave;
  }

  toggleMostrarConfirmarClave(): void {
    this.mostrarConfirmarClave = !this.mostrarConfirmarClave;
  }

  verificarIdentificadorRecuperar(): void {
    this.errorRecuperar = null;
    const id = this.identificadorRecuperar.trim();

    if (!id) {
      this.errorRecuperar = 'Por favor ingresa tu nombre de usuario o tu número de DNI.';
      return;
    }

    this.cargandoRecuperar = true;
    this.authService.verificarIdentificador(id).subscribe({
      next: (resp) => {
        this.cargandoRecuperar = false;
        this.usuarioEncontrado = resp.username || id;
        this.pasoRecuperar = 2;
      },
      error: (err) => {
        this.cargandoRecuperar = false;
        this.errorRecuperar = err.error?.mensaje || 'No se encontró ninguna cuenta asociada al usuario o DNI ingresado.';
      }
    });
  }

  confirmarCambioContrasenia(): void {
    this.errorRecuperar = null;

    if (!this.nuevaContraseniaRecuperar || this.nuevaContraseniaRecuperar.trim().length === 0) {
      this.errorRecuperar = 'La nueva contraseña no puede estar vacía.';
      return;
    }

    if (this.nuevaContraseniaRecuperar.length < 6) {
      this.errorRecuperar = 'La contraseña debe tener como mínimo 6 dígitos o caracteres.';
      return;
    }

    if (this.nuevaContraseniaRecuperar !== this.confirmarContraseniaRecuperar) {
      this.errorRecuperar = 'Las contraseñas no coinciden. Verifícalas e inténtalo nuevamente.';
      return;
    }

    this.cargandoRecuperar = true;
    this.authService.restablecerPassword({
      identificador: this.usuarioEncontrado || this.identificadorRecuperar.trim(),
      nuevaContrasenia: this.nuevaContraseniaRecuperar,
      confirmarContrasenia: this.confirmarContraseniaRecuperar
    }).subscribe({
      next: (resp) => {
        this.cargandoRecuperar = false;
        this.exitoRecuperar = resp.mensaje || '¡Contraseña actualizada con éxito!';
        this.pasoRecuperar = 3;
      },
      error: (err) => {
        this.cargandoRecuperar = false;
        this.errorRecuperar = err.error?.mensaje || 'Error al restablecer la contraseña. Intente nuevamente.';
      }
    });
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) { }

  onLoginSubmit() {
    this.loginError = null; 
    
    if (!this.loginData.contrasenia || this.loginData.contrasenia.length < 6) {
      this.loginError = "La contraseña debe tener como mínimo 6 dígitos o caracteres.";
      return;
    }

    this.authService.login(this.loginData).subscribe(
      response => {
        this.authService.saveSession(response);
        
        const rol = (response.rol || '').toLowerCase().trim();

        if (rol === 'docente') {
          this.router.navigate(['docente', response.idRolEspecifico]);
        } else if (rol === 'estudiante') {
          this.router.navigate(['/visualizar-cursos', response.idRolEspecifico]);
        } else if (rol === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error => {
        this.loginError = error.error?.message || 'Usuario o contraseña incorrectos.';
      }
    );
  }
 
  onRegisterSubmit() {
    this.registroError = null;
    this.registroExitoso = null;

    if (!this.registerData.dni || !/^\d{8}$/.test(this.registerData.dni.trim())) {
      this.registroError = "El DNI es obligatorio y debe tener exactamente 8 dígitos numéricos.";
      return;
    }

    if (!this.registerData.contrasenia || this.registerData.contrasenia.length < 6) {
      this.registroError = "La contraseña es obligatoria y debe tener como mínimo 6 dígitos o caracteres.";
      return;
    }

    if (!this.registerData.fecha_nacimiento) {
      this.registroError = "La fecha de nacimiento es obligatoria.";
      return;
    }

    const fechaNac = new Date(this.registerData.fecha_nacimiento + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaNac >= hoy) {
      this.registroError = "La fecha de nacimiento no puede ser la fecha actual ni una fecha futura.";
      return;
    }

    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    if (edad < 12) {
      this.registroError = "Debes tener al menos 12 años de edad para registrarte en la plataforma.";
      return;
    }

    if (edad > 100) {
      this.registroError = "Por favor ingresa una fecha de nacimiento válida.";
      return;
    }

    if (!this.registerData.rol) {
      this.registroError = "Por favor, selecciona un rol (Estudiante o Docente).";
      return;
    }

    const payload: RegistroRequest = {
      persona: {
        nombres: this.registerData.nombres,
        apellidos: this.registerData.apellidos,
        dni: this.registerData.dni.trim(),
        fecha_nacimiento: this.registerData.fecha_nacimiento,
        genero: this.registerData.genero
      },
      usuario: {
        username: (this.registerData.dni ? this.registerData.dni.trim() + '@skillup.pe' : ''),
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
        this.registroExitoso = '¡Cuenta creada! Por favor, inicia sesión.';
        
        document.getElementById('botonInicioSesion')?.click();
      },
      error => {
        this.registroError = error.error || error.error?.message || 'Error al crear la cuenta. Verifique los datos.';
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