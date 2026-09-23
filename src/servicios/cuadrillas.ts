import { cuadrillasMock, reportesMock } from "@/mocks";
import { delay } from "./reportes";

export async function cambiarEstadoCuadrilla(id: string) {
    await delay(700)
    const cuadrilla = cuadrillasMock.find(cuadrilla => cuadrilla.id == id)
    const reportes = reportesMock
    if (cuadrilla) {
        const reporteActivo = reportes.some(reporte => ((reporte.estado != "resuelto" && reporte.estado != "rechazado") && reporte.cuadrillaId == cuadrilla.id))
        if (reporteActivo)
            throw new Error("Cuadrilla asignada a reporte");
        cuadrilla.activa = !cuadrilla.activa
        return { ...cuadrilla }
    }
}