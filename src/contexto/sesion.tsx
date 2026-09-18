import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  cerrarSesion as cerrarSesionServicio,
  desbloquearConPin as desbloquearConPinServicio,
  desbloquearConRostro as desbloquearConRostroServicio,
  elegirMetodoIngreso,
  identificarVecino,
  iniciarSesion as iniciarSesionServicio,
  intentarDesbloqueo,
  leerMetodoIngreso,
  olvidarDispositivo as olvidarDispositivoServicio,
  reanudarSesionVigente,
  recuperarArranque,
} from "@/servicios/auth";
import { limpiarBorrador } from "@/servicios/borrador";
import { crearReporte, datosCreacionDesdeBorrador, paramsDeTicket } from "@/servicios/reportes";
import {
  DatosBorradorReporte,
  DatosRegistro,
  MetodoIngreso,
  Reporte,
  Rol,
  Sesion,
} from "@/tipos";

type ValorSesion = {
  sesion: Sesion | null;
  isLoading: boolean;
  sesionVencida: boolean;
  huboVecino: boolean;
  sesionBloqueada: boolean;
  pendienteElegirIngreso: boolean;
  pendienteDesbloqueo: boolean;
  rolToken: Rol | null;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  registrar: (datos: DatosRegistro) => Promise<void>;
  enviarPrimerReporte: (
    datos: DatosRegistro,
    borrador: DatosBorradorReporte,
  ) => Promise<Reporte>;
  enviarReporte: (borrador: DatosBorradorReporte) => Promise<Reporte>;
  identificar: (datos: DatosRegistro) => Promise<void>;
  intentarDesbloqueoAlEntrar: (rol: Rol) => Promise<"rostro" | "pin" | "formulario">;
  desbloquearConRostro: (rol: Rol) => Promise<void>;
  desbloquearConPin: (rol: Rol) => Promise<void>;
  elegirMetodo: (metodo: MetodoIngreso) => Promise<void>;
  omitirPreferenciaIngreso: () => Promise<void>;
  entrarConSesionGuardada: (rol: Rol) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  olvidarDispositivo: () => Promise<void>;
  cerrarAvisoSesionVencida: () => void;
};

