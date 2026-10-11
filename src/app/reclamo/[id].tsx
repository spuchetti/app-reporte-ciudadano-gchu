import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import QRCode from "react-native-qrcode-svg";

import { SheetAsignar } from "@/components/operador/sheet-asignar";
import { SheetDuplicado } from "@/components/operador/sheet-duplicado";
import { SheetEstado } from "@/components/operador/sheet-estado";
import { Boton } from "@/components/ui/boton";
import Cargando from "@/components/ui/cargando";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import {
  haceTiempo,
  nombreCuadrilla,
  nombreTipo,
  puedeGestionar,
  reportesParaDuplicar,
} from "@/servicios/bandeja";
import { esErrorServicio } from "@/servicios/error";
import {
  actualizarEstado,
  asignarCuadrilla,
  etiquetaEstado,
  marcarDuplicado,
  obtenerCambiosEstado,
  obtenerReportePorId,
  obtenerReportes,
} from "@/servicios/reportes";
import { CambioDeEstado, EstadoReporte, Reporte } from "@/tipos";

const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: Paleta.amarillo,
  en_revision: Paleta.azul,
  asignado: Paleta.orange,
  resuelto: Paleta.verde,
  rechazado: Paleta.rojo,
};

function impactoLigero() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
    () => undefined,
  );
}

