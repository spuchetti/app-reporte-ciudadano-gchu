import { credencialesMock, emailErrorDeRed } from "@/mocks/credenciales";
import { usuariosMock } from "@/mocks";
import { ZONA_POR_DEFECTO } from "@/servicios/reportes";
import {
  borrarSecreto,
  guardarSecreto,
  leerSecreto,
} from "@/servicios/almacen-seguro";
import { ErrorServicio, esErrorServicio } from "@/servicios/error";
import {
  borrarMetodoIngreso,
  borrarPreferenciasIngreso,
  confirmarIdentidadDispositivo,
  dispositivoTieneRostro,
  guardarMetodoIngreso,
  leerMetodoIngreso,
  marcarSesionDesbloqueada,
  sesionEstaBloqueada,
} from "@/servicios/ingreso";
import { DatosRegistro, MetodoIngreso, Rol, SesionAutenticada, Usuario } from "@/tipos";

const CLAVE_SESION = "sesion";
const CLAVE_HUBO_VECINO = "huboVecino";
export const TTL_TOKEN_MS = 8 * 60 * 60 * 1000;
export const MENSAJE_SESION_VENCIDA =
  "Tu sesión venció. Volvé a identificarte o ingresá como operador.";

const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function digitosTelefono(valor: string | null) {
  return (valor ?? "").replace(/\D/g, "");
}

const MENSAJE_IDENTIDAD_INVALIDA =
  "No encontramos una cuenta vecina con esos datos.";

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
  await marcarSesionDesbloqueada();
}

async function marcarHuboVecino() {
  await guardarSecreto(CLAVE_HUBO_VECINO, "1");
}

async function borrarHuboVecino() {
  await borrarSecreto(CLAVE_HUBO_VECINO);
}

export async function leerHuboVecino(): Promise<boolean> {
  return (await leerSecreto(CLAVE_HUBO_VECINO)) === "1";
}

