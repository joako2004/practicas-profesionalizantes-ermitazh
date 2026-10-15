"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { SeccionGaleria, FotoConMetadatos, PHOTOS_PER_PAGE, asignarTamanosBento } from "@/lib/galeria";
import Lightbox from "./Lightbox";

interface Filtro {
  id: string;
  titulo: string;
  cantidad: number;
}

interface GalleryClientProps {
  secciones: SeccionGaleria[];
  filtros: Filtro[];
  filtroInicial: string;
  fotosIniciales: FotoConMetadatos[];
}

export default function GalleryClient({ secciones, filtros, filtroInicial, fotosIniciales }: GalleryClientProps) {
  const [activeFilter, setActiveFilter] = useState<string>(filtroInicial);
  const [displayedPhotos, setDisplayedPhotos] = useState<FotoConMetadatos[]>(fotosIniciales);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    currentIndex: number;
    fotos: FotoConMetadatos[];
    triggerElement: HTMLElement | null;
  }>({
    isOpen: false,
    currentIndex: 0,
    fotos: [],
    triggerElement: null,
  });
  const filterButtonsRef = useRef<HTMLButtonElement[]>([]);
  const photoButtonsRef = useRef<HTMLButtonElement[]>([]);

  const allPhotosForFilter = useMemo(() => {
    if (activeFilter === "todas") {
      const todas: FotoConMetadatos[] = [];
      for (const seccion of secciones) {
        todas.push(...seccion.fotos);
      }
      const vistas = new Set<string>();
      return todas.filter((foto) => {
        if (vistas.has(foto.url)) return false;
        vistas.add(foto.url);
        return true;
      });
    }
    const seccion = secciones.find((s) => s.id === activeFilter);
    return seccion?.fotos || [];
  }, [activeFilter, secciones]);

  const photosWithSizes = useMemo(() => asignarTamanosBento(displayedPhotos), [displayedPhotos]);

  const updateUrl = useCallback((filterId: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (filterId === "todas") {
      url.searchParams.delete("cabana");
    } else {
      url.searchParams.set("cabana", filterId);
    }
    window.history.replaceState(null, "", url.toString());
  }, []);

  const handleFilterChange = useCallback((filterId: string) => {
    const isValidFilter = filterId === "todas" || filtros.some((f) => f.id === filterId);
    if (!isValidFilter) return;
    setActiveFilter(filterId);
    const fotosFiltradas = filterId === "todas"
      ? fotosIniciales
      : secciones.find((s) => s.id === filterId)?.fotos || [];
    setDisplayedPhotos(fotosFiltradas.slice(0, PHOTOS_PER_PAGE));
    updateUrl(filterId);
  }, [secciones, filtros, fotosIniciales, updateUrl]);

  const loadMore = useCallback(() => {
    const allFotos = activeFilter === "todas"
      ? fotosIniciales
      : secciones.find((s) => s.id === activeFilter)?.fotos || [];
    const nextCount = displayedPhotos.length + PHOTOS_PER_PAGE;
    setDisplayedPhotos(allFotos.slice(0, nextCount));
  }, [activeFilter, displayedPhotos.length, secciones, fotosIniciales]);

  const hasMore = displayedPhotos.length < allPhotosForFilter.length;

  const openLightbox = useCallback((index: number, trigger: HTMLElement) => {
    setLightbox({
      isOpen: true,
      currentIndex: index,
      fotos: allPhotosForFilter,
      triggerElement: trigger,
    });
    document.body.style.overflow = "hidden";
  }, [allPhotosForFilter]);

  const closeLightbox = useCallback(() => {
    if (lightbox.triggerElement) {
      lightbox.triggerElement.focus();
    }
    setLightbox((prev) => ({ ...prev, isOpen: false }));
    document.body.style.overflow = "";
  }, [lightbox.triggerElement]);

  const navigateLightbox = useCallback((direction: "prev" | "next") => {
    setLightbox((prev) => {
      if (!prev.isOpen || prev.fotos.length <= 1) return prev;
      const newIndex =
        direction === "prev"
          ? (prev.currentIndex - 1 + prev.fotos.length) % prev.fotos.length
          : (prev.currentIndex + 1) % prev.fotos.length;
      return { ...prev, currentIndex: newIndex };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!lightbox.isOpen) return;

      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigateLightbox("prev");
          break;
        case "ArrowRight":
          e.preventDefault();
          navigateLightbox("next");
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightbox.isOpen, closeLightbox, navigateLightbox]);

  const scrollToActiveFilter = useCallback(() => {
    const activeButton = filterButtonsRef.current.find(
      (btn) => btn.getAttribute("aria-selected") === "true"
    );
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  useEffect(() => {
    scrollToActiveFilter();
  }, [activeFilter, scrollToActiveFilter]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6">
        <nav
          className="mb-8 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide"
          aria-label="Filtros de galería"
          role="tablist"
        >
          <div className="flex flex-wrap sm:flex-nowrap gap-2 min-w-max" style={{ scrollSnapType: "x mandatory" }}>
            {filtros.map((filtro, idx) => (
              <button
                key={filtro.id}
                ref={(el) => { if (el) filterButtonsRef.current[idx] = el; }}
                onClick={() => handleFilterChange(filtro.id)}
                role="tab"
                aria-selected={activeFilter === filtro.id}
                aria-controls={`panel-${filtro.id}`}
                id={`tab-${filtro.id}`}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all shrink-0 snap-start ${
                  activeFilter === filtro.id
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "bg-[var(--color-surface)] text-[var(--color-ink)]/70 hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
                }`}
              >
                {filtro.titulo}
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  {filtro.cantidad}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div
          id={`panel-${activeFilter}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeFilter}`}
          className="animate-fade-in"
        >
          {photosWithSizes.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-ink)]/50">
              <p>No hay fotos disponibles en esta sección.</p>
            </div>
          ) : (
            <>
              <div
                className="grid gap-4 md:gap-[16px]"
                style={{
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gridAutoRows: "150px",
                  gridAutoFlow: "dense",
                }}
                role="list"
                aria-label={`${filtros.find((f) => f.id === activeFilter)?.titulo} - galería`}
              >
                {photosWithSizes.map((foto, index) => (
                  <button
                    key={foto.url}
                    ref={(el) => { if (el) photoButtonsRef.current[index] = el; }}
                    onClick={() => openLightbox(index, photoButtonsRef.current[index]!)}
                    className={`group relative overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] ${
                      foto.w2 ? "md:col-span-2" : ""
                    } ${foto.h2 ? "md:row-span-2" : ""}`}
                    style={{
                      gridColumn: foto.w2 ? "span 2" : "span 1",
                      gridRow: foto.h2 ? "span 2" : "span 1",
                    }}
                    aria-label={`Ver ${foto.alt} en pantalla completa`}
                  >
                    <Image
                      src={foto.url}
                      alt={foto.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 transition-opacity duration-300"
                      loading={index < 4 ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-[var(--color-warm)]/30 animate-pulse" aria-hidden="true" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                      <span className="block text-white text-sm font-medium truncate md:text-base">
                        {foto.seccion}
                      </span>
                      <span className="hidden md:block text-white/80 text-xs truncate">
                        {foto.alt}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.97]"
                  >
                    Ver más fotos
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M19 12H5" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {lightbox.isOpen && lightbox.fotos.length > 0 && (
        <Lightbox
          currentIndex={lightbox.currentIndex}
          fotos={lightbox.fotos}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
          triggerElement={lightbox.triggerElement}
        />
      )}
    </>
  );
}