import { styles } from "@/app/(operador)/zonas"
import { Paleta } from "@/constants/theme"
import { ZonaCuadrilla } from "@/servicios"
import { cambiarEstadoCuadrilla } from "@/servicios/cuadrillas"
import { Usuario } from "@/tipos"
import FontAwesome5 from "@expo/vector-icons/FontAwesome5"
import { Dispatch, SetStateAction } from "react"
import { Pressable, Text, View } from "react-native"


const ColoresZona: Record<string, string> = {
    "zon-norte": Paleta.verde,
    "zon-centro": Paleta.azul,
    "zon-sur": "#532e9e",
    "zon-este": Paleta.orange
}

export default function TarjetaZona({ usuario, zona, setZonas, setError, setCargando }: {
    usuario: Usuario,
    zona: ZonaCuadrilla,
    setZonas: Dispatch<SetStateAction<ZonaCuadrilla[]>>
    setError: Dispatch<SetStateAction<string>>
    setCargando: Dispatch<SetStateAction<string>>
}) {
    return <View style={[styles.tarjeta]}>
        <View style={styles.headerTarjeta}>
            <View style={{ flexDirection: "row", gap: 20 }}>
                <View style={[styles.icon, { backgroundColor: `${ColoresZona[zona.id]}33` }]}>
                    <FontAwesome5 name="map-marker-alt" size={24} color={ColoresZona[zona.id]} />
                </View>
                <View>
                    <Text style={{ fontSize: 22 }}>{zona.nombre}</Text>
                    {(zona.cuadrillasActivas || zona.cuadrillasInactivas) ?
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ color: ColoresZona[zona.id], fontSize: 16 }}>{zona.cuadrillasActivas > 0 && `${zona.cuadrillasActivas} ${zona.cuadrillasActivas > 1 ? "activas" : "activa"}`} {zona.cuadrillasInactivas > 0 && ` · ${zona.cuadrillasInactivas} ${zona.cuadrillasInactivas > 1 ? "inactivas" : "inactiva"} `}</Text>
                            <Text>| Ref. {zona.referente}</Text>
                        </View>
                        :
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ color: ColoresZona[zona.id] }}>No hay cuadrillas asignadas</Text>
                            <Text> | Ref. {zona.referente}</Text>
                        </View>
                    }
                </View>
            </View>
            {usuario?.zonaId == zona.id &&
                <View
                    style={{
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                >
                    <Text style={[styles.tuZona, { color: ColoresZona[zona.id], backgroundColor: `${ColoresZona[zona.id]}33` }]}>Tu zona</Text>
                </View>
            }
        </View>
        <View>
            {zona.cuadrillas.map((cuadrilla) => (
                <View key={cuadrilla.id} style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTopWidth: 1,
                    borderColor: Paleta.line,
                    paddingTop: 10,
                    paddingBottom: 10,
                }}>
                    <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
                        <View style={{
                            backgroundColor: cuadrilla.activa ? ColoresZona[zona.id] : Paleta.rojo,
                            width: 10,
                            height: 10,
                            borderRadius: "100%"
                        }}
                        />
                        <Text style={{ fontSize: 15, color: cuadrilla.activa ? Paleta.ink : Paleta.rojo }}>{cuadrilla.nombre.split("-")[1]}</Text>
                    </View>
                    <Pressable onPress={async () => {
                        setCargando("Cambiando estado de cuadrícula")
                        try {
                            const cuadrillaActualizada = await cambiarEstadoCuadrilla(cuadrilla.id)
                            if (cuadrillaActualizada) {
                                setZonas(prev => prev.map(z => {
                                    if (z.id != zona.id) return z
                                    const cuadrillas = z.cuadrillas.map(c => c.id == cuadrillaActualizada.id ? cuadrillaActualizada : c)
                                    return {
                                        ...z,
                                        cuadrillas,
                                        cuadrillasActivas: cuadrillas.filter(c => c.activa).length,
                                        cuadrillasInactivas: cuadrillas.filter(c => !c.activa).length
                                    }
                                }))
                                setCargando("")
                            }
                        } catch (error: any) {
                            setCargando("")
                            setError(error.message)
                            setTimeout(() => setError(""), 1700)
                        }
                    }}>
                        <Text style={{ color: cuadrilla.activa ? ColoresZona[zona.id] : Paleta.rojo, fontSize: 15 }}>{cuadrilla.activa ? "Activa" : "Inactiva"}</Text>
                    </Pressable>
                </View>
            ))}
        </View>
    </View>
}