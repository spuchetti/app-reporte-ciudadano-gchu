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
import { BotonTema } from "@/components/ui/boton-tema";
import { IconoCategoria } from "@/components/ui/icono-categoria";
import { LogoMarca } from "@/components/ui/logo-marca";
import { Fonts } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
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

/** Home público solo web (columna; sin overlays absolutos). */
export default function MapaPublicoWebScreen() {
  const tema = useTheme();
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
    <View style={[styles.pantalla, { backgroundColor: tema.paper }]}>
      <StatusBar style={tema.esOscuro ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contenedor}>
          <View
            style={[
              styles.cabecera,
              {
                backgroundColor: tema.surface,
                borderColor: tema.outline,
              },
            ]}
          >
            <LogoMarca size={52} />
            <View style={styles.titulos}>
              <Text style={[styles.marca, { color: tema.tealDeep }]}>
                Reporte Ciudadano
              </Text>
              <Text style={[styles.titulo, { color: tema.onSurface }]}>
                Gualeguaychú
              </Text>
              <Text style={[styles.subtitulo, { color: tema.onSurfaceVariant }]}>
                Mirá los reportes de tu ciudad y generá uno nuevo
              </Text>
            </View>
            <BotonTema />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Acceso operadores"
              onPress={() => router.push("/login")}
              style={[styles.botonOperador, { backgroundColor: tema.tealSoft }]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={tema.tealDeep}
              />
              <Text style={[styles.botonOperadorTexto, { color: tema.tealDeep }]}>
                Operadores
              </Text>
            </Pressable>
          </View>

          {sesionVencida ? (
            <View style={[styles.aviso, { backgroundColor: tema.esOscuro ? "#3F1D1D" : "#FDECEC" }]}>
              <Text style={[styles.avisoTexto, { color: tema.error }]}>
                {MENSAJE_SESION_VENCIDA}
              </Text>
              <Pressable
                onPress={cerrarAvisoSesionVencida}
                accessibilityRole="button"
              >
                <Text style={[styles.avisoCerrar, { color: tema.onSurface }]}>
                  Cerrar
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={[styles.seccion, { color: tema.onSurfaceVariant }]}>
            Tipo de problema
          </Text>
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

          <Text
            style={[
              styles.seccion,
              styles.seccionEspacio,
              { color: tema.onSurfaceVariant },
            ]}
          >
            Estado
          </Text>
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

          <View
            style={[
              styles.mapaCaja,
              {
                minHeight: altoMapa,
                borderColor: tema.outline,
                backgroundColor: tema.tealSoft,
              },
            ]}
          >
            <MapView style={StyleSheet.absoluteFill} mensaje={mensajeMapa} />
            {sincronizandoRed ? (
              <Text
                style={[
                  styles.sync,
                  {
                    color: tema.onSurfaceVariant,
                    backgroundColor: tema.surface,
                  },
                ]}
              >
                Actualizando…
              </Text>
            ) : null}
          </View>

          <View style={styles.leyenda}>
            <Leyenda color={COLORES_ESTADO.recibido} texto="Nuevo" />
            <Leyenda color={COLORES_ESTADO.en_revision} texto="En curso" />
            <Leyenda color={COLORES_ESTADO.resuelto} texto="Resuelto" />
          </View>

          <View
            style={[
              styles.cta,
              {
                backgroundColor: tema.surface,
                borderColor: tema.outline,
              },
            ]}
          >
            <Text style={[styles.ctaTitulo, { color: tema.onSurface }]}>
              {pedirIdentidad ? "¿Sos vecino?" : "Reportá un problema"}
            </Text>
            <Text style={[styles.ctaCuerpo, { color: tema.onSurfaceVariant }]}>
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
                  style={[styles.secundario, { borderColor: tema.outline }]}
                >
                  <Text
                    style={[styles.secundarioTexto, { color: tema.onSurface }]}
                  >
                    No soy yo
                  </Text>
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
  const tema = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: activo ? tema.primary : tema.surface,
          borderColor: activo ? tema.primary : tema.outline,
        },
      ]}
    >
      {tipoId ? (
        <IconoCategoria
          tipoId={tipoId}
          size={16}
          color={activo ? tema.onPrimary : undefined}
        />
      ) : null}
      <Text
        style={[
          styles.chipTexto,
          { color: activo ? tema.onPrimary : tema.onSurface },
        ]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  const tema = useTheme();
  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.leyendaPunto, { backgroundColor: color }]} />
      <Text style={[styles.leyendaTexto, { color: tema.onSurfaceVariant }]}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
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
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexWrap: "wrap",
  },
  titulos: {
    flex: 1,
    minWidth: 180,
    gap: 2,
  },
  marca: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  titulo: {
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  botonOperador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 999,
  },
  botonOperadorTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  seccion: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
    borderWidth: 1,
  },
  chipTexto: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  mapaCaja: {
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  sync: {
    position: "absolute",
    top: 12,
    right: 12,
    fontFamily: Fonts.medium,
    fontSize: 12,
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
  },
  cta: {
    marginTop: 8,
    gap: 12,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  ctaTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
  },
  ctaCuerpo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  secundario: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secundarioTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  aviso: {
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  avisoCerrar: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
});
