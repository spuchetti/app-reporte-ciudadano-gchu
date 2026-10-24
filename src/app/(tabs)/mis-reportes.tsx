import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';

import { Boton } from '@/components/ui/boton';
import { IconoCategoria } from '@/components/ui/icono-categoria';
import {
  CATEGORIA_POR_DEFECTO,
  obtenerCategoriaVisual,
} from '@/constants/categorias';
import { fondoSuave, Fonts, Paleta } from '@/constants/theme';
import { useSesion } from '@/contexto/sesion';
import { useOrigenReporte } from '@/contexto/origen-reporte';
import { nombreTipo } from '@/servicios/bandeja';
import {
  etiquetaEstado,
  etiquetaParaVecino,
  obtenerMisReportes,
  obtenerReportesAdheridos,
  sincronizarPendientes,
} from '@/servicios/reportes';
import { COLORES_ESTADO } from '@/servicios/mapa';
import { EstadoReporte, Reporte } from '@/tipos';

type Pestana = 'propios' | 'sumados';

const TEXTO_ESTADO: Record<EstadoReporte, string> = {
  recibido: '#785500',
  en_revision: '#245C85',
  asignado: '#9D4308',
  resuelto: '#226D3A',
  rechazado: '#A32E2E',
};

const AVANCE_ESTADO: Record<EstadoReporte, number> = {
  recibido: 0.28,
  en_revision: 0.55,
  asignado: 0.78,
  resuelto: 1,
  rechazado: 0.18,
};

function fechaCorta(iso: string) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return iso;
  }
  const hora = fecha.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dias = Math.round((inicioHoy.getTime() - inicioFecha.getTime()) / 86_400_000);
  if (dias === 0) {
    return `Hoy, ${hora}`;
  }
  if (dias === 1) {
    return `Ayer, ${hora}`;
  }
  const dia = fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  return `${dia}, ${hora}`;
}

function textoPendientes(cantidad: number) {
  if (cantidad === 1) {
    return '1 reporte espera conexión para enviarse';
  }
  return `${cantidad} reportes esperan conexión para enviarse`;
}

interface TarjetaReporteProps {
  reporte: Reporte;
  onPress: () => void;
}

