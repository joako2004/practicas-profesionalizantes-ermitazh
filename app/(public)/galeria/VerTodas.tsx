"use client";

import { useId, useState } from "react";
import type { FotoGaleria } from "@/lib/galeria";
import PhotoGrid from "./PhotoGrid";

interface VerTodasProps {
  fotos: FotoGaleria[];
}

export default function VerTodas({ fotos }: VerTodasProps) {
  const [abierto, setAbierto] = useState(false);
  const panelId = useId();

  return (
    <div className="mt-14 md:mt-20">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setAbierto((prev) => !prev)}
          aria-expanded={abierto}
          aria-controls={panelId}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        >
          {abierto ? "Ocultar fotos" : "Ver todas las fotos"}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-300 ${abierto ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {abierto && (
        <div id={panelId} className="mt-8 animate-fade-in md:mt-10">
          <PhotoGrid fotos={fotos} variante="densa" />
        </div>
      )}
    </div>
  );
}
