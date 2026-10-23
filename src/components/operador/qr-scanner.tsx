import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

import IconoPrincipal from "@/assets/branding/icono_principal.svg";
import { Fonts, Paleta, PaletaOperador } from "@/constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
};

export function QRScanner({ visible, onClose, onScan }: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [esperandoPermiso, setEsperandoPermiso] = useState(false);
  const [errorPermiso, setErrorPermiso] = useState<string | null>(null);
  const pidioPermiso = useRef(false);
  const escaneadoRef = useRef(false);

  const solicitarPermiso = useCallback(async () => {
    setEsperandoPermiso(true);
    setErrorPermiso(null);
    try {
      await pedirPermiso();
    } catch {
      setErrorPermiso("No se pudo solicitar el permiso de cámara. Probá de nuevo.");
    } finally {
      setEsperandoPermiso(false);
    }
  }, [pedirPermiso]);

  useEffect(() => {
    if (!visible) {
      pidioPermiso.current = false;
      escaneadoRef.current = false;
      setErrorPermiso(null);
      return;
    }

    if (permiso?.granted || pidioPermiso.current) {
      return;
    }

    if (permiso && !permiso.canAskAgain) {
      return;
    }

    pidioPermiso.current = true;
    void solicitarPermiso();
  }, [permiso, solicitarPermiso, visible]);

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      if (escaneadoRef.current || !data) {
        return;
      }

      escaneadoRef.current = true;
      onScan(data);
    },
    [onScan],
  );

  const cargandoPermiso =
    esperandoPermiso || (!permiso && errorPermiso === null);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.fondo}>
        <ScrollView
          contentContainerStyle={styles.contenedor}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.panel}>
            <View style={styles.cabecera}>
              <View style={styles.marcaCabecera}>
                <IconoPrincipal width={32} height={32} accessibilityLabel="Reporte Ciudadano" />
                <Text style={styles.titulo}>Escanear código QR</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar escáner QR"
                onPress={onClose}
                hitSlop={8}
                style={styles.botonCerrar}
              >
                <Text style={styles.botonCerrarTexto}>Cerrar</Text>
              </Pressable>
            </View>

            {cargandoPermiso ? (
              <View style={styles.estado}>
                <ActivityIndicator color={PaletaOperador.principal} />
                <Text style={styles.textoEstado}>Cargando permisos...</Text>
              </View>
            ) : permiso?.granted ? (
              <>
                <Text style={styles.instruccion}>
                  Centrá el código QR dentro del marco para escanearlo.
                </Text>
                <View style={styles.camara}>
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={handleScan}
                  />
                  <View pointerEvents="none" style={styles.marco} />
                </View>
              </>
            ) : (
              <View style={styles.estado}>
                <Text style={styles.textoEstado}>
                  {errorPermiso ??
                    "El permiso de cámara fue denegado. Permitilo para escanear un código QR."}
                </Text>
                {permiso?.canAskAgain || !permiso ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void solicitarPermiso()}
                    style={styles.botonPrincipal}
                  >
                    <Text style={styles.botonPrincipalTexto}>Permitir cámara</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void Linking.openSettings().catch(() => {
                        setErrorPermiso(
                          "No se pudieron abrir los ajustes. Habilitá la cámara desde la configuración del dispositivo.",
                        );
                      });
                    }}
                    style={styles.botonPrincipal}
                  >
                    <Text style={styles.botonPrincipalTexto}>Abrir ajustes</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={styles.botonSecundario}
                >
                  <Text style={styles.botonSecundarioTexto}>Cerrar</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(18,35,46,0.72)",
    justifyContent: "center",
  },
  contenedor: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: Paleta.paperRaised,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  marcaCabecera: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titulo: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    color: Paleta.ink,
    fontSize: 20,
  },
  botonCerrar: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  botonCerrarTexto: {
    fontFamily: Fonts.medium,
    color: Paleta.inkSoft,
    fontSize: 14,
  },
  instruccion: {
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  camara: {
    width: "100%",
    height: 300,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: Paleta.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  marco: {
    width: 210,
    height: 210,
    borderWidth: 3,
    borderColor: Paleta.paperRaised,
    borderRadius: 18,
  },
  estado: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  textoEstado: {
    fontFamily: Fonts.regular,
    color: Paleta.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  botonPrincipal: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: PaletaOperador.principal,
  },
  botonPrincipalTexto: {
    fontFamily: Fonts.semiBold,
    color: Paleta.paperRaised,
    fontSize: 15,
  },
  botonSecundario: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Paleta.line,
  },
  botonSecundarioTexto: {
    fontFamily: Fonts.medium,
    color: Paleta.inkSoft,
    fontSize: 14,
  },
});
