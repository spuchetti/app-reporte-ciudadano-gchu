import { StyleSheet, Text, View } from "react-native";

import { fondoSuave, Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Cuadrilla, Zona } from "@/tipos";

function textoCuadrillas(cantidad: number) {
  return cantidad === 1 ? "1 cuadrilla" : `${cantidad} cuadrillas`;
}

type Props = {
  zona: Zona;
  cuadrillas: Cuadrilla[];
  zonaOperadorId: string | null;
};

export default function TarjetaZona({ zona, cuadrillas, zonaOperadorId }: Props) {
  const tema = useTheme();

  const COLORES_ZONA: Record<string, string> = {
    "zon-norte": tema.verde,
    "zon-centro": tema.azul,
    "zon-sur": "#8B5CF6",
    "zon-este": tema.secondary,
  };

  const color = COLORES_ZONA[zona.id] ?? tema.onSurface;
  const esTuZona = zonaOperadorId === zona.id;

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: tema.surface,
          borderColor: esTuZona ? color : tema.outline,
          borderWidth: esTuZona ? 2 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.icono, { backgroundColor: `${color}33` }]}>
          <View style={[styles.marca, { backgroundColor: color }]} />
        </View>
        <View style={styles.datos}>
          <Text style={[styles.nombre, { color: tema.onSurface }]}>{zona.nombre}</Text>
          <Text style={[styles.referente, { color: tema.onSurfaceVariant }]}>{zona.referente}</Text>
          <Text style={[styles.cantidad, { color: tema.onSurface }]}>
            {textoCuadrillas(cuadrillas.length)}
          </Text>
        </View>
        {esTuZona ? (
          <Text style={[styles.tuZona, { color, backgroundColor: `${color}33` }]}>
            Tu zona
          </Text>
        ) : null}
      </View>

      {cuadrillas.length === 0 ? (
        <Text style={[styles.vacio, { color: tema.onSurfaceVariant }]}>
          Todavía no hay cuadrillas en esta zona.
        </Text>
      ) : (
        cuadrillas.map((cuadrilla) => (
          <View key={cuadrilla.id} style={[styles.fila, { borderColor: tema.outline }]}>
            <View style={styles.filaTexto}>
              <Text style={[styles.cuadrillaNombre, { color: tema.onSurface }]}>
                {cuadrilla.nombre}
              </Text>
              <Text style={[styles.especialidad, { color: tema.onSurfaceVariant }]}>
                {cuadrilla.especialidad}
              </Text>
            </View>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: fondoSuave(cuadrilla.activa ? tema.verde : tema.rojo),
                },
              ]}
            >
              <Text
                style={[
                  styles.chipTexto,
                  { color: cuadrilla.activa ? tema.verde : tema.rojo },
                ]}
              >
                {cuadrilla.activa ? "Activa" : "Inactiva"}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  marca: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  datos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  referente: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  cantidad: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  tuZona: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  vacio: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  cuadrillaNombre: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  especialidad: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
});