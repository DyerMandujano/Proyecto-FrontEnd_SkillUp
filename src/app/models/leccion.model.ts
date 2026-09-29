import { Material } from './material.model';

export interface Leccion {
  idLeccion: number;
  idSeccion: number;
  nombreLeccion: string;
  duracion: number;
  ordenLeccion: number;
  estado: number;
  urlVideo: string;
  materiales: Material[]; 
}