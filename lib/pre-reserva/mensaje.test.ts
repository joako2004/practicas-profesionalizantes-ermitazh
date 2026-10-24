import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatearFechaCalendario } from "../config";
import {
  MENSAJES_ERROR_ESTADIA,
  type CotizacionUsadaInfo,
  type EstadiaCalculada,
} from "../precios/estadia";
import {
  armarMensajePreReserva,
  estadoHttpParaMotivo,
  mensajeErrorPreReserva,
  snapshotDesdeEstadia,
  type MotivoErrorHttp,
} from "./mensaje";

const anioActualBA = Number(
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).format(new Date())
);

const fixtureBase: EstadiaCalculada = {
  noches: 7,
  temporada: "ALTA",
  tramo: "SIETE_O_MAS",
  precioUnaNocheUsd: 160,
  precioNocheBaseUsd: 160,
  precioNocheAplicadoUsd: 144,
  promoAplicadaPct: 10,
  totalUsd: 1008,
  precioNocheBaseArs: 251000,
  precioNocheAplicadoArs: 226000,
  totalArs: 1582000,
  cotizacion: {
    tipo: "blue",
    etiqueta: "Dólar blue",
    venta: 1570,
    fechaTexto: "22/10/26 10:00",
    desactualizada: false,
  },
};

describe("formatearFechaCalendario", () => {
  it("formatea una fecha de 2099 con año", () => {
    assert.equal(formatearFechaCalendario("2099-11-10"), "10 de noviembre de 2099");
  });

  it("omite el año cuando coincide con el actual en Buenos Aires", () => {
    assert.equal(
      formatearFechaCalendario(`${anioActualBA}-11-10`),
      "10 de noviembre"
    );
  });

  it("devuelve null para una fecha inexistente", () => {
    assert.equal(formatearFechaCalendario("2099-02-30"), null);
  });

  it("devuelve null cuando no recibe fecha", () => {
    assert.equal(formatearFechaCalendario(undefined), null);
  });
});

describe("armarMensajePreReserva", () => {
  it("arma el mensaje completo con valor estimativo", () => {
    const mensaje = armarMensajePreReserva({
      id: "abc123",
      nombreCabana: "bola 2",
      fechaInicio: "2099-11-10",
      fechaFin: "2099-11-17",
      noches: 7,
      estadia: fixtureBase,
    });

    assert.equal(
      mensaje,
      "Hola, quiero confirmar mi pre-reserva #abc123 de la bola 2 desde el 10 de noviembre de 2099 hasta el 17 de noviembre de 2099 (7 noches). Valor estimativo: $1.582.000, sujeto a confirmación."
    );
  });

  it("agrega el aviso cuando la cotización está desactualizada", () => {
    const estadia: EstadiaCalculada = {
      ...fixtureBase,
      cotizacion: {
        ...fixtureBase.cotizacion!,
        desactualizada: true,
      },
    };

    const mensaje = armarMensajePreReserva({
      id: "abc123",
      nombreCabana: "bola 2",
      fechaInicio: "2099-11-10",
      fechaFin: "2099-11-17",
      noches: 7,
      estadia,
    });

    assert.equal(
      mensaje,
      "Hola, quiero confirmar mi pre-reserva #abc123 de la bola 2 desde el 10 de noviembre de 2099 hasta el 17 de noviembre de 2099 (7 noches). Valor estimativo: $1.582.000, sujeto a confirmación. La cotización del dólar podría estar desactualizada."
    );
  });

  it("usa singular para una noche y consulta el valor sin precio", () => {
    const mensaje = armarMensajePreReserva({
      id: "abc123",
      nombreCabana: "bola 2",
      fechaInicio: "2099-11-10",
      fechaFin: "2099-11-11",
      noches: 1,
      estadia: null,
    });

    assert.equal(
      mensaje,
      "Hola, quiero confirmar mi pre-reserva #abc123 de la bola 2 desde el 10 de noviembre de 2099 hasta el 11 de noviembre de 2099 (1 noche). El valor se consulta."
    );
  });

  it("consulta el valor cuando hay precio en USD pero no cotización", () => {
    const estadia: EstadiaCalculada = {
      ...fixtureBase,
      totalArs: null,
      cotizacion: null,
    };

    const mensaje = armarMensajePreReserva({
      id: "abc123",
      nombreCabana: "bola 2",
      fechaInicio: "2099-11-10",
      fechaFin: "2099-11-17",
      noches: 7,
      estadia,
    });

    assert.ok(mensaje.endsWith(" El valor se consulta."));
    assert.ok(!mensaje.includes("$"));
  });

  it("conserva el texto original cuando una fecha no es válida", () => {
    const mensaje = armarMensajePreReserva({
      id: "abc123",
      nombreCabana: "bola 2",
      fechaInicio: "basura",
      fechaFin: "2099-11-17",
      noches: 7,
      estadia: null,
    });

    assert.ok(mensaje.includes("desde el basura hasta el 17 de noviembre de 2099"));
  });
});

