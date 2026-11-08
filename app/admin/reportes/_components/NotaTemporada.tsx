import { formatearNumero } from "@/lib/reportes/formato";
import type { TemporadaCoberturaReporte } from "@/lib/reportes/tipos";

interface NotaTemporadaProps {
  temporada: TemporadaCoberturaReporte;
}

export default function NotaTemporada({ temporada }: NotaTemporadaProps) {
  return (
    <section
      aria-labelledby="temporada-titulo"
      className="relative overflow-hidden rounded-[var(--radius-lg)] border-2 border-[var(--color-warning-border)] bg-[var(--color-warning)]/15 p-5 shadow-md backdrop-blur-md backdrop-brightness-75"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-surface)]/70 to-transparent"
      />
      <h2
        id="temporada-titulo"
        className="text-lg font-semibold text-[var(--color-surface)]"
      >
        Temporada
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-surface)]/90">
        <span className="font-semibold text-[var(--color-surface)]">
          No disponible:
        </span>{" "}
        {temporada.total === 0
          ? "no hay reservas en el período para evaluar la temporada."
          : `no hay rangos de temporada definidos; solo ${formatearNumero(
              temporada.conTemporada,
            )} de ${formatearNumero(
              temporada.total,
            )} reservas tienen temporada registrada.`}
      </p>
    </section>
  );
}
