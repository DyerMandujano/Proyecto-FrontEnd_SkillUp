import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

import { EvaluacionCurso, EvaluacionEstado, EvaluacionResultado, DetallePreguntaResultado } from '../../models/evaluacionCurso';
import { Evaluacion } from '../../models/evaluacion';
import { Certificado } from '../../models/certificado.model';

import { EvaluacionCursoService } from '../../services/evaluacion-curso.service';
import { CertificadoService } from '../../services/certificado.service';
import { AuthService } from '../../services/auth.service';
import { CursoService } from '../../services/curso.service';

@Component({
  selector: 'app-evaluacion-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluacion-curso.component.html',
  styleUrl: './evaluacion-curso.component.css'
})
export class EvaluacionCursoComponent implements OnInit {

  evaluaciones: EvaluacionCurso[] = [];
  evaluacion: Evaluacion[] = [];
  idSeccion!: number;

  idEstudiante: number = 0;
  idCurso: number = 0;
  nombreCurso: string = '';

  // Estado del examen y respuestas del estudiante
  respuestasSeleccionadas: { [idPregunta: number]: number } = {};
  detallesPorPregunta: { [idPregunta: number]: DetallePreguntaResultado } = {};
  resultadoEvaluacion: EvaluacionResultado | null = null;

  intentosRestantes: number = 2;
  cuentaDeshabilitada: boolean = false;
  evaluacionAprobada: boolean = false;
  evaluacionEnviada: boolean = false;
  cargando: boolean = false;

