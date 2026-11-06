import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
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
import Ionicons from "@expo/vector-icons/Ionicons";

import IconoPrincipal from "@/assets/branding/icono_principal.svg";
import { SheetAsignar } from "@/components/operador/sheet-asignar";
import { QRScanner } from "@/components/operador/qr-scanner";
import { BotonTema } from "@/components/ui/boton-tema";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { InsigniaEstado } from "@/components/ui/insignia-estado";
import HeaderOperador from "@/components/ui/headerOperador";
import { obtenerCategoriaVisual } from "@/constants/categorias";
import { Fonts, fondoSuave } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
import {
  ESTADOS_BANDEJA,
  filtrarReportesBandeja,
  haceTiempo,
  nombreAutor,
  nombreTipo,
  nombreZona,
  puedeAsignar,
  resumenFiltros,
  textoFotos,
  type PestanaBandeja,
} from "@/servicios/bandeja";
import { esErrorServicio } from "@/servicios/error";
import { COLORES_ESTADO } from "@/servicios/mapa";
import {
  asignarCuadrilla,
  etiquetaEstado,
  obtenerReportes,
  obtenerTiposReporte,
} from "@/servicios/reportes";
import { obtenerZonas } from "@/servicios/zonas";
import { EstadoReporte, Reporte } from "@/tipos";

const PESTANAS: { id: PestanaBandeja; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "pendientes", etiqueta: "Pendientes" },
  { id: "mi_zona", etiqueta: "Mi zona" },
];

