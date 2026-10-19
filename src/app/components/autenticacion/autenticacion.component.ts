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

  // --- SEGURIDAD: Bloqueo de 1 minuto tras 3 intentos fallidos (POR USUARIO) ---
  intentosPorUsuario: { [usuario: string]: number } = {};
  usuarioBloqueado: string = '';
  bloqueadoPorMinuto: boolean = false;
  segundosRestantesBloqueo: number = 60;
  private intervaloBloqueo: any = null;

  // --- SEGURIDAD: CAPTCHA Anti-IA / Anti-Bot interactivo ---
  mostrarCaptcha: boolean = false;
  captchaTexto: string = '';
  captchaIngresado: string = '';
  captchaError: string | null = null;
  captchaValido: boolean = false;

  // Mensaje de éxito al redirigir al login
  mensajeExitoLogin: string | null = null;

  // --- HU-22: Recuperación de Contraseña ---
  modalRecuperarAbierto: boolean = false;
  pasoRecuperar: number = 1;
  identificadorRecuperar: string = '';
  usuarioEncontrado: string = '';
  nuevaContraseniaRecuperar: string = '';
  confirmarContraseniaRecuperar: string = '';
  mostrarNuevaClave: boolean = false;
  mostrarConfirmarClave: boolean = false;
  cargandoRecuperar: boolean = false;
  errorRecuperar: string | null = null;
  exitoRecuperar: string | null = null;

  // Fecha máxima para asegurar edad mínima (12 años)
  maxFechaNacimiento: string = '';

  private dniErrorTimeout: any = null;
  private registroErrorTimeout: any = null;
  private registroExitosoTimeout: any = null;

  get esUsuarioActualBloqueado(): boolean {
    const usuarioActual = (this.loginData.username || '').trim().toLowerCase();
    return this.bloqueadoPorMinuto && this.usuarioBloqueado === usuarioActual;
  }

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
    if (this.intervaloBloqueo) clearInterval(this.intervaloBloqueo);
  }

  setDniError(mensaje: string): void {
    this.dniError = mensaje;
    if (this.dniErrorTimeout) clearTimeout(this.dniErrorTimeout);
    this.dniErrorTimeout = setTimeout(() => {
      this.dniError = null;
    }, 15000);
  }

  setRegistroError(mensaje: string): void {
    this.registroError = mensaje;
    if (this.registroErrorTimeout) clearTimeout(this.registroErrorTimeout);
    this.registroErrorTimeout = setTimeout(() => {
      this.registroError = null;
    }, 15000);

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const errorEl = document.querySelector('.contenedor-registro .mensaje-error-general');
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  setRegistroExitoso(mensaje: string): void {
    this.registroExitoso = mensaje;
    if (this.registroExitosoTimeout) clearTimeout(this.registroExitosoTimeout);
    this.registroExitosoTimeout = setTimeout(() => {
      this.registroExitoso = null;
    }, 15000);
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
/*
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
*/
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

  onRolChange(rol: string): void {
    this.registerData.rol = rol;
    this.rolError = null;
    this.rolTouched = false;

    if (isPlatformBrowser(this.platformId)) {
      const camposEstudianteDiv = document.getElementById('camposEstudiante');
      const camposDocenteDiv = document.getElementById('camposDocente');
      if (rol === 'estudiante') {
        if (camposEstudianteDiv) camposEstudianteDiv.style.display = 'block';
        if (camposDocenteDiv) camposDocenteDiv.style.display = 'none';
      } else if (rol === 'docente') {
        if (camposEstudianteDiv) camposEstudianteDiv.style.display = 'none';
        if (camposDocenteDiv) camposDocenteDiv.style.display = 'block';
      }
    }
  }

  validarRol(): void {
    if (!this.registerData.rol) {
      this.rolTouched = true;
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

  activarBloqueoUnMinuto(): void {
    this.bloqueadoPorMinuto = true;
    this.segundosRestantesBloqueo = 60;
    if (this.intervaloBloqueo) {
      clearInterval(this.intervaloBloqueo);
    }
    this.intervaloBloqueo = setInterval(() => {
      this.segundosRestantesBloqueo--;
      if (this.segundosRestantesBloqueo <= 0) {
        clearInterval(this.intervaloBloqueo);
        this.intervaloBloqueo = null;
        this.bloqueadoPorMinuto = false;
      }
    }, 1000);
  }

  generarCaptcha(): void {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    this.captchaTexto = codigo;
    this.captchaIngresado = '';
    this.captchaError = null;
    this.captchaValido = false;
  }

  validarCaptcha(): boolean {
    if (!this.captchaIngresado || this.captchaIngresado.trim() === '') {
      this.captchaError = 'Por favor ingresa el código de seguridad CAPTCHA.';
      return false;
    }
    if (this.captchaIngresado.trim() !== this.captchaTexto) {
      this.captchaError = 'Código de seguridad incorrecto. Intenta con un nuevo código.';
      this.generarCaptcha();
      return false;
    }
    this.captchaError = null;
    this.captchaValido = true;
    return true;
  }

  onCaptchaInput(): void {
    if (this.captchaIngresado && this.captchaIngresado.trim() === this.captchaTexto) {
      this.captchaValido = true;
      this.captchaError = null;
    } else {
      this.captchaValido = false;
    }
  }

  abrirModalRecuperar(): void {
    this.modalRecuperarAbierto = true;
    this.pasoRecuperar = 1;
    this.identificadorRecuperar = '';
    this.usuarioEncontrado = '';
    this.nuevaContraseniaRecuperar = '';
    this.confirmarContraseniaRecuperar = '';
    this.mostrarNuevaClave = false;
    this.mostrarConfirmarClave = false;
    this.cargandoRecuperar = false;
    this.errorRecuperar = null;
    this.exitoRecuperar = null;
  }

  cerrarModalRecuperar(): void {
    this.modalRecuperarAbierto = false;
    this.pasoRecuperar = 1;
    this.errorRecuperar = null;
    this.exitoRecuperar = null;
  }

  toggleMostrarNuevaClave(): void {
    this.mostrarNuevaClave = !this.mostrarNuevaClave;
  }

  toggleMostrarConfirmarClave(): void {
    this.mostrarConfirmarClave = !this.mostrarConfirmarClave;
  }

  verificarIdentificadorRecuperar(): void {
    if (!this.identificadorRecuperar || !this.identificadorRecuperar.trim()) {
      this.errorRecuperar = 'Por favor ingresa tu nombre de usuario o DNI.';
      return;
    }

    this.cargandoRecuperar = true;
    this.errorRecuperar = null;

    this.authService.verificarIdentificador(this.identificadorRecuperar.trim()).subscribe({
      next: (resp) => {
        this.cargandoRecuperar = false;
        this.usuarioEncontrado = resp.username || this.identificadorRecuperar.trim();
        this.pasoRecuperar = 2;
      },
      error: (err) => {
        this.cargandoRecuperar = false;
        let msg = 'No se encontró ninguna cuenta asociada.';
        if (typeof err.error === 'string') {
          msg = err.error;
        } else if (err.error?.message) {
          msg = err.error.message;
        }
        this.errorRecuperar = msg;
      }
    });
  }

  confirmarCambioContrasenia(): void {
    this.errorRecuperar = null;

    if (!this.nuevaContraseniaRecuperar || this.nuevaContraseniaRecuperar.length < 8) {
      this.errorRecuperar = 'La contraseña debe tener como mínimo 8 caracteres.';
      return;
    }

    if (!/[A-Z]/.test(this.nuevaContraseniaRecuperar)) {
      this.errorRecuperar = 'La contraseña debe incluir al menos una letra mayúscula (A-Z).';
      return;
    }
    if (!/[a-z]/.test(this.nuevaContraseniaRecuperar)) {
      this.errorRecuperar = 'La contraseña debe incluir al menos una letra minúscula (a-z).';
      return;
    }
    if (!/[0-9]/.test(this.nuevaContraseniaRecuperar)) {
      this.errorRecuperar = 'La contraseña debe incluir al menos un número (0-9).';
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(this.nuevaContraseniaRecuperar)) {
      this.errorRecuperar = 'La contraseña debe incluir al menos un carácter especial o signo.';
      return;
    }

    if (this.nuevaContraseniaRecuperar !== this.confirmarContraseniaRecuperar) {
      this.errorRecuperar = 'Las contraseñas no coinciden. Asegúrate de que sean idénticas.';
      return;
    }

    this.cargandoRecuperar = true;

    this.authService.restablecerPassword({
      identificador: this.identificadorRecuperar.trim(),
      nuevaContrasenia: this.nuevaContraseniaRecuperar,
      confirmarContrasenia: this.confirmarContraseniaRecuperar
    }).subscribe({
      next: (resp) => {
        this.cargandoRecuperar = false;
        this.exitoRecuperar = resp.mensaje || '¡Tu contraseña ha sido restablecida con éxito!';
        this.pasoRecuperar = 3;
      },
      error: (err) => {
        this.cargandoRecuperar = false;
        let msg = 'Error al actualizar la contraseña.';
        if (typeof err.error === 'string') {
          msg = err.error;
        } else if (err.error?.message) {
          msg = err.error.message;
        }
        this.errorRecuperar = msg;
      }
    });
  }

  onLoginUsernameInput(): void {
    this.loginError = null;
    this.mensajeExitoLogin = null;
    const usuarioActual = (this.loginData.username || '').trim().toLowerCase();

    // Si cambió a otro usuario diferente del bloqueado:
    if (this.usuarioBloqueado && this.usuarioBloqueado !== usuarioActual) {
      this.mostrarCaptcha = false;
      this.captchaIngresado = '';
      this.captchaError = null;
    } else if (this.usuarioBloqueado && this.usuarioBloqueado === usuarioActual && this.bloqueadoPorMinuto) {
      this.mostrarCaptcha = true;
    }
  }

  limpiarFormularioLogin(): void {
    this.loginData.username = '';
    this.loginData.contrasenia = '';
    this.loginError = null;
    this.mensajeExitoLogin = null;
    this.captchaIngresado = '';
    this.captchaError = null;
    this.mostrarCaptcha = false;
    this.bloqueadoPorMinuto = false;
    this.usuarioBloqueado = '';
    if (this.intervaloBloqueo) {
      clearInterval(this.intervaloBloqueo);
      this.intervaloBloqueo = null;
    }
  }

  limpiarFormularioRegistro(): void {
    this.registerData = {
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
    this.nombreTouched = false;
    this.apellidoTouched = false;
    this.dniTouched = false;
    this.usernameTouched = false;
    this.celularTouched = false;
    this.passwordTouched = false;
    this.confirmarPasswordTouched = false;
    this.fechaNacimientoTouched = false;
    this.generoTouched = false;
    this.rolTouched = false;

    this.dniError = null;
    this.nombreError = null;
    this.apellidoError = null;
    this.usernameError = null;
    this.celularError = null;
    this.fechaNacimientoError = null;
    this.passwordMismatchError = null;
    this.generoError = null;
    this.rolError = null;
    this.registroError = null;
    this.registroExitoso = null;

    if (isPlatformBrowser(this.platformId)) {
      const camposEstudianteDiv = document.getElementById('camposEstudiante');
      const camposDocenteDiv = document.getElementById('camposDocente');
      if (camposEstudianteDiv) camposEstudianteDiv.style.display = 'none';
      if (camposDocenteDiv) camposDocenteDiv.style.display = 'none';
      const rolEstudianteRadio = document.getElementById('rolEstudiante') as HTMLInputElement;
      const rolDocenteRadio = document.getElementById('rolDocente') as HTMLInputElement;
      if (rolEstudianteRadio) rolEstudianteRadio.checked = false;
      if (rolDocenteRadio) rolDocenteRadio.checked = false;
    }
  }

  irALogin(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('contenedorPrincipal')?.classList.remove('panel-derecho-activo');
    }
    this.limpiarFormularioRegistro();
    this.limpiarFormularioLogin();
  }

  irARegistro(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('contenedorPrincipal')?.classList.add('panel-derecho-activo');
    }
    this.limpiarFormularioLogin();
    this.limpiarFormularioRegistro();
  }

  onLoginSubmit() {
    this.loginError = null; 
    this.mensajeExitoLogin = null;

    const usuarioIdentificador = (this.loginData.username || '').trim().toLowerCase();

    // Bloquear SOLO si este usuario específico tiene el bloqueo de 1 minuto activo
    if (this.esUsuarioActualBloqueado) {
      this.loginError = `Campos bloqueados por seguridad. Espera ${this.segundosRestantesBloqueo} segundos para reintentar.`;
      return;
    }

    // Exigir CAPTCHA solo si el usuario bloqueado coincide
    if (this.mostrarCaptcha && this.usuarioBloqueado === usuarioIdentificador && !this.validarCaptcha()) {
      return;
    }
    
    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login exitoso!', response);
        // Login exitoso: limpiar intentos del usuario
        delete this.intentosPorUsuario[usuarioIdentificador];
        this.mostrarCaptcha = false;
        this.captchaIngresado = '';
        this.bloqueadoPorMinuto = false;
        this.usuarioBloqueado = '';
        if (this.intervaloBloqueo) {
          clearInterval(this.intervaloBloqueo);
          this.intervaloBloqueo = null;
        }
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
      error: (error) => {
        console.error('Error en el login:', error);
        let mensaje = 'Credenciales incorrectas';
        if (typeof error.error === 'string') {
          mensaje = error.error;
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }
        this.loginError = mensaje;

        // Registrar intento fallido para ESTE usuario específico (1 usuario = 3 intentos)
        this.intentosPorUsuario[usuarioIdentificador] = (this.intentosPorUsuario[usuarioIdentificador] || 0) + 1;
        const intentosDeEsteUsuario = this.intentosPorUsuario[usuarioIdentificador];

        // Verificar si la BD ya inactivó la cuenta por 30 min (3 intentos) o si este usuario llegó a 3 intentos
        const cuentaInactivaEnBD = mensaje.toLowerCase().includes('inactiva') || 
                                   mensaje.toLowerCase().includes('bloqueada') ||
                                   mensaje.toLowerCase().includes('3 intentos fallidos');

        if (cuentaInactivaEnBD || intentosDeEsteUsuario >= 3) {
          this.usuarioBloqueado = usuarioIdentificador;
          this.mostrarCaptcha = true;
          this.generarCaptcha();
          this.activarBloqueoUnMinuto();
        } else {
          // Si aún le quedan intentos disponibles (ej: "Te quedan 1 intento(s)" o "Te quedan 2 intento(s)")
          // NO se activa el captcha ni se bloquea
          this.mostrarCaptcha = false;
          this.bloqueadoPorMinuto = false;
          this.usuarioBloqueado = '';
        }
      }
    });
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
    //this.validarUsername();
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

    if (this.registerData.rol === 'docente') {
      if (!this.registerData.especialidad) {
        this.setRegistroError("Por favor selecciona tu Especialidad profesional.");
        return;
      }
      if (!this.registerData.grado_academico) {
        this.setRegistroError("Por favor selecciona tu Grado Académico.");
        return;
      }
    } else if (this.registerData.rol === 'estudiante') {
      if (!this.registerData.nivel_educativo) {
        this.setRegistroError("Por favor selecciona tu Nivel Educativo.");
        return;
      }
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

    this.authService.register(payload).subscribe({
      next: (response) => {
        console.log('Registro exitoso!', response);
        // 1. Limpiar completamente los datos del formulario de registro
        this.limpiarFormularioRegistro();
        // 2. Limpiar el formulario de login
        this.limpiarFormularioLogin();
        // 3. Establecer mensaje de éxito visible en login
        this.mensajeExitoLogin = '¡Registro exitoso! Por favor inicia sesión con tu cuenta.';
        // 4. Redirigir al formulario de login
        this.irALogin();
      },
      error: (error) => {
        console.error('Error en el registro:', error);
        let mensaje = 'Error al crear la cuenta. Verifique los datos.';
        if (typeof error.error === 'string') {
          mensaje = error.error;
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }

        // Mostrar SIEMPRE la alerta general en el formulario para que el usuario la vea
        this.setRegistroError(mensaje);

        // Si el error corresponde al DNI, marcarlo también puntualmente
        if (mensaje.toLowerCase().includes('dni')) {
          this.setDniError(mensaje);
        } else if (mensaje.toLowerCase().includes('celular')) {
          this.celularError = mensaje;
        } else if (mensaje.toLowerCase().includes('usuario')) {
          this.usernameError = mensaje;
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const botonRegistro = document.getElementById('botonRegistro');
      const botonInicioSesion = document.getElementById('botonInicioSesion');
      const contenedorPrincipal = document.getElementById('contenedorPrincipal');
      
      botonRegistro?.addEventListener('click', () => {
        this.irARegistro();
      });
      
      botonInicioSesion?.addEventListener('click', () => {
        this.irALogin();
      });
      
      if (window.location.hash === '#registro') {
        contenedorPrincipal?.classList.add('panel-derecho-activo');
      }

      const rolEstudianteRadio = document.getElementById('rolEstudiante') as HTMLInputElement;
      const rolDocenteRadio = document.getElementById('rolDocente') as HTMLInputElement;
      
      const toggleRoleFields = () => {
        if (rolEstudianteRadio?.checked) {
          this.onRolChange('estudiante');
        } else if (rolDocenteRadio?.checked) {
          this.onRolChange('docente');
        }
      };

      rolEstudianteRadio?.addEventListener('change', toggleRoleFields);
      rolDocenteRadio?.addEventListener('change', toggleRoleFields);
    }
  }

}