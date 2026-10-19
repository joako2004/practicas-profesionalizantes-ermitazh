export type Temporada = "ALTA" | "BAJA";

export type TramoNoches = "UNA_NOCHE" | "DE_DOS_A_SEIS" | "SIETE_O_MAS";

export const NOCHES_MIN = 1;
export const NOCHES_MAX = 30;

export interface PreciosPropiedadUsd {
  precioNocheAltaUsd: number | null;
  precioNocheBajaUsd: number | null;
  precio2a6AltaUsd: number | null;
  precio2a6BajaUsd: number | null;
  promoAlta: number | null;
  promoBaja: number | null;
}

export interface CalcularPrecioInput {
  noches: number;
  temporada: Temporada;
  precios: PreciosPropiedadUsd;
  cotizacionVenta: number | null;
}

export type MotivoSinPrecio = "NOCHES_INVALIDAS" | "SIN_PRECIO";

export interface CalculoPrecioError {
  ok: false;
  motivo: MotivoSinPrecio;
}

export interface CalculoPrecioOk {
  ok: true;
  noches: number;
  temporada: Temporada;
  tramo: TramoNoches;
  precioUnaNocheUsd: number;
  precioNocheBaseUsd: number;
  precioNocheAplicadoUsd: number;
  promoAplicadaPct: number;
  totalUsd: number;
  cotizacionVenta: number | null;
  precioNocheBaseArs: number | null;
  precioNocheAplicadoArs: number | null;
  totalArs: number | null;
}

export type CalculoPrecio = CalculoPrecioOk | CalculoPrecioError;

// Elimina el ruido binario sin perder precisión útil para mostrar precios.
function limpiarRuido(valor: number): number {
  return Number(valor.toPrecision(12));
}

function numeroPositivo(valor: number | null): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? valor : null;
}

function normalizarPromo(valor: number | null): number {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0 && valor <= 100
    ? valor
    : 0;
}

function redondearUsdADosDecimales(valor: number): number {
  const limpio = limpiarRuido(valor);
  return limpiarRuido(Math.round(limpiarRuido(limpio * 100)) / 100);
}

// Los valores son positivos: Math.round redondea la mitad hacia arriba.
export function redondearArsAMiles(valor: number): number {
  return Math.round(Number((valor / 1000).toPrecision(12))) * 1000;
}

export function calcularPrecio(input: CalcularPrecioInput): CalculoPrecio {
  const { noches, temporada, precios, cotizacionVenta } = input;

  // Las noches inválidas tienen prioridad sobre cualquier problema de precio.
  if (!Number.isInteger(noches) || noches < NOCHES_MIN || noches > NOCHES_MAX) {
    return { ok: false, motivo: "NOCHES_INVALIDAS" };
  }

  const esAlta = temporada === "ALTA";
  const precioNoche = numeroPositivo(
    esAlta ? precios.precioNocheAltaUsd : precios.precioNocheBajaUsd,
  );
  if (precioNoche === null) {
    return { ok: false, motivo: "SIN_PRECIO" };
  }

  const precio2a6 = numeroPositivo(
    esAlta ? precios.precio2a6AltaUsd : precios.precio2a6BajaUsd,
  );
  const promo = normalizarPromo(esAlta ? precios.promoAlta : precios.promoBaja);

  let tramo: TramoNoches;
  if (noches === 1) {
    tramo = "UNA_NOCHE";
  } else if (noches <= 6) {
    tramo = "DE_DOS_A_SEIS";
  } else {
    tramo = "SIETE_O_MAS";
  }

  const precioNocheBaseUsd = limpiarRuido(
    tramo === "UNA_NOCHE" ? precioNoche : (precio2a6 ?? precioNoche),
  );
  const promoAplicadaPct = tramo === "SIETE_O_MAS" ? promo : 0;
  const precioNocheAplicadoUsd = limpiarRuido(
    tramo === "SIETE_O_MAS"
      ? (precioNocheBaseUsd * (100 - promoAplicadaPct)) / 100
      : precioNocheBaseUsd,
  );
  const totalUsd = redondearUsdADosDecimales(precioNocheAplicadoUsd * noches);

  const venta = numeroPositivo(cotizacionVenta);
  let precioNocheBaseArs: number | null = null;
  let precioNocheAplicadoArs: number | null = null;
  let totalArs: number | null = null;

  if (venta !== null) {
    precioNocheBaseArs = redondearArsAMiles(precioNocheBaseUsd * venta);
    precioNocheAplicadoArs = redondearArsAMiles(precioNocheAplicadoUsd * venta);
    // El total se calcula desde el precio por noche ya redondeado.
    totalArs = precioNocheAplicadoArs * noches;
  }

  return {
    ok: true,
    noches,
    temporada,
    tramo,
    precioUnaNocheUsd: limpiarRuido(precioNoche),
    precioNocheBaseUsd,
    precioNocheAplicadoUsd,
    promoAplicadaPct,
    totalUsd,
    cotizacionVenta: venta,
    precioNocheBaseArs,
    precioNocheAplicadoArs,
    totalArs,
  };
}
