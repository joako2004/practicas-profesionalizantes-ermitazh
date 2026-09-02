import CabinCard from "./CabinCard";
import { CABANAS } from "@/lib/cabanas-data";

export default function CabinsSection() {
  const ordenadas = [...CABANAS].sort((a, b) => a.capacidad - b.capacidad);

  return (
    <section id="cabanas" className="bg-[var(--color-surface)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl overflow-hidden px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted-dark)]">
            Nuestras cabañas
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Elegí la que más te guste
          </h2>
          <p className="mt-4 text-base text-[var(--color-ink)]/60">
            Cada cabaña tiene su propia personalidad, pero todas comparten la
            misma esencia: naturaleza, confort y calidez.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ordenadas.map((cabana) => (
            <CabinCard key={cabana.id} {...cabana} />
          ))}
        </div>
      </div>
    </section>
  );
}
