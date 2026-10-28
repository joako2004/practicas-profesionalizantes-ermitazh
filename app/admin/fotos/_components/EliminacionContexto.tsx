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

type TipoAvisoPanel = "exito" | "error";

type AvisoPanel = MensajePostEliminacion & { tipo?: TipoAvisoPanel };

interface ValorEliminacion {
  ocupado: boolean;
  setOcupado: (ocupado: boolean) => void;
  aviso: AvisoPanel | null;
  publicarAviso: (mensaje: MensajePostEliminacion) => void;
  publicarAvisoPortada: (texto: string, tipo: TipoAvisoPanel) => void;
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
  const [aviso, setAviso] = useState<AvisoPanel | null>(null);

  const publicarAviso = useCallback((mensaje: MensajePostEliminacion) => {
    setAviso(mensaje);
  }, []);

  const publicarAvisoPortada = useCallback(
    (texto: string, tipo: TipoAvisoPanel) => {
      setAviso({ texto, tipo });
    },
    []
  );

  const limpiarAviso = useCallback(() => {
    setAviso(null);
  }, []);

  const valor = useMemo<ValorEliminacion>(
    () => ({
      ocupado,
      setOcupado,
      aviso,
      publicarAviso,
      publicarAvisoPortada,
      limpiarAviso,
    }),
    [ocupado, aviso, publicarAviso, publicarAvisoPortada, limpiarAviso]
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

  const esError = aviso?.tipo === "error";
  const esExito = aviso?.tipo === "exito";

  return (
    <div aria-live="polite" className="empty:hidden">
      {aviso && (
        <div
          className={`rounded-[var(--radius-md)] border px-4 py-3 ${
            esError
              ? "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]"
              : esExito
                ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p
              className={`text-sm font-medium ${
                esError ? "text-[var(--color-danger)]" : "text-[var(--color-ink)]"
              }`}
            >
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
