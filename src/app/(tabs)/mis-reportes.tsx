import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import IconoPrincipal from '@/assets/branding/icono_principal.svg';
import { Boton } from '@/components/ui/boton';
import { InsigniaEstado } from '@/components/ui/insignia-estado';
import { Fonts, Paleta } from '@/constants/theme';
import { useSesion } from '@/contexto/sesion';
import { haceTiempo, nombreTipo } from '@/servicios/bandeja';
import {
  etiquetaParaVecino,
  obtenerMisReportes,
  obtenerReportesAdheridos,
  sincronizarPendientes,
} from '@/servicios/reportes';
import { COLORES_ESTADO } from '@/servicios/mapa';
import { Reporte } from '@/tipos';

interface TarjetaReporteProps {
  reporte: Reporte;
  sumado?: boolean;
  onPress: () => void;
}

function TarjetaReporte({ reporte, sumado = false, onPress }: TarjetaReporteProps) {
  const pendiente = !reporte.sincronizado;
  const colorEstado = pendiente
    ? Paleta.inkSoft
    : COLORES_ESTADO[reporte.estado] ?? Paleta.inkSoft;
  const tituloTipo = nombreTipo(reporte.tipoId);
  const estado = etiquetaParaVecino(reporte);

  return (
    <Pressable
      style={({ pressed }) => [styles.tarjeta, pressed && styles.tarjetaPresionada]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reclamo ${reporte.codigo}, estado ${estado}`}
    >

      <View style={[styles.barraLateral, { backgroundColor: colorEstado }]} />
      
      <View style={styles.tarjetaContenido}>
        <View style={styles.cuerpoTexto}>
          <Text style={styles.codigo} numberOfLines={1}>
            {reporte.codigo}
          </Text>
          <Text style={styles.tipoTitulo} numberOfLines={1}>
            {tituloTipo}
          </Text>
          <Text style={styles.direccion} numberOfLines={1}>
            {reporte.direccion}
          </Text>
          {sumado ? <Text style={styles.sumado}>Te sumaste</Text> : null}
          <Text style={styles.antiguedad}>
            {haceTiempo(reporte.creadoEn)}
          </Text>
        </View>

        <View style={styles.tarjetaDerecha}>
          <InsigniaEstado
            estado={reporte.estado}
            etiqueta={estado}
            colorOverride={pendiente ? Paleta.inkSoft : undefined}
            maxWidth={118}
            lineas={3}
          />
          <Ionicons name="chevron-forward" size={20} color={Paleta.inkSoft} />
        </View>
      </View>

    </Pressable>
  );
}

export default function MisReportesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sesion } = useSesion();

  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
  const autorId = usuario?.id ?? null;

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [adheridos, setAdheridos] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [recargando, setRecargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async (esRecarga = false) => {
    if (!autorId) {
      setReportes([]);
      setAdheridos([]);
      setCargando(false);
      return;
    }

    if (esRecarga) {
      setRecargando(true);
    } else {
      setCargando(true);
    }
    setError(null);

    try {
      if (esRecarga) {
        await sincronizarPendientes();
      }
      const [data, sumados] = await Promise.all([
        obtenerMisReportes(autorId),
        obtenerReportesAdheridos(autorId),
      ]);
      setReportes(data);
      setAdheridos(sumados);
    } catch {
      setError('No pudimos cargar tus reclamos. Verificá la conexión y volvé a intentar.');
      setAdheridos([]);
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, [autorId]);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const resumenReclamos = useMemo(() => {
    const total = reportes.length;
    const enCurso = reportes.filter(
      (r) => r.estado === 'recibido' || r.estado === 'en_revision' || r.estado === 'asignado'
    ).length;

    const textoTotal = total === 1 ? '1 reclamo' : `${total} reclamos`;
    return `${textoTotal} · ${enCurso} en curso`;
  }, [reportes]);

  const filas = useMemo(() => {
    const entradas: (
      | { clave: string; titulo: string }
      | { clave: string; reporte: Reporte; sumado: boolean }
    )[] = [];
    if (reportes.length > 0) {
      entradas.push({ clave: "titulo-propios", titulo: "Tus reclamos" });
      for (const reporte of reportes) {
        entradas.push({ clave: reporte.id, reporte, sumado: false });
      }
    }
    if (adheridos.length > 0) {
      entradas.push({ clave: "titulo-adheridos", titulo: "Te sumaste" });
      for (const reporte of adheridos) {
        entradas.push({ clave: `adh-${reporte.id}`, reporte, sumado: true });
      }
    }
    return entradas;
  }, [adheridos, reportes]);

  const irAlDetalle = (id: Reporte['id']) => {
    router.push(`/reclamo/${id}`);
  };

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />

      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === 'web' ? 88 : insets.top + 16 },
        ]}
      >
        <IconoPrincipal
          width={40}
          height={40}
          accessibilityLabel="Reporte Ciudadano"
        />
        <View style={styles.cabeceraTexto}>
          <Text style={styles.cabeceraTitulo}>Mis reportes</Text>
          {!cargando && !error && (
            <Text style={styles.cabeceraSubtitulo}>{resumenReclamos}</Text>
          )}
        </View>
      </View>

      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={Paleta.teal} />
          <Text style={styles.textoCarga}>Cargando tus reportes…</Text>
        </View>
      ) : error ? (
        <View style={styles.centrado}>
          <Text style={styles.tituloError}>Aviso</Text>
          <Text style={styles.textoError}>{error}</Text>
          <View style={styles.botonErrorCaja}>
            <Boton titulo="Reintentar" onPress={() => cargarDatos()} />
          </View>
        </View>
      ) : (
        <FlatList
          data={filas}
          keyExtractor={(item) => item.clave}
          renderItem={({ item }) =>
            "titulo" in item ? (
              <Text style={styles.seccion}>{item.titulo}</Text>
            ) : (
              <TarjetaReporte
                reporte={item.reporte}
                sumado={item.sumado}
                onPress={() => irAlDetalle(item.reporte.id)}
              />
            )
          }
          contentContainerStyle={[
            styles.listaContenido,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
            filas.length === 0 && styles.listaVacia,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={recargando}
              onRefresh={() => cargarDatos(true)}
              colors={[Paleta.teal]}
              tintColor={Paleta.teal}
            />
          }
          ListEmptyComponent={
            <View style={styles.vacioCaja}>
              <Text style={styles.vacioTitulo}>No tenés reclamos cargados</Text>
              <Text style={styles.vacioSubtitulo}>
                Los reclamos que cargues van a aparecer acá para que sigas el avance del trabajo.
              </Text>
              <View style={styles.botonVacioCaja}>
                <Boton
                  titulo="Reportar problema"
                  onPress={() => router.push('/reporte/nuevo')}
                />
              </View>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cabeceraTexto: {
    flex: 1,
    gap: 4,
  },
  cabeceraTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 24,
    color: Paleta.paperRaised,
  },
  cabeceraSubtitulo: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Paleta.paperRaised,
    opacity: 0.85,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  textoCarga: {
    marginTop: 12,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  tituloError: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.rojo,
    marginBottom: 4,
  },
  textoError: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.rojo,
    textAlign: 'center',
    lineHeight: 20,
  },
  botonErrorCaja: {
    marginTop: 16,
    width: 140,
  },
  listaContenido: {
    padding: 20,
    gap: 14,
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  tarjeta: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Paleta.line,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Paleta.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tarjetaPresionada: {
    opacity: 0.88,
  },
  barraLateral: {
    width: 5,
    alignSelf: 'stretch',
  },
  tarjetaContenido: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  cuerpoTexto: {
    flex: 1,
    gap: 2,
  },
  codigo: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: Paleta.tealDeep,
  },
  tipoTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Paleta.ink,
  },
  direccion: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  sumado: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Paleta.teal,
  },
  seccion: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.inkSoft,
    marginTop: 4,
  },
  antiguedad: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
    marginTop: 2,
  },
  tarjetaDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vacioCaja: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  vacioTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    fontWeight: '600',
    color: Paleta.ink,
    marginBottom: 8,
  },
  vacioSubtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  botonVacioCaja: {
    marginTop: 20,
    width: 200,
  },
});