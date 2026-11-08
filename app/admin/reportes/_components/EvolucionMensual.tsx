import { formatearNumero } from "@/lib/reportes/formato";
import type { MesReporte } from "@/lib/reportes/tipos";
import BarraVertical from "./BarraVertical";
import EstadoVacio from "./EstadoVacio";

const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

interface EvolucionMensualProps {
  meses: MesReporte[];
}

export default function EvolucionMensual({
  meses,
}: EvolucionMensualProps) {
  const maxNoches = Math.max(...meses.map((mes) => mes.noches), 0);
  const hayFuturo = meses.some((mes) => mes.esFuturo);
  const porAnio = new Map<number, MesReporte[]>();

  for (const mes of meses) {
    const lista = porAnio.get(mes.anio) ?? [];
    lista.push(mes);
    porAnio.set(mes.anio, lista);
  }

  return (
    <section
      aria-labelledby="evolucion-mensual-titulo"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="evolucion-mensual-titulo"
            className="text-lg font-semibold text-[var(--color-ink)]"
          >
            Evolución mensual
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink)]/65">
            Noches ocupadas por mes. Las barras se escalan al mes más alto.
          </p>
        </div>
        {hayFuturo ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-ink)]/65">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-[2px] border border-dashed border-[var(--color-warning-border)] bg-[var(--color-warning)]/40"
            />
            Proyectado
          </span>
        ) : null}
      </div>

      {maxNoches === 0 ? (
        <EstadoVacio
          titulo="Sin noches ocupadas en el período"
          descripcion="El gráfico se completará cuando haya reservas con noches dentro del rango."
          compacto
        />
      ) : (
        <>
          <div className="space-y-6">
            {Array.from(porAnio.entries()).map(([anio, mesesAnio]) => (
              <div key={anio}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink)]/55">
                  {anio}
                </h3>
                <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2">
                  {mesesAnio.map((mes) => {
                    const altura =
                      maxNoches > 0 ? (mes.noches / maxNoches) * 100 : 0;

                    return (
                      <div
                        key={mes.clave}
                        className="flex min-w-[3rem] flex-1 flex-col items-center gap-2"
                      >
                        <span className="text-xs font-semibold text-[var(--color-ink)]">
                          {formatearNumero(mes.noches)}
                        </span>
                        <div className="flex h-40 w-full items-end">
                          {mes.noches > 0 ? (
                            <BarraVertical
                              alturaPct={altura}
                              className={
                                mes.esFuturo
                                  ? "border border-dashed border-[var(--color-warning-border)] bg-[var(--color-warning)]/40"
                                  : "bg-[var(--color-accent)]"
                              }
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="h-px w-full bg-[var(--color-border)]"
                            />
                          )}
                        </div>
                        <span
                          className={`text-xs ${
                            mes.esFuturo
                              ? "text-[var(--color-ink)]/45"
                              : "text-[var(--color-ink)]/70"
                          }`}
                        >
                          {NOMBRES_MES[mes.mes - 1].slice(0, 3)}
                        </span>
                        <span className="text-[10px] text-[var(--color-ink)]/50">
                          {formatearNumero(mes.reservas)} reservas
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <details className="mt-5 border-t border-[var(--color-border)]/70 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-ink)]/70 transition-colors hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]">
              Ver datos del gráfico
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-sm">
                <caption className="sr-only">
                  Noches ocupadas y reservas por mes
                </caption>
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-ink)]/55">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Año
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Mes
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Noches
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Reservas
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meses.map((mes) => (
                    <tr
                      key={mes.clave}
                      className="border-b border-[var(--color-border)]/60 last:border-0"
                    >
                      <td className="py-2 pr-3 text-[var(--color-ink)]/75">
                        {mes.anio}
                      </td>
                      <td className="py-2 pr-3 text-[var(--color-ink)]/75">
                        {NOMBRES_MES[mes.mes - 1]}
                      </td>
                      <td className="py-2 pr-3 text-[var(--color-ink)]/75">
                        {formatearNumero(mes.noches)}
                      </td>
                      <td className="py-2 pr-3 text-[var(--color-ink)]/75">
                        {formatearNumero(mes.reservas)}
                      </td>
                      <td className="py-2 text-[var(--color-ink)]/65">
                        {mes.esFuturo ? "Proyectado" : "Registrado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
