import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';

import { CertificadoCursoService } from '../../services/certificado-curso.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mis-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-certificados.component.html',
  styleUrl: './mis-certificados.component.css'
})
export class MisCertificadosComponent implements OnInit {

  certificados: any[] = [];
  loading: boolean = true; 
  idEstudiante: number = 0;

  constructor(
    private certificadoService: CertificadoCursoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    const currentUser = this.authService.getCurrentUser();
    const idLocal = localStorage.getItem('idEstudiante');

    if (idLocal) {
        this.idEstudiante = Number(idLocal);
    } else if (currentUser && currentUser.rol === 'estudiante') {
        this.idEstudiante = currentUser.idRolEspecifico || 0;
    }


    if (this.idEstudiante) {
        this.certificadoService.listarCertificadosPorEstudiante(this.idEstudiante)
          .subscribe({
            next: (data) => {
              this.certificados = data;
              this.loading = false;
            },
            error: (err) => {
              this.loading = false;
            }
          });
    } else {
        this.loading = false;
    }
  }

  descargarCertificado(cert: any) {
    const doc = new jsPDF('l', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    const imgFondo = '/img/certificado/certificado.png';
    try {
      doc.addImage(imgFondo, 'JPEG', 0, 0, width, height);
    } catch (e) { }

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
    doc.text(cert.mensaje || "Por haber aprobado satisfactoriamente el curso de:", width / 2, 120, { align: 'center' });

    const nombreCurso = cert.nombreCurso || cert.curso?.nombre || cert.titulo || "Curso de Especialización";
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(212, 175, 55);
    doc.text(nombreCurso, width / 2, 135, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Fecha de emisión: ${cert.fechaEmision}`, width / 2, 155, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID: ${cert.codigoCertificado}`, width - 20, height - 10, { align: 'right' });

    doc.save(`Certificado_${nombreCurso}.pdf`);
  }

  volverACursos(): void {
    if (this.idEstudiante) {
        this.router.navigate(['/visualizar-cursos', this.idEstudiante]);
    } else {
        this.router.navigate(['/home']);
    }
  }
}