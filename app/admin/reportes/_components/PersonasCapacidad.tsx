import {
  formatearNumero,
  formatearPorcentaje,
  formatearPromedio,
} from "@/lib/reportes/formato";
import { textoFecha } from "@/lib/reportes/fechas";
import type { ReporteOcupacion } from "@/lib/reportes/tipos";

interface PersonasCapacidadProps {
  personas: ReporteOcupacion["personas"];
}

const LIMITE_LISTADO = 8;

export default function PersonasCapacidad({
  personas,
}: PersonasCapacidadProps) {
  const casos = personas.sobrecapacidad;
  const restantes = Math.max(0, casos.length - LIMITE_LISTADO);

  return (
    <section
      aria-labelledby="personas-capacidad-titulo"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="mb-5">
        <h2
          id="personas-capacidad-titulo"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Personas y capacidad
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink)]/65">
          Promedios sobre las reservas seleccionadas. La utilización compara la
          cantidad de personas con la capacidad de cada cabaña.
        </p>
      </div>

      <dl className="grid gap-4 border-b border-[var(--color-border)]/70 pb-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/55">
            Personas promedio
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">
            {formatearPromedio(personas.promedio)}
          </dd>
          <p className="text-xs text-[var(--color-ink)]/55">por reserva</p>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/55">
            Utilización de capacidad
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">
            {formatearPorcentaje(personas.utilizacionCapacidadPromedio)}
          </dd>
          <p className="text-xs text-[var(--color-ink)]/55">
            promedio de personas sobre capacidad
          </p>
        </div>
      </dl>

      <div className="pt-5">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          Reservas por encima de la capacidad
          {casos.length > 0 ? (
            <span className="ml-2 rounded-[var(--radius-sm)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-danger)]">
              {formatearNumero(casos.length)}
            </span>
          ) : null}
        </h3>

        {casos.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-3 py-2 text-sm text-[var(--color-success)]">
            Ninguna reserva supera la capacidad de su cabaña.
          </p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-[var(--color-border)]/60">
              {casos.slice(0, LIMITE_LISTADO).map((caso) => (
                <li
                  key={caso.reservaId}
                  className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="font-medium text-[var(--color-ink)]">
                    {caso.cabana}
                  </span>
                  <span className="text-xs text-[var(--color-ink)]/60">
                    {textoFecha(caso.fechaIngreso)} al{" "}
                    {textoFecha(caso.fechaSalida)}
                  </span>
                  <span className="text-xs font-medium text-[var(--color-danger)]">
                    {formatearNumero(caso.personas)} personas / capacidad{" "}
                    {formatearNumero(caso.capacidad)}
                  </span>
                </li>
              ))}
            </ul>
            {restantes > 0 ? (
              <p className="mt-2 text-xs text-[var(--color-ink)]/55">
                y {formatearNumero(restantes)}{" "}
                {restantes === 1 ? "caso más" : "casos más"}.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
