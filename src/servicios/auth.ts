import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import { credencialesMock, emailErrorDeRed } from "@/mocks/credenciales";
import { usuariosMock } from "@/mocks";
import { ZONA_POR_DEFECTO } from "@/servicios/reportes";
import {
  borrarSecreto,
  guardarSecreto,
  leerSecreto,
} from "@/servicios/almacen-seguro";
import { ErrorServicio, esErrorServicio } from "@/servicios/error";
import { DatosRegistro, SesionAutenticada, Usuario } from "@/tipos";

const CLAVE_SESION = "sesion";
export const TTL_TOKEN_MS = 8 * 60 * 60 * 1000;
export const MENSAJE_SESION_VENCIDA =
  "Tu sesión venció. Volvé a identificarte o ingresá como operador.";

const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function esSesionAutenticada(valor: unknown): valor is SesionAutenticada {
  if (!valor || typeof valor !== "object") {
    return false;
  }

  const sesion = valor as Partial<SesionAutenticada>;
  const usuario = sesion.usuario;

  return (
    sesion.esInvitado === false &&
    typeof sesion.token === "string" &&
    sesion.token.length > 0 &&
    typeof sesion.expiraEn === "string" &&
    Number.isFinite(Date.parse(sesion.expiraEn)) &&
    typeof usuario === "object" &&
    usuario !== null &&
    typeof usuario.id === "string" &&
    typeof usuario.email === "string" &&
    (usuario.rol === "vecino" || usuario.rol === "operador")
  );
}

function armarSesion(usuario: Usuario): SesionAutenticada {
  return {
    token: `tok-${usuario.id}-${Date.now()}`,
    usuario,
    expiraEn: new Date(Date.now() + TTL_TOKEN_MS).toISOString(),
    esInvitado: false,
  };
}

async function persistirSesion(sesion: SesionAutenticada) {
  await guardarSecreto(CLAVE_SESION, JSON.stringify(sesion));
}

function errorToken(codigo: "TOKEN_INVALIDO" | "TOKEN_EXPIRADO") {
  return new ErrorServicio({
    codigo,
    mensaje: MENSAJE_SESION_VENCIDA,
  });
}

/** Mock de GET /me: valida el token guardado y su vencimiento. */
export async function validarToken(token: string): Promise<Usuario> {
  await delay(300);

  const crudo = await leerSecreto(CLAVE_SESION);
  if (!crudo) {
    throw errorToken("TOKEN_INVALIDO");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(crudo);
  } catch {
    throw errorToken("TOKEN_INVALIDO");
  }

  if (!esSesionAutenticada(parsed) || parsed.token !== token) {
    throw errorToken("TOKEN_INVALIDO");
  }

  if (Date.parse(parsed.expiraEn) <= Date.now()) {
    throw errorToken("TOKEN_EXPIRADO");
  }

  return parsed.usuario;
}

export async function iniciarSesion(
  email: string,
  contrasena: string,
): Promise<SesionAutenticada> {
  await delay(600);

  const emailNormalizado = email.trim().toLowerCase();

  if (emailNormalizado === emailErrorDeRed) {
    throw new ErrorServicio({
      codigo: "RED",
      mensaje: "No hay conexión. Intentá de nuevo.",
    });
  }

  if (!emailValido(emailNormalizado) || contrasena.length < 6) {
    throw new ErrorServicio({
      codigo: "CREDENCIALES_INVALIDAS",
      mensaje: "Email o contraseña incorrectos.",
    });
  }

  const credencial = credencialesMock.find(
    (item) => item.email.toLowerCase() === emailNormalizado,
  );
  const usuario = usuariosMock.find(
    (item) => item.email.toLowerCase() === emailNormalizado,
  );

  if (
    !credencial ||
    !usuario ||
    usuario.rol !== "operador" ||
    credencial.contrasena !== contrasena
  ) {
    throw new ErrorServicio({
      codigo: "CREDENCIALES_INVALIDAS",
      mensaje: "Email o contraseña incorrectos.",
    });
  }

  const sesion = armarSesion(usuario);
  await persistirSesion(sesion);
  return sesion;
}

