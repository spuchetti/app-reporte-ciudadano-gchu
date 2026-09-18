import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
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
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import {
  actualizarBorrador,
  borradorListoParaEnviar,
  leerBorrador,
  marcarPendienteEnvio,
  PASOS_REPORTE,
} from "@/servicios/borrador";
import { esErrorServicio } from "@/servicios/error";
import { obtenerTiposReporte } from "@/servicios/reportes";
import { Coordenadas, TipoDeReporte } from "@/tipos";

export function AsistenteReporte() {
  const insets = useSafeAreaInsets();
  const { sesion, enviarReporte } = useSesion();
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
      return latitud != null && longitud != null && direccion.trim().length >= 5;
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
    if (paso < PASOS_REPORTE) {
      setPaso((actual) => actual + 1);
    }
  }

  function onAtras() {
    setError(null);
    if (paso === 1) {
      router.back();
      return;
    }
    setPaso((actual) => actual - 1);
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
          <Text style={styles.marca}>Crear reporte</Text>
          <ProgresoReporte paso={paso} />

          {paso === 1 ? (
            <PasoTipo tipos={tipos} tipoId={tipoId} onElegir={setTipoId} />
          ) : null}
          {paso === 2 ? <PasoFoto fotos={fotos} onFotos={setFotos} /> : null}
          {paso === 3 ? (
            <PasoUbicacion
              latitud={latitud}
              longitud={longitud}
              direccion={direccion}
              onUbicacion={onUbicacion}
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
            {paso < PASOS_REPORTE && puedeAvanzar() ? (
              <Boton titulo="Continuar" onPress={onSiguiente} />
            ) : null}
            {paso === PASOS_REPORTE ? (
              <Boton
                titulo="Enviar reporte"
                cargando={enviando}
                disabled={enviando}
                onPress={() => void onEnviar()}
              />
            ) : null}
            {paso < PASOS_REPORTE && puedeAvanzar() ? (
              <View style={styles.separador} />
            ) : null}
            <Boton
              titulo={paso === 1 ? "Volver" : "Atrás"}
              variante="texto"
              disabled={enviando}
              onPress={onAtras}
            />
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
    paddingHorizontal: 24,
  },
  formInner: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  marca: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.inkSoft,
    marginBottom: 8,
  },
  error: {
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
