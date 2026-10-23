import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  CATEGORIA_POR_DEFECTO,
  obtenerCategoriaVisual,
} from "@/constants/categorias";

type Props = {
  tipoId: string;
  size?: number;
};

export function IconoCategoria({ tipoId, size = 24 }: Props) {
  const categoria = obtenerCategoriaVisual(tipoId) ?? CATEGORIA_POR_DEFECTO;

  return (
    <MaterialCommunityIcons
      name={categoria.icono}
      size={size}
      color={categoria.color}
      accessible={false}
    />
  );
}
