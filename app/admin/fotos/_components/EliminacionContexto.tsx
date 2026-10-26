"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MensajePostEliminacion } from "@/lib/fotos/eliminacion";

interface ValorEliminacion {
  ocupado: boolean;
  setOcupado: (ocupado: boolean) => void;
  aviso: MensajePostEliminacion | null;
  publicarAviso: (mensaje: MensajePostEliminacion) => void;
  limpiarAviso: () => void;
}

const ContextoEliminacion = createContext<ValorEliminacion | null>(null);

/**
 * Envuelve la grilla de fotos y el cartel de resultado.
 *
 * El aviso vive acá y no dentro del botón porque, al eliminarse una foto, la
 * grilla se vuelve a renderizar sin ella y el botón se desmonta.
 */
export function ProveedorEliminacion({
  children,
}: {
  children: ReactNode;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<MensajePostEliminacion | null>(null);

  const publicarAviso = useCallback((mensaje: MensajePostEliminacion) => {
    setAviso(mensaje);
  }, []);

  const limpiarAviso = useCallback(() => {
    setAviso(null);
  }, []);

  const valor = useMemo<ValorEliminacion>(
    () => ({
      ocupado,
      setOcupado,
      aviso,
      publicarAviso,
      limpiarAviso,
    }),
    [ocupado, aviso, publicarAviso, limpiarAviso]
  );

  return (
    <ContextoEliminacion.Provider value={valor}>
      {children}
    </ContextoEliminacion.Provider>
  );
}

export function useEliminacion(): ValorEliminacion {
  const valor = useContext(ContextoEliminacion);

  if (valor === null) {
    throw new Error(
      "useEliminacion debe usarse dentro de <ProveedorEliminacion>."
    );
  }

  return valor;
}

/**
 * Cartel con el resultado real de eliminarFoto.
 *
 * El contenedor aria-live se mantiene montado para que el lector de pantalla
 * anuncie el mensaje cuando aparece.
 */
export function AvisoEliminacion() {
  const { aviso, limpiarAviso } = useEliminacion();

  return (
    <div aria-live="polite" className="empty:hidden">
      {aviso && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {aviso.texto}
            </p>
            <button
              type="button"
              onClick={limpiarAviso}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]/70 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              Cerrar
            </button>
          </div>

          {aviso.advertencia && (
            <p className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-sm text-[var(--color-ink)]">
              {aviso.advertencia}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
