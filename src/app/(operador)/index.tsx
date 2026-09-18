import React from "react";
import { Platform, StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { Boton } from "@/components/ui/boton";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { reportesMock, tiposReporteMock } from "@/mocks/reportes";

const coloresEstado: Record<string, string> = {
  recibido: "#F2B705",
  en_revision: "#2E6E9E",
  asignado: "#E8630C",
  resuelto: "#2F9E52",
  rechazado: "#D64545"
};

export default function BandejaOperadorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sesion, cerrarSesion } = useSesion();
  const usuario = sesion?.esInvitado === false ? sesion.usuario : null;

  const renderItem = ({ item }: { item: typeof reportesMock[0] }) => {
    const tipo = tiposReporteMock.find((t) => t.id === item.tipoId);
    const colorEstado = coloresEstado[item.estado] || Paleta.inkSoft;
    const fecha = new Date(item.creadoEn).toLocaleDateString("es-AR");

    return (
      <View style={styles.tarjeta}>
        <View style={styles.tarjetaContenido}>
          <View style={[styles.iconoContenedor, { backgroundColor: colorEstado }]}>
            <Text style={styles.icono}>{tipo?.icono}</Text>
          </View>
          <View style={styles.infoContenedor}>
            <View style={styles.filaCabecera}>
              <Text style={styles.codigo}>{item.codigo}</Text>
              <View style={[styles.insignia, { backgroundColor: colorEstado + "20" }]}>
                <Text style={[styles.insigniaTexto, { color: colorEstado }]}>
                  {item.estado.toUpperCase().replace("_", " ")}
                </Text>
              </View>
            </View>
            <Text style={styles.detallePrincipal}>{tipo?.nombre} • {item.direccion}</Text>
            <Text style={styles.detalleSecundario}>Autor anónimo • Ingresado: {fecha}</Text>
          </View>
        </View>
        
        <View style={styles.accionesContenedor}>
          <TouchableOpacity 
            style={styles.botonRevisar}
            onPress={() => router.push(`/(operador)/detalle-operador/${item.id}`)}
          >
            <Text style={styles.textoBotonRevisar}>Revisar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonAsignar}>
            <Text style={styles.textoBotonAsignar}>Asignar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const CabeceraLista = () => (
    <View style={styles.controlesSuperiores}>
      <View style={styles.buscadorContenedor}>
        <TextInput 
          style={styles.inputBusqueda} 
          placeholder="Buscar reporte..." 
          placeholderTextColor={Paleta.inkSoft}
        />
        <TouchableOpacity style={styles.botonAjustes}>
          <Text style={styles.iconoAjustes}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabsContenedor}>
        <TouchableOpacity style={styles.tabActivo}>
          <Text style={styles.textoTabActivo}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabInactivo}>
          <Text style={styles.textoTabInactivo}>Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabInactivo}>
          <Text style={styles.textoTabInactivo}>Mi zona</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.pantalla}>
      <StatusBar style="light" />
      
      <View style={[styles.cabecera, { paddingTop: Platform.OS === "web" ? 40 : insets.top + 20 }]}>
        <Text style={styles.titulo}>Bandeja de gestión</Text>
        <Text style={styles.subtitulo}>
          Zona Norte • {reportesMock.length} pendientes
        </Text>
      </View>

      <FlatList
        data={reportesMock}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={CabeceraLista}
        contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.pieLista}>
            <Text style={styles.email}>{usuario?.email}</Text>
            <Boton titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Paleta.paper,
  },
  cabecera: {
    backgroundColor: "#E8630C",
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 2,
  },
  titulo: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  lista: {
    padding: 16,
    gap: 8,
  },
  controlesSuperiores: {
    marginBottom: 8,
  },
  buscadorContenedor: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  inputBusqueda: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(18,35,46,0.12)",
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  botonAjustes: {
    width: 40,
    height: 40,
    backgroundColor: "#E8630C",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  iconoAjustes: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  tabsContenedor: {
    flexDirection: "row",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(18,35,46,0.12)",
    paddingBottom: 12,
  },
  tabActivo: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#E8630C",
    borderRadius: 4,
  },
  textoTabActivo: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  tabInactivo: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 4,
  },
  textoTabInactivo: {
    color: "#E8630C",
    fontSize: 13,
    fontWeight: "500",
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(18,35,46,0.12)",
    marginBottom: 8,
  },
  tarjetaContenido: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  iconoContenedor: {
    width: 50,
    height: 50,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  icono: {
    fontSize: 24,
  },
  infoContenedor: {
    flex: 1,
    justifyContent: "center",
  },
  filaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  codigo: {
    fontSize: 13,
    fontWeight: "600",
    color: Paleta.ink,
  },
  insignia: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  insigniaTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  detallePrincipal: {
    fontSize: 12,
    color: Paleta.inkSoft,
    marginBottom: 2,
  },
  detalleSecundario: {
    fontSize: 11,
    color: "#888780",
  },
  accionesContenedor: {
    flexDirection: "row",
    gap: 8,
  },
  botonRevisar: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E8630C",
    borderRadius: 4,
    alignItems: "center",
  },
  textoBotonRevisar: {
    color: "#E8630C",
    fontSize: 12,
    fontWeight: "600",
  },
  botonAsignar: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#E8630C",
    borderRadius: 4,
    alignItems: "center",
  },
  textoBotonAsignar: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  pieLista: {
    marginTop: 20,
    alignItems: "center",
    gap: 16,
  },
  email: {
    fontSize: 13,
    color: Paleta.inkSoft,
  },
});