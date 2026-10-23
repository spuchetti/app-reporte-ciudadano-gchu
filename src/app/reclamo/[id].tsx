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
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

import { SheetAsignar } from "@/components/operador/sheet-asignar";
import { SheetDuplicado } from "@/components/operador/sheet-duplicado";
import { SheetEstado } from "@/components/operador/sheet-estado";
import { SheetZona } from "@/components/operador/sheet-zona";
import { Boton } from "@/components/ui/boton";
import Cargando from "@/components/ui/cargando";
import { InsigniaEstado } from "@/components/ui/insignia-estado";
import { Fonts, Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import {
  haceTiempo,
  nombreAutor,
  nombreCuadrilla,
  nombreTipo,
  puedeGestionar,
  reportesParaDuplicar,
} from "@/servicios/bandeja";
import { esErrorServicio } from "@/servicios/error";
import {
  adhesionesDelReporte,
  actualizarEstado,
  asignarCuadrilla,
  corregirZona,
  etiquetaEstado,
  etiquetaParaVecino,
  marcarDuplicado,
  obtenerCambiosEstado,
  obtenerReportePorId,
  obtenerReportes,
  textoDuplicado,
} from "@/servicios/reportes";
import { COLORES_ESTADO } from "@/servicios/mapa";
import { CambioDeEstado, EstadoReporte, Reporte } from "@/tipos";

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

function ChipEstado({ reporte }: { reporte: Reporte }) {
  const pendiente = !reporte.sincronizado;
  return (
    <InsigniaEstado
      estado={reporte.estado}
      etiqueta={etiquetaParaVecino(reporte)}
      sobreFondoOscuro
      colorOverride={pendiente ? Paleta.inkSoft : undefined}
    />
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
  const [mostrarZona, setMostrarZona] = useState(false);
  const [corrigiendoZona, setCorrigiendoZona] = useState(false);
  const [errorZona, setErrorZona] = useState<string | null>(null);
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

  async function onCorregirZona(zonaId: string) {
    if (!reporte || !usuario || usuario.rol !== "operador") return;
    setCorrigiendoZona(true);
    setErrorZona(null);
    try {
      await corregirZona(reporte.id, zonaId, usuario.id);
      if (!pantallaActiva.current) return;
      setMostrarZona(false);
      await cargar();
    } catch (err) {
      if (pantallaActiva.current) {
        setErrorZona(
          esErrorServicio(err) ? err.message : "No se pudo corregir la zona.",
        );
      }
    } finally {
      if (pantallaActiva.current) setCorrigiendoZona(false);
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
            <Text numberOfLines={2} style={styles.codigo}>
              {reporte?.codigo ?? "Seguimiento"}
            </Text>
            {reporte ? <ChipEstado reporte={reporte} /> : null}
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
              <View
                style={[
                  styles.barraEstado,
                  {
                    backgroundColor: reporte.sincronizado
                      ? COLORES_ESTADO[reporte.estado]
                      : Paleta.inkSoft,
                  },
                ]}
              />
              <Text style={styles.tipo}>{nombreTipo(reporte.tipoId)}</Text>
              <Text style={styles.direccion}>{reporte.direccion}</Text>
              <View style={styles.resumenDatos}>
                <Text style={styles.meta}>{haceTiempo(reporte.creadoEn)}</Text>
                <Text style={styles.adhesiones}>
                  {`${reporte.adhesiones} vecinos se sumaron`}
                </Text>
              </View>
              {adhesionesDelReporte(reporte.id).length > 0 ? (
                <Text style={styles.vecinosSumados}>
                  {adhesionesDelReporte(reporte.id)
                    .map((item) => nombreAutor(item.usuarioId))
                    .join(", ")}
                </Text>
              ) : null}
              {reporte.cuadrillaId ? (
                <Text style={styles.meta}>
                  {`Asignado a ${nombreCuadrilla(reporte.cuadrillaId)}`}
                </Text>
              ) : null}
              {reporte.duplicadoDe ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={textoDuplicado(reporte.duplicadoDe)}
                  onPress={() => {
                    impactoLigero();
                    router.push(`/reclamo/${reporte.duplicadoDe}`);
                  }}
                >
                  <Text style={styles.enlaceOriginal}>
                    {textoDuplicado(reporte.duplicadoDe)}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {reporte.descripcion ? (
              <View style={styles.bloqueDescripcion}>
                <Text style={styles.tituloSeccion}>Descripción</Text>
                <Text style={styles.descripcion}>{reporte.descripcion}</Text>
              </View>
            ) : null}

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
                  titulo="Corregir zona"
                  variante="secundario"
                  onPress={() => {
                    impactoLigero();
                    setErrorZona(null);
                    setMostrarZona(true);
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
                  {historial.map((cambio, index) => {
                    const esActual = index === historial.length - 1;
                    return (
                      <View key={cambio.id} style={styles.itemTimeline}>
                        <View style={styles.columnaIndicador}>
                          <View
                            style={[
                              styles.marcaHistorial,
                              esActual && styles.marcaHistorialActual,
                              { backgroundColor: COLORES_ESTADO[cambio.estado] },
                            ]}
                          />
                          {index < historial.length - 1 ? (
                            <View style={styles.lineaHistorial} />
                          ) : null}
                        </View>
                        <View style={styles.columnaContenido}>
                          <View style={styles.filaTituloFecha}>
                            <Text
                              style={[
                                styles.cambioEstado,
                                esActual && styles.cambioEstadoActual,
                              ]}
                            >
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
                                cambio.estado === "rechazado" &&
                                  styles.comentarioRechazado,
                              ]}
                            >
                              {cambio.comentario}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
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
      <SheetZona
        visible={mostrarZona}
        guardando={corrigiendoZona}
        error={errorZona}
        onCerrar={() => {
          if (!corrigiendoZona) setMostrarZona(false);
        }}
        onElegir={(zonaId) => {
          void onCorregirZona(zonaId);
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
    backgroundColor: Paleta.teal,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  filaCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  codigoCabecera: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eyebrow: {
    fontFamily: Fonts.semiBold,
    color: Paleta.paperRaised,
    fontSize: 11,
  },
  codigo: {
    fontFamily: Fonts.semiBold,
    color: Paleta.paperRaised,
    fontSize: 16,
  },
  qrCabecera: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 10,
    padding: 5,
  },
  contenido: {
    padding: 20,
    gap: 12,
  },
  panelPrincipal: {
    backgroundColor: Paleta.paperRaised,
    borderColor: Paleta.line,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    padding: 16,
    gap: 8,
  },
  barraEstado: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  tipo: {
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
    fontSize: 22,
  },
  direccion: {
    fontFamily: Fonts.medium,
    color: Paleta.inkSoft,
    fontSize: 15,
  },
  adhesiones: {
    fontFamily: Fonts.semiBold,
    color: Paleta.tealDeep,
    fontSize: 14,
    textAlign: "right",
  },
  resumenDatos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  vecinosSumados: {
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 13,
  },
  enlaceOriginal: {
    fontFamily: Fonts.semiBold,
    color: Paleta.teal,
    fontSize: 14,
  },
  descripcion: {
    fontFamily: Fonts.regular,
    color: Paleta.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  bloqueDescripcion: {
    backgroundColor: Paleta.tealSoft,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  seccion: {
    backgroundColor: Paleta.paperRaised,
    borderColor: Paleta.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  tituloSeccion: {
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
    fontSize: 16,
  },
  foto: {
    width: "100%",
    height: 220,
    borderRadius: 14,
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
  marcaHistorialActual: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 1,
  },
  lineaHistorial: {
    position: "absolute",
    top: 14,
    bottom: -16,
    left: 6,
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
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
    fontSize: 14,
  },
  cambioEstadoActual: {
    fontSize: 16,
  },
  cambioFecha: {
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 12,
  },
  cambioTexto: {
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 14,
    textAlign: "center",
  },
});