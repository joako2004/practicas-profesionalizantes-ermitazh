import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildReservaWhatsApp } from "./config";

const anioActual = Number(
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).format(new Date())
);

function textoDe(link: string): string {
  return decodeURIComponent(new URL(link).searchParams.get("text") ?? "");
}

describe("buildReservaWhatsApp", () => {
  it("formatea fechas del año actual sin año y sin corrimiento de día", () => {
    const link = buildReservaWhatsApp(
      "Bola 2",
      `${anioActual}-11-10`,
      `${anioActual}-11-13`
    );

    assert.equal(
      textoDe(link),
      "Hola, soy [tu nombre]. Quiero reservar la Bola 2 desde el 10 de noviembre hasta el 13 de noviembre"
    );
  });

  it("muestra el año en ambas fechas cuando es distinto al actual", () => {
    const link = buildReservaWhatsApp(
      "Bola 2",
      `${anioActual + 1}-01-05`,
      `${anioActual + 1}-01-09`
    );
    const texto = textoDe(link);

    assert.ok(
      texto.includes(
        `desde el 5 de enero de ${anioActual + 1} hasta el 9 de enero de ${anioActual + 1}`
      )
    );
  });

  it("muestra el año solo en la fecha cuyo año difiere", () => {
    const link = buildReservaWhatsApp(
      "Bola 2",
      `${anioActual}-12-31`,
      `${anioActual + 1}-01-02`
    );
    const texto = textoDe(link);

    assert.ok(
      texto.includes(
        `desde el 31 de diciembre hasta el 2 de enero de ${anioActual + 1}`
      )
    );
  });

  it("omite las fechas cuando no se reciben", () => {
    const link = buildReservaWhatsApp("Bola 2");

    assert.equal(
      textoDe(link),
      "Hola, soy [tu nombre]. Quiero reservar la Bola 2"
    );
  });

  it("omite las fechas cuando falta la fecha de salida", () => {
    const link = buildReservaWhatsApp("Bola 2", `${anioActual}-11-10`);

    assert.ok(!textoDe(link).includes(" desde el "));
  });

  it("omite las fechas cuando la fecha de ingreso no existe en el calendario", () => {
    const link = buildReservaWhatsApp("Bola 2", "2026-02-30", "2026-03-02");

    assert.ok(!textoDe(link).includes(" desde el "));
  });

  it("omite las fechas cuando el formato no es YYYY-MM-DD", () => {
    const link = buildReservaWhatsApp("Bola 2", "10/11/2026", "13/11/2026");

    assert.ok(!textoDe(link).includes(" desde el "));
  });

  it("arma la búsqueda general con la cantidad de personas", () => {
    const link = buildReservaWhatsApp("", undefined, undefined, 4, true);

    assert.ok(textoDe(link).includes("una cabaña para 4 personas"));
  });
});
