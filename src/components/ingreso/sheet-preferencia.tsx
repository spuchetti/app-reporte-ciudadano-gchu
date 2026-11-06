import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Boton } from "@/components/ui/boton";
import { Fonts } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { useTheme } from "@/hooks/use-theme";
import { esErrorServicio } from "@/servicios/error";
import { ingresoRapidoDisponible } from "@/servicios/ingreso";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SheetPreferenciaIngreso() {
  const tema = useTheme();
  const { pendienteElegirIngreso, elegirMetodo, omitirPreferenciaIngreso } =
    useSesion();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [ocultarParaAuth, setOcultarParaAuth] = useState(false);
  const nativo = ingresoRapidoDisponible();

  useEffect(() => {
    if (!pendienteElegirIngreso) {
      setError(null);
      setCargando(false);
      setOcultarParaAuth(false);
    }
  }, [pendienteElegirIngreso]);

  async function confirmar(metodo: "rostro" | "pin") {
    setError(null);
    setCargando(true);
    setOcultarParaAuth(true);
    await esperar(400);
    try {
      await elegirMetodo(metodo);
    } catch (err) {
      setOcultarParaAuth(false);
      setError(
        esErrorServicio(err)
          ? err.message
          : "No se pudo guardar esta preferencia. Probá de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  if (!pendienteElegirIngreso) {
    return null;
  }

  return (
    <Modal visible={!ocultarParaAuth} animationType="fade" transparent>
      <View style={styles.fondo}>
        <View
          style={[
            styles.tarjeta,
            {
              backgroundColor: tema.surface,
              borderColor: tema.outline,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.titulo, { color: tema.onSurface }]}>
            ¿Cómo querés ingresar la próxima vez?
          </Text>
          <Text style={[styles.subtitulo, { color: tema.onSurfaceVariant }]}>
            Lo usás para ingresar. Podés seguir con tus datos, si cancelás.
          </Text>
          {error ? <Text style={[styles.error, { color: tema.error }]}>{error}</Text> : null}
          {nativo ? (
            <>
              <Boton
                titulo="Usar mi rostro"
                cargando={cargando}
                disabled={cargando}
                onPress={() => {
                  void confirmar("rostro");
                }}
              />
              <View style={styles.separador} />
              <Boton
                titulo="Usar el código del teléfono"
                variante="secundario"
                disabled={cargando}
                onPress={() => {
                  void confirmar("pin");
                }}
              />
            </>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={cargando}
            onPress={omitirPreferenciaIngreso}
            style={styles.omitir}
          >
            <Text style={[styles.omitirTexto, { color: tema.onSurfaceVariant }]}>
              Ahora no
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(18,35,46,0.6)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  tarjeta: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  titulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitulo: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  error: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 12,
  },
  separador: {
    height: 10,
  },
  omitir: {
    marginTop: 16,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  omitirTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
});