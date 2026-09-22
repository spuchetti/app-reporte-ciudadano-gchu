import { cuadrillasMock, zonasMock } from "@/mocks";
import { delay } from "./reportes";
import { Cuadrilla, Zona } from "@/tipos";

export interface ZonaCuadrilla extends Zona {
    cuadrillas: Cuadrilla[]
    cuadrillasActivas: number
    cuadrillasInactivas: number
}

export async function obtenerZonas() {
    await delay(600)
    const cuadrillas = cuadrillasMock
    return zonasMock.map(zona => {
        const cuadrillasZonas = cuadrillas.filter(cuadrilla => cuadrilla.zonaId == zona.id)
        const activas = cuadrillasZonas.filter(cuadrilla => cuadrilla.activa).length
        const inactivas = cuadrillasZonas.filter(cuadrilla => !cuadrilla.activa).length
        return {
            ...zona,
            cuadrillas: cuadrillasZonas,
            cuadrillasActivas: Number(activas),
            cuadrillasInactivas: Number(inactivas)
        }
    })
}