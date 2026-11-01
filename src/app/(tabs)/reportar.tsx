import { Redirect } from "expo-router";
import { useOrigenReporte } from "@/contexto/origen-reporte";

export default function ReportarVecinoScreen() {
  const { origen } = useOrigenReporte();

  return (
    <Redirect
      href={{
        pathname: "/reporte/nuevo",
        params: { origen },
      }}
    />
  );
}
