"use client";

import { useState } from "react";

interface AccordionGalleryProps {
  fotos: string[];
  nombre: string;
}

export default function AccordionGallery({ fotos, nombre }: AccordionGalleryProps) {
  const [active, setActive] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="mb-10 aspect-[21/9] rounded-[var(--radius-lg)] bg-[var(--color-warm)]/30" />
    );
  }

  if (fotos.length === 1) {
    return (
      <div className="mb-10 overflow-hidden rounded-[var(--radius-lg)]">
        <div className="card-photo relative">
          <img
            src={fotos[0]}
            alt={`Foto de ${nombre}`}
            className="h-full w-full object-cover"
          />
          <div className="card-photo-overlay absolute inset-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 flex h-[280px] gap-2 sm:h-[340px]">
      {fotos.map((url, i) => (
        <div
          key={i}
          onMouseEnter={() => setActive(i)}
          onClick={() => setActive(i)}
          className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-lg)] transition-[flex] duration-500 ease-[var(--ease-out-expo)]"
          style={{
            flex: active === i ? "5 1 0%" : "1 1 0%",
          }}
        >
          <img
            src={url}
            alt={`Foto ${i + 1} de ${nombre}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="card-photo-overlay absolute inset-0" />

          <span className="absolute bottom-3 left-3 rounded-[var(--radius-sm)] bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--color-ink)] opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
            {i + 1} / {fotos.length}
          </span>
        </div>
      ))}
    </div>
  );
}
