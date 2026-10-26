import type { EtiquetasFoto } from "@/lib/fotos/etiquetas";

interface GaleriaFotosProps {
  nombreCabana: string;
  fotos: { url: string; etiquetas: EtiquetasFoto }[];
}

const CLASES_ETIQUETA =
  "inline-flex max-w-full items-center rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-medium leading-tight";

export default function GaleriaFotos({
  nombreCabana,
  fotos,
}: GaleriaFotosProps) {
  if (fotos.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-ink)]/60">
        Esta cabaña todavía no tiene fotos.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {fotos.map((foto, indice) => {
        const numero = indice + 1;
        const esPortada = indice === 0;
        const { etiquetas } = foto;
        const hayEtiquetas =
          etiquetas.compartidaCon.length > 0 ||
          etiquetas.enGaleriaExteriores ||
          etiquetas.fijaEnElSitio ||
          etiquetas.externa;

        return (
          <li
            key={`${foto.url}-${indice}`}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-warm)]/25">
              {/* eslint-disable-next-line @next/next/no-img-element -- La URL viene de la base y puede no estar permitida en next.config.ts. */}
              <img
                src={foto.url}
                alt={`Foto ${numero} de ${nombreCabana}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />

              <span className="absolute left-2 top-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-ink)]/80 px-2 text-xs font-semibold text-white">
                {numero}
              </span>

              {esPortada && (
                <span className="absolute right-2 top-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-2 py-1 text-xs font-semibold text-white">
                  Portada
                </span>
              )}
            </div>

            {hayEtiquetas && (
              <div className="flex flex-wrap gap-1.5 p-3">
                {etiquetas.compartidaCon.length > 0 && (
                  <span
                    className={`${CLASES_ETIQUETA} border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-ink)]`}
                  >
                    Compartida con {etiquetas.compartidaCon.join(", ")}
                  </span>
                )}

                {etiquetas.enGaleriaExteriores && (
                  <span
                    className={`${CLASES_ETIQUETA} border-[var(--color-border)] bg-[var(--color-warm)]/20 text-[var(--color-ink)]`}
                  >
                    En galería
                  </span>
                )}

                {etiquetas.fijaEnElSitio && (
                  <span
                    className={`${CLASES_ETIQUETA} border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]`}
                  >
                    Fija en el sitio
                  </span>
                )}

                {etiquetas.externa && (
                  <span
                    className={`${CLASES_ETIQUETA} border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]`}
                  >
                    URL externa
                  </span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
