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

interface PropiedadCruda {
  id: string;
  nombre?: string | null;
  descripcion?: string | null;
  capacidad?: number | null;
  promoSemanalAlta?: unknown;
  promoSemanalBaja?: unknown;
  precioNocheAltaUsd?: unknown;
  precioNocheBajaUsd?: unknown;
  precio2a6AltaUsd?: unknown;
  precio2a6BajaUsd?: unknown;
  fotos?: string[] | null;
  servicios?: string[] | null;
  activa?: boolean | null;
  orden?: number | null;
  creadaEn?: Date | string | null;
  actualizadaEn?: Date | string | null;
}

export function serializarPropiedad(raw: unknown): PropiedadSerializer {
  const propiedad = raw as PropiedadCruda;
  return {
    id: propiedad.id,
    nombre: propiedad.nombre ?? "",
    descripcion: propiedad.descripcion ?? "",
    capacidad: propiedad.capacidad ?? 0,
    promoSemanalAlta: numeroOpcional(propiedad.promoSemanalAlta) ?? 0,
    promoSemanalBaja: numeroOpcional(propiedad.promoSemanalBaja) ?? 0,
    precioNocheAltaUsd: numeroOpcional(propiedad.precioNocheAltaUsd),
    precioNocheBajaUsd: numeroOpcional(propiedad.precioNocheBajaUsd),
    precio2a6AltaUsd: numeroOpcional(propiedad.precio2a6AltaUsd),
    precio2a6BajaUsd: numeroOpcional(propiedad.precio2a6BajaUsd),
    fotos: propiedad.fotos ?? [],
    servicios: propiedad.servicios ?? [],
    activa: propiedad.activa ?? false,
    orden: propiedad.orden ?? 0,
    creadaEn: propiedad.creadaEn ? new Date(propiedad.creadaEn) : new Date(),
    actualizadaEn: propiedad.actualizadaEn
      ? new Date(propiedad.actualizadaEn)
      : new Date(),
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