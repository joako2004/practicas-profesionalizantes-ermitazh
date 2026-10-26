"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { eliminarFoto } from "@/lib/actions/fotos";
import {
  construirAvisoConfirmacion,
  mensajeResultadoEliminacion,
} from "@/lib/fotos/eliminacion";

import { useEliminacion } from "./EliminacionContexto";

const MENSAJE_ERROR_INESPERADO =
  "Ocurrió un error inesperado. Probá de nuevo.";

interface BotonEliminarFotoProps {
  propiedadId: string;
  url: string;
  posicion: number;
  total: number;
  etiquetas: {
    compartidaCon: string[];
    enGaleriaExteriores: boolean;
    fijaEnElSitio: boolean;
    externa: boolean;
  };
}

export default function BotonEliminarFoto({
  propiedadId,
  url,
  posicion,
  total,
  etiquetas,
}: BotonEliminarFotoProps) {
  const router = useRouter();
  const { ocupado, setOcupado, publicarAviso } = useEliminacion();

  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelarRef = useRef<HTMLButtonElement | null>(null);
  const estabaAbierto = useRef(false);

  const idBase = useId();
  const idTitulo = `${idBase}-titulo`;
  const idDescripcion = `${idBase}-descripcion`;

  const esPortada = posicion === 0;
  const esUltima = total === 1;
  const aviso = construirAvisoConfirmacion({
    esPortada,
    esUltima,
    etiquetas,
  });
  const avisoFuerte = aviso.severidad === "fuerte";

  // El foco inicial va a Cancelar para que un Enter accidental no elimine.
  // Al cerrar la capa, el foco vuelve al botón que la abrió.
  useEffect(() => {
    if (confirmando) {
      estabaAbierto.current = true;
      cancelarRef.current?.focus();
      return;
    }

    if (estabaAbierto.current) {
      estabaAbierto.current = false;
      triggerRef.current?.focus();
    }
  }, [confirmando]);

  useEffect(() => {
    if (!confirmando) return;

    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape" || eliminando) return;

      setConfirmando(false);
      setError(null);
    };

    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [confirmando, eliminando]);

  const abrirConfirmacion = () => {
    if (ocupado) return;

    setError(null);
    setConfirmando(true);
  };

  const cancelar = () => {
    if (eliminando) return;

    setConfirmando(false);
    setError(null);
  };

  const confirmar = async () => {
    if (eliminando || ocupado) return;

    setEliminando(true);
    setOcupado(true);
    setError(null);

    try {
      const respuesta = await eliminarFoto(propiedadId, url);

      if (!respuesta.success) {
        setError(respuesta.error);
        return;
      }

      publicarAviso(mensajeResultadoEliminacion(respuesta));
      setOcupado(false);
      router.refresh();
    } catch {
      // No se muestran detalles internos (tokens, paths ni mensajes del SDK).
      setError(MENSAJE_ERROR_INESPERADO);
    } finally {
      setOcupado(false);
      setEliminando(false);
    }
  };

  const etiquetaConfirmar = eliminando
    ? "Eliminando…"
    : error
      ? "Reintentar"
      : "Sí, eliminar";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={abrirConfirmacion}
        disabled={ocupado || confirmando}
        aria-label={`Eliminar la foto ${posicion + 1}`}
        className={`absolute right-2 z-10 inline-flex min-h-7 items-center rounded-[var(--radius-sm)] border border-[var(--color-danger-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-danger)] shadow-sm transition-colors hover:bg-[var(--color-danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${
          esPortada ? "top-10" : "top-2"
        }`}
      >
        Eliminar
      </button>

      {confirmando && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={idTitulo}
          aria-describedby={idDescripcion}
          className={`absolute inset-0 z-20 flex flex-col gap-2 overflow-y-auto border bg-[var(--color-surface)] p-3 ${
            avisoFuerte
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-border)]"
          }`}
        >
          <h3
            id={idTitulo}
            className={`text-sm font-semibold ${
              avisoFuerte
                ? "text-[var(--color-danger)]"
                : "text-[var(--color-ink)]"
            }`}
          >
            {aviso.titulo}
          </h3>

          <div
            id={idDescripcion}
            className="space-y-1 text-xs leading-relaxed text-[var(--color-ink)]/75"
          >
            {aviso.lineas.map((linea, indice) => (
              <p key={indice}>{linea}</p>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-medium text-[var(--color-danger)]"
            >
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <button
              ref={cancelarRef}
              type="button"
              onClick={cancelar}
              disabled={eliminando}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]/75 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmar}
              disabled={eliminando || ocupado}
              className="rounded-[var(--radius-sm)] bg-[var(--color-danger)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {etiquetaConfirmar}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
