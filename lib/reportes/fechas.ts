const MS_POR_DIA = 86_400_000;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIAS_SEMANA = 7;

export type MesPeriodo = {
  anio: number;
  mes: number;
  clave: string;
};

export function parsearFechaReporte(
  valor: string | null | undefined,
): Date | null {
  if (!valor) {
    return null;
  }

  const coincidencia = FORMATO_FECHA.exec(valor.trim());

  if (!coincidencia) {
    return null;
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return fecha;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha.getTime());
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

export function finExclusivo(hasta: Date): Date {
  return sumarDias(hasta, 1);
}

export function claveFecha(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    return "";
  }

  return [
    fecha.getUTCFullYear().toString().padStart(4, "0"),
    (fecha.getUTCMonth() + 1).toString().padStart(2, "0"),
    fecha.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

export function claveMes(anio: number, mes: number): string {
  return `${anio.toString().padStart(4, "0")}-${mes.toString().padStart(2, "0")}`;
}

export function textoFecha(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) {
    return "";
  }

  return [
    fecha.getUTCDate().toString().padStart(2, "0"),
    (fecha.getUTCMonth() + 1).toString().padStart(2, "0"),
    fecha.getUTCFullYear().toString(),
  ].join("/");
}

export function nochesEntre(ingreso: Date, salida: Date): number {
  if (
    Number.isNaN(ingreso.getTime()) ||
    Number.isNaN(salida.getTime()) ||
    salida.getTime() <= ingreso.getTime()
  ) {
    return 0;
  }

  return Math.round((salida.getTime() - ingreso.getTime()) / MS_POR_DIA);
}

export function nochesDelPeriodo(desde: Date, hasta: Date): number {
  if (
    Number.isNaN(desde.getTime()) ||
    Number.isNaN(hasta.getTime()) ||
    hasta.getTime() < desde.getTime()
  ) {
    return 0;
  }

  return Math.round((hasta.getTime() - desde.getTime()) / MS_POR_DIA) + 1;
}

export function filtroReservasDelPeriodo(
  desde: Date,
  hasta: Date,
): {
  fechaIngreso: { lt: Date };
  fechaSalida: { gt: Date };
} {
  return {
    fechaIngreso: { lt: finExclusivo(hasta) },
    fechaSalida: { gt: desde },
  };
}

export function reservaSolapaPeriodo(
  fechaIngreso: Date,
  fechaSalida: Date,
  desde: Date,
  hasta: Date,
): boolean {
  if (
    Number.isNaN(fechaIngreso.getTime()) ||
    Number.isNaN(fechaSalida.getTime()) ||
    Number.isNaN(desde.getTime()) ||
    Number.isNaN(hasta.getTime()) ||
    fechaSalida.getTime() <= fechaIngreso.getTime() ||
    hasta.getTime() < desde.getTime()
  ) {
    return false;
  }

  return (
    fechaIngreso.getTime() < finExclusivo(hasta).getTime() &&
    fechaSalida.getTime() > desde.getTime()
  );
}

export function nochesDeReservaEnPeriodo(
  fechaIngreso: Date,
  fechaSalida: Date,
  desde: Date,
  hasta: Date,
): string[] {
  if (!reservaSolapaPeriodo(fechaIngreso, fechaSalida, desde, hasta)) {
    return [];
  }

  const inicio = Math.max(fechaIngreso.getTime(), desde.getTime());
  const fin = Math.min(fechaSalida.getTime(), finExclusivo(hasta).getTime());
  const noches: string[] = [];

  for (let cursor = inicio; cursor < fin; cursor += MS_POR_DIA) {
    noches.push(claveFecha(new Date(cursor)));
  }

  return noches;
}

export function mesesDelPeriodo(desde: Date, hasta: Date): MesPeriodo[] {
  if (
    Number.isNaN(desde.getTime()) ||
    Number.isNaN(hasta.getTime()) ||
    hasta.getTime() < desde.getTime()
  ) {
    return [];
  }

  const meses: MesPeriodo[] = [];
  let cursor = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1));
  const fin = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), 1));

  while (cursor.getTime() <= fin.getTime()) {
    const anio = cursor.getUTCFullYear();
    const mes = cursor.getUTCMonth() + 1;
    meses.push({ anio, mes, clave: claveMes(anio, mes) });
    cursor = new Date(Date.UTC(anio, mes, 1));
  }

  return meses;
}

export function indiceDiaSemana(fecha: Date): number {
  return (fecha.getUTCDay() + 6) % DIAS_SEMANA;
}

export function diasSemanaDelPeriodo(desde: Date, hasta: Date): number[] {
  const conteo = Array.from({ length: DIAS_SEMANA }, () => 0);

  if (
    Number.isNaN(desde.getTime()) ||
    Number.isNaN(hasta.getTime()) ||
    hasta.getTime() < desde.getTime()
  ) {
    return conteo;
  }

  for (
    let cursor = desde.getTime();
    cursor <= hasta.getTime();
    cursor += MS_POR_DIA
  ) {
    conteo[indiceDiaSemana(new Date(cursor))] += 1;
  }

  return conteo;
}

export function esMesFuturo(anio: number, mes: number, hoy: Date): boolean {
  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    mes < 1 ||
    mes > 12 ||
    Number.isNaN(hoy.getTime())
  ) {
    return false;
  }

  const inicioMes = Date.UTC(anio, mes - 1, 1);
  const inicioMesActual = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1);

  return inicioMes > inicioMesActual;
}
