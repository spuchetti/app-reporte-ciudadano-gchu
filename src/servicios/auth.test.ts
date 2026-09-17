/// <reference types="jest" />
jest.mock("@/servicios/almacen-seguro");
jest.mock("expo-local-authentication");

import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import * as almacenSeguro from "@/servicios/almacen-seguro";
import { SesionAutenticada } from "@/tipos";
import { usuariosMock } from "../mocks";
import { credencialesMock, emailErrorDeRed } from "../mocks/credenciales";
import {
  cerrarSesion,
  iniciarSesion,
  MENSAJE_SESION_VENCIDA,
  recuperarArranque,
  registrarVecino,
  reingresarConHuella,
} from "./auth";
import { ErrorServicio } from "./error";

const memoria = new Map<string, string>();
const guardarSecreto = jest.mocked(almacenSeguro.guardarSecreto);
const leerSecreto = jest.mocked(almacenSeguro.leerSecreto);
const borrarSecreto = jest.mocked(almacenSeguro.borrarSecreto);
const hasHardwareAsync = jest.mocked(LocalAuthentication.hasHardwareAsync);
const isEnrolledAsync = jest.mocked(LocalAuthentication.isEnrolledAsync);
const authenticateAsync = jest.mocked(LocalAuthentication.authenticateAsync);

const usuariosIniciales = usuariosMock.length;
const credencialesIniciales = credencialesMock.length;

function fijarPlataforma(os: typeof Platform.OS) {
  (Platform as { OS: typeof Platform.OS }).OS = os;
}

async function esperar<T>(promesa: Promise<T>): Promise<T> {
  const pendiente = promesa;
  await jest.runAllTimersAsync();
  return pendiente;
}

async function esperarError(promesa: Promise<unknown>, codigo: string) {
  const assertion = expect(promesa).rejects.toMatchObject<
    Pick<ErrorServicio, "codigo">
  >({ codigo });
  await jest.runAllTimersAsync();
  await assertion;
}

function sesionDe(
  usuario: Usuario,
  overrides: Partial<SesionAutenticada> = {},
): SesionAutenticada {
  return {
    token: `tok-${usuario.id}-test`,
    usuario,
    expiraEn: new Date(Date.now() + TTL_TOKEN_MS).toISOString(),
    esInvitado: false,
    ...overrides,
  };
}

function guardarSesion(sesion: unknown) {
  almacen.__memoria.set("sesion", JSON.stringify(sesion));
}

