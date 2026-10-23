import type { PreciosPropiedadUsd, Temporada } from "./precios/calcular";

export interface PropiedadSerializer {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  promoSemanalAlta: number;
  promoSemanalBaja: number;
  precioNocheAltaUsd: number | null;
  precioNocheBajaUsd: number | null;
  precio2a6AltaUsd: number | null;
  precio2a6BajaUsd: number | null;
  fotos: string[];
  servicios: string[];
  activa: boolean;
  orden: number;
  creadaEn: Date;
  actualizadaEn: Date;
}

// Distingue "sin dato" (null) de 0.
export function numeroOpcional(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string" && valor.trim() === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function serializarPropiedad(raw: any): PropiedadSerializer {
  return {
    id: raw.id,
    nombre: raw.nombre ?? "",
    descripcion: raw.descripcion ?? "",
    capacidad: raw.capacidad ?? 0,
    promoSemanalAlta: numeroOpcional(raw.promoSemanalAlta) ?? 0,
    promoSemanalBaja: numeroOpcional(raw.promoSemanalBaja) ?? 0,
    precioNocheAltaUsd: numeroOpcional(raw.precioNocheAltaUsd),
    precioNocheBajaUsd: numeroOpcional(raw.precioNocheBajaUsd),
    precio2a6AltaUsd: numeroOpcional(raw.precio2a6AltaUsd),
    precio2a6BajaUsd: numeroOpcional(raw.precio2a6BajaUsd),
    fotos: raw.fotos ?? [],
    servicios: raw.servicios ?? [],
    activa: raw.activa ?? false,
    orden: raw.orden ?? 0,
    creadaEn: raw.creadaEn ? new Date(raw.creadaEn) : new Date(),
    actualizadaEn: raw.actualizadaEn ? new Date(raw.actualizadaEn) : new Date(),
  };
}

export type PropiedadConPreciosUsd = Pick<
  PropiedadSerializer,
  | "precioNocheAltaUsd"
  | "precioNocheBajaUsd"
  | "precio2a6AltaUsd"
  | "precio2a6BajaUsd"
  | "promoSemanalAlta"
  | "promoSemanalBaja"
>;

// Es el insumo de calcularPrecio().
export function obtenerPreciosUsd(propiedad: PropiedadConPreciosUsd): PreciosPropiedadUsd {
  return {
    precioNocheAltaUsd: propiedad.precioNocheAltaUsd,
    precioNocheBajaUsd: propiedad.precioNocheBajaUsd,
    precio2a6AltaUsd: propiedad.precio2a6AltaUsd,
    precio2a6BajaUsd: propiedad.precio2a6BajaUsd,
    promoAlta: propiedad.promoSemanalAlta,
    promoBaja: propiedad.promoSemanalBaja,
  };
}

// Devuelve el precio de una noche solo si es un número finito y positivo.
export function obtenerPrecioUnaNocheUsd(
  propiedad: PropiedadConPreciosUsd,
  temporada: Temporada
): number | null {
  const precio =
    temporada === "ALTA" ? propiedad.precioNocheAltaUsd : propiedad.precioNocheBajaUsd;
  return typeof precio === "number" && Number.isFinite(precio) && precio > 0 ? precio : null;
}