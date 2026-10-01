import { COMPLEJO } from "@/lib/config";

export default function WelcomeSection() {
  const stats = [
    { value: `${COMPLEJO.estadisticas.cabanas}`, label: "Cabañas" },
    { value: `${COMPLEJO.estadisticas.metrosCuadradosParque.toLocaleString()} m²`, label: "de parque" },
    { value: `${COMPLEJO.estadisticas.reservaDirecta}%`, label: "reserva directa" },
  ];

  return (
    <section id="bienvenidos" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted-dark)]">
            Bienvenidos
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Un lugar para volver a respirar
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--color-ink)]/60">
            A solo diez minutos de San Rafael, Ermitazh es un refugio
            diseñado para el descanso. Cada cabaña está integrada al
            paisaje, con vista al monte, materiales naturales y el confort
            que merecés.
          </p>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]/60">
            Rodeados de árboles nativos y con acceso al río, te ofrecemos una
            experiencia única de conexión con la naturaleza sin renunciar a
            las comodidades de hoy.
          </p>
        </div>

        <div className="mt-12 flex justify-center gap-12 md:gap-20">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-semibold text-[var(--color-accent)] md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink)]/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