describe("snapshotDesdeEstadia", () => {
  it("arma el snapshot con todos los datos", () => {
    assert.deepEqual(snapshotDesdeEstadia(fixtureBase), {
      totalEstimadoUsd: 1008,
      totalEstimadoArs: 1582000,
      precioNocheUsdAplicado: 144,
      tipoDolarUsado: "blue",
      cotizacionUsada: 1570,
      temporadaAplicada: "ALTA",
      tramoAplicado: "SIETE_O_MAS",
    });
  });

  it("devuelve todos los campos en null cuando no hay estadía", () => {
    assert.deepEqual(snapshotDesdeEstadia(null), {
      totalEstimadoUsd: null,
      totalEstimadoArs: null,
      precioNocheUsdAplicado: null,
      tipoDolarUsado: null,
      cotizacionUsada: null,
      temporadaAplicada: null,
      tramoAplicado: null,
    });
  });

  it("deja en null los campos de pesos cuando no hay cotización", () => {
    const estadia: EstadiaCalculada = {
      ...fixtureBase,
      totalArs: null,
      cotizacion: null,
    };

    assert.deepEqual(snapshotDesdeEstadia(estadia), {
      totalEstimadoUsd: 1008,
      totalEstimadoArs: null,
      precioNocheUsdAplicado: 144,
      tipoDolarUsado: null,
      cotizacionUsada: null,
      temporadaAplicada: "ALTA",
      tramoAplicado: "SIETE_O_MAS",
    });
  });
});

describe("errores de pre-reserva", () => {
  it("mapea cada motivo al status HTTP correspondiente", () => {
    assert.equal(estadoHttpParaMotivo("DATOS_INVALIDOS"), 400);
    assert.equal(estadoHttpParaMotivo("FECHAS_INVALIDAS"), 400);
    assert.equal(estadoHttpParaMotivo("SALIDA_NO_POSTERIOR"), 400);
    assert.equal(estadoHttpParaMotivo("ESTADIA_MUY_LARGA"), 400);
    assert.equal(estadoHttpParaMotivo("CABANA_NO_ENCONTRADA"), 404);
    assert.equal(estadoHttpParaMotivo("ERROR_INTERNO"), 500);
  });

  it("sugiere WhatsApp cuando la estadía supera el máximo", () => {
    assert.equal(
      mensajeErrorPreReserva("ESTADIA_MUY_LARGA"),
      "La pre-reserva online admite hasta 30 noches. Para estadías más largas, consultanos por WhatsApp."
    );
  });

  it("usa los mensajes compartidos para el resto de los motivos", () => {
    const motivos: MotivoErrorHttp[] = [
      "DATOS_INVALIDOS",
      "FECHAS_INVALIDAS",
      "SALIDA_NO_POSTERIOR",
      "CABANA_NO_ENCONTRADA",
      "ERROR_INTERNO",
    ];

    for (const motivo of motivos) {
      assert.equal(mensajeErrorPreReserva(motivo), MENSAJES_ERROR_ESTADIA[motivo]);
    }
  });
});

describe("snapshotDesdeEstadia e inmutabilidad", () => {
  it("no muta la estadía recibida aunque esté congelada", () => {
    const cotizacion: CotizacionUsadaInfo = {
      tipo: "blue",
      etiqueta: "Dólar blue",
      venta: 1570,
      fechaTexto: "22/10/26 10:00",
      desactualizada: false,
    };
    const fixtureCongelado: Readonly<EstadiaCalculada> = Object.freeze({
      ...fixtureBase,
      cotizacion: Object.freeze(cotizacion),
    });
    const antes = structuredClone(fixtureCongelado);

    assert.doesNotThrow(() => snapshotDesdeEstadia(fixtureCongelado));
    assert.deepEqual(fixtureCongelado, antes);
  });
});
