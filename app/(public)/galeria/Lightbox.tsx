"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import type { FotoGaleria } from "@/lib/galeria";

interface LightboxProps {
  fotos: FotoGaleria[];
  indice: number;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

function LightboxContent({ fotos, indice, onClose, onNavigate }: LightboxProps) {
  const foto = fotos[indice];
  const touchStartX = useRef<number | null>(null);
  const hayVarias = fotos.length > 1;

  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onNavigate("prev");
          break;
        case "ArrowRight":
          e.preventDefault();
          onNavigate("next");
          break;
        default:
          break;
      }
    },
    [onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    [fotos[indice - 1], fotos[indice + 1]].forEach((adyacente) => {
      if (!adyacente) return;
      const img = new window.Image();
      img.src = adyacente.url;
    });
  }, [indice, fotos]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        onNavigate(diff > 0 ? "next" : "prev");
      }
      touchStartX.current = null;
    },
    [onNavigate]
  );

  return (
    <div
      className="fixed inset-0 z-[100] bg-[var(--color-ink)]/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${fotos.length}: ${foto.album}`}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className="pointer-events-none absolute left-4 top-4 z-20 rounded-full bg-black/40 px-3 py-1 text-sm font-medium tabular-nums text-white/90 md:left-6 md:top-6">
        {indice + 1} / {fotos.length}
      </span>

      <button
        type="button"
        onClick={onClose}
        autoFocus
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 md:right-6 md:top-6"
        aria-label="Cerrar visor"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {hayVarias && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("prev");
            }}
            className="absolute left-3 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 md:flex md:left-6"
            aria-label="Foto anterior"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("next");
            }}
            className="absolute right-3 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95 md:flex md:right-6"
            aria-label="Foto siguiente"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 pb-20 md:p-16 md:pb-24">
        <div className="relative h-full w-full">
          <Image
            src={foto.url}
            alt={foto.alt}
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 px-4 text-center text-sm font-medium text-white/90">
        {foto.album}
      </p>
    </div>
  );
}

export default function Lightbox(props: LightboxProps) {
  if (typeof window === "undefined") return null;
  return createPortal(<LightboxContent {...props} />, document.body);
}
