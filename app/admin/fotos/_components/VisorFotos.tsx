"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as EventoMouseReact,
  type ReactNode,
  type TouchEvent as EventoTouchReact,
} from "react";
import { createPortal } from "react-dom";

import {
  decidirDeslizamiento,
  indiceAnterior,
  indiceSiguiente,
  indiceValido,
  textoPosicion,
} from "@/lib/fotos/visor";

interface ValorVisor {
  abrir: (indice: number) => void;
}

const ContextoVisor = createContext<ValorVisor | null>(null);

interface ProveedorVisorProps {
  fotos: { url: string }[];
  nombreCabana: string;
  children: ReactNode;
}

export function ProveedorVisor({
  fotos,
  nombreCabana,
  children,
}: ProveedorVisorProps) {
  const [indiceAbierto, setIndiceAbierto] = useState<number | null>(null);

  const abrir = useCallback((indice: number) => {
    setIndiceAbierto(indice);
  }, []);

  const cerrar = useCallback(() => {
    setIndiceAbierto(null);
  }, []);

  const cambiar = useCallback((indice: number) => {
    setIndiceAbierto(indice);
  }, []);

  const valor = useMemo<ValorVisor>(() => ({ abrir }), [abrir]);

  // Si un refresco de datos deja el índice fuera de rango, el visor deja de
  // renderizarse y sus efectos (scroll y foco) se limpian al desmontarse.
  const indiceVisible =
    indiceAbierto !== null && indiceValido(indiceAbierto, fotos.length)
      ? indiceAbierto
      : null;

  return (
    <ContextoVisor.Provider value={valor}>
      {children}
      {indiceVisible !== null && (
        <VisorPortal
          fotos={fotos}
          indice={indiceVisible}
          nombreCabana={nombreCabana}
          onCerrar={cerrar}
          onCambiar={cambiar}
        />
      )}
    </ContextoVisor.Provider>
  );
}

export function useVisor(): ValorVisor {
  const valor = useContext(ContextoVisor);

  if (valor === null) {
    throw new Error("useVisor debe usarse dentro de <ProveedorVisor>.");
  }

  return valor;
}

interface VisorProps {
  fotos: { url: string }[];
  indice: number;
  nombreCabana: string;
  onCerrar: () => void;
  onCambiar: (indice: number) => void;
}

function VisorPortal(props: VisorProps) {
  if (typeof document === "undefined") return null;

  return createPortal(<VisorAbierto {...props} />, document.body);
}

