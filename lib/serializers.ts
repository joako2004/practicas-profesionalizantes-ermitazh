export interface PropiedadSerializer {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioBase: number;
  promoSemanal: number | null;
  servicios: string[];
  activa: boolean;
  orden: number;
  creadaEn: Date;
  actualizadaEn: Date;
}

export function serializarPropiedad(raw: any): PropiedadSerializer {
  return {
    id: raw.id,
    nombre: raw.nombre ?? "",
    descripcion: raw.descripcion ?? "",
    capacidad: raw.capacidad ?? 0,
    precioBase: Number(raw.precioBase) ?? 0,
    promoSemanal: Number(raw.promoSemanal) ?? null,
    servicios: raw.servicios ?? [],
    activa: raw.activa ?? false,
    orden: raw.orden ?? 0,
    creadaEn: raw.creadaEn ? new Date(raw.creadaEn) : new Date(),
    actualizadaEn: raw.actualizadaEn ? new Date(raw.actualizadaEn) : new Date(),
  };
}

