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

export function serializarPropiedad(raw: any): PropiedadSerializer {
  return {
    id: raw.id,
    nombre: raw.nombre ?? "",
    descripcion: raw.descripcion ?? "",
    capacidad: raw.capacidad ?? 0,
    precioBase: Number(raw.precioBase) ?? 0,
    promoSemanal: Number(raw.promoSemanal) ?? null,
    precioNocheAlta: Number(raw.precioNocheAlta) ?? 0,
    promoSemanalAlta: Number(raw.promoSemanalAlta) ?? 0,
    precioNocheBaja: Number(raw.precioNocheBaja) ?? 0,
    promoSemanalBaja: Number(raw.promoSemanalBaja) ?? 0,
    fotos: raw.fotos ?? [],
    servicios: raw.servicios ?? [],
    activa: raw.activa ?? false,
    orden: raw.orden ?? 0,
    creadaEn: raw.creadaEn ? new Date(raw.creadaEn) : new Date(),
    actualizadaEn: raw.actualizadaEn ? new Date(raw.actualizadaEn) : new Date(),
  };
}