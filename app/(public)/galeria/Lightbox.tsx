"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { FotoConMetadatos } from "@/lib/galeria";

interface LightboxProps {
  currentIndex: number;
  fotos: FotoConMetadatos[];
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  triggerElement: HTMLElement | null;
}

function LightboxContent({ currentIndex, fotos, onClose, onNavigate, triggerElement }: LightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const thumbnailRefs = useRef<HTMLButtonElement[]>([]);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerElement) {
      triggerElement.focus();
    }
  }, [triggerElement]);

  // Preload adjacent images
  useEffect(() => {
    if (fotos[currentIndex + 1]) {
      const img = new window.Image();
      img.src = fotos[currentIndex + 1].url;
    }
    if (fotos[currentIndex - 1]) {
      const img = new window.Image();
      img.src = fotos[currentIndex - 1].url;
    }
  }, [currentIndex, fotos]);

  const centerThumbnail = useCallback(() => {
    const activeThumb = thumbnailRefs.current[currentIndex];
    if (activeThumb && thumbnailContainerRef.current) {
      const container = thumbnailContainerRef.current;
      const thumbLeft = activeThumb.offsetLeft;
      const thumbWidth = activeThumb.offsetWidth;
      const containerWidth = container.clientWidth;
      container.scrollTo({
        left: thumbLeft - (containerWidth - thumbWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    centerThumbnail();
  }, [currentIndex, centerThumbnail]);

  const handleKeyDown = useCallback((e: globalThis.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
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
  }, [onClose, onNavigate]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      onNavigate(diff > 0 ? "next" : "prev");
    }
    setTouchStart(null);
  }, [touchStart, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de imagen ${currentIndex + 1} de ${fotos.length}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Cerrar visor"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <button
        onClick={() => onNavigate("prev")}
        disabled={fotos.length <= 1}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Imagen anterior"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={() => onNavigate("next")}
        disabled={fotos.length <= 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Imagen siguiente"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="relative w-[min(92vw,1200px)] h-[75vh] max-h-[75vh]">
        <Image
          src={fotos[currentIndex].url}
          alt={fotos[currentIndex].alt}
          fill
          priority
          className="object-contain"
          sizes="90vw"
        />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-white/80 pb-24 w-full max-w-[min(92vw,1200px)]">
        <div className="flex items-center gap-4 w-full justify-center">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {fotos.length}
          </span>
        </div>

        <div
          ref={thumbnailContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 w-full"
          role="tablist"
          aria-label="Miniaturas"
        >
          {fotos.map((foto, idx) => (
            <button
              key={foto.url}
              ref={(el) => { if (el) thumbnailRefs.current[idx] = el; }}
              onClick={() => onNavigate(idx > currentIndex ? "next" : "prev")}
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Ir a imagen ${idx + 1}`}
              className={`flex-shrink-0 w-[64px] h-[48px] rounded-[var(--radius-sm)] overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-[var(--color-accent)] opacity-100"
                  : "border-transparent opacity-50 hover:opacity-75"
              }`}
              style={{ width: "64px", height: "48px", flexShrink: 0 }}
            >
              <Image
                src={foto.url}
                alt=""
                width={64}
                height={48}
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>
  );
}

export default function Lightbox(props: LightboxProps) {
  if (typeof window === "undefined") return null;
  return createPortal(<LightboxContent {...props} />, document.body);
}