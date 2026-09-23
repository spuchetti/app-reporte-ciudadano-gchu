import { StyleSheet, Text, View } from "react-native";

import { Paleta } from "@/constants/theme";
import { Cuadrilla, Zona } from "@/tipos";

const COLORES_ZONA: Record<string, string> = {
  "zon-norte": Paleta.verde,
  "zon-centro": Paleta.azul,
  "zon-sur": "#532e9e",
  "zon-este": Paleta.orange,
};

function textoCuadrillas(cantidad: number) {
  return cantidad === 1 ? "1 cuadrilla" : `${cantidad} cuadrillas`;
}

type Props = {
  zona: Zona;
  cuadrillas: Cuadrilla[];
  zonaOperadorId: string | null;
};

export default function TarjetaZona({ zona, cuadrillas, zonaOperadorId }: Props) {
  const color = COLORES_ZONA[zona.id] ?? Paleta.ink;
  const esTuZona = zonaOperadorId === zona.id;

  return (
    <View style={[styles.tarjeta, esTuZona ? { borderColor: color } : null]}>
      <View style={styles.header}>
        <View style={[styles.icono, { backgroundColor: `${color}33` }]}>
          <View style={[styles.marca, { backgroundColor: color }]} />
        </View>
        <View style={styles.datos}>
          <Text style={styles.nombre}>{zona.nombre}</Text>
          <Text style={styles.referente}>{zona.referente}</Text>
          <Text style={styles.cantidad}>{textoCuadrillas(cuadrillas.length)}</Text>
        </View>
        {esTuZona ? (
          <Text style={[styles.tuZona, { color, backgroundColor: `${color}33` }]}>
            Tu zona
          </Text>
        ) : null}
      </View>

      {cuadrillas.length === 0 ? (
        <Text style={styles.vacio}>Todavía no hay cuadrillas en esta zona.</Text>
      ) : (
        cuadrillas.map((cuadrilla) => (
          <View key={cuadrilla.id} style={styles.fila}>
            <View style={styles.filaTexto}>
              <Text style={styles.cuadrillaNombre}>{cuadrilla.nombre}</Text>
              <Text style={styles.especialidad}>{cuadrilla.especialidad}</Text>
            </View>
            <View
              style={[
                styles.chip,
                cuadrilla.activa ? styles.chipActiva : styles.chipInactiva,
              ]}
            >
              <Text
                style={[
                  styles.chipTexto,
                  { color: cuadrilla.activa ? Paleta.verde : Paleta.rojo },
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
    backgroundColor: Paleta.paperRaised,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Paleta.line,
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
    fontSize: 18,
    fontWeight: "700",
    color: Paleta.ink,
  },
  referente: {
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  cantidad: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.ink,
  },
  tuZona: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  vacio: {
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderColor: Paleta.line,
    paddingTop: 10,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  cuadrillaNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: Paleta.ink,
  },
  especialidad: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipActiva: {
    backgroundColor: `${Paleta.verde}22`,
  },
  chipInactiva: {
    backgroundColor: `${Paleta.rojo}22`,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
});