function TarjetaReporte({ reporte, onPress }: TarjetaReporteProps) {
  const pendiente = !reporte.sincronizado;
  const colorEstado = COLORES_ESTADO[reporte.estado] ?? Paleta.inkSoft;
  const categoria = obtenerCategoriaVisual(reporte.tipoId) ?? CATEGORIA_POR_DEFECTO;
  const tipo = nombreTipo(reporte.tipoId);
  const estado = etiquetaEstado(reporte.estado);
  const avance = AVANCE_ESTADO[reporte.estado] ?? 0.28;

  return (
    <Pressable
      style={({ pressed }) => [styles.tarjeta, pressed && styles.tarjetaPresionada]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reclamo ${reporte.codigo}, ${tipo}, estado ${etiquetaParaVecino(reporte)}`}
    >
      <View style={styles.tarjetaCuerpo}>
        <View
          style={[styles.iconoTipo, { backgroundColor: fondoSuave(categoria.color) }]}
        >
          <IconoCategoria tipoId={reporte.tipoId} size={24} />
        </View>
        <View style={styles.cuerpoTexto}>
          <View style={styles.filaTitulo}>
            <View style={styles.titulos}>
              <Text style={styles.tipoTitulo} numberOfLines={1}>
                {tipo}
              </Text>
              <Text style={styles.direccion} numberOfLines={1}>
                {reporte.direccion}
              </Text>
            </View>
            <View style={styles.estado}>
              <View style={[styles.punto, { backgroundColor: colorEstado }]} />
              <Text style={[styles.estadoTexto, { color: TEXTO_ESTADO[reporte.estado] }]}>
                {estado}
              </Text>
            </View>
          </View>
          <View style={styles.pista}>
            <View
              style={[
                styles.avance,
                { width: `${Math.round(avance * 100)}%`, backgroundColor: colorEstado },
              ]}
            />
          </View>
          <View style={styles.metaFila}>
            <Ionicons name="time-outline" size={14} color={Paleta.inkSoft} />
            <Text style={styles.antiguedad}>{fechaCorta(reporte.creadoEn)}</Text>
            {pendiente ? (
              <>
                <Ionicons name="cloud-offline-outline" size={14} color="#9A6700" />
                <Text style={styles.sinEnviar}>Sin enviar</Text>
              </>
            ) : null}
            <View style={styles.metaEspacio} />
            <Ionicons name="chevron-forward" size={18} color={Paleta.inkSoft} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function MisReportesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sesion } = useSesion();
  const { establecerOrigen } = useOrigenReporte();

  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
  const autorId = usuario?.id ?? null;

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [adheridos, setAdheridos] = useState<Reporte[]>([]);
  const [pestana, setPestana] = useState<Pestana>('propios');
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
      establecerOrigen('mis-reportes');
      cargarDatos();
    }, [cargarDatos, establecerOrigen])
  );

  const lista = pestana === 'propios' ? reportes : adheridos;
  const pendientes = reportes.filter((reporte) => !reporte.sincronizado).length;

  const irAlDetalle = (id: Reporte['id']) => {
    router.push(`/reclamo/${id}`);
  };

  return (
    <View style={styles.pantalla}>
      <StatusBar style="dark" />

      <View
        style={[
          styles.cabecera,
          { paddingTop: Platform.OS === 'web' ? 28 : insets.top + 12 },
        ]}
      >
        <Text style={styles.cabeceraTitulo}>Mis reportes</Text>
      </View>

      <View style={styles.segmento}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: pestana === 'propios' }}
          onPress={() => setPestana('propios')}
          style={[styles.segmentoItem, pestana === 'propios' && styles.segmentoActivo]}
        >
          <Text style={[styles.segmentoTexto, pestana === 'propios' && styles.segmentoTextoActivo]}>
            Tus reportes
          </Text>
          <View style={[styles.cuenta, pestana === 'propios' && styles.cuentaActiva]}>
            <Text
              style={[
                styles.cuentaTexto,
                pestana === 'propios' && styles.cuentaTextoActiva,
              ]}
            >
              {reportes.length}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: pestana === 'sumados' }}
          onPress={() => setPestana('sumados')}
          style={[styles.segmentoItem, pestana === 'sumados' && styles.segmentoActivo]}
        >
          <Text style={[styles.segmentoTexto, pestana === 'sumados' && styles.segmentoTextoActivo]}>
            Te sumaste
          </Text>
          <View style={[styles.cuenta, pestana === 'sumados' && styles.cuentaActiva]}>
            <Text
              style={[
                styles.cuentaTexto,
                pestana === 'sumados' && styles.cuentaTextoActiva,
              ]}
            >
              {adheridos.length}
            </Text>
          </View>
        </Pressable>
      </View>

      {pendientes > 0 && pestana === 'propios' && !cargando && !error ? (
        <View style={styles.aviso}>
          <Ionicons name="warning-outline" size={18} color="#9A6700" />
          <Text style={styles.avisoTexto}>{textoPendientes(pendientes)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar envío"
            onPress={() => cargarDatos(true)}
            hitSlop={8}
          >
            <Text style={styles.reintentar}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

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
          data={lista}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TarjetaReporte
              reporte={item}
              onPress={() => irAlDetalle(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listaContenido,
            { paddingBottom: lista.length === 0 ? 112 : 24 },
            lista.length === 0 && styles.listaVacia,
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
            pestana === 'sumados' && usuario ? (
              <View style={styles.vacioCaja}>
                <View style={styles.vacioIcono}>
                  <Ionicons name="people-outline" size={28} color={Paleta.tealDeep} />
                </View>
                <Text style={styles.vacioTitulo}>Todavía no te sumaste</Text>
                <Text style={styles.vacioSubtitulo}>
                  Cuando te sumes a un reclamo de otro vecino, va a aparecer en esta lista.
                </Text>
                <View style={styles.pasos}>
                  {[
                    'Abrí el mapa y tocá un reclamo',
                    'Revisá que sea el mismo problema',
                    'Tocá “Sumarme a este reclamo”',
                  ].map((texto, indice) => (
                    <View key={texto} style={styles.paso}>
                      <View style={styles.pasoNumero}>
                        <Text style={styles.pasoNumeroTexto}>{indice + 1}</Text>
                      </View>
                      <Text style={styles.pasoTexto}>{texto}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.vacioCaja}>
                <Text style={styles.vacioTitulo}>
                  {!usuario
                    ? 'Identificate para ver tus reportes'
                    : 'No tenés reclamos cargados'}
                </Text>
                <Text style={styles.vacioSubtitulo}>
                  {!usuario
                    ? 'Con tu email y teléfono podés seguir el avance de lo que reportás.'
                    : 'Los reclamos que cargues van a aparecer acá para que sigas el avance del trabajo.'}
                </Text>
                <View style={styles.botonVacioCaja}>
                  <Boton
                    titulo={!usuario ? 'Identificarme' : 'Reportar problema'}
                    onPress={() =>
                      router.push(!usuario ? '/register' : '/reporte/nuevo')
                    }
                  />
                </View>
              </View>
            )
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
    backgroundColor: Paleta.paper,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  cabeceraTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Paleta.ink,
  },
  segmento: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#E7EDF2',
  },
  segmentoItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  segmentoActivo: {
    backgroundColor: Paleta.paperRaised,
    shadowColor: Paleta.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentoTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
  segmentoTextoActivo: {
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
  },
  cuenta: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDE3E8',
  },
  cuentaActiva: {
    backgroundColor: Paleta.tealSoft,
  },
  cuentaTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  cuentaTextoActiva: {
    color: Paleta.tealDeep,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFF6DC',
  },
  avisoTexto: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#7A5B00',
  },
  reintentar: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.ink,
    textDecorationLine: 'underline',
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
    padding: 16,
    gap: 12,
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
  tarjetaCuerpo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  iconoTipo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpoTexto: {
    flex: 1,
    gap: 8,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  titulos: {
    flex: 1,
    gap: 2,
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
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estadoTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  pista: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E7EDF2',
    overflow: 'hidden',
  },
  avance: {
    height: 4,
    borderRadius: 999,
  },
  metaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  antiguedad: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  sinEnviar: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: '#9A6700',
  },
  metaEspacio: {
    flex: 1,
  },
  vacioCaja: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 28,
  },
  vacioIcono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Paleta.tealSoft,
    marginBottom: 16,
  },
  vacioTitulo: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Paleta.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  vacioSubtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Paleta.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  pasos: {
    alignSelf: 'stretch',
    marginTop: 28,
    backgroundColor: Paleta.paperRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Paleta.line,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 4,
  },
  paso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  pasoNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Paleta.tealSoft,
  },
  pasoNumeroTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Paleta.tealDeep,
  },
  pasoTexto: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Paleta.ink,
    lineHeight: 20,
  },
  botonVacioCaja: {
    marginTop: 20,
    width: 220,
  },
});
