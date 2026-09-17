import { Usuario } from "./usuario";

export interface Credenciales {
  email: string;
  contrasena: string;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  telefono: string;
}

/** Cuerpo de { datos } en login/registro cuando exista la API. */
export interface DatosSesion {
  token: string;
  usuario: Usuario;
}

export type SesionAutenticada = {
  token: string;
  usuario: Usuario;
  esInvitado: false;
};

export type SesionInvitado = {
  token: null;
  usuario: null;
  esInvitado: true;
};

export type Sesion = SesionAutenticada | SesionInvitado;
