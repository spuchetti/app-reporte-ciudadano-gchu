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

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import { credencialesMock, emailErrorDeRed } from "@/mocks/credenciales";
import { usuariosMock } from "@/mocks";
import {
  cerrarSesion,
  dispositivoTieneHuella,
  emailOperadorPendiente,
  entrarComoInvitado,
  iniciarSesion,
  recuperarArranque,
  registrarVecino,
  reingresarConHuella,
} from "@/servicios/auth";

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

describe("servicios/auth", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    almacen.__memoria.clear();
    jest.clearAllMocks();
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: true,
    });
    (Platform as { OS: string }).OS = "ios";
  });

  afterEach(() => {
    usuariosMock.splice(usuariosIniciales);
    credencialesMock.splice(credencialesIniciales);
    jest.useRealTimers();
  });

  test("inicia sesión de un vecino del mock y guarda token", async () => {
    const sesion = await esperar(
      iniciarSesion("norma.pereyra@gmail.com", "vecino123"),
    );

    expect(sesion.esInvitado).toBe(false);
    expect(sesion.usuario.rol).toBe("vecino");
    expect(sesion.usuario.nombre).toBe("Norma Pereyra");
    expect(sesion.token).toMatch(/^tok-usr-001-/);
    expect(almacen.__memoria.get("sesion")).toContain("norma.pereyra@gmail.com");
  });

  test("inicia sesión de un operador", async () => {
    const sesion = await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    expect(sesion.esInvitado).toBe(false);
    expect(sesion.usuario.rol).toBe("operador");
  });

  test("rechaza credenciales inválidas con el mismo mensaje", async () => {
    await esperarError(
      iniciarSesion("nadie@gchu.test", "vecino123"),
      "CREDENCIALES_INVALIDAS",
    );
  });

  test("no revela si el email existe cuando el formato es inválido", async () => {
    await esperarError(
      iniciarSesion("no-es-email", "vecino123"),
      "CREDENCIALES_INVALIDAS",
    );
  });

  test("simula un error de red con el email de prueba", async () => {
    await esperarError(iniciarSesion(emailErrorDeRed, "vecino123"), "RED");
  });

  test("registra un vecino nuevo y deja la sesión iniciada", async () => {
    const sesion = await esperar(
      registrarVecino({
        nombre: "Ana López",
        email: "ana.lopez@gchu.test",
        telefono: "3446-000000",
        contrasena: "vecino123",
      }),
    );

    expect(sesion.usuario.rol).toBe("vecino");
    expect(sesion.usuario.email).toBe("ana.lopez@gchu.test");
    expect(sesion.usuario.telefono).toBe("3446-000000");
    expect(usuariosMock.some((u) => u.email === "ana.lopez@gchu.test")).toBe(true);
  });

  test("guarda teléfono vacío como null", async () => {
    const sesion = await esperar(
      registrarVecino({
        nombre: "Pedro Díaz",
        email: "pedro.diaz@gchu.test",
        telefono: "  ",
        contrasena: "vecino123",
      }),
    );

    expect(sesion.usuario.telefono).toBeNull();
  });

  test("rechaza un email ya registrado", async () => {
    await esperarError(
      registrarVecino({
        nombre: "Norma",
        email: "norma.pereyra@gmail.com",
        telefono: null,
        contrasena: "vecino123",
      }),
      "EMAIL_YA_REGISTRADO",
    );
  });

  test("entra como invitado sin token ni usuario", async () => {
    const sesion = await esperar(entrarComoInvitado());

    expect(sesion).toEqual({
      token: null,
      usuario: null,
      esInvitado: true,
    });
  });

  test("al cerrar sesión borra el secreto", async () => {
    await esperar(iniciarSesion("norma.pereyra@gmail.com", "vecino123"));
    await esperar(cerrarSesion());

    const arranque = await recuperarArranque();
    expect(arranque).toEqual({ sesion: null, pendienteHuella: false });
  });

  test("al reabrir, un vecino recupera la sesión", async () => {
    await esperar(iniciarSesion("norma.pereyra@gmail.com", "vecino123"));

    const arranque = await recuperarArranque();
    expect(arranque.pendienteHuella).toBe(false);
    expect(arranque.sesion?.esInvitado).toBe(false);
    if (arranque.sesion?.esInvitado === false) {
      expect(arranque.sesion.usuario.email).toBe("norma.pereyra@gmail.com");
    }
  });

  test("al reabrir, un operador queda pendiente de huella", async () => {
    await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    const arranque = await recuperarArranque();
    expect(arranque.sesion).toBeNull();
    expect(arranque.pendienteHuella).toBe(true);
    await expect(emailOperadorPendiente()).resolves.toBe(
      "jorge.fernandez@gualeguaychu.gov.ar",
    );
  });

  test("reingresa al operador con huella si la biometría confirma", async () => {
    await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );

    const sesion = await reingresarConHuella();
    expect(sesion.usuario.rol).toBe("operador");
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalled();
  });

  test("no reingresa con huella si el usuario cancela", async () => {
    await esperar(
      iniciarSesion("jorge.fernandez@gualeguaychu.gov.ar", "operador123"),
    );
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: false,
      error: "user_cancel",
    });

    await expect(reingresarConHuella()).rejects.toMatchObject({
      codigo: "BIOMETRIA_CANCELADA",
    });
  });

  test("en web no hay huella", async () => {
    (Platform as { OS: string }).OS = "web";
    await expect(dispositivoTieneHuella()).resolves.toBe(false);
  });
});
