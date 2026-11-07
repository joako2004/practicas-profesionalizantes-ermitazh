import { formatearNumero, formatearPorcentaje, formatearPromedio } from "@/lib/reportes/formato";
import type { ModoEstadoReporte, ResumenReporte } from "@/lib/reportes/tipos";
import BarraProgreso from "./BarraProgreso";
import TarjetaKpi from "./TarjetaKpi";

interface ResumenKpisProps {
  resumen: ResumenReporte;
  modoEstado: ModoEstadoReporte;
}

export default function ResumenKpis({
  resumen,
  modoEstado,
}: ResumenKpisProps) {
  const comprometida = modoEstado === "CONFIRMADA_PENDIENTE";
  const estadoTexto = comprometida
    ? "confirmadas y pendientes"
    : "solo confirmadas";
  const etiquetaOcupacion = comprometida
    ? "Ocupación comprometida"
    : "Ocupación general";
  const cancelaciones = resumen.canceladas + resumen.rechazadas;
  const ocupacionExcedida = resumen.ocupacionCruda > 100;

  return (
    <section aria-label="Indicadores del período">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TarjetaKpi
          etiqueta="Noches ocupadas"
          valor={formatearNumero(resumen.nochesOcupadas)}
          detalle={`de ${formatearNumero(
            resumen.nochesDisponibles,
          )} cabaña-noches disponibles`}
        />
        <TarjetaKpi
          etiqueta="Reservas"
          valor={formatearNumero(resumen.reservas)}
          detalle="Con al menos una noche en el período"
        />
        <TarjetaKpi
          etiqueta={etiquetaOcupacion}
          valor={formatearPorcentaje(resumen.ocupacion)}
          detalle={
            <>
              Promedio ponderado · {estadoTexto}
              {resumen.incluyeFuturo ? (
                <span className="ml-2 inline-flex rounded-[var(--radius-sm)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink)]">
                  Proyectada
                </span>
              ) : null}
              {ocupacionExcedida ? (
                <span className="mt-2 block font-medium text-[var(--color-danger)]">
                  Dato inconsistente: el cálculo crudo es{" "}
                  {formatearPorcentaje(resumen.ocupacionCruda)}.
                </span>
              ) : null}
            </>
          }
          destacada
          tono={ocupacionExcedida ? "danger" : "neutral"}
        >
          <BarraProgreso
            valor={resumen.ocupacion}
            etiqueta={`${etiquetaOcupacion}: ${formatearPorcentaje(
              resumen.ocupacion,
            )}`}
            tono={ocupacionExcedida ? "danger" : "accent"}
          />
        </TarjetaKpi>
        <TarjetaKpi
          etiqueta="Estadía promedio"
          valor={formatearPromedio(resumen.estadiaPromedio)}
          detalle="Noches por reserva"
        />
        <TarjetaKpi
          etiqueta="Personas promedio"
          valor={formatearPromedio(resumen.personasPromedio)}
          detalle="Personas por reserva"
        />
        <TarjetaKpi
          etiqueta="Canceladas + rechazadas"
          valor={formatearPorcentaje(resumen.canceladasRechazadasPct)}
          detalle={`${formatearNumero(resumen.canceladas)} canceladas + ${formatearNumero(
            resumen.rechazadas,
          )} rechazadas de ${formatearNumero(
            resumen.totalReservasPeriodo,
          )} reservas`}
          tono={cancelaciones > 0 ? "danger" : "neutral"}
        />
      </div>
    </section>
  );
}
