import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Paleta } from "@/constants/theme";
import { ESTADOS_GESTION } from "@/servicios/bandeja";
import { etiquetaEstado } from "@/servicios/reportes";
import { EstadoReporte } from "@/tipos";

type Props = {
  visible: boolean;
  estadoActual: EstadoReporte | null;
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onConfirmar: (
    estado: EstadoReporte,
    comentario: string,
    fotoArregloUrl: string | null,
  ) => void;
};

export function SheetEstado({
  visible,
  estadoActual,
  guardando,
  error,
  onCerrar,
  onConfirmar,
}: Props) {
  const [estado, setEstado] = useState<EstadoReporte | null>(null);
  const [comentario, setComentario] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setEstado(null);
    setComentario("");
    setFoto(null);
    setErrorLocal(null);
  }, [visible]);

  const opciones = ESTADOS_GESTION.filter((item) => item !== estadoActual);
  const motivoListo = comentario.trim().length >= 3;
  const fotoLista = estado !== "resuelto" || Boolean(foto);
  const puedeGuardar = Boolean(estado) && motivoListo && fotoLista && !guardando;

  async function elegirFoto() {
    setErrorLocal(null);
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setErrorLocal("Necesitamos acceso a la galería para subir la foto del arreglo.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!resultado.canceled && resultado.assets[0]?.uri) {
      setFoto(resultado.assets[0].uri);
    }
  }

  async function tomarFoto() {
    setErrorLocal(null);
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      setErrorLocal("Necesitamos acceso a la cámara para sacar la foto del arreglo.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!resultado.canceled && resultado.assets[0]?.uri) {
      setFoto(resultado.assets[0].uri);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <Text style={styles.titulo}>Cambiar estado</Text>
            <Text style={styles.subtitulo}>
              Dejá escrito por qué cambia. Si lo cerrás como resuelto, subí la foto del arreglo.
            </Text>

            {error || errorLocal ? (
              <Text style={styles.error}>{error ?? errorLocal}</Text>
            ) : null}

            <View style={styles.opciones}>
              {opciones.map((item) => {
                const activo = estado === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    accessibilityLabel={etiquetaEstado(item)}
                    disabled={guardando}
                    onPress={() => setEstado(item)}
                    style={[styles.opcion, activo ? styles.opcionActiva : null]}
                  >
                    <Text style={[styles.opcionTexto, activo ? styles.opcionTextoActivo : null]}>
                      {etiquetaEstado(item)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={comentario}
              onChangeText={setComentario}
              placeholder="Por qué cambia el estado"
              placeholderTextColor={Paleta.inkSoft}
              accessibilityLabel="Motivo del cambio"
              editable={!guardando}
              multiline
              style={styles.motivo}
            />

            {estado === "resuelto" ? (
              <View style={styles.fotoBloque}>
                <Text style={styles.fotoTitulo}>Foto del arreglo</Text>
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.foto} />
                ) : (
                  <Text style={styles.fotoAyuda}>Hace falta una foto para cerrarlo.</Text>
                )}
                <View style={styles.fotoAcciones}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Elegir foto del arreglo"
                    disabled={guardando}
                    onPress={() => void elegirFoto()}
                    style={styles.fotoBoton}
                  >
                    <Text style={styles.fotoBotonTexto}>Elegir de galería</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tomar foto del arreglo"
                    disabled={guardando}
                    onPress={() => void tomarFoto()}
                    style={styles.fotoBoton}
                  >
                    <Text style={styles.fotoBotonTexto}>Tomar foto</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {guardando ? (
              <ActivityIndicator color={Paleta.orange} style={styles.cargando} />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Guardar estado"
                disabled={!puedeGuardar}
                onPress={() => {
                  if (!estado || !puedeGuardar) {
                    return;
                  }
                  onConfirmar(estado, comentario.trim(), foto);
                }}
                style={[styles.guardar, !puedeGuardar && styles.guardarInactivo]}
              >
                <Text style={styles.guardarTexto}>Guardar</Text>
              </Pressable>
            )}

            {!guardando ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar cambio de estado"
                onPress={onCerrar}
                style={styles.cancelar}
              >
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(18,35,46,0.45)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: Paleta.paperRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: "88%",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: Paleta.ink,
  },
  subtitulo: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: Paleta.inkSoft,
  },
  error: {
    marginBottom: 8,
    fontSize: 13,
    color: Paleta.rojo,
  },
  opciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  opcion: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Paleta.line,
    backgroundColor: Paleta.paper,
  },
  opcionActiva: {
    backgroundColor: Paleta.orange,
    borderColor: Paleta.orange,
  },
  opcionTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.ink,
  },
  opcionTextoActivo: {
    color: Paleta.paperRaised,
  },
  motivo: {
    marginTop: 12,
    minHeight: 72,
    borderWidth: 1,
    borderColor: Paleta.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Paleta.ink,
    backgroundColor: Paleta.paper,
    textAlignVertical: "top",
  },
  fotoBloque: {
    marginTop: 12,
    gap: 8,
  },
  fotoTitulo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
  },
  fotoAyuda: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  foto: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    backgroundColor: Paleta.paper,
  },
  fotoAcciones: {
    flexDirection: "row",
    gap: 8,
  },
  fotoBoton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Paleta.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  fotoBotonTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: Paleta.orange,
  },
  cargando: {
    marginTop: 16,
  },
  guardar: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Paleta.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  guardarInactivo: {
    opacity: 0.45,
  },
  guardarTexto: {
    color: Paleta.paperRaised,
    fontSize: 15,
    fontWeight: "700",
  },
  cancelar: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: Paleta.inkSoft,
  },
});
