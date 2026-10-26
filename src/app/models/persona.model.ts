export interface Persona {
  idPersona: number;
  nombres: string;
  apellidos: string;
  dni: string;
  fechaDeNacimiento: string; 
  genero: string;
  estado: number;
  celular?: string | null;
}