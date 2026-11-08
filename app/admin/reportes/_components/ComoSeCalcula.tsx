const DEFINICIONES = [
  {
    termino: "Noche ocupada",
    definicion:
      "Cada noche de una cabaña con al menos una reserva del período. El día de salida no cuenta como noche ocupada.",
  },
  {
    termino: "Noches únicas",
    definicion:
      "Cada combinación de cabaña y fecha se cuenta una sola vez, aunque haya reservas superpuestas.",
  },
  {
    termino: "Período",
    definicion:
      "Rango consultado con desde y hasta incluidos. Las noches se cuentan desde el check-in hasta el día anterior al check-out.",
  },
  {
    termino: "Noches disponibles",
    definicion:
      "Días del período por la cantidad de cabañas activas incluidas en el reporte.",
  },
  {
    termino: "Ocupación",
    definicion:
      "Noches únicas ocupadas dividido por las noches disponibles. El valor visual tiene un tope del 100%; si el cálculo crudo lo supera, se muestra una alerta.",
  },
  {
    termino: "Promedio ponderado",
    definicion:
      "Ocupación acumulada de todas las cabañas: se suman sus noches ocupadas y sus noches disponibles antes de dividir. No es el promedio simple de los porcentajes por cabaña.",
  },
  {
    termino: "Reserva del período",
    definicion:
      "Reserva con al menos una noche dentro del rango. Una reserva que solo coincide en su día de salida no se incluye.",
  },
  {
    termino: "Estados",
    definicion:
      "La ocupación usa las reservas confirmadas o, si se elige, confirmadas y pendientes. Canceladas y rechazadas se excluyen de la ocupación, pero se cuentan en el indicador de cancelaciones y en el total del período.",
  },
  {
    termino: "Temporada",
    definicion:
      "Cobertura de temporada registrada en las reservas incluidas. Este reporte no calcula ocupación por temporada.",
  },
] as const;

export default function ComoSeCalcula() {
  return (
    <details className="group rounded-[var(--radius-lg)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] shadow-sm transition-colors hover:border-[var(--color-warning)] hover:ring-2 hover:ring-[var(--color-warning-border)]/40 focus-within:border-[var(--color-warning)]">
      <summary className="flex cursor-pointer list-none items-center gap-4 rounded-[var(--radius-lg)] px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-warning-bg)] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning)]/15 text-xl font-semibold text-[var(--color-warning)] ring-4 ring-[var(--color-warning)]/10"
        >
          ?
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--color-ink)]">
            Cómo se calcula
          </span>
          <span className="mt-0.5 block text-sm text-[var(--color-ink)]/70 group-open:hidden">
            Ver criterio
          </span>
          <span className="mt-0.5 hidden text-sm text-[var(--color-ink)]/70 group-open:block">
            Ocultar criterio
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0 text-[var(--color-ink)]/70 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <dl className="grid gap-x-6 gap-y-4 border-t border-[var(--color-warning-border)]/60 px-4 pb-5 pt-4 text-sm sm:grid-cols-2 sm:px-5">
        {DEFINICIONES.map((definicion) => (
          <div key={definicion.termino} className="min-w-0">
            <dt className="font-medium text-[var(--color-ink)]">
              {definicion.termino}
            </dt>
            <dd className="mt-1 text-[var(--color-ink)]/70">
              {definicion.definicion}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
