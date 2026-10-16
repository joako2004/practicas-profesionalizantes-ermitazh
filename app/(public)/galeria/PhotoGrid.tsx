"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { FotoGaleria } from "@/lib/galeria";
import Lightbox from "./Lightbox";

interface PhotoGridProps {
  fotos: FotoGaleria[];
  variante?: "album" | "densa";
}

const CLASES_GRILLA = {
  album: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4",
  densa:
    "grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 md:grid-cols-5 md:gap-3 lg:grid-cols-6",
};

const SIZES = {
  album: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  densa: "(max-width: 420px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw",
};

export default function PhotoGrid({ fotos, variante = "album" }: PhotoGridProps) {
  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(0);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const abrir = useCallback((i: number, el: HTMLElement) => {
    triggerRef.current = el;
    setIndice(i);
    setAbierto(true);
    document.body.style.overflow = "hidden";
  }, []);

  const cerrar = useCallback(() => {
    setAbierto(false);
    document.body.style.overflow = "";
    triggerRef.current?.focus();
  }, []);

  const navegar = useCallback(
    (direction: "prev" | "next") => {
      if (fotos.length <= 1) return;
      setIndice(
        (prev) =>
          (prev + (direction === "next" ? 1 : -1) + fotos.length) % fotos.length
      );
    },
    [fotos.length]
  );

  const eagerCount = variante === "album" ? 4 : 0;

  return (
    <>
      <ul className={CLASES_GRILLA[variante]}>
        {fotos.map((foto, i) => (
          <li key={`${foto.url}-${i}`} className="relative aspect-[4/3]">
            <button
              type="button"
              onClick={(e) => abrir(i, e.currentTarget)}
              className="group absolute inset-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-warm)]/30 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
              aria-label={`Ampliar ${foto.alt}`}
            >
              <Image
                src={foto.url}
                alt={foto.alt}
                fill
                sizes={SIZES[variante]}
                loading={i < eagerCount ? "eager" : "lazy"}
                className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {abierto && fotos.length > 0 && (
        <Lightbox
          fotos={fotos}
          indice={indice}
          onClose={cerrar}
          onNavigate={navegar}
        />
      )}
    </>
  );
}
