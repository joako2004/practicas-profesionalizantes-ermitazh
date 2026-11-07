import { formatearNumero } from "@/lib/reportes/formato";
import type { TemporadaCoberturaReporte } from "@/lib/reportes/tipos";

interface NotaTemporadaProps {
  temporada: TemporadaCoberturaReporte;
}

export default function NotaTemporada({ temporada }: NotaTemporadaProps) {
  return (
    <section
      aria-labelledby="temporada-titulo"
      className="rounded-[var(--radius-lg)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)]/55 p-5"
    >
      <h2
        id="temporada-titulo"
        className="text-lg font-semibold text-[var(--color-ink)]"
      >
        Temporada
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]/75">
        <span className="font-semibold text-[var(--color-ink)]">
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
