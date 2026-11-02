import {
  DIRECCION_SIN_CONEXION,
  esDireccionAceptable,
  esDireccionCalle,
  esDireccionCoordenadas,
  esDireccionSoloCiudad,
  estaEnLaCiudad,
  formatearDireccionGeo,
  MENSAJE_FUERA_DE_LA_CIUDAD,
} from "@/servicios/ubicacion";

describe("ubicacion — dirección legible", () => {
  it("detecta ciudad sola o con provincia", () => {
    expect(esDireccionSoloCiudad("Gualeguaychú")).toBe(true);
    expect(esDireccionSoloCiudad("Gualeguaychu")).toBe(true);
    expect(esDireccionSoloCiudad("Gualeguaychú, Entre Ríos, Argentina")).toBe(
      true,
    );
    expect(esDireccionSoloCiudad("Rocamora 1240")).toBe(false);
  });

  it("detecta coordenadas y no las trata como calle", () => {
    expect(esDireccionCoordenadas("-33.00790, -58.51100")).toBe(true);
    expect(esDireccionCalle("-33.00790, -58.51100")).toBe(false);
    expect(esDireccionCalle("Rocamora 1240")).toBe(true);
  });

  it("acepta el placeholder offline además de la calle", () => {
    expect(esDireccionAceptable(DIRECCION_SIN_CONEXION)).toBe(true);
    expect(esDireccionAceptable("Rocamora 1240")).toBe(true);
    expect(esDireccionAceptable("Gualeguaychú")).toBe(false);
    expect(esDireccionAceptable("")).toBe(false);
  });

  it("detecta si el pin cae dentro de algún polígono de la ciudad", () => {
    expect(
      estaEnLaCiudad({ latitud: -33.0123, longitud: -58.5123 }),
    ).toBe(true);
    expect(estaEnLaCiudad({ latitud: -32.9, longitud: -58.4 })).toBe(false);
    // Cerca del borde (buffer de zona) pero fuera del polígono: no es ciudad.
    expect(
      estaEnLaCiudad({ latitud: -33.012, longitud: -58.532 }),
    ).toBe(false);
    expect(MENSAJE_FUERA_DE_LA_CIUDAD).toMatch(/fuera de Gualeguaychú/);
  });

  it("prioriza calle y altura sobre formattedAddress de solo ciudad", () => {
    expect(
      formatearDireccionGeo({
        city: "Gualeguaychú",
        street: "Rocamora",
        streetNumber: "1240",
        formattedAddress: "Gualeguaychú, Entre Ríos, Argentina",
        name: "Gualeguaychú",
        region: "Entre Ríos",
        country: "Argentina",
        postalCode: null,
        district: null,
        subregion: null,
        timezone: null,
        isoCountryCode: "AR",
      }),
    ).toBe("Rocamora 1240");
  });

  it("usa la primera parte del formattedAddress si trae calle", () => {
    expect(
      formatearDireccionGeo({
        city: "Gualeguaychú",
        street: null,
        streetNumber: null,
        formattedAddress: "25 de Mayo 890, Gualeguaychú, Entre Ríos",
        name: null,
        region: "Entre Ríos",
        country: "Argentina",
        postalCode: null,
        district: null,
        subregion: null,
        timezone: null,
        isoCountryCode: "AR",
      }),
    ).toBe("25 de Mayo 890");
  });

  it("devuelve vacío si solo hay ciudad", () => {
    expect(
      formatearDireccionGeo({
        city: "Gualeguaychú",
        street: null,
        streetNumber: null,
        formattedAddress: "Gualeguaychú, Entre Ríos, Argentina",
        name: "Gualeguaychú",
        region: "Entre Ríos",
        country: "Argentina",
        postalCode: null,
        district: null,
        subregion: null,
        timezone: null,
        isoCountryCode: "AR",
      }),
    ).toBe("");
  });
});
