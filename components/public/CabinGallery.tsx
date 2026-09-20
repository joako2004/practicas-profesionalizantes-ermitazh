"use client";

import { useState } from "react";

interface CabinGalleryProps {
  fotos: string[];
  nombre: string;
}

export default function CabinGallery({ fotos, nombre }: CabinGalleryProps) {
  const [current, setCurrent] = useState(0);
  const total = fotos.length;

  if (total === 0) {
    return (
      <div className="mb-10 aspect-[21/9] rounded-[var(--radius-lg)] bg-[var(--color-warm)]/30" />
    );
  }

  if (total === 1) {
    return (
      <div className="mb-10 overflow-hidden rounded-[var(--radius-lg)]">
        <div className="card-photo relative">
          <img src={fotos[0]} alt={`Foto de ${nombre}`} className="h-full w-full object-cover" />
          <div className="card-photo-overlay absolute inset-0" />
        </div>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const idx = (offset: number) => (current + offset + total) % total;

  return (
    <div className="relative mb-10">
      <div className="flex h-[260px] gap-2 sm:h-[340px]">
        {/* Left */}
        <div
          className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-lg)] transition-all duration-500 ease-[var(--ease-out-expo)]"
          style={{ flex: "1 1 0%" }}
          onMouseEnter={() => setCurrent(idx(-1))}
          onClick={() => setCurrent(idx(-1))}
        >
          <img
            src={fotos[idx(-1)]}
            alt={`${nombre} — foto anterior`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
        </div>

        {/* Center */}
        <div
          className="group relative overflow-hidden rounded-[var(--radius-lg)] transition-all duration-500 ease-[var(--ease-out-expo)]"
          style={{ flex: "2 1 0%" }}
        >
          <img
            src={fotos[current]}
            alt={`${nombre} — foto ${current + 1} de ${total}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="card-photo-overlay absolute inset-0" />
          <span className="absolute bottom-3 left-3 rounded-[var(--radius-sm)] bg-white/90 px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
            {current + 1} / {total}
          </span>
        </div>

        {/* Right */}
        <div
          className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-lg)] transition-all duration-500 ease-[var(--ease-out-expo)]"
          style={{ flex: "1 1 0%" }}
          onMouseEnter={() => setCurrent(idx(1))}
          onClick={() => setCurrent(idx(1))}
        >
          <img
            src={fotos[idx(1)]}
            alt={`${nombre} — foto siguiente`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
        </div>
      </div>

      {/* Arrows */}
      {total > 3 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-ink)] shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95"
            aria-label="Foto anterior"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-ink)] shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95"
            aria-label="Foto siguiente"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
