import Link from "next/link";

function GradientOverlay() {
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-dark-pine/70 via-dark-pine/20 to-transparent" />
  );
}

export default function Home() {
  return (
    <>
      {/* ───── HERO ───── */}
      <section className="relative min-h-[100dvh] flex items-end pt-32 pb-16 md:pb-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://picsum.photos/seed/ermitazh-hero/1920/1200)",
          }}
        />
        <GradientOverlay />
        <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-champagne-pink/80">
              Refugio en la naturaleza
            </p>
            <h1 className="text-balance text-4xl leading-[1.1] font-semibold tracking-tight text-white md:text-6xl lg:text-7xl">
              Desconectá para
              reconectarte
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Cabañas rodeadas de bosque, donde el silencio y el paisaje te
              invitan a dejar el mundo atrás.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/"
                className="rounded-btn bg-toasted-brown px-7 py-3.5 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
              >
                Reservá tu estadía
              </Link>
              <Link
                href="/"
                className="rounded-btn border border-white/25 px-7 py-3.5 text-sm font-medium text-white/90 transition-all hover:border-white/50 hover:text-white active:scale-[0.97]"
              >
                Ver galería
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── INTRO ───── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-sage">
              Bienvenidos
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-dark-pine md:text-4xl">
              Un lugar para volver a respirar
            </h2>
            <p className="mt-5 text-base leading-relaxed text-dark-pine/60">
              A solo diez minutos de San Rafael, Ermitazh es un refugio
              diseñado para el descanso. Cada cabaña está integrada al
              paisaje, con vista al monte, materiales naturales y el confort
              que merecés.
            </p>
          </div>
        </div>
      </section>

      {/* ───── CABINS ───── */}
      <section className="bg-surface pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-dark-pine md:text-4xl">
              Nuestras cabañas
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cabins.map((cabin) => (
              <article
                key={cabin.title}
                className="group flex flex-col overflow-hidden rounded-card bg-white shadow-sm ring-1 ring-desert-sand/20 transition-all hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={cabin.image}
                    alt={cabin.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-dark-pine">
                    {cabin.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-dark-pine/60">
                    {cabin.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-lg font-semibold text-toasted-brown">
                      {cabin.price}
                    </span>
                    <Link
                      href="/"
                      className="rounded-btn bg-toasted-brown px-4 py-2 text-xs font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───── AMENITIES ───── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-dark-pine md:text-4xl">
              Todo lo que necesitás
            </h2>
            <p className="mt-4 text-base text-dark-pine/60">
              Cada detalle pensado para tu confort.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {amenities.map((item) => (
              <div
                key={item.label}
                className="rounded-card bg-surface p-6 text-center ring-1 ring-desert-sand/15"
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 font-semibold text-dark-pine">
                  {item.label}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-dark-pine/50">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── GALLERY ───── */}
      <section className="bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-dark-pine md:text-4xl">
              Galería
            </h2>
            <p className="mt-4 text-base text-dark-pine/60">
              Un vistazo a la experiencia Ermitazh.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((img, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-card ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
              >
                <img
                  src={img}
                  alt={`Galería Ermitazh ${i + 1}`}
                  className="h-full w-full object-cover aspect-[4/3] sm:aspect-auto sm:h-full transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://picsum.photos/seed/ermitazh-cta/1920/800)",
          }}
        />
        <div className="absolute inset-0 bg-dark-pine/75" />
        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Listo para escapar?
          </h2>
          <p className="mt-4 text-white/70">
            Consultá disponibilidad y reservá tu cabaña en segundos.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-btn bg-toasted-brown px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
          >
            Consultar disponibilidad
          </Link>
        </div>
      </section>
    </>
  );
}

const cabins = [
  {
    title: "Cabaña Arrayán",
    description:
      "Para dos personas, con vista al lago, hogar a leña y deck privado. Ideal para una escapada romántica.",
    price: "$85.000 / noche",
    image: "https://picsum.photos/seed/cabin-arrayan/800/600",
  },
  {
    title: "Cabaña Cedro",
    description:
      "Espaciosa cabaña para hasta cuatro huéspedes, con cocina completa y terraza con parrilla.",
    price: "$120.000 / noche",
    image: "https://picsum.photos/seed/cabin-cedro/800/600",
  },
  {
    title: "Cabaña Ñire",
    description:
      "Nuestra cabaña más grande, con capacidad para seis personas, hidromasaje y chimenea.",
    price: "$160.000 / noche",
    image: "https://picsum.photos/seed/cabin-nire/800/600",
  },
];

const amenities = [
  { icon: "🔥", label: "Hogar a leña", desc: "Calor de fuego real en cada cabaña" },
  { icon: "🛁", label: "Hidromasaje", desc: "Bañera de hidromasaje con vista al bosque" },
  { icon: "📶", label: "WiFi", desc: "Conexión estable para cuando necesites" },
  { icon: "🚗", label: "Estacionamiento", desc: "Cochera privada cubierta" },
  { icon: "🍳", label: "Cocina equipada", desc: "Vajilla completa y electrodomésticos" },
  { icon: "🏔️", label: "Senderos", desc: "Trekking y caminatas guiadas" },
  { icon: "🔥", label: "Parrilla", desc: "Área de asado en cada cabaña" },
  { icon: "🧘", label: "Yoga al aire libre", desc: "Clases guiadas por la mañana" },
];

const gallery = [
  "https://picsum.photos/seed/ermitazh-gallery-1/900/900",
  "https://picsum.photos/seed/ermitazh-gallery-2/600/600",
  "https://picsum.photos/seed/ermitazh-gallery-3/600/600",
  "https://picsum.photos/seed/ermitazh-gallery-4/600/400",
  "https://picsum.photos/seed/ermitazh-gallery-5/600/400",
  "https://picsum.photos/seed/ermitazh-gallery-6/600/400",
  "https://picsum.photos/seed/ermitazh-gallery-7/600/400",
];
