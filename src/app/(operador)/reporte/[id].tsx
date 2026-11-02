import { useCallback, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { MapView, Marker } from "@/components/mapa";
import { SheetAsignar } from "@/components/operador/sheet-asignar";
import { SheetDuplicado } from "@/components/operador/sheet-duplicado";
import { SheetEstado } from "@/components/operador/sheet-estado";
import { SheetZona } from "@/components/operador/sheet-zona";
import { Fonts, Paleta, PaletaOperador } from "@/constants/theme";
import { obtenerCategoriaVisual } from "@/constants/categorias";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { InsigniaEstado } from "@/components/ui/insignia-estado";
import { useSesion } from "@/contexto/sesion";
import {
  haceTiempo,
  nombreCuadrilla,
  nombreTipo,
  nombreZona,
  puedeAsignar,
  puedeGestionar,
  reportesParaDuplicar,
  textoFotos,
} from "@/servicios/bandeja";
import { esErrorServicio } from "@/servicios/error";
import {
  actualizarEstado,
  asignarCuadrilla,
  corregirZona,
  etiquetaEstado,
  sePuedeCorregirZona,
  marcarDuplicado,
  obtenerCambiosEstado,
  obtenerReportePorId,
  obtenerReportes,
  textoDuplicado,
} from "@/servicios/reportes";
import { COLORES_ESTADO } from "@/servicios/mapa";
import { CambioDeEstado, EstadoReporte, Reporte } from "@/tipos";

function tituloHistorial(cambio: CambioDeEstado) {
  const comentario = cambio.comentario?.trim() ?? "";
  if (/^zona corregida/i.test(comentario)) {
    return "Zona corregida";
  }
  return etiquetaEstado(cambio.estado);
}

function detalleHistorial(
  cambio: CambioDeEstado,
  nombreCuadrillaActual?: string | null,
) {
  const comentario = cambio.comentario?.trim() ?? "";
  if (/^zona corregida a /i.test(comentario)) {
    return `A ${comentario.replace(/^zona corregida a /i, "")}`;
  }
  if (/^zona corregida/i.test(comentario)) {
    return null;
  }
  if (/^asignado a /i.test(comentario)) {
    return `A ${comentario.replace(/^asignado a /i, "")}`;
  }
  if (cambio.estado === "asignado" && !comentario && nombreCuadrillaActual) {
    return `A ${nombreCuadrillaActual}`;
  }
  if (!cambio.operadorId && !comentario) {
    return "Reporte creado por el vecino";
  }
  return comentario || null;
}

function esEventoZona(cambio: CambioDeEstado) {
  return /^zona corregida/i.test(cambio.comentario?.trim() ?? "");
}

function abrirEnMapas(latitud: number, longitud: number, direccion: string) {
  const consulta = encodeURIComponent(direccion || `${latitud},${longitud}`);
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?ll=${latitud},${longitud}&q=${consulta}`
      : `geo:${latitud},${longitud}?q=${consulta}`;
  void Linking.openURL(url).catch(() => {
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`,
    );
  });
}

