import { Cuadrilla, Zona } from "@/tipos";

export const zonasMock: Zona[] = [
  {
    id: "zon-norte",
    nombre: "Zona Norte",
    referente: "Jorge Fernández",
    limite: [
      { latitud: -33.005, longitud: -58.53 },
      { latitud: -33.01, longitud: -58.495 },
      { latitud: -33.02, longitud: -58.495 },
      { latitud: -33.02, longitud: -58.53 },
    ],
  },
  {
    id: "zon-centro",
    nombre: "Zona Centro",
    referente: "Roberto Acosta",
    limite: [
      { latitud: -33.02, longitud: -58.53 },
      { latitud: -33.025, longitud: -58.495 },
      { latitud: -33.035, longitud: -58.495 },
      { latitud: -33.035, longitud: -58.53 },
    ],
  },
  {
    id: "zon-sur",
    nombre: "Zona Sur",
    referente: "Laura Méndez",
    limite: [
      { latitud: -33.035, longitud: -58.53 },
      { latitud: -33.04, longitud: -58.495 },
      { latitud: -33.05, longitud: -58.495 },
      { latitud: -33.05, longitud: -58.53 },
    ],
  },
  {
    id: "zon-este",
    nombre: "Zona Este",
    referente: "Marcos Díaz",
    limite: [
      { latitud: -33.02, longitud: -58.495 },
      { latitud: -33.025, longitud: -58.46 },
      { latitud: -33.035, longitud: -58.46 },
      { latitud: -33.035, longitud: -58.495 },
    ],
  },
];

export const cuadrillasMock: Cuadrilla[] = [
  {
    id: "cua-01",
    nombre: "Cuadrilla 1 - Espacios Verdes",
    zonaId: "zon-norte",
    especialidad: "Árboles y ramas",
    activa: true,
  },
  {
    id: "cua-02",
    nombre: "Cuadrilla 2 - Obras Viales",
    zonaId: "zon-norte",
    especialidad: "Baches y pavimento",
    activa: true,
  },
  {
    id: "cua-03",
    nombre: "Cuadrilla 3 - Higiene Urbana",
    zonaId: "zon-sur",
    especialidad: "Residuos y limpieza",
    activa: true,
  },
  {
    id: "cua-04",
    nombre: "Cuadrilla 4 - Servicios Públicos",
    zonaId: "zon-centro",
    especialidad: "Luminarias",
    activa: true,
  },
  {
    id: "cua-05",
    nombre: "Cuadrilla 5 - Veredas",
    zonaId: "zon-sur",
    especialidad: "Reparación de veredas",
    activa: false,
  },
];
