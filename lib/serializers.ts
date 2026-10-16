export interface PropiedadSerializer {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioBase: number;
  promoSemanal: number | null;
  precioNocheAlta: number;
  promoSemanalAlta: number;
  precioNocheBaja: number;
  promoSemanalBaja: number;
  fotos: string[];
  servicios: string[];
  activa: boolean;
  orden: number;
  creadaEn: Date;
  actualizadaEn: Date;
}

export function obtenerPrecioDesde(
  propiedad: {
    precioNocheAlta: number;
    precioNocheBaja: number;
    precioBase: number;
  }
): number | string {
  const preciosNoVacio: number[] = [];
  if (propiedad.precioNocheAlta > 0) preciosNoVacio.push(propiedad.precioNocheAlta);
  if (propiedad.precioNocheBaja > 0) preciosNoVacio.push(propiedad.precioNocheBaja);

  let precioDesde: number | undefined;
  if (preciosNoVacio.length > 0) {
    precioDesde = Math.min(...preciosNoVacio);
  }
  if (!precioDesde && propiedad.precioBase > 0) {
    precioDesde = propiedad.precioBase;
  }
  if (!precioDesde) {
    return "Consultar precio";
  }
  return precioDesde;
}

export interface PrecioConTemporada {
  precio: number | string;
  temporada: "alta" | "baja" | null;
}

export function obtenerPrecioTemporadaAlta(propiedad: {
  precioNocheAlta: number;
  precioNocheBaja: number;
  precioBase: number;
}): PrecioConTemporada {
  if (propiedad.precioNocheAlta > 0) {
    return { precio: propiedad.precioNocheAlta, temporada: "alta" };
  }
  if (propiedad.precioNocheBaja > 0) {
    return { precio: propiedad.precioNocheBaja, temporada: "baja" };
  }
  return { precio: obtenerPrecioDesde(propiedad), temporada: null };
}

function numeroSeguro(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

export function serializarPropiedad(raw: any): PropiedadSerializer {
  return {
    id: raw.id,
    nombre: raw.nombre ?? "",
    descripcion: raw.descripcion ?? "",
    capacidad: raw.capacidad ?? 0,
    precioBase: Number(raw.precioBase) ?? 0,
    promoSemanal: Number(raw.promoSemanal) ?? null,
    precioNocheAlta: numeroSeguro(raw.precioNocheAlta),
    promoSemanalAlta: numeroSeguro(raw.promoSemanalAlta),
    precioNocheBaja: numeroSeguro(raw.precioNocheBaja),
    promoSemanalBaja: numeroSeguro(raw.promoSemanalBaja),
    fotos: raw.fotos ?? [],
    servicios: raw.servicios ?? [],
    activa: raw.activa ?? false,
    orden: raw.orden ?? 0,
    creadaEn: raw.creadaEn ? new Date(raw.creadaEn) : new Date(),
    actualizadaEn: raw.actualizadaEn ? new Date(raw.actualizadaEn) : new Date(),
  };
}