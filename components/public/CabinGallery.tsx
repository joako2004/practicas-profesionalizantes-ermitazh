"use client";

import { useState } from "react";

interface CabinGalleryProps {
  fotos: string[];
  nombre: string;
}

export default function CabinGallery({ fotos, nombre }: CabinGalleryProps) {
  const [offset, setOffset] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const total = fotos.length;

  if (total === 0) {
    return (
      <div className="mb-10 aspect-[21/9] rounded-[var(--radius-lg)] bg-[var(--color-warm)]/30" />
    );
  }

  if (total <= 3) {
    return (
      <div className="mb-10 grid h-[260px] grid-cols-3 gap-2 sm:h-[340px]">
        {fotos.map((url, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[var(--radius-lg)]">
            <img src={url} alt={`${nombre} — foto ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="card-photo-overlay absolute inset-0" />
          </div>
        ))}
      </div>
    );
  }

  const prev = () => setOffset((o) => (o - 3 + total) % total);
  const next = () => setOffset((o) => (o + 3) % total);

  const visible = [0, 1, 2].map((i) => (offset + i) % total);

  return (
    <div className="relative mb-10">
      <div className="flex h-[260px] gap-2 sm:h-[340px]">
        {visible.map((idx) => (
          <div
            key={`${offset}-${idx}`}
            className="group relative overflow-hidden rounded-[var(--radius-lg)] transition-[flex] duration-500 ease-[var(--ease-out-expo)]"
            style={{ flex: hovered === idx ? "2 1 0%" : "1 1 0%" }}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
          >
            <img
              src={fotos[idx]}
              alt={`${nombre} — foto ${idx + 1} de ${total}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="card-photo-overlay absolute inset-0" />
            <span className="absolute bottom-3 left-3 rounded-[var(--radius-sm)] bg-white/90 px-2.5 py-1 text-xs font-medium text-[var(--color-ink)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {idx + 1} / {total}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-ink)] shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95"
        aria-label="Anteriores"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-ink)] shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95"
        aria-label="Siguientes"
      >
        ›
      </button>
    </div>
  );
}
