import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { PasoConfirmacion } from "@/components/reporte/paso-confirmacion";
import { PasoDescripcion } from "@/components/reporte/paso-descripcion";
import { PasoFoto } from "@/components/reporte/paso-foto";
import { PasoTipo } from "@/components/reporte/paso-tipo";
import { PasoUbicacion } from "@/components/reporte/paso-ubicacion";
import { ProgresoReporte } from "@/components/reporte/progreso";
import { Boton } from "@/components/ui/boton";
import { Fonts } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
import {
  actualizarBorrador,
  borradorListoParaEnviar,
  leerBorrador,
  limpiarAdhesionPendiente,
  marcarAdhesionPendiente,
  marcarPendienteEnvio,
  PASOS_REPORTE,
} from "@/servicios/borrador";
import { esErrorServicio } from "@/servicios/error";
import { obtenerTiposReporte } from "@/servicios/reportes";
import {
  esDireccionAceptable,
  estaEnLaCiudad,
  MENSAJE_FUERA_DE_LA_CIUDAD,
} from "@/servicios/ubicacion";
import { Coordenadas, Reporte, TipoDeReporte } from "@/tipos";

export function AsistenteReporte() {
  const insets = useSafeAreaInsets();
  const tema = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  /** Evita doble POST si el botón se toca antes del re-render de `enviando`/`sumando`. */
  const enviandoRef = useRef(false);
  const sumandoRef = useRef(false);
  const { origen } = useLocalSearchParams<{ origen?: string }>();
  const { sesion, enviarReporte, adherirseAReporte } = useSesion();
  const inicial = leerBorrador();
  const [paso, setPaso] = useState(inicial.paso);
  const [tipoId, setTipoId] = useState(inicial.tipoId);
  const [fotos, setFotos] = useState<string[]>(inicial.fotos);
  const [latitud, setLatitud] = useState<number | null>(inicial.latitud);
  const [longitud, setLongitud] = useState<number | null>(inicial.longitud);
  const [direccion, setDireccion] = useState(inicial.direccion);
  const [descripcion, setDescripcion] = useState(inicial.descripcion);
  const [audioUrl, setAudioUrl] = useState<string | null>(inicial.audioUrl);
  const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sumando, setSumando] = useState(false);
  const [revisandoFoto, setRevisandoFoto] = useState(inicial.fotos.length > 0);
  const [cercanoElegido, setCercanoElegido] = useState<Reporte | null>(null);
  const [mapaOcupado, setMapaOcupado] = useState(false);

  const vecinoIdentificado =
    sesion?.esInvitado === false && sesion.usuario.rol === "vecino";

  useEffect(() => {
    let activo = true;
    obtenerTiposReporte()
      .then((lista) => {
        if (activo) {
          setTipos(lista);
        }
      })
      .catch(() => {
        if (activo) {
          setError(
            "No hay tipos de reporte guardados. Conectate una vez para sincronizarlos.",
          );
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    setMapaOcupado(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [paso]);

  useEffect(() => {
    actualizarBorrador({
      tipoId,
      fotos,
      latitud,
      longitud,
      direccion,
      descripcion,
      audioUrl,
      paso,
    });
  }, [tipoId, fotos, latitud, longitud, direccion, descripcion, audioUrl, paso]);

  const onUbicacion = useCallback((coords: Coordenadas, texto: string) => {
    setLatitud(coords.latitud);
    setLongitud(coords.longitud);
    setDireccion(texto);
  }, []);

  const onElegirCercano = useCallback((reporte: Reporte | null) => {
    if (!reporte) {
      limpiarAdhesionPendiente();
    }
    setCercanoElegido(reporte);
  }, []);

  const tipoElegido = tipos.find((tipo) => tipo.id === tipoId);

  function puedeAvanzar() {
    if (paso === 1) return Boolean(tipoId);
    if (paso === 2) return fotos.length >= 1;
    if (paso === 3) {
      if (latitud == null || longitud == null) return false;
      if (cercanoElegido) return true;
      if (
        !estaEnLaCiudad({ latitud, longitud }) ||
        !esDireccionAceptable(direccion)
      ) {
        return false;
      }
      return true;
    }
    return true;
  }

  function mensajePaso() {
    if (paso === 1) return "Elegí el tipo de problema.";
    if (paso === 2) return "El reporte necesita al menos una foto.";
    if (paso === 3) {
      if (latitud == null || longitud == null) return "Marcá la ubicación en el mapa.";
      if (!estaEnLaCiudad({ latitud, longitud })) return MENSAJE_FUERA_DE_LA_CIUDAD;
      return "Necesitamos la calle. Arrastrá el pin o tocá el mapa.";
    }
    return null;
  }

  function onSiguiente() {
    setError(null);
    if (!puedeAvanzar()) {
      setError(mensajePaso());
      return;
    }
    if (paso === 3 && cercanoElegido) {
      void onSumarse(cercanoElegido);
      return;
    }
    if (paso === 3) {
      limpiarAdhesionPendiente();
      if (!estaEnLaCiudad({ latitud: latitud!, longitud: longitud! })) {
        setError(MENSAJE_FUERA_DE_LA_CIUDAD);
        return;
      }
      if (!esDireccionAceptable(direccion)) {
        setError(
          "Necesitamos la calle del lugar. Arrastrá el pin o tocá el mapa hasta que aparezca.",
        );
        return;
      }
    }
    if (paso < PASOS_REPORTE) {
      setPaso((actual) => actual + 1);
    }
  }

  function salir() {
    setError(null);
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (origen === "home") {
      router.replace("/(tabs)");
      return;
    }
    if (origen === "mis-reportes") {
      router.replace("/(tabs)/mis-reportes");
      return;
    }
    router.replace("/(publico)");
  }

  function onAtras() {
    setError(null);
    if (paso > 1) {
      setPaso((actual) => actual - 1);
      return;
    }
    salir();
  }

  async function onSumarse(reporte: Reporte) {
    if (sumandoRef.current) return;
    sumandoRef.current = true;
    setSumando(true);
    setError(null);
    try {
      if (!vecinoIdentificado) {
        marcarAdhesionPendiente(reporte.id);
        router.push("/register");
        return;
      }
      await adherirseAReporte(reporte.id);
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo sumar al reporte. Intentá de nuevo.",
      );
    } finally {
      sumandoRef.current = false;
      setSumando(false);
    }
  }

  async function onEnviar() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);
    try {
      const actual = leerBorrador();
      if (
        actual.latitud == null ||
        actual.longitud == null ||
        !estaEnLaCiudad({
          latitud: actual.latitud,
          longitud: actual.longitud,
        })
      ) {
        setError(MENSAJE_FUERA_DE_LA_CIUDAD);
        return;
      }

      marcarPendienteEnvio();
      const listo = borradorListoParaEnviar(leerBorrador());
      if (!listo) {
        setError("Falta completar el reporte.");
        return;
      }

      if (!vecinoIdentificado) {
        router.push("/register");
        return;
      }

      await enviarReporte(listo);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Fallback sin háptico
      }
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo enviar el reporte. Intentá de nuevo.",
      );
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.pantalla, { backgroundColor: tema.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style={tema.esOscuro ? "light" : "dark"} />
      <ScrollView
        ref={scrollRef}
        scrollEnabled={!mapaOcupado}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 24) + 12,
          },
        ]}
      >
        <View style={styles.formInner}>
          <ProgresoReporte
            paso={paso}
            titulo={paso === 2 && revisandoFoto ? "Revisá la foto" : undefined}
            onAtras={onAtras}
            onCerrar={salir}
          />

          {paso === 1 ? (
            <PasoTipo tipos={tipos} tipoId={tipoId} onElegir={setTipoId} />
          ) : null}
          {paso === 2 ? (
            <PasoFoto
              fotos={fotos}
              onFotos={setFotos}
              onRevisando={setRevisandoFoto}
            />
          ) : null}
          {paso === 3 ? (
            <PasoUbicacion
              tipoId={tipoId}
              latitud={latitud}
              longitud={longitud}
              direccion={direccion}
              onUbicacion={onUbicacion}
              onElegirCercano={onElegirCercano}
              onMapaOcupado={setMapaOcupado}
              sumando={sumando}
            />
          ) : null}
          {paso === 4 ? (
            <PasoDescripcion
              descripcion={descripcion}
              audioUrl={audioUrl}
              onDescripcion={setDescripcion}
              onAudio={setAudioUrl}
            />
          ) : null}
          {paso === 5 && latitud != null && longitud != null ? (
            <PasoConfirmacion
              tipo={tipoElegido}
              fotos={fotos}
              direccion={direccion}
              latitud={latitud}
              longitud={longitud}
              descripcion={descripcion}
              audioUrl={audioUrl}
            />
          ) : null}

          {error ? (
            <Text style={[styles.error, { color: tema.error }]}>{error}</Text>
          ) : null}

          <View style={styles.acciones}>
            {paso < PASOS_REPORTE ? (
              <Boton
                titulo="Continuar"
                cargando={paso === 3 && sumando}
                disabled={sumando}
                onPress={onSiguiente}
              />
            ) : null}
            {paso === PASOS_REPORTE ? (
              <Boton
                titulo="Enviar reporte"
                cargando={enviando}
                disabled={enviando || sumando}
                onPress={() => void onEnviar()}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formInner: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    padding: 4,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 12,
  },
  acciones: {
    marginTop: 20,
  },
});