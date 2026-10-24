import { useCallback, useState } from "react";
import {
  Image,
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
  nombreAutor,
  nombreCuadrilla,
  nombreTipo,
  nombreZona,
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
  marcarDuplicado,
  obtenerCambiosEstado,
  obtenerReportePorId,
  obtenerReportes,
  textoDuplicado,
} from "@/servicios/reportes";
import { COLORES_ESTADO } from "@/servicios/mapa";
import { CambioDeEstado, EstadoReporte, Reporte } from "@/tipos";

export default function DetalleOperadorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [catalogo, setCatalogo] = useState<Reporte[]>([]);
  const [cambios, setCambios] = useState<CambioDeEstado[]>([]);
  const [error, setError] = useState<string | null>(null);
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
        [...historial].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)),
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

  const foto = reporte?.fotos.find((item) => item.esPrincipal)?.url;
  const originales = reporte ? reportesParaDuplicar(catalogo, reporte.id) : [];
  const gestionable = reporte ? puedeGestionar(reporte) : false;

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />
      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === "web" ? 48 : insets.top + 16 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la bandeja"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <View style={styles.volverFila}>
            <Ionicons
              name="arrow-back"
              size={20}
              color={Paleta.paperRaised}
            />
            <Text style={styles.volver}>Bandeja</Text>
          </View>
        </Pressable>
        <Text style={styles.titulo} numberOfLines={1}>
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

      <ScrollView
        contentContainerStyle={[
          styles.contenido,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {error || !reporte ? (
          <Text style={styles.vacio}>{error ?? "Cargando…"}</Text>
        ) : (
          <>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.foto} />
            ) : null}

            <View style={styles.panelPrincipal}>
              <View
                style={[
                  styles.barraEstado,
                  { backgroundColor: COLORES_ESTADO[reporte.estado] },
                ]}
              />
              <View style={styles.filaTipo}>
                <IconoCategoria
                  tipoId={reporte.tipoId}
                  size={24}
                  color={obtenerCategoriaVisual(reporte.tipoId)?.color}
                />
                <Text style={styles.tipo}>
                  {`${nombreTipo(reporte.tipoId)} · ${reporte.direccion}`}
                </Text>
              </View>
              <Text style={styles.meta}>
                {`${nombreZona(reporte.zonaId)} · ${haceTiempo(reporte.creadoEn)}`}
              </Text>
              <Text style={styles.meta}>
                {`${nombreAutor(reporte.autorId)} · ${textoFotos(reporte.fotos.length)}`}
              </Text>
              {reporte.cuadrillaId ? (
                <Text style={styles.meta}>{nombreCuadrilla(reporte.cuadrillaId)}</Text>
              ) : null}
              {reporte.duplicadoDe ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={textoDuplicado(reporte.duplicadoDe)}
                  onPress={() => router.push(`/(operador)/reporte/${reporte.duplicadoDe}`)}
                >
                  <Text style={styles.enlaceOriginal}>
                    {textoDuplicado(reporte.duplicadoDe)}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {reporte.descripcion ? (
              <Text style={styles.descripcion}>{reporte.descripcion}</Text>
            ) : null}

            {reporte.fotoArreglo ? (
              <View style={styles.arreglo}>
                <Text style={styles.historialTitulo}>Foto del arreglo</Text>
                <Image source={{ uri: reporte.fotoArreglo.url }} style={styles.foto} />
              </View>
            ) : null}

            {gestionable ? (
              <View style={styles.acciones}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Cambiar estado de ${reporte.codigo}`}
                  onPress={() => {
                    setErrorEstado(null);
                    setMostrarEstado(true);
                  }}
                  style={({ pressed }) => [
                    styles.botonSecundario,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.botonSecundarioTexto}>Cambiar estado</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Marcar duplicado ${reporte.codigo}`}
                  onPress={() => {
                    setErrorDuplicado(null);
                    setMostrarDuplicado(true);
                  }}
                  style={({ pressed }) => [
                    styles.botonSecundario,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.botonSecundarioTexto}>Marcar duplicado</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Corregir zona de ${reporte.codigo}`}
                  onPress={() => {
                    setErrorZona(null);
                    setMostrarZona(true);
                  }}
                  style={({ pressed }) => [
                    styles.botonSecundario,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.botonSecundarioTexto}>Corregir zona</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Asignar ${reporte.codigo}`}
                  onPress={() => {
                    setErrorAsignar(null);
                    setMostrarAsignar(true);
                  }}
                  style={({ pressed }) => [
                    styles.botonAsignar,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.botonAsignarTexto}>Asignar</Text>
                </Pressable>
              </View>
            ) : null}

            {cambios.length > 0 ? (
              <View style={styles.historial}>
                <Text style={styles.historialTitulo}>
                  Historial de avance del reporte
                </Text>
                <View style={styles.listaHistorial}>
                  {cambios.map((cambio, index) => {
                    const esActual = index === cambios.length - 1;
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
                              {etiquetaEstado(cambio.estado)}
                            </Text>
                            <Text style={styles.cambioFecha}>
                              {haceTiempo(cambio.fechaHora)}
                            </Text>
                          </View>
                          {cambio.comentario ? (
                            <Text style={styles.cambioTexto}>{cambio.comentario}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

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
  pantalla: { flex: 1, backgroundColor: Paleta.paper },
  cabecera: {
    backgroundColor: PaletaOperador.principal,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
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
  },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    color: Paleta.paperRaised,
  },
  contenido: {
    padding: 20,
    gap: 10,
  },
  panelPrincipal: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: Paleta.paperRaised,
    borderColor: Paleta.line,
    borderWidth: 1,
    borderRadius: 18,
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
  filaTipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vacio: {
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  foto: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: Paleta.paperRaised,
  },
  tipo: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    color: Paleta.ink,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  enlaceOriginal: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: PaletaOperador.principal,
  },
  descripcion: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Paleta.ink,
  },
  arreglo: {
    gap: 8,
  },
  acciones: {
    marginTop: 8,
    gap: 8,
  },
  botonSecundario: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PaletaOperador.principal,
    alignItems: "center",
    justifyContent: "center",
  },
  botonSecundarioTexto: {
    fontFamily: Fonts.semiBold,
    color: PaletaOperador.principal,
    fontSize: 15,
  },
  botonAsignar: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: PaletaOperador.principal,
    alignItems: "center",
    justifyContent: "center",
  },
  botonAsignarTexto: {
    fontFamily: Fonts.semiBold,
    color: Paleta.paperRaised,
    fontSize: 15,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.88,
  },
  historial: {
    gap: 10,
    marginTop: 4,
  },
  historialTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
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
});