  constructor(
    private evaluacionService: EvaluacionCursoService,
    private certificadoService: CertificadoService,
    private authService: AuthService,
    private cursoService: CursoService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  volverAlCurso(): void {
    if (this.idCurso) {
      this.router.navigate(['/curso', this.idCurso, 'lecciones']);
    } else {
      window.history.back();
    }
  }

  ngOnInit(): void {
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));

    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.rol === 'estudiante') {
      this.idEstudiante = currentUser.idRolEspecifico || 0;
    }

    const storedCursoId = isPlatformBrowser(this.platformId) ? localStorage.getItem('cursoId') : null;
    if (storedCursoId) {
      this.idCurso = Number(storedCursoId);
    }

    if (this.idSeccion) {
      // 1. Cargar títulos de evaluación
      this.evaluacionService.listarTituloEvaluacion(this.idSeccion).subscribe({
        next: (data: any) => {
          this.evaluacion = data;
        },
        error: () => {}
      });

      // 2. Cargar preguntas de la evaluación
      this.evaluacionService.listarEvaluacion(this.idSeccion).subscribe({
        next: (data: any) => {
          this.evaluaciones = data;
        },
        error: () => {}
      });

      // 3. Consultar estado de intentos y aprobación en el backend
      if (this.idEstudiante) {
        this.evaluacionService.obtenerEstadoEvaluacion(this.idSeccion, this.idEstudiante).subscribe({
          next: (estado: EvaluacionEstado) => {
            if (estado.idCurso) {
              this.idCurso = estado.idCurso;
            }
            if (estado.nombreCurso) {
              this.nombreCurso = estado.nombreCurso;
            } else if (this.idCurso) {
              this.cargarNombreCurso(this.idCurso);
            }

            this.intentosRestantes = estado.intentosRestantes;
            this.evaluacionAprobada = estado.yaAprobado;
            this.cuentaDeshabilitada = estado.cuentaDeshabilitada;

            if (this.cuentaDeshabilitada) {
              this.mostrarAlertaCuentaDeshabilitada();
            }
          },
          error: () => {
            if (this.idCurso) {
              this.cargarNombreCurso(this.idCurso);
            }
          }
        });
      } else if (this.idCurso) {
        this.cargarNombreCurso(this.idCurso);
      }
    }
  }

  cargarNombreCurso(idCurso: number): void {
    this.cursoService.obtenerCursoPorId(idCurso).subscribe({
      next: (curso: any) => {
        this.nombreCurso = curso.nombre || curso.titulo || curso.nombreCurso || 'Curso SkillUp';
      },
      error: () => {
        this.nombreCurso = 'Curso de Especialización';
      }
    });
  }

  enviarRespuestas(): void {
    if (this.cuentaDeshabilitada) {
      this.mostrarAlertaCuentaDeshabilitada();
      return;
    }

    if (this.evaluacionAprobada) {
      Swal.fire({
        icon: 'info',
        title: 'Evaluación ya aprobada',
        text: 'Ya has aprobado esta evaluación con el 100% de respuestas correctas. Puedes obtener tu certificado.',
        confirmButtonColor: '#2E7D32'
      });
      return;
    }

    if (!this.idEstudiante) {
      Swal.fire({
        icon: 'error',
        title: 'Sesión no válida',
        text: 'No se identificó al estudiante. Por favor inicia sesión nuevamente.',
        confirmButtonColor: '#1565C0'
      });
      return;
    }

    const respondidas = Object.keys(this.respuestasSeleccionadas).length;
    if (respondidas < this.evaluaciones.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Respuestas incompletas',
        text: `Por favor responde todas las preguntas (${respondidas}/${this.evaluaciones.length}) antes de enviar tu evaluación.`,
        confirmButtonColor: '#1565C0'
      });
      return;
    }

    const payload = {
      idEstudiante: this.idEstudiante,
      idCurso: this.idCurso,
      respuestas: Object.keys(this.respuestasSeleccionadas).map(idPreg => ({
        idPregunta: Number(idPreg),
        idOpPregunta: this.respuestasSeleccionadas[Number(idPreg)]
      }))
    };

    this.cargando = true;

    this.evaluacionService.enviarEvaluacion(this.idSeccion, payload).subscribe({
      next: (res: EvaluacionResultado) => {
        this.cargando = false;
        this.resultadoEvaluacion = res;
        this.intentosRestantes = res.intentosRestantes;
        this.evaluacionAprobada = res.aprobado;
        this.cuentaDeshabilitada = res.cuentaDeshabilitada;
        this.evaluacionEnviada = true;

        // Mapear el detalle de cada pregunta (correcta / incorrecta)
        this.detallesPorPregunta = {};
        if (res.detalles) {
          res.detalles.forEach(d => {
            this.detallesPorPregunta[d.idPregunta] = d;
          });
        }

        if (res.cuentaDeshabilitada) {
          this.mostrarAlertaCuentaDeshabilitada();
        } else if (res.aprobado) {
          Swal.fire({
            icon: 'success',
            title: '¡Evaluación Aprobada!',
            html: `
              <div style="text-align: left; margin: 10px 0;">
                <p><strong>Respuestas contestadas correctamente:</strong> ${res.correctas}</p>
                <p><strong>Respuestas incorrectas:</strong> ${res.incorrectas}</p>
                <p style="font-size: 1.3rem; font-weight: bold; color: #2E7D32; margin-top: 10px;">
                  Contador: ${res.contador}
                </p>
                <p style="color: #2E7D32; font-weight: 500; margin-top: 8px;">
                  ¡Excelente! Todas las preguntas han sido contestadas correctamente. Tu certificado ya está disponible para descargar.
                </p>
              </div>
            `,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2E7D32'
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Intento de evaluación no aprobado',
            html: `
              <div style="text-align: left; margin: 10px 0;">
                <p><strong>Respuestas contestadas correctamente:</strong> ${res.correctas}</p>
                <p><strong>Respuestas incorrectas:</strong> ${res.incorrectas}</p>
                <p style="font-size: 1.3rem; font-weight: bold; color: #C62828; margin-top: 10px;">
                  Contador: ${res.contador}
                </p>
                <div style="padding: 10px; background-color: #FFF3E0; border-left: 4px solid #F57C00; margin-top: 12px;">
                  <strong>Intentos restantes:</strong> ${res.intentosRestantes} de 2.<br>
                  <small>Debes contestar el 100% de preguntas correctamente para obtener el certificado. Si fallas los 2 intentos tu cuenta será deshabilitada.</small>
                </div>
              </div>
            `,
            confirmButtonText: 'Revisar respuestas',
            confirmButtonColor: '#1565C0'
          });
        }
      },
      error: (err: any) => {
        this.cargando = false;
        const msg = err.error || 'Ocurrió un error al procesar la evaluación.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: typeof msg === 'string' ? msg : 'Error al enviar la evaluación.',
          confirmButtonColor: '#1565C0'
        });
      }
    });
  }

  limpiarRespuestas(): void {
    if (this.cuentaDeshabilitada || this.evaluacionAprobada) return;
    this.respuestasSeleccionadas = {};
    this.detallesPorPregunta = {};
    this.resultadoEvaluacion = null;
    this.evaluacionEnviada = false;
  }

  mostrarAlertaCuentaDeshabilitada(): void {
    Swal.fire({
      icon: 'warning',
      title: 'Cuenta Deshabilitada',
      html: `
        <div style="text-align: left; margin: 10px 0;">
          <p style="color: #C62828; font-weight: 600; font-size: 1.05rem;">
            Su cuenta ha sido deshabilitada por límite de intentos al rendir la evaluación final.
          </p>
          <p style="color: #424242; font-size: 0.95rem; margin-top: 8px;">
            Has agotado los 2 intentos permitidos. Para reanudar el acceso a tus cursos y restablecer tus intentos de evaluación, envía una solicitud de activación de cuenta mediante pago por Yape o transferencia bancaria.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Solicitar Activación de cuenta',
      confirmButtonColor: '#1565C0',
      cancelButtonText: 'Volver a Mis Cursos',
      cancelButtonColor: '#757575',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/solicitud-activacion']);
      } else {
        if (this.idEstudiante) {
          this.router.navigate(['/visualizar-cursos', this.idEstudiante]);
        } else {
          this.router.navigate(['/']);
        }
      }
    });
  }

  obtenerCertificado(): void {
    if (!this.evaluacionAprobada) {
      Swal.fire({
        icon: 'warning',
        title: 'Certificado Bloqueado',
        text: 'Solo se permite obtener el certificado si todas las preguntas han sido contestadas correctamente.',
        confirmButtonColor: '#1565C0'
      });
      return;
    }

    if (!this.idEstudiante || !this.idCurso) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se identificó al estudiante o el curso.',
        confirmButtonColor: '#1565C0'
      });
      return;
    }

    this.certificadoService.generarCertificado(this.idEstudiante, this.idCurso).subscribe({
      next: (cert: Certificado) => {
        if (!cert) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El servidor no devolvió el certificado.',
            confirmButtonColor: '#1565C0'
          });
          return;
        }
        this.generarPDF(cert);
      },
      error: (err: any) => {
        const errorMsg = typeof err.error === 'string' ? err.error : 'Hubo un error al generar el certificado en el servidor.';
        Swal.fire({
          icon: 'error',
          title: 'Error al generar certificado',
          text: errorMsg,
          confirmButtonColor: '#1565C0'
        });
      }
    });
  }

  generarPDF(datos: Certificado) {
    const doc = new jsPDF('l', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    const imgFondo = '/img/certificado/certificado.png';
    try {
      doc.addImage(imgFondo, 'JPEG', 0, 0, width, height);
    } catch (e) {}

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Este documento certifica que:', width / 2, 85, { align: 'center' });

    doc.setFont('times', 'bolditalic');
    doc.setFontSize(42);
    doc.setTextColor(10, 25, 47);
    const nombreCompleto = this.authService.getCurrentUser()?.nombreCompleto || 'Estudiante SkillUp';
    doc.text(nombreCompleto, width / 2, 105, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(datos.mensaje || 'Por haber aprobado satisfactoriamente el curso de:', width / 2, 120, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(212, 175, 55);

    const cursoParaMostrar = this.nombreCurso || 'Curso de Especialización';
    doc.text(cursoParaMostrar, width / 2, 135, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Fecha de emisión: ${datos.fechaEmision}`, width / 2, 155, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID: ${datos.codigoCertificado}`, width - 20, height - 10, { align: 'right' });

    doc.save(`Certificado_SkillUp_${datos.codigoCertificado}.pdf`);
  }
}