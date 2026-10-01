import { COMPLEJO } from "@/lib/config";

interface CtaSectionProps {
  imagenFondo?: string;
}

export default function CtaSection({ imagenFondo }: CtaSectionProps) {
  const bgImage =
    imagenFondo || "https://picsum.photos/seed/ermitazh-cta/1920/800";

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-[var(--color-ink)]/75" />
      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
          ¿Listo para escapar?
        </h2>
        <p className="mt-4 text-white/70">
          Consultá disponibilidad y reservá tu cabaña en segundos.
        </p>
        <a
          href="#buscador"
          className="mt-8 inline-block rounded-[var(--radius-md)] bg-[var(--color-accent)] px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
        >
          Consultar disponibilidad
        </a>
      </div>
    </section>
  );
}
