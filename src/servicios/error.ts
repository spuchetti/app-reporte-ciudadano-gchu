import { ErrorApi } from "@/tipos";

export class ErrorServicio extends Error implements ErrorApi {
  codigo: string;
  mensaje: string;

  constructor({ codigo, mensaje }: ErrorApi) {
    super(mensaje);
    this.name = "ErrorServicio";
    this.codigo = codigo;
    this.mensaje = mensaje;
  }
}

export function esErrorServicio(error: unknown): error is ErrorServicio {
  return error instanceof ErrorServicio;
}
