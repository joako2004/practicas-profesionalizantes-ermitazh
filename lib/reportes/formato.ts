const FORMATO_NUMERO = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

const FORMATO_PORCENTAJE = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const FORMATO_PROMEDIO = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatearNumero(valor: number): string {
  return FORMATO_NUMERO.format(Number.isFinite(valor) ? valor : 0);
}

export function formatearPorcentaje(valor: number): string {
  return `${FORMATO_PORCENTAJE.format(Number.isFinite(valor) ? valor : 0)}%`;
}

export function formatearPromedio(valor: number): string {
  return FORMATO_PROMEDIO.format(Number.isFinite(valor) ? valor : 0);
}
