import AppTabs from "@/components/app-tabs";
import { ProveedorOrigenReporte } from "@/contexto/origen-reporte";

export default function TabsLayout() {
  return (
    <ProveedorOrigenReporte>
      <AppTabs />
    </ProveedorOrigenReporte>
  );
}
