"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COMPLEJO, IMAGENES_HERO_FALLBACK } from "@/lib/config";

const INTERVALO_MS = 4000;

interface HeroCarouselProps {
  imagenes: { url: string; alt: string }[];
}

export default function HeroCarousel({ imagenes }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preReservaHref, setPreReservaHref] = useState<string>("/pre-reserva");

  const imagenesValidas =
    imagenes.length > 0 ? imagenes : IMAGENES_HERO_FALLBACK;

  useEffect(() => {
    async function checkAuth() {
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setPreReservaHref(!!session ? "/pre-reserva" : "/login?next=%2Fpre-reserva");
    }
    checkAuth();
  }, [imagenes]);

  return (
    <section className="relative min-h-[100dvh] flex items-end pt-32 pb-28 md:pb-24 overflow-hidden">
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
          <Link
            href={preReservaHref}
            className="mt-8 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Ver disponibilidad
          </Link>
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