import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { jsPDF } from 'jspdf';

import { EvaluacionCurso } from '../../models/evaluacionCurso';
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

  idEstudiante!: number;
  idCurso!: number;
  
  nombreCurso: string = '';

  constructor(
    private evaluacionService: EvaluacionCursoService,
    private certificadoService: CertificadoService,
    private authService: AuthService,
    private cursoService: CursoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    
    this.idSeccion = Number(this.route.snapshot.paramMap.get('id'));

    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.rol === 'estudiante') {
      this.idEstudiante = currentUser.idRolEspecifico || 0;
    }

    const storedCursoId = localStorage.getItem('cursoId');
    
    if (storedCursoId) {
      this.idCurso = Number(storedCursoId);

      this.cursoService.obtenerCursoPorId(this.idCurso).subscribe({
        next: (curso: any) => {
          this.nombreCurso = curso.nombre || curso.titulo || curso.nombreCurso || "Curso SkillUp";
        },
        error: (err: any) => {
          this.nombreCurso = "Curso de Especialización";
        }
      });
    }

    if (this.idSeccion) {
      this.evaluacionService.listarTituloEvaluacion(this.idSeccion).subscribe({
        next: (data: any) => {
            this.evaluacion = data;
        },
        error: (err: any) => {}
      });

      this.evaluacionService.listarEvaluacion(this.idSeccion).subscribe({
        next: (data: any) => {
            this.evaluaciones = data;
        },
        error: (err: any) => {}
      });
    }
  }

  obtenerCertificado(): void {
    
    if (!this.idEstudiante || !this.idCurso) {
      alert('Error: No se identificó al estudiante o el curso.');
      return;
    }

    this.certificadoService.generarCertificado(this.idEstudiante, this.idCurso).subscribe({
      next: (cert: Certificado) => {
        if (!cert) {
            alert('Error: El servidor no devolvió el certificado.');
            return;
        }
        this.generarPDF(cert);
      },
      error: (err: any) => {
        alert('Hubo un error al generar el certificado en el servidor.');
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
    } catch (e) {
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100); 
    doc.text("Este documento certifica que:", width / 2, 85, { align: 'center' });

    doc.setFont('times', 'bolditalic');
    doc.setFontSize(42);
    doc.setTextColor(10, 25, 47);
    const nombreCompleto = this.authService.getCurrentUser()?.nombreCompleto || "Estudiante SkillUp";
    doc.text(nombreCompleto, width / 2, 105, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(datos.mensaje || "Por haber aprobado satisfactoriamente el curso de:", width / 2, 120, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(212, 175, 55);
    
    const cursoParaMostrar = this.nombreCurso || "Curso de Especialización";
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