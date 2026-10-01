interface Testimonial {
  autor: string;
  texto: string;
  puntuacion: number;
}

interface TestimonialsSectionProps {
  testimonios: Testimonial[];
}

export default function TestimonialsSection({
  testimonios,
}: TestimonialsSectionProps) {
  if (testimonios.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted-dark)]">
            Testimonios
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Lo que dicen nuestros huéspedes
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonios.map((t, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] bg-white p-6 ring-1 ring-[var(--color-border)]"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span
                    key={j}
                    className={`text-lg ${
                      j < t.puntuacion
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-border)]"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-ink)]/70">
                &ldquo;{t.texto}&rdquo;
              </p>
              <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
                {t.autor}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
