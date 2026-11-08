import { formatearNumero, formatearPorcentaje } from "@/lib/reportes/formato";
import type { TramoEstadiaReporte } from "@/lib/reportes/tipos";
import BarraProgreso, { type TonoBarra } from "./BarraProgreso";
import EstadoVacio from "./EstadoVacio";

const TONOS: TonoBarra[] = ["accent", "accent-medio", "accent-suave"];

interface DuracionEstadiasProps {
  tramos: TramoEstadiaReporte[];
}

export default function DuracionEstadias({
  tramos,
}: DuracionEstadiasProps) {
  const total = tramos.reduce((suma, tramo) => suma + tramo.cantidad, 0);

  return (
    <section
      aria-labelledby="duracion-estadias-titulo"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="mb-5">
        <h2
          id="duracion-estadias-titulo"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Duración de las estadías
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink)]/65">
          Distribución de las reservas según la cantidad de noches.
        </p>
      </div>

      {total === 0 ? (
        <EstadoVacio
          titulo="Sin reservas para distribuir"
          descripcion="No hay estadías en el período y estado seleccionados."
          compacto
        />
      ) : (
        <div className="space-y-5">
          {tramos.map((tramo, indice) => (
            <div key={tramo.clave}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {tramo.etiqueta}
                </span>
                <span className="text-sm text-[var(--color-ink)]/65">
                  {formatearNumero(tramo.cantidad)} reservas ·{" "}
                  {formatearPorcentaje(tramo.porcentaje)}
                </span>
              </div>
              <BarraProgreso
                valor={tramo.porcentaje}
                etiqueta={`${tramo.etiqueta}: ${formatearNumero(
                  tramo.cantidad,
                )} reservas, ${formatearPorcentaje(tramo.porcentaje)}`}
                tono={TONOS[indice] ?? "accent"}
              />
            </div>
          ))}
          <p className="border-t border-[var(--color-border)]/70 pt-4 text-xs text-[var(--color-ink)]/55">
            Total: {formatearNumero(total)}{" "}
            {total === 1 ? "reserva" : "reservas"}
          </p>
        </div>
      )}
    </section>
  );
}