export async function registrarVecino(datos: DatosRegistro): Promise<SesionAutenticada> {
  await delay(800);

  const nombre = datos.nombre.trim();
  const email = datos.email.trim().toLowerCase();
  const telefono = datos.telefono.trim();

  if (nombre.length < 2) {
    throw new ErrorServicio({
      codigo: "NOMBRE_INVALIDO",
      mensaje: "Ingresá tu nombre.",
    });
  }

  if (!emailValido(email)) {
    throw new ErrorServicio({
      codigo: "EMAIL_INVALIDO",
      mensaje: "Ingresá un email válido.",
    });
  }

  if (telefono.replace(/\D/g, "").length < 8) {
    throw new ErrorServicio({
      codigo: "TELEFONO_INVALIDO",
      mensaje: "Ingresá un teléfono válido.",
    });
  }

  const yaExiste = usuariosMock.some(
    (item) => item.email.toLowerCase() === email,
  );
  if (yaExiste) {
    throw new ErrorServicio({
      codigo: "EMAIL_YA_REGISTRADO",
      mensaje: "Ese email ya tiene una cuenta.",
    });
  }

  const nuevo: Usuario = {
    id: `usr-${String(Date.now()).slice(-6)}`,
    nombre,
    email,
    telefono,
    rol: "vecino",
    zonaId: ZONA_POR_DEFECTO,
    avisosActivos: true,
    creadoEn: new Date().toISOString(),
  };

  usuariosMock.push(nuevo);

  const sesion = armarSesion(nuevo);
  await persistirSesion(sesion);
  return sesion;
}

export async function cerrarSesion(): Promise<void> {
  await delay(200);
  await borrarSecreto(CLAVE_SESION);
}

export type ResultadoArranque = {
  sesion: SesionAutenticada | null;
  sesionVencida: boolean;
  pendienteBiometria: boolean;
};

export async function dispositivoTieneBiometria(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolado = await LocalAuthentication.isEnrolledAsync();
  return hardware && enrolado;
}

async function confirmarBiometria(): Promise<boolean> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirmá tu identidad para continuar",
    cancelLabel: "Cancelar",
    disableDeviceFallback: false,
  });
  return resultado.success;
}

export async function desbloquearConBiometria(): Promise<SesionAutenticada> {
  const crudo = await leerSecreto(CLAVE_SESION);
  if (!crudo) {
    throw new ErrorServicio({
      codigo: "SIN_SESION",
      mensaje: "No hay una sesión para desbloquear.",
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(crudo);
  } catch {
    await borrarSecreto(CLAVE_SESION);
    throw errorToken("TOKEN_INVALIDO");
  }

  if (!esSesionAutenticada(parsed)) {
    await borrarSecreto(CLAVE_SESION);
    throw errorToken("TOKEN_INVALIDO");
  }

  const usuario = await validarToken(parsed.token);
  const disponible = await dispositivoTieneBiometria();
  if (!disponible) {
    throw new ErrorServicio({
      codigo: "BIOMETRIA_NO_DISPONIBLE",
      mensaje: "Este dispositivo no tiene huella o Face ID configurado.",
    });
  }

  const ok = await confirmarBiometria();
  if (!ok) {
    throw new ErrorServicio({
      codigo: "BIOMETRIA_CANCELADA",
      mensaje: "No se pudo confirmar la identidad.",
    });
  }

  return { ...parsed, usuario };
}

export async function recuperarArranque(): Promise<ResultadoArranque> {
  const crudo = await leerSecreto(CLAVE_SESION);
  if (!crudo) {
    return { sesion: null, sesionVencida: false, pendienteBiometria: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(crudo);
  } catch {
    await borrarSecreto(CLAVE_SESION);
    return { sesion: null, sesionVencida: true, pendienteBiometria: false };
  }

  if (!esSesionAutenticada(parsed)) {
    await borrarSecreto(CLAVE_SESION);
    return { sesion: null, sesionVencida: true, pendienteBiometria: false };
  }

  try {
    const usuario = await validarToken(parsed.token);
    const sesion = { ...parsed, usuario };
    const pedirBiometria = await dispositivoTieneBiometria();
    if (!pedirBiometria) {
      return { sesion, sesionVencida: false, pendienteBiometria: false };
    }

    const ok = await confirmarBiometria();
    if (ok) {
      return { sesion, sesionVencida: false, pendienteBiometria: false };
    }

    return { sesion: null, sesionVencida: false, pendienteBiometria: true };
  } catch (error) {
    await borrarSecreto(CLAVE_SESION);
    const sesionVencida =
      esErrorServicio(error) &&
      (error.codigo === "TOKEN_EXPIRADO" || error.codigo === "TOKEN_INVALIDO");
    return { sesion: null, sesionVencida, pendienteBiometria: false };
  }
}
