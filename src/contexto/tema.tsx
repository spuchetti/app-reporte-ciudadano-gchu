import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useColorScheme } from "react-native";

import { Colors, type ColorScheme, type Palette } from "@/constants/theme";
import { guardarValorKV, leerValorKV } from "@/servicios/almacen-kv";

const CLAVE_TEMA_KV = "preferencia_tema";

interface TemaContextValue {
  theme: ColorScheme;
  esOscuro: boolean;
  palette: Palette;
  setTheme: (modo: ColorScheme) => void;
  alternarTema: () => void;
}

export const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: PropsWithChildren) {
  const esquemaSistema = useColorScheme();
  const [theme, setThemeState] = useState<ColorScheme>(
    esquemaSistema === "dark" ? "dark" : "light"
  );
  const [tienePreferenciaManual, setTienePreferenciaManual] = useState(false);

  // Al montar la app, recupera la preferencia persistida en expo-sqlite/kv-store
  useEffect(() => {
    let activo = true;
    leerValorKV(CLAVE_TEMA_KV).then((guardado) => {
      if (!activo) return;
      if (guardado === "dark" || guardado === "light") {
        setThemeState(guardado);
        setTienePreferenciaManual(true);
      } else if (esquemaSistema === "dark" || esquemaSistema === "light") {
        setThemeState(esquemaSistema);
      }
    });
    return () => {
      activo = false;
    };
  }, [esquemaSistema]);

  // Si el usuario no forzó un tema manual, acompaña los cambios del sistema operativo
  useEffect(() => {
    if (!tienePreferenciaManual && (esquemaSistema === "dark" || esquemaSistema === "light")) {
      setThemeState(esquemaSistema);
    }
  }, [esquemaSistema, tienePreferenciaManual]);

  const setTheme = useCallback((nuevoTema: ColorScheme) => {
    setTienePreferenciaManual(true);
    setThemeState(nuevoTema);
    void guardarValorKV(CLAVE_TEMA_KV, nuevoTema);
  }, []);

  const alternarTema = useCallback(() => {
    setTienePreferenciaManual(true);
    setThemeState((prev) => {
      const siguiente: ColorScheme = prev === "dark" ? "light" : "dark";
      void guardarValorKV(CLAVE_TEMA_KV, siguiente);
      return siguiente;
    });
  }, []);

  const value = useMemo<TemaContextValue>(
    () => ({
      theme,
      esOscuro: theme === "dark",
      palette: Colors[theme],
      setTheme,
      alternarTema,
    }),
    [theme, setTheme, alternarTema]
  );

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error("useTema debe usarse dentro de un <TemaProvider>");
  }
  return ctx;
}