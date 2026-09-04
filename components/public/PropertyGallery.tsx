"use client";

import Image from "next/image";
import { useState } from "react";

interface PropertyGalleryProps {
  fotos: string[];
  nombre: string;
}

export default function PropertyGallery({
  fotos,
  nombre,
}: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fotoPrincipal =
    fotos.length > 0
      ? fotos[selectedIndex]
      : "https://picsum.photos/seed/cabana-default/1200/800";

  if (fotos.length === 0) {
    return (
      <div className="space-y-4">
        {/* Imagen principal */}
        <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]/20">
          <img
            src={fotoPrincipal}
            alt={nombre}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]/20">
        <img
          src={fotoPrincipal}
          alt={`${nombre} - foto ${selectedIndex + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        
        {/* Indicador de foto actual */}
        <div className="absolute bottom-4 right-4 rounded-[var(--radius-md)] bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
          {selectedIndex + 1} / {fotos.length}
        </div>
      </div>

      {/* Miniaturas */}
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {fotos.map((foto, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-all ${
                selectedIndex === index
                  ? "border-[var(--color-accent)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
              }`}
              aria-label={`Ver foto ${index + 1}`}
            >
              <img
                src={foto}
                alt={`Miniatura ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
