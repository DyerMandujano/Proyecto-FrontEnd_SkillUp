export interface Persona {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  genero: string;
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

export interface RegistroRequest {
  persona: Persona;
  usuario: Usuario;
  estudiante: Estudiante | null;
  docente: Docente | null;
}