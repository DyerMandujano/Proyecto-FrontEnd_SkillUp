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

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) { }

  onLoginSubmit() {
    this.loginError = null; 
    
    this.authService.login(this.loginData).subscribe(
      response => {
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
        this.loginError = error.error?.message || 'Usuario o contraseña incorrectos.';
      }
    );
  }
 
  onRegisterSubmit() {
    this.registroError = null;
    this.registroExitoso = null;

    if (!this.registerData.rol) {
      this.registroError = "Por favor, selecciona un rol (Estudiante o Docente).";
      return;
    }

    const payload: RegistroRequest = {
      persona: {
        nombres: this.registerData.nombres,
        apellidos: this.registerData.apellidos,
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
        this.registroExitoso = '¡Cuenta creada! Por favor, inicia sesión.';
        
        document.getElementById('botonInicioSesion')?.click();
      },
      error => {
        this.registroError = error.error?.message || 'Error al crear la cuenta. Verifique los datos.';
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