function VisorAbierto({
  fotos,
  indice,
  nombreCabana,
  onCerrar,
  onCambiar,
}: VisorProps) {
  const total = fotos.length;
  const urlActual = fotos[indice].url;

  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const botonCerrarRef = useRef<HTMLButtonElement | null>(null);
  const elementoPrevioRef = useRef<HTMLElement | null>(null);
  const inicioToqueRef = useRef<{ x: number; y: number } | null>(null);

  const irAnterior = useCallback(() => {
    const anterior = indiceAnterior(indice, total);

    if (anterior !== null) onCambiar(anterior);
  }, [indice, total, onCambiar]);

  const irSiguiente = useCallback(() => {
    const siguiente = indiceSiguiente(indice, total);

    if (siguiente !== null) onCambiar(siguiente);
  }, [indice, total, onCambiar]);

  // Guarda el foco de origen, lleva el foco al botón de cierre y lo devuelve
  // al desmontarse el visor.
  useEffect(() => {
    elementoPrevioRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    botonCerrarRef.current?.focus();

    return () => {
      elementoPrevioRef.current?.focus();
    };
  }, []);

  // Evita que la página de fondo haga scroll mientras el visor está abierto.
  useEffect(() => {
    document.body.classList.add("overflow-hidden");

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  useEffect(() => {
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onCerrar();
        return;
      }

      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        irAnterior();
        return;
      }

      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        irSiguiente();
        return;
      }

      if (evento.key !== "Tab") return;

      const controles = contenedorRef.current
        ? Array.from(
            contenedorRef.current.querySelectorAll<HTMLButtonElement>(
              "button:not([disabled])"
            )
          )
        : [];

      if (controles.length === 0) {
        evento.preventDefault();
        return;
      }

      const primero = controles[0];
      const ultimo = controles[controles.length - 1];
      const activo = document.activeElement;

      if (!contenedorRef.current?.contains(activo)) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primero).focus();
        return;
      }

      if (evento.shiftKey && activo === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", manejarTecla);

    return () => document.removeEventListener("keydown", manejarTecla);
  }, [irAnterior, irSiguiente, onCerrar]);

  const manejarClicFondo = (evento: EventoMouseReact<HTMLDivElement>) => {
    if (evento.target === evento.currentTarget) onCerrar();
  };

  const manejarInicioToque = (evento: EventoTouchReact<HTMLDivElement>) => {
    const toque = evento.touches[0];

    if (!toque) return;

    inicioToqueRef.current = { x: toque.clientX, y: toque.clientY };
  };

  const manejarFinToque = (evento: EventoTouchReact<HTMLDivElement>) => {
    const inicio = inicioToqueRef.current;
    inicioToqueRef.current = null;

    if (!inicio) return;

    const toque = evento.changedTouches[0];

    if (!toque) return;

    const direccion = decidirDeslizamiento(
      toque.clientX - inicio.x,
      toque.clientY - inicio.y
    );

    if (direccion === "anterior") irAnterior();
    if (direccion === "siguiente") irSiguiente();
  };

  const anterior = indiceAnterior(indice, total);
  const siguiente = indiceSiguiente(indice, total);

  return (
    <div
      ref={contenedorRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total} de ${nombreCabana}`}
      className="fixed inset-0 z-[110] bg-black/90"
      onTouchStart={manejarInicioToque}
      onTouchEnd={manejarFinToque}
    >
      <button
        ref={botonCerrarRef}
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar visor"
        className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-surface)]/30 bg-[var(--color-surface)]/15 text-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-surface)] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:bg-[var(--color-surface)]/35 sm:right-6 sm:top-6"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-6 w-6"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div
        className="flex h-full w-full items-center justify-center px-4 py-20 sm:px-20"
        onClick={manejarClicFondo}
      >
        <ImagenVisor
          key={`${indice}-${urlActual}`}
          url={urlActual}
          alt={`Foto ${indice + 1} de ${nombreCabana}`}
        />
      </div>

      {anterior !== null && (
        <button
          type="button"
          onClick={irAnterior}
          aria-label="Foto anterior"
          className="absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-surface)]/30 bg-[var(--color-surface)]/15 text-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-surface)] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:bg-[var(--color-surface)]/35 sm:left-6"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-6 w-6"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}

      {siguiente !== null && (
        <button
          type="button"
          onClick={irSiguiente}
          aria-label="Foto siguiente"
          className="absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-surface)]/30 bg-[var(--color-surface)]/15 text-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-surface)] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:bg-[var(--color-surface)]/35 sm:right-6"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-6 w-6"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 flex flex-wrap items-center justify-center gap-2 px-4">
        <span className="rounded-[var(--radius-sm)] bg-[var(--color-surface)]/15 px-3 py-1 text-sm font-medium tabular-nums text-[var(--color-surface)]">
          {textoPosicion(indice, total)}
        </span>

        {indice === 0 && (
          <span className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-1 text-sm font-semibold text-white">
            Portada
          </span>
        )}
      </div>
    </div>
  );
}

function ImagenVisor({ url, alt }: { url: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <p className="max-w-sm text-center text-sm font-medium text-[var(--color-surface)]">
        No se pudo cargar la foto.
      </p>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- La URL viene de la base y puede no estar permitida en next.config.ts. */}
      <img
        src={url}
        alt={alt}
        className="max-h-[85vh] max-w-[95vw] object-contain"
        onError={() => setError(true)}
      />
    </>
  );
}
