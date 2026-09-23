import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";

import { SheetAsignar } from "@/components/operador/sheet-asignar";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import {
  ESTADOS_BANDEJA,
  filtrarReportesBandeja,
  haceTiempo,
  iconoTipo,
  nombreAutor,
  nombreTipo,
  nombreZona,
  puedeAsignar,
  resumenFiltros,
  textoFotos,
  type PestanaBandeja,
} from "@/servicios/bandeja";
import { esErrorServicio } from "@/servicios/error";
import {
  asignarCuadrilla,
  etiquetaEstado,
  obtenerReportes,
  obtenerTiposReporte,
} from "@/servicios/reportes";
import { obtenerZonas } from "@/servicios/zonas";
import { EstadoReporte, Reporte } from "@/tipos";
import HeaderOperador from "@/components/ui/headerOperador";

const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: Paleta.amarillo,
  en_revision: Paleta.azul,
  asignado: Paleta.orange,
  resuelto: Paleta.verde,
  rechazado: Paleta.rojo,
};

const PESTANAS: { id: PestanaBandeja; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "pendientes", etiqueta: "Pendientes" },
  { id: "mi_zona", etiqueta: "Mi zona" },
];

export default function BandejaOperadorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
  const zonaOperadorId = usuario?.zonaId ?? null;

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState<PestanaBandeja>("todos");
  const [zonaId, setZonaId] = useState<string | null>(null);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoReporte | null>(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [asignandoId, setAsignandoId] = useState<string | null>(null);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);
  const [asignando, setAsignando] = useState(false);
  const [opcionesZona, setOpcionesZona] = useState<{ id: string; etiqueta: string }[]>([]);
  const [opcionesTipo, setOpcionesTipo] = useState<{ id: string; etiqueta: string }[]>([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, zonas, tipos] = await Promise.all([
        obtenerReportes(),
        obtenerZonas(),
        obtenerTiposReporte(),
      ]);
      setReportes(lista);
      setOpcionesZona(zonas.map((zona) => ({ id: zona.id, etiqueta: zona.nombre })));
      setOpcionesTipo(tipos.map((tipo) => ({ id: tipo.id, etiqueta: tipo.nombre })));
    } catch {
      setError("No se pudieron cargar los reportes.");
      setReportes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const visibles = useMemo(
    () =>
      filtrarReportesBandeja({
        reportes,
        pestana,
        zonaOperadorId,
        busqueda,
        zonaId,
        tipoId,
        estado,
      }),
    [busqueda, estado, pestana, reportes, tipoId, zonaId, zonaOperadorId],
  );

  const filtrosActivos = [zonaId, tipoId, estado].filter(Boolean).length;
  const zonaNombre = zonaOperadorId ? nombreZona(zonaOperadorId) : "Sin zona";
  const reporteAsignar = reportes.find((item) => item.id === asignandoId) ?? null;

  async function onAsignar(cuadrillaId: string) {
    if (!asignandoId || !usuario) {
      return;
    }
    setAsignando(true);
    setErrorAsignar(null);
    try {
      const actualizado = await asignarCuadrilla(
        asignandoId,
        cuadrillaId,
        usuario.id,
      );
      setReportes((lista) =>
        lista.map((item) => (item.id === actualizado.id ? actualizado : item)),
      );
      setAsignandoId(null);
    } catch (err) {
      setErrorAsignar(
        esErrorServicio(err) ? err.message : "No se pudo asignar el reporte.",
      );
    } finally {
      setAsignando(false);
    }
  }

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />

      <HeaderOperador style={styles.cabecera}>
        <View style={styles.cabeceraTexto}>
          <Text style={styles.titulo}>Bandeja</Text>
          <Text style={styles.subtitulo}>
            {zonaNombre} · {visibles.length}{" "}
            {visibles.length === 1 ? "reporte" : "reportes"}
          </Text>
        </View>
        <View style={styles.accionesCabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zonas y cuadrillas"
            onPress={() => router.push("/zonas")}
            hitSlop={8}
          >
            <Text style={styles.salir}>Zonas y cuadrillas</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={cerrarSesion}
            hitSlop={8}
          >
            <Text style={styles.salir}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </HeaderOperador>

      <View style={styles.controles}>
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar reporte..."
          placeholderTextColor={Paleta.inkSoft}
          accessibilityLabel="Buscar reporte"
          style={styles.buscador}
        />

        <View style={styles.tabs} accessibilityRole="tablist">
          {PESTANAS.map((item) => {
            const activa = pestana === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={item.etiqueta}
                onPress={() => setPestana(item.id)}
                style={[styles.tab, activa ? styles.tabActiva : null]}
              >
                <Text style={[styles.tabTexto, activa ? styles.tabTextoActivo : null]}>
                  {item.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          onPress={() => setFiltrosAbiertos((abierto) => !abierto)}
          style={styles.filtrosToggle}
        >
          <Text style={styles.filtrosToggleTexto}>
            {filtrosActivos > 0 ? `Filtros (${filtrosActivos})` : "Filtros por zona, tipo y estado"}
          </Text>
        </Pressable>

        {!filtrosAbiertos && filtrosActivos > 0 ? (
          <Text style={styles.filtrosResumen}>
            {resumenFiltros({ zonaId, tipoId, estado })}
          </Text>
        ) : null}

        {filtrosAbiertos ? (
          <View style={styles.filtrosPanel}>
            <GrupoChips
              titulo="Zona"
              opciones={opcionesZona}
              valor={zonaId}
              onCambiar={setZonaId}
            />
            <GrupoChips
              titulo="Tipo"
              opciones={opcionesTipo}
              valor={tipoId}
              onCambiar={setTipoId}
            />
            <GrupoChips
              titulo="Estado"
              opciones={ESTADOS_BANDEJA.map((item) => ({
                id: item,
                etiqueta: etiquetaEstado(item),
              }))}
              valor={estado}
              onCambiar={(id) => setEstado(id as EstadoReporte | null)}
            />
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.lista,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {visibles.length === 0 ? (
          <Text style={styles.vacio}>
            {cargando
              ? "Cargando reportes…"
              : error
                ? error
                : "No hay reportes con esos filtros."}
          </Text>
        ) : (
          visibles.map((item) => {
            const color = COLORES_ESTADO[item.estado];
            return (
              <View key={item.id} style={styles.tarjeta}>
                <View style={styles.tarjetaCuerpo}>
                  <View style={[styles.icono, { backgroundColor: `${color}22` }]}>
                    <Text style={styles.iconoTexto}>{iconoTipo(item.tipoId)}</Text>
                  </View>
                  <View style={styles.tarjetaInfo}>
                    <View style={styles.tarjetaCabecera}>
                      <Text style={styles.codigo}>{item.codigo}</Text>
                      <View style={[styles.insignia, { backgroundColor: `${color}22` }]}>
                        <Text style={[styles.insigniaTexto, { color }]}>
                          {etiquetaEstado(item.estado)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.linea} numberOfLines={1}>
                      {`${nombreTipo(item.tipoId)} · ${item.direccion}`}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {`${nombreZona(item.zonaId)} · ${haceTiempo(item.creadoEn)}`}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {`${nombreAutor(item.autorId)} · ${textoFotos(item.fotos.length)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.acciones}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Revisar ${item.codigo}`}
                    onPress={() => router.push(`/(operador)/reporte/${item.id}`)}
                    style={({ pressed }) => [
                      styles.botonRevisar,
                      pressed && styles.botonPressed,
                    ]}
                  >
                    <Text style={styles.textoRevisar}>Revisar</Text>
                  </Pressable>
                  {puedeAsignar(item.estado) ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Asignar ${item.codigo}`}
                      onPress={() => {
                        setErrorAsignar(null);
                        setAsignandoId(item.id);
                      }}
                      style={({ pressed }) => [
                        styles.botonAsignar,
                        pressed && styles.botonPressed,
                      ]}
                    >
                      <Text style={styles.textoAsignar}>Asignar</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <SheetAsignar
        visible={asignandoId !== null}
        zonaId={reporteAsignar?.zonaId ?? null}
        asignando={asignando}
        error={errorAsignar}
        onCerrar={() => {
          if (!asignando) {
            setAsignandoId(null);
          }
        }}
        onElegir={onAsignar}
      />
    </View>
  );
}

function GrupoChips({
  titulo,
  opciones,
  valor,
  onCambiar,
}: {
  titulo: string;
  opciones: { id: string; etiqueta: string }[];
  valor: string | null;
  onCambiar: (id: string | null) => void;
}) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.grupoTitulo}>{titulo}</Text>
      <View style={styles.chips}>
        <Chip
          etiqueta="Todos"
          activo={valor === null}
          onPress={() => onCambiar(null)}
        />
        {opciones.map((opcion) => (
          <Chip
            key={opcion.id}
            etiqueta={opcion.etiqueta}
            activo={valor === opcion.id}
            onPress={() => onCambiar(opcion.id)}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({
  etiqueta,
  activo,
  onPress,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[styles.chip, activo ? styles.chipActivo : null]}
    >
      <Text style={[styles.chipTexto, activo ? styles.chipTextoActivo : null]}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Paleta.paper },
  cabecera: {
    backgroundColor: Paleta.orange,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cabeceraTexto: { flex: 1 },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 24,
    fontWeight: "600",
    color: Paleta.paperRaised,
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  accionesCabecera: {
    alignItems: "flex-end",
    gap: 10,
  },
  salir: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.paperRaised,
    textAlign: "right",
  },
  controles: {
    backgroundColor: Paleta.paperRaised,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Paleta.line,
    gap: 10,
  },
  buscador: {
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Paleta.ink,
    backgroundColor: Paleta.paper,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.paper,
  },
  tabActiva: {
    backgroundColor: Paleta.orange,
  },
  tabTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.orange,
  },
  tabTextoActivo: {
    color: Paleta.paperRaised,
  },
  filtrosToggle: {
    alignSelf: "flex-start",
  },
  filtrosToggleTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.inkSoft,
  },
  filtrosResumen: {
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  filtrosPanel: {
    gap: 12,
  },
  grupo: {
    gap: 8,
  },
  grupoTitulo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Paleta.paper,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  chipActivo: {
    backgroundColor: Paleta.orange,
    borderColor: Paleta.orange,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: Paleta.ink,
  },
  chipTextoActivo: {
    color: Paleta.paperRaised,
  },
  lista: {
    padding: 16,
  },
  vacio: {
    textAlign: "center",
    paddingVertical: 32,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  tarjeta: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Paleta.line,
    marginBottom: 10,
    gap: 12,
  },
  tarjetaCuerpo: {
    flexDirection: "row",
    gap: 12,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconoTexto: {
    fontSize: 20,
  },
  tarjetaInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tarjetaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  codigo: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.ink,
  },
  insignia: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  insigniaTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  linea: {
    fontSize: 13,
    color: Paleta.ink,
  },
  meta: {
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  acciones: {
    flexDirection: "row",
    gap: 8,
  },
  botonRevisar: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Paleta.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  botonAsignar: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: Paleta.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  botonPressed: {
    opacity: 0.88,
  },
  textoRevisar: {
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.orange,
  },
  textoAsignar: {
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.paperRaised,
  },
});
