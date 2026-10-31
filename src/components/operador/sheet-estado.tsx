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
import Ionicons from "@expo/vector-icons/Ionicons";

import { CapturaCamara } from "@/components/foto/captura-camara";
import { Fonts, Paleta, PaletaOperador } from "@/constants/theme";
import {
  avisoGestionEstado,
  estadosSiguientes,
  resueltoRequiereAsignacion,
} from "@/servicios/bandeja";
import { COLORES_ESTADO } from "@/servicios/mapa";
import { etiquetaEstado } from "@/servicios/reportes";
import { EstadoReporte } from "@/tipos";

type Props = {
  visible: boolean;
  estadoActual: EstadoReporte | null;
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onAsignarCuadrilla?: () => void;
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
  onAsignarCuadrilla,
  onConfirmar,
}: Props) {
  const [estado, setEstado] = useState<EstadoReporte | null>(null);
  const [comentario, setComentario] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mostrandoCamara, setMostrandoCamara] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setEstado(null);
    setComentario("");
    setFoto(null);
    setErrorLocal(null);
    setMostrandoCamara(false);
  }, [visible]);

  const opciones = estadosSiguientes(estadoActual);
  const aviso = avisoGestionEstado(estadoActual);
  const mostrarResueltoBloqueado = resueltoRequiereAsignacion(estadoActual);
  const motivoListo = comentario.trim().length >= 3;
  const fotoLista = estado !== "resuelto" || Boolean(foto);
  const puedeGuardar = Boolean(estado) && motivoListo && fotoLista && !guardando;

  async function elegirFoto() {
    setErrorLocal(null);
    try {
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
        setMostrandoCamara(false);
      }
    } catch {
      setErrorLocal("No se pudo abrir la galería. Probá de nuevo.");
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
            <Text style={styles.subtitulo}>Dejá escrito por qué cambia.</Text>
            {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

            {error || errorLocal ? (
              <Text style={styles.error}>{error ?? errorLocal}</Text>
            ) : null}

            {mostrandoCamara ? (
              <CapturaCamara
                pista="Que se vea el arreglo completo"
                altura={280}
                onFoto={(uri) => {
                  setFoto(uri);
                  setMostrandoCamara(false);
                  setErrorLocal(null);
                }}
                onCerrar={() => setMostrandoCamara(false)}
              />
            ) : (
              <>
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
                        style={[
                          styles.opcion,
                          activo
                            ? [
                                styles.opcionActiva,
                                {
                                  backgroundColor: COLORES_ESTADO[item],
                                  borderColor: COLORES_ESTADO[item],
                                },
                              ]
                            : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.opcionTexto,
                            activo ? styles.opcionTextoActivo : null,
                            activo &&
                            (item === "recibido" || item === "asignado" || item === "resuelto")
                              ? styles.opcionTextoActivoOscuro
                              : null,
                          ]}
                        >
                          {etiquetaEstado(item)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {mostrarResueltoBloqueado ? (
                  <View style={styles.bloqueado}>
                    <View style={styles.bloqueadoCabecera}>
                      <View style={styles.bloqueadoChip}>
                        <View
                          style={[
                            styles.bloqueadoPunto,
                            { backgroundColor: COLORES_ESTADO.resuelto },
                          ]}
                        />
                        <Text style={styles.bloqueadoChipTexto}>Resuelto</Text>
                      </View>
                      <Text style={styles.bloqueadoEtiqueta}>No disponible</Text>
                    </View>
                    <Text style={styles.bloqueadoTexto}>
                      Primero asigná una cuadrilla. La foto del arreglo se pide al
                      cerrarlo.
                    </Text>
                    {onAsignarCuadrilla ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Asignar cuadrilla"
                        disabled={guardando}
                        onPress={onAsignarCuadrilla}
                        style={styles.bloqueadoAccion}
                      >
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={PaletaOperador.principal}
                        />
                        <Text style={styles.bloqueadoAccionTexto}>
                          Asignar cuadrilla
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

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
                        onPress={() => {
                          setErrorLocal(null);
                          setMostrandoCamara(true);
                        }}
                        style={styles.fotoBoton}
                      >
                        <Text style={styles.fotoBotonTexto}>Tomar foto</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {guardando ? (
                  <ActivityIndicator color={PaletaOperador.principal} style={styles.cargando} />
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
              </>
            )}
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
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Paleta.ink,
  },
  subtitulo: {
    marginTop: 4,
    marginBottom: 8,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Paleta.inkSoft,
  },
  aviso: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Paleta.tealSoft,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: Paleta.tealDeep,
  },
  error: {
    marginBottom: 8,
    fontFamily: Fonts.medium,
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
    borderWidth: 2,
  },
  opcionTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Paleta.ink,
  },
  opcionTextoActivo: {
    color: Paleta.paperRaised,
  },
  opcionTextoActivoOscuro: {
    color: Paleta.ink,
  },
  bloqueado: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Paleta.line,
    backgroundColor: Paleta.paper,
    gap: 8,
  },
  bloqueadoCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  bloqueadoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#E6F5E9",
  },
  bloqueadoPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bloqueadoChipTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: "#226D3A",
  },
  bloqueadoEtiqueta: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Paleta.inkSoft,
  },
  bloqueadoTexto: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Paleta.inkSoft,
  },
  bloqueadoAccion: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PaletaOperador.principal,
  },
  bloqueadoAccionTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: PaletaOperador.principal,
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
    fontFamily: Fonts.regular,
    color: Paleta.ink,
    backgroundColor: Paleta.paper,
    textAlignVertical: "top",
  },
  fotoBloque: {
    marginTop: 12,
    gap: 8,
  },
  fotoTitulo: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Paleta.inkSoft,
  },
  fotoAyuda: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Paleta.inkSoft,
  },
  foto: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    backgroundColor: Paleta.paper,
  },
  fotoAcciones: {
    flexDirection: "row",
    gap: 8,
  },
  fotoBoton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PaletaOperador.principal,
    alignItems: "center",
    justifyContent: "center",
  },
  fotoBotonTexto: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: PaletaOperador.principal,
  },
  cargando: {
    marginTop: 16,
  },
  guardar: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: PaletaOperador.principal,
    alignItems: "center",
    justifyContent: "center",
  },
  guardarInactivo: {
    opacity: 0.45,
  },
  guardarTexto: {
    fontFamily: Fonts.semiBold,
    color: Paleta.paperRaised,
    fontSize: 15,
  },
  cancelar: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelarTexto: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Paleta.inkSoft,
  },
});
