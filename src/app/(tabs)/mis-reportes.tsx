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

import { Boton } from '@/components/ui/boton';
import { Paleta, fondoSuave } from '@/constants/theme';
import { useSesion } from '@/contexto/sesion';
import { haceTiempo, nombreTipo } from '@/servicios/bandeja';
import { etiquetaEstado, obtenerMisReportes } from '@/servicios/reportes';
import { EstadoReporte, Reporte } from '@/tipos';

const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: Paleta.amarillo,
  en_revision: Paleta.azul,
  asignado: Paleta.orange,
  resuelto: Paleta.verde,
  rechazado: Paleta.rojo,
};

interface TarjetaReporteProps {
  reporte: Reporte;
  onPress: () => void;
}

function TarjetaReporte({ reporte, onPress }: TarjetaReporteProps) {
  const colorEstado = COLORES_ESTADO[reporte.estado] ?? Paleta.inkSoft;
  const tituloTipo = nombreTipo(reporte.tipoId);

  return (
    <Pressable
      style={({ pressed }) => [styles.tarjeta, pressed && styles.tarjetaPresionada]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reclamo de ${tituloTipo}, estado ${etiquetaEstado(reporte.estado)}`}
    >

      <View style={[styles.barraLateral, { backgroundColor: colorEstado }]} />
      
      <View style={styles.tarjetaContenido}>
        <View style={styles.cuerpoTexto}>
          <Text style={styles.tipoTitulo} numberOfLines={1}>
            {tituloTipo}
          </Text>
          <Text style={styles.direccion} numberOfLines={1}>
            {reporte.direccion}
          </Text>
          <Text style={styles.antiguedad}>
            {haceTiempo(reporte.creadoEn)}
          </Text>
        </View>

        <View style={styles.tarjetaDerecha}>
          <View style={[styles.insigniaEstado, { backgroundColor: fondoSuave(colorEstado) }]}>
            <Text style={[styles.textoInsigniaEstado, { color: colorEstado }]}>
              {etiquetaEstado(reporte.estado)}
            </Text>
          </View>
          <Text style={styles.flechaDetalle}>›</Text>
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
  const [cargando, setCargando] = useState<boolean>(true);
  const [recargando, setRecargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async (esRecarga = false) => {
    if (!autorId) {
      setReportes([]);
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
      const data = await obtenerMisReportes(autorId);
      setReportes(data);
    } catch {
      setError('No pudimos cargar tus reclamos. Verificá la conexión y volvé a intentar.');
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
        <Text style={styles.cabeceraTitulo}>Mis reportes</Text>
        {!cargando && !error && (
          <Text style={styles.cabeceraSubtitulo}>{resumenReclamos}</Text>
        )}
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
          data={reportes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaReporte reporte={item} onPress={() => irAlDetalle(item.id)} />
          )}
          contentContainerStyle={[
            styles.listaContenido,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
            reportes.length === 0 && styles.listaVacia,
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
    paddingBottom: 20,
    gap: 4,
  },
  cabeceraTitulo: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 26,
    fontWeight: '600',
    color: Paleta.paperRaised,
  },
  cabeceraSubtitulo: {
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
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  tituloError: {
    fontSize: 18,
    fontWeight: '700',
    color: Paleta.rojo,
    marginBottom: 4,
  },
  textoError: {
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
    padding: 16,
    gap: 12,
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  tarjeta: {
    backgroundColor: Paleta.paperRaised,
    borderRadius: 14,
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
  tipoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Paleta.ink,
  },
  direccion: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  antiguedad: {
    fontSize: 12,
    color: Paleta.inkSoft,
    marginTop: 2,
  },
  tarjetaDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insigniaEstado: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  textoInsigniaEstado: {
    fontSize: 12,
    fontWeight: '700',
  },
  flechaDetalle: {
    fontSize: 20,
    fontWeight: '600',
    color: Paleta.inkSoft,
  },
  vacioCaja: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  vacioTitulo: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 20,
    fontWeight: '600',
    color: Paleta.ink,
    marginBottom: 8,
  },
  vacioSubtitulo: {
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