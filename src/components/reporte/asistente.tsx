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
import { Fonts, Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import {
  actualizarBorrador,
  borradorListoParaEnviar,
  leerBorrador,
  marcarAdhesionPendiente,
  marcarPendienteEnvio,
  PASOS_REPORTE,
} from "@/servicios/borrador";
import { esErrorServicio } from "@/servicios/error";
import { obtenerTiposReporte } from "@/servicios/reportes";
import { Coordenadas, Reporte, TipoDeReporte } from "@/tipos";

export function AsistenteReporte() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
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
          setError("No se pudieron cargar los tipos de reporte.");
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
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

  const tipoElegido = tipos.find((tipo) => tipo.id === tipoId);

  function puedeAvanzar() {
    if (paso === 1) {
      return Boolean(tipoId);
    }
    if (paso === 2) {
      return fotos.length >= 1;
    }
    if (paso === 3) {
      return latitud != null && longitud != null;
    }
    return true;
  }

  function mensajePaso() {
    if (paso === 1) {
      return "Elegí el tipo de problema.";
    }
    if (paso === 2) {
      return "El reporte necesita al menos una foto.";
    }
    if (paso === 3) {
      return "Marcá la ubicación en el mapa.";
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
    if (paso === 3 && direccion.trim().length < 5) {
      setDireccion("Gualeguaychú");
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
    setError(null);
    if (!vecinoIdentificado) {
      marcarAdhesionPendiente(reporte.id);
      router.push("/register");
      return;
    }

    setSumando(true);
    try {
      await adherirseAReporte(reporte.id);
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo sumar al reporte. Intentá de nuevo.",
      );
    } finally {
      setSumando(false);
    }
  }

  async function onEnviar() {
    setError(null);
    marcarPendienteEnvio();
    const listo = borradorListoParaEnviar(leerBorrador());
    if (!listo) {
      setError("Falta completar el reporte.");
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Sin motor háptico no frenamos el envío.
    }

    if (!vecinoIdentificado) {
      router.push("/register");
      return;
    }

    setEnviando(true);
    try {
      await enviarReporte(listo);
    } catch (err) {
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo enviar el reporte. Intentá de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollRef}
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
            titulo={
              paso === 2 && revisandoFoto ? "Revisá la foto" : undefined
            }
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
              onElegirCercano={setCercanoElegido}
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

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
    backgroundColor: Paleta.paperRaised,
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
    color: Paleta.rojo,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 12,
  },
  acciones: {
    marginTop: 20,
  },
  separador: {
    height: 8,
  },
});
