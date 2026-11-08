export type EstadoReservaReporte =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "RECHAZADA"
  | "CANCELADA";

export type TemporadaReporte = "ALTA" | "BAJA";

export type ModoEstadoReporte = "CONFIRMADA" | "CONFIRMADA_PENDIENTE";

export type PropiedadReporte = {
  id: string;
  nombre: string;
  capacidad: number;
  activa: boolean;
};

export type ReservaReporte = {
  id: string;
  propiedadId: string;
  fechaIngreso: Date;
  fechaSalida: Date;
  estado: EstadoReservaReporte;
  personas: number;
  creadaEn: Date;
  temporadaAplicada: TemporadaReporte | null;
};

export type FiltrosReporte = {
  desde: Date;
  hasta: Date;
  propiedadId: string | null;
  modoEstado: ModoEstadoReporte;
};

export type ResumenReporte = {
  nochesOcupadas: number;
  nochesDisponibles: number;
  ocupacionCruda: number;
  ocupacion: number;
  reservas: number;
  estadiaPromedio: number;
  personasPromedio: number;
  totalReservasPeriodo: number;
  canceladas: number;
  rechazadas: number;
  canceladasRechazadasPct: number;
  incluyeFuturo: boolean;
};

export type UsoCabanaReporte = {
  posicion: number;
  propiedadId: string;
  nombre: string;
  capacidad: number;
  reservas: number;
  noches: number;
  nochesDisponibles: number;
  ocupacionCruda: number;
  ocupacion: number;
  estadiaPromedio: number;
  personasPromedio: number;
  utilizacionCapacidad: number;
  esMasUsada: boolean;
};

export type MesReporte = {
  anio: number;
  mes: number;
  clave: string;
  noches: number;
  reservas: number;
  esFuturo: boolean;
};

export type TramoEstadiaReporte = {
  clave: "UNA_NOCHE" | "DOS_A_SEIS" | "SIETE_O_MAS";
  etiqueta: string;
  cantidad: number;
  porcentaje: number;
};

export type DiaSemanaReporte = {
  indice: number;
  etiqueta: string;
  noches: number;
  nochesDisponibles: number;
  ocupacionCruda: number;
  ocupacion: number;
  esFinDeSemana: boolean;
  esMejor: boolean;
};

export type SobrecapacidadReporte = {
  reservaId: string;
  cabana: string;
  fechaIngreso: Date;
  fechaSalida: Date;
  personas: number;
  capacidad: number;
};

export type CalidadDatosReporte = {
  superposiciones: number;
  sobrecapacidad: number;
  creadasDespuesDelCheckIn: number;
  sinTemporada: number;
  ocupacionExcedida: boolean;
  sinInconsistencias: boolean;
};

export type TemporadaCoberturaReporte = {
  conTemporada: number;
  total: number;
};

export type ReporteOcupacion = {
  resumen: ResumenReporte;
  usoPorCabana: UsoCabanaReporte[];
  evolucionMensual: MesReporte[];
  duracion: TramoEstadiaReporte[];
  diasSemana: DiaSemanaReporte[];
  personas: {
    promedio: number;
    utilizacionCapacidadPromedio: number;
    sobrecapacidad: SobrecapacidadReporte[];
  };
  calidad: CalidadDatosReporte;
  temporada: TemporadaCoberturaReporte;
};
