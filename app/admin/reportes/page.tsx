import { requireAdmin } from "@/lib/auth/perfil";
import { hoyEnArgentina } from "@/lib/fechas";
import { prisma } from "@/lib/prisma";
import { calcularReporte, periodoDeHistorial } from "@/lib/reportes/calcular";
import {
  claveFecha,
  finExclusivo,
  parsearFechaReporte,
  textoFecha,
} from "@/lib/reportes/fechas";
import type {
  ModoEstadoReporte,
  ReservaReporte,
} from "@/lib/reportes/tipos";
import CalidadDatos from "./_components/CalidadDatos";
import ComoSeCalcula from "./_components/ComoSeCalcula";
import DuracionEstadias from "./_components/DuracionEstadias";
import EncabezadoReportes from "./_components/EncabezadoReportes";
import EstadoVacio from "./_components/EstadoVacio";
import EvolucionMensual from "./_components/EvolucionMensual";
import FiltrosReportes from "./_components/FiltrosReportes";
import NotaTemporada from "./_components/NotaTemporada";
import OcupacionSemana from "./_components/OcupacionSemana";
import PersonasCapacidad from "./_components/PersonasCapacidad";
import ResumenKpis from "./_components/ResumenKpis";
import UsoPorCabana from "./_components/UsoPorCabana";

type ParametrosBusqueda = Promise<
  Record<string, string | string[] | undefined>
>;

function valorUnico(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) {
    return valor[0];
  }

  return valor;
}

function modoEstadoDesde(valor: string | undefined): ModoEstadoReporte {
  return valor === "comprometidas"
    ? "CONFIRMADA_PENDIENTE"
    : "CONFIRMADA";
}

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: ParametrosBusqueda;
}) {
  await requireAdmin();

  const parametros = await searchParams;
  const ahora = new Date();
  const hoy = hoyEnArgentina(ahora);
  const desdeRaw = valorUnico(parametros.desde);
  const hastaRaw = valorUnico(parametros.hasta);
  const propiedadRaw = valorUnico(parametros.propiedad)?.trim() ?? "";
  const historial = valorUnico(parametros.historial) === "1";
  const modoEstado = modoEstadoDesde(valorUnico(parametros.estado));
  const desdeDefault = new Date(Date.UTC(hoy.getUTCFullYear(), 0, 1));
  const hastaDefault = new Date(Date.UTC(hoy.getUTCFullYear(), 11, 31));
  const desdeParseada = parsearFechaReporte(desdeRaw);
  const hastaParseada = parsearFechaReporte(hastaRaw);
  let desde = desdeParseada ?? desdeDefault;
  let hasta = hastaParseada ?? hastaDefault;
  let propiedadId: string | null = propiedadRaw === "" ? null : propiedadRaw;
  let error: string | null = null;

  if (!historial) {
    if (desdeRaw && desdeParseada === null) {
      error = "La fecha desde no es válida.";
    } else if (hastaRaw && hastaParseada === null) {
      error = "La fecha hasta no es válida.";
    } else if (desde.getTime() > hasta.getTime()) {
      error = "La fecha desde no puede ser posterior a la fecha hasta.";
    }
  }

  const propiedadesPromise = prisma.propiedad.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, capacidad: true, activa: true },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });

  if (error) {
    const propiedades = await propiedadesPromise;

    if (
      propiedadId !== null &&
      !propiedades.some((propiedad) => propiedad.id === propiedadId)
    ) {
      propiedadId = null;
    }

    return (
      <div className="space-y-6">
        <EncabezadoReportes subtitulo="Revisá el rango de fechas para generar el reporte." />
        <FiltrosReportes
          propiedades={propiedades}
          desde={claveFecha(desde)}
          hasta={claveFecha(hasta)}
          propiedadId={propiedadId}
          modoEstado={modoEstado}
          historial={historial}
          periodoTexto="Rango inválido"
          error={error}
        />
      </div>
    );
  }

  const whereReservas = historial
    ? {}
    : {
        fechaIngreso: { lt: finExclusivo(desde) },
        fechaSalida: { gt: desde },
      };
  const [propiedades, reservas] = await Promise.all([
    propiedadesPromise,
    prisma.reserva.findMany({
      where: whereReservas,
      select: {
        id: true,
        propiedadId: true,
        fechaIngreso: true,
        fechaSalida: true,
        estado: true,
        personas: true,
        creadaEn: true,
        temporadaAplicada: true,
      },
    }),
  ]);

  if (
    propiedadId !== null &&
    !propiedades.some((propiedad) => propiedad.id === propiedadId)
  ) {
    propiedadId = null;
  }

  if (historial) {
    const periodo = periodoDeHistorial(reservas, {
      desde: desdeDefault,
      hasta: hastaDefault,
    });
    desde = periodo.desde;
    hasta = periodo.hasta;
  }

  const reservasReporte: ReservaReporte[] = reservas;
  const reporte = calcularReporte(
    reservasReporte,
    propiedades,
    { desde, hasta, propiedadId, modoEstado },
    hoy,
  );
  const periodoTexto = `${textoFecha(desde)} al ${textoFecha(hasta)}`;
  const cantidadReservas = reporte.resumen.reservas;
  const sustantivo = cantidadReservas === 1 ? "reserva" : "reservas";
  const prefijo = historial ? "Todo el historial · " : "";

  return (
    <div className="space-y-6">
      <EncabezadoReportes
        subtitulo={`${prefijo}${periodoTexto} · ${cantidadReservas} ${sustantivo}`}
        incluyeFuturo={reporte.resumen.incluyeFuturo}
      />

      <FiltrosReportes
        propiedades={propiedades}
        desde={claveFecha(desde)}
        hasta={claveFecha(hasta)}
        propiedadId={propiedadId}
        modoEstado={modoEstado}
        historial={historial}
        periodoTexto={periodoTexto}
        error={null}
      />

      {cantidadReservas === 0 ? (
        <EstadoVacio
          titulo="No hay reservas en el período seleccionado"
          descripcion="Probá ampliar el rango de fechas o incluir las reservas pendientes."
        />
      ) : null}

      <ResumenKpis resumen={reporte.resumen} modoEstado={modoEstado} />
      <UsoPorCabana
        cabanas={reporte.usoPorCabana}
        incluyeFuturo={reporte.resumen.incluyeFuturo}
      />
      <EvolucionMensual meses={reporte.evolucionMensual} />
      <div className="grid gap-6 lg:grid-cols-2">
        <DuracionEstadias tramos={reporte.duracion} />
        <OcupacionSemana dias={reporte.diasSemana} />
      </div>
      <PersonasCapacidad personas={reporte.personas} />
      <CalidadDatos calidad={reporte.calidad} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ComoSeCalcula />
        <NotaTemporada temporada={reporte.temporada} />
      </div>
    </div>
  );
}
