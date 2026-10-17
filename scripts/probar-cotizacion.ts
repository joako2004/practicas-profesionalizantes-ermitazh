// Script TEMPORAL de prueba del servicio de cotización (P3).
// Se ejecuta con: npx tsx scripts/probar-cotizacion.ts
// Si no toma DATABASE_URL del .env: npx tsx --env-file=.env scripts/probar-cotizacion.ts
// Escribe únicamente en la tabla cotizaciones (uso previsto de esa caché). Se borra al cierre del módulo.

import { prisma } from "@/lib/prisma";
import {
  ETIQUETAS_TIPO_DOLAR,
  TIPOS_DOLAR,
  TIPO_DOLAR_DEFECTO,
  esTipoDolar,
  obtenerCotizacion,
  obtenerCotizacionActiva,
  obtenerCotizaciones,
  obtenerTipoDolarActivo,
  parsearRespuestaApi,
  reiniciarBackoffCotizacion,
} from "@/lib/cotizacion";

let pass = 0;
let fail = 0;

function verificar(nombre: string, condicion: boolean): void {
  if (condicion) {
    pass += 1;
    console.log(`PASS  ${nombre}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${nombre}`);
  }
}

// 1. parsearRespuestaApi con entradas inválidas y con un array válido
function probarParser(): void {
  verificar("parsearRespuestaApi(null) devuelve []", parsearRespuestaApi(null).length === 0);
  verificar(
    "parsearRespuestaApi(objeto no array) devuelve []",
    parsearRespuestaApi({ casa: "blue", venta: 1500 }).length === 0
  );

  const mezcla = [
    null,
    "texto",
    42,
    { casa: "blue", venta: 0 },
    { casa: "oficial", venta: "1500" },
    { casa: "casa-desconocida", venta: 1500 },
    { casa: "cripto", venta: 1200, fechaActualizacion: "no-es-fecha" },
  ];
  const purificado = parsearRespuestaApi(mezcla);
  verificar(
    "items inválidos se ignoran y cripto queda con fechaApi null",
    purificado.length === 1 &&
      purificado[0].tipo === "cripto" &&
      purificado[0].venta === 1200 &&
      purificado[0].fechaApi === null
  );

  const valido = [
    {
      moneda: "USD",
      casa: "blue",
      nombre: "Blue",
      compra: 1535,
      venta: 1555,
      fechaActualizacion: "2026-10-17T12:00:00.000Z",
    },
    { moneda: "USD", casa: "oficial", nombre: "Oficial", compra: "no-numero", venta: 1500 },
    { moneda: "USD", casa: "blue", nombre: "Blue repetido", compra: 1, venta: 9999 },
  ];
  const parseado = parsearRespuestaApi(valido);
  verificar("array válido devuelve 2 casas", parseado.length === 2);
  verificar(
    "casa repetida: conserva la primera (blue = 1555)",
    parseado[0].tipo === "blue" && parseado[0].venta === 1555
  );
  verificar(
    "compra no numérica queda en null",
    parseado[1].tipo === "oficial" && parseado[1].compra === null
  );
  verificar(
    "fechaActualizacion válida se convierte a Date",
    parseado[0].fechaApi instanceof Date && !Number.isNaN(parseado[0].fechaApi.getTime())
  );
}

