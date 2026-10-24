import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

import { SheetAsignar } from "@/components/operador/sheet-asignar";
import { SheetDuplicado } from "@/components/operador/sheet-duplicado";
import { SheetEstado } from "@/components/operador/sheet-estado";
import { SheetZona } from "@/components/operador/sheet-zona";
import { Boton } from "@/components/ui/boton";
import Cargando from "@/components/ui/cargando";
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

function textoAdhesiones(cantidad: number) {
  if (cantidad === 1) {
    return "1 vecino se sumó";
  }
  return `${cantidad} vecinos se sumaron`;
}

function fechaHistorial(fechaHora: string) {
  const fecha = new Date(fechaHora);
  if (Number.isNaN(fecha.getTime())) {
    return fechaHora;
  }
  const dia = fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const hora = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${dia}, ${hora}`;
}

const FONDO_ESTADO: Record<EstadoReporte, string> = {
  recibido: "#FFF6DC",
  en_revision: "#E5F0FA",
  asignado: "#FFF0E4",
  resuelto: "#E6F5E9",
  rechazado: "#FCE9E9",
};

const TEXTO_ESTADO: Record<EstadoReporte, string> = {
  recibido: "#785500",
  en_revision: "#245C85",
  asignado: "#9D4308",
  resuelto: "#226D3A",
  rechazado: "#A32E2E",
};

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
  const [mostrarQr, setMostrarQr] = useState(false);
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
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {fotoOriginal ? (
            <Image
              accessibilityLabel="Foto del problema"
              source={{ uri: fotoOriginal }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroVacio]} />
          )}
          <View
            style={[
              styles.heroBar,
              { paddingTop: Platform.OS === "web" ? 20 : insets.top + 8 },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver a la lista de reclamos"
              hitSlop={8}
              onPress={() => {
                impactoLigero();
                router.back();
              }}
              style={styles.botonHero}
            >
              <Ionicons color={Paleta.ink} name="arrow-back" size={22} />
            </Pressable>
            <View style={styles.heroAcciones}>
              {reporte ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Compartir reclamo"
                  hitSlop={8}
                  onPress={() => {
                    impactoLigero();
                    void Share.share({
                      message: `${nombreTipo(reporte.tipoId)} · ${reporte.codigo}\n${reporte.direccion}`,
                    });
                  }}
                  style={styles.botonHero}
                >
                  <Ionicons color={Paleta.ink} name="share-social-outline" size={20} />
                </Pressable>
              ) : null}
              {reporte?.codigo ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Código QR del reclamo ${reporte.codigo}`}
                  accessibilityState={{ selected: mostrarQr }}
                  hitSlop={8}
                  onPress={() => {
                    impactoLigero();
                    setMostrarQr((visible) => !visible);
                  }}
                  style={styles.botonHero}
                >
                  <Ionicons color={Paleta.ink} name="qr-code-outline" size={20} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cuerpo}>
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
              <View style={styles.filaEstado}>
                <View
                  style={[
                    styles.estado,
                    {
                      backgroundColor: reporte.sincronizado
                        ? FONDO_ESTADO[reporte.estado]
                        : "#EEF1F4",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.punto,
                      {
                        backgroundColor: reporte.sincronizado
                          ? COLORES_ESTADO[reporte.estado]
                          : Paleta.inkSoft,
                      },
                    ]}
                  />
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.estadoTexto,
                      {
                        color: reporte.sincronizado
                          ? TEXTO_ESTADO[reporte.estado]
                          : Paleta.inkSoft,
                      },
                    ]}
                  >
                    {etiquetaParaVecino(reporte)}
                  </Text>
                </View>
                <Text style={styles.codigo} numberOfLines={1}>
                  {reporte.codigo}
                </Text>
              </View>
              <Text style={styles.tipo}>{nombreTipo(reporte.tipoId)}</Text>
              <View style={styles.filaDato}>
                <Ionicons name="location-outline" size={16} color={Paleta.inkSoft} />
                <Text style={styles.direccion}>{reporte.direccion}</Text>
              </View>
              <View style={styles.filaDato}>
                <Ionicons name="time-outline" size={16} color={Paleta.inkSoft} />
                <Text style={styles.meta}>{`Reportado ${haceTiempo(reporte.creadoEn)}`}</Text>
              </View>
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

            {mostrarQr ? (
              <View style={styles.qrPanel} accessibilityLabel={`Código QR del reclamo ${reporte.codigo}`}>
                <QRCode
                  backgroundColor={Paleta.paperRaised}
                  color={Paleta.ink}
                  size={160}
                  value={reporte.codigo}
                />
                <Text style={styles.codigo}>{reporte.codigo}</Text>
              </View>
            ) : null}

            {reporte.descripcion ? (
              <View style={styles.bloque}>
                <Text style={styles.tituloSeccion}>Descripción</Text>
                <Text style={styles.descripcion}>{reporte.descripcion}</Text>
              </View>
            ) : null}

            <View style={styles.bloque}>
              <View style={styles.filaAdhesion}>
                <View style={styles.iconoAdhesion}>
                  <Ionicons name="people-outline" size={18} color={Paleta.tealDeep} />
                </View>
                <View style={styles.datoTexto}>
                  <Text style={styles.adhesiones}>
                    {textoAdhesiones(reporte.adhesiones)}
                  </Text>
                  {adhesionesDelReporte(reporte.id).length > 0 ? (
                    <Text style={styles.vecinosSumados}>
                      {adhesionesDelReporte(reporte.id)
                        .map((item) => nombreAutor(item.usuarioId))
                        .join(", ")}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {reporte.estado === "resuelto" && reporte.fotoArreglo ? (
              <View style={styles.bloque}>
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

            <View style={styles.bloque}>
              <Text style={styles.tituloSeccion}>Historial</Text>
              {historial.length > 0 ? (
                <View style={styles.listaHistorial}>
                  {historial.map((cambio) => (
                    <View key={cambio.id} style={styles.itemHistorial}>
                      <View style={styles.filaHistorial}>
                        <View
                          style={[
                            styles.punto,
                            { backgroundColor: COLORES_ESTADO[cambio.estado] },
                          ]}
                        />
                        <Text style={styles.cambioEstado}>
                          {etiquetaEstado(cambio.estado)}
                        </Text>
                        <Text style={styles.cambioFecha}>
                          {fechaHistorial(cambio.fechaHora)}
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
        </View>
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
  hero: {
    height: 240,
    backgroundColor: "#3F4A57",
  },
  heroVacio: {
    backgroundColor: "#3F4A57",
  },
  heroBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  heroAcciones: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botonHero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  cuerpo: {
    marginTop: -28,
    paddingHorizontal: 16,
    gap: 12,
  },
  panelPrincipal: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  filaEstado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  estado: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 6,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoTexto: {
    flexShrink: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  codigo: {
    flexShrink: 0,
    fontFamily: Fonts.medium,
    color: Paleta.inkSoft,
    fontSize: 13,
  },
  tipo: {
    fontFamily: Fonts.bold,
    color: Paleta.ink,
    fontSize: 28,
  },
  direccion: {
    flex: 1,
    fontFamily: Fonts.medium,
    color: Paleta.inkSoft,
    fontSize: 15,
  },
  filaDato: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  datoTexto: {
    flex: 1,
    gap: 2,
  },
  adhesiones: {
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
    fontSize: 15,
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
  bloque: {
    backgroundColor: Paleta.paperRaised,
    borderColor: Paleta.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  filaAdhesion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconoAdhesion: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Paleta.tealSoft,
  },
  qrPanel: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 12,
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
  },
  listaHistorial: {
    gap: 12,
  },
  itemHistorial: {
    gap: 4,
  },
  filaHistorial: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cambioEstado: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
    fontSize: 15,
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