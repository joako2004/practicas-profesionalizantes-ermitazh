import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MENSAJES_ERROR_ESTADIA,
  nochesEntre,
  type MotivoErrorEstadia,
} from "./estadia";

function esperarNoches(ingreso: unknown, salida: unknown, esperado: number): void {
  assert.deepEqual(nochesEntre(ingreso, salida), { ok: true, noches: esperado });
}

function esperarMotivo(
  ingreso: unknown,
  salida: unknown,
  motivo: "FECHAS_INVALIDAS" | "SALIDA_NO_POSTERIOR",
): void {
  assert.deepEqual(nochesEntre(ingreso, salida), { ok: false, motivo });
}

describe("nochesEntre", () => {
  it("cuenta una noche", () => {
    esperarNoches("2026-10-20", "2026-10-21", 1);
  });

  it("cuenta una semana", () => {
    esperarNoches("2026-10-20", "2026-10-27", 7);
  });

  it("cruza el fin de año", () => {
    esperarNoches("2026-12-30", "2027-01-02", 3);
  });

  it("cruza febrero en año bisiesto", () => {
    esperarNoches("2028-02-28", "2028-03-01", 2);
  });

  it("cruza febrero en año no bisiesto", () => {
    esperarNoches("2027-02-28", "2027-03-01", 1);
  });

  it("acepta exactamente 30 noches", () => {
    esperarNoches("2026-10-20", "2026-11-19", 30);
  });

  it("no limita la estadía a 30 noches", () => {
    esperarNoches("2026-10-20", "2026-11-20", 31);
  });

  it("cruza un fin de mes", () => {
    esperarNoches("2026-10-25", "2026-11-01", 7);
  });

  it("rechaza una salida igual al ingreso", () => {
    esperarMotivo("2026-10-20", "2026-10-20", "SALIDA_NO_POSTERIOR");
  });

  it("rechaza una salida anterior al ingreso", () => {
    esperarMotivo("2026-10-21", "2026-10-20", "SALIDA_NO_POSTERIOR");
  });

  it("rechaza fechas de calendario inexistentes", () => {
    esperarMotivo("2026-02-30", "2026-03-05", "FECHAS_INVALIDAS");
    esperarMotivo("2026-10-20", "2026-13-01", "FECHAS_INVALIDAS");
    esperarMotivo("2027-02-29", "2027-03-02", "FECHAS_INVALIDAS");
  });

  it("acepta el 29 de febrero de un año bisiesto", () => {
    esperarNoches("2028-02-29", "2028-03-02", 2);
  });

  it("rechaza formatos que no son YYYY-MM-DD exacto", () => {
    esperarMotivo("2026-1-5", "2026-10-20", "FECHAS_INVALIDAS");
    esperarMotivo("2026-10-20T12:00:00", "2026-10-22", "FECHAS_INVALIDAS");
    esperarMotivo("", "2026-10-22", "FECHAS_INVALIDAS");
    esperarMotivo(" 2026-10-20", "2026-10-22", "FECHAS_INVALIDAS");
    esperarMotivo("2026-10-20", "2026-10-22 ", "FECHAS_INVALIDAS");
  });

  it("rechaza años fuera del rango 2000-2100", () => {
    esperarMotivo("0026-10-20", "2026-10-22", "FECHAS_INVALIDAS");
    esperarMotivo("2101-01-01", "2101-01-03", "FECHAS_INVALIDAS");
  });

  it("rechaza valores que no son strings", () => {
    esperarMotivo(20261020, "2026-10-22", "FECHAS_INVALIDAS");
    esperarMotivo(null, "2026-10-22", "FECHAS_INVALIDAS");
    esperarMotivo(undefined, "2026-10-22", "FECHAS_INVALIDAS");
    esperarMotivo("2026-10-20", null, "FECHAS_INVALIDAS");
    esperarMotivo({}, [], "FECHAS_INVALIDAS");
  });
});

describe("MENSAJES_ERROR_ESTADIA", () => {
  const MOTIVOS: MotivoErrorEstadia[] = [
    "DATOS_INVALIDOS",
    "FECHAS_INVALIDAS",
    "SALIDA_NO_POSTERIOR",
    "ESTADIA_MUY_LARGA",
    "CABANA_NO_ENCONTRADA",
    "SIN_PRECIO",
    "ERROR_INTERNO",
  ];

  it("tiene un mensaje no vacío para cada motivo", () => {
    for (const motivo of MOTIVOS) {
      const mensaje = MENSAJES_ERROR_ESTADIA[motivo];
      assert.equal(typeof mensaje, "string");
      assert.ok(mensaje.trim().length > 0);
    }
  });

  it("menciona las 30 noches en el error de estadía muy larga", () => {
    assert.ok(MENSAJES_ERROR_ESTADIA.ESTADIA_MUY_LARGA.includes("30 noches"));
  });
});