async function main(): Promise<void> {
  probarParser();

  // 2. obtenerCotizaciones()
  console.log("\n--- Cotizaciones obtenidas ---");
  const cotizaciones = await obtenerCotizaciones();
  for (const cotizacion of cotizaciones) {
    console.log(
      `${cotizacion.tipo}: venta=${cotizacion.venta} desactualizada=${cotizacion.desactualizada} obtenidaEn=${cotizacion.obtenidaEn.toISOString()}`
    );
  }
  verificar("hay cotización de blue", cotizaciones.some((c) => c.tipo === "blue"));
  verificar("hay cotización de oficial", cotizaciones.some((c) => c.tipo === "oficial"));
  const indices = cotizaciones.map((c) => TIPOS_DOLAR.indexOf(c.tipo));
  verificar(
    "el orden respeta TIPOS_DOLAR",
    indices.every((indice, i) => i === 0 || indice > indices[i - 1])
  );

  // 3. Caché: la segunda llamada debe reutilizar la fila sin refrescar obtenidaEn
  const primera = await obtenerCotizacion("blue");
  const segunda = await obtenerCotizacion("blue");
  verificar(
    "caché: dos llamadas seguidas comparten obtenidaEn",
    primera !== null &&
      segunda !== null &&
      primera.obtenidaEn.getTime() === segunda.obtenidaEn.getTime()
  );

  // 4. Fallback: vencemos la fila de oficial y simulamos la API caída
  reiniciarBackoffCotizacion();
  await prisma.cotizacion.update({
    where: { tipo: "oficial" },
    data: { obtenidaEn: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  });
  const filaOficial = await prisma.cotizacion.findUnique({ where: { tipo: "oficial" } });
  const ventaEsperada = filaOficial ? filaOficial.venta.toNumber() : 0;

  const fetchReal = globalThis.fetch;
  let llamadasFetch = 0;
  const fetchCaido: typeof fetch = () => {
    llamadasFetch += 1;
    return Promise.reject(new Error("API simulada caída"));
  };
  globalThis.fetch = fetchCaido;
  try {
    const enFallback = await obtenerCotizacion("oficial");
    verificar(
      "fallback: conserva la última venta guardada",
      enFallback !== null && enFallback.venta === ventaEsperada
    );
    verificar(
      "fallback: se marca desactualizada",
      enFallback !== null && enFallback.desactualizada === true
    );
    verificar("falla de API: se intentó 1 vez", llamadasFetch === 1);

    // 5. Backoff: durante los 5 minutos posteriores al fallo no se vuelve a llamar a la API
    const enBackoff = await obtenerCotizacion("oficial");
    await obtenerCotizaciones();
    verificar("backoff: no reintenta la API", llamadasFetch === 1);
    verificar(
      "backoff: sigue sirviendo el valor guardado",
      enBackoff !== null && enBackoff.venta === ventaEsperada && enBackoff.desactualizada === true
    );
  } finally {
    globalThis.fetch = fetchReal;
  }

  // 6. Recuperación: con la API real vuelve a quedar vigente
  reiniciarBackoffCotizacion();
  const recuperada = await obtenerCotizacion("oficial");
  verificar(
    "recuperación: desactualizada vuelve a false",
    recuperada !== null && recuperada.desactualizada === false
  );

  // 7. Backoff: una respuesta HTTP no ok también lo activa
  reiniciarBackoffCotizacion();
  await prisma.cotizacion.update({
    where: { tipo: "oficial" },
    data: { obtenidaEn: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  });

  let llamadasHttpNoOk = 0;
  const respuestaNoOk = { ok: false, status: 503 } as Response;
  const fetchNoOk: typeof fetch = () => {
    llamadasHttpNoOk += 1;
    return Promise.resolve(respuestaNoOk);
  };
  globalThis.fetch = fetchNoOk;
  try {
    const conErrorHttp = await obtenerCotizacion("oficial");
    verificar(
      "HTTP no ok: conserva la última venta guardada",
      conErrorHttp !== null &&
        conErrorHttp.venta === ventaEsperada &&
        conErrorHttp.desactualizada === true
    );
    verificar("HTTP no ok: se intentó 1 vez", llamadasHttpNoOk === 1);

    await obtenerCotizacion("oficial");
    verificar("HTTP no ok: el backoff evita el reintento", llamadasHttpNoOk === 1);
  } finally {
    globalThis.fetch = fetchReal;
  }

  // 8. Se deja la fila oficial refrescada con el fetch real
  reiniciarBackoffCotizacion();
  const recuperadaHttp = await obtenerCotizacion("oficial");
  verificar(
    "recuperación tras HTTP no ok: desactualizada vuelve a false",
    recuperadaHttp !== null && recuperadaHttp.desactualizada === false
  );

  // 9. Lista blanca y tipo de dólar activo
  verificar("esTipoDolar('blue') es true", esTipoDolar("blue"));
  verificar("esTipoDolar('dolar-blue') es false", !esTipoDolar("dolar-blue"));
  verificar("esTipoDolar(42) es false", !esTipoDolar(42));
  verificar(
    "ETIQUETAS_TIPO_DOLAR cubre los 7 tipos",
    TIPOS_DOLAR.every(
      (tipo) => typeof ETIQUETAS_TIPO_DOLAR[tipo] === "string" && ETIQUETAS_TIPO_DOLAR[tipo].length > 0
    )
  );

  const tipoActivo = await obtenerTipoDolarActivo();
  verificar(
    `obtenerTipoDolarActivo() devuelve "${TIPO_DOLAR_DEFECTO}" con la configuración actual`,
    tipoActivo === TIPO_DOLAR_DEFECTO
  );

  const activa = await obtenerCotizacionActiva();
  verificar(
    "obtenerCotizacionActiva devuelve la cotización del tipo activo",
    activa !== null && activa.tipo === tipoActivo
  );
}

main()
  .catch((error: unknown) => {
    fail += 1;
    console.error("FAIL  error inesperado:", error instanceof Error ? error.message : error);
  })
  .finally(async () => {
    console.log(`\nResumen: ${pass} PASS, ${fail} FAIL`);
    await prisma.$disconnect();
    process.exit(fail > 0 ? 1 : 0);
  });
