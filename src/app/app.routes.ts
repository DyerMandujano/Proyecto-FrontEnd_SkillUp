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

import { HomeComponent } from './components/home/home.component';
import { EvaluacionCursoComponent } from './components/evaluacion-curso/evaluacion-curso.component';
import { MisCertificadosComponent } from './components/mis-certificados/mis-certificados.component';
import { AdminComponent } from './components/admin/admin.component';
import { SolicitudActivacionComponent } from './components/solicitud-activacion/solicitud-activacion.component';
import { EstadoSolicitudComponent } from './components/estado-solicitud/estado-solicitud.component';

// Guards de Seguridad
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  // ==========================================
  // RUTAS PÚBLICAS (Sin autenticación requerida)
  // ==========================================
  {
    path: '',
    component: HomeComponent 
  },
  {
    path: 'curso/:id',
    component: CursoDescripcionComponent
  },
  {
    path: 'login',
    component: AutenticacionComponent
  },
  {
    path: 'registro',
    component: AutenticacionComponent
  },

  // ==========================================
  // RUTAS ADMINISTRADOR
  // ==========================================
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin/dashboard',
    component: AdminComponent,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },

  // ==========================================
  // RUTAS EXCLUSIVAS DE ESTUDIANTE (o Admin)
  // ==========================================
  {
    path: 'estudiante/dashboard',
    component: EstudianteComponent,
    canActivate: [RoleGuard],
    data: { roles: ['estudiante'] }
  },
  {
    path: 'visualizar-cursos/:id',
    component: VisualizarCursosComponent,
    canActivate: [RoleGuard],
    data: { roles: ['estudiante'], checkOwnership: true }
  },
  {
    path: 'curso/:id/lecciones',
    component: CursoDetalleComponent,
    canActivate: [RoleGuard],
    data: { roles: ['estudiante', 'docente'] }
  },
  {
    path: 'evaluacion/seccion/:id',
    component: EvaluacionCursoComponent,
    canActivate: [RoleGuard],
    data: { roles: ['estudiante'] }
  },
  {
    path: 'certificados/estudiante/:id',
    component: MisCertificadosComponent,
    canActivate: [RoleGuard],
    data: { roles: ['estudiante'], checkOwnership: true }
  },
  {
    path: 'solicitud-activacion',
    component: SolicitudActivacionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['estudiante'] }
  },
  {
    path: 'mis-solicitudes',
    component: EstadoSolicitudComponent,
    canActivate: [RoleGuard],
    data: { roles: ['estudiante'] }
  },

  // ==========================================
  // RUTAS EXCLUSIVAS DE DOCENTE (o Admin)
  // ==========================================
  {
    path: 'cursos',
    component: CursoComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },
  {
    path: 'docente/:id',
    component: DocenteComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'], checkOwnership: true }
  },
  {
    path: 'docente/:id/registrar-curso',
    component: RegistrarCursoComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'], checkOwnership: true }
  },
  {
    path: 'actualizar-curso/:id',
    component: ActualizarCursoComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },
  {
    path: 'seccion/curso/:id',
    component: SeccionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },
  {
    path: 'curso/:id/registrar-seccion',
    component: RegistrarSeccionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },
  {
    path: 'actualizar-seccion/:id',
    component: ActualizarSeccionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },
  {
    path: 'leccion/seccion/:id',
    component: LeccionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },
  {
    path: 'seccion/:id/registrar-leccion',
    component: RegistrarLeccionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },
  { 
    path: 'actualizar-leccion/:id', 
    component: ActualizarLeccionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['docente'] }
  },

  // ==========================================
  // WILDCARD (Cualquier ruta inexistente)
  // ==========================================
  {
    path: '**',
    redirectTo: ''
  }
];
