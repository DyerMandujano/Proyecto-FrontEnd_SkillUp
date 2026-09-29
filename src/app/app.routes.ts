import { Routes } from '@angular/router';
import { CursoComponent } from './components/curso/curso.component';
import { DocenteComponent } from './components/docente/docente.component';
import { RegistrarCursoComponent } from './components/curso/registrar-curso/registrar-curso.component';
import { ActualizarCursoComponent } from './components/curso/actualizar-curso/actualizar-curso.component';
import { SeccionComponent } from './components/seccion/seccion.component';
import { RegistrarSeccionComponent } from './components/seccion/registrar-seccion/registrar-seccion.component';
import { ActualizarSeccionComponent } from './components/seccion/actualizar-seccion/actualizar-seccion.component';
import { LeccionComponent } from './components/leccion/leccion.component';
import { RegistrarLeccionComponent } from './components/leccion/registrar-leccion/registrar-leccion.component';
import { ActualizarLeccionComponent } from './components/leccion/actualizar-leccion/actualizar-leccion.component';

import { AutenticacionComponent } from './components/autenticacion/autenticacion.component';
import { EstudianteComponent } from './components/estudiante/estudiante.component';
import { VisualizarCursosComponent } from './components/estudiante/visualizar-cursos/visualizar-cursos.component';
import { CursoDescripcionComponent } from './components/curso-descripcion/curso-descripcion.component'; 
import { CursoDetalleComponent } from './components/curso-detalle/curso-detalle.component';
import { AuthGuard } from './guards/auth.guard';

import { HomeComponent } from './components/home/home.component';
import { EvaluacionCursoComponent } from './components/evaluacion-curso/evaluacion-curso.component';
import { MisCertificadosComponent } from './components/mis-certificados/mis-certificados.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent 
  },
  {
    path: 'visualizar-cursos/:id',
    component: VisualizarCursosComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'curso/:id',
    component: CursoDescripcionComponent
  },
  {
    path: 'curso/:id/lecciones',
    component: CursoDetalleComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: AutenticacionComponent
  },
  {
    path: 'registro',
    component: AutenticacionComponent
  },
  {
    path: 'cursos',
    component: CursoComponent
  },
  {
    path: 'actualizar-curso/:id',
    component: ActualizarCursoComponent
  },
  {
    path: 'docente/:id',
    component: DocenteComponent
  },
  { 
    path: 'actualizar-leccion/:id', 
    component: ActualizarLeccionComponent 
  },
  {
    path: 'docente/:id/registrar-curso',
    component: RegistrarCursoComponent
  },
  {
    path: 'seccion/curso/:id',
    component: SeccionComponent
  },
  {
    path: 'curso/:id/registrar-seccion',
    component: RegistrarSeccionComponent
  },
  {
    path: 'actualizar-seccion/:id',
    component: ActualizarSeccionComponent
  },
  {
    path: 'leccion/seccion/:id',
    component: LeccionComponent
  },
  {
    path: 'seccion/:id/registrar-leccion',
    component: RegistrarLeccionComponent
  },
  {
    path: 'evaluacion/seccion/:id',
    component: EvaluacionCursoComponent
  },
  {
    path: 'certificados/estudiante/:id',
    component: MisCertificadosComponent
  },
  {
    path: 'estudiante/dashboard',
    component: EstudianteComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];