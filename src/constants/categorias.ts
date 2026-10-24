import type { ComponentProps } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export type IconoCategoria = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type CategoriaVisual = {
  id: string;
  nombre: string;
  icono: IconoCategoria;
  color: string;
};

export const CATEGORIA_POR_DEFECTO: CategoriaVisual = {
  id: "tip-otro",
  nombre: "Otro",
  icono: "dots-horizontal-circle-outline",
  color: "#B45380",
};

export const CATEGORIAS_VISUALES: readonly CategoriaVisual[] = [
  {
    id: "tip-bache",
    nombre: "Bache",
    icono: "road",
    color: "#D97706",
  },
  {
    id: "tip-luminaria",
    nombre: "Luminaria",
    icono: "lightbulb-outline",
    color: "#EAB308",
  },
  {
    id: "tip-basura",
    nombre: "Basura",
    icono: "trash-can-outline",
    color: "#64748B",
  },
  {
    id: "tip-rama",
    nombre: "Rama / árbol",
    icono: "tree-outline",
    color: "#2F9E52",
  },
  {
    id: "tip-agua",
    nombre: "Agua / cloaca",
    icono: "water-outline",
    color: "#0EA5E9",
  },
  {
    id: "tip-semaforo",
    nombre: "Semáforo",
    icono: "traffic-light-outline",
    color: "#DC4B40",
  },
  {
    id: "tip-vereda",
    nombre: "Vereda",
    icono: "walk",
    color: "#8B5CF6",
  },
  CATEGORIA_POR_DEFECTO,
];

export function obtenerCategoriaVisual(id: string) {
  return CATEGORIAS_VISUALES.find((categoria) => categoria.id === id);
}
