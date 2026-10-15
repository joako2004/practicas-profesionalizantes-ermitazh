interface ResenaItem {
  id: string;
  autor: string;
  texto: string;
  puntuacion: number;
  creadaEn: Date;
}

interface ResenasListaProps {
  resenas: ResenaItem[];
  promedio: number | null;
  total: number;
}

const promedioFmt = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const fechaFmt = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

function Estrellas({ puntuacion }: { puntuacion: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${puntuacion} de 5 estrellas`}
    >
      {Array.from({ length: 5 }).map((_, j) => (
        <span
          key={j}
          className={`text-lg ${
            j < puntuacion
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-border)]"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ResenasLista({
  resenas,
  promedio,
  total,
}: ResenasListaProps) {
  return (
    <section aria-labelledby="resenas-titulo">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="resenas-titulo"
          className="text-lg font-semibold text-[var(--color-ink)]"
        >
          Reseñas
        </h2>
        {promedio !== null && total > 0 && (
          <p className="text-sm font-medium text-[var(--color-ink)]">
            <span className="text-[var(--color-accent)]">
              {promedioFmt.format(promedio)} ★
            </span>{" "}
            ({total} {total === 1 ? "reseña" : "reseñas"})
          </p>
        )}
      </div>

      {resenas.length === 0 ? (
        <p className="text-sm text-[var(--color-ink)]/60">
          Todavía no hay reseñas para esta cabaña.
        </p>
      ) : (
        <ul className="space-y-4">
          {resenas.map((r) => (
            <li
              key={r.id}
              className="rounded-[var(--radius-lg)] bg-white p-6 ring-1 ring-[var(--color-border)]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <Estrellas puntuacion={r.puntuacion} />
                <span className="text-xs text-[var(--color-ink)]/50">
                  {fechaFmt.format(r.creadaEn)}
                </span>
              </div>
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-[var(--color-ink)]/70">
                {r.texto}
              </p>
              <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
                {r.autor}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}