const SesionContext = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: PropsWithChildren) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sesionVencida, setSesionVencida] = useState(false);
  const [huboVecino, setHuboVecino] = useState(false);
  const [sesionBloqueada, setSesionBloqueada] = useState(false);
  const [rolToken, setRolToken] = useState<Rol | null>(null);
  const [pendienteElegirIngreso, setPendienteElegirIngreso] = useState(false);
  const [pendienteDesbloqueo, setPendienteDesbloqueo] = useState(false);

  useEffect(() => {
    let activo = true;

    (async () => {
      const arranque = await recuperarArranque();
      if (!activo) {
        return;
      }

      setSesionVencida(arranque.sesionVencida);
      setHuboVecino(arranque.huboVecino);
      setSesionBloqueada(false);

      if (arranque.sesion && arranque.rolToken) {
        const modo = await intentarDesbloqueo(arranque.rolToken);
        if (!activo) {
          return;
        }
        setRolToken(arranque.rolToken);
        if (modo === "formulario") {
          setSesion(arranque.sesion);
          setPendienteDesbloqueo(false);
        } else {
          setSesion(null);
          setPendienteDesbloqueo(true);
        }
      } else {
        setSesion(null);
        setRolToken(arranque.rolToken);
        setPendienteDesbloqueo(false);
      }

      setIsLoading(false);
    })();

    return () => {
      activo = false;
    };
  }, []);

  const despuesDeEntrar = useCallback(async (siguiente: Sesion, rol: Rol) => {
    setSesion(siguiente);
    setSesionVencida(false);
    setSesionBloqueada(false);
    setPendienteDesbloqueo(false);
    setRolToken(rol);
    if (rol === "vecino") {
      setHuboVecino(true);
    }
    const metodo = await leerMetodoIngreso(rol);
    setPendienteElegirIngreso(metodo === null);
  }, []);

  const iniciarSesion = useCallback(
    async (email: string, contrasena: string) => {
      const siguiente = await iniciarSesionServicio(email, contrasena);
      await despuesDeEntrar(siguiente, "operador");
    },
    [despuesDeEntrar],
  );

  const registrar = useCallback(
    async (datos: DatosRegistro) => {
      const siguiente = await identificarVecino(datos);
      await despuesDeEntrar(siguiente, "vecino");
    },
    [despuesDeEntrar],
  );

  const identificar = useCallback(
    async (datos: DatosRegistro) => {
      const siguiente = await identificarVecino(datos);
      await despuesDeEntrar(siguiente, "vecino");
    },
    [despuesDeEntrar],
  );

  const enviarPrimerReporte = useCallback(
    async (datos: DatosRegistro, borrador: DatosBorradorReporte) => {
      const siguiente = await identificarVecino(datos);
      const reporte = await crearReporte(
        datosCreacionDesdeBorrador(borrador, siguiente.usuario.id),
      );
      limpiarBorrador();
      await despuesDeEntrar(siguiente, "vecino");
      router.replace({
        pathname: "/reporte/enviado",
        params: paramsDeTicket(reporte),
      });
      return reporte;
    },
    [despuesDeEntrar],
  );

  const enviarReporte = useCallback(
    async (borrador: DatosBorradorReporte) => {
      if (!sesion || sesion.esInvitado !== false || sesion.usuario.rol !== "vecino") {
        throw new Error("Tenés que identificarte para enviar el reporte.");
      }
      const reporte = await crearReporte(
        datosCreacionDesdeBorrador(borrador, sesion.usuario.id),
      );
      limpiarBorrador();
      router.replace({
        pathname: "/reporte/enviado",
        params: paramsDeTicket(reporte),
      });
      return reporte;
    },
    [sesion],
  );

  const intentarDesbloqueoAlEntrar = useCallback(async (rol: Rol) => {
    return intentarDesbloqueo(rol);
  }, []);

  const desbloquearConRostro = useCallback(async (rol: Rol) => {
    const siguiente = await desbloquearConRostroServicio(rol);
    setSesion(siguiente);
    setSesionVencida(false);
    setSesionBloqueada(false);
    setPendienteDesbloqueo(false);
    setRolToken(siguiente.usuario.rol);
  }, []);

  const desbloquearConPin = useCallback(async (rol: Rol) => {
    const siguiente = await desbloquearConPinServicio(rol);
    setSesion(siguiente);
    setSesionVencida(false);
    setSesionBloqueada(false);
    setPendienteDesbloqueo(false);
    setRolToken(siguiente.usuario.rol);
  }, []);

  const entrarConSesionGuardada = useCallback(async (rol: Rol) => {
    const siguiente = await reanudarSesionVigente(rol);
    setSesion(siguiente);
    setSesionVencida(false);
    setSesionBloqueada(false);
    setPendienteDesbloqueo(false);
    setRolToken(siguiente.usuario.rol);
  }, []);

  const elegirMetodo = useCallback(
    async (metodo: MetodoIngreso) => {
      const rol =
        sesion?.esInvitado === false ? sesion.usuario.rol : rolToken;
      if (!rol) {
        return;
      }
      await elegirMetodoIngreso(rol, metodo);
      setPendienteElegirIngreso(false);
    },
    [sesion, rolToken],
  );

  const omitirPreferenciaIngreso = useCallback(async () => {
    const rol =
      sesion?.esInvitado === false ? sesion.usuario.rol : rolToken;
    if (!rol) {
      setPendienteElegirIngreso(false);
      return;
    }
    await elegirMetodoIngreso(rol, "datos");
    setPendienteElegirIngreso(false);
  }, [sesion, rolToken]);

  const cerrarSesion = useCallback(async () => {
    const rol =
      sesion?.esInvitado === false ? sesion.usuario.rol : rolToken;
    const eraVecino = rol === "vecino";
    await cerrarSesionServicio();
    setSesion(null);
    setSesionVencida(false);
    setSesionBloqueada(false);
    setRolToken(null);
    setPendienteElegirIngreso(false);
    setPendienteDesbloqueo(false);
    if (eraVecino) {
      setHuboVecino(true);
    }
  }, [sesion, rolToken]);

  const olvidarDispositivo = useCallback(async () => {
    await olvidarDispositivoServicio();
    limpiarBorrador();
    setSesion(null);
    setSesionVencida(false);
    setSesionBloqueada(false);
    setRolToken(null);
    setHuboVecino(false);
    setPendienteElegirIngreso(false);
    setPendienteDesbloqueo(false);
  }, []);

  const cerrarAvisoSesionVencida = useCallback(() => {
    setSesionVencida(false);
  }, []);

  const valor = useMemo(
    () => ({
      sesion,
      isLoading,
      sesionVencida,
      huboVecino,
      sesionBloqueada,
      pendienteElegirIngreso,
      pendienteDesbloqueo,
      rolToken,
      iniciarSesion,
      registrar,
      enviarPrimerReporte,
      enviarReporte,
      identificar,
      intentarDesbloqueoAlEntrar,
      desbloquearConRostro,
      desbloquearConPin,
      elegirMetodo,
      omitirPreferenciaIngreso,
      entrarConSesionGuardada,
      cerrarSesion,
      olvidarDispositivo,
      cerrarAvisoSesionVencida,
    }),
    [
      sesion,
      isLoading,
      sesionVencida,
      huboVecino,
      sesionBloqueada,
      pendienteElegirIngreso,
      pendienteDesbloqueo,
      rolToken,
      iniciarSesion,
      registrar,
      enviarPrimerReporte,
      enviarReporte,
      identificar,
      intentarDesbloqueoAlEntrar,
      desbloquearConRostro,
      desbloquearConPin,
      elegirMetodo,
      omitirPreferenciaIngreso,
      entrarConSesionGuardada,
      cerrarSesion,
      olvidarDispositivo,
      cerrarAvisoSesionVencida,
    ],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const valor = useContext(SesionContext);
  if (!valor) {
    throw new Error("useSesion debe usarse dentro de SesionProvider");
  }
  return valor;
}
