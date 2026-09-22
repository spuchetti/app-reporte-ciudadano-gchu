import Cargando from "@/components/ui/cargando";
import HeaderOperador from "@/components/ui/headerOperador";
import { Paleta } from "@/constants/theme";
import { useSesion } from "@/contexto/sesion";
import { nombreZona } from "@/servicios/bandeja";
import { obtenerZonas, ZonaCuadrilla } from "@/servicios/zonas";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import TarjetaZona from "@/components/operador/tarjeta-zona";

export default function Zonas() {
    const router = useRouter()
    const { sesion } = useSesion();
    const usuario = sesion?.esInvitado === false ? sesion.usuario : null;
    const zonaId = usuario?.zonaId
    const zona = zonaId ? nombreZona(zonaId) : "Sin zona"

    const [zonas, setZonas] = useState<ZonaCuadrilla[]>([])
    const [cargando, setCargando] = useState<string>("")
    const [error, setError] = useState<string>("")

    useEffect(() => {
        (async () => {
            setCargando("Cargando zonas")
            try {
                const zonas = await obtenerZonas()
                if (zonas) setZonas(zonas)
                setCargando("")
            } catch (error) {
                setCargando("")
            }
        })()
    }, [])

    return (
        <View style={styles.pantalla}>
            <HeaderOperador>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Volver a la bandeja"
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <FontAwesome5 name="arrow-left" size={17} color="white" />
                        <Text style={styles.volver}>
                            Bandeja
                        </Text>
                    </View>
                </Pressable>
                <View style={styles.informacionContenedor}>
                    <Text style={styles.titulo}>Zonas y cuadrillas</Text>
                    <Text style={styles.subtitulo}>{usuario && `${usuario.nombre} · ${zona}`}</Text>
                </View>
            </HeaderOperador>
            {cargando ?
                <Cargando text={cargando} style={{ backgroundColor: Paleta.orange }} />
                :
                <View style={[styles.lista]}>
                    <FlatList
                        data={zonas}
                        keyExtractor={zona => zona.id}
                        renderItem={({ item }) => <TarjetaZona
                            usuario={usuario!}
                            zona={item}
                            setZonas={setZonas}
                            setError={setError}
                            setCargando={setCargando}
                        />}
                    />
                </View>
            }
            {error &&
                <View style={{ paddingInline: 20 }}>
                    <Text style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        borderRadius: 8,
                        color: Paleta.rojo,
                        textAlign: "center",
                        backgroundColor: `${Paleta.rojo}4D`,
                        padding: 20,
                        paddingBlock: 10
                    }}>
                        {error}
                    </Text>
                </View>
            }
        </View>
    )
}

export const styles = StyleSheet.create({
    pantalla: {
        flex: 1,
    },
    volver: {
        fontSize: 20,
        fontWeight: "600",
        color: Paleta.paperRaised
    },
    informacionContenedor: {
        alignItems: "center",
        gap: 10
    },

    titulo: {
        fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
        fontSize: 35,
        fontWeight: "600",
        color: Paleta.paperRaised,
    },
    subtitulo: {
        fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
        fontSize: 15,
        fontWeight: "600",
        color: Paleta.paperRaised,
    },
    lista: {
        paddingTop: 20,
        paddingInline: 10
    },
    tarjeta: {
        backgroundColor: Paleta.paperRaised,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Paleta.line,
        gap: 20,
        marginBottom: 20
    },
    headerTarjeta: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    icon: {
        padding: 5,
        width: 50,
        height: 50,
        borderRadius: "100%",
        justifyContent: "center",
        alignItems: "center"
    },
    tuZona: {
        fontWeight: "bold",
        margin: 0,
        paddingInline: 20,
        paddingBlock: 5,
        borderRadius: 8
    }
})