export default function BandejaOperadorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tema = useTheme();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
  const zonaOperadorId = usuario?.zonaId ?? null;

  const confirmarCerrarSesion = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Estás seguro de que querés cerrar sesión?")) {
        void cerrarSesion();
      }
      return;
    }

    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que querés cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            void cerrarSesion();
          },
        },
      ],
    );
  };

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
  const [scannerVisible, setScannerVisible] = useState(false);
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
    if (!asignandoId || !usuario) return;
    setAsignando(true);
    setErrorAsignar(null);
    try {
      const actualizado = await asignarCuadrilla(asignandoId, cuadrillaId, usuario.id);
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
    <View style={[styles.pantalla, { backgroundColor: tema.background }]}>
      <StatusBar style="light" />

      <HeaderOperador style={styles.cabecera}>
        <View style={styles.marcaCabecera}>
          <IconoPrincipal width={38} height={38} accessibilityLabel="Reporte Ciudadano" />
          <View style={styles.cabeceraTexto}>
            <Text style={styles.titulo}>Bandeja</Text>
            <Text style={styles.subtitulo}>
              {zonaNombre} · {visibles.length}{" "}
              {visibles.length === 1 ? "reporte" : "reportes"}
            </Text>
          </View>
        </View>

        <View style={styles.accionesCabecera}>
          <BotonTema sobreFondoOscuro />
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
            onPress={confirmarCerrarSesion}
            hitSlop={8}
          >
            <Text style={styles.salir}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </HeaderOperador>

      <View style={[styles.controles, { backgroundColor: tema.surface }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear QR de Vecino"
          onPress={() => setScannerVisible(true)}
          style={({ pressed }) => [
            styles.botonEscanearQr,
            { backgroundColor: tema.secondary },
            pressed && styles.botonEscanearQrPresionado,
          ]}
        >
          <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
          <Text style={styles.textoEscanearQr}>Escanear QR de Vecino</Text>
        </Pressable>

        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar reporte..."
          placeholderTextColor={tema.onSurfaceVariant}
          accessibilityLabel="Buscar reporte"
          style={[
            styles.buscador,
            {
              backgroundColor: tema.surfaceVariant,
              borderColor: tema.outline,
              color: tema.onSurface,
            },
          ]}
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
                style={[
                  styles.tab,
                  { backgroundColor: tema.surfaceVariant },
                  activa ? [styles.tabActiva, { backgroundColor: tema.secondary }] : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabTexto,
                    { color: activa ? "#FFFFFF" : tema.onSurfaceVariant },
                    activa ? styles.tabTextoActivo : null,
                  ]}
                >
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
          <Ionicons name="options-outline" size={16} color={tema.secondary} />
          <Text style={[styles.filtrosToggleTexto, { color: tema.onSurfaceVariant }]}>
            {filtrosActivos > 0 ? `Filtros (${filtrosActivos})` : "Filtros por zona, tipo y estado"}
          </Text>
        </Pressable>

        {!filtrosAbiertos && filtrosActivos > 0 ? (
          <Text style={[styles.filtrosResumen, { color: tema.onSurfaceVariant }]}>
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
        style={[styles.listaScroll, { backgroundColor: tema.background }]}
        contentContainerStyle={[
          styles.lista,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {visibles.length === 0 ? (
          <Text style={[styles.vacio, { color: tema.onSurfaceVariant }]}>
            {cargando
              ? "Cargando reportes…"
              : error
              ? error
              : "No hay reportes con esos filtros."}
          </Text>
        ) : (
          visibles.map((item) => (
            <View
              key={item.id}
              style={[
                styles.tarjeta,
                {
                  backgroundColor: tema.surface,
                  borderColor: tema.outline,
                },
              ]}
            >
              <View
                style={[
                  styles.barraEstado,
                  { backgroundColor: COLORES_ESTADO[item.estado] },
                ]}
              />
              <View style={styles.tarjetaCuerpo}>
                <View
                  style={[
                    styles.icono,
                    {
                      backgroundColor: fondoSuave(
                        obtenerCategoriaVisual(item.tipoId)?.color ?? tema.primary,
                      ),
                    },
                  ]}
                >
                  <IconoCategoria tipoId={item.tipoId} size={22} />
                </View>
                <View style={styles.tarjetaInfo}>
                  <View style={styles.tarjetaCabecera}>
                    <Text style={[styles.codigo, { color: tema.onSurfaceVariant }]}>{item.codigo}</Text>
                    <InsigniaEstado
                      estado={item.estado}
                      etiqueta={etiquetaEstado(item.estado)}
                      maxWidth={148}
                    />
                  </View>
                  <Text style={[styles.linea, { color: tema.onSurface }]} numberOfLines={1}>
                    {`${nombreTipo(item.tipoId)} · ${item.direccion}`}
                  </Text>
                  <Text style={[styles.meta, { color: tema.onSurfaceVariant }]} numberOfLines={1}>
                    {`${nombreZona(item.zonaId)} · ${haceTiempo(item.creadoEn)}`}
                  </Text>
                  <Text style={[styles.meta, { color: tema.onSurfaceVariant }]} numberOfLines={1}>
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
                    { borderColor: tema.secondary },
                    pressed && styles.botonPressed,
                  ]}
                >
                  <Text style={[styles.textoRevisar, { color: tema.secondary }]}>Revisar</Text>
                </Pressable>
                {puedeAsignar(item) ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Asignar ${item.codigo}`}
                    onPress={() => {
                      setErrorAsignar(null);
                      setAsignandoId(item.id);
                    }}
                    style={({ pressed }) => [
                      styles.botonAsignar,
                      { backgroundColor: tema.secondary },
                      pressed && styles.botonPressed,
                    ]}
                  >
                    <Text style={styles.textoAsignar}>Asignar</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <SheetAsignar
        visible={asignandoId !== null}
        zonaId={reporteAsignar?.zonaId ?? null}
        asignando={asignando}
        error={errorAsignar}
        onCerrar={() => {
          if (!asignando) setAsignandoId(null);
        }}
        onElegir={onAsignar}
      />
      <QRScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={(scannedData) => {
          setScannerVisible(false);
          router.push(`/(operador)/reporte/${scannedData}`);
        }}
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
  const tema = useTheme();

  return (
    <View style={styles.grupo}>
      <Text style={[styles.grupoTitulo, { color: tema.onSurfaceVariant }]}>{titulo}</Text>
      <View style={styles.chips}>
        <Chip etiqueta="Todos" activo={valor === null} onPress={() => onCambiar(null)} />
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
  const tema = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: activo ? tema.secondary : tema.surfaceVariant,
          borderColor: activo ? tema.secondary : tema.outline,
        },
      ]}
    >
      <Text
        style={[
          styles.chipTexto,
          { color: activo ? "#FFFFFF" : tema.onSurface },
          activo ? styles.chipTextoActivo : null,
        ]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  cabecera: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  marcaCabecera: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cabeceraTexto: { flex: 1, minWidth: 0 },
  titulo: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: "#FFFFFF",
  },
  subtitulo: {
    marginTop: 2,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  accionesCabecera: {
    alignItems: "flex-end",
    gap: 8,
  },
  salir: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "right",
  },
  botonEscanearQr: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botonEscanearQrPresionado: { opacity: 0.85 },
  textoEscanearQr: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: "#FFFFFF",
    textAlign: "center",
  },
  controles: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },
  buscador: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActiva: {},
  tabTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  tabTextoActivo: {
    fontFamily: Fonts.semiBold,
  },
  filtrosToggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filtrosToggleTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  filtrosResumen: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  filtrosPanel: { gap: 12 },
  grupo: { gap: 8 },
  grupoTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
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
    borderWidth: 1,
  },
  chipActivo: {},
  chipTexto: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  chipTextoActivo: {
    fontFamily: Fonts.semiBold,
  },
  listaScroll: { flex: 1 },
  lista: { padding: 20 },
  vacio: {
    fontFamily: Fonts.regular,
    textAlign: "center",
    paddingVertical: 32,
    fontSize: 14,
  },
  tarjeta: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    paddingLeft: 18,
    marginBottom: 12,
    gap: 12,
  },
  barraEstado: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  tarjetaCuerpo: {
    flexDirection: "row",
    gap: 12,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  linea: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  acciones: {
    flexDirection: "row",
    gap: 8,
  },
  botonRevisar: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  botonAsignar: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  botonPressed: { opacity: 0.88 },
  textoRevisar: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  textoAsignar: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: "#FFFFFF",
  },
});