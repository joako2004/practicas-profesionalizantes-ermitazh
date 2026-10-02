import { prisma } from "@/lib/prisma";

interface Resena {
  autor: string;
  texto: string;
  puntuacion: number;
  creadaEn: Date;
}

async function getResenasPublicadas(): Promise<Resena[]> {
  return prisma.resena.findMany({
    where: { publicada: true },
    orderBy: { creadaEn: "desc" },
    select: {
      autor: true,
      texto: true,
      puntuacion: true,
      creadaEn: true,
    },
  });
}

export default async function ResenasPage() {
  const resenas = await getResenasPublicadas();

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted-dark)]">
            Reseñas
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Lo que dicen nuestros huéspedes
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-ink)]/60 max-w-2xl mx-auto">
            Experiencias reales de quienes ya disfrutaron su estadía en Cabañas Ermitazh.
          </p>
        </div>

        {resenas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--color-ink)]/60">No hay reseñas publicadas aún.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {resenas.map((resena, index) => (
              <article
                key={`${resena.autor}-${resena.creadaEn.toISOString()}-${index}`}
                className="rounded-[var(--radius-lg)] bg-white p-6 ring-1 ring-[var(--color-border)]"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span
                      key={j}
                      className={`text-lg ${
                        j < resena.puntuacion
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-border)]"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-ink)]/70">
                  &ldquo;{resena.texto}&rdquo;
                </p>
                <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
                  {resena.autor}
                </p>
                <time
                  className="mt-2 block text-xs text-[var(--color-ink)]/40"
                  dateTime={resena.creadaEn.toISOString()}
                >
                  {resena.creadaEn.toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}