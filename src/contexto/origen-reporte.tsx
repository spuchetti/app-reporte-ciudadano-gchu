import { createContext, useContext, useState, type PropsWithChildren } from "react";

export type OrigenReporte = "home" | "mis-reportes";

type OrigenReporteContextValue = {
  origen: OrigenReporte;
  establecerOrigen: (origen: OrigenReporte) => void;
};

const OrigenReporteContext = createContext<OrigenReporteContextValue | null>(null);

export function ProveedorOrigenReporte({ children }: PropsWithChildren) {
  const [origen, establecerOrigen] = useState<OrigenReporte>("mis-reportes");

  return (
    <OrigenReporteContext.Provider value={{ origen, establecerOrigen }}>
      {children}
    </OrigenReporteContext.Provider>
  );
}

export function useOrigenReporte() {
  const contexto = useContext(OrigenReporteContext);
  if (!contexto) {
    throw new Error("useOrigenReporte debe usarse dentro de ProveedorOrigenReporte.");
  }
  return contexto;
}
