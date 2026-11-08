/** Catálogos públicos: salud del servicio, etiquetas y avisos. */
import { peticion } from './clienteHttp';

export interface Salud {
  estado: 'ok' | 'degradado';
  baseDatos: 'ok' | 'sin_conexion';
  version: string;
  hora: string;
}

export interface Etiqueta {
  codigo: string;
  nombre: string;
  preguntas: {
    id: string;
    texto: string;
    tipoRespuesta: string;
    opciones: string[];
    obligatoria: boolean;
    etiqueta: string | null;
  }[];
}

export interface Aviso {
  codigo: string;
  version: number;
  texto: string;
  requiereAceptacion: boolean;
}

export const consultarSalud = (signal?: AbortSignal) =>
  peticion<Salud>('/salud', { publica: true, signal });

export const listarEtiquetas = (signal?: AbortSignal) =>
  peticion<Etiqueta[]>('/etiquetas', { publica: true, signal });

export const obtenerAviso = (codigo: string, signal?: AbortSignal) =>
  peticion<Aviso>(`/avisos/${codigo}`, { publica: true, signal });