export default function DetalleOperadorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [catalogo, setCatalogo] = useState<Reporte[]>([]);
  const [cambios, setCambios] = useState<CambioDeEstado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mostrarMas, setMostrarMas] = useState(false);
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [errorAsignar, setErrorAsignar] = useState<string | null>(null);
  const [mostrarEstado, setMostrarEstado] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const [mostrarDuplicado, setMostrarDuplicado] = useState(false);
  const [guardandoDuplicado, setGuardandoDuplicado] = useState(false);
  const [errorDuplicado, setErrorDuplicado] = useState<string | null>(null);
  const [mostrarZona, setMostrarZona] = useState(false);
  const [corrigiendoZona, setCorrigiendoZona] = useState(false);
  const [errorZona, setErrorZona] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!id) {
      setError("No encontramos ese reporte.");
      return;
    }
    try {
      const [item, lista] = await Promise.all([
        obtenerReportePorId(id),
        obtenerReportes(),
      ]);
      if (!item) {
        setError("No encontramos ese reporte.");
        setReporte(null);
        return;
      }
      const historial = await obtenerCambiosEstado(item.id);
      setReporte(item);
      setCatalogo(lista);
      setCambios(
        [...historial].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
      );
      setError(null);
    } catch {
      setError("No se pudo cargar el reporte.");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function onCambiarEstado(
    nuevoEstado: EstadoReporte,
    comentario: string,
    fotoArregloUrl: string | null,
  ) {
    if (!reporte || !usuario) {
      return;
    }
    setGuardandoEstado(true);
    setErrorEstado(null);
    try {
      await actualizarEstado(
        reporte.id,
        nuevoEstado,
        comentario,
        usuario.id,
        fotoArregloUrl,
      );
      setMostrarEstado(false);
      await cargar();
    } catch (err) {
      setErrorEstado(
        esErrorServicio(err) ? err.message : "No se pudo cambiar el estado.",
      );
    } finally {
      setGuardandoEstado(false);
    }
  }

  async function onMarcarDuplicado(originalId: string) {
    if (!reporte || !usuario) {
      return;
    }
    setGuardandoDuplicado(true);
    setErrorDuplicado(null);
    try {
      await marcarDuplicado(reporte.id, originalId, usuario.id);
      setMostrarDuplicado(false);
      await cargar();
    } catch (err) {
      setErrorDuplicado(
        esErrorServicio(err) ? err.message : "No se pudo marcar el duplicado.",
      );
    } finally {
      setGuardandoDuplicado(false);
    }
  }

  async function onCorregirZona(zonaId: string) {
    if (!reporte || !usuario) {
      return;
    }
    setCorrigiendoZona(true);
    setErrorZona(null);
    try {
      const actualizado = await corregirZona(reporte.id, zonaId, usuario.id);
      setReporte(actualizado);
      setMostrarZona(false);
      await cargar();
    } catch (err) {
      setErrorZona(
        esErrorServicio(err) ? err.message : "No se pudo corregir la zona.",
      );
    } finally {
      setCorrigiendoZona(false);
    }
  }

  async function onAsignar(cuadrillaId: string) {
    if (!reporte || !usuario) {
      return;
    }
    setAsignando(true);
    setErrorAsignar(null);
    try {
      const actualizado = await asignarCuadrilla(
        reporte.id,
        cuadrillaId,
        usuario.id,
      );
      setReporte(actualizado);
      setMostrarAsignar(false);
      await cargar();
    } catch (err) {
      setErrorAsignar(
        esErrorServicio(err) ? err.message : "No se pudo asignar el reporte.",
      );
    } finally {
      setAsignando(false);
    }
  }

  const foto = reporte?.fotos.find((item) => item.esPrincipal)?.url
    ?? reporte?.fotos[0]?.url;
  const originales = reporte ? reportesParaDuplicar(catalogo, reporte.id) : [];
  const gestionable = reporte ? puedeGestionar(reporte) : false;
  const categoria = reporte ? obtenerCategoriaVisual(reporte.tipoId) : null;

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />
      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === "web" ? 48 : insets.top + 12 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bandeja"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.volverFila}
        >
          <Ionicons name="arrow-back" size={20} color={Paleta.paperRaised} />
          <Text style={styles.volver}>Bandeja</Text>
        </Pressable>
        <View style={styles.cabeceraTitulo}>
          <Text style={styles.codigo} numberOfLines={1}>
            {reporte?.codigo ?? "Reporte"}
          </Text>
          {reporte ? (
            <InsigniaEstado
              estado={reporte.estado}
              etiqueta={etiquetaEstado(reporte.estado)}
              sobreFondoOscuro
            />
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          { paddingBottom: insets.bottom + (gestionable ? 96 : 24) },
        ]}
      >
        {error || !reporte ? (
          <Text style={styles.vacio}>{error ?? "Cargando…"}</Text>
        ) : (
          <>
            <View style={styles.fotoBloque}>
              {foto ? (
                <Image source={{ uri: foto }} style={styles.foto} />
              ) : (
                <View style={[styles.foto, styles.fotoVacia]}>
                  <Ionicons name="image-outline" size={36} color={Paleta.inkSoft} />
                </View>
              )}
              <View style={styles.fotoBadge}>
                <Text style={styles.fotoBadgeTexto}>
                  {textoFotos(reporte.fotos.length)}
                </Text>
              </View>
            </View>

            <View style={styles.ficha}>
              <View style={styles.filaTipo}>
                <IconoCategoria
                  tipoId={reporte.tipoId}
                  size={22}
                  color={categoria?.color}
                />
                <Text style={styles.tipo}>{nombreTipo(reporte.tipoId)}</Text>
              </View>
              <Text style={styles.direccion}>{reporte.direccion}</Text>

              <View style={styles.chips}>
                <View style={styles.chip}>
                  <Ionicons name="pricetag-outline" size={14} color={PaletaOperador.principal} />
                  <Text style={styles.chipTexto}>{nombreZona(reporte.zonaId)}</Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="time-outline" size={14} color={Paleta.inkSoft} />
                  <Text style={styles.chipTexto}>{haceTiempo(reporte.creadoEn)}</Text>
                </View>
              </View>

              <View style={styles.asignacion}>
                <Ionicons
                  name={reporte.cuadrillaId ? "people-outline" : "alert-circle-outline"}
                  size={16}
                  color={reporte.cuadrillaId ? PaletaOperador.principal : Paleta.orange}
                />
                <Text
                  style={[
                    styles.asignacionTexto,
                    !reporte.cuadrillaId && styles.asignacionPendiente,
                  ]}
                >
                  {reporte.cuadrillaId
                    ? nombreCuadrilla(reporte.cuadrillaId)
                    : "Sin asignar"}
                </Text>
              </View>

              {reporte.duplicadoDe ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={textoDuplicado(reporte.duplicadoDe)}
                  onPress={() =>
                    router.push(`/(operador)/reporte/${reporte.duplicadoDe}`)
                  }
                >
                  <Text style={styles.enlaceOriginal}>
                    {textoDuplicado(reporte.duplicadoDe)}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.bloque}>
              <Text style={styles.tituloSeccion}>Descripción del vecino</Text>
              <Text style={styles.descripcion}>
                {reporte.descripcion?.trim() || "El vecino no dejó una descripción."}
              </Text>
            </View>

            {reporte.fotoArreglo ? (
              <View style={styles.bloque}>
                <Text style={styles.tituloSeccion}>Foto del arreglo</Text>
                <Image
                  source={{ uri: reporte.fotoArreglo.url }}
                  style={styles.fotoArreglo}
                />
              </View>
            ) : null}

            <View style={styles.bloque}>
              <Text style={styles.tituloSeccion}>Ubicación</Text>
              <View style={styles.mapa}>
                <MapView
                  style={StyleSheet.absoluteFill}
                  initialRegion={{
                    latitude: reporte.coordenadas.latitud,
                    longitude: reporte.coordenadas.longitud,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: reporte.coordenadas.latitud,
                      longitude: reporte.coordenadas.longitud,
                    }}
                    pinColor={COLORES_ESTADO[reporte.estado]}
                  />
                </MapView>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir en mapas"
                  onPress={() =>
                    abrirEnMapas(
                      reporte.coordenadas.latitud,
                      reporte.coordenadas.longitud,
                      reporte.direccion,
                    )
                  }
                  style={styles.abrirMapas}
                >
                  <Text style={styles.abrirMapasTexto}>Abrir en mapas</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.bloque}>
              <Text style={styles.tituloSeccion}>Historial</Text>
              {cambios.length > 0 ? (
                <View style={styles.listaHistorial}>
                  {cambios.map((cambio, index) => {
                    const esActual = index === 0;
                    const zona = esEventoZona(cambio);
                    const detalle = detalleHistorial(
                      cambio,
                      reporte.cuadrillaId
                        ? nombreCuadrilla(reporte.cuadrillaId)
                        : null,
                    );
                    return (
                      <View key={cambio.id} style={styles.itemTimeline}>
                        <View style={styles.columnaIndicador}>
                          {zona ? (
                            <View style={styles.marcaZona}>
                              <Ionicons
                                name="phone-portrait-outline"
                                size={12}
                                color={PaletaOperador.principal}
                              />
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.marcaHistorial,
                                esActual && styles.marcaHistorialActual,
                                {
                                  backgroundColor: COLORES_ESTADO[cambio.estado],
                                },
                              ]}
                            />
                          )}
                          {index < cambios.length - 1 ? (
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
                              {tituloHistorial(cambio)}
                            </Text>
                            <Text style={styles.cambioFecha}>
                              {haceTiempo(cambio.fechaHora)}
                            </Text>
                          </View>
                          {detalle ? (
                            <Text style={styles.cambioTexto}>{detalle}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.meta}>Todavía no hay movimientos registrados.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {reporte && gestionable ? (
        <View
          style={[
            styles.barraAcciones,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Más acciones"
            onPress={() => setMostrarMas(true)}
            style={styles.botonMas}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={PaletaOperador.principal} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cambiar estado de ${reporte.codigo}`}
            onPress={() => {
              setErrorEstado(null);
              setMostrarEstado(true);
            }}
            style={styles.botonSecundario}
          >
            <Text style={styles.botonSecundarioTexto}>Cambiar estado</Text>
          </Pressable>
          {puedeAsignar(reporte) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Asignar ${reporte.codigo}`}
              onPress={() => {
                setErrorAsignar(null);
                setMostrarAsignar(true);
              }}
              style={styles.botonAsignar}
            >
              <Text style={styles.botonAsignarTexto}>Asignar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {mostrarMas ? (
        <Pressable style={styles.masFondo} onPress={() => setMostrarMas(false)}>
          <Pressable style={styles.masPanel} onPress={() => {}}>
            <Text style={styles.masTitulo}>Más acciones</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Marcar duplicado"
              onPress={() => {
                setMostrarMas(false);
                setErrorDuplicado(null);
                setMostrarDuplicado(true);
              }}
              style={styles.masOpcion}
            >
              <Text style={styles.masOpcionTexto}>Marcar duplicado</Text>
            </Pressable>
            {sePuedeCorregirZona() ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Corregir zona"
                onPress={() => {
                  setMostrarMas(false);
                  setErrorZona(null);
                  setMostrarZona(true);
                }}
                style={styles.masOpcion}
              >
                <Text style={styles.masOpcionTexto}>Corregir zona</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              onPress={() => setMostrarMas(false)}
              style={styles.masCancelar}
            >
              <Text style={styles.masCancelarTexto}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      ) : null}

      <SheetEstado
        visible={mostrarEstado}
        estadoActual={reporte?.estado ?? null}
        guardando={guardandoEstado}
        error={errorEstado}
        onCerrar={() => {
          if (!guardandoEstado) {
            setMostrarEstado(false);
          }
        }}
        onAsignarCuadrilla={
          reporte && puedeAsignar(reporte)
            ? () => {
                if (guardandoEstado) {
                  return;
                }
                setMostrarEstado(false);
                setErrorAsignar(null);
                setMostrarAsignar(true);
              }
            : undefined
        }
        onConfirmar={(estado, comentario, fotoArregloUrl) => {
          void onCambiarEstado(estado, comentario, fotoArregloUrl);
        }}
      />
      <SheetDuplicado
        visible={mostrarDuplicado}
        opciones={originales}
        nombreDe={(item) => nombreTipo(item.tipoId)}
        guardando={guardandoDuplicado}
        error={errorDuplicado}
        onCerrar={() => {
          if (!guardandoDuplicado) {
            setMostrarDuplicado(false);
          }
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
          if (!corrigiendoZona) {
            setMostrarZona(false);
          }
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
          if (!asignando) {
            setMostrarAsignar(false);
          }
        }}
        onElegir={onAsignar}
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
    backgroundColor: PaletaOperador.principal,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  volver: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.paperRaised,
  },
  volverFila: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  cabeceraTitulo: {
    gap: 8,
  },
  codigo: {
    fontFamily: Fonts.semiBold,
    fontSize: 24,
    color: Paleta.paperRaised,
  },
  contenido: {
    padding: 16,
    gap: 14,
  },
  vacio: {
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  fotoBloque: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Paleta.paperRaised,
  },
  foto: {
    width: "100%",
    height: 220,
    backgroundColor: "#D7DEE5",
  },
  fotoVacia: {
    alignItems: "center",
    justifyContent: "center",
  },
  fotoBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fotoBadgeTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Paleta.paperRaised,
  },
  ficha: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Paleta.line,
    padding: 16,
    gap: 10,
  },
  filaTipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipo: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    color: Paleta.ink,
  },
  direccion: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Paleta.ink,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: Paleta.paper,
    borderWidth: 1,
    borderColor: Paleta.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipTexto: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Paleta.ink,
  },
  asignacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  asignacionTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Paleta.ink,
  },
  asignacionPendiente: {
    color: Paleta.orange,
  },
  enlaceOriginal: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: PaletaOperador.principal,
  },
  bloque: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Paleta.line,
    padding: 16,
    gap: 10,
  },
  tituloSeccion: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
  },
  descripcion: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Paleta.ink,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  fotoArreglo: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: Paleta.paper,
  },
  mapa: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Paleta.paper,
  },
  abrirMapas: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: Paleta.paperRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  abrirMapasTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: PaletaOperador.principal,
  },
  listaHistorial: {
    gap: 0,
  },
  itemTimeline: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 16,
  },
  columnaIndicador: {
    width: 18,
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
  marcaZona: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEF4",
    zIndex: 2,
  },
  lineaHistorial: {
    position: "absolute",
    top: 18,
    bottom: -16,
    left: 8,
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
    gap: 8,
  },
  cambioEstado: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
    fontSize: 14,
  },
  cambioEstadoActual: {
    fontSize: 16,
  },
  cambioTexto: {
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  cambioFecha: {
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 12,
  },
  barraAcciones: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Paleta.paperRaised,
    borderTopWidth: 1,
    borderTopColor: Paleta.line,
  },
  botonMas: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Paleta.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.paperRaised,
  },
  botonSecundario: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PaletaOperador.principal,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.paperRaised,
  },
  botonSecundarioTexto: {
    fontFamily: Fonts.semiBold,
    color: PaletaOperador.principal,
    fontSize: 14,
  },
  botonAsignar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: PaletaOperador.principal,
    alignItems: "center",
    justifyContent: "center",
  },
  botonAsignarTexto: {
    fontFamily: Fonts.semiBold,
    color: Paleta.paperRaised,
    fontSize: 14,
  },
  masFondo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,35,46,0.45)",
    justifyContent: "flex-end",
  },
  masPanel: {
    backgroundColor: Paleta.paperRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 8,
  },
  masTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Paleta.ink,
    marginBottom: 4,
  },
  masOpcion: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Paleta.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.paper,
  },
  masOpcionTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Paleta.ink,
  },
  masCancelar: {
    alignItems: "center",
    paddingVertical: 12,
  },
  masCancelarTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
});
