jest.mock("@/servicios/almacen-seguro", () => {
  const memoria = new Map<string, string>();
  return {
    guardarSecreto: jest.fn(async (clave: string, valor: string) => {
      memoria.set(clave, valor);
    }),
    leerSecreto: jest.fn(async (clave: string) => memoria.get(clave) ?? null),
    borrarSecreto: jest.fn(async (clave: string) => {
      memoria.delete(clave);
    }),
    __memoria: memoria,
  };
});

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { executionEnvironment: "bare" },
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(async () => false),
  isEnrolledAsync: jest.fn(async () => false),
  supportedAuthenticationTypesAsync: jest.fn(async () => []),
  authenticateAsync: jest.fn(async () => ({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import { credencialesMock, emailErrorDeRed } from "@/mocks/credenciales";
import { usuariosMock } from "@/mocks";
import {
  cerrarSesion,
  desbloquearConPin,
  desbloquearConRostro,
  dispositivoTieneBiometria,
  identificarVecino,
  iniciarSesion,
  intentarDesbloqueo,
  MENSAJE_SESION_VENCIDA,
  olvidarDispositivo,
  recuperarArranque,
  registrarVecino,
  TTL_TOKEN_MS,
  validarToken,
} from "@/servicios/auth";
import { guardarMetodoIngreso } from "@/servicios/ingreso";
import { SesionAutenticada, Usuario } from "@/tipos";

const almacen = jest.requireMock("@/servicios/almacen-seguro") as {
  __memoria: Map<string, string>;
};

const usuariosIniciales = usuariosMock.length;
const credencialesIniciales = credencialesMock.length;

async function esperar<T>(promesa: Promise<T>): Promise<T> {
  const pendiente = promesa;
  await jest.runAllTimersAsync();
  return pendiente;
}

async function esperarError(promesa: Promise<unknown>, codigo: string) {
  const assertion = expect(promesa).rejects.toMatchObject({ codigo });
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
    almacen.__memoria.clear();
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = "ios";
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue(
      [],
    );
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  afterEach(() => {
    usuariosMock.splice(usuariosIniciales);
    credencialesMock.splice(credencialesIniciales);
    jest.useRealTimers();
  });

  test("no inicia sesión de un vecino: el login es solo de operador", async () => {
    await esperarError(
      iniciarSesion("norma.pereyra@gmail.com", "vecino123"),
      "CREDENCIALES_INVALIDAS",
    );
  });

  test("inicia sesión de un operador y guarda un token con vencimiento", async () => {
    const sesion = await esperar(
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

  test("identifica un vecino con nombre, email y teléfono, sin contraseña", async () => {
    const sesion = await esperar(
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
    expect(usuariosMock.some((u) => u.email === "ana.lopez@gchu.test")).toBe(true);
  });

  test("guarda el id del vecino en el dispositivo", async () => {
    const sesion = await esperar(
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

  test("con email y teléfono conocidos reanuda la sesión del vecino", async () => {
    const sesion = await esperar(
      identificarVecino({
        nombre: "Norma Pereyra",
        email: "norma.pereyra@gmail.com",
        telefono: "3446-123456",
      }),
    );

    expect(sesion.usuario.id).toBe("usr-001");
    expect(sesion.usuario.rol).toBe("vecino");
    expect(sesion.usuario.zonaId).toBe("zon-norte");
    expect(sesion.token).toMatch(/^tok-usr-001-/);
  });

  test("acepta el teléfono con o sin guiones al reingresar", async () => {
    const sesion = await esperar(
      identificarVecino({
        nombre: "Norma",
        email: "norma.pereyra@gmail.com",
        telefono: "3446123456",
      }),
    );

    expect(sesion.usuario.id).toBe("usr-001");
  });

  test("no reanuda si el teléfono no coincide", async () => {
    await esperarError(
      identificarVecino({
        nombre: "Norma",
        email: "norma.pereyra@gmail.com",
        telefono: "3446-000000",
      }),
      "IDENTIDAD_INVALIDA",
    );
  });

  test("un operador no entra por identificación de vecino", async () => {
    await esperarError(
      identificarVecino({
        nombre: "Jorge Fernández",
        email: "jorge.fernandez@gualeguaychu.gov.ar",
        telefono: "3446-400100",
      }),
      "IDENTIDAD_INVALIDA",
    );
  });

  test("un vecino vuelve a entrar después de que el token venció", async () => {
    const primera = await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.lopez@gchu.test",
        telefono: "3446-000000",
      }),
    );
    await esperar(cerrarSesion());

    const segunda = await esperar(
      identificarVecino({
        nombre: "Ana López",
        email: "ana.lopez@gchu.test",
        telefono: "3446-000000",
      }),
    );

    expect(segunda.usuario.id).toBe(primera.usuario.id);
    expect(segunda.token).not.toBe(primera.token);
    expect(Date.parse(segunda.expiraEn)).toBeGreaterThan(Date.now());
  });

  test("sin usuario guardado, el arranque no tiene sesión", async () => {
    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({
      sesion: null,
      sesionVencida: false,
      sesionBloqueada: false,
      huboVecino: false,
      rolToken: null,
    });
  });

  test("al cerrar sesión borra el token y deja el dispositivo marcado como vecino", async () => {
    await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.lopez@gchu.test",
        telefono: "3446-000000",
      }),
    );
    await esperar(cerrarSesion());

    expect(almacen.__memoria.has("sesion")).toBe(false);
    expect(almacen.__memoria.get("huboVecino")).toBe("1");

    const arranque = await esperar(recuperarArranque());
    expect(arranque.sesion).toBeNull();
    expect(arranque.sesionVencida).toBe(false);
    expect(arranque.sesionBloqueada).toBe(false);
    expect(arranque.huboVecino).toBe(true);
    expect(arranque.rolToken).toBeNull();
  });

  test("cerrar sesión de operador no marca el dispositivo como vecino", async () => {
    await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );
    await esperar(cerrarSesion());

    const arranque = await esperar(recuperarArranque());
    expect(arranque.huboVecino).toBe(false);
    expect(arranque.rolToken).toBeNull();
    expect(arranque.sesion).toBeNull();
    expect(arranque.sesionBloqueada).toBe(false);
    expect(almacen.__memoria.has("sesion")).toBe(false);
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
    expect(arranque.huboVecino).toBe(true);
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
    expect(arranque.huboVecino).toBe(false);
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

    const usuario = await esperar(validarToken(sesion.token));
    expect(usuario.rol).toBe("operador");
    expect(usuario.email).toBe("jorge.fernandez@gualeguaychu.gov.ar");
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

    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({
      sesion: null,
      sesionVencida: true,
      sesionBloqueada: false,
      huboVecino: false,
      rolToken: null,
    });
    expect(almacen.__memoria.has("sesion")).toBe(false);
  });

  test("si el token de un vecino expiró, avisa y deja el dispositivo marcado", async () => {
    guardarSesion(
      sesionDe(usuariosMock[0], {
        expiraEn: new Date(Date.now() - 1000).toISOString(),
      }),
    );

    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({
      sesion: null,
      sesionVencida: true,
      sesionBloqueada: false,
      huboVecino: true,
      rolToken: null,
    });
    expect(almacen.__memoria.has("sesion")).toBe(false);
    expect(almacen.__memoria.get("huboVecino")).toBe("1");
  });

  test("si el token es inválido, borra la sesión y avisa que venció", async () => {
    guardarSesion({
      token: "",
      usuario: usuariosMock[0],
      expiraEn: new Date(Date.now() + TTL_TOKEN_MS).toISOString(),
      esInvitado: false,
    });

    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({
      sesion: null,
      sesionVencida: true,
      sesionBloqueada: false,
      huboVecino: false,
      rolToken: null,
    });
    expect(almacen.__memoria.has("sesion")).toBe(false);
  });

  test("validarToken usa el mismo aviso para token vencido", async () => {
    const vencida = sesionDe(usuariosMock[0], {
      expiraEn: new Date(Date.now() - 60_000).toISOString(),
    });
    guardarSesion(vencida);

    const promesa = validarToken(vencida.token);
    const assertion = expect(promesa).rejects.toMatchObject({
      codigo: "TOKEN_EXPIRADO",
      mensaje: MENSAJE_SESION_VENCIDA,
    });
    await jest.runAllTimersAsync();
    await assertion;
  });

  test("en web no pide el rostro y restaura el token vigente", async () => {
    (Platform as { OS: string }).OS = "web";
    await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    const arranque = await esperar(recuperarArranque());
    expect(arranque.sesionBloqueada).toBe(false);
    expect(arranque.sesion?.esInvitado).toBe(false);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });

  test("con rostro enrolado, reabrir sin cerrar sesión no pide el prompt", async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue(
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION],
    );

    const creada = await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );
    const arranque = await esperar(recuperarArranque());

    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    expect(arranque.sesionBloqueada).toBe(false);
    expect(arranque.sesion?.esInvitado).toBe(false);
    if (arranque.sesion?.esInvitado === false) {
      expect(arranque.sesion.usuario.id).toBe(creada.usuario.id);
    }
  });

  test("después de cerrar sesión, el arranque no entra aunque haya rostro", async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue(
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION],
    );

    await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );
    await esperar(cerrarSesion());
    const arranque = await esperar(recuperarArranque());

    expect(arranque).toEqual({
      sesion: null,
      sesionVencida: false,
      sesionBloqueada: false,
      huboVecino: false,
      rolToken: null,
    });
    expect(almacen.__memoria.has("sesion")).toBe(false);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });

  test("con el rostro elegido, desbloquea un token vigente sin haber cerrado sesión", async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue(
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION],
    );

    await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.biometria@gchu.test",
        telefono: "3446-000000",
      }),
    );
    await esperar(guardarMetodoIngreso("vecino", "rostro"));
    expect(await esperar(intentarDesbloqueo("vecino"))).toBe("rostro");
    const sesion = await esperar(desbloquearConRostro("vecino"));
    expect(sesion.usuario.rol).toBe("vecino");
  });

  test("con el código del teléfono elegido, desbloquea el token vigente", async () => {
    const creada = await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.desbloqueo@gchu.test",
        telefono: "3446-000000",
      }),
    );
    await esperar(guardarMetodoIngreso("vecino", "pin"));

    expect(await esperar(intentarDesbloqueo("vecino"))).toBe("pin");
    const sesion = await esperar(desbloquearConPin("vecino"));
    expect(sesion.usuario.id).toBe(creada.usuario.id);
    expect(sesion.token).toBe(creada.token);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
  });

  test("no desbloquea un operador desde la identificación de vecino", async () => {
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue(
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION],
    );

    await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    await esperarError(desbloquearConRostro("vecino"), "ROL_DISTINTO");
  });

  test("olvidar el dispositivo borra el rastro de vecino", async () => {
    await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.olvidar@gchu.test",
        telefono: "3446-000000",
      }),
    );
    await esperar(cerrarSesion());
    await esperar(olvidarDispositivo());

    const arranque = await esperar(recuperarArranque());
    expect(arranque.huboVecino).toBe(false);
    expect(arranque.sesion).toBeNull();
    expect(almacen.__memoria.has("sesion")).toBe(false);
    expect(almacen.__memoria.has("huboVecino")).toBe(false);
  });

  test("en web no hay reconocimiento facial", async () => {
    (Platform as { OS: string }).OS = "web";
    await expect(dispositivoTieneBiometria()).resolves.toBe(false);
  });
});
