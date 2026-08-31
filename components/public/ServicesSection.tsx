interface ServicesSectionProps {
  servicios: string[];
}

const ICONOS: Record<string, string> = {
  "WiFi gratuito": "📶",
  Pileta: "🏊",
  Parrilla: "🔥",
  Estacionamiento: "🚗",
  "Ropa de cama": "🛏️",
  "Aire acondicionado": "❄️",
  "Pet friendly": "🐾",
  Calefacción: "♨️",
  "Smart TV": "📺",
  "Cocina equipada": "🍳",
};

export default function ServicesSection({ servicios }: ServicesSectionProps) {
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-[var(--radius-lg)] bg-white/40 ring-1 ring-[var(--color-border)] p-8 md:p-10">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted-dark)]">
              Servicios
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              Todo lo que necesitás
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {servicios.map((servicio) => (
              <div
                key={servicio}
                className="flex items-center gap-2 rounded-[var(--radius-md)] bg-white px-5 py-3 ring-1 ring-[var(--color-border)] shadow-sm"
              >
                <span className="text-xl">{ICONOS[servicio] || "✨"}</span>
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {servicio}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
