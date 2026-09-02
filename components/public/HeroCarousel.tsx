"use client";

import { useState } from "react";
import { COMPLEJO } from "@/lib/config";

interface HeroCarouselProps {
  imagenes: { url: string; alt: string }[];
}

export default function HeroCarousel({ imagenes }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const imagenesValidas =
    imagenes.length > 0
      ? imagenes
      : [{ url: "https://picsum.photos/seed/ermitazh-hero/1920/1200", alt: "Cabañas Ermitazh" }];

  function goTo(index: number) {
    if (index < 0) setCurrentIndex(imagenesValidas.length - 1);
    else if (index >= imagenesValidas.length) setCurrentIndex(0);
    else setCurrentIndex(index);
  }

  return (
    <section className="relative min-h-[100dvh] flex items-end pt-32 pb-16 md:pb-24 overflow-hidden">
      {imagenesValidas.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: `url(${img.url})`,
            opacity: i === currentIndex ? 1 : 0,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)]/70 via-[var(--color-ink)]/20 to-transparent" />

      <button
        onClick={() => goTo(currentIndex - 1)}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label="Imagen anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <button
        onClick={() => goTo(currentIndex + 1)}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label="Imagen siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            {COMPLEJO.tagline}
          </p>
          <h1 className="text-balance text-4xl leading-[1.1] font-semibold tracking-tight text-white md:text-6xl lg:text-7xl">
            Desconectá para reconectarte
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
            Cabañas rodeadas de bosque, donde el silencio y el paisaje te
            invitan a dejar el mundo atrás.
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {imagenesValidas.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentIndex
                ? "bg-white w-6"
                : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Ir a imagen ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
