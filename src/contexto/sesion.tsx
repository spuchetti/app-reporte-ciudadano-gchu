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
  desbloquearConBiometria as desbloquearConBiometriaServicio,
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
  pendienteBiometria: boolean;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  registrar: (datos: DatosRegistro) => Promise<void>;
  enviarPrimerReporte: (
    datos: DatosRegistro,
    borrador: DatosBorradorReporte,
  ) => Promise<void>;
  desbloquearConBiometria: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
  cerrarAvisoSesionVencida: () => void;
};

const SesionContext = createContext<ValorSesion | null>(null);

export function SesionProvider({ children }: PropsWithChildren) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sesionVencida, setSesionVencida] = useState(false);
  const [pendienteBiometria, setPendienteBiometria] = useState(false);

  useEffect(() => {
    let activo = true;

    (async () => {
      const arranque = await recuperarArranque();

      if (!activo) {
        return;
      }

      setSesion(arranque.sesion);
      setSesionVencida(arranque.sesionVencida);
      setPendienteBiometria(arranque.pendienteBiometria);
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
    setPendienteBiometria(false);
  }, []);

  const registrar = useCallback(async (datos: DatosRegistro) => {
    const siguiente = await registrarVecino(datos);
    setSesion(siguiente);
    setSesionVencida(false);
    setPendienteBiometria(false);
  }, []);

  const enviarPrimerReporte = useCallback(
    async (datos: DatosRegistro, borrador: DatosBorradorReporte) => {
      const siguiente = await registrarVecino(datos);
      await crearReporte(datosCreacionDesdeBorrador(borrador, siguiente.usuario.id));
      setSesion(siguiente);
      setSesionVencida(false);
      setPendienteBiometria(false);
    },
    [],
  );

  const desbloquearConBiometria = useCallback(async () => {
    const siguiente = await desbloquearConBiometriaServicio();
    setSesion(siguiente);
    setSesionVencida(false);
    setPendienteBiometria(false);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionServicio();
    setSesion(null);
    setSesionVencida(false);
    setPendienteBiometria(false);
  }, []);

  const cerrarAvisoSesionVencida = useCallback(() => {
    setSesionVencida(false);
  }, []);

  const valor = useMemo(
    () => ({
      sesion,
      isLoading,
      sesionVencida,
      pendienteBiometria,
      iniciarSesion,
      registrar,
      enviarPrimerReporte,
      desbloquearConBiometria,
      cerrarSesion,
      cerrarAvisoSesionVencida,
    }),
    [
      sesion,
      isLoading,
      sesionVencida,
      pendienteBiometria,
      iniciarSesion,
      registrar,
      enviarPrimerReporte,
      desbloquearConBiometria,
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
