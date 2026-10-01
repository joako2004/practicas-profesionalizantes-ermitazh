interface GallerySectionProps {
  imagenes: { url: string; alt: string }[];
}

export default function GallerySection({ imagenes }: GallerySectionProps) {
  if (imagenes.length === 0) return null;

  return (
    <section className="bg-[var(--color-surface)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Galería
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
            Un vistazo a la experiencia Ermitazh
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imagenes.map((img, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-[var(--radius-lg)] ${
                i === 0 ? "sm:col-span-2 sm:row-span-2" : ""
              }`}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="h-full w-full object-cover aspect-[4/3] sm:aspect-auto sm:h-full transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
