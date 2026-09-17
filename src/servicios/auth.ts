import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import { credencialesMock, emailErrorDeRed } from "@/mocks/credenciales";
import { usuariosMock } from "@/mocks";
import {
  borrarSecreto,
  guardarSecreto,
  leerSecreto,
} from "@/servicios/almacen-seguro";
import { ErrorServicio } from "@/servicios/error";
import { DatosRegistro, Sesion, SesionAutenticada, Usuario } from "@/tipos";

const CLAVE_SESION = "sesion";
const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function armarSesion(usuario: Usuario): SesionAutenticada {
  return {
    token: `tok-${usuario.id}-${Date.now()}`,
    usuario,
    esInvitado: false,
  };
}

async function persistirSesion(sesion: SesionAutenticada) {
  await guardarSecreto(CLAVE_SESION, JSON.stringify(sesion));
}

async function leerSesionGuardada(): Promise<SesionAutenticada | null> {
  const crudo = await leerSecreto(CLAVE_SESION);
  if (!crudo) {
    return null;
  }

  try {
    const parsed = JSON.parse(crudo) as Sesion;
    if (parsed.esInvitado || !parsed.usuario) {
      await borrarSecreto(CLAVE_SESION);
      return null;
    }
    return parsed;
  } catch {
    await borrarSecreto(CLAVE_SESION);
    return null;
  }
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
    zonaId: null,
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

export async function recuperarArranque(): Promise<{
  sesion: SesionAutenticada | null;
  pendienteHuella: boolean;
}> {
  const guardada = await leerSesionGuardada();
  if (!guardada) {
    return { sesion: null, pendienteHuella: false };
  }

  if (guardada.usuario.rol === "operador") {
    return { sesion: null, pendienteHuella: true };
  }

  return { sesion: guardada, pendienteHuella: false };
}

export async function dispositivoTieneHuella(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolado = await LocalAuthentication.isEnrolledAsync();
  return hardware && enrolado;
}

export async function reingresarConHuella(): Promise<SesionAutenticada> {
  const guardada = await leerSesionGuardada();
  if (!guardada || guardada.usuario.rol !== "operador") {
    throw new ErrorServicio({
      codigo: "SIN_SESION_OPERADOR",
      mensaje: "No hay un operador para reingresar con huella.",
    });
  }

  const disponible = await dispositivoTieneHuella();
  if (!disponible) {
    throw new ErrorServicio({
      codigo: "BIOMETRIA_NO_DISPONIBLE",
      mensaje: "Este dispositivo no tiene huella o Face ID configurado.",
    });
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Ingresá con tu huella para continuar",
    cancelLabel: "Cancelar",
    disableDeviceFallback: false,
  });

  if (!resultado.success) {
    throw new ErrorServicio({
      codigo: "BIOMETRIA_CANCELADA",
      mensaje: "No se pudo confirmar la identidad.",
    });
  }

  return guardada;
}

export async function emailOperadorPendiente(): Promise<string | null> {
  const guardada = await leerSesionGuardada();
  if (!guardada || guardada.usuario.rol !== "operador") {
    return null;
  }
  return guardada.usuario.email;
}
