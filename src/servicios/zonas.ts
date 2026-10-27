import { cuadrillasMock, zonasMock } from "@/mocks";
import { enPrueba, pedirLista } from "@/servicios/api";
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
  if (!enPrueba()) {
    const zonas = await pedirLista<Zona>("/zonas");
    zonasMock.splice(0, zonasMock.length, ...zonas);
    return zonas.map(copiarZona);
  }

  await delay(600);
  return zonasMock.map(copiarZona);
}

export async function obtenerCuadrillas(): Promise<Cuadrilla[]> {
  if (!enPrueba()) {
    const cuadrillas = await pedirLista<Cuadrilla>("/cuadrillas");
    cuadrillasMock.splice(0, cuadrillasMock.length, ...cuadrillas);
    return cuadrillas.map(copiarCuadrilla);
  }

  await delay(600);
  return cuadrillasMock.map(copiarCuadrilla);
}

export async function obtenerCuadrillasPorZona(zonaId: string): Promise<Cuadrilla[]> {
  if (!enPrueba()) {
    const cuadrillas = await obtenerCuadrillas();
    return cuadrillas.filter((cuadrilla) => cuadrilla.zonaId === zonaId);
  }

  await delay(600);
  return cuadrillasMock
    .filter((cuadrilla) => cuadrilla.zonaId === zonaId)
    .map(copiarCuadrilla);
}

export async function zonasConCuadrillas(): Promise<ZonaConCuadrillas[]> {
  if (!enPrueba()) {
    const [zonas, cuadrillas] = await Promise.all([
      obtenerZonas(),
      obtenerCuadrillas(),
    ]);
    return zonas.map((zona) => ({
      zona: copiarZona(zona),
      cuadrillas: cuadrillas
        .filter((cuadrilla) => cuadrilla.zonaId === zona.id)
        .map(copiarCuadrilla),
    }));
  }

  await delay(600);
  return zonasMock.map((zona) => ({
    zona: copiarZona(zona),
    cuadrillas: cuadrillasMock
      .filter((cuadrilla) => cuadrilla.zonaId === zona.id)
      .map(copiarCuadrilla),
  }));
}