function fechaHoraLegible(fechaHora: string) {
  const fecha = new Date(fechaHora);
  if (Number.isNaN(fecha.getTime())) {
    return fechaHora;
  }
  return fecha.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ChipEstado({ estado }: { estado: EstadoReporte }) {
  return (
    <View
      style={[
        styles.chipEstado,
        { backgroundColor: `${COLORES_ESTADO[estado]}22` },
      ]}
    >
      <Text style={[styles.textoChip, { color: COLORES_ESTADO[estado] }]}>
        {etiquetaEstado(estado)}
      </Text>
    </View>
  );
}

export default function DetalleReclamoScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [catalogo, setCatalogo] = useState<Reporte[]>([]);
  const [historial, setHistorial] = useState<CambioDeEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarEstado, setMostrarEstado] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const [mostrarDuplicado, setMostrarDuplicado] = useState(false);
  const [guardandoDuplicado, setGuardandoDuplicado] = useState(false);
  const [errorDuplicado, setErrorDuplicado] = useState<string | null>(null);
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);
  const pantallaActiva = useRef(true);
  const secuenciaCarga = useRef(0);

  const cargar = useCallback(async () => {
    const secuencia = ++secuenciaCarga.current;
    const sigueActivo = () =>
      pantallaActiva.current && secuenciaCarga.current === secuencia;

    if (!id) {
      if (sigueActivo()) {
        setError("No encontramos ese reclamo.");
        setCargando(false);
      }
      return;
    }
    if (sigueActivo()) {
      setCargando(true);
      setError(null);
    }
    try {
      const [item, cambios, lista] = await Promise.all([
        obtenerReportePorId(id),
        obtenerCambiosEstado(id),
        obtenerReportes(),
      ]);
      if (!sigueActivo()) return;
      if (!item) {
        setReporte(null);
        setError("No encontramos ese reclamo.");
        return;
      }
      setReporte(item);
      setCatalogo(lista);
      setHistorial(
        [...cambios].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)),
      );
      setError(null);
    } catch {
      if (sigueActivo()) {
        setError("No se pudo cargar el reclamo.");
      }
    } finally {
      if (sigueActivo()) {
        setCargando(false);
      }
    }
  }, [id]);

  useEffect(() => {
    pantallaActiva.current = true;
    return () => {
      pantallaActiva.current = false;
      secuenciaCarga.current += 1;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    queueMicrotask(() => {
      if (activo) void cargar();
    });
    return () => {
      activo = false;
    };
  }, [cargar]);

  async function onCambiarEstado(
    estado: EstadoReporte,
    comentario: string,
    fotoArregloUrl: string | null,
  ) {
    if (!reporte || !usuario || usuario.rol !== "operador") return;
    setGuardandoEstado(true);
    setErrorEstado(null);
    try {
      await actualizarEstado(
        reporte.id,
        estado,
        comentario,
        usuario.id,
        fotoArregloUrl,
      );
      if (!pantallaActiva.current) return;
      setMostrarEstado(false);
      await cargar();
    } catch (err) {
      if (pantallaActiva.current) {
        setErrorEstado(
          esErrorServicio(err) ? err.message : "No se pudo cambiar el estado.",
        );
      }
    } finally {
      if (pantallaActiva.current) setGuardandoEstado(false);
    }
  }

  async function onMarcarDuplicado(originalId: string) {
    if (!reporte || !usuario || usuario.rol !== "operador") return;
    setGuardandoDuplicado(true);
    setErrorDuplicado(null);
    try {
      await marcarDuplicado(reporte.id, originalId, usuario.id);
      if (!pantallaActiva.current) return;
      setMostrarDuplicado(false);
      await cargar();
    } catch (err) {
      if (pantallaActiva.current) {
        setErrorDuplicado(
          esErrorServicio(err) ? err.message : "No se pudo marcar el duplicado.",
        );
      }
    } finally {
      if (pantallaActiva.current) setGuardandoDuplicado(false);
    }
  }

  async function onAsignar(cuadrillaId: string) {
    if (!reporte || !usuario || usuario.rol !== "operador") return;
    setAsignando(true);
    setErrorAsignar(null);
    try {
      await asignarCuadrilla(reporte.id, cuadrillaId, usuario.id);
      if (!pantallaActiva.current) return;
      setMostrarAsignar(false);
      await cargar();
    } catch (err) {
      if (pantallaActiva.current) {
        setErrorAsignar(
          esErrorServicio(err) ? err.message : "No se pudo asignar el reclamo.",
        );
      }
    } finally {
      if (pantallaActiva.current) setAsignando(false);
    }
  }

  const fotoOriginal =
    reporte?.fotos.find((foto) => foto.esPrincipal)?.url ?? reporte?.fotos[0]?.url;
  const codigoOriginal = reporte?.duplicadoDe
    ? catalogo.find((item) => item.id === reporte.duplicadoDe)?.codigo ??
      reporte.duplicadoDe
    : null;
  const puedeGestionarReporte =
    usuario?.rol === "operador" && reporte ? puedeGestionar(reporte) : false;
  const opcionesDuplicado = reporte
    ? reportesParaDuplicar(catalogo, reporte.id)
    : [];

  return (
    <View style={styles.pantalla}>
      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === "web" ? 48 : insets.top + 12 },
        ]}
      >
        <View style={styles.filaCabecera}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a la lista de reclamos"
            hitSlop={8}
            onPress={() => {
              impactoLigero();
              router.back();
            }}
            style={styles.botonVolver}
          >
            <Ionicons color={Paleta.paperRaised} name="arrow-back" size={22} />
          </Pressable>
          <View style={styles.codigoCabecera}>
            <Text style={styles.eyebrow}>DETALLE DEL RECLAMO</Text>
            <Text numberOfLines={1} style={styles.codigo}>
              {reporte?.codigo ?? "Seguimiento"}
            </Text>
            {reporte ? <ChipEstado estado={reporte.estado} /> : null}
          </View>
          {reporte?.codigo ? (
            <View
              accessible
              accessibilityLabel={`Código QR del reclamo ${reporte.codigo}`}
              style={styles.qrCabecera}
            >
              <QRCode
                backgroundColor={Paleta.paperRaised}
                color={Paleta.ink}
                size={76}
                value={reporte.codigo}
              />
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {cargando ? (
          <Cargando text="Cargando el detalle del reclamo..." />
        ) : error || !reporte ? (
          <View style={styles.estadoVacio}>
            <Text style={styles.vacioTexto}>
              {error ?? "No encontramos ese reclamo."}
            </Text>
            <Boton
              titulo="Reintentar"
              variante="secundario"
              onPress={() => {
                impactoLigero();
                void cargar();
              }}
            />
          </View>
        ) : (
          <>
            <View style={styles.panelPrincipal}>
              <Text style={styles.tipo}>{nombreTipo(reporte.tipoId)}</Text>
              <Text style={styles.direccion}>{reporte.direccion}</Text>
              <Text style={styles.meta}>{haceTiempo(reporte.creadoEn)}</Text>
              <Text style={styles.adhesiones}>
                {`${reporte.adhesiones} vecinos se sumaron`}
              </Text>
              {reporte.descripcion ? (
                <Text style={styles.descripcion}>{reporte.descripcion}</Text>
              ) : null}
              {reporte.cuadrillaId ? (
                <Text style={styles.meta}>
                  {`Asignado a ${nombreCuadrilla(reporte.cuadrillaId)}`}
                </Text>
              ) : null}
              {codigoOriginal ? (
                <Text style={styles.meta}>{`Duplicado de ${codigoOriginal}`}</Text>
              ) : null}
            </View>

            {fotoOriginal ? (
              <View style={styles.seccion}>
                <Text style={styles.tituloSeccion}>Foto original del problema</Text>
                <Image
                  accessibilityLabel="Foto original del problema"
                  source={{ uri: fotoOriginal }}
                  style={styles.foto}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {reporte.estado === "resuelto" && reporte.fotoArreglo ? (
              <View style={styles.seccion}>
                <Text style={styles.tituloSeccion}>Foto de la solución</Text>
                <Image
                  accessibilityLabel="Foto de la solución"
                  source={{ uri: reporte.fotoArreglo.url }}
                  style={styles.foto}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {puedeGestionarReporte ? (
              <View style={styles.acciones}>
                <Boton
                  titulo="Cambiar estado"
                  variante="secundario"
                  onPress={() => {
                    impactoLigero();
                    setErrorEstado(null);
                    setMostrarEstado(true);
                  }}
                />
                <Boton
                  titulo="Marcar duplicado"
                  variante="secundario"
                  onPress={() => {
                    impactoLigero();
                    setErrorDuplicado(null);
                    setMostrarDuplicado(true);
                  }}
                />
                <Boton
                  titulo="Asignar"
                  variante="primario"
                  onPress={() => {
                    impactoLigero();
                    setErrorAsignar(null);
                    setMostrarAsignar(true);
                  }}
                />
              </View>
            ) : null}

            <View style={styles.historial}>
              <Text style={styles.tituloSeccion}>Historial de avance del reporte</Text>
              {historial.length > 0 ? (
                <View style={styles.listaHistorial}>
                  {historial.map((cambio, index) => (
                    <View key={cambio.id} style={styles.itemTimeline}>
                      <View style={styles.columnaIndicador}>
                        <View
                          style={[
                            styles.marcaHistorial,
                            { backgroundColor: COLORES_ESTADO[cambio.estado] },
                          ]}
                        />
                        {index < historial.length - 1 ? (
                          <View style={styles.lineaHistorial} />
                        ) : null}
                      </View>
                      <View style={styles.columnaContenido}>
                        <View style={styles.filaTituloFecha}>
                          <Text style={styles.cambioEstado}>
                            {etiquetaEstado(cambio.estado)}
                          </Text>
                          <Text style={styles.cambioFecha}>
                            {fechaHoraLegible(cambio.fechaHora)}
                          </Text>
                        </View>
                        {cambio.comentario ? (
                          <Text
                            style={[
                              styles.cambioTexto,
                              cambio.estado === "rechazado" && styles.comentarioRechazado,
                            ]}
                          >
                            {cambio.comentario}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.meta}>
                  Todavía no hay movimientos registrados.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <SheetEstado
        visible={mostrarEstado}
        estadoActual={reporte?.estado ?? null}
        guardando={guardandoEstado}
        error={errorEstado}
        onCerrar={() => {
          if (!guardandoEstado) setMostrarEstado(false);
        }}
        onConfirmar={(estado, comentario, fotoArregloUrl) => {
          void onCambiarEstado(estado, comentario, fotoArregloUrl);
        }}
      />
      <SheetDuplicado
        visible={mostrarDuplicado}
        opciones={opcionesDuplicado}
        nombreDe={(item) => nombreTipo(item.tipoId)}
        guardando={guardandoDuplicado}
        error={errorDuplicado}
        onCerrar={() => {
          if (!guardandoDuplicado) setMostrarDuplicado(false);
        }}
        onElegir={(originalId) => {
          void onMarcarDuplicado(originalId);
        }}
      />
      <SheetAsignar
        visible={mostrarAsignar}
        zonaId={reporte?.zonaId ?? null}
        asignando={asignando}
        error={errorAsignar}
        onCerrar={() => {
          if (!asignando) setMostrarAsignar(false);
        }}
        onElegir={(cuadrillaId) => {
          void onAsignar(cuadrillaId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paper,
  },
  cabecera: {
    backgroundColor: Paleta.tealDeep,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filaCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  codigoCabecera: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eyebrow: {
    color: Paleta.paperRaised,
    opacity: 0.76,
    fontSize: 11,
    fontWeight: "700",
  },
  codigo: {
    color: Paleta.paperRaised,
    fontSize: 20,
    fontWeight: "700",
  },
  qrCabecera: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 6,
    padding: 5,
  },
  contenido: {
    padding: 16,
    gap: 14,
  },
  panelPrincipal: {
    backgroundColor: Paleta.paperRaised,
    borderColor: Paleta.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  chipEstado: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoChip: {
    fontSize: 12,
    fontWeight: "700",
  },
  tipo: {
    color: Paleta.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  direccion: {
    color: Paleta.inkSoft,
    fontSize: 15,
  },
  adhesiones: {
    color: Paleta.tealDeep,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: Paleta.inkSoft,
    fontSize: 13,
  },
  descripcion: {
    color: Paleta.ink,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  seccion: {
    backgroundColor: Paleta.paperRaised,
    borderColor: Paleta.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  tituloSeccion: {
    color: Paleta.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  foto: {
    width: "100%",
    height: 220,
    borderRadius: 6,
    backgroundColor: Paleta.paper,
  },
  acciones: {
    gap: 8,
  },
  historial: {
    gap: 10,
    marginTop: 4,
  },
  itemTimeline: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 16,
  },
  listaHistorial: {
    gap: 0,
  },
  columnaIndicador: {
    width: 14,
    alignItems: "center",
    position: "relative",
  },
  marcaHistorial: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    zIndex: 2,
  },
  lineaHistorial: {
    position: "absolute",
    top: 14,
    bottom: -16,
    width: 2,
    backgroundColor: Paleta.line,
    zIndex: 1,
  },
  columnaContenido: {
    flex: 1,
    gap: 4,
  },
  filaTituloFecha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cambioEstado: {
    color: Paleta.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  cambioFecha: {
    color: Paleta.inkSoft,
    fontSize: 12,
  },
  cambioTexto: {
    color: Paleta.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  comentarioRechazado: {
    color: Paleta.rojo,
  },
  estadoVacio: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 32,
  },
  vacioTexto: {
    color: Paleta.inkSoft,
    fontSize: 14,
    textAlign: "center",
  },
});