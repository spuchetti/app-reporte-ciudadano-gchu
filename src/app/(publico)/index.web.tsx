import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { MapView } from "@/components/mapa";
import { Boton } from "@/components/ui/boton";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { LogoMarca } from "@/components/ui/logo-marca";
import { Fonts, Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { tiposReporteMock } from "@/mocks/reportes";
import { MENSAJE_SESION_VENCIDA } from "@/servicios/auth";
import {
  alActualizarColaReportes,
  alEstadoSincronizacionRed,
  obtenerReportes,
} from "@/servicios/reportes";
import {
  COLORES_ESTADO,
  FILTROS_ESTADO_PUBLICO,
  estadosDeFiltroPublico,
  filtrarReportesMapa,
  type FiltroEstadoPublico,
} from "@/servicios/mapa";
import { Reporte } from "@/tipos";

/** Home público en web: columna estática (sin overlays absolutos sobre el mapa). */
export default function MapaPublicoWebScreen() {
  const { height } = useWindowDimensions();
  const {
    sesionVencida,
    huboVecino,
    cerrarAvisoSesionVencida,
    olvidarDispositivo,
  } = useSesion();
  const pedirIdentidad = sesionVencida || huboVecino;
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPublico | null>(
    null,
  );
  const [sincronizandoRed, setSincronizandoRed] = useState(false);

  useEffect(() => {
    let activo = true;

    function cargarReportes() {
      obtenerReportes()
        .then((lista) => {
          if (activo) setReportes(lista);
        })
        .catch(() => undefined);
    }

    cargarReportes();
    const offCola = alActualizarColaReportes(cargarReportes);
    const offSync = alEstadoSincronizacionRed((activoSync) => {
      setSincronizandoRed(activoSync);
      if (!activoSync) cargarReportes();
    });

    return () => {
      activo = false;
      offCola();
      offSync();
    };
  }, []);

  const visibles = useMemo(
    () =>
      filtrarReportesMapa({
        reportes,
        tipoId,
        estados: estadosDeFiltroPublico(filtroEstado),
        origen: null,
        soloCerca: false,
      }),
    [filtroEstado, reportes, tipoId],
  );

  const mensajeMapa =
    visibles.length > 0
      ? `Hay ${visibles.length} reporte${visibles.length === 1 ? "" : "s"} con estos filtros.`
      : "Todavía no hay reportes con estos filtros.";

  const altoMapa = Math.min(420, Math.max(280, height * 0.42));

  return (
    <View style={styles.pantalla}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contenedor}>
          <View style={styles.cabecera}>
            <LogoMarca size={52} />
            <View style={styles.titulos}>
              <Text style={styles.marca}>Reporte Ciudadano</Text>
              <Text style={styles.titulo}>Gualeguaychú</Text>
              <Text style={styles.subtitulo}>
                Mirá los reportes de tu ciudad y generá uno nuevo
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Acceso operadores"
              onPress={() => router.push("/login")}
              style={styles.botonOperador}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={Paleta.tealDeep}
              />
              <Text style={styles.botonOperadorTexto}>Operadores</Text>
            </Pressable>
          </View>

          {sesionVencida ? (
            <View style={styles.aviso}>
              <Text style={styles.avisoTexto}>{MENSAJE_SESION_VENCIDA}</Text>
              <Pressable
                onPress={cerrarAvisoSesionVencida}
                accessibilityRole="button"
              >
                <Text style={styles.avisoCerrar}>Cerrar</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.seccion}>Tipo de problema</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <Chip
              etiqueta="Todos"
              activo={tipoId === null}
              onPress={() => setTipoId(null)}
            />
            {tiposReporteMock.map((tipo) => (
              <Chip
                key={tipo.id}
                etiqueta={tipo.nombre}
                tipoId={tipo.id}
                activo={tipoId === tipo.id}
                onPress={() => setTipoId(tipo.id)}
              />
            ))}
          </ScrollView>

          <Text style={[styles.seccion, styles.seccionEspacio]}>Estado</Text>
          <View style={styles.chipsWrap}>
            <Chip
              etiqueta="Todos"
              activo={filtroEstado === null}
              onPress={() => setFiltroEstado(null)}
            />
            {FILTROS_ESTADO_PUBLICO.map((item) => (
              <Chip
                key={item.id}
                etiqueta={item.etiqueta}
                activo={filtroEstado === item.id}
                onPress={() => setFiltroEstado(item.id)}
              />
            ))}
          </View>

          <View style={[styles.mapaCaja, { minHeight: altoMapa }]}>
            <MapView
              style={StyleSheet.absoluteFill}
              mensaje={mensajeMapa}
            />
            {sincronizandoRed ? (
              <Text style={styles.sync}>Actualizando…</Text>
            ) : null}
          </View>

          <View style={styles.leyenda}>
            <Leyenda color={COLORES_ESTADO.recibido} texto="Nuevo" />
            <Leyenda color={COLORES_ESTADO.en_revision} texto="En curso" />
            <Leyenda color={COLORES_ESTADO.resuelto} texto="Resuelto" />
          </View>

          <View style={styles.cta}>
            <Text style={styles.ctaTitulo}>
              {pedirIdentidad ? "¿Sos vecino?" : "Reportá un problema"}
            </Text>
            <Text style={styles.ctaCuerpo}>
              En el celular ves el mapa con calles y recibís avisos. Acá podés
              iniciar un reporte o entrar como operador.
            </Text>
            {pedirIdentidad ? (
              <>
                <Boton
                  titulo="Identificarme"
                  onPress={() => router.push("/register")}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void olvidarDispositivo();
                  }}
                  style={styles.secundario}
                >
                  <Text style={styles.secundarioTexto}>No soy yo</Text>
                </Pressable>
              </>
            ) : (
              <Boton
                titulo="Generar reporte"
                onPress={() => router.push("/reporte/nuevo")}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Chip({
  etiqueta,
  activo,
  onPress,
  tipoId,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  tipoId?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[styles.chip, activo ? styles.chipActivo : null]}
    >
      {tipoId ? (
        <IconoCategoria
          tipoId={tipoId}
          size={16}
          color={activo ? Paleta.paperRaised : undefined}
        />
      ) : null}
      <Text style={[styles.chipTexto, activo ? styles.chipTextoActivo : null]}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.leyendaPunto, { backgroundColor: color }]} />
      <Text style={styles.leyendaTexto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#F4FBF9",
  },
  scroll: {
    flexGrow: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  contenedor: {
    width: "100%",
    maxWidth: 720,
    gap: 14,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Paleta.line,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  titulos: {
    flex: 1,
    gap: 2,
  },
  marca: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: Paleta.tealDeep,
  },
  titulo: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: Paleta.ink,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    lineHeight: 20,
  },
  botonOperador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: Paleta.tealSoft,
  },
  botonOperadorTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.tealDeep,
  },
  seccion: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
    marginTop: 6,
  },
  seccionEspacio: {
    marginTop: 4,
  },
  chips: {
    gap: 10,
    paddingVertical: 2,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 40,
    backgroundColor: Paleta.paperRaised,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  chipActivo: {
    backgroundColor: Paleta.tealDeep,
    borderColor: Paleta.tealDeep,
  },
  chipTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.ink,
  },
  chipTextoActivo: {
    color: Paleta.paperRaised,
  },
  mapaCaja: {
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Paleta.line,
    backgroundColor: Paleta.tealSoft,
  },
  sync: {
    position: "absolute",
    top: 12,
    right: 12,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Paleta.inkSoft,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 4,
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  leyendaPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leyendaTexto: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  cta: {
    marginTop: 8,
    gap: 12,
    padding: 20,
    borderRadius: 24,
    backgroundColor: Paleta.paperRaised,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  ctaTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.ink,
  },
  ctaCuerpo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Paleta.inkSoft,
    marginBottom: 4,
  },
  secundario: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Paleta.line,
    alignItems: "center",
    justifyContent: "center",
  },
  secundarioTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Paleta.ink,
  },
  aviso: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FDECEC",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.rojo,
    lineHeight: 18,
  },
  avisoCerrar: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.ink,
  },
});
