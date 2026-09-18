import { useEffect, useState } from "react";

import { useSesion } from "@/contexto/sesion";
import { esErrorServicio } from "@/servicios/error";
import { Rol } from "@/tipos";

export function useDesbloqueoAlEntrar(rol: Rol, activo: boolean) {
  const {
    intentarDesbloqueoAlEntrar,
    desbloquearConRostro,
    desbloquearConPin,
  } = useSesion();
  const [error, setError] = useState<string | null>(null);
  const [desbloqueando, setDesbloqueando] = useState(false);

  async function desbloquear(modo: "rostro" | "pin") {
    setError(null);
    setDesbloqueando(true);
    try {
      if (modo === "rostro") {
        await desbloquearConRostro(rol);
      } else {
        await desbloquearConPin(rol);
      }
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo confirmar tu identidad.",
      );
    } finally {
      setDesbloqueando(false);
    }
  }

  async function reintentar() {
    const modo = await intentarDesbloqueoAlEntrar(rol);
    if (modo === "formulario") {
      return;
    }
    await desbloquear(modo);
  }

  useEffect(() => {
    if (!activo) {
      return;
    }
    let vigente = true;

    (async () => {
      const modo = await intentarDesbloqueoAlEntrar(rol);
      if (!vigente || modo === "formulario") {
        return;
      }
      setDesbloqueando(true);
      try {
        if (modo === "rostro") {
          await desbloquearConRostro(rol);
        } else {
          await desbloquearConPin(rol);
        }
      } catch (err) {
        if (vigente) {
          setError(
            esErrorServicio(err)
              ? err.message
              : "No se pudo confirmar tu identidad.",
          );
        }
      } finally {
        if (vigente) {
          setDesbloqueando(false);
        }
      }
    })();

    return () => {
      vigente = false;
    };
  }, [activo, rol, intentarDesbloqueoAlEntrar, desbloquearConRostro, desbloquearConPin]);

  return {
    error,
    setError,
    desbloqueando,
    reintentar,
  };
}
