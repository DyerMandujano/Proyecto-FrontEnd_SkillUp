import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../../services/auth.service';
import { SolicitudPagoService } from '../../services/solicitud-pago.service';
import { LoginResponse } from '../../models/login-response.model';

@Component({
  selector: 'app-solicitud-activacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './solicitud-activacion.component.html',
  styleUrl: './solicitud-activacion.component.css'
})
export class SolicitudActivacionComponent implements OnInit {

  currentUser: LoginResponse | null = null;
  idEstudiante: number = 0;

  // Formulario
  metodoPago: 'Yape' | 'Transferencia' = 'Yape';
  montoPredeterminado: number = 50.00;
  numOperacion: string = '';
  observacion: string = '';
  archivoComprobante: File | null = null;
  nombreArchivo: string = '';
  previewUrl: string | null = null;

  enviando: boolean = false;

  constructor(
    private authService: AuthService,
    private solicitudPagoService: SolicitudPagoService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentUser.rol === 'estudiante') {
      this.idEstudiante = this.currentUser.idRolEspecifico || 0;
    }

    if (!this.idEstudiante && isPlatformBrowser(this.platformId)) {
      const storedId = localStorage.getItem('idEstudiante');
      if (storedId) {
        this.idEstudiante = Number(storedId);
      }
    }
  }

  seleccionarMetodo(metodo: 'Yape' | 'Transferencia'): void {
    this.metodoPago = metodo;
  }

  onFileSelected(event: any): void {
    const file = event.target.files && event.target.files[0];
    if (file) {
      // Validar tipo de archivo (imagen o PDF)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'warning',
          title: 'Formato no compatible',
          text: 'Por favor sube una imagen (JPG, PNG) o un archivo PDF.',
          confirmButtonColor: '#1565C0'
        });
        return;
      }

      // Validar tamaño máximo (10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'Archivo demasiado pesado',
          text: 'El comprobante no debe superar los 10 MB.',
          confirmButtonColor: '#1565C0'
        });
        return;
      }

      this.archivoComprobante = file;
      this.nombreArchivo = file.name;

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.previewUrl = null;
      }
    }
  }

  removerArchivo(): void {
    this.archivoComprobante = null;
    this.nombreArchivo = '';
    this.previewUrl = null;
  }

  enviarSolicitud(): void {
    if (!this.idEstudiante) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Sesión',
        text: 'No se pudo identificar al estudiante. Inicia sesión nuevamente.',
        confirmButtonColor: '#1565C0'
      });
      return;
    }

    if (!this.numOperacion || this.numOperacion.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obligatorio',
        text: 'Por favor ingresa el número de operación que figura en tu comprobante.',
        confirmButtonColor: '#1565C0'
      });
      return;
    }

    if (!this.archivoComprobante) {
      Swal.fire({
        icon: 'warning',
        title: 'Comprobante requerido',
        text: 'Por favor adjunta la foto o captura del comprobante de pago.',
        confirmButtonColor: '#1565C0'
      });
      return;
    }

    const formData = new FormData();
    formData.append('idEstudiante', this.idEstudiante.toString());
    formData.append('numOperacion', this.numOperacion.trim());
    formData.append('monto', this.montoPredeterminado.toFixed(2));
    formData.append('metodoPago', this.metodoPago);
    if (this.observacion && this.observacion.trim() !== '') {
      formData.append('observacion', this.observacion.trim());
    }
    formData.append('comprobante', this.archivoComprobante);

    this.enviando = true;

    this.solicitudPagoService.enviarSolicitud(formData).subscribe({
      next: () => {
        this.enviando = false;
        Swal.fire({
          icon: 'success',
          title: 'Solicitud Enviada',
          text: 'El administrador va a validar los datos enviados. La respuesta la obtendrá en 24horas.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#1565C0',
          allowOutsideClick: false
        }).then(() => {
          this.router.navigate(['/visualizar-cursos', this.idEstudiante]);
        });
      },
      error: (err: any) => {
        this.enviando = false;
        const msg = err.error || 'Ocurrió un error al enviar la solicitud.';
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar solicitud',
          text: typeof msg === 'string' ? msg : 'Por favor verifica los datos e intenta nuevamente.',
          confirmButtonColor: '#1565C0'
        });
      }
    });
  }

  volver(): void {
    if (this.idEstudiante) {
      this.router.navigate(['/visualizar-cursos', this.idEstudiante]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