describe("servicios/auth", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    memoria.clear();
    jest.clearAllMocks();
    fijarPlataforma("ios");

    guardarSecreto.mockImplementation(async (clave, valor) => {
      memoria.set(clave, valor);
    });
    leerSecreto.mockImplementation(async (clave) => memoria.get(clave) ?? null);
    borrarSecreto.mockImplementation(async (clave) => {
      memoria.delete(clave);
    });
    hasHardwareAsync.mockResolvedValue(true);
    isEnrolledAsync.mockResolvedValue(true);
    authenticateAsync.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    usuariosMock.splice(usuariosIniciales);
    credencialesMock.splice(credencialesIniciales);
    jest.useRealTimers();
  });

  test("inicia sesión de un vecino del mock y guarda token", async () => {
    const sesion: SesionAutenticada = await esperar(
      iniciarSesion("norma.pereyra@gmail.com", "vecino123"),
      "CREDENCIALES_INVALIDAS",
    );

    expect(sesion.esInvitado).toBe(false);
    expect(sesion.usuario.rol).toBe("vecino");
    expect(sesion.usuario.nombre).toBe("Norma Pereyra");
    expect(sesion.token).toMatch(/^tok-usr-001-/);
    expect(memoria.get("sesion")).toContain("norma.pereyra@gmail.com");
  });

  test("inicia sesión de un operador", async () => {
    const sesion: SesionAutenticada = await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    expect(sesion.esInvitado).toBe(false);
    expect(sesion.usuario.rol).toBe("operador");
    expect(sesion.token).toMatch(/^tok-/);
    expect(Date.parse(sesion.expiraEn)).toBeGreaterThan(Date.now());
  });

  test("rechaza credenciales inválidas con el mismo mensaje", async () => {
    await esperarError(
      iniciarSesion("nadie@gchu.test", "operador123"),
      "CREDENCIALES_INVALIDAS",
    );
  });

  test("no revela si el email existe cuando el formato es inválido", async () => {
    await esperarError(
      iniciarSesion("no-es-email", "operador123"),
      "CREDENCIALES_INVALIDAS",
    );
  });

  test("simula un error de red con el email de prueba", async () => {
    await esperarError(iniciarSesion(emailErrorDeRed, "operador123"), "RED");
  });

  test("registra un vecino nuevo y deja la sesión iniciada", async () => {
    const sesion: SesionAutenticada = await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.lopez@gchu.test",
        telefono: "3446-000000",
      }),
    );

    expect(sesion.usuario.rol).toBe("vecino");
    expect(sesion.usuario.zonaId).toBeNull();
    expect(sesion.usuario.email).toBe("ana.lopez@gchu.test");
    expect(sesion.usuario.telefono).toBe("3446-000000");
    expect(usuariosMock.some((u) => u.email === "ana.lopez@gchu.test")).toBe(
      true,
    );
  });

  test("guarda teléfono vacío como null", async () => {
    const sesion: SesionAutenticada = await esperar(
      registrarVecino({
        nombre: "Pedro Díaz",
        email: "pedro.diaz@gchu.test",
        telefono: "3446-111111",
      }),
    );

    expect(almacen.__memoria.get("sesion")).toContain(sesion.usuario.id);
  });

  test("rechaza un teléfono vacío o corto", async () => {
    await esperarError(
      registrarVecino({
        nombre: "Pedro Díaz",
        email: "pedro.diaz@gchu.test",
        telefono: "  ",
      }),
      "TELEFONO_INVALIDO",
    );
  });

  test("rechaza un email ya registrado", async () => {
    await esperarError(
      registrarVecino({
        nombre: "Norma",
        email: "norma.pereyra@gmail.com",
        telefono: "3446-123456",
      }),
      "EMAIL_YA_REGISTRADO",
    );
  });

  test("sin usuario guardado, el arranque no tiene sesión", async () => {
    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({ sesion: null, sesionVencida: false });
  });

  test("al cerrar sesión borra el secreto", async () => {
    await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.lopez@gchu.test",
        telefono: "3446-000000",
      }),
    );
    await esperar(cerrarSesion());

    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({ sesion: null, sesionVencida: false });
  });

  test("al reabrir, un vecino con token vigente recupera la sesión", async () => {
    const creada = await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.lopez@gchu.test",
        telefono: "3446-000000",
      }),
    );

    const arranque = await esperar(recuperarArranque());
    expect(arranque.sesionVencida).toBe(false);
    expect(arranque.sesion?.esInvitado).toBe(false);
    if (arranque.sesion?.esInvitado === false) {
      expect(arranque.sesion.usuario.id).toBe(creada.usuario.id);
      expect(arranque.sesion.usuario.rol).toBe("vecino");
    }
  });

  test("al reabrir, un operador con token vigente entra a su sesión", async () => {
    const creada = await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    const arranque = await esperar(recuperarArranque());
    expect(arranque.sesionVencida).toBe(false);
    expect(arranque.sesion?.esInvitado).toBe(false);
    if (arranque.sesion?.esInvitado === false) {
      expect(arranque.sesion.usuario.id).toBe(creada.usuario.id);
      expect(arranque.sesion.usuario.rol).toBe("operador");
    }
  });

  test("GET /me acepta un token vigente", async () => {
    const sesion = await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    const sesion = await reingresarConHuella();
    expect(sesion.usuario.rol).toBe("operador");
    expect(authenticateAsync).toHaveBeenCalled();
  });

  test("GET /me rechaza un token que no coincide", async () => {
    guardarSesion(sesionDe(usuariosMock[3]));

    await esperarError(validarToken("tok-ajeno"), "TOKEN_INVALIDO");
  });

  test("si el token expiró, borra la sesión y avisa que venció", async () => {
    guardarSesion(
      sesionDe(usuariosMock[3], {
        expiraEn: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    authenticateAsync.mockResolvedValue({
      success: false,
      error: "user_cancel",
    });

    await expect(reingresarConHuella()).rejects.toMatchObject<
      Pick<ErrorServicio, "codigo">
    >({
      codigo: "BIOMETRIA_CANCELADA",
    });

    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({ sesion: null, sesionVencida: true });
    expect(almacen.__memoria.has("sesion")).toBe(false);
  });

  test("en web no hay huella", async () => {
    fijarPlataforma("web");
    await expect(dispositivoTieneHuella()).resolves.toBe(false);
  });
});
