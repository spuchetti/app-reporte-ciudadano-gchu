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
  dispositivoTieneHuella,
  emailOperadorPendiente,
  iniciarSesion as iniciarSesionServicio,
  recuperarArranque,
  registrarVecino,
  reingresarConHuella as reingresarConHuellaServicio,
} from "@/servicios/auth";
import { DatosRegistro, Sesion } from "@/tipos";

type ValorSesion = {
  sesion: Sesion | null;
  isLoading: boolean;
  pendienteHuella: boolean;
  huellaDisponible: boolean;
  emailOperador: string | null;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  registrar: (datos: DatosRegistro) => Promise<void>;
  reingresarConHuella: () => Promise<void>;
  posponerAccesoOperador: () => void;
  cerrarSesion: () => Promise<void>;
};

const SesionContext = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: PropsWithChildren) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendienteHuella, setPendienteHuella] = useState(false);
  const [huellaDisponible, setHuellaDisponible] = useState(false);
  const [emailOperador, setEmailOperador] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    (async () => {
      const [arranque, tieneHuella, email] = await Promise.all([
        recuperarArranque(),
        dispositivoTieneHuella(),
        emailOperadorPendiente(),
      ]);

      if (!activo) {
        return;
      }

      setSesion(arranque.sesion);
      setPendienteHuella(arranque.pendienteHuella);
      setHuellaDisponible(tieneHuella);
      setEmailOperador(email);
      setIsLoading(false);
    })();

    return () => {
      activo = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, contrasena: string) => {
    const siguiente = await iniciarSesionServicio(email, contrasena);
    setSesion(siguiente);
    setPendienteHuella(false);
    setEmailOperador(
      siguiente.usuario.rol === "operador" ? siguiente.usuario.email : null,
    );
  }, []);

  const registrar = useCallback(async (datos: DatosRegistro) => {
    const siguiente = await registrarVecino(datos);
    setSesion(siguiente);
    setPendienteHuella(false);
    setEmailOperador(null);
  }, []);

  const reingresarConHuella = useCallback(async () => {
    const siguiente = await reingresarConHuellaServicio();
    setSesion(siguiente);
    setPendienteHuella(false);
  }, []);

  const posponerAccesoOperador = useCallback(() => {
    setPendienteHuella(false);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionServicio();
    setSesion(null);
    setPendienteHuella(false);
    setEmailOperador(null);
  }, []);

  const valor = useMemo(
    () => ({
      sesion,
      isLoading,
      pendienteHuella,
      huellaDisponible,
      emailOperador,
      iniciarSesion,
      registrar,
      reingresarConHuella,
      posponerAccesoOperador,
      cerrarSesion,
    }),
    [
      sesion,
      isLoading,
      pendienteHuella,
      huellaDisponible,
      emailOperador,
      iniciarSesion,
      registrar,
      reingresarConHuella,
      posponerAccesoOperador,
      cerrarSesion,
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
