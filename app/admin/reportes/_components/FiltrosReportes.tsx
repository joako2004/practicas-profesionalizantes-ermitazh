import Link from "next/link";

import type { ModoEstadoReporte } from "@/lib/reportes/tipos";

interface PropiedadFiltro {
  id: string;
  nombre: string;
}

interface FiltrosReportesProps {
  propiedades: PropiedadFiltro[];
  desde: string;
  hasta: string;
  propiedadId: string | null;
  modoEstado: ModoEstadoReporte;
  historial: boolean;
  periodoTexto: string;
  error: string | null;
}

const CLASE_CAMPO =
  "mt-1 min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:bg-[var(--color-bg)] disabled:text-[var(--color-ink)]/50";

const CLASE_ETIQUETA =
  "text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/60";

const CLASE_CHIP =
  "inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-warm)]/25 px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]/80";

export default function FiltrosReportes({
  propiedades,
  desde,
  hasta,
  propiedadId,
  modoEstado,
  historial,
  periodoTexto,
  error,
}: FiltrosReportesProps) {
  const cabanaTexto =
    propiedades.find((propiedad) => propiedad.id === propiedadId)?.nombre ??
    "Todas las cabañas";
  const estadoTexto =
    modoEstado === "CONFIRMADA_PENDIENTE"
      ? "Confirmadas + pendientes"
      : "Solo confirmadas";

  return (
    <section
      aria-label="Filtros del reporte"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <form action="/admin/reportes" method="get">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className={CLASE_ETIQUETA}>Desde</span>
            <input
              type="date"
              name="desde"
              defaultValue={desde}
              disabled={historial}
              aria-invalid={error ? true : undefined}
              className={CLASE_CAMPO}
            />
          </label>

          <label className="block">
            <span className={CLASE_ETIQUETA}>Hasta</span>
            <input
              type="date"
              name="hasta"
              defaultValue={hasta}
              disabled={historial}
              aria-invalid={error ? true : undefined}
              className={CLASE_CAMPO}
            />
          </label>

          <label className="block">
            <span className={CLASE_ETIQUETA}>Cabaña</span>
            <select
              name="propiedad"
              defaultValue={propiedadId ?? ""}
              className={CLASE_CAMPO}
            >
              <option value="">Todas las cabañas</option>
              {propiedades.map((propiedad) => (
                <option key={propiedad.id} value={propiedad.id}>
                  {propiedad.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={CLASE_ETIQUETA}>Estado</span>
            <select
              name="estado"
              defaultValue={modoEstado === "CONFIRMADA_PENDIENTE" ? "comprometidas" : "confirmadas"}
              className={CLASE_CAMPO}
            >
              <option value="confirmadas">Solo confirmadas</option>
              <option value="comprometidas">Confirmadas + pendientes</option>
            </select>
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] active:scale-[0.98]"
            >
              Aplicar
            </button>
            <Link
              href="/admin/reportes"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]/70 transition-colors hover:bg-[var(--color-warm)]/25 hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            >
              Limpiar
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2">
          <input
            id="historial"
            type="checkbox"
            name="historial"
            value="1"
            defaultChecked={historial}
            aria-describedby="historial-ayuda"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
          />
          <label htmlFor="historial" className="text-sm text-[var(--color-ink)]">
            Todo el historial
            <span
              id="historial-ayuda"
              className="mt-0.5 block text-xs leading-5 text-[var(--color-ink)]/60"
            >
              Usa la primera entrada y la última salida registradas. Deshabilita
              las fechas.
            </span>
          </label>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)]/70 pt-4">
          <span className={CLASE_CHIP}>Período: {periodoTexto}</span>
          <span className={CLASE_CHIP}>Cabaña: {cabanaTexto}</span>
          <span className={CLASE_CHIP}>Estado: {estadoTexto}</span>
          {historial ? (
            <span className={CLASE_CHIP}>Todo el historial</span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
