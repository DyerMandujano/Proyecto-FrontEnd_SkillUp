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

  private dniErrorTimeout: any = null;
  private registroErrorTimeout: any = null;
  private registroExitosoTimeout: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) { }

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

  onDniInput(): void {
    if (this.dniError) {
      this.dniError = null;
      if (this.dniErrorTimeout) clearTimeout(this.dniErrorTimeout);
    }
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
        this.loginError = error.error?.message || 'Usuario o contraseña incorrectos.';
      }
    );
  }

  onRegisterSubmit() {
    this.dniError = null;
    this.registroError = null;
    this.registroExitoso = null;

    if (!this.registerData.rol) {
      this.setRegistroError("Por favor, selecciona un rol (Estudiante o Docente).");
      return;
    }

    if (!this.registerData.dni || this.registerData.dni.trim().length !== 8) {
      this.setDniError("El DNI debe tener exactamente 8 dígitos.");
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
        username: this.registerData.username,
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