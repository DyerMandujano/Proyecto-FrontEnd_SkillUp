export interface EvaluacionCurso {
  idPregunta: number;
  enunciado: string;
  opcion1: string;
  opcion2: string;
  opcion3: string;
  idOp1: number;
  idOp2: number;
  idOp3: number;
}

export interface DetallePreguntaResultado {
  idPregunta: number;
  idOpSeleccionada: number;
  esCorrecta: boolean;
  idOpCorrecta?: number;
}

export interface EvaluacionResultado {
  totalPreguntas: number;
  correctas: number;
  incorrectas: number;
  contador: string; // ej. "5/6"
  puntajeTotal: number;
  puntajeMaximo: number;
  aprobado: boolean;
  intentosRestantes: number;
  cuentaDeshabilitada: boolean;
  mensaje: string;
  detalles: DetallePreguntaResultado[];
}

export interface EvaluacionEstado {
  idSeccion: number;
  idCurso: number;
  nombreCurso?: string;
  totalPreguntas: number;
  intentosRestantes: number;
  yaAprobado: boolean;
  cuentaDeshabilitada: boolean;
  mensaje: string;
}