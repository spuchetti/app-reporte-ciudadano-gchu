import { reporteIdDeAviso } from "@/servicios/notificaciones";

describe("reporteIdDeAviso", () => {
  it("lee el id que manda la API", () => {
    expect(reporteIdDeAviso({ tipo: "estado", reporteId: "rep-001" })).toBe("rep-001");
  });

  it("ignora la push de prueba, que no trae reporte", () => {
    expect(reporteIdDeAviso({ tipo: "prueba" })).toBeNull();
  });

  it("ignora un id vacío", () => {
    expect(reporteIdDeAviso({ reporteId: "  " })).toBeNull();
  });
});
