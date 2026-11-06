import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ZONA_ARGENTINA, hoyEnArgentina } from "./fechas";

// Construye un instante UTC exacto, sin depender de la zona del sistema.
function instante(
  anio: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
  segundo = 0,
  milisegundo = 0,
): Date {
  return new Date(
    Date.UTC(anio, mes - 1, dia, hora, minuto, segundo, milisegundo),
  );
}

// Clave "AAAA-MM-DD" del día UTC de una fecha.
function claveUtc(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

describe("ZONA_ARGENTINA", () => {
  it("es la zona unificada de Buenos Aires", () => {
    assert.equal(ZONA_ARGENTINA, "America/Argentina/Buenos_Aires");
  });
});

describe("hoyEnArgentina", () => {
  it("devuelve el día calendario de Argentina, no el día UTC", () => {
    assert.equal(
      claveUtc(hoyEnArgentina(instante(2026, 11, 6, 12))),
      "2026-11-06",
    );
  });

  it("a las 02:59:59 UTC todavía es el día anterior en Argentina", () => {
    assert.equal(
      claveUtc(hoyEnArgentina(instante(2026, 11, 10, 2, 59, 59))),
      "2026-11-09",
    );
  });

  it("a las 03:00:00 UTC ya es el día siguiente en Argentina", () => {
    assert.equal(
      claveUtc(hoyEnArgentina(instante(2026, 11, 10, 3))),
      "2026-11-10",
    );
  });

  it("atraviesa el cambio de año", () => {
    assert.equal(
      claveUtc(hoyEnArgentina(instante(2027, 1, 1, 2))),
      "2026-12-31",
    );
    assert.equal(
      claveUtc(hoyEnArgentina(instante(2027, 1, 1, 3))),
      "2027-01-01",
    );
  });

  it("respeta el fin de mes y el 29 de febrero bisiesto", () => {
    assert.equal(
      claveUtc(hoyEnArgentina(instante(2028, 3, 1, 2))),
      "2028-02-29",
    );
  });

  it("devuelve siempre la medianoche UTC exacta del día", () => {
    const casos = [
      {
        ahora: instante(2026, 11, 6, 12, 34, 56, 789),
        esperado: Date.UTC(2026, 10, 6),
      },
      {
        ahora: instante(2026, 11, 10, 2, 59, 59, 999),
        esperado: Date.UTC(2026, 10, 9),
      },
      {
        ahora: instante(2026, 11, 10, 3, 0, 0, 1),
        esperado: Date.UTC(2026, 10, 10),
      },
    ];

    for (const caso of casos) {
      const hoy = hoyEnArgentina(caso.ahora);

      assert.equal(
        hoy.getTime(),
        caso.esperado,
        `El instante ${caso.ahora.toISOString()} debería normalizarse a medianoche UTC`,
      );
      assert.equal(hoy.getUTCHours(), 0);
      assert.equal(hoy.getUTCMinutes(), 0);
      assert.equal(hoy.getUTCSeconds(), 0);
      assert.equal(hoy.getUTCMilliseconds(), 0);
    }
  });

  it("lanza RangeError si la fecha es inválida", () => {
    assert.throws(() => hoyEnArgentina(new Date(Number.NaN)), RangeError);
    assert.throws(() => hoyEnArgentina(new Date("no-es-una-fecha")), RangeError);
  });
});
