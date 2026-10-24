export type CampoUsd =
  | "precioNocheAltaUsd"
  | "precioNocheBajaUsd"
  | "precio2a6AltaUsd"
  | "precio2a6BajaUsd";

export const CAMPOS_USD: readonly CampoUsd[] = [
  "precioNocheAltaUsd",
  "precioNocheBajaUsd",
  "precio2a6AltaUsd",
  "precio2a6BajaUsd",
];

export const PRECIO_USD_MAX = 1_000_000;

export type ResultadoValidacion = { ok: true; valor: number | null } | { ok: false; error: string };

// Redondeo a 2 decimales evitando el ruido binario del punto flotante.
// Los valores diminutos se tratan como 0 para no romper el truco del exponente
// (String(1e-7) usa notación exponencial y "1e-7e2" no es un número válido).
function redondear2(n: number): number {
  if (Math.abs(n) < 0.005) {
    return 0;
  }
  const redondeado = Number(Math.round(Number(n + "e2")) + "e-2");
  // Normaliza -0 a 0.
  return redondeado === 0 ? 0 : redondeado;
}

export function esCampoUsd(campo: unknown): campo is CampoUsd {
  return CAMPOS_USD.some((nombre) => nombre === campo);
}

export function validarPrecioUsd(valor: unknown): ResultadoValidacion {
  if (valor === undefined) {
    return { ok: false, error: "Falta el valor del precio en USD" };
  }
  if (valor === null) {
    return { ok: true, valor: null };
  }
  if (typeof valor === "string") {
    // Solo se admite el string vacío como sinónimo de "vaciar el precio".
    if (valor.trim() === "") {
      return { ok: true, valor: null };
    }
    return { ok: false, error: "El precio en USD debe ser un número mayor a 0 y hasta 1.000.000" };
  }
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return { ok: false, error: "El precio en USD debe ser un número mayor a 0 y hasta 1.000.000" };
  }
  if (valor <= 0 || valor < 0.005) {
    return { ok: false, error: "El precio en USD debe ser un número mayor a 0 y hasta 1.000.000" };
  }
  // El tope se compara contra el valor crudo, antes de redondear.
  if (valor > PRECIO_USD_MAX) {
    return { ok: false, error: "El precio en USD debe ser un número mayor a 0 y hasta 1.000.000" };
  }
  return { ok: true, valor: redondear2(valor) };
}

export function validarPromoPct(valor: unknown): ResultadoValidacion {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0 || valor > 100) {
    return { ok: false, error: "La promoción debe ser un número entre 0 y 100" };
  }
  return { ok: true, valor: redondear2(valor) };
}
