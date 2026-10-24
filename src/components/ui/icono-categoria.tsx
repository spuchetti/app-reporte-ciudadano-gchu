import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import {
  CATEGORIA_POR_DEFECTO,
  obtenerCategoriaVisual,
} from "@/constants/categorias";

type Props = {
  tipoId: string;
  size?: number;
  color?: string;
};

export function IconoCategoria({ tipoId, size = 24, color }: Props) {
  const categoria = obtenerCategoriaVisual(tipoId) ?? CATEGORIA_POR_DEFECTO;

  return (
    <MaterialCommunityIcons
      name={categoria.icono}
      size={size}
      color={color ?? categoria.color}
      accessible={false}
    />
  );
}
