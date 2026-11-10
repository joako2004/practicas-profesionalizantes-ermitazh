import { validarPrecioUsd, validarPromoPct } from "@/lib/precios/validar";

function removerTildes(str: string): string {
  const tildes: Record<string, string> = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'ñ': 'n', 'Ñ': 'N',
  };
  return str.replace(/[áéíóúÁÉÍÓÚñÑ]/g, (m) => tildes[m]);
}

function colapsarEspacios(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

export const LIMITES_PROPIEDAD = {
  nombreMax: 80,
  descripcionMax: 2000,
  capacidadMin: 1,
  capacidadMax: 20,
  ordenMax: 9999,
  serviciosMax: 20,
  servicioMax: 40,
} as const;

const NOMBRE_FIELDS: Record<string, string> = {
  precioNocheAltaUsd: "1 noche, temporada alta",
  precioNocheBajaUsd: "1 noche, temporada baja",
  precio2a6AltaUsd: "2 a 6, temporada alta",
  precio2a6BajaUsd: "2 a 6, temporada baja",
};

function validarNombre(texto: string): { ok: boolean; mensaje?: string } {
  const procesado = colapsarEspacios(texto);
  if (procesado.length === 0) {
    return { ok: false, mensaje: "El nombre es obligatorio" };
  }
  if (procesado.length > LIMITES_PROPIEDAD.nombreMax) {
    return { ok: false, mensaje: `El nombre no puede tener más de ${LIMITES_PROPIEDAD.nombreMax} caracteres` };
  }
  return { ok: true };
}

function validarDescripcion(texto: string): { ok: boolean; mensaje?: string } {
  const procesado = colapsarEspacios(texto);
  if (procesado.length === 0) {
    return { ok: false, mensaje: "La descripción es obligatoria" };
  }
  if (procesado.length > LIMITES_PROPIEDAD.descripcionMax) {
    return { ok: false, mensaje: `La descripción no puede tener más de ${LIMITES_PROPIEDAD.descripcionMax} caracteres` };
  }
  return { ok: true };
}

type ResultadoCapacidad =
  | { ok: true; valor: number }
  | { ok: false; mensaje: string };

function validarCapacidad(entrada: unknown): ResultadoCapacidad {
  if (entrada === undefined || entrada === null) {
    return { ok: false, mensaje: "La capacidad es obligatoria." };
  }
  if (typeof entrada !== "string") {
    return { ok: false, mensaje: "La capacidad debe ser un número entero" };
  }
  const trimm = entrada.trim();
  if (trimm.length === 0) {
    return { ok: false, mensaje: "La capacidad es obligatoria." };
  }
  // Rechazar decimales: solo dígitos enteros permitidos
  if (!/^\d+$/.test(trimm)) {
    return { ok: false, mensaje: "La capacidad debe ser un número entero" };
  }
  const valor = parseInt(trimm, 10);
  if (valor < LIMITES_PROPIEDAD.capacidadMin || valor > LIMITES_PROPIEDAD.capacidadMax) {
    return { ok: false, mensaje: `La capacidad debe ser un número entero entre ${LIMITES_PROPIEDAD.capacidadMin} y ${LIMITES_PROPIEDAD.capacidadMax}` };
  }
  return { ok: true, valor };
}

function validarOrden(texto: string): { ok: boolean; mensaje?: string; valor: number | null } {
  const trimm = texto.trim();
  if (trimm.length === 0) {
    return { ok: true, mensaje: undefined, valor: null };
  }
  if (!/^-?\d+$/.test(trimm)) {
    return { ok: false, mensaje: "El orden debe ser un número entero", valor: -1 };
  }
  const valor = parseInt(trimm, 10);
  if (valor < 0 || valor > LIMITES_PROPIEDAD.ordenMax) {
    return { ok: false, mensaje: `El orden debe ser un número entero entre 0 y ${LIMITES_PROPIEDAD.ordenMax}`, valor: -1 };
  }
  return { ok: true, mensaje: undefined, valor };
}

// Procesar servicios: recortar, descartar vacíos, máximo 20, quitar duplicados case-insensitive
function procesarServicios(entradas: string[]): { ok: boolean; mensaje?: string; servicios: string[] } {
  // Recortar cada uno y descartar vacíos
  const recortados: string[] = [];
  for (const s of entradas) {
    const r = s.trim();
    if (r.length === 0) continue;
    if (r.length > LIMITES_PROPIEDAD.servicioMax) {
      return { ok: false, mensaje: `Cada servicio debe tener como máximo ${LIMITES_PROPIEDAD.servicioMax} caracteres`, servicios: [] };
    }
    recortados.push(r);
  }

  // Máximo 20 elementos
  if (recortados.length > LIMITES_PROPIEDAD.serviciosMax) {
    return { ok: false, mensaje: `Máximo ${LIMITES_PROPIEDAD.serviciosMax} servicios`, servicios: [] };
  }

  // Quitar duplicados sin distinguir mayúsculas ni tildes (conservar primera aparición)
  const seen = new Set<string>();
  const únicos: string[] = [];
  for (const s of recortados) {
    const clave = removerTildes(s.toLowerCase());
    if (seen.has(clave)) continue;
    seen.add(clave);
    únicos.push(s);
  }

  return { ok: true, mensaje: undefined, servicios: únicos };
}

// Helper: procesar un campo de precio
function procesarPrecio(valor: unknown, nombreCampo: string): { ok: boolean; valor: number | null; error?: string } {
  if (valor === undefined || valor === null || (typeof valor === "string" && valor.trim() === "")) {
    return { ok: true, valor: null };
  }
  if (typeof valor === "number") {
    const resultado = validarPrecioUsd(valor);
    if (resultado.ok) return { ok: true, valor: resultado.valor };
    return { ok: false, valor: null, error: resultado.error };
  }
  if (typeof valor === "string") {
    const trimm = valor.trim();
    if (trimm.length === 0) {
      return { ok: true, valor: null };
    }
    const num = parseFloat(trimm);
    if (isNaN(num)) {
      return { ok: false, valor: null, error: `El ${nombreCampo} debe ser un número mayor a 0 y hasta 1.000.000` };
    }
    const resultado = validarPrecioUsd(num);
    if (resultado.ok) return { ok: true, valor: resultado.valor };
    return { ok: false, valor: null, error: resultado.error };
  }
  return { ok: false, valor: null, error: `El ${nombreCampo} debe ser un número mayor a 0 y hasta 1.000.000` };
}

// Helper: procesar un campo de promoción
function procesarPromo(valor: unknown): { ok: boolean; valor: number; error?: string } {
  if (valor === undefined || valor === null || (typeof valor === "string" && valor.trim() === "")) {
    return { ok: true, valor: 0 };
  }
  if (typeof valor === "number") {
    const resultado = validarPromoPct(valor);
    if (resultado.ok) return { ok: true, valor: resultado.valor as number };
    return { ok: false, valor: 0, error: resultado.error };
  }
  if (typeof valor === "string") {
    const trimm = valor.trim();
    if (trimm.length === 0) {
      return { ok: true, valor: 0 };
    }
    const num = parseFloat(trimm);
    if (isNaN(num)) {
      return { ok: false, valor: 0, error: "La promoción debe ser un número entre 0 y 100" };
    }
    const resultado = validarPromoPct(num);
    if (resultado.ok) return { ok: true, valor: resultado.valor as number };
    return { ok: false, valor: 0, error: resultado.error };
  }
  return { ok: false, valor: 0, error: "La promoción debe ser un número entre 0 y 100" };
}

export function claveNombre(nombre: string): string {
  const bajo = nombre.toLowerCase();
  const sinTildes = removerTildes(bajo);
  return colapsarEspacios(sinTildes);
}

export function validarNuevaPropiedad(entrada: unknown): {
  ok: true;
  valor: {
    nombre: string;
    descripcion: string;
    capacidad: number;
    orden: number | null;
    activa: boolean;
    servicios: string[];
    precioNocheAltaUsd: number | null;
    precioNocheBajaUsd: number | null;
    precio2a6AltaUsd: number | null;
    precio2a6BajaUsd: number | null;
    promoSemanalAlta: number;
    promoSemanalBaja: number;
  };
} | {
  ok: false;
  errores: {
    nombre?: string;
    descripcion?: string;
    capacidad?: string;
    orden?: string;
    servicios?: string;
    precioNocheAltaUsd?: string;
    precioNocheBajaUsd?: string;
    precio2a6AltaUsd?: string;
    precio2a6BajaUsd?: string;
    promoSemanalAlta?: string;
    promoSemanalBaja?: string;
    general?: string;
  };
} {
  // 1. Validar que la entrada sea un objeto
  if (entrada === null || entrada === undefined || typeof entrada !== "object" || Array.isArray(entrada)) {
    return {
      ok: false,
      errores: { general: "La entrada debe ser un objeto" },
    };
  }

  const obj = entrada as Record<string, unknown>;
  const errores: Record<string, string> = {};

  // 2. Validar nombre (obligatorio, string)
  const nombreRaw = obj.nombre as string;
  if (typeof nombreRaw !== "string") {
    // This branch shouldn't be reached due to the cast, but TypeScript doesn't know that
    errores.nombre = "El nombre es obligatorio";
  } else {
    const res = validarNombre(nombreRaw);
    if (!res.ok) {
      errores.nombre = res.mensaje!;
    }
  }

  // 3. Validar descripción (obligatoria, string)
  const descRaw = obj.descripcion as string;
  if (typeof descRaw !== "string") {
    errores.descripcion = "La descripción es obligatoria";
  } else {
    const res = validarDescripcion(descRaw);
    if (!res.ok) {
      errores.descripcion = res.mensaje!;
    }
  }

  // 4. Validar capacidad (obligatoria, entero 1-20)
  const capacidadRes = validarCapacidad(obj.capacidad);
  if (!capacidadRes.ok) {
    errores.capacidad = capacidadRes.mensaje;
  }

  // 5. Validar orden (opcional, entero 0-9999, vacío = null)
  const ordenRaw = obj.orden;
  if (typeof ordenRaw === "undefined") {
    // Campo faltando, tratar como vacío = null (ok, se usará null)
  } else if (typeof ordenRaw !== "string") {
    errores.orden = "El orden debe ser un número entero";
  } else {
    const res = validarOrden(ordenRaw);
    if (!res.ok) {
      errores.orden = res.mensaje!;
    }
  }

  // 6. Validar activa (boolean, por defecto false si no viene o no es boolean)
  const activaRaw = obj.activa;
  if (activaRaw === undefined) {
    // viene undefined, usar false por defecto
  } else if (typeof activaRaw !== "boolean") {
    errores.activa = "La activa debe ser un booleano";
  }

  // 7. Validar servicios (opcional, máximo 20, cada uno 1-40 sin vacíos, sin duplicados case-insensitive)
  const serviciosRaw = obj.servicios;
  if (Array.isArray(serviciosRaw)) {
    const res = procesarServicios(serviciosRaw as string[]);
    if (!res.ok) {
      errores.servicios = res.mensaje!;
    }
  } else if (serviciosRaw !== undefined) {
    errores.servicios = "Los servicios deben ser un arreglo";
  }

  // 8. Validar precios en USD (4 campos)
  for (const campo of ["precioNocheAltaUsd", "precioNocheBajaUsd", "precio2a6AltaUsd", "precio2a6BajaUsd"] as const) {
    const raw = obj[campo];
    const res = procesarPrecio(raw, NOMBRE_FIELDS[campo]);
    if (!res.ok) {
      errores[campo] = res.error!;
    }
  }

  // 9. Validar promociones semanales (2 campos)
  for (const campo of ["promoSemanalAlta", "promoSemanalBaja"] as const) {
    const raw = obj[campo];
    const res = procesarPromo(raw);
    if (!res.ok) {
      errores[campo] = res.error!;
    }
  }

  // Si hay errores, devolverlos todos (no solo el primero)
  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  // La capacidad es obligatoria: si no hay errores, ya está validada como
  // entero dentro del rango, pero TypeScript necesita el estrechamiento.
  if (!capacidadRes.ok) {
    return { ok: false, errores: { capacidad: capacidadRes.mensaje } };
  }

  // 10. Construir el valor limpio (solo si no hay errores)
  // Nombre: colapsar espacios
  const nombreProcesado = colapsarEspacios(nombreRaw.trim());

  // Descripción: colapsar espacios
  const descripcionProcesada = colapsarEspacios(descRaw.trim());

  // Orden: si viene vacío string, null; si viene número string válido, el número; si es undefined, null
  let ordenFinal: number | null = null;
  if (typeof ordenRaw === "string" && ordenRaw.trim() !== "") {
    ordenFinal = parseInt(ordenRaw.trim(), 10);
  }

  // Activa: false por defecto si viene undefined o distinto de true
  const activaBool = activaRaw === true;

  // Servicios: procesar (recortar, quitar vacíos, remover duplicados)
  let serviciosLimpios: string[] = [];
  if (Array.isArray(serviciosRaw)) {
    const res = procesarServicios(serviciosRaw as string[]);
    serviciosLimpios = res.servicios;
  }

  // Precios: ya validados, obtener valores
  const precios: Record<string, number | null> = {
    precioNocheAltaUsd: null,
    precioNocheBajaUsd: null,
    precio2a6AltaUsd: null,
    precio2a6BajaUsd: null,
  };
  for (const campo of ["precioNocheAltaUsd", "precioNocheBajaUsd", "precio2a6AltaUsd", "precio2a6BajaUsd"] as const) {
    const raw = obj[campo];
    const res = procesarPrecio(raw, NOMBRE_FIELDS[campo]);
    precios[campo] = res.valor;
  }

  // Promociones semanales
  const promoAltaRes = procesarPromo(obj.promoSemanalAlta);
  const promoBajaRes = procesarPromo(obj.promoSemanalBaja);

  return {
    ok: true,
    valor: {
      nombre: nombreProcesado,
      descripcion: descripcionProcesada,
      capacidad: capacidadRes.valor,
      orden: ordenFinal,
      activa: activaBool,
      servicios: serviciosLimpios,
      precioNocheAltaUsd: precios.precioNocheAltaUsd,
      precioNocheBajaUsd: precios.precioNocheBajaUsd,
      precio2a6AltaUsd: precios.precio2a6AltaUsd,
      precio2a6BajaUsd: precios.precio2a6BajaUsd,
      promoSemanalAlta: promoAltaRes.valor,
      promoSemanalBaja: promoBajaRes.valor,
    },
  };
}