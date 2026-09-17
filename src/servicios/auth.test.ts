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

import { credencialesMock, emailErrorDeRed } from "@/mocks/credenciales";
import { usuariosMock } from "@/mocks";
import {
  cerrarSesion,
  iniciarSesion,
  MENSAJE_SESION_VENCIDA,
  recuperarArranque,
  registrarVecino,
  TTL_TOKEN_MS,
  validarToken,
} from "@/servicios/auth";
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
    expect(arranque).toEqual({ sesion: null, sesionVencida: true });
    expect(almacen.__memoria.has("sesion")).toBe(false);
  });

  test("si el token es inválido, borra la sesión y avisa que venció", async () => {
    guardarSesion({
      token: "",
      usuario: usuariosMock[0],
      expiraEn: new Date(Date.now() + TTL_TOKEN_MS).toISOString(),
      esInvitado: false,
    });

    const arranque = await esperar(recuperarArranque());
    expect(arranque).toEqual({ sesion: null, sesionVencida: true });
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
});
