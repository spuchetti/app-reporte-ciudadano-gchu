import { cuadrillasMock, zonasMock } from "@/mocks";
import { Cuadrilla, Zona } from "@/tipos";

import { delay } from "./reportes";

export interface ZonaConCuadrillas {
  zona: Zona;
  cuadrillas: Cuadrilla[];
}

function copiarZona(zona: Zona): Zona {
  return {
    ...zona,
    limite: zona.limite.map((punto) => ({ ...punto })),
  };
}

function copiarCuadrilla(cuadrilla: Cuadrilla): Cuadrilla {
  return { ...cuadrilla };
}

export async function obtenerZonas(): Promise<Zona[]> {
  await delay(600);
  return zonasMock.map(copiarZona);
}

export async function obtenerCuadrillas(): Promise<Cuadrilla[]> {
  await delay(600);
  return cuadrillasMock.map(copiarCuadrilla);
}

export async function obtenerCuadrillasPorZona(zonaId: string): Promise<Cuadrilla[]> {
  await delay(600);
  return cuadrillasMock
    .filter((cuadrilla) => cuadrilla.zonaId === zonaId)
    .map(copiarCuadrilla);
}

export async function zonasConCuadrillas(): Promise<ZonaConCuadrillas[]> {
  await delay(600);
  return zonasMock.map((zona) => ({
    zona: copiarZona(zona),
    cuadrillas: cuadrillasMock
      .filter((cuadrilla) => cuadrilla.zonaId === zona.id)
      .map(copiarCuadrilla),
  }));
}
