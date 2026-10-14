// --- Estos son los sub-objetos ---
export interface Persona {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
  dni: string;
}

export interface Usuario {
  username: string;
  contrasenia: string;
  rol: string;
}

export interface Estudiante {
  nivel_educativo: string;
}

export interface Docente {
  especialidad: string;
  grado_academico: string;
}

// --- Este es el objeto principal que se envía ---
export interface RegistroRequest {
  persona: Persona;
  usuario: Usuario;
  estudiante: Estudiante | null;
  docente: Docente | null;
}