async function resultadoArranque(
  parcial: Omit<ResultadoArranque, "huboVecino">,
): Promise<ResultadoArranque> {
  return { ...parcial, huboVecino: await leerHuboVecino() };
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

function validarDatosVecino(datos: DatosRegistro) {
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

  if (digitosTelefono(telefono).length < 8) {
    throw new ErrorServicio({
      codigo: "TELEFONO_INVALIDO",
      mensaje: "Ingresá un teléfono válido.",
    });
  }

  return { nombre, email, telefono };
}

/** Alta o reingreso del vecino (sin contraseña). Si el email ya existe, el teléfono tiene que coincidir. */
export async function identificarVecino(
  datos: DatosRegistro,
): Promise<SesionAutenticada> {
  await delay(800);

  const { nombre, email, telefono } = validarDatosVecino(datos);
  const existente = usuariosMock.find(
    (item) => item.email.toLowerCase() === email,
  );

  if (existente) {
    const telefonoGuardado = digitosTelefono(existente.telefono);
    const telefonoIngresado = digitosTelefono(telefono);
    const telefonoOk =
      existente.rol === "vecino" &&
      (telefonoGuardado.length === 0 || telefonoGuardado === telefonoIngresado);

    if (!telefonoOk) {
      throw new ErrorServicio({
        codigo: "IDENTIDAD_INVALIDA",
        mensaje: MENSAJE_IDENTIDAD_INVALIDA,
      });
    }

    if (!existente.telefono) {
      existente.telefono = telefono;
    }

    const sesionExistente = armarSesion(existente);
    await marcarHuboVecino();
    await persistirSesion(sesionExistente);
    return sesionExistente;
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
  await marcarHuboVecino();
  await persistirSesion(sesion);
  return sesion;
}

export const registrarVecino = identificarVecino;

export async function cerrarSesion(): Promise<void> {
  await delay(200);
  const crudo = await leerSecreto(CLAVE_SESION);
  let rol: Rol | null = null;

  if (crudo) {
    try {
      const parsed: unknown = JSON.parse(crudo);
      if (esSesionAutenticada(parsed)) {
        rol = parsed.usuario.rol;
        if (rol === "vecino") {
          await marcarHuboVecino();
        }
      }
    } catch {
      // La sesión está corrupta: igual la borramos.
    }
  }

  await borrarSecreto(CLAVE_SESION);
  await marcarSesionDesbloqueada();
  if (rol) {
    await borrarMetodoIngreso(rol);
  }
}

export async function olvidarDispositivo(): Promise<void> {
  await delay(200);
  await borrarSecreto(CLAVE_SESION);
  await borrarHuboVecino();
  await marcarSesionDesbloqueada();
  await borrarPreferenciasIngreso();
}

export type ResultadoArranque = {
  sesion: SesionAutenticada | null;
  sesionVencida: boolean;
  sesionBloqueada: boolean;
  huboVecino: boolean;
  rolToken: Rol | null;
};

export type ResultadoIntentoDesbloqueo = "rostro" | "pin" | "formulario";

async function leerSesionPersistida(): Promise<SesionAutenticada | null> {
  const crudo = await leerSecreto(CLAVE_SESION);
  if (!crudo) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(crudo);
    if (!esSesionAutenticada(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function dispositivoTieneBiometria(): Promise<boolean> {
  return dispositivoTieneRostro();
}

export async function desbloquearConRostro(
  rolEsperado?: Rol,
): Promise<SesionAutenticada> {
  const parsed = await leerSesionPersistida();
  if (!parsed) {
    throw new ErrorServicio({
      codigo: "SIN_SESION",
      mensaje: "No hay una sesión para desbloquear.",
    });
  }

  if (rolEsperado && parsed.usuario.rol !== rolEsperado) {
    throw new ErrorServicio({
      codigo: "ROL_DISTINTO",
      mensaje: "Esta sesión no corresponde a este acceso.",
    });
  }

  const usuario = await validarToken(parsed.token);
  await confirmarIdentidadDispositivo("rostro");
  await marcarSesionDesbloqueada();
  return { ...parsed, usuario };
}

export async function desbloquearConPin(
  rolEsperado?: Rol,
): Promise<SesionAutenticada> {
  const parsed = await leerSesionPersistida();
  if (!parsed) {
    throw new ErrorServicio({
      codigo: "SIN_SESION",
      mensaje: "No hay una sesión para desbloquear.",
    });
  }

  if (rolEsperado && parsed.usuario.rol !== rolEsperado) {
    throw new ErrorServicio({
      codigo: "ROL_DISTINTO",
      mensaje: "Esta sesión no corresponde a este acceso.",
    });
  }

  const usuario = await validarToken(parsed.token);
  await confirmarIdentidadDispositivo("pin");
  await marcarSesionDesbloqueada();
  return { ...parsed, usuario };
}

export async function reanudarSesionVigente(
  rolEsperado?: Rol,
): Promise<SesionAutenticada> {
  const parsed = await leerSesionPersistida();
  if (!parsed) {
    throw new ErrorServicio({
      codigo: "SIN_SESION",
      mensaje: "No hay una sesión para desbloquear.",
    });
  }

  if (rolEsperado && parsed.usuario.rol !== rolEsperado) {
    throw new ErrorServicio({
      codigo: "ROL_DISTINTO",
      mensaje: "Esta sesión no corresponde a este acceso.",
    });
  }

  const usuario = await validarToken(parsed.token);
  await marcarSesionDesbloqueada();
  return { ...parsed, usuario };
}

export async function intentarDesbloqueo(
  rol: Rol,
): Promise<ResultadoIntentoDesbloqueo> {
  const guardada = await leerSesionPersistida();
  if (
    !guardada ||
    guardada.usuario.rol !== rol ||
    Date.parse(guardada.expiraEn) <= Date.now()
  ) {
    return "formulario";
  }

  const metodo = await leerMetodoIngreso(rol);
  if (metodo === "rostro") {
    return "rostro";
  }
  if (metodo === "pin") {
    return "pin";
  }
  return "formulario";
}

export async function elegirMetodoIngreso(rol: Rol, metodo: MetodoIngreso) {
  if (metodo === "rostro" || metodo === "pin") {
    await confirmarIdentidadDispositivo(metodo);
  }
  await guardarMetodoIngreso(rol, metodo);
}

export { dispositivoTieneRostro, leerMetodoIngreso };

export async function recuperarArranque(): Promise<ResultadoArranque> {
  const crudo = await leerSecreto(CLAVE_SESION);
  if (!crudo) {
    return resultadoArranque({
      sesion: null,
      sesionVencida: false,
      sesionBloqueada: false,
      rolToken: null,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(crudo);
  } catch {
    await borrarSecreto(CLAVE_SESION);
    await marcarSesionDesbloqueada();
    return resultadoArranque({
      sesion: null,
      sesionVencida: true,
      sesionBloqueada: false,
      rolToken: null,
    });
  }

  if (!esSesionAutenticada(parsed)) {
    await borrarSecreto(CLAVE_SESION);
    await marcarSesionDesbloqueada();
    return resultadoArranque({
      sesion: null,
      sesionVencida: true,
      sesionBloqueada: false,
      rolToken: null,
    });
  }

  if (parsed.usuario.rol === "vecino") {
    await marcarHuboVecino();
  }

  try {
    const usuario = await validarToken(parsed.token);
    const sesion = { ...parsed, usuario };
    if (await sesionEstaBloqueada()) {
      await marcarSesionDesbloqueada();
    }

    return resultadoArranque({
      sesion,
      sesionVencida: false,
      sesionBloqueada: false,
      rolToken: sesion.usuario.rol,
    });
  } catch (error) {
    await borrarSecreto(CLAVE_SESION);
    await marcarSesionDesbloqueada();
    const sesionVencida =
      esErrorServicio(error) &&
      (error.codigo === "TOKEN_EXPIRADO" || error.codigo === "TOKEN_INVALIDO");
    return resultadoArranque({
      sesion: null,
      sesionVencida,
      sesionBloqueada: false,
      rolToken: null,
    });
  }
}
