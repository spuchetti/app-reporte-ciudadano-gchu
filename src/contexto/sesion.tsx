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
  iniciarSesion as iniciarSesionServicio,
  recuperarArranque,
  registrarVecino,
} from "@/servicios/auth";
import { crearReporte, datosCreacionDesdeBorrador } from "@/servicios/reportes";
import { DatosBorradorReporte, DatosRegistro, Sesion } from "@/tipos";

type ValorSesion = {
  sesion: Sesion | null;
  isLoading: boolean;
  sesionVencida: boolean;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  registrar: (datos: DatosRegistro) => Promise<void>;
  enviarPrimerReporte: (
    datos: DatosRegistro,
    borrador: DatosBorradorReporte,
  ) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  cerrarAvisoSesionVencida: () => void;
};

const SesionContext = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: PropsWithChildren) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sesionVencida, setSesionVencida] = useState(false);

  useEffect(() => {
    let activo = true;

    (async () => {
      const arranque = await recuperarArranque();

      if (!activo) {
        return;
      }

      setSesion(arranque.sesion);
      setSesionVencida(arranque.sesionVencida);
      setIsLoading(false);
    })();

    return () => {
      activo = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, contrasena: string) => {
    const siguiente = await iniciarSesionServicio(email, contrasena);
    setSesion(siguiente);
    setSesionVencida(false);
  }, []);

  const registrar = useCallback(async (datos: DatosRegistro) => {
    const siguiente = await registrarVecino(datos);
    setSesion(siguiente);
    setSesionVencida(false);
  }, []);

  const enviarPrimerReporte = useCallback(
    async (datos: DatosRegistro, borrador: DatosBorradorReporte) => {
      const siguiente = await registrarVecino(datos);
      await crearReporte(datosCreacionDesdeBorrador(borrador, siguiente.usuario.id));
      setSesion(siguiente);
      setSesionVencida(false);
    },
    [],
  );

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionServicio();
    setSesion(null);
    setSesionVencida(false);
  }, []);

  const cerrarAvisoSesionVencida = useCallback(() => {
    setSesionVencida(false);
  }, []);

  const valor = useMemo(
    () => ({
      sesion,
      isLoading,
      sesionVencida,
      iniciarSesion,
      registrar,
      enviarPrimerReporte,
      cerrarSesion,
      cerrarAvisoSesionVencida,
    }),
    [
      sesion,
      isLoading,
      sesionVencida,
      iniciarSesion,
      registrar,
      enviarPrimerReporte,
      cerrarSesion,
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
