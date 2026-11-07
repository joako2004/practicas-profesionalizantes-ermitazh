import { formatearNumero, formatearPorcentaje } from "@/lib/reportes/formato";
import type { DiaSemanaReporte } from "@/lib/reportes/tipos";
import BarraProgreso from "./BarraProgreso";
import EstadoVacio from "./EstadoVacio";

interface OcupacionSemanaProps {
  dias: DiaSemanaReporte[];
}

export default function OcupacionSemana({ dias }: OcupacionSemanaProps) {
  const sinNoches = dias.every((dia) => dia.noches === 0);

  return (
    <section
      aria-labelledby="ocupacion-semana-titulo"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="mb-5">
        <h2
          id="ocupacion-semana-titulo"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Ocupación por día de semana
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink)]/65">
          Noches ocupadas sobre las noches disponibles de cada día, para las
          cabañas seleccionadas.
        </p>
      </div>

      {sinNoches ? (
        <EstadoVacio
          titulo="Sin noches ocupadas para comparar"
          descripcion="No hay datos de ocupación por día en el período seleccionado."
          compacto
        />
      ) : (
        <div className="divide-y divide-[var(--color-border)]/60">
          {dias.map((dia) => (
            <div
              key={dia.indice}
              className={`py-3 ${
                dia.esMejor
                  ? "rounded-[var(--radius-md)] bg-[var(--color-success-bg)]/45 px-2"
                  : ""
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    {dia.etiqueta}
                  </span>
                  {dia.esFinDeSemana ? (
                    <span className="rounded-[var(--radius-sm)] border border-[var(--color-warm)]/60 bg-[var(--color-warm)]/25 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-ink)]/65">
                      Fin de semana
                    </span>
                  ) : null}
                  {dia.esMejor ? (
                    <span className="rounded-[var(--radius-sm)] border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-success)]">
                      Mejor día
                    </span>
                  ) : null}
                </div>
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {formatearPorcentaje(dia.ocupacion)}
                </span>
              </div>
              <BarraProgreso
                valor={dia.ocupacion}
                etiqueta={`Ocupación del ${dia.etiqueta}: ${formatearPorcentaje(
                  dia.ocupacion,
                )}`}
                tono={dia.esMejor ? "success" : "accent"}
              />
              <p className="mt-1 text-xs text-[var(--color-ink)]/55">
                {formatearNumero(dia.noches)} de{" "}
                {formatearNumero(dia.nochesDisponibles)} noches disponibles
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
