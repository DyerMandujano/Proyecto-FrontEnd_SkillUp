export interface SolicitudPagoResponse {
  id_solicitud: number;
  id_estudiante: number;
  id_usuario?: number;
  estudianteNombre?: string;
  estudianteDni?: string;
  username?: string;
  num_operacion: string;
  monto: number;
  metodo_pago: string;
  fecha_subida?: string;
  fecha_revision?: string;
  observacion?: string;
  imagen_comprobante?: string;
  estado: string; // 'Pendiente' | 'Aprobado' | 'Rechazado'
}

export interface UsuarioAdmin {
  id_usuario: number;
  id_persona: number;
  username: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  genero: string;
  rol: string;
  estado: number; // 1 = Activo, 0 = Inactivo
  fecha_registro?: string;
}

export interface MatriculaSeguimiento {
  id_matricula: number;
  id_estudiante: number;
  estudiante_nombre: string;
  estudiante_dni: string;
  estudiante_username: string;
  id_curso: number;
  nombre_curso: string;
  fecha_matricula: string;
  estado: number;
  estado_descripcion: string;
  porcentaje_avance: number;
}
